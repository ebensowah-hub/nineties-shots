import React, { useState, useEffect } from 'react';
import { ServiceItem, CategorySlug } from '../../types';
import {
  Briefcase,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  ListPlus,
  Layers,
  DollarSign,
  Globe,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { SUPPORTED_CURRENCIES, formatGHS, getCurrencyConfig } from '../../lib/currency';
import { getExchangeRates, convertCurrencyAdmin } from '../../lib/api';

interface AdminServicesProps {
  services: ServiceItem[];
  onAddService: (service: Partial<ServiceItem>) => Promise<void>;
  onUpdateService: (id: string, updates: Partial<ServiceItem>) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
}

export const AdminServices: React.FC<AdminServicesProps> = ({
  services,
  onAddService,
  onUpdateService,
  onDeleteService
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategorySlug>('portraits');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [sampleImage, setSampleImage] = useState('');
  const [highlightsInput, setHighlightsInput] = useState('');
  const [deliverablesInput, setDeliverablesInput] = useState('');

  // Pricing & Currency fields
  const [pricingMode, setPricingMode] = useState<'custom' | 'fixed'>('custom');
  const [inputCurrency, setInputCurrency] = useState('GHS');
  const [inputPrice, setInputPrice] = useState<string>('');
  const [manualRate, setManualRate] = useState<string>('');
  const [useManualRate, setUseManualRate] = useState(false);
  const [calculatedGHS, setCalculatedGHS] = useState<number | null>(null);
  const [usedRate, setUsedRate] = useState<number>(1);
  const [rateType, setRateType] = useState<'live' | 'manual'>('live');
  const [converting, setConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Live rates cache
  const [liveRates, setLiveRates] = useState<Record<string, any>>({});

  useEffect(() => {
    getExchangeRates()
      .then(res => setLiveRates(res.rates || {}))
      .catch(() => {});
  }, []);

  const baseCategories: { id: CategorySlug; name: string }[] = [
    { id: 'portraits', name: 'Portraits' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'photo-shoots', name: 'Photo Shoots' }
  ];

  const customCategories = Array.from(new Set(services.map(s => s.category)))
    .filter(cat => !baseCategories.some(bc => bc.id === cat))
    .map(cat => ({
      id: cat as CategorySlug,
      name: services.find(s => s.category === cat)?.title || cat
    }));

  const categories = [...baseCategories, ...customCategories];

  const resetForm = () => {
    setTitle('');
    setCategory('portraits');
    setTagline('');
    setDescription('');
    setSampleImage('');
    setHighlightsInput('');
    setDeliverablesInput('');
    setPricingMode('custom');
    setInputCurrency('GHS');
    setInputPrice('');
    setManualRate('');
    setUseManualRate(false);
    setCalculatedGHS(null);
    setUsedRate(1);
    setRateType('live');
    setConversionError(null);
    setEditingService(null);
  };

  const handleOpenEdit = (srv: ServiceItem) => {
    setEditingService(srv);
    setTitle(srv.title);
    setCategory(srv.category);
    setTagline(srv.tagline);
    setDescription(srv.description);
    setSampleImage(srv.sampleImage || '');
    setHighlightsInput((srv.highlights || []).join('\n'));
    setDeliverablesInput((srv.deliverables || []).join('\n'));

    if (srv.priceAmount || srv.originalAmount) {
      setPricingMode('fixed');
      setInputCurrency(srv.originalCurrency || 'GHS');
      setInputPrice(String(srv.originalAmount || srv.priceAmount || ''));
      setCalculatedGHS(srv.priceAmount || null);
      setUsedRate(srv.exchangeRate || 1);
      setRateType(srv.rateType || 'live');
      if (srv.rateType === 'manual' && srv.exchangeRate) {
        setUseManualRate(true);
        setManualRate(String(srv.exchangeRate));
      }
    } else {
      setPricingMode('custom');
      setInputPrice('');
      setCalculatedGHS(null);
    }

    setShowModal(true);
  };

  // Recalculate GHS on input changes
  useEffect(() => {
    if (pricingMode !== 'fixed' || !inputPrice || parseFloat(inputPrice) <= 0) {
      setCalculatedGHS(null);
      setConversionError(null);
      return;
    }

    const num = parseFloat(inputPrice);
    if (inputCurrency === 'GHS') {
      setCalculatedGHS(num);
      setUsedRate(1);
      setRateType('live');
      setConversionError(null);
      return;
    }

    if (useManualRate && manualRate && parseFloat(manualRate) > 0) {
      const r = parseFloat(manualRate);
      const pesewas = Math.round(num * r * 100);
      setCalculatedGHS(pesewas / 100);
      setUsedRate(r);
      setRateType('manual');
      setConversionError(null);
    } else {
      const rateInfo = liveRates[inputCurrency];
      if (rateInfo?.isLive && rateInfo.rate > 0) {
        const r = rateInfo.rate;
        const pesewas = Math.round(num * r * 100);
        setCalculatedGHS(pesewas / 100);
        setUsedRate(r);
        setRateType('live');
        setConversionError(null);
      } else {
        setConversionError('Live exchange rate unavailable. Please specify a manual exchange rate.');
      }
    }
  }, [inputPrice, inputCurrency, useManualRate, manualRate, pricingMode, liveRates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setActionLoading(true);
      const numPrice = parseFloat(inputPrice);
      const isFixed = pricingMode === 'fixed' && !isNaN(numPrice) && numPrice > 0;

      const payload: Partial<ServiceItem> = {
        title: title.trim(),
        category,
        tagline: tagline.trim(),
        description: description.trim(),
        sampleImage: sampleImage.trim() || 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200',
        highlights: highlightsInput.split('\n').map(s => s.trim()).filter(Boolean),
        deliverables: deliverablesInput.split('\n').map(s => s.trim()).filter(Boolean),
        priceAmount: isFixed && calculatedGHS !== null ? calculatedGHS : undefined,
        originalAmount: isFixed ? numPrice : undefined,
        originalCurrency: isFixed ? inputCurrency : undefined,
        exchangeRate: isFixed ? usedRate : undefined,
        rateType: isFixed ? rateType : undefined,
        quoteRangeText: isFixed && calculatedGHS !== null ? formatGHS(calculatedGHS) : 'Custom Commission Scoping'
      };

      if (editingService) {
        await onUpdateService(editingService.id, payload);
      } else {
        await onAddService(payload);
      }
      setShowModal(false);
      resetForm();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 block">
            COMMISSION OFFERINGS & PACKAGES (GH₵ PRIMARY)
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
            Services & Deliverables
          </h1>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Service Offering</span>
        </button>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {services.map(srv => (
          <div
            key={srv.id}
            className="p-6 bg-neutral-950 border border-neutral-900 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800">
                  {srv.category}
                </span>
                <h3 className="text-lg font-heading text-white uppercase tracking-wide">
                  {srv.title}
                </h3>
              </div>

              <p className="text-xs font-mono text-neutral-300 italic">{srv.tagline}</p>
              <p className="text-xs text-neutral-400 font-light line-clamp-2">{srv.description}</p>

              {/* Price & Dual Currency Display */}
              <div className="pt-1 flex items-center gap-3 text-xs font-mono">
                <span className="text-[10px] text-neutral-500 uppercase">Pricing:</span>
                {srv.priceAmount ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400">{formatGHS(srv.priceAmount)}</span>
                    {srv.originalCurrency && srv.originalCurrency !== 'GHS' && srv.originalAmount && (
                      <span className="text-[10px] text-neutral-400 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800">
                        {srv.originalCurrency} {srv.originalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} @ GH₵{srv.exchangeRate?.toFixed(2)} ({srv.rateType})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-neutral-400 italic">Custom Quote / Scoping</span>
                )}
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {srv.deliverables?.slice(0, 4).map((d, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono bg-neutral-900/60 text-neutral-400 px-2 py-0.5 border border-neutral-900"
                  >
                    • {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
              <button
                onClick={() => handleOpenEdit(srv)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono uppercase tracking-wider border border-neutral-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={async () => {
                  if (window.confirm(`Delete service offering "${srv.title}"?`)) {
                    await onDeleteService(srv.id);
                  }
                }}
                className="p-1.5 text-neutral-500 hover:text-red-400 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-neutral-900 flex items-center justify-between bg-neutral-900/40">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                  COMMISSION STRUCTURE
                </span>
                <h2 className="text-lg font-heading text-white uppercase tracking-wider">
                  {editingService ? `Edit Service: ${editingService.title}` : 'Add New Service Offering'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Editorial & Fashion Campaigns"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as CategorySlug)}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Multi-Currency Section */}
              <div className="p-4 bg-neutral-900/40 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pricing & Currency Scoping</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPricingMode('custom')}
                      className={`px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        pricingMode === 'custom'
                          ? 'bg-white text-black font-bold'
                          : 'text-neutral-400 bg-neutral-900 border border-neutral-800'
                      }`}
                    >
                      Custom Scoping
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMode('fixed')}
                      className={`px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        pricingMode === 'fixed'
                          ? 'bg-white text-black font-bold'
                          : 'text-neutral-400 bg-neutral-900 border border-neutral-800'
                      }`}
                    >
                      Set Starting Rate
                    </button>
                  </div>
                </div>

                {pricingMode === 'fixed' && (
                  <div className="space-y-3 pt-2 border-t border-neutral-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 uppercase">Input Currency</label>
                        <select
                          value={inputCurrency}
                          onChange={e => setInputCurrency(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                        >
                          {SUPPORTED_CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.code} ({c.symbol})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 uppercase">
                          Amount ({getCurrencyConfig(inputCurrency).symbol})
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={inputPrice}
                          onChange={e => setInputPrice(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Conversion info / Manual Rate Override */}
                    {inputCurrency !== 'GHS' && (
                      <div className="space-y-2 pt-2 border-t border-neutral-800/60">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-neutral-400">
                            Rate source: {useManualRate ? 'Manual Override' : 'Live Provider'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setUseManualRate(!useManualRate)}
                            className="text-amber-400 hover:underline"
                          >
                            {useManualRate ? 'Switch to Live Rate' : 'Enter Manual Rate'}
                          </button>
                        </div>

                        {useManualRate && (
                          <div className="space-y-1">
                            <label className="text-[10px] text-amber-400 uppercase">
                              Manual Rate (1 {inputCurrency} = ? GH₵)
                            </label>
                            <input
                              type="number"
                              step="0.0001"
                              value={manualRate}
                              onChange={e => setManualRate(e.target.value)}
                              placeholder="15.20"
                              className="w-full bg-neutral-900 border border-amber-800/60 p-2 text-white"
                            />
                          </div>
                        )}

                        {conversionError && (
                          <div className="p-2 bg-amber-950/40 border border-amber-800 text-amber-300 text-[10px]">
                            {conversionError}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Calculated Canonical GH₵ Display */}
                    {calculatedGHS !== null && (
                      <div className="p-3 bg-neutral-950 border border-emerald-900/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase block">Canonical Business Price</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            {formatGHS(calculatedGHS)}
                          </span>
                        </div>
                        {inputCurrency !== 'GHS' && (
                          <span className="text-[10px] font-mono text-neutral-400 text-right">
                            Exchange Rate: 1 {inputCurrency} = GH₵{usedRate.toFixed(2)}
                            <span className="block text-[9px] text-neutral-500">
                              ({rateType === 'manual' ? 'Manual exchange rate' : 'Live mid-market'})
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. High-concept visual storytelling for brands"
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed breakdown of the approach, lighting, and art direction..."
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Sample Image URL</label>
                <input
                  type="url"
                  value={sampleImage}
                  onChange={e => setSampleImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Highlights (one per line)</label>
                  <textarea
                    rows={3}
                    value={highlightsInput}
                    onChange={e => setHighlightsInput(e.target.value)}
                    placeholder="Full Lookbook Curation&#10;Medium Format Digital&#10;On-Location Lighting"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Deliverables (one per line)</label>
                  <textarea
                    rows={3}
                    value={deliverablesInput}
                    onChange={e => setDeliverablesInput(e.target.value)}
                    placeholder="25+ High-Res Retouched Masters&#10;Web & Social Crops&#10;Private Cloud Gallery"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
