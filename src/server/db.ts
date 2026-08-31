import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  Inquiry,
  InquiryFormData,
  Booking,
  Client,
  AdminUser,
  AuditLog,
  AnalyticsEvent,
  DashboardStats,
  PortfolioItem,
  ServiceItem,
  SiteConfig,
  InquiryStatus,
  BookingStatus,
  PaymentStatus,
  CurrencyConversionRecord
} from '../types';
import { portfolioItems as defaultPortfolioItems, heroImage as defaultHero, photographerPortrait as defaultPortrait } from '../data/portfolioData';
import { servicesData as defaultServices } from '../data/servicesData';
import { siteConfig as defaultSiteConfig } from '../data/siteConfig';

export interface StoredAdminUser extends AdminUser {
  passwordHash: string;
  mustChangePassword?: boolean;
}

export interface Session {
  token: string;
  userId: string;
  username: string;
  createdAt: string;
  expiresAt: string;
}

export interface DatabaseSchema {
  adminUsers: StoredAdminUser[];
  sessions: Session[];
  inquiries: Inquiry[];
  bookings: Booking[];
  clients: Client[];
  portfolio: (PortfolioItem & { isHero?: boolean; isPublished: boolean; order: number })[];
  services: (ServiceItem & { isEnabled: boolean; order: number; quoteRangeText?: string })[];
  settings: {
    brandName: string;
    tagline: string;
    phone: string;
    whatsappNumber: string;
    whatsappDefaultMessage: string;
    email: string;
    location: string;
    availabilityNotice: string;
    heroImage: string;
    heroAlt: string;
    photographerPortrait: string;
    photographerPortraitAlt: string;
    socials: { platform: 'instagram' | 'tiktok' | 'x' | 'facebook' | 'whatsapp' | 'behance'; label: string; url: string }[];
  };
  analyticsEvents: AnalyticsEvent[];
  auditLogs: AuditLog[];
  conversionHistory: CurrencyConversionRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ninetiesshots_db.json');
const AUDIT_ARCHIVE_FILE = path.join(DATA_DIR, 'ninetiesshots_audit_archive.jsonl');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateReference(prefix: string = 'NS'): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomNum}`;
}

function generateInitialAdmin(): StoredAdminUser {
  const envPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim();
  let plainPassword = '';
  let generated = false;

  if (envPassword && envPassword.length >= 8) {
    plainPassword = envPassword;
  } else {
    // Generate high-entropy, human-friendly random password with minimum 64 bits of entropy
    plainPassword = `NS-${crypto.randomBytes(6).toString('hex')}`;
    generated = true;
  }

  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync(plainPassword, salt);

  if (generated) {
    console.log('\n' + '='.repeat(72));
    console.log('[NINETIES SHOTS] INITIAL ADMINISTRATOR ACCOUNT CREATED');
    console.log('Username: admin');
    console.log(`Initial Password: ${plainPassword}`);
    console.log('SAVE THIS PASSWORD NOW — IT WILL NOT BE SHOWN AGAIN.');
    console.log('='.repeat(72) + '\n');
  }

  return {
    id: 'admin_1',
    username: 'admin',
    name: 'Nineties Shots Admin',
    role: 'owner',
    passwordHash: defaultPasswordHash,
    mustChangePassword: true,
    createdAt: new Date().toISOString()
  };
}

function getInitialData(isFirstSetup: boolean = true): DatabaseSchema {
  const initialAdmin = generateInitialAdmin();

  const initialPortfolio = defaultPortfolioItems.map((item, index) => ({
    ...item,
    isHero: item.image === defaultHero.url,
    isPublished: true,
    order: index
  }));

  const initialServices = defaultServices.map((service, index) => ({
    ...service,
    isEnabled: true,
    order: index,
    quoteRangeText: 'Custom Commission Scoping'
  }));

  return {
    adminUsers: [initialAdmin],
    sessions: [],
    inquiries: [],
    bookings: [],
    clients: [],
    portfolio: initialPortfolio,
    services: initialServices,
    settings: {
      brandName: defaultSiteConfig.brandName,
      tagline: defaultSiteConfig.tagline,
      phone: defaultSiteConfig.contact.phone || '020 806 6924',
      whatsappNumber: defaultSiteConfig.contact.whatsappNumber || '+233208066924',
      whatsappDefaultMessage: defaultSiteConfig.contact.whatsappDefaultMessage,
      email: defaultSiteConfig.contact.email || '',
      location: defaultSiteConfig.contact.location,
      availabilityNotice: defaultSiteConfig.contact.availabilityNotice,
      heroImage: defaultHero.url,
      heroAlt: defaultHero.alt,
      photographerPortrait: defaultPortrait.url,
      photographerPortraitAlt: defaultPortrait.alt,
      socials: defaultSiteConfig.socials
    },
    analyticsEvents: [],
    auditLogs: [
      {
        id: `audit_${Date.now()}`,
        action: 'System Initialized',
        adminUsername: 'system',
        recordType: 'settings',
        details: 'Initial NINETIES SHOTS production database loaded',
        timestamp: new Date().toISOString()
      }
    ],
    conversionHistory: []
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        
        // If database already exists and has admin users, preserve existing admin credentials
        const existingAdmins = Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0
          ? parsed.adminUsers.map((a: any) => ({
              ...a,
              mustChangePassword: a.mustChangePassword !== undefined ? Boolean(a.mustChangePassword) : false
            }))
          : [generateInitialAdmin()];

        const loaded: DatabaseSchema = {
          ...parsed,
          adminUsers: existingAdmins,
          // CRITICAL: Invalidate all stored active sessions on load to treat existing sessions as revoked
          sessions: [],
          settings: { ...(getInitialData(false).settings), ...(parsed.settings || {}) },
          portfolio: Array.isArray(parsed.portfolio) && parsed.portfolio.length > 0 ? parsed.portfolio : getInitialData(false).portfolio,
          services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : getInitialData(false).services,
          inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
          bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
          clients: Array.isArray(parsed.clients) ? parsed.clients : [],
          analyticsEvents: Array.isArray(parsed.analyticsEvents) ? parsed.analyticsEvents : [],
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
          conversionHistory: Array.isArray(parsed.conversionHistory) ? parsed.conversionHistory : []
        };
        
        // Immediately persist invalidated sessions and structure
        this.saveDirect(loaded);
        return loaded;
      } catch (err) {
        console.error('Error loading database file, initializing fresh:', err);
        const init = getInitialData(true);
        this.saveDirect(init);
        return init;
      }
    } else {
      const init = getInitialData(true);
      this.saveDirect(init);
      return init;
    }
  }

  private save(): void {
    this.saveDirect(this.data);
  }

  private saveDirect(data: DatabaseSchema): void {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error writing database file:', err);
    }
  }

  // ==================== AUTH & SESSIONS ====================
  public authenticateAdmin(username: string, plainPassword: string): { user: AdminUser; token: string } | null {
    const admin = this.data.adminUsers.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!admin) return null;

    const isValid = bcrypt.compareSync(plainPassword, admin.passwordHash);
    if (!isValid) return null;

    // Update last login
    admin.lastLoginAt = new Date().toISOString();

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const session: Session = {
      token,
      userId: admin.id,
      username: admin.username,
      createdAt: new Date().toISOString(),
      expiresAt
    };

    this.data.sessions.push(session);

    // Audit log (never logging passwords or tokens)
    this.addAuditLog('Admin Login', admin.username, 'auth', admin.id, 'Successful admin authentication');
    this.save();

    const { passwordHash: _, ...userSafe } = admin;
    return {
      user: {
        ...userSafe,
        mustChangePassword: Boolean(admin.mustChangePassword)
      },
      token
    };
  }

  public validateSession(token: string): AdminUser | null {
    if (!token) return null;
    const sessionIndex = this.data.sessions.findIndex(s => s.token === token);
    if (sessionIndex === -1) return null;

    const session = this.data.sessions[sessionIndex];
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      // Expired, remove
      this.data.sessions.splice(sessionIndex, 1);
      this.save();
      return null;
    }

    const admin = this.data.adminUsers.find(u => u.id === session.userId);
    if (!admin) return null;

    const { passwordHash: _, ...userSafe } = admin;
    return {
      ...userSafe,
      mustChangePassword: Boolean(admin.mustChangePassword)
    };
  }

  public deleteSession(token: string): boolean {
    const initialLen = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    if (this.data.sessions.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public updateAdminPassword(
    userId: string,
    currentPlain: string,
    newPlain: string,
    adminUsername: string
  ): { success: boolean; error?: string; newToken?: string; user?: AdminUser } {
    const admin = this.data.adminUsers.find(u => u.id === userId);
    if (!admin) return { success: false, error: 'Administrator not found' };

    if (!bcrypt.compareSync(currentPlain, admin.passwordHash)) {
      return { success: false, error: 'Current password is incorrect' };
    }

    if (!newPlain || newPlain.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long' };
    }

    admin.passwordHash = bcrypt.hashSync(newPlain, bcrypt.genSaltSync(10));
    admin.mustChangePassword = false;

    // Invalidate all existing sessions for this admin
    this.data.sessions = this.data.sessions.filter(s => s.userId !== userId);

    // Create a fresh new valid session
    const newToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    this.data.sessions.push({
      token: newToken,
      userId: admin.id,
      username: admin.username,
      createdAt: new Date().toISOString(),
      expiresAt
    });

    this.addAuditLog('Password Changed', adminUsername, 'auth', admin.id, 'Admin password successfully updated and existing sessions invalidated');
    this.save();

    const { passwordHash: _, ...userSafe } = admin;
    return {
      success: true,
      newToken,
      user: {
        ...userSafe,
        mustChangePassword: false
      }
    };
  }

  public resetAdminPassword(newPlain: string, adminUsername: string = 'admin'): boolean {
    if (!newPlain || newPlain.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    const admin = this.data.adminUsers.find(u => u.username.toLowerCase() === adminUsername.toLowerCase()) || this.data.adminUsers[0];
    if (!admin) return false;

    admin.passwordHash = bcrypt.hashSync(newPlain, bcrypt.genSaltSync(10));
    admin.mustChangePassword = false;
    // Invalidate all active sessions
    this.data.sessions = [];
    this.addAuditLog('Admin Password Reset', admin.username, 'auth', admin.id, 'Administrator password reset via server CLI/recovery');
    this.save();
    return true;
  }

  // ==================== CLIENTS & INQUIRIES ====================
  private findOrCreateClient(name: string, email: string, phone: string): Client {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const cleanEmail = (email || '').trim().toLowerCase();

    let client = this.data.clients.find(c => {
      const matchEmail = cleanEmail && c.email.trim().toLowerCase() === cleanEmail;
      const matchPhone = cleanPhone && c.phone.replace(/[^0-9]/g, '') === cleanPhone;
      return matchEmail || matchPhone;
    });

    if (!client) {
      client = {
        id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: phone.trim(),
        notes: '',
        inquiriesCount: 0,
        bookingsCount: 0,
        completedShootsCount: 0,
        totalRevenue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.data.clients.unshift(client);
    } else {
      // Update missing fields
      if (!client.email && email) client.email = email.trim();
      if (!client.phone && phone) client.phone = phone.trim();
      client.updatedAt = new Date().toISOString();
    }

    return client;
  }

  public createInquiry(form: InquiryFormData): Inquiry {
    const client = this.findOrCreateClient(form.fullName, form.email, form.phoneOrWhatsapp);
    client.inquiriesCount += 1;

    const reference = generateReference('NS');
    const inquiry: Inquiry = {
      id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reference,
      clientName: form.fullName.trim(),
      email: (form.email || '').trim(),
      phone: (form.phoneOrWhatsapp || '').trim(),
      shootType: form.shootType || 'Editorial & Fashion',
      preferredDate: form.preferredDate || '',
      location: form.location || '',
      budgetRange: form.budgetRange || 'Custom Scoping',
      message: form.message || '',
      submittedAt: new Date().toISOString(),
      status: 'New',
      notes: '',
      clientId: client.id
    };

    this.data.inquiries.unshift(inquiry);
    this.addAuditLog('New Inquiry Received', 'visitor', 'inquiry', inquiry.id, `Inquiry ref: ${reference} from ${form.fullName}`);
    this.save();
    return inquiry;
  }

  public getInquiries(search?: string, status?: string): Inquiry[] {
    return this.data.inquiries.filter(inq => {
      const matchesSearch = !search ||
        inq.clientName.toLowerCase().includes(search.toLowerCase()) ||
        inq.reference.toLowerCase().includes(search.toLowerCase()) ||
        inq.email.toLowerCase().includes(search.toLowerCase()) ||
        inq.phone.includes(search) ||
        inq.location.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = !status || status === 'all' || inq.status === status;
      return matchesSearch && matchesStatus;
    });
  }

  public getInquiryById(id: string): Inquiry | null {
    return this.data.inquiries.find(inq => inq.id === id) || null;
  }

  public updateInquiry(id: string, updates: Partial<Inquiry>, adminUsername: string): Inquiry | null {
    const inq = this.data.inquiries.find(i => i.id === id);
    if (!inq) return null;

    const oldStatus = inq.status;
    Object.assign(inq, updates);

    if (updates.status && updates.status !== oldStatus) {
      this.addAuditLog('Inquiry Status Changed', adminUsername, 'inquiry', inq.id, `Status updated from ${oldStatus} to ${updates.status}`);
    } else {
      this.addAuditLog('Inquiry Updated', adminUsername, 'inquiry', inq.id, 'Inquiry details/notes updated');
    }

    this.save();
    return inq;
  }

  public deleteInquiry(id: string, adminUsername: string): boolean {
    const index = this.data.inquiries.findIndex(i => i.id === id);
    if (index === -1) return false;
    const ref = this.data.inquiries[index].reference;
    this.data.inquiries.splice(index, 1);
    this.addAuditLog('Inquiry Deleted', adminUsername, 'inquiry', id, `Deleted inquiry ref ${ref}`);
    this.save();
    return true;
  }

  // ==================== BOOKINGS ====================
  public createBooking(data: Partial<Booking>, adminUsername: string): Booking {
    const client = this.findOrCreateClient(
      data.clientName || 'Client',
      data.clientEmail || '',
      data.clientPhone || ''
    );

    const bookingRef = generateReference('NS');
    const quote = Number(data.quoteAmount || 0);
    const deposit = Number(data.depositAmount || 0);
    const additional = Number(data.additionalPayment || 0);
    const finalP = Number(data.finalPayment || 0);
    const refund = Number(data.refundAmount || 0);
    const totalPaid = Math.max(0, (deposit + additional + finalP) - refund);

    let paymentStatus: PaymentStatus = 'Not Set';
    if (quote > 0) {
      if (refund > 0 && totalPaid === 0) paymentStatus = 'Refunded';
      else if (totalPaid >= quote) paymentStatus = 'Paid';
      else if (totalPaid > 0) paymentStatus = totalPaid === deposit ? 'Deposit Paid' : 'Partially Paid';
      else paymentStatus = 'Unpaid';
    }

    const booking: Booking = {
      id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bookingReference: bookingRef,
      clientId: client.id,
      clientName: (data.clientName || client.name).trim(),
      clientEmail: (data.clientEmail || client.email).trim(),
      clientPhone: (data.clientPhone || client.phone).trim(),
      serviceId: data.serviceId || '',
      serviceTitle: data.serviceTitle || 'Editorial Shoot',
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || '10:00 AM',
      location: data.location || 'Studio',
      quoteAmount: quote,
      originalAmount: data.originalAmount !== undefined ? Number(data.originalAmount) : (data.originalCurrency && data.originalCurrency !== 'GHS' ? Number(data.originalAmount) : undefined),
      originalCurrency: data.originalCurrency ? String(data.originalCurrency).toUpperCase() : undefined,
      exchangeRate: data.exchangeRate !== undefined ? Number(data.exchangeRate) : undefined,
      rateType: data.rateType || (data.exchangeRate ? 'live' : undefined),
      convertedAt: data.convertedAt || (data.originalCurrency && data.originalCurrency !== 'GHS' ? new Date().toISOString() : undefined),
      depositAmount: deposit,
      additionalPayment: additional,
      finalPayment: finalP,
      refundAmount: refund,
      totalPaid,
      flaggedOverpayment: quote > 0 && totalPaid > quote,
      paymentStatus: data.paymentStatus || paymentStatus,
      bookingStatus: data.bookingStatus || 'Confirmed',
      notes: data.notes || '',
      inquiryId: data.inquiryId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.bookings.unshift(booking);
    client.bookingsCount += 1;
    if (booking.bookingStatus === 'Completed') {
      client.completedShootsCount += 1;
    }
    client.totalRevenue += totalPaid;

    if (data.inquiryId) {
      const inq = this.data.inquiries.find(i => i.id === data.inquiryId);
      if (inq) {
        inq.status = 'Confirmed';
        inq.convertedBookingId = booking.id;
      }
    }

    this.addAuditLog('Booking Created', adminUsername, 'booking', booking.id, `Created booking ${bookingRef} for ${booking.clientName}`);
    this.save();
    return booking;
  }

  public getBookings(search?: string, status?: string): Booking[] {
    return this.data.bookings.filter(b => {
      const matchesSearch = !search ||
        b.clientName.toLowerCase().includes(search.toLowerCase()) ||
        b.bookingReference.toLowerCase().includes(search.toLowerCase()) ||
        b.clientEmail.toLowerCase().includes(search.toLowerCase()) ||
        b.serviceTitle.toLowerCase().includes(search.toLowerCase()) ||
        b.location.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = !status || status === 'all' || b.bookingStatus === status;
      return matchesSearch && matchesStatus;
    });
  }

  public getBookingById(id: string): Booking | null {
    return this.data.bookings.find(b => b.id === id) || null;
  }

  public updateBooking(id: string, updates: Partial<Booking>, adminUsername: string): Booking | null {
    const booking = this.data.bookings.find(b => b.id === id);
    if (!booking) return null;

    const oldStatus = booking.bookingStatus;
    const oldPaid = booking.totalPaid;

    Object.assign(booking, updates);

    // Recalculate financial breakdown if numbers changed
    const quote = Number(booking.quoteAmount || 0);
    const deposit = Number(booking.depositAmount || 0);
    const additional = Number(booking.additionalPayment || 0);
    const finalP = Number(booking.finalPayment || 0);
    const refund = Number(booking.refundAmount || 0);
    const totalPaid = Math.max(0, (deposit + additional + finalP) - refund);
    booking.totalPaid = totalPaid;
    booking.flaggedOverpayment = quote > 0 && totalPaid > quote;

    if (!updates.paymentStatus && quote > 0) {
      if (refund > 0 && totalPaid === 0) booking.paymentStatus = 'Refunded';
      else if (totalPaid >= quote) booking.paymentStatus = 'Paid';
      else if (totalPaid > 0) booking.paymentStatus = totalPaid === deposit ? 'Deposit Paid' : 'Partially Paid';
      else booking.paymentStatus = 'Unpaid';
    }

    booking.updatedAt = new Date().toISOString();

    // Recalculate client completed stats and total revenue
    const client = this.data.clients.find(c => c.id === booking.clientId);
    if (client) {
      client.totalRevenue += (totalPaid - oldPaid);
      if (oldStatus !== 'Completed' && booking.bookingStatus === 'Completed') {
        client.completedShootsCount += 1;
      } else if (oldStatus === 'Completed' && booking.bookingStatus !== 'Completed') {
        client.completedShootsCount = Math.max(0, client.completedShootsCount - 1);
      }
      client.updatedAt = new Date().toISOString();
    }

    this.addAuditLog('Booking Updated', adminUsername, 'booking', booking.id, `Updated booking ${booking.bookingReference}`);
    this.save();
    return booking;
  }

  public deleteBooking(id: string, adminUsername: string): boolean {
    const index = this.data.bookings.findIndex(b => b.id === id);
    if (index === -1) return false;

    const booking = this.data.bookings[index];
    const ref = booking.bookingReference;
    const clientId = booking.clientId;
    const clientEmail = (booking.clientEmail || '').trim().toLowerCase();

    // 1. Remove the booking record
    this.data.bookings.splice(index, 1);

    // 2. Recalculate associated client statistics accurately from all remaining records
    const client = this.data.clients.find(c => 
      c.id === clientId || (clientEmail && c.email.trim().toLowerCase() === clientEmail)
    );

    if (client) {
      const remainingClientBookings = this.data.bookings.filter(b => 
        b.clientId === client.id || (client.email && b.clientEmail.trim().toLowerCase() === client.email.trim().toLowerCase())
      );

      client.bookingsCount = Math.max(0, remainingClientBookings.length);
      client.completedShootsCount = Math.max(0, remainingClientBookings.filter(b => b.bookingStatus === 'Completed').length);
      client.totalRevenue = Math.max(0, remainingClientBookings.reduce((sum, b) => sum + Number(b.totalPaid || 0), 0));
      client.updatedAt = new Date().toISOString();
    }

    this.addAuditLog('Booking Deleted', adminUsername, 'booking', id, `Deleted booking ${ref}`);
    this.save();
    return true;
  }

  // ==================== CLIENTS ====================
  public getClients(search?: string): Client[] {
    return this.data.clients.filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.notes.toLowerCase().includes(q)
      );
    });
  }

  public getClientById(id: string): { client: Client; inquiries: Inquiry[]; bookings: Booking[] } | null {
    const client = this.data.clients.find(c => c.id === id);
    if (!client) return null;

    const inquiries = this.data.inquiries.filter(i => i.clientId === id || i.email.toLowerCase() === client.email.toLowerCase());
    const bookings = this.data.bookings.filter(b => b.clientId === id || b.clientEmail.toLowerCase() === client.email.toLowerCase());

    return { client, inquiries, bookings };
  }

  public updateClient(id: string, updates: Partial<Client>, adminUsername: string): Client | null {
    const client = this.data.clients.find(c => c.id === id);
    if (!client) return null;

    Object.assign(client, updates, { updatedAt: new Date().toISOString() });
    this.addAuditLog('Client Profile Updated', adminUsername, 'client', id, `Updated client ${client.name}`);
    this.save();
    return client;
  }

  // ==================== PORTFOLIO ====================
  public getPortfolio(includeUnpublished: boolean = false): PortfolioItem[] {
    let items = [...this.data.portfolio];
    if (!includeUnpublished) {
      items = items.filter(i => i.isPublished !== false);
    }
    return items.sort((a, b) => a.order - b.order);
  }

  public addPortfolioItem(item: Partial<PortfolioItem>, adminUsername: string): PortfolioItem {
    const id = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem = {
      id,
      title: item.title || 'Untitled Exposure',
      category: item.category || 'editorial',
      categoryLabel: item.categoryLabel || 'Editorial',
      image: item.image || '',
      thumbnail: item.thumbnail || item.image || '',
      alt: item.alt || item.title || 'Nineties Shots photograph',
      location: item.location || '',
      date: item.date || '2026',
      description: item.description || '',
      featured: item.featured ?? true,
      orientation: item.orientation || 'portrait',
      aspectRatio: item.aspectRatio || '4/5',
      cameraSettings: item.cameraSettings || {},
      isHero: false,
      isPublished: true,
      order: this.data.portfolio.length
    };

    this.data.portfolio.push(newItem);
    this.addAuditLog('Portfolio Photo Added', adminUsername, 'portfolio', id, `Added photograph "${newItem.title}"`);
    this.save();
    return newItem;
  }

  public updatePortfolioItem(id: string, updates: Partial<PortfolioItem & { isPublished?: boolean; isHero?: boolean; order?: number }>, adminUsername: string): PortfolioItem | null {
    const item = this.data.portfolio.find(i => i.id === id);
    if (!item) return null;

    Object.assign(item, updates);
    this.addAuditLog('Portfolio Photo Updated', adminUsername, 'portfolio', id, `Updated photograph "${item.title}"`);
    this.save();
    return item;
  }

  public deletePortfolioItem(id: string, adminUsername: string): boolean {
    const index = this.data.portfolio.findIndex(i => i.id === id);
    if (index === -1) return false;
    const title = this.data.portfolio[index].title;
    this.data.portfolio.splice(index, 1);
    this.addAuditLog('Portfolio Photo Deleted', adminUsername, 'portfolio', id, `Deleted photograph "${title}"`);
    this.save();
    return true;
  }

  public setHeroImage(id: string, adminUsername: string): boolean {
    const item = this.data.portfolio.find(i => i.id === id);
    if (!item) return false;

    this.data.portfolio.forEach(p => {
      p.isHero = (p.id === id);
    });

    this.data.settings.heroImage = item.image;
    this.data.settings.heroAlt = item.alt;

    this.addAuditLog('Hero Image Changed', adminUsername, 'settings', id, `Set homepage hero to "${item.title}"`);
    this.save();
    return true;
  }

  public setPhotographerPortrait(url: string, alt: string, adminUsername: string): boolean {
    this.data.settings.photographerPortrait = url;
    if (alt) this.data.settings.photographerPortraitAlt = alt;

    this.addAuditLog('Photographer Portrait Changed', adminUsername, 'settings', 'portrait', 'Updated About page portrait photograph');
    this.save();
    return true;
  }

  // ==================== SERVICES ====================
  public getServices(includeDisabled: boolean = false): ServiceItem[] {
    let list = [...this.data.services];
    if (!includeDisabled) {
      list = list.filter(s => s.isEnabled !== false);
    }
    return list.sort((a, b) => a.order - b.order);
  }

  public addService(service: Partial<ServiceItem & { isEnabled?: boolean; quoteRangeText?: string }>, adminUsername: string): ServiceItem {
    const id = `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newService = {
      id,
      title: service.title || 'New Service',
      category: service.category || 'editorial',
      tagline: service.tagline || '',
      description: service.description || '',
      highlights: service.highlights || [],
      deliverables: service.deliverables || [],
      sampleImage: service.sampleImage || '',
      isEnabled: service.isEnabled ?? true,
      order: this.data.services.length,
      quoteRangeText: service.quoteRangeText || 'Custom Scoping'
    };

    this.data.services.push(newService);
    this.addAuditLog('Service Added', adminUsername, 'service', id, `Added service "${newService.title}"`);
    this.save();
    return newService;
  }

  public updateService(id: string, updates: Partial<ServiceItem & { isEnabled?: boolean; quoteRangeText?: string }>, adminUsername: string): ServiceItem | null {
    const srv = this.data.services.find(s => s.id === id);
    if (!srv) return null;

    Object.assign(srv, updates);
    this.addAuditLog('Service Updated', adminUsername, 'service', id, `Updated service "${srv.title}"`);
    this.save();
    return srv;
  }

  public deleteService(id: string, adminUsername: string): boolean {
    const index = this.data.services.findIndex(s => s.id === id);
    if (index === -1) return false;
    const title = this.data.services[index].title;
    this.data.services.splice(index, 1);
    this.addAuditLog('Service Deleted', adminUsername, 'service', id, `Deleted service "${title}"`);
    this.save();
    return true;
  }

  // ==================== SETTINGS ====================
  public getSettings(): DatabaseSchema['settings'] {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<DatabaseSchema['settings']>, adminUsername: string): DatabaseSchema['settings'] {
    this.data.settings = {
      ...this.data.settings,
      ...updates
    };
    this.addAuditLog('Settings Updated', adminUsername, 'settings', 'global', 'Updated contact, socials, or brand settings');
    this.save();
    return this.data.settings;
  }

  // ==================== ANALYTICS ====================
  public recordAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    const item: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...event,
      timestamp: new Date().toISOString()
    };
    this.data.analyticsEvents.push(item);

    // Keep events array bounded to last 10,000 to prevent unbounded growth
    if (this.data.analyticsEvents.length > 10000) {
      this.data.analyticsEvents = this.data.analyticsEvents.slice(-5000);
    }
    this.save();
  }

  public getAnalyticsSummary(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: AnalyticsEvent[];
    popularCategories: Record<string, number>;
    popularImages: Record<string, number>;
  } {
    const eventsByType: Record<string, number> = {};
    const popularCategories: Record<string, number> = {};
    const popularImages: Record<string, number> = {};

    for (const ev of this.data.analyticsEvents) {
      eventsByType[ev.eventType] = (eventsByType[ev.eventType] || 0) + 1;
      if (ev.eventType === 'category_select' && ev.target) {
        popularCategories[ev.target] = (popularCategories[ev.target] || 0) + 1;
      }
      if (ev.eventType === 'portfolio_open' && ev.target) {
        popularImages[ev.target] = (popularImages[ev.target] || 0) + 1;
      }
    }

    return {
      totalEvents: this.data.analyticsEvents.length,
      eventsByType,
      recentEvents: this.data.analyticsEvents.slice(-50).reverse(),
      popularCategories,
      popularImages
    };
  }

  // ==================== AUDIT LOGS ====================
  public addAuditLog(
    action: string,
    adminUsername: string,
    recordType: AuditLog['recordType'],
    recordId: string | undefined,
    details: string
  ): void {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      adminUsername,
      recordType,
      recordId,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);

    // Keep active memory bounded (500 records) and archive older records to JSONL append-only file
    if (this.data.auditLogs.length > 500) {
      const recordsToArchive = this.data.auditLogs.slice(500);
      try {
        const jsonlLines = recordsToArchive.map(r => JSON.stringify(r)).join('\n') + '\n';
        fs.appendFileSync(AUDIT_ARCHIVE_FILE, jsonlLines, 'utf-8');
        // Only slice from in-memory array AFTER successful disk append
        this.data.auditLogs = this.data.auditLogs.slice(0, 500);
      } catch (err) {
        console.error('[AUDIT ARCHIVE] Failed to append records to archive JSONL:', err);
        // Retain in memory on write error to prevent data destruction
      }
    }
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // ==================== DASHBOARD STATS ====================
  public getDashboardStats(): DashboardStats {
    const totalInquiries = this.data.inquiries.length;
    const pendingInquiries = this.data.inquiries.filter(i => i.status === 'New' || i.status === 'Contacted').length;
    const activeBookings = this.data.bookings.filter(b => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'In Progress' || b.bookingStatus === 'Awaiting Deposit').length;
    const completedShoots = this.data.bookings.filter(b => b.bookingStatus === 'Completed').length;

    let totalRevenue = 0;
    let paidRevenue = 0;

    for (const b of this.data.bookings) {
      totalRevenue += Number(b.quoteAmount || 0);
      paidRevenue += Number(b.totalPaid || 0);
    }

    const outstandingRevenue = Math.max(0, totalRevenue - paidRevenue);
    const totalClients = this.data.clients.length;
    const publishedPortfolioCount = this.data.portfolio.filter(p => p.isPublished !== false).length;

    return {
      totalInquiries,
      activeBookings,
      pendingInquiries,
      completedShoots,
      totalRevenue,
      paidRevenue,
      outstandingRevenue,
      totalClients,
      publishedPortfolioCount
    };
  }

  // ==================== CURRENCY CONVERSION HISTORY ====================
  public addConversionRecord(
    record: Omit<CurrencyConversionRecord, 'id'>,
    adminUsername: string
  ): CurrencyConversionRecord {
    const item: CurrencyConversionRecord = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...record
    };

    if (!Array.isArray(this.data.conversionHistory)) {
      this.data.conversionHistory = [];
    }

    this.data.conversionHistory.unshift(item);
    // Keep last 100 conversions
    if (this.data.conversionHistory.length > 100) {
      this.data.conversionHistory = this.data.conversionHistory.slice(0, 100);
    }

    this.addAuditLog(
      'Currency Converted',
      adminUsername,
      'settings',
      item.id,
      `Converted ${record.originalCurrency} ${record.originalAmount} -> GHS ${record.convertedAmount} (Rate: 1 ${record.originalCurrency} = GH₵${record.exchangeRate}, Type: ${record.rateType})`
    );

    this.save();
    return item;
  }

  public getConversionHistory(limit: number = 50): CurrencyConversionRecord[] {
    if (!Array.isArray(this.data.conversionHistory)) {
      return [];
    }
    return this.data.conversionHistory.slice(0, limit);
  }

  public clearConversionHistory(adminUsername: string): boolean {
    this.data.conversionHistory = [];
    this.addAuditLog('Conversion History Cleared', adminUsername, 'settings', undefined, 'Cleared admin currency conversion history');
    this.save();
    return true;
  }
}

export const db = new Database();
