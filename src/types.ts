export type CategorySlug =
  | 'all'
  | 'portraits'
  | 'lifestyle'
  | 'photo-shoots'
  | (string & {});

export interface CameraMetadata {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: CategorySlug;
  categoryLabel: string;
  image: string;
  thumbnail: string;
  alt: string;
  location?: string;
  date?: string;
  description?: string;
  featured?: boolean;
  orientation?: 'portrait' | 'landscape' | 'square';
  aspectRatio?: string;
  cameraSettings?: CameraMetadata;
}

export interface PortfolioCategory {
  id: CategorySlug;
  name: string;
  description: string;
  count?: number;
}

export interface ServiceItem {
  id: string;
  title: string;
  category: CategorySlug;
  tagline: string;
  description: string;
  highlights: string[];
  deliverables: string[];
  sampleImage: string;
  priceAmount?: number; // Canonical GHS price
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  rateType?: 'live' | 'manual' | 'manual-flagged';
  quoteRangeText?: string;
}

export type SupportedCurrency = 'GHS' | 'USD' | 'GBP' | 'EUR' | 'NGN' | string;

export interface CurrencyConversionRecord {
  id: string;
  originalAmount: number;
  originalCurrency: string;
  exchangeRate: number;
  convertedAmount: number; // in GHS
  convertedCurrency: 'GHS';
  rateType: 'live' | 'manual' | 'manual-flagged';
  provider: string;
  convertedAt: string;
  note?: string;
}

export interface ExchangeRateInfo {
  baseCurrency: string;
  targetCurrency: 'GHS';
  rate: number;
  lastUpdated: string;
  provider: string;
  isLive: boolean;
  error?: string;
}

export interface SocialLink {
  platform: 'instagram' | 'tiktok' | 'x' | 'facebook' | 'whatsapp' | 'behance';
  label: string;
  url: string;
}

export interface ContactConfig {
  email: string;
  phone?: string;
  whatsappNumber: string; // Centrally configured WhatsApp number (e.g., "+1234567890")
  whatsappDefaultMessage: string;
  location: string;
  availabilityNotice: string;
}

export interface SiteConfig {
  brandName: string;
  tagline: string;
  manifesto: {
    headline: string;
    subheadline: string;
    paragraphs: string[];
  };
  copyrightYear: number;
  contact: ContactConfig;
  socials: SocialLink[];
}

export interface InquiryFormData {
  fullName: string;
  email: string;
  phoneOrWhatsapp: string;
  shootType: string;
  preferredDate: string;
  location: string;
  budgetRange?: string;
  message: string;
}

export type InquiryStatus =
  | 'New'
  | 'Contacted'
  | 'Quoted'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled'
  | 'Archived';

export interface Inquiry {
  id: string;
  reference: string;
  clientName: string;
  email: string;
  phone: string;
  shootType: string;
  preferredDate: string;
  location: string;
  budgetRange: string;
  message: string;
  submittedAt: string;
  status: InquiryStatus;
  notes: string;
  clientId: string;
  convertedBookingId?: string | null;
}

export type BookingStatus =
  | 'Inquiry'
  | 'Quoted'
  | 'Awaiting Deposit'
  | 'Confirmed'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type PaymentStatus =
  | 'Not Set'
  | 'Unpaid'
  | 'Deposit Paid'
  | 'Partially Paid'
  | 'Paid'
  | 'Refunded';

export interface Booking {
  id: string;
  bookingReference: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId?: string;
  serviceTitle: string;
  date: string;
  time?: string;
  location: string;
  quoteAmount: number; // Canonical business value in GHS
  originalAmount?: number; // Original quote in source currency (e.g. 500)
  originalCurrency?: string; // Source currency code (e.g. 'USD')
  exchangeRate?: number; // Conversion rate used (e.g. 15.20)
  rateType?: 'live' | 'manual' | 'manual-flagged'; // Live or manual rate override
  convertedAt?: string; // Timestamp of conversion
  depositAmount: number; // In GHS
  additionalPayment: number; // In GHS
  finalPayment: number; // In GHS
  refundAmount: number; // In GHS
  totalPaid: number; // In GHS
  flaggedOverpayment?: boolean;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  notes: string;
  inquiryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  notes: string;
  inquiriesCount: number;
  bookingsCount: number;
  completedShootsCount: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: 'owner' | 'admin';
  mustChangePassword?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor?: string;
  adminUsername?: string;
  targetType?: string;
  recordType?: 'inquiry' | 'booking' | 'client' | 'portfolio' | 'service' | 'settings' | 'auth' | 'expense' | 'finance';
  targetId?: string;
  recordId?: string;
  details: any;
  timestamp: string;
}

export type ExpenseCategory =
  | 'Equipment'
  | 'Transport'
  | 'Editing/software'
  | 'Marketing'
  | 'Studio/location'
  | 'Staff/assistants'
  | 'Other'
  | (string & {});

export type PaymentMethod =
  | 'Mobile Money'
  | 'Bank Transfer'
  | 'Cash'
  | 'Credit/Debit Card'
  | 'Other'
  | (string & {});

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number; // in GHS
  description: string;
  paymentMethod: PaymentMethod;
  receiptRef?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface FinanceOverviewStats {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  totalExpenses: number;
  expensesThisMonth: number;
  expensesThisYear: number;
  netIncome: number;
  netIncomeThisMonth: number;
  netIncomeThisYear: number;
  outstandingPayments: number;
  paidBookingsCount: number;
  totalBookingsCount: number;
  averageBookingValue: number;
  depositRevenue: number;
  finalPaymentRevenue: number;
  additionalPaymentRevenue: number;
  refundedTotal: number;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'booking_full' | 'deposit' | 'final_payment' | 'additional_payment' | 'refund' | 'expense';
  typeLabel: string;
  title: string;
  clientOrPayee: string;
  serviceOrCategory: string;
  amount: number; // in GHS, positive for revenue, negative or positive depending on context (we display clearly with +/-)
  status:
    | 'Paid'
    | 'Deposit Paid'
    | 'Partially Paid'
    | 'Pending'
    | 'Refunded'
    | 'Completed'
    | 'Cancelled — Deposit Retained'
    | 'Cancelled — Payment Retained'
    | 'Cancelled';
  paymentMethod: string;
  notes?: string;
  bookingId?: string;
  bookingRef?: string;
  expenseId?: string;
}

export interface FinanceAnalyticsData {
  revenueOverTime: { date: string; revenue: number; expenses: number; netIncome: number }[];
  monthlyRevenue: { month: string; monthLabel: string; revenue: number; expenses: number; netIncome: number }[];
  revenueByService: { service: string; revenue: number; count: number; percentage: number }[];
  expensesByCategory: { category: string; amount: number; count: number; percentage: number }[];
  paidVsOutstanding: { name: string; value: number; count: number; color: string }[];
  incomeComponents: { name: string; value: number; percentage: number; color: string }[];
}

export type AdminTab =
  | 'dashboard'
  | 'inquiries'
  | 'bookings'
  | 'calendar'
  | 'clients'
  | 'portfolio'
  | 'services'
  | 'finance'
  | 'analytics'
  | 'settings'
  | 'audit';

export interface AnalyticsEvent {
  id: string;
  eventType:
    | 'page_view'
    | 'portfolio_view'
    | 'portfolio_open'
    | 'category_select'
    | 'booking_start'
    | 'booking_submit'
    | 'whatsapp_click'
    | 'phone_click'
    | 'instagram_click'
    | 'tiktok_click'
    | 'service_inquiry';
  path?: string;
  target?: string;
  metadata?: Record<string, string | number>;
  timestamp: string;
}

export interface DashboardStats {
  totalInquiries: number;
  activeBookings: number;
  pendingInquiries: number;
  completedShoots: number;
  totalRevenue: number;
  paidRevenue: number;
  outstandingRevenue: number;
  totalClients: number;
  publishedPortfolioCount: number;
}

export type ActivePage = 'home' | 'work' | 'about' | 'services' | 'contact' | '404' | 'admin';

