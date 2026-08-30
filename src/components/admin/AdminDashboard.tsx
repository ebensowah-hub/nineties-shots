import React from 'react';
import { DashboardStats, Inquiry, Booking } from '../../types';
import { AdminTab } from './AdminSidebar';
import {
  Inbox,
  CalendarCheck,
  Clock,
  CheckCircle2,
  DollarSign,
  Users,
  Image as ImageIcon,
  ArrowRight,
  MessageSquare,
  Phone,
  Calendar,
  AlertCircle,
  PlusCircle
} from 'lucide-react';

interface AdminDashboardProps {
  stats: DashboardStats;
  recentInquiries: Inquiry[];
  upcomingBookings: Booking[];
  onNavigateTab: (tab: AdminTab) => void;
  onOpenInquiry: (inquiry: Inquiry) => void;
  onOpenBooking: (booking: Booking) => void;
  onNewBooking: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  recentInquiries,
  upcomingBookings,
  onNavigateTab,
  onOpenInquiry,
  onOpenBooking,
  onNewBooking
}) => {
  const statCards = [
    {
      label: 'TOTAL INQUIRIES',
      value: stats.totalInquiries,
      sub: `${stats.pendingInquiries} awaiting response`,
      icon: Inbox,
      tab: 'inquiries' as AdminTab,
      highlight: stats.pendingInquiries > 0
    },
    {
      label: 'ACTIVE BOOKINGS',
      value: stats.activeBookings,
      sub: 'Confirmed & scheduled shoots',
      icon: CalendarCheck,
      tab: 'bookings' as AdminTab
    },
    {
      label: 'PENDING INQUIRIES',
      value: stats.pendingInquiries,
      sub: 'Action required',
      icon: Clock,
      tab: 'inquiries' as AdminTab,
      highlight: stats.pendingInquiries > 0
    },
    {
      label: 'COMPLETED SHOOTS',
      value: stats.completedShoots,
      sub: 'Delivered commissions',
      icon: CheckCircle2,
      tab: 'bookings' as AdminTab
    },
    {
      label: 'RECORDED REVENUE',
      value: stats.totalRevenue > 0 ? `$${stats.totalRevenue.toLocaleString()}` : '$0',
      sub: `Paid: $${stats.paidRevenue.toLocaleString()} // Unpaid: $${stats.outstandingRevenue.toLocaleString()}`,
      icon: DollarSign,
      tab: 'bookings' as AdminTab
    },
    {
      label: 'TOTAL CLIENTS',
      value: stats.totalClients,
      sub: 'Unique client records',
      icon: Users,
      tab: 'clients' as AdminTab
    },
    {
      label: 'PUBLISHED PORTFOLIO',
      value: stats.publishedPortfolioCount,
      sub: 'Active live photographs',
      icon: ImageIcon,
      tab: 'portfolio' as AdminTab
    }
  ];

  return (
    <div className="space-y-10">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 block">
            CONTROL CENTER OVERVIEW
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
            Business Operations
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNewBooking}
            className="px-4 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Booking</span>
          </button>
        </div>
      </div>

      {/* 7 Core Business Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab(card.tab)}
              className={`p-5 bg-neutral-950 border transition-all cursor-pointer group flex flex-col justify-between ${
                card.highlight
                  ? 'border-neutral-700 hover:border-white bg-neutral-900/40'
                  : 'border-neutral-900 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
              </div>

              <div className="py-3">
                <div className="text-2xl sm:text-3xl font-heading font-light text-white tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] font-mono text-neutral-400 mt-1 truncate">
                  {card.sub}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-900/60 flex items-center justify-between text-[10px] font-mono text-neutral-500 group-hover:text-neutral-300">
                <span>VIEW DETAILS</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Inquiries & Upcoming Shoots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Inquiries Queue */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                LATEST INQUIRIES
              </span>
              {stats.pendingInquiries > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-mono bg-red-950/80 text-red-300 border border-red-800/80">
                  {stats.pendingInquiries} Pending
                </span>
              )}
            </div>

            <button
              onClick={() => onNavigateTab('inquiries')}
              className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <span>All Inquiries</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentInquiries.length === 0 ? (
            <div className="p-8 bg-neutral-950 border border-neutral-900 text-center space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-neutral-600 stroke-[1.2]" />
              <p className="text-xs font-mono text-neutral-400">No inquiries received yet.</p>
              <p className="text-[11px] font-mono text-neutral-600">
                Inquiries submitted on the website will instantly appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map(inq => {
                const isNew = inq.status === 'New';
                return (
                  <div
                    key={inq.id}
                    onClick={() => onOpenInquiry(inq)}
                    className="p-4 bg-neutral-950 border border-neutral-900 hover:border-neutral-700 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white group-hover:text-neutral-200">
                          {inq.clientName}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-1.5 py-0.2 border border-neutral-800">
                          {inq.reference}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 font-light truncate max-w-sm">
                        {inq.shootType} • {inq.location || 'Location TBD'}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        {new Date(inq.submittedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 border ${
                          isNew
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                            : inq.status === 'Confirmed'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        {inq.status}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Bookings Timeline */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              UPCOMING SHOOTS
            </span>

            <button
              onClick={() => onNavigateTab('bookings')}
              className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <span>View Schedule</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="p-8 bg-neutral-950 border border-neutral-900 text-center space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-neutral-600 stroke-[1.2]" />
              <p className="text-xs font-mono text-neutral-400">No scheduled bookings yet.</p>
              <p className="text-[11px] font-mono text-neutral-600">
                Confirmed shoots and calendar entries will be listed here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(booking => (
                <div
                  key={booking.id}
                  onClick={() => onOpenBooking(booking)}
                  className="p-4 bg-neutral-950 border border-neutral-900 hover:border-neutral-700 transition-colors cursor-pointer group space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xs font-semibold text-white">
                        {booking.clientName}
                      </div>
                      <div className="text-xs text-neutral-400 font-light">
                        {booking.serviceTitle}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-900 text-neutral-300 border border-neutral-800">
                      {booking.bookingStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-900">
                    <span>
                      {booking.date} {booking.time ? `• ${booking.time}` : ''}
                    </span>
                    <span className="text-neutral-300">
                      {booking.quoteAmount > 0 ? `$${booking.quoteAmount}` : 'Quote TBD'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
