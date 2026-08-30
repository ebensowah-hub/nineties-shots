import React, { useState } from 'react';
import { Inquiry, InquiryStatus } from '../../types';
import {
  Inbox,
  Search,
  Filter,
  MessageSquare,
  Phone,
  Mail,
  CalendarPlus,
  Trash2,
  X,
  Check,
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';

interface AdminInquiriesProps {
  inquiries: Inquiry[];
  selectedInquiry: Inquiry | null;
  onSelectInquiry: (inquiry: Inquiry | null) => void;
  onUpdateStatus: (id: string, status: InquiryStatus) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  onConvertToBooking: (id: string, quote: number, deposit: number, notes: string) => Promise<void>;
  onDeleteInquiry: (id: string) => Promise<void>;
}

export const AdminInquiries: React.FC<AdminInquiriesProps> = ({
  inquiries,
  selectedInquiry,
  onSelectInquiry,
  onUpdateStatus,
  onUpdateNotes,
  onConvertToBooking,
  onDeleteInquiry
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertQuote, setConvertQuote] = useState(0);
  const [convertDeposit, setConvertDeposit] = useState(0);
  const [convertNotes, setConvertNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const statuses: InquiryStatus[] = ['New', 'Contacted', 'Quoted', 'Confirmed', 'Completed', 'Cancelled', 'Archived'];

  const filteredInquiries = inquiries.filter(inq => {
    const matchesSearch =
      inq.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.phone.includes(searchTerm) ||
      inq.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetail = (inquiry: Inquiry) => {
    onSelectInquiry(inquiry);
    setNotesText(inquiry.notes || '');
    setEditingNotes(false);
    setConverting(false);
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    try {
      setActionLoading(true);
      await onUpdateNotes(selectedInquiry.id, notesText);
      setEditingNotes(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: InquiryStatus) => {
    if (!selectedInquiry) return;
    try {
      setActionLoading(true);
      await onUpdateStatus(selectedInquiry.id, newStatus);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmConvert = async () => {
    if (!selectedInquiry) return;
    try {
      setActionLoading(true);
      await onConvertToBooking(selectedInquiry.id, convertQuote, convertDeposit, convertNotes);
      setConverting(false);
    } finally {
      setActionLoading(false);
    }
  };

  const getCleanPhone = (phoneStr: string) => {
    return (phoneStr || '').replace(/[^0-9]/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 block">
            CLIENT LEADS & BRIEFS
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
            Inquiries Management
          </h1>
        </div>

        <div className="text-xs font-mono text-neutral-400">
          Total: <span className="text-white font-bold">{inquiries.length}</span> (
          {inquiries.filter(i => i.status === 'New').length} new)
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by client name, reference (e.g. NS-123456), email, or location..."
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
            All ({inquiries.length})
          </button>
          {statuses.map(s => {
            const count = inquiries.filter(i => i.status === s).length;
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

      {/* Inquiries Table / Cards */}
      {filteredInquiries.length === 0 ? (
        <div className="p-16 bg-neutral-950 border border-neutral-900 text-center space-y-3">
          <Inbox className="w-10 h-10 mx-auto text-neutral-600 stroke-[1.2]" />
          <h3 className="text-sm font-mono text-neutral-300 uppercase tracking-wider">
            No inquiries match your criteria.
          </h3>
          <p className="text-xs font-mono text-neutral-500">
            {searchTerm ? 'Try adjusting your search query.' : 'New inquiries will be logged here automatically.'}
          </p>
        </div>
      ) : (
        <div className="bg-neutral-950 border border-neutral-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-900/60 border-b border-neutral-900 text-neutral-500 uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Shoot Type</th>
                  <th className="py-3 px-4">Preferred Date</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredInquiries.map(inq => (
                  <tr
                    key={inq.id}
                    onClick={() => handleOpenDetail(inq)}
                    className="hover:bg-neutral-900/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-white font-bold">{inq.reference}</td>
                    <td className="py-3 px-4 text-neutral-200">
                      <div className="font-medium text-white">{inq.clientName}</div>
                      <div className="text-[10px] text-neutral-500 truncate max-w-xs">{inq.location || 'No location specified'}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">{inq.shootType}</td>
                    <td className="py-3 px-4 text-neutral-400">{inq.preferredDate || 'Flexible'}</td>
                    <td className="py-3 px-4 text-neutral-400">
                      {inq.phone || inq.email || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 border ${
                          inq.status === 'New'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                            : inq.status === 'Confirmed'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : inq.status === 'Cancelled' || inq.status === 'Archived'
                            ? 'bg-neutral-900 text-neutral-500 border-neutral-800'
                            : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenDetail(inq);
                        }}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] uppercase tracking-wider border border-neutral-800"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inquiry Detail Modal / Drawer */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-900 flex items-start justify-between bg-neutral-900/40">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono uppercase bg-neutral-900 px-2 py-0.5 border border-neutral-800 text-neutral-300">
                    {selectedInquiry.reference}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Received {new Date(selectedInquiry.submittedAt).toLocaleString()}
                  </span>
                </div>
                <h2 className="text-xl font-heading text-white uppercase tracking-wide">
                  {selectedInquiry.clientName}
                </h2>
              </div>

              <button
                onClick={() => onSelectInquiry(null)}
                className="p-1.5 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
              {/* Quick Actions Strip */}
              <div className="flex flex-wrap gap-2 p-3 bg-neutral-900/60 border border-neutral-900">
                {selectedInquiry.phone && (
                  <>
                    <a
                      href={`https://wa.me/${getCleanPhone(selectedInquiry.phone)}?text=${encodeURIComponent(
                        `Hello ${selectedInquiry.clientName}, thank you for reaching out to NINETIES SHOTS regarding your ${selectedInquiry.shootType} inquiry (Ref: ${selectedInquiry.reference}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Client</span>
                    </a>

                    <a
                      href={`tel:${selectedInquiry.phone}`}
                      className="px-3 py-1.5 bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call {selectedInquiry.phone}</span>
                    </a>
                  </>
                )}

                {selectedInquiry.email && (
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=${encodeURIComponent(
                      `NINETIES SHOTS Commission Brief (${selectedInquiry.reference})`
                    )}`}
                    className="px-3 py-1.5 bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Client</span>
                  </a>
                )}

                <button
                  onClick={() => setConverting(true)}
                  className="px-3 py-1.5 bg-white text-black font-bold border border-white hover:bg-neutral-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wider ml-auto"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Convert to Booking</span>
                </button>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  CURRENT INQUIRY STATUS
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map(st => (
                    <button
                      key={st}
                      disabled={actionLoading}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1 text-xs uppercase tracking-wider border transition-colors ${
                        selectedInquiry.status === st
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Brief Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-neutral-900/40 border border-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">SHOOT TYPE</span>
                  <div className="text-white text-sm">{selectedInquiry.shootType}</div>
                </div>

                <div className="p-3.5 bg-neutral-900/40 border border-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">PREFERRED DATE</span>
                  <div className="text-white text-sm">{selectedInquiry.preferredDate || 'Flexible / Unspecified'}</div>
                </div>

                <div className="p-3.5 bg-neutral-900/40 border border-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">SHOOT LOCATION</span>
                  <div className="text-white text-sm">{selectedInquiry.location || 'Studio / Location TBD'}</div>
                </div>

                <div className="p-3.5 bg-neutral-900/40 border border-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">BUDGET TIER</span>
                  <div className="text-white text-sm">{selectedInquiry.budgetRange || 'Custom Scoping'}</div>
                </div>
              </div>

              {/* Client Message */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  SUBMITTED BRIEF / VISION
                </span>
                <div className="p-4 bg-neutral-900/80 border border-neutral-800 text-neutral-200 text-xs font-light leading-relaxed whitespace-pre-wrap">
                  {selectedInquiry.message || 'No additional message submitted.'}
                </div>
              </div>

              {/* Private Admin Notes */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>PRIVATE ADMIN NOTES (INTERNAL ONLY)</span>
                  </span>
                  {!editingNotes && (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider underline"
                    >
                      Edit Notes
                    </button>
                  )}
                </div>

                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={notesText}
                      onChange={e => setNotesText(e.target.value)}
                      placeholder="Add private thoughts, location scouting details, phone call takeaways..."
                      className="w-full bg-neutral-900 border border-neutral-800 p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white font-mono"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingNotes(false)}
                        className="px-3 py-1 bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 uppercase text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={handleSaveNotes}
                        className="px-3 py-1 bg-white text-black font-bold uppercase text-[10px]"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-neutral-900/30 border border-neutral-900 text-neutral-400 italic">
                    {selectedInquiry.notes || 'No internal notes added yet.'}
                  </div>
                )}
              </div>

              {/* Convert to Booking Sub-Form */}
              {converting && (
                <div className="p-4 bg-neutral-900/90 border border-white/40 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="font-bold text-white uppercase tracking-wider text-xs">
                      Convert Inquiry into Confirmed Booking
                    </span>
                    <button onClick={() => setConverting(false)} className="text-neutral-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase">Quote Amount ($)</label>
                      <input
                        type="number"
                        value={convertQuote}
                        onChange={e => setConvertQuote(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs text-white"
                        placeholder="e.g. 1200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase">Initial Deposit ($)</label>
                      <input
                        type="number"
                        value={convertDeposit}
                        onChange={e => setConvertDeposit(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs text-white"
                        placeholder="e.g. 400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Initial Booking Notes</label>
                    <input
                      type="text"
                      value={convertNotes}
                      onChange={e => setConvertNotes(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs text-white"
                      placeholder="Special equipment, call sheet notes, styling requirements..."
                    />
                  </div>

                  <button
                    disabled={actionLoading}
                    onClick={handleConfirmConvert}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-xs"
                  >
                    Confirm & Create Booking Record
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-900 bg-neutral-900/40 flex items-center justify-between">
              <button
                onClick={async () => {
                  if (window.confirm(`Permanently delete inquiry ${selectedInquiry.reference}?`)) {
                    await onDeleteInquiry(selectedInquiry.id);
                  }
                }}
                className="text-red-400 hover:text-red-300 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <button
                onClick={() => onSelectInquiry(null)}
                className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 text-xs font-mono uppercase tracking-wider"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
