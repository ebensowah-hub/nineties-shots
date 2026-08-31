/**
 * Server-side validation, rate-limiting, and financial integrity helpers
 */

// ==================== LOGIN RATE LIMITER ====================
interface LoginAttemptRecord {
  attempts: number[];
}

const loginAttempts = new Map<string, LoginAttemptRecord>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(ip: string, username: string): { allowed: boolean; retryAfterSeconds?: number; attemptsLeft?: number } {
  const cleanIp = ip || 'unknown';
  const cleanUser = (username || '').trim().toLowerCase();
  const key = `${cleanIp}:${cleanUser}`;

  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    return { allowed: true, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  }

  // Filter out expired attempts outside 15-minute window
  const activeAttempts = record.attempts.filter(t => now - t < LOGIN_WINDOW_MS);
  record.attempts = activeAttempts;

  if (activeAttempts.length >= MAX_LOGIN_ATTEMPTS) {
    const oldest = activeAttempts[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((LOGIN_WINDOW_MS - (now - oldest)) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, attemptsLeft: MAX_LOGIN_ATTEMPTS - activeAttempts.length };
}

export function recordFailedLogin(ip: string, username: string): void {
  const cleanIp = ip || 'unknown';
  const cleanUser = (username || '').trim().toLowerCase();
  const key = `${cleanIp}:${cleanUser}`;

  const now = Date.now();
  const record = loginAttempts.get(key) || { attempts: [] };
  record.attempts = record.attempts.filter(t => now - t < LOGIN_WINDOW_MS);
  record.attempts.push(now);
  loginAttempts.set(key, record);
}

export function clearLoginAttempts(ip: string, username: string): void {
  const cleanIp = ip || 'unknown';
  const cleanUser = (username || '').trim().toLowerCase();
  const key = `${cleanIp}:${cleanUser}`;
  loginAttempts.delete(key);
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
