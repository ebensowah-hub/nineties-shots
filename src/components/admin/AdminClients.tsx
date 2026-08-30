import React, { useState } from 'react';
import { Client, Inquiry, Booking } from '../../types';
import { getAdminClientDetail } from '../../lib/api';
import {
  Users,
  Search,
  MessageSquare,
  Phone,
  Mail,
  DollarSign,
  CalendarCheck,
  Inbox,
  FileText,
  X,
  UserCheck
} from 'lucide-react';

interface AdminClientsProps {
  clients: Client[];
  onUpdateClientNotes: (id: string, notes: string) => Promise<void>;
  onOpenInquiry: (inquiry: Inquiry) => void;
  onOpenBooking: (booking: Booking) => void;
}

export const AdminClients: React.FC<AdminClientsProps> = ({
  clients,
  onUpdateClientNotes,
  onOpenInquiry,
  onOpenBooking
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientInquiries, setClientInquiries] = useState<Inquiry[]>([]);
  const [clientBookings, setClientBookings] = useState<Booking[]>([]);
  const [clientNotes, setClientNotes] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const filteredClients = clients.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.notes.toLowerCase().includes(q)
    );
  });

  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    setClientNotes(client.notes || '');
    try {
      setLoadingDetail(true);
      const res = await getAdminClientDetail(client.id);
      setClientInquiries(res.inquiries || []);
      setClientBookings(res.bookings || []);
    } catch (err) {
      console.error('Failed to load client details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    try {
      setSavingNotes(true);
      await onUpdateClientNotes(selectedClient.id, clientNotes);
    } finally {
      setSavingNotes(false);
    }
  };

  const getCleanPhone = (phoneStr: string) => {
    return (phoneStr || '').replace(/[^0-9]/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 block">
            CLIENT RELATIONSHIP DIRECTORY (CRM)
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
            Client Profiles
          </h1>
        </div>

        <div className="text-xs font-mono text-neutral-400">
          Total Clients: <span className="text-white font-bold">{clients.length}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Search clients by name, email, phone, or notes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white font-mono"
        />
      </div>

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <div className="p-16 bg-neutral-950 border border-neutral-900 text-center space-y-3">
          <Users className="w-10 h-10 mx-auto text-neutral-600 stroke-[1.2]" />
          <h3 className="text-sm font-mono text-neutral-300 uppercase tracking-wider">
            No client records found.
          </h3>
          <p className="text-xs font-mono text-neutral-500">
            Clients are automatically deduplicated and created whenever inquiries or bookings are submitted.
          </p>
        </div>
      ) : (
        <div className="bg-neutral-950 border border-neutral-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-900/60 border-b border-neutral-900 text-neutral-500 uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Inquiries</th>
                  <th className="py-3 px-4">Completed Shoots</th>
                  <th className="py-3 px-4">Total Revenue</th>
                  <th className="py-3 px-4">Added On</th>
                  <th className="py-3 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredClients.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    className="hover:bg-neutral-900/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-white font-bold">{c.name}</td>
                    <td className="py-3 px-4 text-neutral-400">
                      <div>{c.phone || 'No phone'}</div>
                      <div className="text-[10px] text-neutral-500">{c.email}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-300">{c.inquiriesCount}</td>
                    <td className="py-3 px-4 text-neutral-300">{c.completedShootsCount}</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">
                      {c.totalRevenue > 0 ? `$${c.totalRevenue.toLocaleString()}` : '$0'}
                    </td>
                    <td className="py-3 px-4 text-neutral-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleSelectClient(c);
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

      {/* Client Profile Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-neutral-900 flex items-start justify-between bg-neutral-900/40">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                  CLIENT DOSSIER
                </span>
                <h2 className="text-xl font-heading text-white uppercase tracking-wide">
                  {selectedClient.name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
              {/* Contact Actions */}
              <div className="flex flex-wrap gap-2 p-3 bg-neutral-900/60 border border-neutral-900">
                {selectedClient.phone && (
                  <>
                    <a
                      href={`https://wa.me/${getCleanPhone(selectedClient.phone)}?text=${encodeURIComponent(
                        `Hello ${selectedClient.name}, checking in from NINETIES SHOTS.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp {selectedClient.phone}</span>
                    </a>

                    <a
                      href={`tel:${selectedClient.phone}`}
                      className="px-3 py-1.5 bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Client</span>
                    </a>
                  </>
                )}

                {selectedClient.email && (
                  <a
                    href={`mailto:${selectedClient.email}`}
                    className="px-3 py-1.5 bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Client</span>
                  </a>
                )}
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-neutral-900/40 border border-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase">LIFETIME REVENUE</span>
                  <div className="text-emerald-400 text-lg font-bold">
                    ${selectedClient.totalRevenue.toLocaleString()}
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-900/40 border border-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase">COMPLETED SHOOTS</span>
                  <div className="text-white text-lg font-bold">
                    {selectedClient.completedShootsCount}
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-900/40 border border-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase">TOTAL INQUIRIES</span>
                  <div className="text-white text-lg font-bold">
                    {selectedClient.inquiriesCount}
                  </div>
                </div>
              </div>

              {/* Private Notes */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>CLIENT PREFERENCES & PRIVATE NOTES</span>
                </span>
                <textarea
                  rows={3}
                  value={clientNotes}
                  onChange={e => setClientNotes(e.target.value)}
                  placeholder="Preferences, favorite lighting styles, VIP client tags, billing notes..."
                  className="w-full bg-neutral-900 border border-neutral-800 p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white font-mono"
                />
                <button
                  disabled={savingNotes}
                  onClick={handleSaveNotes}
                  className="px-4 py-1.5 bg-white text-black font-bold uppercase text-[10px] tracking-wider"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>

              {/* Associated Bookings History */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block">
                  BOOKINGS & SHOOT HISTORY ({clientBookings.length})
                </span>

                {clientBookings.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">No bookings recorded for this client yet.</p>
                ) : (
                  <div className="space-y-2">
                    {clientBookings.map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedClient(null);
                          onOpenBooking(b);
                        }}
                        className="p-3 bg-neutral-900/40 border border-neutral-900 hover:border-neutral-700 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="text-white font-semibold">{b.serviceTitle} ({b.bookingReference})</div>
                          <div className="text-[10px] text-neutral-500">{b.date} • Location: {b.location}</div>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-900 text-neutral-300 border border-neutral-800">
                          {b.bookingStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Associated Inquiries */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block">
                  INQUIRIES SUBMITTED ({clientInquiries.length})
                </span>

                {clientInquiries.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">No inquiries recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {clientInquiries.map(i => (
                      <div
                        key={i.id}
                        onClick={() => {
                          setSelectedClient(null);
                          onOpenInquiry(i);
                        }}
                        className="p-3 bg-neutral-900/40 border border-neutral-900 hover:border-neutral-700 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="text-white font-semibold">{i.shootType} ({i.reference})</div>
                          <div className="text-[10px] text-neutral-500">{new Date(i.submittedAt).toLocaleDateString()}</div>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-900 text-neutral-300 border border-neutral-800">
                          {i.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-900 bg-neutral-900/40 flex justify-end">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 text-xs font-mono uppercase tracking-wider"
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
