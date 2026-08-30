export interface LiveRateResult {
  success: boolean;
  baseCurrency: string;
  targetCurrency: 'GHS';
  rate: number;
  lastUpdated: string;
  provider: string;
  isLive: boolean;
  error?: string;
}

export interface SupportedCurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: SupportedCurrencyConfig[] = [
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' }
];

// In-memory cache for live rates to prevent redundant calls and respect rate limits
interface CachedRate {
  rate: number;
  lastUpdated: string;
  provider: string;
  timestamp: number;
}

const rateCache = new Map<string, CachedRate>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

/**
 * Fetch live exchange rate from base currency to GHS (Ghanaian Cedi).
 * Returns live rate if external provider is available.
 * Returns failure with clean error if provider is offline or unreachable.
 */
export async function getLiveRateToGHS(baseCurrency: string): Promise<LiveRateResult> {
  const base = baseCurrency.toUpperCase().trim();

  // 1 GHS = 1 GHS always
  if (base === 'GHS') {
    return {
      success: true,
      baseCurrency: 'GHS',
      targetCurrency: 'GHS',
      rate: 1.0,
      lastUpdated: new Date().toISOString(),
      provider: 'Bank of Ghana (Parity)',
      isLive: true
    };
  }

  // Check in-memory cache
  const cached = rateCache.get(base);
  const now = Date.now();
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return {
      success: true,
      baseCurrency: base,
      targetCurrency: 'GHS',
      rate: cached.rate,
      lastUpdated: cached.lastUpdated,
      provider: cached.provider,
      isLive: true
    };
  }

  // Attempt external rate fetch with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const url = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`
      : `https://open.er-api.com/v6/latest/${base}`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Exchange provider HTTP status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.rates && typeof data.rates['GHS'] === 'number') {
      const ghsRate = Number(data.rates['GHS']);
      if (isNaN(ghsRate) || ghsRate <= 0) {
        throw new Error('Invalid rate value received from provider');
      }

      const lastUpdated = data.time_last_update_utc || new Date().toISOString();
      const providerName = apiKey ? 'ExchangeRate-API Pro' : 'Open Exchange Rates (Live Mid-Market)';

      rateCache.set(base, {
        rate: ghsRate,
        lastUpdated,
        provider: providerName,
        timestamp: now
      });

      return {
        success: true,
        baseCurrency: base,
        targetCurrency: 'GHS',
        rate: ghsRate,
        lastUpdated,
        provider: providerName,
        isLive: true
      };
    } else {
      throw new Error('GHS target rate not present in provider response');
    }
  } catch (err: any) {
    console.warn(`[CurrencyService] Live rate fetch failed for ${base} -> GHS:`, err.message || err);

    // If we have an expired cache entry, we do NOT pretend it's fresh live; we report unavailable.
    return {
      success: false,
      baseCurrency: base,
      targetCurrency: 'GHS',
      rate: 0,
      lastUpdated: new Date().toISOString(),
      provider: 'Unavailable',
      isLive: false,
      error: 'Exchange rate service is currently unavailable. Please retry or enter a manual exchange rate.'
    };
  }
}

/**
 * Fetch a summary of live rates for all supported currencies into GHS
 */
export async function getAllRatesToGHS(): Promise<{
  rates: Record<string, { rate: number; isLive: boolean; lastUpdated: string; provider: string; error?: string }>;
}> {
  const result: Record<string, any> = {};

  for (const curr of SUPPORTED_CURRENCIES) {
    const rateInfo = await getLiveRateToGHS(curr.code);
    result[curr.code] = {
      rate: rateInfo.rate,
      isLive: rateInfo.isLive,
      lastUpdated: rateInfo.lastUpdated,
      provider: rateInfo.provider,
      error: rateInfo.error
    };
  }

  return { rates: result };
}

/**
 * Precise currency arithmetic avoiding float rounding anomalies.
 * Operates in integer minor units (pesewas).
 */
export function calculateGHSConversion(
  amount: number,
  rate: number
): { ghsAmount: number; pesewas: number } {
  const safeAmount = Number(amount) || 0;
  const safeRate = Number(rate) || 0;

  // Calculate in pesewas (integer minor units)
  const pesewas = Math.round(safeAmount * safeRate * 100);
  const ghsAmount = pesewas / 100;

  return { ghsAmount, pesewas };
}
