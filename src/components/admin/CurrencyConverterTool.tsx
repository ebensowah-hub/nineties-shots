import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
  Edit3,
  Globe,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import {
  SUPPORTED_CURRENCIES,
  formatGHS,
  formatCurrency,
  getCurrencyConfig,
  convertToGHSWithRate
} from '../../lib/currency';
import {
  getExchangeRates,
  convertCurrencyAdmin,
  getConversionHistory,
  clearConversionHistory
} from '../../lib/api';
import { CurrencyConversionRecord } from '../../types';

interface CurrencyConverterToolProps {
  onConversionSuccess?: (conversion: CurrencyConversionRecord) => void;
  compact?: boolean;
}

export const CurrencyConverterTool: React.FC<CurrencyConverterToolProps> = ({
  onConversionSuccess,
  compact = false
}) => {
  // Input states
  const [amount, setAmount] = useState<string>('500');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [isManualRate, setIsManualRate] = useState<boolean>(false);
  const [manualRateInput, setManualRateInput] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Live rates status
  const [liveRates, setLiveRates] = useState<Record<string, any>>({});
  const [loadingRates, setLoadingRates] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Conversion execution
  const [converting, setConverting] = useState<boolean>(false);
  const [latestConversion, setLatestConversion] = useState<CurrencyConversionRecord | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<CurrencyConversionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch rates on mount
  useEffect(() => {
    fetchRates();
    loadHistory();
  }, []);

  const fetchRates = async () => {
    try {
      setLoadingRates(true);
      setRateError(null);
      const data = await getExchangeRates();
      setLiveRates(data.rates || {});
    } catch (err: any) {
      console.warn('Could not load live rates:', err);
      setRateError('Exchange rate service unavailable. You may retry or use a manual exchange rate.');
    } finally {
      setLoadingRates(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const items = await getConversionHistory();
      setHistory(items || []);
    } catch (err) {
      console.warn('Could not load conversion history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear recent conversion history?')) return;
    try {
      await clearConversionHistory();
      setHistory([]);
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  const currentRateInfo = liveRates[fromCurrency];
  const isParity = fromCurrency === 'GHS';

  const handleConvert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setConversionError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setConversionError('Please enter a valid positive amount.');
      return;
    }

    let manualRateVal: number | undefined = undefined;
    if (isManualRate && !isParity) {
      const numRate = parseFloat(manualRateInput);
      if (isNaN(numRate) || numRate <= 0) {
        setConversionError('Please enter a valid positive manual exchange rate (e.g., 15.25).');
        return;
      }
      manualRateVal = numRate;
    }

    try {
      setConverting(true);
      const res = await convertCurrencyAdmin(
        numAmount,
        fromCurrency,
        manualRateVal,
        note.trim() || undefined
      );

      setLatestConversion(res.conversion);
      if (onConversionSuccess) {
        onConversionSuccess(res.conversion);
      }
      // Refresh history
      loadHistory();
    } catch (err: any) {
      setConversionError(err.message || 'Exchange rate unavailable. Please enter a manual rate or retry.');
    } finally {
      setConverting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`space-y-8 ${compact ? '' : 'max-w-4xl'}`}>
      {/* Tool Header (if not compact) */}
      {!compact && (
        <div className="border-b border-neutral-900 pb-4">
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono mb-1 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-neutral-300" />
            <span>FINANCIAL OPERATIONS // CANONICAL CURRENCY: GH₵ (GHS)</span>
          </div>
          <h2 className="text-xl font-heading uppercase text-white tracking-wide">
            Currency & Exchange Rate Engine
          </h2>
          <p className="text-xs text-neutral-400 font-light mt-1">
            NINETIES SHOTS operates canonically in Ghanaian Cedi (GH₵). Convert international client quotes (USD, GBP, EUR, NGN) to GHS using live mid-market rates or authorized manual rate overrides.
          </p>
        </div>
      )}

      {/* Main Converter Card */}
      <div className="bg-neutral-950 border border-neutral-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-mono uppercase font-bold text-white tracking-wider">
              Admin Currency Converter
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchRates}
              disabled={loadingRates}
              className="text-[11px] font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh live exchange rates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRates ? 'animate-spin' : ''}`} />
              <span>{loadingRates ? 'Fetching rates...' : 'Sync Live Rates'}</span>
            </button>
          </div>
        </div>

        {/* Live Rates Banner / Offline Alert */}
        {rateError && !isParity && (
          <div className="p-3.5 bg-amber-950/30 border border-amber-800/80 text-amber-200 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Exchange rate unavailable: External provider is currently unreachable.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchRates}
                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-amber-700/60 text-amber-100 text-[10px] uppercase tracking-wider"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => setIsManualRate(true)}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[10px] uppercase tracking-wider font-bold"
              >
                Enter Manual Rate
              </button>
            </div>
          </div>
        )}

        {/* Converter Form */}
        <form onSubmit={handleConvert} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Input Amount */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                Amount to Convert *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="500"
                  className="w-full bg-neutral-900 border border-neutral-800 p-3 text-white text-sm font-mono focus:border-white focus:outline-none transition-colors"
                />
                <span className="absolute right-3 top-3 text-xs font-mono text-neutral-500">
                  {getCurrencyConfig(fromCurrency).symbol}
                </span>
              </div>
            </div>

            {/* From Currency Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                From Currency *
              </label>
              <select
                value={fromCurrency}
                onChange={e => {
                  setFromCurrency(e.target.value);
                  if (e.target.value === 'GHS') {
                    setIsManualRate(false);
                  }
                }}
                className="w-full bg-neutral-900 border border-neutral-800 p-3 text-white text-xs font-mono focus:border-white focus:outline-none transition-colors cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.flag} {curr.code} — {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Currency (GHS Fixed) */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                Target Business Currency
              </label>
              <div className="w-full bg-neutral-900/60 border border-neutral-800/80 p-3 text-neutral-300 text-xs font-mono flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-white">
                  <span>🇬🇭</span>
                  <span>GHS — Ghanaian Cedi</span>
                </span>
                <span className="text-[10px] uppercase px-2 py-0.5 bg-neutral-800 text-neutral-300 font-mono">
                  GH₵ (Canonical)
                </span>
              </div>
            </div>
          </div>

          {/* Rate Mode Toggle & Status */}
          <div className="p-4 bg-neutral-900/40 border border-neutral-900 rounded-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-neutral-400 text-[10px] uppercase">Rate Mode:</span>
                <button
                  type="button"
                  disabled={isParity}
                  onClick={() => setIsManualRate(false)}
                  className={`px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                    !isManualRate
                      ? 'bg-white text-black font-bold'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  Live Market Rate
                </button>
                <button
                  type="button"
                  disabled={isParity}
                  onClick={() => setIsManualRate(true)}
                  className={`px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                    isManualRate
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  Manual Rate Override
                </button>
              </div>

              {/* Current Active Rate Display */}
              <div className="text-[11px] text-neutral-300 font-mono flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                {isParity ? (
                  <span className="text-emerald-400">1 GHS = GH₵1.00 (Parity)</span>
                ) : isManualRate ? (
                  <span className="text-amber-300 font-bold">Manual Rate Mode Active</span>
                ) : currentRateInfo?.isLive ? (
                  <span>
                    1 {fromCurrency} = <strong className="text-white">GH₵{currentRateInfo.rate.toFixed(2)}</strong>
                    <span className="text-neutral-500 text-[10px] ml-1">
                      (Updated: {new Date(currentRateInfo.lastUpdated).toLocaleDateString()})
                    </span>
                  </span>
                ) : (
                  <span className="text-neutral-500">Live rate fetching...</span>
                )}
              </div>
            </div>

            {/* Manual Rate Input Form */}
            {isManualRate && !isParity && (
              <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-amber-400 flex items-center gap-1 font-bold">
                    <Edit3 className="w-3 h-3" />
                    <span>Specify Manual Exchange Rate (1 {fromCurrency} = ? GH₵) *</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={manualRateInput}
                    onChange={e => setManualRateInput(e.target.value)}
                    placeholder={currentRateInfo?.rate ? currentRateInfo.rate.toFixed(2) : '15.20'}
                    className="w-full bg-neutral-900 border border-amber-800/60 p-2.5 text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="text-[10px] font-mono text-neutral-400">
                  <span className="text-amber-300 block mb-0.5 font-bold">Admin Override Notice</span>
                  This conversion will be permanently labeled as <strong>Manual exchange rate</strong> in financial records and audit logs.
                </div>
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
              Conversion Context / Client Reference (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Editorial quote for London agency campaign"
              className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white text-xs font-mono"
            />
          </div>

          {/* Action Button & Error */}
          {conversionError && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{conversionError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-mono text-neutral-500">
              * Converted values calculate with minor-unit (pesewas) precision.
            </span>

            <button
              type="submit"
              disabled={converting}
              className="px-6 py-3 bg-white hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>{converting ? 'Calculating...' : 'Convert to GHS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Latest Conversion Result Display Card */}
        {latestConversion && (
          <div className="mt-6 p-5 bg-neutral-900 border-2 border-white/20 text-white space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono uppercase font-bold tracking-wider">
                  Conversion Result Confirmed
                </span>
              </div>
              <span
                className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border ${
                  latestConversion.rateType === 'manual'
                    ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                    : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                }`}
              >
                {latestConversion.rateType === 'manual' ? 'Manual exchange rate' : 'Live mid-market rate'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase block">Original Price</span>
                <p className="text-base font-bold text-white">
                  {latestConversion.originalCurrency} {latestConversion.originalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase block">Canonical Business Value</span>
                <p className="text-xl font-heading font-bold text-emerald-400">
                  {formatGHS(latestConversion.convertedAmount)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase block">Exchange Rate Used</span>
                <p className="text-xs text-neutral-200">
                  1 {latestConversion.originalCurrency} = GH₵{latestConversion.exchangeRate.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase block">Timestamp / Provider</span>
                <p className="text-[10px] text-neutral-400 truncate">
                  {new Date(latestConversion.convertedAt).toLocaleTimeString()} • {latestConversion.provider}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Supported Currencies Quick-Reference Matrix */}
      <div className="bg-neutral-950 border border-neutral-900 p-6 space-y-4">
        <h3 className="text-xs font-mono uppercase font-bold text-white tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-neutral-400" />
          <span>Live Exchange Rates (Base → Ghanaian Cedi)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {SUPPORTED_CURRENCIES.filter(c => c.code !== 'GHS').map(curr => {
            const info = liveRates[curr.code];
            return (
              <div
                key={curr.code}
                className="p-3.5 bg-neutral-900/60 border border-neutral-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>{curr.flag}</span>
                    <span className="font-bold text-white">{curr.code}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block">{curr.name}</span>
                </div>

                <div className="text-right">
                  {info?.isLive ? (
                    <>
                      <div className="font-bold text-white">GH₵{info.rate.toFixed(2)}</div>
                      <span className="text-[9px] text-emerald-400">Live</span>
                    </>
                  ) : (
                    <div className="text-[10px] text-neutral-500">Offline</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversion History Table */}
      <div className="bg-neutral-950 border border-neutral-900 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-400" />
            <h3 className="text-xs font-mono uppercase font-bold text-white tracking-wider">
              Recent Conversion History
            </h3>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-[10px] font-mono text-neutral-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-neutral-500">
            No conversion history recorded yet. Use the converter above to generate records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-neutral-900 text-[10px] text-neutral-500 uppercase">
                  <th className="py-2.5 px-3">Date / Time</th>
                  <th className="py-2.5 px-3">Original Amount</th>
                  <th className="py-2.5 px-3">Exchange Rate</th>
                  <th className="py-2.5 px-3">Canonical GHS Result</th>
                  <th className="py-2.5 px-3">Rate Type</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/60">
                {history.slice(0, 15).map(item => (
                  <tr key={item.id} className="hover:bg-neutral-900/30 transition-colors">
                    <td className="py-3 px-3 text-[11px] text-neutral-400">
                      {new Date(item.convertedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {item.originalCurrency} {item.originalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-neutral-300 text-[11px]">
                      1 {item.originalCurrency} = GH₵{item.exchangeRate.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400 text-sm">
                      {formatGHS(item.convertedAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 border ${
                          item.rateType === 'manual'
                            ? 'bg-amber-950/50 border-amber-800 text-amber-300'
                            : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                        }`}
                      >
                        {item.rateType === 'manual' ? 'Manual' : 'Live'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${item.originalCurrency} ${item.originalAmount} = GH₵${item.convertedAmount} (Rate: 1 ${item.originalCurrency} = GH₵${item.exchangeRate})`,
                            item.id
                          )
                        }
                        className="p-1 text-neutral-500 hover:text-white"
                        title="Copy conversion details"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
