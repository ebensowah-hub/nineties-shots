import {
  InquiryFormData,
  Inquiry,
  Booking,
  Client,
  AdminUser,
  DashboardStats,
  PortfolioItem,
  ServiceItem,
  SiteConfig,
  AuditLog,
  InquiryStatus,
  BookingStatus,
  PaymentStatus
} from '../types';

const TOKEN_STORAGE_KEY = 'ninetiesshots_admin_token';

export function getStoredAdminToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredAdminToken(token: string, remember: boolean = true): void {
  if (remember) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

export function clearStoredAdminToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// ==================== PUBLIC API ====================
export async function submitInquiry(formData: {
  clientName: string;
  email: string;
  phone?: string;
  shootType: string;
  preferredDate?: string;
  location?: string;
  budgetRange?: string;
  message: string;
}): Promise<{ success: boolean; reference: string; inquiry?: Inquiry }> {
  const res = await fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Submission failed' }));
    throw new Error(errorData.error || 'Failed to submit project inquiry.');
  }

  return res.json();
}

export async function getPublicData(): Promise<{
  portfolio: PortfolioItem[];
  services: ServiceItem[];
  settings: any;
}> {
  try {
    const [pRes, sRes, cRes] = await Promise.all([
      fetch('/api/public/portfolio'),
      fetch('/api/public/services'),
      fetch('/api/public/config')
    ]);

    const portfolio = pRes.ok ? await pRes.json() : [];
    const services = sRes.ok ? await sRes.json() : [];
    const settings = cRes.ok ? await cRes.json() : null;

    return { portfolio, services, settings };
  } catch (err) {
    return { portfolio: [], services: [], settings: null };
  }
}

export async function fetchPublicConfig(): Promise<Partial<SiteConfig>> {
  const res = await fetch('/api/public/config');
  if (!res.ok) throw new Error('Failed to load public config');
  return res.json();
}

export async function fetchPublicPortfolio(): Promise<PortfolioItem[]> {
  const res = await fetch('/api/public/portfolio');
  if (!res.ok) throw new Error('Failed to load portfolio');
  return res.json();
}

export async function fetchPublicServices(): Promise<ServiceItem[]> {
  const res = await fetch('/api/public/services');
  if (!res.ok) throw new Error('Failed to load services');
  return res.json();
}

export async function trackEvent(
  eventType: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, metadata })
    });
  } catch {
    // Silent
  }
}

export const trackAnalyticsEvent = trackEvent;

// ==================== ADMIN AUTH ====================
export async function loginAdmin(
  username: string,
  password: string,
  remember: boolean = true
): Promise<{ user: AdminUser; token: string }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Invalid login credentials' }));
    throw new Error(err.error || 'Authentication failed');
  }

  const data = await res.json();
  setStoredAdminToken(data.token, remember);
  return data;
}

export async function adminLogout(): Promise<void> {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } finally {
    clearStoredAdminToken();
  }
}

export const logoutAdmin = adminLogout;

export async function checkAdminAuthSession(): Promise<{ authenticated: boolean; user?: AdminUser }> {
  const token = getStoredAdminToken();
  if (!token) return { authenticated: false };

  try {
    const res = await fetch('/api/admin/me', {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      clearStoredAdminToken();
      return { authenticated: false };
    }

    const data = await res.json();
    return { authenticated: true, user: data.user };
  } catch {
    return { authenticated: false };
  }
}

export async function getAdminMe(): Promise<{ user: AdminUser } | null> {
  const res = await checkAdminAuthSession();
  return res.user ? { user: res.user } : null;
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; token?: string; user?: AdminUser }> {
  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update password' }));
    throw new Error(err.error || 'Password update failed');
  }

  const data = await res.json();
  if (data.token) {
    setStoredAdminToken(data.token, true);
  }
  return data;
}

// ==================== ADMIN DASHBOARD ====================
export async function getAdminDashboard(): Promise<{
  stats: DashboardStats;
  recentInquiries: Inquiry[];
  upcomingBookings: Booking[];
}> {
  const res = await fetch('/api/admin/dashboard', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load dashboard data');
  return res.json();
}

export const getDashboardData = getAdminDashboard;

// ==================== INQUIRIES ====================
export async function getAdminInquiries(search?: string, status?: string): Promise<{ inquiries: Inquiry[] }> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);

  const res = await fetch(`/api/admin/inquiries?${params.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load inquiries');
  const data = await res.json();
  return Array.isArray(data) ? { inquiries: data } : data;
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
  const res = await fetch(`/api/admin/inquiries/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update inquiry status');
  return res.json();
}

export async function updateInquiryNotes(id: string, notes: string): Promise<Inquiry> {
  const res = await fetch(`/api/admin/inquiries/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes })
  });
  if (!res.ok) throw new Error('Failed to update inquiry notes');
  return res.json();
}

export async function updateAdminInquiry(id: string, updates: Partial<Inquiry>): Promise<Inquiry> {
  const res = await fetch(`/api/admin/inquiries/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update inquiry');
  return res.json();
}

export async function convertInquiryToBooking(
  id: string,
  quoteAmount: number = 0,
  depositAmount: number = 0,
  notes?: string
): Promise<{ success: boolean; booking: Booking }> {
  const res = await fetch(`/api/admin/inquiries/${id}/convert-booking`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ quoteAmount, depositAmount, notes })
  });
  if (!res.ok) throw new Error('Failed to convert inquiry to booking');
  return res.json();
}

export async function deleteInquiry(id: string): Promise<void> {
  const res = await fetch(`/api/admin/inquiries/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete inquiry');
}

export const deleteAdminInquiry = deleteInquiry;

// ==================== BOOKINGS ====================
export async function getAdminBookings(search?: string, status?: string): Promise<{ bookings: Booking[] }> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);

  const res = await fetch(`/api/admin/bookings?${params.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load bookings');
  const data = await res.json();
  return Array.isArray(data) ? { bookings: data } : data;
}

export async function createAdminBooking(bookingData: Partial<Booking>): Promise<Booking> {
  const res = await fetch('/api/admin/bookings', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(bookingData)
  });
  if (!res.ok) throw new Error('Failed to create booking');
  return res.json();
}

export async function updateAdminBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update booking');
  return res.json();
}

export async function deleteAdminBooking(id: string): Promise<void> {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete booking');
}

// ==================== CLIENTS ====================
export async function getAdminClients(search?: string): Promise<{ clients: Client[] }> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);

  const res = await fetch(`/api/admin/clients?${params.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load clients');
  const data = await res.json();
  return Array.isArray(data) ? { clients: data } : data;
}

export async function getAdminClientDetail(id: string): Promise<{ client: Client; inquiries: Inquiry[]; bookings: Booking[] }> {
  const res = await fetch(`/api/admin/clients/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load client details');
  return res.json();
}

export async function updateClientNotes(id: string, notes: string): Promise<Client> {
  const res = await fetch(`/api/admin/clients/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes })
  });
  if (!res.ok) throw new Error('Failed to update client profile');
  return res.json();
}

export async function updateAdminClient(id: string, updates: Partial<Client>): Promise<Client> {
  const res = await fetch(`/api/admin/clients/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update client profile');
  return res.json();
}

// ==================== PORTFOLIO ====================
export async function getAdminPortfolio(): Promise<{ portfolio: PortfolioItem[] }> {
  const res = await fetch('/api/admin/portfolio', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load portfolio');
  const data = await res.json();
  return Array.isArray(data) ? { portfolio: data } : data;
}

export async function createPortfolioItem(item: Partial<PortfolioItem>): Promise<PortfolioItem> {
  const res = await fetch('/api/admin/portfolio', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Failed to add portfolio image');
  return res.json();
}

export const addAdminPortfolioItem = createPortfolioItem;

export async function updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem> {
  const res = await fetch(`/api/admin/portfolio/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update photograph');
  return res.json();
}

export const updateAdminPortfolioItem = updatePortfolioItem;

export async function deletePortfolioItem(id: string): Promise<void> {
  const res = await fetch(`/api/admin/portfolio/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete photograph');
}

export const deleteAdminPortfolioItem = deletePortfolioItem;

export async function setHeroPortfolioItem(id: string): Promise<void> {
  const res = await fetch(`/api/admin/portfolio/${id}/set-hero`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to set hero photograph');
}

export const setHeroPhotograph = setHeroPortfolioItem;

export async function setPhotographerPortrait(url: string, alt?: string): Promise<void> {
  const res = await fetch('/api/admin/portfolio/portrait', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ url, alt })
  });
  if (!res.ok) throw new Error('Failed to set photographer portrait');
}

// ==================== SERVICES ====================
export async function getAdminServices(): Promise<{ services: ServiceItem[] }> {
  const res = await fetch('/api/admin/services', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load services');
  const data = await res.json();
  return Array.isArray(data) ? { services: data } : data;
}

export async function createAdminService(service: Partial<ServiceItem>): Promise<ServiceItem> {
  const res = await fetch('/api/admin/services', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(service)
  });
  if (!res.ok) throw new Error('Failed to add service');
  return res.json();
}

export const addAdminService = createAdminService;

export async function updateAdminService(id: string, updates: Partial<ServiceItem>): Promise<ServiceItem> {
  const res = await fetch(`/api/admin/services/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update service');
  return res.json();
}

export async function deleteAdminService(id: string): Promise<void> {
  const res = await fetch(`/api/admin/services/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete service');
}

// ==================== SETTINGS ====================
export async function getAdminSettings(): Promise<{ settings: any }> {
  const res = await fetch('/api/admin/settings', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load settings');
  const data = await res.json();
  return data.settings ? data : { settings: data };
}

export async function updateAdminSettings(settings: Partial<any>): Promise<{ settings: any }> {
  const res = await fetch('/api/admin/settings', {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

// ==================== ANALYTICS & AUDIT ====================
export async function getAdminAnalytics(): Promise<{ analytics: any }> {
  const res = await fetch('/api/admin/analytics', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load analytics');
  const data = await res.json();
  return data.analytics ? data : { analytics: data };
}

export async function getAdminAuditLogs(): Promise<{ logs: AuditLog[] }> {
  const res = await fetch('/api/admin/audit-logs', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load activity logs');
  const data = await res.json();
  return Array.isArray(data) ? { logs: data } : data;
}

// ==================== CURRENCY CONVERSION ====================
export async function getExchangeRates(base?: string): Promise<{
  targetCurrency: 'GHS';
  targetSymbol: 'GH₵';
  rates: Record<string, { rate: number; isLive: boolean; lastUpdated: string; provider: string; error?: string }>;
  supportedCurrencies: { code: string; name: string; symbol: string; flag: string }[];
}> {
  const url = base ? `/api/admin/currency/rates?base=${encodeURIComponent(base)}` : '/api/admin/currency/rates';
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch rates' }));
    throw new Error(err.error || 'Failed to fetch exchange rates');
  }
  return res.json();
}

export async function convertCurrencyAdmin(
  amount: number,
  fromCurrency: string,
  manualRate?: number,
  note?: string
): Promise<{
  success: boolean;
  conversion: any;
  formattedOriginal: string;
  formattedGHS: string;
}> {
  const res = await fetch('/api/admin/currency/convert', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount, fromCurrency, manualRate, note })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Exchange rate unavailable');
  }

  return data;
}

export async function getConversionHistory(): Promise<any[]> {
  const res = await fetch('/api/admin/currency/history', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load conversion history');
  return res.json();
}

export async function clearConversionHistory(): Promise<void> {
  const res = await fetch('/api/admin/currency/history/clear', {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to clear conversion history');
}
