/**
 * Server-side validation, rate-limiting, and financial integrity helpers
 */

// ==================== LOGIN RATE LIMITER & ACCOUNT LOCKOUT ====================
interface LoginAttemptRecord {
  attempts: number[];
}

const ipUserAttempts = new Map<string, LoginAttemptRecord>();
const accountAttempts = new Map<string, LoginAttemptRecord>();

// IP + Username: 5 attempts per 15 minutes
const MAX_IP_USER_ATTEMPTS = 5;
const IP_USER_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Account / Username Level: 15 attempts per 60 minutes across any IP
const MAX_ACCOUNT_ATTEMPTS = 15;
const ACCOUNT_WINDOW_MS = 60 * 60 * 1000; // 60 minutes

export function checkLoginRateLimit(ip: string, username: string): {
  allowed: boolean;
  isAccountLockout?: boolean;
  retryAfterSeconds?: number;
  attemptsLeft?: number;
  message?: string;
} {
  const cleanIp = ip || 'unknown';
  const cleanUser = (username || '').trim().toLowerCase();
  const now = Date.now();

  // Check 1: Account-level lockout (protects against IP-rotating attacks)
  if (cleanUser) {
    const accRecord = accountAttempts.get(cleanUser);
    if (accRecord) {
      const activeAccAttempts = accRecord.attempts.filter(t => now - t < ACCOUNT_WINDOW_MS);
      accRecord.attempts = activeAccAttempts;

      if (activeAccAttempts.length >= MAX_ACCOUNT_ATTEMPTS) {
        const oldest = activeAccAttempts[0];
        const retryAfterSeconds = Math.max(1, Math.ceil((ACCOUNT_WINDOW_MS - (now - oldest)) / 1000));
        return {
          allowed: false,
          isAccountLockout: true,
          retryAfterSeconds,
          message: 'Account locked due to excessive failed attempts across all networks. Please try again in 1 hour.'
        };
      }
    }
  }

  // Check 2: IP + Username level rate limit
  const ipKey = `${cleanIp}:${cleanUser}`;
  const ipRecord = ipUserAttempts.get(ipKey);

  if (!ipRecord) {
    return { allowed: true, attemptsLeft: MAX_IP_USER_ATTEMPTS };
  }

  const activeIpAttempts = ipRecord.attempts.filter(t => now - t < IP_USER_WINDOW_MS);
  ipRecord.attempts = activeIpAttempts;

  if (activeIpAttempts.length >= MAX_IP_USER_ATTEMPTS) {
    const oldest = activeIpAttempts[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((IP_USER_WINDOW_MS - (now - oldest)) / 1000));
    return {
      allowed: false,
      isAccountLockout: false,
      retryAfterSeconds,
      message: 'Too many login attempts from this network. Please try again after 15 minutes.'
    };
  }

  return { allowed: true, attemptsLeft: MAX_IP_USER_ATTEMPTS - activeIpAttempts.length };
}

export function recordFailedLogin(ip: string, username: string): { isNowLocked: boolean } {
  const cleanIp = ip || 'unknown';
  const cleanUser = (username || '').trim().toLowerCase();
  const ipKey = `${cleanIp}:${cleanUser}`;
  const now = Date.now();

  // Record IP+User attempt
  const ipRecord = ipUserAttempts.get(ipKey) || { attempts: [] };
  ipRecord.attempts = ipRecord.attempts.filter(t => now - t < IP_USER_WINDOW_MS);
  ipRecord.attempts.push(now);
  ipUserAttempts.set(ipKey, ipRecord);

  // Record Account-level attempt
  let isNowLocked = false;
  if (cleanUser) {
    const accRecord = accountAttempts.get(cleanUser) || { attempts: [] };
    accRecord.attempts = accRecord.attempts.filter(t => now - t < ACCOUNT_WINDOW_MS);
    accRecord.attempts.push(now);
    accountAttempts.set(cleanUser, accRecord);
    if (accRecord.attempts.length >= MAX_ACCOUNT_ATTEMPTS) {
      isNowLocked = true;
    }
  }

  return { isNowLocked };
}

export function clearLoginAttempts(ip: string, username: string): void {
  const cleanIp = ip || 'unknown';
  const cleanUser = (username || '').trim().toLowerCase();
  const ipKey = `${cleanIp}:${cleanUser}`;
  ipUserAttempts.delete(ipKey);
  if (cleanUser) {
    accountAttempts.delete(cleanUser);
  }
}

// ==================== FINANCIAL VALIDATION ====================
export interface FinancialValidationResult {
  valid: boolean;
  errors: string[];
  sanitized: {
    quoteAmount: number;
    depositAmount: number;
    additionalPayment: number;
    finalPayment: number;
    refundAmount: number;
    originalAmount?: number;
    exchangeRate?: number;
    totalPaid: number;
    isOverpayment: boolean;
  };
}

function parseNonNegativeNumber(val: any, fieldName: string, errors: string[], defaultValue: number = 0): number {
  if (val === undefined || val === null || val === '') {
    return defaultValue;
  }
  const num = Number(val);
  if (isNaN(num)) {
    errors.push(`${fieldName} must be a valid numeric value.`);
    return defaultValue;
  }
  if (num < 0) {
    errors.push(`${fieldName} cannot be negative (received ${num}).`);
    return defaultValue;
  }
  if (!isFinite(num)) {
    errors.push(`${fieldName} must be a finite number.`);
    return defaultValue;
  }
  return Math.round(num * 100) / 100;
}

export function validateFinancialFields(body: any): FinancialValidationResult {
  const errors: string[] = [];

  const quoteAmount = parseNonNegativeNumber(body.quoteAmount, 'Quote Amount', errors, 0);
  const depositAmount = parseNonNegativeNumber(body.depositAmount, 'Deposit Amount', errors, 0);
  const additionalPayment = parseNonNegativeNumber(body.additionalPayment, 'Additional Payment', errors, 0);
  const finalPayment = parseNonNegativeNumber(body.finalPayment, 'Final Payment', errors, 0);
  const refundAmount = parseNonNegativeNumber(body.refundAmount, 'Refund Amount', errors, 0);

  let originalAmount: number | undefined = undefined;
  if (body.originalAmount !== undefined && body.originalAmount !== null && body.originalAmount !== '') {
    originalAmount = parseNonNegativeNumber(body.originalAmount, 'Original Amount', errors, 0);
  }

  let exchangeRate: number | undefined = undefined;
  if (body.exchangeRate !== undefined && body.exchangeRate !== null && body.exchangeRate !== '') {
    const rate = Number(body.exchangeRate);
    if (isNaN(rate) || rate <= 0 || !isFinite(rate)) {
      errors.push('Exchange rate must be a positive non-zero number.');
    } else {
      exchangeRate = Math.round(rate * 10000) / 10000;
    }
  }

  const totalCollected = Math.round((depositAmount + additionalPayment + finalPayment) * 100) / 100;

  // Validate that refund does not exceed total money collected
  if (refundAmount > totalCollected) {
    errors.push(
      `Refund amount (GH₵${refundAmount.toFixed(2)}) cannot exceed total payments collected (GH₵${totalCollected.toFixed(2)}).`
    );
  }

  const totalPaid = Math.max(0, Math.round((totalCollected - refundAmount) * 100) / 100);
  const isOverpayment = quoteAmount > 0 && totalPaid > quoteAmount;

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      quoteAmount,
      depositAmount,
      additionalPayment,
      finalPayment,
      refundAmount,
      originalAmount,
      exchangeRate,
      totalPaid,
      isOverpayment
    }
  };
}

// ==================== MANUAL CURRENCY DEVIATION ====================
export function checkRateDeviation(manualRate: number, liveRate: number): { isFlagged: boolean; deviationPercent: number; warning?: string } {
  if (!liveRate || liveRate <= 0 || !manualRate || manualRate <= 0) {
    return { isFlagged: false, deviationPercent: 0 };
  }

  const deviation = Math.abs(manualRate - liveRate) / liveRate;
  const deviationPercent = Math.round(deviation * 100);

  if (deviation > 0.20) { // Greater than 20% deviation threshold
    return {
      isFlagged: true,
      deviationPercent,
      warning: `Manual rate (${manualRate}) deviates by ${deviationPercent}% from the live market reference rate (${liveRate.toFixed(4)} GHS).`
    };
  }

  return { isFlagged: false, deviationPercent };
}
