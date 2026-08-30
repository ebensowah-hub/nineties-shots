import React, { useState } from 'react';
import { Booking } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  AlertTriangle,
  CalendarCheck
} from 'lucide-react';

interface AdminCalendarProps {
  bookings: Booking[];
  onOpenBooking: (booking: Booking) => void;
}

export const AdminCalendar: React.FC<AdminCalendarProps> = ({ bookings, onOpenBooking }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Group bookings by date "YYYY-MM-DD"
  const bookingsByDate: Record<string, Booking[]> = {};
  bookings.forEach(b => {
    if (b.date) {
      if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
      bookingsByDate[b.date].push(b);
    }
  });

  const getDayString = (day: number): string => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const calendarCells = [];
  // Empty leading days
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 block">
            SHOOT SCHEDULE & CONFLICT DETECTION
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
            Production Calendar
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-900 px-3 py-1.5 font-mono text-xs text-white">
            <button onClick={prevMonth} className="p-1 hover:text-neutral-400">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold uppercase tracking-wider min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-1 hover:text-neutral-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-neutral-950 border border-neutral-900 overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-neutral-900 bg-neutral-900/60 text-center py-2.5 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-neutral-900">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[110px] bg-neutral-950/40 p-2" />;
            }

            const dateStr = getDayString(day);
            const dayBookings = bookingsByDate[dateStr] || [];
            const hasConflict = dayBookings.length > 1;
            const isToday =
              new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div
                key={dateStr}
                className={`min-h-[110px] p-2 transition-colors flex flex-col justify-between ${
                  isToday ? 'bg-neutral-900/30' : 'bg-neutral-950 hover:bg-neutral-900/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isToday
                        ? 'text-white bg-neutral-800 px-1.5 py-0.5 border border-neutral-700'
                        : 'text-neutral-400'
                    }`}
                  >
                    {day}
                  </span>

                  {hasConflict && (
                    <span
                      title="Multiple shoots booked on this date — check timing conflicts"
                      className="flex items-center gap-1 text-[9px] font-mono bg-amber-950 text-amber-300 px-1 border border-amber-800"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>{dayBookings.length} Shoots</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1 mt-1 overflow-y-auto max-h-[90px] scrollbar-none">
                  {dayBookings.map(b => (
                    <button
                      key={b.id}
                      onClick={() => onOpenBooking(b)}
                      className={`w-full text-left p-1.5 text-[10px] font-mono border truncate block transition-colors ${
                        b.bookingStatus === 'Confirmed'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                          : b.bookingStatus === 'Completed'
                          ? 'bg-neutral-900 text-neutral-400 border-neutral-800'
                          : b.bookingStatus === 'Cancelled'
                          ? 'bg-red-950/60 text-red-400 border-red-900 line-through'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800'
                      }`}
                    >
                      <div className="font-bold truncate">{b.clientName}</div>
                      <div className="text-[9px] text-neutral-400 truncate">
                        {b.time || '10:00 AM'} • {b.serviceTitle}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
