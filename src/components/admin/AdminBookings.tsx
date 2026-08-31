import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, PaymentStatus } from '../../types';
import {
  CalendarCheck,
  Search,
  PlusCircle,
  X,
  Trash2,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { SUPPORTED_CURRENCIES, formatGHS, getCurrencyConfig, calculateGHSConversion } from '../../lib/currency';
import { getExchangeRates } from '../../lib/api';

interface AdminBookingsProps {
  bookings: Booking[];
  selectedBooking: Booking | null;
  onSelectBooking: (booking: Booking | null) => void;
  onCreateBooking: (data: Partial<Booking>) => Promise<void>;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
  isCreatingNew?: boolean;
  onCloseCreateNew?: () => void;
}

export const AdminBookings: React.FC<AdminBookingsProps> = ({
  bookings,
  selectedBooking,
  onSelectBooking,
  onCreateBooking,
  onUpdateBooking,
  onDeleteBooking,
  isCreatingNew = false,
  onCloseCreateNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(isCreatingNew);

  // Exchange rates
  const [liveRates, setLiveRates] = useState<Record<string, any>>({});

  useEffect(() => {
    getExchangeRates()
      .then(res => setLiveRates(res.rates || {}))
      .catch(() => {});
  }, []);

  // Form state for creating a new booking
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newServiceTitle, setNewServiceTitle] = useState('Portraits');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newLocation, setNewLocation] = useState('Studio');

  // Currency & Quote states for New Booking
  const [newCurrency, setNewCurrency] = useState('GHS');
  const [newQuoteInput, setNewQuoteInput] = useState<string>('0');
  const [newManualRate, setNewManualRate] = useState<string>('');
  const [newUseManualRate, setNewUseManualRate] = useState(false);
  const [newCalculatedGHSQuote, setNewCalculatedGHSQuote] = useState<number>(0);
  const [newUsedRate, setNewUsedRate] = useState<number>(1);
  const [newRateType, setNewRateType] = useState<'live' | 'manual'>('live');

  // Deposit in GHS
  const [newDeposit, setNewDeposit] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Financial fields for editing selected booking
  const [editQuoteGHS, setEditQuoteGHS] = useState(0);
  const [editOriginalCurrency, setEditOriginalCurrency] = useState('GHS');
  const [editOriginalAmount, setEditOriginalAmount] = useState<number | undefined>(undefined);
  const [editExchangeRate, setEditExchangeRate] = useState<number | undefined>(undefined);
  const [editRateType, setEditRateType] = useState<'live' | 'manual' | undefined>('live');

  const [editDeposit, setEditDeposit] = useState(0);
  const [editAdditional, setEditAdditional] = useState(0);
  const [editFinal, setEditFinal] = useState(0);
  const [editRefund, setEditRefund] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  // Auto-calculate GHS for new booking quote
  useEffect(() => {
    const rawNum = parseFloat(newQuoteInput) || 0;
    if (newCurrency === 'GHS') {
      setNewCalculatedGHSQuote(rawNum);
      setNewUsedRate(1);
      setNewRateType('live');
      return;
    }

    if (newUseManualRate && newManualRate && parseFloat(newManualRate) > 0) {
      const r = parseFloat(newManualRate);
      const res = calculateGHSConversion(rawNum, r);
      setNewCalculatedGHSQuote(res.ghsAmount);
      setNewUsedRate(r);
      setNewRateType('manual');
    } else {
      const rateInfo = liveRates[newCurrency];
      if (rateInfo?.isLive && rateInfo.rate > 0) {
        const r = rateInfo.rate;
        const res = calculateGHSConversion(rawNum, r);
        setNewCalculatedGHSQuote(res.ghsAmount);
        setNewUsedRate(r);
        setNewRateType('live');
      } else {
        setNewCalculatedGHSQuote(0);
      }
    }
  }, [newQuoteInput, newCurrency, newUseManualRate, newManualRate, liveRates]);

  const bookingStatuses: BookingStatus[] = [
    'Inquiry',
    'Quoted',
    'Awaiting Deposit',
    'Confirmed',
    'In Progress',
    'Completed',
    'Cancelled'
  ];

  const paymentStatuses: PaymentStatus[] = [
    'Not Set',
    'Unpaid',
    'Deposit Paid',
    'Partially Paid',
    'Paid',
    'Refunded'
  ];

  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.serviceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.bookingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetail = (booking: Booking) => {
    onSelectBooking(booking);
    setEditQuoteGHS(booking.quoteAmount || 0);
    setEditOriginalCurrency(booking.originalCurrency || 'GHS');
    setEditOriginalAmount(booking.originalAmount);
    setEditExchangeRate(booking.exchangeRate);
    setEditRateType(booking.rateType);

    setEditDeposit(booking.depositAmount || 0);
    setEditAdditional(booking.additionalPayment || 0);
    setEditFinal(booking.finalPayment || 0);
    setEditRefund(booking.refundAmount || 0);
    setEditNotes(booking.notes || '');
  };

  const handleSaveFinancials = async () => {
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      await onUpdateBooking(selectedBooking.id, {
        quoteAmount: editQuoteGHS,
        originalCurrency: editOriginalCurrency !== 'GHS' ? editOriginalCurrency : undefined,
        originalAmount: editOriginalAmount,
        exchangeRate: editExchangeRate,
        rateType: editRateType,
        depositAmount: editDeposit,
        additionalPayment: editAdditional,
        finalPayment: editFinal,
        refundAmount: editRefund,
        notes: editNotes
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      await onUpdateBooking(selectedBooking.id, { bookingStatus: newStatus });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      setActionLoading(true);
      const rawQuote = parseFloat(newQuoteInput) || 0;

      await onCreateBooking({
        clientName: newClientName.trim(),
        clientEmail: newClientEmail.trim(),
        clientPhone: newClientPhone.trim(),
        serviceTitle: newServiceTitle,
        date: newDate,
        time: newTime,
        location: newLocation,
        quoteAmount: newCalculatedGHSQuote,
        originalAmount: newCurrency !== 'GHS' ? rawQuote : undefined,
        originalCurrency: newCurrency !== 'GHS' ? newCurrency : undefined,
        exchangeRate: newCurrency !== 'GHS' ? newUsedRate : undefined,
        rateType: newCurrency !== 'GHS' ? newRateType : undefined,
        convertedAt: newCurrency !== 'GHS' ? new Date().toISOString() : undefined,
        depositAmount: Number(newDeposit),
        bookingStatus: 'Confirmed',
        notes: newNotes
      });

      setShowCreateModal(false);
      if (onCloseCreateNew) onCloseCreateNew();

      // Reset
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('');
      setNewQuoteInput('0');
      setNewDeposit(0);
      setNewNotes('');
      setNewCurrency('GHS');
      setNewManualRate('');
      setNewUseManualRate(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 block">
            CALENDAR COMMISSIONS & REVENUE (GH₵ BUSINESS CURRENCY)
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
            Bookings & Shoots
          </h1>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Shoot Record</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by client, reference (e.g. NS-839201), service, location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white font-mono"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 text-xs font-mono uppercase tracking-wider border whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-neutral-950 text-neutral-400 border-neutral-900 hover:border-neutral-700'
            }`}
          >
            All ({bookings.length})
          </button>
          {bookingStatuses.map(s => {
            const count = bookings.filter(b => b.bookingStatus === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-xs font-mono uppercase tracking-wider border whitespace-nowrap cursor-pointer ${
                  statusFilter === s
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-900 hover:border-neutral-700'
                }`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Bookings List / Table */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-neutral-950 border border-neutral-900 space-y-3">
          <CalendarCheck className="w-8 h-8 mx-auto text-neutral-600" />
          <p className="text-sm font-mono text-neutral-400">No booking records match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map(b => (
            <div
              key={b.id}
              onClick={() => handleOpenDetail(b)}
              className="p-5 bg-neutral-950 border border-neutral-900 hover:border-neutral-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-900 text-neutral-300 border border-neutral-800 font-bold">
                    {b.bookingReference}
                  </span>
                  <span className="text-xs font-mono font-bold text-white uppercase">{b.clientName}</span>
                  <span className="text-[10px] font-mono text-neutral-500">• {b.serviceTitle}</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{b.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{b.time || '10:00 AM'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{b.location || 'Studio'}</span>
                  </span>
                </div>
              </div>

              {/* Financial Snapshot with Dual Currency Indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-900">
                <div className="text-left sm:text-right font-mono">
                  <span className="text-[10px] text-neutral-500 uppercase block">Quote Value</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatGHS(b.quoteAmount || 0)}
                  </span>
                  {b.originalCurrency && b.originalCurrency !== 'GHS' && b.originalAmount && (
                    <span className="text-[9px] text-neutral-400 block">
                      ({b.originalCurrency} {b.originalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} @ GH₵{b.exchangeRate?.toFixed(2)})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-mono uppercase px-2.5 py-1 border ${
                      b.bookingStatus === 'Confirmed'
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : b.bookingStatus === 'Completed'
                        ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    {b.bookingStatus}
                  </span>

                  <span
                    className={`text-[10px] font-mono uppercase px-2.5 py-1 border ${
                      b.paymentStatus === 'Paid'
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : b.paymentStatus === 'Deposit Paid' || b.paymentStatus === 'Partially Paid'
                        ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {b.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-neutral-900 flex items-center justify-between bg-neutral-900/40">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                  CALENDAR & FINANCIAL SCHEDULING
                </span>
                <h2 className="text-lg font-heading text-white uppercase tracking-wider">
                  New Shoot Commission
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  if (onCloseCreateNew) onCloseCreateNew();
                }}
                className="p-1 text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Client Full Name *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="e.g. Nana Kwame"
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Client Email</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={e => setNewClientEmail(e.target.value)}
                    placeholder="client@domain.com"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={e => setNewClientPhone(e.target.value)}
                    placeholder="020 806 6924"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Service Category</label>
                  <select
                    value={newServiceTitle}
                    onChange={e => setNewServiceTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  >
                    <option value="Portraits">Portraits</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Photo Shoots">Photo Shoots</option>
                    <option value="Custom Creative Commission">Custom Creative Commission</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Shoot Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    placeholder="Studio / Accra Location"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Shoot Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  />
                </div>
              </div>

              {/* Quote Currency & Calculation Section */}
              <div className="p-4 bg-neutral-900/50 border border-neutral-800 space-y-3">
                <span className="text-[10px] uppercase font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Commission Quote & Foreign Currency Conversion</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Quote Currency</label>
                    <select
                      value={newCurrency}
                      onChange={e => setNewCurrency(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white text-xs"
                    >
                      {SUPPORTED_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-neutral-400 uppercase">
                      Agreed Quote Amount ({getCurrencyConfig(newCurrency).symbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newQuoteInput}
                      onChange={e => setNewQuoteInput(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white font-mono"
                      placeholder="0"
                    />
                  </div>
                </div>

                {newCurrency !== 'GHS' && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-neutral-400">
                        Conversion Mode: {newUseManualRate ? 'Manual Rate' : 'Live Mid-Market Rate'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewUseManualRate(!newUseManualRate)}
                        className="text-amber-400 hover:underline cursor-pointer"
                      >
                        {newUseManualRate ? 'Use Live Provider Rate' : 'Enter Manual Override Rate'}
                      </button>
                    </div>

                    {newUseManualRate && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-amber-400 uppercase">
                          Manual Exchange Rate (1 {newCurrency} = ? GH₵)
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newManualRate}
                          onChange={e => setNewManualRate(e.target.value)}
                          placeholder="15.20"
                          className="w-full bg-neutral-900 border border-amber-800/60 p-2 text-white font-mono"
                        />
                      </div>
                    )}

                    <div className="p-3 bg-neutral-950 border border-emerald-900/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase block">Canonical Business Value</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {formatGHS(newCalculatedGHSQuote)}
                        </span>
                      </div>
                      <div className="text-right text-[10px] text-neutral-400 font-mono">
                        <span>1 {newCurrency} = GH₵{newUsedRate.toFixed(2)}</span>
                        <span className="block text-[9px] text-neutral-500">({newRateType})</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deposit in GHS */}
                <div className="pt-2 border-t border-neutral-800 space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Deposit Received (GH₵)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={newDeposit}
                    onChange={e => setNewDeposit(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Internal Production Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Moodboard links, lighting gear, client deliverables..."
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    if (onCloseCreateNew) onCloseCreateNew();
                  }}
                  className="px-4 py-2 bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Detail & Financial Breakdown Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-neutral-900 flex items-start justify-between bg-neutral-900/40">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono uppercase bg-neutral-900 px-2 py-0.5 border border-neutral-800 text-neutral-300 font-bold">
                    {selectedBooking.bookingReference}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Created {new Date(selectedBooking.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-xl font-heading text-white uppercase tracking-wide">
                  {selectedBooking.clientName}
                </h2>
              </div>

              <button
                onClick={() => onSelectBooking(null)}
                className="p-1 text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs font-mono">
              {/* Quick Status Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-neutral-900/40 border border-neutral-900">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">STATUS</span>
                  <select
                    value={selectedBooking.bookingStatus}
                    onChange={e => handleStatusChange(e.target.value as BookingStatus)}
                    className="bg-transparent text-white font-bold uppercase focus:outline-none cursor-pointer"
                  >
                    {bookingStatuses.map(s => (
                      <option key={s} value={s} className="bg-neutral-900">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">PAYMENT</span>
                  <div className="text-emerald-400 font-bold">{selectedBooking.paymentStatus}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">SHOOT DATE</span>
                  <div className="text-white">{selectedBooking.date} • {selectedBooking.time || '10:00 AM'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">LOCATION</span>
                  <div className="text-white">{selectedBooking.location || 'Studio'}</div>
                </div>
              </div>

              {/* Financial Breakdown Editor */}
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-bold text-white uppercase tracking-widest text-[11px] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>FINANCIAL & PAYMENT BREAKDOWN (GH₵ CANONICAL)</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Total Paid:{' '}
                    <span className="text-emerald-400 font-bold">
                      {formatGHS(Math.max(0, (editDeposit + editAdditional + editFinal) - editRefund))}
                    </span>
                  </span>
                </div>

                {/* Original Quote Currency Info if foreign */}
                {selectedBooking.originalCurrency && selectedBooking.originalCurrency !== 'GHS' && (
                  <div className="p-3 bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">Foreign Currency Quote</span>
                      <span className="text-white font-bold">
                        {selectedBooking.originalCurrency} {selectedBooking.originalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-neutral-400">
                      <span>Rate Used: 1 {selectedBooking.originalCurrency} = GH₵{selectedBooking.exchangeRate?.toFixed(2)}</span>
                      <span className="block text-[9px] text-neutral-500">
                        ({selectedBooking.rateType || 'live'})
                        {selectedBooking.rateType === 'manual-flagged' && (
                          <span className="text-amber-400 font-bold ml-1">⚠️ Flagged Deviation</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Overpayment Warning */}
                {((editDeposit + editAdditional + editFinal - editRefund) > editQuoteGHS && editQuoteGHS > 0) && (
                  <div className="p-3 bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      Notice: Total payments received ({formatGHS((editDeposit + editAdditional + editFinal) - editRefund)}) exceed the quote ({formatGHS(editQuoteGHS)}) by {formatGHS(((editDeposit + editAdditional + editFinal) - editRefund) - editQuoteGHS)}.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Quote Amount (GH₵)</label>
                    <input
                      type="number"
                      step="any"
                      value={editQuoteGHS}
                      onChange={e => setEditQuoteGHS(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Deposit Paid (GH₵)</label>
                    <input
                      type="number"
                      step="any"
                      value={editDeposit}
                      onChange={e => setEditDeposit(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Additional (GH₵)</label>
                    <input
                      type="number"
                      step="any"
                      value={editAdditional}
                      onChange={e => setEditAdditional(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Final Payment (GH₵)</label>
                    <input
                      type="number"
                      step="any"
                      value={editFinal}
                      onChange={e => setEditFinal(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Refund Issued (GH₵)</label>
                    <input
                      type="number"
                      step="any"
                      value={editRefund}
                      onChange={e => setEditRefund(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Outstanding Balance</label>
                    <div className="w-full bg-neutral-950 border border-neutral-800 p-2 text-amber-300 font-bold font-mono">
                      {formatGHS(Math.max(0, editQuoteGHS - ((editDeposit + editAdditional + editFinal) - editRefund)))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Private Production Notes</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 p-2.5 text-white placeholder-neutral-600"
                    placeholder="Lighting setup, gear list, client delivery link..."
                  />
                </div>

                <button
                  disabled={actionLoading}
                  onClick={handleSaveFinancials}
                  className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
                >
                  Save Booking & Financial Updates
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-900 bg-neutral-900/40 flex items-center justify-between">
              <button
                onClick={async () => {
                  if (window.confirm(`Permanently delete booking ${selectedBooking.bookingReference}?`)) {
                    await onDeleteBooking(selectedBooking.id);
                  }
                }}
                className="text-red-400 hover:text-red-300 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Booking</span>
              </button>

              <button
                onClick={() => onSelectBooking(null)}
                className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
