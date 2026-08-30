import { SupportedCurrency, CurrencyConversionRecord } from '../types';

export const DEFAULT_CURRENCY = 'GHS';
export const DEFAULT_CURRENCY_SYMBOL = 'GH₵';
export const DEFAULT_LOCALE = 'en-GH';

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  example: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', example: 'GH₵1,500' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', example: '$500' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', example: '£400' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', example: '€450' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', example: '₦750,000' }
];

export function getCurrencyConfig(code: string = 'GHS'): CurrencyConfig {
  const upper = code.toUpperCase();
  return (
    SUPPORTED_CURRENCIES.find(c => c.code === upper) || {
      code: upper,
      name: upper,
      symbol: upper,
      flag: '🌐',
      example: `${upper} 100`
    }
  );
}

/**
 * Format a GHS amount with exact canonical Ghanaian Cedi formatting: GH₵1,250.00
 */
export function formatGHS(amount: number | undefined | null, includeDecimals: boolean = true): string {
  const safe = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `GH₵${safe.toLocaleString('en-US', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Format any currency amount cleanly with its proper symbol and ISO code
 */
export function formatCurrency(
  amount: number | undefined | null,
  currency: string = 'GHS',
  includeDecimals: boolean = true
): string {
  const safe = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const curr = currency.toUpperCase();

  if (curr === 'GHS') {
    return formatGHS(safe, includeDecimals);
  }

  const cfg = getCurrencyConfig(curr);
  const formattedNumber = safe.toLocaleString('en-US', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2
  });

  return `${cfg.symbol}${formattedNumber} (${curr})`;
}

/**
 * Format original currency along with the canonical business GHS value
 * Example: "$500.00 USD (GH₵7,600.00)"
 */
export function formatDualPrice(
  originalAmount: number | undefined,
  originalCurrency: string | undefined,
  ghsAmount: number
): { original: string; business: string; combined: string } {
  const business = formatGHS(ghsAmount);
  if (!originalCurrency || originalCurrency.toUpperCase() === 'GHS' || !originalAmount) {
    return { original: business, business, combined: business };
  }

  const original = formatCurrency(originalAmount, originalCurrency);
  return {
    original,
    business,
    combined: `${original} → ${business}`
  };
}

/**
 * Precise currency multiplication avoiding binary floating point rounding errors.
 * Computes in integer minor units (pesewas).
 */
export function convertToGHSWithRate(amount: number, rate: number): number {
  const numAmount = Number(amount) || 0;
  const numRate = Number(rate) || 0;
  const pesewas = Math.round(numAmount * numRate * 100);
  return pesewas / 100;
}

export function calculateGHSConversion(amount: number, rate: number): { ghsAmount: number; pesewas: number } {
  const numAmount = Number(amount) || 0;
  const numRate = Number(rate) || 0;
  const pesewas = Math.round(numAmount * numRate * 100);
  return {
    ghsAmount: pesewas / 100,
    pesewas
  };
}
