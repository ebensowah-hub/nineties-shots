import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

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

  // Form state for creating a new booking
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newServiceTitle, setNewServiceTitle] = useState('Portraits');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newLocation, setNewLocation] = useState('Studio');
  const [newQuote, setNewQuote] = useState<number>(0);
  const [newDeposit, setNewDeposit] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Financial fields for editing selected booking
  const [editQuote, setEditQuote] = useState(0);
  const [editDeposit, setEditDeposit] = useState(0);
  const [editAdditional, setEditAdditional] = useState(0);
  const [editFinal, setEditFinal] = useState(0);
  const [editRefund, setEditRefund] = useState(0);
  const [editNotes, setEditNotes] = useState('');

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
    setEditQuote(booking.quoteAmount || 0);
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
        quoteAmount: editQuote,
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
      await onCreateBooking({
        clientName: newClientName.trim(),
        clientEmail: newClientEmail.trim(),
        clientPhone: newClientPhone.trim(),
        serviceTitle: newServiceTitle,
        date: newDate,
        time: newTime,
        location: newLocation,
        quoteAmount: Number(newQuote),
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
      setNewQuote(0);
      setNewDeposit(0);
      setNewNotes('');
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
            CALENDAR COMMISSIONS & REVENUE
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
            className={`px-3 py-2 text-xs font-mono uppercase tracking-wider border whitespace-nowrap ${
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
                className={`px-3 py-2 text-xs font-mono uppercase tracking-wider border whitespace-nowrap ${
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

      {/* Bookings Table */}
      {filteredBookings.length === 0 ? (
        <div className="p-16 bg-neutral-950 border border-neutral-900 text-center space-y-3">
          <CalendarCheck className="w-10 h-10 mx-auto text-neutral-600 stroke-[1.2]" />
          <h3 className="text-sm font-mono text-neutral-300 uppercase tracking-wider">
            No bookings found.
          </h3>
          <p className="text-xs font-mono text-neutral-500">
            Create a new shoot record or convert an incoming inquiry to see it here.
          </p>
        </div>
      ) : (
        <div className="bg-neutral-950 border border-neutral-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-900/60 border-b border-neutral-900 text-neutral-500 uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Quote / Paid</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Shoot Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredBookings.map(b => (
                  <tr
                    key={b.id}
                    onClick={() => handleOpenDetail(b)}
                    className="hover:bg-neutral-900/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-white font-bold">{b.bookingReference}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{b.clientName}</div>
                      <div className="text-[10px] text-neutral-500">{b.clientPhone || b.clientEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-300">{b.serviceTitle}</td>
                    <td className="py-3 px-4 text-neutral-300">
                      <div>{b.date}</div>
                      <div className="text-[10px] text-neutral-500">{b.time || '10:00 AM'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-bold">
                        {b.quoteAmount > 0 ? `$${b.quoteAmount}` : 'Unquoted'}
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        Paid: ${b.totalPaid}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 border ${
                          b.paymentStatus === 'Paid'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : b.paymentStatus === 'Deposit Paid' || b.paymentStatus === 'Partially Paid'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                            : b.paymentStatus === 'Refunded'
                            ? 'bg-red-950/60 text-red-300 border-red-800'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 border ${
                          b.bookingStatus === 'Confirmed'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : b.bookingStatus === 'Completed'
                            ? 'bg-neutral-900 text-neutral-300 border-neutral-700'
                            : b.bookingStatus === 'Cancelled'
                            ? 'bg-red-950/60 text-red-400 border-red-900'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenDetail(b);
                        }}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] uppercase tracking-wider border border-neutral-800"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create New Booking Modal */}
      {(showCreateModal || isCreatingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-neutral-900 flex items-center justify-between bg-neutral-900/40">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                  NEW DIRECT COMMISSION
                </span>
                <h2 className="text-lg font-heading text-white uppercase tracking-wider">
                  Create Booking Record
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  if (onCloseCreateNew) onCloseCreateNew();
                }}
                className="p-1 text-neutral-500 hover:text-white"
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
                  placeholder="e.g. John Doe"
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
                    placeholder="Studio / Location"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Total Quote ($)</label>
                  <input
                    type="number"
                    value={newQuote}
                    onChange={e => setNewQuote(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Deposit Received ($)</label>
                  <input
                    type="number"
                    value={newDeposit}
                    onChange={e => setNewDeposit(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Internal Booking Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Gear requirements, call sheets, lighting setup..."
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
                  className="px-4 py-2 bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider"
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
                className="p-1.5 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
              {/* Shoot Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-neutral-500 uppercase tracking-widest">
                  SHOOT WORKFLOW STATUS
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {bookingStatuses.map(st => (
                    <button
                      key={st}
                      disabled={actionLoading}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1 text-xs uppercase tracking-wider border transition-colors ${
                        selectedBooking.bookingStatus === st
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shoot Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-neutral-900/40 border border-neutral-900">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">SERVICE</span>
                  <div className="text-white font-semibold">{selectedBooking.serviceTitle}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">DATE & TIME</span>
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
                    <span>FINANCIAL & PAYMENT BREAKDOWN</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Calculated Total Paid:{' '}
                    <span className="text-emerald-400 font-bold">
                      ${Math.max(0, (editDeposit + editAdditional + editFinal) - editRefund)}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Quote Amount ($)</label>
                    <input
                      type="number"
                      value={editQuote}
                      onChange={e => setEditQuote(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Deposit Paid ($)</label>
                    <input
                      type="number"
                      value={editDeposit}
                      onChange={e => setEditDeposit(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Additional ($)</label>
                    <input
                      type="number"
                      value={editAdditional}
                      onChange={e => setEditAdditional(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Final Payment ($)</label>
                    <input
                      type="number"
                      value={editFinal}
                      onChange={e => setEditFinal(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Refund Issued ($)</label>
                    <input
                      type="number"
                      value={editRefund}
                      onChange={e => setEditRefund(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Outstanding Balance</label>
                    <div className="w-full bg-neutral-950 border border-neutral-800 p-2 text-amber-300 font-bold">
                      ${Math.max(0, editQuote - ((editDeposit + editAdditional + editFinal) - editRefund))}
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
                  className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs transition-colors"
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
                className="text-red-400 hover:text-red-300 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Booking</span>
              </button>

              <button
                onClick={() => onSelectBooking(null)}
                className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 text-xs font-mono uppercase tracking-wider"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
