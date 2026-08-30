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
  quoteAmount: number;
  depositAmount: number;
  additionalPayment: number;
  finalPayment: number;
  refundAmount: number;
  totalPaid: number;
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
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor?: string;
  adminUsername?: string;
  targetType?: string;
  recordType?: 'inquiry' | 'booking' | 'client' | 'portfolio' | 'service' | 'settings' | 'auth';
  targetId?: string;
  recordId?: string;
  details: any;
  timestamp: string;
}

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

