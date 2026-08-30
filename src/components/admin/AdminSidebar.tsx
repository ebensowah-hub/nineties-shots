import React from 'react';
import { AdminUser } from '../../types';
import {
  LayoutDashboard,
  Inbox,
  CalendarCheck,
  Calendar,
  Users,
  Image as ImageIcon,
  Briefcase,
  BarChart3,
  Settings,
  History,
  LogOut,
  ExternalLink,
  X,
  Camera
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'inquiries'
  | 'bookings'
  | 'calendar'
  | 'clients'
  | 'portfolio'
  | 'services'
  | 'analytics'
  | 'settings'
  | 'audit';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  adminUser?: AdminUser | null;
  pendingInquiriesCount?: number;
  upcomingBookingsCount?: number;
  onLogout: () => void;
  onViewWebsite: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  adminUser,
  pendingInquiriesCount = 0,
  upcomingBookingsCount = 0,
  onLogout,
  onViewWebsite,
  mobileOpen = false,
  onCloseMobile = () => {}
}) => {
  const menuItems: { id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inquiries', label: 'Inquiries', icon: Inbox, badge: pendingInquiriesCount },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'calendar', label: 'Schedule', icon: Calendar },
    { id: 'clients', label: 'Clients (CRM)', icon: Users },
    { id: 'portfolio', label: 'Portfolio', icon: ImageIcon },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'audit', label: 'Activity Log', icon: History }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#090909] border-r border-neutral-900 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="p-6 border-b border-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold font-heading text-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                NINETIES SHOTS
              </h2>
              <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase block">
                ADMIN CONTROL
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden text-neutral-500 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-none">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors text-left ${
                  isActive
                    ? 'bg-white text-black font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded-none ${
                      isActive ? 'bg-black text-white' : 'bg-red-900/90 text-red-200 border border-red-700/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions & User Profile */}
        <div className="p-4 border-t border-neutral-900 space-y-3 bg-[#060606]">
          {/* Quick View Website Link */}
          <button
            onClick={onViewWebsite}
            className="w-full py-2 px-3 border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <span>Live Website</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </button>

          {/* User & Logout */}
          <div className="pt-2 flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-[11px] font-mono font-medium text-white truncate block">
                {adminUser?.name || adminUser?.username || 'Admin'}
              </span>
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">
                Role: {adminUser?.role || 'owner'}
              </span>
            </div>

            <button
              onClick={onLogout}
              title="Log out"
              className="p-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
