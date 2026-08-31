import React, { useState, useEffect } from 'react';
import {
  AdminUser,
  AdminTab,
  Inquiry,
  Booking,
  Client,
  PortfolioItem,
  ServiceItem,
  DashboardStats,
  AuditLog,
  InquiryStatus
} from '../../types';
import {
  getAdminDashboard,
  getAdminInquiries,
  updateInquiryStatus,
  updateInquiryNotes,
  convertInquiryToBooking,
  deleteInquiry,
  getAdminBookings,
  createAdminBooking,
  updateAdminBooking,
  deleteAdminBooking,
  getAdminClients,
  updateClientNotes,
  getAdminPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  setHeroPortfolioItem,
  getAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  getAdminSettings,
  updateAdminSettings,
  getAdminAnalytics,
  getAdminAuditLogs,
  adminLogout
} from '../../lib/api';
import { AdminSidebar } from './AdminSidebar';
import { AdminDashboard } from './AdminDashboard';
import { AdminInquiries } from './AdminInquiries';
import { AdminBookings } from './AdminBookings';
import { AdminCalendar } from './AdminCalendar';
import { AdminClients } from './AdminClients';
import { AdminPortfolio } from './AdminPortfolio';
import { AdminServices } from './AdminServices';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminSettings } from './AdminSettings';
import { AdminAuditLog } from './AdminAuditLog';
import { MustChangePasswordModal } from './MustChangePasswordModal';
import { Loader2, RefreshCw, Eye, Menu } from 'lucide-react';

interface AdminLayoutProps {
  user: AdminUser;
  onLogout: () => void;
  onViewPublicSite: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ user, onLogout, onViewPublicSite }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser>(user);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Core Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Selection states for cross-navigation
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCreatingNewBooking, setIsCreatingNewBooking] = useState(false);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [
        dashboardData,
        inquiriesData,
        bookingsData,
        clientsData,
        portfolioData,
        servicesData,
        settingsData,
        analyticsData,
        auditData
      ] = await Promise.all([
        getAdminDashboard(),
        getAdminInquiries(),
        getAdminBookings(),
        getAdminClients(),
        getAdminPortfolio(),
        getAdminServices(),
        getAdminSettings(),
        getAdminAnalytics(),
        getAdminAuditLogs()
      ]);

      setStats(dashboardData.stats);
      setInquiries(inquiriesData.inquiries || []);
      setBookings(bookingsData.bookings || []);
      setClients(clientsData.clients || []);
      setPortfolio(portfolioData.portfolio || []);
      setServices(servicesData.services || []);
      setSettings(settingsData.settings || null);
      setAnalytics(analyticsData.analytics || null);
      setAuditLogs(auditData.logs || []);
    } catch (err) {
      console.error('Failed to load admin portal data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLogout = async () => {
    try {
      await adminLogout();
    } finally {
      onLogout();
    }
  };

  // Inquiry Operations
  const handleUpdateInquiryStatus = async (id: string, status: InquiryStatus) => {
    await updateInquiryStatus(id, status);
    await loadAllData();
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleUpdateInquiryNotes = async (id: string, notes: string) => {
    await updateInquiryNotes(id, notes);
    await loadAllData();
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry(prev => prev ? { ...prev, notes } : null);
    }
  };

  const handleConvertToBooking = async (id: string, quote: number, deposit: number, notes: string) => {
    await convertInquiryToBooking(id, quote, deposit, notes);
    await loadAllData();
    setSelectedInquiry(null);
    setActiveTab('bookings');
  };

  const handleDeleteInquiry = async (id: string) => {
    await deleteInquiry(id);
    await loadAllData();
    setSelectedInquiry(null);
  };

  // Booking Operations
  const handleCreateBooking = async (data: Partial<Booking>) => {
    await createAdminBooking(data);
    await loadAllData();
    setIsCreatingNewBooking(false);
  };

  const handleUpdateBooking = async (id: string, updates: Partial<Booking>) => {
    await updateAdminBooking(id, updates);
    await loadAllData();
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    await deleteAdminBooking(id);
    await loadAllData();
    setSelectedBooking(null);
  };

  // Client Operations
  const handleUpdateClientNotes = async (id: string, notes: string) => {
    await updateClientNotes(id, notes);
    await loadAllData();
  };

  // Portfolio Operations
  const handleAddPhoto = async (item: Partial<PortfolioItem>) => {
    await createPortfolioItem(item);
    await loadAllData();
  };

  const handleUpdatePhoto = async (id: string, updates: Partial<PortfolioItem>) => {
    await updatePortfolioItem(id, updates);
    await loadAllData();
  };

  const handleDeletePhoto = async (id: string) => {
    await deletePortfolioItem(id);
    await loadAllData();
  };

  const handleSetHero = async (id: string) => {
    await setHeroPortfolioItem(id);
    await loadAllData();
  };

  const handleSetPortrait = async (url: string) => {
    await updateAdminSettings({ photographerPortrait: url });
    await loadAllData();
  };

  // Services Operations
  const handleAddService = async (service: Partial<ServiceItem>) => {
    await createAdminService(service);
    await loadAllData();
  };

  const handleUpdateService = async (id: string, updates: Partial<ServiceItem>) => {
    await updateAdminService(id, updates);
    await loadAllData();
  };

  const handleDeleteService = async (id: string) => {
    await deleteAdminService(id);
    await loadAllData();
  };

  // Settings Operations
  const handleUpdateSettings = async (newSettings: any) => {
    await updateAdminSettings(newSettings);
    await loadAllData();
  };

  const pendingInquiriesCount = inquiries.filter(i => i.status === 'New').length;
  const upcomingBookingsCount = bookings.filter(b => b.bookingStatus === 'Confirmed').length;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row antialiased selection:bg-white selection:text-black">
      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        adminUser={user}
        currentTab={activeTab}
        onSelectTab={tab => {
          setActiveTab(tab);
          if (tab !== 'inquiries') setSelectedInquiry(null);
          if (tab !== 'bookings') setSelectedBooking(null);
        }}
        onLogout={handleLogout}
        onViewWebsite={onViewPublicSite}
        pendingInquiriesCount={pendingInquiriesCount}
        upcomingBookingsCount={upcomingBookingsCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-950/60 overflow-y-auto lg:pl-64">
        {/* Top Operational Bar */}
        <header className="h-16 border-b border-neutral-900 px-6 flex items-center justify-between bg-black/40 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 text-neutral-400 hover:text-white border border-neutral-800 rounded bg-neutral-900"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              NINETIES SHOTS
            </span>
            <span className="text-neutral-700">/</span>
            <span className="text-xs font-mono uppercase tracking-widest text-white font-semibold">
              {activeTab}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={refreshing}
              title="Refresh all business data"
              className="p-2 text-neutral-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-white' : ''}`} />
            </button>

            <button
              onClick={onViewPublicSite}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono uppercase tracking-wider border border-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Website</span>
            </button>
          </div>
        </header>

        {/* Content Views */}
        <div className="p-6 md:p-8 flex-1">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
              <span>SYNCHRONIZING CONTROL CENTER...</span>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboard
                  stats={stats}
                  recentInquiries={inquiries.slice(0, 5)}
                  upcomingBookings={bookings.slice(0, 5)}
                  onOpenInquiry={inq => {
                    setSelectedInquiry(inq);
                    setActiveTab('inquiries');
                  }}
                  onOpenBooking={booking => {
                    setSelectedBooking(booking);
                    setActiveTab('bookings');
                  }}
                  onNewBooking={() => {
                    setIsCreatingNewBooking(true);
                    setActiveTab('bookings');
                  }}
                  onNavigateTab={tab => setActiveTab(tab)}
                />
              )}

              {activeTab === 'inquiries' && (
                <AdminInquiries
                  inquiries={inquiries}
                  selectedInquiry={selectedInquiry}
                  onSelectInquiry={setSelectedInquiry}
                  onUpdateStatus={handleUpdateInquiryStatus}
                  onUpdateNotes={handleUpdateInquiryNotes}
                  onConvertToBooking={handleConvertToBooking}
                  onDeleteInquiry={handleDeleteInquiry}
                />
              )}

              {activeTab === 'bookings' && (
                <AdminBookings
                  bookings={bookings}
                  selectedBooking={selectedBooking}
                  onSelectBooking={setSelectedBooking}
                  onCreateBooking={handleCreateBooking}
                  onUpdateBooking={handleUpdateBooking}
                  onDeleteBooking={handleDeleteBooking}
                  isCreatingNew={isCreatingNewBooking}
                  onCloseCreateNew={() => setIsCreatingNewBooking(false)}
                />
              )}

              {activeTab === 'calendar' && (
                <AdminCalendar
                  bookings={bookings}
                  onOpenBooking={b => {
                    setSelectedBooking(b);
                    setActiveTab('bookings');
                  }}
                />
              )}

              {activeTab === 'clients' && (
                <AdminClients
                  clients={clients}
                  onUpdateClientNotes={handleUpdateClientNotes}
                  onOpenInquiry={inq => {
                    setSelectedInquiry(inq);
                    setActiveTab('inquiries');
                  }}
                  onOpenBooking={b => {
                    setSelectedBooking(b);
                    setActiveTab('bookings');
                  }}
                />
              )}

              {activeTab === 'portfolio' && (
                <AdminPortfolio
                  portfolio={portfolio}
                  onAddPhoto={handleAddPhoto}
                  onUpdatePhoto={handleUpdatePhoto}
                  onDeletePhoto={handleDeletePhoto}
                  onSetHero={handleSetHero}
                  onSetPortrait={handleSetPortrait}
                />
              )}

              {activeTab === 'services' && (
                <AdminServices
                  services={services}
                  onAddService={handleAddService}
                  onUpdateService={handleUpdateService}
                  onDeleteService={handleDeleteService}
                />
              )}

              {activeTab === 'analytics' && (
                <AdminAnalytics
                  analytics={analytics}
                  totalInquiries={inquiries.length}
                />
              )}

              {activeTab === 'settings' && (
                <AdminSettings
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              )}

              {activeTab === 'audit' && (
                <AdminAuditLog logs={auditLogs} />
              )}
            </>
          )}

          {currentUser.mustChangePassword && (
            <MustChangePasswordModal
              user={currentUser}
              onPasswordChanged={updatedUser => setCurrentUser(updatedUser)}
            />
          )}
        </div>
      </main>
    </div>
  );
};
