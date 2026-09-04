import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

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
  CurrencyConversionRecord,
  Expense,
  ExpenseCategory,
  FinanceOverviewStats,
  FinancialTransaction,
  FinanceAnalyticsData
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
  expenses: Expense[];
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

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitizeForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

function generateReference(prefix: string = 'NS'): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomNum}`;
}

export function resolveDateFilter(
  timeRange: string = 'all',
  customStart?: string,
  customEnd?: string
): { startDate?: string; endDate?: string } {
  if (timeRange === 'all') {
    return {};
  }

  const now = new Date();
  const formatYMD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (timeRange === 'today') {
    const today = formatYMD(now);
    return { startDate: today, endDate: today };
  }

  if (timeRange === 'this_week') {
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { startDate: formatYMD(monday), endDate: formatYMD(sunday) };
  }

  if (timeRange === 'this_month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: formatYMD(startOfMonth), endDate: formatYMD(endOfMonth) };
  }

  if (timeRange === 'last_3_months') {
    const start3m = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: formatYMD(start3m), endDate: formatYMD(endOfMonth) };
  }

  if (timeRange === 'this_year') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    return { startDate: formatYMD(startOfYear), endDate: formatYMD(endOfYear) };
  }

  if (timeRange === 'custom') {
    return {
      startDate: customStart || undefined,
      endDate: customEnd || undefined
    };
  }

  return {};
}

export function isDateInRange(dateStr: string, startDate?: string, endDate?: string): boolean {
  if (!dateStr) return !startDate && !endDate;
  const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  if (startDate && dateOnly < startDate) return false;
  if (endDate && dateOnly > endDate) return false;
  return true;
}

function getDefaultSettings(): DatabaseSchema['settings'] {
  return {
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
  };
}

class Database {
  private firestore: Firestore | null = null;
  private app: FirebaseApp | null = null;
  private initialized: boolean = false;

  constructor() {
    this.setupFirebase();
  }

  private setupFirebase(): void {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        this.app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        this.firestore = getFirestore(this.app, config.firestoreDatabaseId);
      } else {
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT;
        if (projectId) {
          const config = { projectId, firestoreDatabaseId: '(default)' };
          this.app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
          this.firestore = getFirestore(this.app, config.firestoreDatabaseId);
        }
      }
    } catch (err) {
      console.error('[DB] Failed to initialize Firebase connection:', err);
      this.firestore = null;
    }
  }

  private getDB(): Firestore {
    if (!this.firestore) {
      this.setupFirebase();
    }
    if (!this.firestore) {
      throw new Error('Firestore is not configured or unavailable. Check firebase-applet-config.json.');
    }
    return this.firestore;
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    const db = this.getDB();

    // 1. Verify and provision initial settings if missing
    const settingsRef = doc(db, 'settings', 'global');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      console.log('[DB] Seeding default settings into Firestore...');
      await setDoc(settingsRef, sanitizeForFirestore(getDefaultSettings()));
    }

    // 2. Verify admin accounts in Firestore
    const adminCol = collection(db, 'adminUsers');
    const adminSnaps = await getDocs(adminCol);

    const envResetPassword = (process.env.ADMIN_RESET_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD)?.trim();
    const envAdminUsername = (process.env.ADMIN_USERNAME?.trim() || 'admin').toLowerCase();

    if (adminSnaps.empty) {
      console.log('[DB] No admin user detected in Firestore. Generating initial administrator...');
      let plainPassword = '';
      let generated = false;

      if (envResetPassword && envResetPassword.length >= 8) {
        plainPassword = envResetPassword;
      } else {
        plainPassword = `NS-${crypto.randomBytes(6).toString('hex')}`;
        generated = true;
      }

      const salt = bcrypt.genSaltSync(10);
      const defaultPasswordHash = bcrypt.hashSync(plainPassword, salt);

      if (generated) {
        console.log('\n' + '='.repeat(72));
        console.log('[NINETIES SHOTS] INITIAL ADMINISTRATOR ACCOUNT PROVISIONED IN FIRESTORE');
        console.log(`Username: ${envAdminUsername}`);
        console.log(`Initial Password: ${plainPassword}`);
        console.log('SAVE THIS PASSWORD NOW — IT WILL NOT BE SHOWN AGAIN.');
        console.log('='.repeat(72) + '\n');
      }

      const initialAdmin: StoredAdminUser = {
        id: 'admin_1',
        username: envAdminUsername,
        name: 'Nineties Shots Admin',
        role: 'owner',
        passwordHash: defaultPasswordHash,
        mustChangePassword: true,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'adminUsers', initialAdmin.id), sanitizeForFirestore(initialAdmin));
    } else if (envResetPassword && envResetPassword.length >= 8) {
      // Secure credential synchronization / reset via environment variable
      const existingAdmins = adminSnaps.docs.map(d => d.data() as StoredAdminUser);
      let targetAdmin = existingAdmins.find(a => a.username.toLowerCase() === envAdminUsername) || existingAdmins[0];

      if (targetAdmin) {
        const isMatch = bcrypt.compareSync(envResetPassword, targetAdmin.passwordHash);
        if (!isMatch) {
          const salt = bcrypt.genSaltSync(10);
          targetAdmin.passwordHash = bcrypt.hashSync(envResetPassword, salt);
          targetAdmin.mustChangePassword = true;
          await updateDoc(doc(db, 'adminUsers', targetAdmin.id), {
            passwordHash: targetAdmin.passwordHash,
            mustChangePassword: true
          });
          console.log(`[NINETIES SHOTS] Admin password for "${targetAdmin.username}" securely updated via environment configuration.`);
        }
      }
    }

    // 3. Seed portfolio if collection is completely empty
    const portfolioCol = collection(db, 'portfolio');
    const portfolioSnaps = await getDocs(portfolioCol);
    if (portfolioSnaps.empty) {
      console.log('[DB] Seeding default portfolio into Firestore...');
      const batch = writeBatch(db);
      defaultPortfolioItems.forEach((item, index) => {
        const docRef = doc(db, 'portfolio', item.id);
        batch.set(docRef, sanitizeForFirestore({
          ...item,
          isHero: item.image === defaultHero.url,
          isPublished: true,
          order: index
        }));
      });
      await batch.commit();
    }

    // 4. Seed services if collection is completely empty
    const servicesCol = collection(db, 'services');
    const servicesSnaps = await getDocs(servicesCol);
    if (servicesSnaps.empty) {
      console.log('[DB] Seeding default services into Firestore...');
      const batch = writeBatch(db);
      defaultServices.forEach((service, index) => {
        const docRef = doc(db, 'services', service.id);
        batch.set(docRef, sanitizeForFirestore({
          ...service,
          isEnabled: true,
          order: index,
          quoteRangeText: 'Custom Commission Scoping'
        }));
      });
      await batch.commit();
    }

    this.initialized = true;
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const db = this.getDB();
      const settingsRef = doc(db, 'settings', 'global');
      const snap = await getDoc(settingsRef);
      return snap.exists();
    } catch (err) {
      console.error('[DB] Health check error:', err);
      return false;
    }
  }

  // ==================== AUTH & SESSION MANAGEMENT ====================
  public async authenticateAdmin(
    username: string,
    plainPassword: string
  ): Promise<{ success: boolean; user?: AdminUser; token?: string; error?: string }> {
    const db = this.getDB();
    const adminSnaps = await getDocs(collection(db, 'adminUsers'));
    const admins = adminSnaps.docs.map(d => d.data() as StoredAdminUser);
    let admin = admins.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

    // Fallback: If not found by exact match and username is 'admin' or 'nineties' or there is only one admin account
    if (!admin && admins.length > 0) {
      const lower = username.trim().toLowerCase();
      if (lower === 'admin' || lower === 'nineties' || admins.length === 1) {
        admin = admins[0];
      }
    }

    if (!admin) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isMatch = bcrypt.compareSync(plainPassword, admin.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Invalid credentials' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const session: Session = {
      token,
      userId: admin.id,
      username: admin.username,
      createdAt: new Date().toISOString(),
      expiresAt
    };

    await setDoc(doc(db, 'sessions', token), sanitizeForFirestore(session));
    await updateDoc(doc(db, 'adminUsers', admin.id), { lastLoginAt: new Date().toISOString() });

    await this.addAuditLog('Admin Login', admin.username, 'auth', admin.id, 'Successful administrator login');

    const { passwordHash: _, ...safeUser } = admin;
    return {
      success: true,
      user: {
        ...safeUser,
        mustChangePassword: Boolean(admin.mustChangePassword)
      },
      token
    };
  }

  public async validateSession(token: string): Promise<AdminUser | null> {
    if (!token) return null;
    try {
      const db = this.getDB();
      const sessionRef = doc(db, 'sessions', token);
      const sessionSnap = await getDoc(sessionRef);
      if (!sessionSnap.exists()) return null;

      const session = sessionSnap.data() as Session;
      if (new Date(session.expiresAt) < new Date()) {
        await deleteDoc(sessionRef);
        return null;
      }

      const adminRef = doc(db, 'adminUsers', session.userId);
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) return null;

      const admin = adminSnap.data() as StoredAdminUser;
      const { passwordHash: _, ...safeUser } = admin;
      return {
        ...safeUser,
        mustChangePassword: Boolean(admin.mustChangePassword)
      };
    } catch (err) {
      console.error('[DB] Error validating session:', err);
      return null;
    }
  }

  public async deleteSession(token: string): Promise<void> {
    if (!token) return;
    try {
      const db = this.getDB();
      await deleteDoc(doc(db, 'sessions', token));
    } catch (err) {
      console.error('[DB] Error deleting session:', err);
    }
  }

  public async revokeAllSessions(userId: string, adminUsername: string = 'admin'): Promise<number> {
    const db = this.getDB();
    const sessionsSnaps = await getDocs(collection(db, 'sessions'));
    const userSessions = sessionsSnaps.docs.filter(d => (d.data() as Session).userId === userId);

    if (userSessions.length > 0) {
      const batch = writeBatch(db);
      userSessions.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    await this.addAuditLog('Revoke All Sessions', adminUsername, 'auth', userId, `Revoked ${userSessions.length} active sessions`);
    return userSessions.length;
  }

  public async updateAdminPassword(
    userId: string,
    currentPlain: string,
    newPlain: string,
    adminUsername: string
  ): Promise<{ success: boolean; error?: string; newToken?: string; user?: AdminUser }> {
    const db = this.getDB();
    const adminRef = doc(db, 'adminUsers', userId);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) return { success: false, error: 'Administrator not found' };

    const admin = adminSnap.data() as StoredAdminUser;
    if (!bcrypt.compareSync(currentPlain, admin.passwordHash)) {
      return { success: false, error: 'Current password is incorrect' };
    }

    if (!newPlain || newPlain.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long' };
    }

    const newHash = bcrypt.hashSync(newPlain, bcrypt.genSaltSync(10));
    await updateDoc(adminRef, {
      passwordHash: newHash,
      mustChangePassword: false
    });

    // Invalidate all existing sessions for this admin
    const sessionsSnaps = await getDocs(collection(db, 'sessions'));
    const userSessions = sessionsSnaps.docs.filter(d => (d.data() as Session).userId === userId);
    if (userSessions.length > 0) {
      const batch = writeBatch(db);
      userSessions.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    // Create a fresh new valid session
    const newToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await setDoc(doc(db, 'sessions', newToken), sanitizeForFirestore({
      token: newToken,
      userId: admin.id,
      username: admin.username,
      createdAt: new Date().toISOString(),
      expiresAt
    }));

    await this.addAuditLog('Password Changed', adminUsername, 'auth', admin.id, 'Admin password successfully updated and existing sessions invalidated');

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

  public async resetAdminPassword(newPlain: string, adminUsername: string = 'admin'): Promise<boolean> {
    if (!newPlain || newPlain.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    const db = this.getDB();
    const adminSnaps = await getDocs(collection(db, 'adminUsers'));
    const admins = adminSnaps.docs.map(d => d.data() as StoredAdminUser);
    const admin = admins.find(u => u.username.toLowerCase() === adminUsername.toLowerCase()) || admins[0];
    if (!admin) return false;

    const newHash = bcrypt.hashSync(newPlain, bcrypt.genSaltSync(10));
    await updateDoc(doc(db, 'adminUsers', admin.id), {
      passwordHash: newHash,
      mustChangePassword: false
    });

    // Invalidate all active sessions
    const sessionsSnaps = await getDocs(collection(db, 'sessions'));
    if (!sessionsSnaps.empty) {
      const batch = writeBatch(db);
      sessionsSnaps.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    await this.addAuditLog('Admin Password Reset', admin.username, 'auth', admin.id, 'Administrator password reset via server CLI/recovery');
    return true;
  }

  // ==================== CLIENTS & INQUIRIES ====================
  private async findOrCreateClient(name: string, email: string, phone: string): Promise<Client> {
    const db = this.getDB();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const cleanEmail = (email || '').trim().toLowerCase();

    const clientSnaps = await getDocs(collection(db, 'clients'));
    const clients = clientSnaps.docs.map(d => d.data() as Client);

    let client = clients.find(c => {
      const matchEmail = cleanEmail && c.email.trim().toLowerCase() === cleanEmail;
      const matchPhone = cleanPhone && c.phone.replace(/[^0-9]/g, '') === cleanPhone;
      return matchEmail || matchPhone;
    });

    if (!client) {
      const newClient: Client = {
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
      await setDoc(doc(db, 'clients', newClient.id), sanitizeForFirestore(newClient));
      return newClient;
    } else {
      let needsUpdate = false;
      const updates: Partial<Client> = { updatedAt: new Date().toISOString() };
      if (!client.email && email) {
        updates.email = email.trim();
        client.email = email.trim();
        needsUpdate = true;
      }
      if (!client.phone && phone) {
        updates.phone = phone.trim();
        client.phone = phone.trim();
        needsUpdate = true;
      }
      if (needsUpdate) {
        await updateDoc(doc(db, 'clients', client.id), sanitizeForFirestore(updates));
      }
      return client;
    }
  }

  public async createInquiry(form: InquiryFormData): Promise<Inquiry> {
    const db = this.getDB();
    const client = await this.findOrCreateClient(form.fullName, form.email, form.phoneOrWhatsapp);
    const newCount = (client.inquiriesCount || 0) + 1;
    await updateDoc(doc(db, 'clients', client.id), {
      inquiriesCount: newCount,
      updatedAt: new Date().toISOString()
    });

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

    await setDoc(doc(db, 'inquiries', inquiry.id), sanitizeForFirestore(inquiry));
    await this.addAuditLog('New Inquiry Received', 'visitor', 'inquiry', inquiry.id, `Inquiry ref: ${reference} from ${form.fullName}`);
    return inquiry;
  }

  public async getInquiries(search?: string, status?: string): Promise<Inquiry[]> {
    const db = this.getDB();
    const snaps = await getDocs(collection(db, 'inquiries'));
    let inquiries = snaps.docs.map(d => d.data() as Inquiry);

    return inquiries.filter(inq => {
      const matchesSearch = !search ||
        (inq.clientName && inq.clientName.toLowerCase().includes(search.toLowerCase())) ||
        (inq.reference && inq.reference.toLowerCase().includes(search.toLowerCase())) ||
        (inq.email && inq.email.toLowerCase().includes(search.toLowerCase())) ||
        (inq.phone && inq.phone.includes(search)) ||
        (inq.location && inq.location.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = !status || status === 'all' || inq.status === status;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public async getInquiryById(id: string): Promise<Inquiry | null> {
    const db = this.getDB();
    const snap = await getDoc(doc(db, 'inquiries', id));
    return snap.exists() ? (snap.data() as Inquiry) : null;
  }

  public async updateInquiry(id: string, updates: Partial<Inquiry>, adminUsername: string): Promise<Inquiry | null> {
    const db = this.getDB();
    const ref = doc(db, 'inquiries', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const inq = snap.data() as Inquiry;
    const oldStatus = inq.status;
    const sanitized = sanitizeForFirestore(updates);
    await updateDoc(ref, sanitized);

    const updated = { ...inq, ...updates };
    if (updates.status && updates.status !== oldStatus) {
      await this.addAuditLog('Inquiry Status Changed', adminUsername, 'inquiry', id, `Status updated from ${oldStatus} to ${updates.status}`);
    } else {
      await this.addAuditLog('Inquiry Updated', adminUsername, 'inquiry', id, 'Inquiry details/notes updated');
    }

    return updated;
  }

  public async deleteInquiry(id: string, adminUsername: string): Promise<boolean> {
    const db = this.getDB();
    const ref = doc(db, 'inquiries', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const inq = snap.data() as Inquiry;
    await deleteDoc(ref);
    await this.addAuditLog('Inquiry Deleted', adminUsername, 'inquiry', id, `Deleted inquiry ref ${inq.reference}`);
    return true;
  }

  // ==================== BOOKINGS ====================
  public async createBooking(data: Partial<Booking>, adminUsername: string): Promise<Booking> {
    const db = this.getDB();
    const client = await this.findOrCreateClient(
      data.clientName || 'Client',
      data.clientEmail || '',
      data.clientPhone || ''
    );

    const bookingRef = generateReference('NS');
    const quote = Math.max(0, Math.round(Number(data.quoteAmount || 0) * 100) / 100);
    const deposit = Math.max(0, Math.round(Number(data.depositAmount || 0) * 100) / 100);
    const additional = Math.max(0, Math.round(Number(data.additionalPayment || 0) * 100) / 100);
    const finalP = Math.max(0, Math.round(Number(data.finalPayment || 0) * 100) / 100);
    const refund = Math.max(0, Math.round(Number(data.refundAmount || 0) * 100) / 100);
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

    await setDoc(doc(db, 'bookings', booking.id), sanitizeForFirestore(booking));

    const newBookingsCount = (client.bookingsCount || 0) + 1;
    const newCompletedCount = booking.bookingStatus === 'Completed' ? (client.completedShootsCount || 0) + 1 : (client.completedShootsCount || 0);
    const newTotalRevenue = (client.totalRevenue || 0) + totalPaid;

    await updateDoc(doc(db, 'clients', client.id), {
      bookingsCount: newBookingsCount,
      completedShootsCount: newCompletedCount,
      totalRevenue: newTotalRevenue,
      updatedAt: new Date().toISOString()
    });

    if (data.inquiryId) {
      const inqRef = doc(db, 'inquiries', data.inquiryId);
      const inqSnap = await getDoc(inqRef);
      if (inqSnap.exists()) {
        await updateDoc(inqRef, {
          status: 'Confirmed',
          convertedBookingId: booking.id
        });
      }
    }

    await this.addAuditLog('Booking Created', adminUsername, 'booking', booking.id, `Created booking ${bookingRef} for ${booking.clientName}`);
    return booking;
  }

  public async getBookings(search?: string, status?: string): Promise<Booking[]> {
    const db = this.getDB();
    const snaps = await getDocs(collection(db, 'bookings'));
    let bookings = snaps.docs.map(d => d.data() as Booking);

    return bookings.filter(b => {
      const matchesSearch = !search ||
        (b.clientName && b.clientName.toLowerCase().includes(search.toLowerCase())) ||
        (b.bookingReference && b.bookingReference.toLowerCase().includes(search.toLowerCase())) ||
        (b.clientEmail && b.clientEmail.toLowerCase().includes(search.toLowerCase())) ||
        (b.serviceTitle && b.serviceTitle.toLowerCase().includes(search.toLowerCase())) ||
        (b.location && b.location.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = !status || status === 'all' || b.bookingStatus === status;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public async getBookingById(id: string): Promise<Booking | null> {
    const db = this.getDB();
    const snap = await getDoc(doc(db, 'bookings', id));
    return snap.exists() ? (snap.data() as Booking) : null;
  }

  public async updateBooking(id: string, updates: Partial<Booking>, adminUsername: string): Promise<Booking | null> {
    const db = this.getDB();
    const ref = doc(db, 'bookings', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const booking = snap.data() as Booking;
    const oldStatus = booking.bookingStatus;
    const oldPaid = Number(booking.totalPaid || 0);

    const merged = { ...booking, ...updates };

    // Recalculate financial breakdown
    const quote = Math.max(0, Math.round(Number(merged.quoteAmount || 0) * 100) / 100);
    const deposit = Math.max(0, Math.round(Number(merged.depositAmount || 0) * 100) / 100);
    const additional = Math.max(0, Math.round(Number(merged.additionalPayment || 0) * 100) / 100);
    const finalP = Math.max(0, Math.round(Number(merged.finalPayment || 0) * 100) / 100);
    const refund = Math.max(0, Math.round(Number(merged.refundAmount || 0) * 100) / 100);
    const totalPaid = Math.max(0, (deposit + additional + finalP) - refund);

    merged.quoteAmount = quote;
    merged.depositAmount = deposit;
    merged.additionalPayment = additional;
    merged.finalPayment = finalP;
    merged.refundAmount = refund;
    merged.totalPaid = totalPaid;
    merged.flaggedOverpayment = quote > 0 && totalPaid > quote;

    if (!updates.paymentStatus && quote > 0) {
      if (refund > 0 && totalPaid === 0) merged.paymentStatus = 'Refunded';
      else if (totalPaid >= quote) merged.paymentStatus = 'Paid';
      else if (totalPaid > 0) merged.paymentStatus = totalPaid === deposit ? 'Deposit Paid' : 'Partially Paid';
      else merged.paymentStatus = 'Unpaid';
    }

    merged.updatedAt = new Date().toISOString();

    await setDoc(ref, sanitizeForFirestore(merged));

    // Recalculate client completed stats and total revenue
    if (booking.clientId) {
      const clientRef = doc(db, 'clients', booking.clientId);
      const clientSnap = await getDoc(clientRef);
      if (clientSnap.exists()) {
        const client = clientSnap.data() as Client;
        let completedShootsCount = client.completedShootsCount || 0;
        if (oldStatus !== 'Completed' && merged.bookingStatus === 'Completed') {
          completedShootsCount += 1;
        } else if (oldStatus === 'Completed' && merged.bookingStatus !== 'Completed') {
          completedShootsCount = Math.max(0, completedShootsCount - 1);
        }

        const totalRevenue = Math.max(0, (client.totalRevenue || 0) + (totalPaid - oldPaid));
        await updateDoc(clientRef, {
          totalRevenue,
          completedShootsCount,
          updatedAt: new Date().toISOString()
        });
      }
    }

    await this.addAuditLog('Booking Updated', adminUsername, 'booking', booking.id, `Updated booking ${booking.bookingReference}`);
    return merged;
  }

  public async deleteBooking(id: string, adminUsername: string): Promise<boolean> {
    const db = this.getDB();
    const ref = doc(db, 'bookings', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const booking = snap.data() as Booking;
    await deleteDoc(ref);

    // Recalculate associated client statistics accurately from all remaining records
    if (booking.clientId) {
      const clientRef = doc(db, 'clients', booking.clientId);
      const clientSnap = await getDoc(clientRef);
      if (clientSnap.exists()) {
        const client = clientSnap.data() as Client;
        const allBookingsSnaps = await getDocs(collection(db, 'bookings'));
        const remaining = allBookingsSnaps.docs
          .map(d => d.data() as Booking)
          .filter(b => b.clientId === client.id || (client.email && b.clientEmail && b.clientEmail.trim().toLowerCase() === client.email.trim().toLowerCase()));

        const bookingsCount = Math.max(0, remaining.length);
        const completedShootsCount = Math.max(0, remaining.filter(b => b.bookingStatus === 'Completed').length);
        const totalRevenue = Math.max(0, remaining.reduce((sum, b) => sum + Number(b.totalPaid || 0), 0));

        await updateDoc(clientRef, {
          bookingsCount,
          completedShootsCount,
          totalRevenue,
          updatedAt: new Date().toISOString()
        });
      }
    }

    await this.addAuditLog('Booking Deleted', adminUsername, 'booking', id, `Deleted booking ${booking.bookingReference}`);
    return true;
  }

  // ==================== CLIENTS ====================
  public async getClients(search?: string): Promise<Client[]> {
    const db = this.getDB();
    const snaps = await getDocs(collection(db, 'clients'));
    let clients = snaps.docs.map(d => d.data() as Client);

    return clients.filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  public async getClientById(id: string): Promise<{ client: Client; inquiries: Inquiry[]; bookings: Booking[] } | null> {
    const db = this.getDB();
    const clientSnap = await getDoc(doc(db, 'clients', id));
    if (!clientSnap.exists()) return null;

    const client = clientSnap.data() as Client;
    const clientEmail = (client.email || '').trim().toLowerCase();

    const [inqSnaps, bkSnaps] = await Promise.all([
      getDocs(collection(db, 'inquiries')),
      getDocs(collection(db, 'bookings'))
    ]);

    const inquiries = inqSnaps.docs
      .map(d => d.data() as Inquiry)
      .filter(i => i.clientId === id || (clientEmail && i.email && i.email.trim().toLowerCase() === clientEmail))
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    const bookings = bkSnaps.docs
      .map(d => d.data() as Booking)
      .filter(b => b.clientId === id || (clientEmail && b.clientEmail && b.clientEmail.trim().toLowerCase() === clientEmail))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { client, inquiries, bookings };
  }

  public async updateClient(id: string, updates: Partial<Client>, adminUsername: string): Promise<Client | null> {
    const db = this.getDB();
    const ref = doc(db, 'clients', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const client = snap.data() as Client;
    const sanitized = sanitizeForFirestore({ ...updates, updatedAt: new Date().toISOString() });
    await updateDoc(ref, sanitized);

    const updated = { ...client, ...sanitized };
    await this.addAuditLog('Client Profile Updated', adminUsername, 'client', id, `Updated client ${client.name}`);
    return updated;
  }

  // ==================== PORTFOLIO ====================
  public async getPortfolio(includeUnpublished: boolean = false): Promise<PortfolioItem[]> {
    const db = this.getDB();
    const snaps = await getDocs(collection(db, 'portfolio'));
    let items = snaps.docs.map(d => d.data() as (PortfolioItem & { isPublished?: boolean; order: number }));

    if (!includeUnpublished) {
      items = items.filter(i => i.isPublished !== false);
    }
    return items.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public async addPortfolioItem(item: Partial<PortfolioItem>, adminUsername: string): Promise<PortfolioItem> {
    const db = this.getDB();
    const id = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const snaps = await getDocs(collection(db, 'portfolio'));

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
      order: snaps.size
    };

    await setDoc(doc(db, 'portfolio', id), sanitizeForFirestore(newItem));
    await this.addAuditLog('Portfolio Photo Added', adminUsername, 'portfolio', id, `Added photograph "${newItem.title}"`);
    return newItem;
  }

  public async updatePortfolioItem(
    id: string,
    updates: Partial<PortfolioItem & { isPublished?: boolean; isHero?: boolean; order?: number }>,
    adminUsername: string
  ): Promise<PortfolioItem | null> {
    const db = this.getDB();
    const ref = doc(db, 'portfolio', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const item = snap.data() as PortfolioItem;
    await updateDoc(ref, sanitizeForFirestore(updates));
    const updated = { ...item, ...updates };

    await this.addAuditLog('Portfolio Photo Updated', adminUsername, 'portfolio', id, `Updated photograph "${item.title}"`);
    return updated;
  }

  public async deletePortfolioItem(id: string, adminUsername: string): Promise<boolean> {
    const db = this.getDB();
    const ref = doc(db, 'portfolio', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const item = snap.data() as PortfolioItem;
    await deleteDoc(ref);
    await this.addAuditLog('Portfolio Photo Deleted', adminUsername, 'portfolio', id, `Deleted photograph "${item.title}"`);
    return true;
  }

  public async setHeroImage(id: string, adminUsername: string): Promise<boolean> {
    const db = this.getDB();
    const targetRef = doc(db, 'portfolio', id);
    const targetSnap = await getDoc(targetRef);
    if (!targetSnap.exists()) return false;

    const targetItem = targetSnap.data() as PortfolioItem;
    const portfolioSnaps = await getDocs(collection(db, 'portfolio'));

    const batch = writeBatch(db);
    portfolioSnaps.docs.forEach(d => {
      batch.update(d.ref, { isHero: d.id === id });
    });

    batch.update(doc(db, 'settings', 'global'), {
      heroImage: targetItem.image,
      heroAlt: targetItem.alt
    });

    await batch.commit();
    await this.addAuditLog('Hero Image Changed', adminUsername, 'settings', id, `Set homepage hero to "${targetItem.title}"`);
    return true;
  }

  public async setPhotographerPortrait(url: string, alt: string, adminUsername: string): Promise<boolean> {
    const db = this.getDB();
    const settingsRef = doc(db, 'settings', 'global');
    const updates: Record<string, string> = { photographerPortrait: url };
    if (alt) updates.photographerPortraitAlt = alt;

    await updateDoc(settingsRef, updates);
    await this.addAuditLog('Photographer Portrait Changed', adminUsername, 'settings', 'portrait', 'Updated About page portrait photograph');
    return true;
  }

  // ==================== SERVICES ====================
  public async getServices(includeDisabled: boolean = false): Promise<ServiceItem[]> {
    const db = this.getDB();
    const snaps = await getDocs(collection(db, 'services'));
    let list = snaps.docs.map(d => d.data() as (ServiceItem & { isEnabled?: boolean; order: number }));

    if (!includeDisabled) {
      list = list.filter(s => s.isEnabled !== false);
    }
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public async addService(
    service: Partial<ServiceItem & { isEnabled?: boolean; quoteRangeText?: string }>,
    adminUsername: string
  ): Promise<ServiceItem> {
    const db = this.getDB();
    const id = `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const snaps = await getDocs(collection(db, 'services'));

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
      order: snaps.size,
      quoteRangeText: service.quoteRangeText || 'Custom Scoping'
    };

    await setDoc(doc(db, 'services', id), sanitizeForFirestore(newService));
    await this.addAuditLog('Service Added', adminUsername, 'service', id, `Added service "${newService.title}"`);
    return newService;
  }

  public async updateService(
    id: string,
    updates: Partial<ServiceItem & { isEnabled?: boolean; quoteRangeText?: string }>,
    adminUsername: string
  ): Promise<ServiceItem | null> {
    const db = this.getDB();
    const ref = doc(db, 'services', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const srv = snap.data() as ServiceItem;
    await updateDoc(ref, sanitizeForFirestore(updates));
    const updated = { ...srv, ...updates };

    await this.addAuditLog('Service Updated', adminUsername, 'service', id, `Updated service "${srv.title}"`);
    return updated;
  }

  public async deleteService(id: string, adminUsername: string): Promise<boolean> {
    const db = this.getDB();
    const ref = doc(db, 'services', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const srv = snap.data() as ServiceItem;
    await deleteDoc(ref);
    await this.addAuditLog('Service Deleted', adminUsername, 'service', id, `Deleted service "${srv.title}"`);
    return true;
  }

  // ==================== SETTINGS ====================
  public async getSettings(): Promise<DatabaseSchema['settings']> {
    const db = this.getDB();
    const snap = await getDoc(doc(db, 'settings', 'global'));
    if (snap.exists()) {
      return snap.data() as DatabaseSchema['settings'];
    }
    const def = getDefaultSettings();
    await setDoc(doc(db, 'settings', 'global'), sanitizeForFirestore(def));
    return def;
  }

  public async updateSettings(updates: Partial<DatabaseSchema['settings']>, adminUsername: string): Promise<DatabaseSchema['settings']> {
    const db = this.getDB();
    const ref = doc(db, 'settings', 'global');
    await updateDoc(ref, sanitizeForFirestore(updates));
    const snap = await getDoc(ref);
    await this.addAuditLog('Settings Updated', adminUsername, 'settings', 'global', 'Updated contact, socials, or brand settings');
    return snap.data() as DatabaseSchema['settings'];
  }

  // ==================== ANALYTICS ====================
  public async recordAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const db = this.getDB();
      const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const item: AnalyticsEvent = {
        id,
        ...event,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'analyticsEvents', id), sanitizeForFirestore(item));
    } catch (err) {
      console.error('[DB] Failed to record analytics event:', err);
    }
  }

  public async getAnalyticsSummary(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: AnalyticsEvent[];
    popularCategories: Record<string, number>;
    popularImages: Record<string, number>;
  }> {
    const db = this.getDB();
    const snaps = await getDocs(collection(db, 'analyticsEvents'));
    const events = snaps.docs.map(d => d.data() as AnalyticsEvent);

    const eventsByType: Record<string, number> = {};
    const popularCategories: Record<string, number> = {};
    const popularImages: Record<string, number> = {};

    for (const ev of events) {
      eventsByType[ev.eventType] = (eventsByType[ev.eventType] || 0) + 1;
      if (ev.eventType === 'category_select' && ev.target) {
        popularCategories[ev.target] = (popularCategories[ev.target] || 0) + 1;
      }
      if (ev.eventType === 'portfolio_open' && ev.target) {
        popularImages[ev.target] = (popularImages[ev.target] || 0) + 1;
      }
    }

    return {
      totalEvents: events.length,
      eventsByType,
      recentEvents: events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50),
      popularCategories,
      popularImages
    };
  }

  // ==================== AUDIT LOGS ====================
  public async addAuditLog(
    action: string,
    adminUsername: string,
    recordType: AuditLog['recordType'],
    recordId: string | undefined,
    details: string
  ): Promise<void> {
    try {
      const db = this.getDB();
      const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const log: AuditLog = {
        id,
        action,
        adminUsername,
        recordType,
        recordId: recordId || undefined,
        details,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'auditLogs', id), sanitizeForFirestore(log));
    } catch (err) {
      console.error('[DB] Error writing audit log:', err);
    }
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    const db = this.getDB();
    const snaps = await getDocs(collection(db, 'auditLogs'));
    return snaps.docs
      .map(d => d.data() as AuditLog)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ==================== DASHBOARD STATS ====================
  public async getDashboardStats(): Promise<DashboardStats> {
    const db = this.getDB();
    const [inqSnaps, bkSnaps, cliSnaps, portSnaps] = await Promise.all([
      getDocs(collection(db, 'inquiries')),
      getDocs(collection(db, 'bookings')),
      getDocs(collection(db, 'clients')),
      getDocs(collection(db, 'portfolio'))
    ]);

    const inquiries = inqSnaps.docs.map(d => d.data() as Inquiry);
    const bookings = bkSnaps.docs.map(d => d.data() as Booking);
    const clients = cliSnaps.docs.map(d => d.data() as Client);
    const portfolio = portSnaps.docs.map(d => d.data() as (PortfolioItem & { isPublished?: boolean }));

    const totalInquiries = inquiries.length;
    const pendingInquiries = inquiries.filter(i => i.status === 'New' || i.status === 'Contacted').length;
    const activeBookings = bookings.filter(b => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'In Progress' || b.bookingStatus === 'Awaiting Deposit').length;
    const completedShoots = bookings.filter(b => b.bookingStatus === 'Completed').length;

    let totalRevenue = 0;
    let paidRevenue = 0;

    for (const b of bookings) {
      totalRevenue += Number(b.quoteAmount || 0);
      paidRevenue += Number(b.totalPaid || 0);
    }

    const outstandingRevenue = Math.max(0, totalRevenue - paidRevenue);
    const totalClients = clients.length;
    const publishedPortfolioCount = portfolio.filter(p => p.isPublished !== false).length;

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
  public async addConversionRecord(
    record: Omit<CurrencyConversionRecord, 'id'>,
    adminUsername: string
  ): Promise<CurrencyConversionRecord> {
    const db = this.getDB();
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const item: CurrencyConversionRecord = {
      id,
      ...record
    };

    await setDoc(doc(db, 'conversionHistory', id), sanitizeForFirestore(item));
    await this.addAuditLog(
      'Currency Converted',
      adminUsername,
      'settings',
      id,
      `Converted ${record.originalCurrency} ${record.originalAmount} -> GHS ${record.convertedAmount} (Rate: 1 ${record.originalCurrency} = GH₵${record.exchangeRate}, Type: ${record.rateType})`
    );

    return item;
  }

  public async getConversionHistory(limit: number = 50): Promise<CurrencyConversionRecord[]> {
    const db = this.getDB();
    const snaps = await getDocs(collection(db, 'conversionHistory'));
    return snaps.docs
      .map(d => d.data() as CurrencyConversionRecord)
      .sort((a, b) => new Date(b.convertedAt).getTime() - new Date(a.convertedAt).getTime())
      .slice(0, limit);
  }

  public async clearConversionHistory(adminUsername: string): Promise<boolean> {
    const db = this.getDB();
    const snaps = await getDocs(collection(db, 'conversionHistory'));
    if (!snaps.empty) {
      const batch = writeBatch(db);
      snaps.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    await this.addAuditLog('Conversion History Cleared', adminUsername, 'settings', undefined, 'Cleared admin currency conversion history');
    return true;
  }

  // ==================== EXPENSES & FINANCE TRACKING ====================
  public async getExpenses(filter?: {
    category?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    timeRange?: string;
    paymentMethod?: string;
  }): Promise<Expense[]> {
    const db = this.getDB();
    const snaps = await getDocs(collection(db, 'expenses'));
    let list = snaps.docs.map(d => d.data() as Expense);

    if (filter) {
      if (filter.category && filter.category !== 'all') {
        list = list.filter(e => e.category.toLowerCase() === filter.category!.toLowerCase());
      }
      if (filter.paymentMethod && filter.paymentMethod !== 'all') {
        list = list.filter(e => e.paymentMethod.toLowerCase() === filter.paymentMethod!.toLowerCase());
      }
      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(e =>
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.category && e.category.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          (e.receiptRef && e.receiptRef.toLowerCase().includes(q)) ||
          (e.paymentMethod && e.paymentMethod.toLowerCase().includes(q))
        );
      }

      let filterStart = filter.startDate;
      let filterEnd = filter.endDate;
      if (filter.timeRange && !filterStart && !filterEnd) {
        const resolved = resolveDateFilter(filter.timeRange);
        filterStart = resolved.startDate;
        filterEnd = resolved.endDate;
      }

      if (filterStart || filterEnd) {
        list = list.filter(e => {
          const eDate = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');
          return isDateInRange(eDate, filterStart, filterEnd);
        });
      }
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public async getExpenseById(id: string): Promise<Expense | null> {
    const db = this.getDB();
    const snap = await getDoc(doc(db, 'expenses', id));
    return snap.exists() ? (snap.data() as Expense) : null;
  }

  public async createExpense(
    data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>,
    adminUsername: string
  ): Promise<Expense> {
    const db = this.getDB();
    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const amt = Math.max(0, Math.round(Number(data.amount || 0) * 100) / 100);

    const expense: Expense = {
      id,
      category: data.category || 'Other',
      amount: amt,
      date: data.date || new Date().toISOString().split('T')[0],
      description: (data.description || '').trim(),
      paymentMethod: data.paymentMethod || 'Mobile Money',
      receiptRef: data.receiptRef ? data.receiptRef.trim() : undefined,
      notes: data.notes ? data.notes.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'expenses', id), sanitizeForFirestore(expense));
    await this.addAuditLog(
      'Expense Created',
      adminUsername,
      'expense',
      id,
      `Recorded expense of GH₵${amt.toFixed(2)} (${expense.category}: ${expense.description})`
    );

    return expense;
  }

  public async updateExpense(id: string, updates: Partial<Expense>, adminUsername: string): Promise<Expense | null> {
    const db = this.getDB();
    const ref = doc(db, 'expenses', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const expense = snap.data() as Expense;

    if (updates.amount !== undefined) {
      expense.amount = Math.max(0, Math.round(Number(updates.amount || 0) * 100) / 100);
    }
    if (updates.date && /^\d{4}-\d{2}-\d{2}$/.test(updates.date)) {
      expense.date = updates.date;
    }
    if (updates.category) expense.category = updates.category;
    if (updates.description !== undefined) expense.description = updates.description.trim();
    if (updates.paymentMethod) expense.paymentMethod = updates.paymentMethod;
    if (updates.receiptRef !== undefined) expense.receiptRef = updates.receiptRef ? updates.receiptRef.trim() : undefined;
    if (updates.notes !== undefined) expense.notes = updates.notes ? updates.notes.trim() : undefined;

    expense.updatedAt = new Date().toISOString();

    await setDoc(ref, sanitizeForFirestore(expense));
    await this.addAuditLog(
      'Expense Updated',
      adminUsername,
      'expense',
      expense.id,
      `Updated expense ${expense.id} (GH₵${expense.amount.toFixed(2)} - ${expense.category})`
    );

    return expense;
  }

  public async deleteExpense(id: string, adminUsername: string): Promise<boolean> {
    const db = this.getDB();
    const ref = doc(db, 'expenses', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const removed = snap.data() as Expense;
    await deleteDoc(ref);
    await this.addAuditLog(
      'Expense Deleted',
      adminUsername,
      'expense',
      id,
      `Deleted expense of GH₵${removed.amount.toFixed(2)} (${removed.category}: ${removed.description})`
    );

    return true;
  }

  // ==================== FINANCIAL CALCULATIONS & ANALYTICS ====================
  public async getFinanceOverview(timeRange: string = 'all', customStart?: string, customEnd?: string): Promise<FinanceOverviewStats> {
    const db = this.getDB();
    const [bkSnaps, expSnaps] = await Promise.all([
      getDocs(collection(db, 'bookings')),
      getDocs(collection(db, 'expenses'))
    ]);

    const allBookings = bkSnaps.docs.map(d => d.data() as Booking);
    const allExpenses = expSnaps.docs.map(d => d.data() as Expense);

    const { startDate, endDate } = resolveDateFilter(timeRange, customStart, customEnd);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const currentYearKey = `${currentYear}`;

    let totalRevenue = 0;
    let revenueThisMonth = 0;
    let revenueThisYear = 0;
    let depositRevenue = 0;
    let finalPaymentRevenue = 0;
    let additionalPaymentRevenue = 0;
    let refundedTotal = 0;
    let outstandingPayments = 0;
    let paidBookingsCount = 0;
    let totalBookingsCount = 0;

    for (const b of allBookings) {
      const isCancelled = b.bookingStatus === 'Cancelled';
      const quote = Number(b.quoteAmount || 0);
      const paid = Number(b.totalPaid || 0);
      const deposit = Number(b.depositAmount || 0);
      const finalP = Number(b.finalPayment || 0);
      const additional = Number(b.additionalPayment || 0);
      const refund = Number(b.refundAmount || 0);
      const bookingDateStr = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');

      // Secondary calendar comparisons (always current month & current year lifetime metrics)
      if (!isCancelled || paid > 0) {
        if (bookingDateStr.startsWith(currentMonthKey)) {
          revenueThisMonth += paid;
        }
        if (bookingDateStr.startsWith(currentYearKey)) {
          revenueThisYear += paid;
        }
      }

      // Check if within selected date filter
      const inRange = isDateInRange(bookingDateStr, startDate, endDate);
      if (!inRange) continue;

      if (isCancelled) {
        if (paid > 0) {
          totalRevenue += paid;
          depositRevenue += deposit;
          finalPaymentRevenue += finalP;
          additionalPaymentRevenue += additional;
          refundedTotal += refund;
        } else if (refund > 0) {
          depositRevenue += deposit;
          finalPaymentRevenue += finalP;
          additionalPaymentRevenue += additional;
          refundedTotal += refund;
        }
        continue;
      }

      // Active / Non-cancelled bookings
      totalBookingsCount += 1;
      if (paid > 0) {
        paidBookingsCount += 1;
        totalRevenue += paid;
      }

      depositRevenue += deposit;
      finalPaymentRevenue += finalP;
      additionalPaymentRevenue += additional;
      refundedTotal += refund;

      const outstanding = Math.max(0, quote - paid);
      outstandingPayments += outstanding;
    }

    let totalExpenses = 0;
    let expensesThisMonth = 0;
    let expensesThisYear = 0;

    for (const e of allExpenses) {
      const amt = Number(e.amount || 0);
      const expenseDateStr = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');

      // Secondary calendar comparisons
      if (expenseDateStr.startsWith(currentMonthKey)) {
        expensesThisMonth += amt;
      }
      if (expenseDateStr.startsWith(currentYearKey)) {
        expensesThisYear += amt;
      }

      // Check if within selected date filter
      if (!isDateInRange(expenseDateStr, startDate, endDate)) continue;

      totalExpenses += amt;
    }

    const netIncome = Math.round((totalRevenue - totalExpenses) * 100) / 100;
    const netIncomeThisMonth = Math.round((revenueThisMonth - expensesThisMonth) * 100) / 100;
    const netIncomeThisYear = Math.round((revenueThisYear - expensesThisYear) * 100) / 100;
    const averageBookingValue = paidBookingsCount > 0
      ? Math.round((totalRevenue / paidBookingsCount) * 100) / 100
      : (totalBookingsCount > 0 ? Math.round((totalRevenue / totalBookingsCount) * 100) / 100 : 0);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      revenueThisYear: Math.round(revenueThisYear * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      expensesThisMonth: Math.round(expensesThisMonth * 100) / 100,
      expensesThisYear: Math.round(expensesThisYear * 100) / 100,
      netIncome,
      netIncomeThisMonth,
      netIncomeThisYear,
      outstandingPayments: Math.round(outstandingPayments * 100) / 100,
      paidBookingsCount,
      totalBookingsCount,
      averageBookingValue,
      depositRevenue: Math.round(depositRevenue * 100) / 100,
      finalPaymentRevenue: Math.round(finalPaymentRevenue * 100) / 100,
      additionalPaymentRevenue: Math.round(additionalPaymentRevenue * 100) / 100,
      refundedTotal: Math.round(refundedTotal * 100) / 100
    };
  }

  public async getFinanceAnalytics(timeRange: string = 'this_year', customStart?: string, customEnd?: string): Promise<FinanceAnalyticsData> {
    const db = this.getDB();
    const [bkSnaps, expSnaps] = await Promise.all([
      getDocs(collection(db, 'bookings')),
      getDocs(collection(db, 'expenses'))
    ]);

    const allBookings = bkSnaps.docs.map(d => d.data() as Booking);
    const allExpenses = expSnaps.docs.map(d => d.data() as Expense);

    const { startDate, endDate } = resolveDateFilter(timeRange, customStart, customEnd);

    // 1. Monthly Revenue & Expenses (Rolling Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyRevenue: FinanceAnalyticsData['monthlyRevenue'] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const monthLabel = `${monthNames[m]} ${y}`;

      const mRevenue = allBookings
        .filter(b => b.bookingStatus !== 'Cancelled' || Number(b.totalPaid || 0) > 0)
        .filter(b => {
          const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
          return bDate.startsWith(monthKey);
        })
        .reduce((sum, b) => sum + Number(b.totalPaid || 0), 0);

      const mExpenses = allExpenses
        .filter(e => {
          const eDate = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');
          return eDate.startsWith(monthKey);
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      monthlyRevenue.push({
        month: monthKey,
        monthLabel,
        revenue: Math.round(mRevenue * 100) / 100,
        expenses: Math.round(mExpenses * 100) / 100,
        netIncome: Math.round((mRevenue - mExpenses) * 100) / 100
      });
    }

    // 2. Revenue Over Time
    const revenueOverTime: FinanceAnalyticsData['revenueOverTime'] = [];

    if (timeRange === 'this_year') {
      const year = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
        const label = `${monthNames[m]} ${year}`;

        const mRevenue = allBookings
          .filter(b => b.bookingStatus !== 'Cancelled' || Number(b.totalPaid || 0) > 0)
          .filter(b => {
            const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
            return bDate.startsWith(monthKey);
          })
          .reduce((sum, b) => sum + Number(b.totalPaid || 0), 0);

        const mExpenses = allExpenses
          .filter(e => {
            const eDate = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');
            return eDate.startsWith(monthKey);
          })
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        revenueOverTime.push({
          date: label,
          revenue: Math.round(mRevenue * 100) / 100,
          expenses: Math.round(mExpenses * 100) / 100,
          netIncome: Math.round((mRevenue - mExpenses) * 100) / 100
        });
      }
    } else if (timeRange === 'this_month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const label = `${monthNames[month]} ${String(day).padStart(2, '0')}`;

        const dayRev = allBookings
          .filter(b => b.bookingStatus !== 'Cancelled' || Number(b.totalPaid || 0) > 0)
          .filter(b => {
            const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
            return bDate === dayKey;
          })
          .reduce((sum, b) => sum + Number(b.totalPaid || 0), 0);

        const dayExp = allExpenses
          .filter(e => {
            const eDate = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');
            return eDate === dayKey;
          })
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        revenueOverTime.push({
          date: label,
          revenue: Math.round(dayRev * 100) / 100,
          expenses: Math.round(dayExp * 100) / 100,
          netIncome: Math.round((dayRev - dayExp) * 100) / 100
        });
      }
    } else if (timeRange === 'this_week') {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        const y = d.getFullYear();
        const m = d.getMonth();
        const dayNum = d.getDate();
        const dayKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const label = `${weekdayNames[d.getDay()]} ${monthNames[m]} ${String(dayNum).padStart(2, '0')}`;

        const dayRev = allBookings
          .filter(b => b.bookingStatus !== 'Cancelled' || Number(b.totalPaid || 0) > 0)
          .filter(b => {
            const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
            return bDate === dayKey;
          })
          .reduce((sum, b) => sum + Number(b.totalPaid || 0), 0);

        const dayExp = allExpenses
          .filter(e => {
            const eDate = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');
            return eDate === dayKey;
          })
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        revenueOverTime.push({
          date: label,
          revenue: Math.round(dayRev * 100) / 100,
          expenses: Math.round(dayExp * 100) / 100,
          netIncome: Math.round((dayRev - dayExp) * 100) / 100
        });
      }
    } else if (timeRange === 'today') {
      const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const label = `Today (${monthNames[now.getMonth()]} ${now.getDate()})`;

      const dayRev = allBookings
        .filter(b => b.bookingStatus !== 'Cancelled' || Number(b.totalPaid || 0) > 0)
        .filter(b => {
          const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
          return bDate === dayKey;
        })
        .reduce((sum, b) => sum + Number(b.totalPaid || 0), 0);

      const dayExp = allExpenses
        .filter(e => {
          const eDate = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');
          return eDate === dayKey;
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      revenueOverTime.push({
        date: label,
        revenue: Math.round(dayRev * 100) / 100,
        expenses: Math.round(dayExp * 100) / 100,
        netIncome: Math.round((dayRev - dayExp) * 100) / 100
      });
    } else if (timeRange === 'last_3_months') {
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
        const label = `${monthNames[m]} ${y}`;

        const mRevenue = allBookings
          .filter(b => b.bookingStatus !== 'Cancelled' || Number(b.totalPaid || 0) > 0)
          .filter(b => {
            const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
            return bDate.startsWith(monthKey);
          })
          .reduce((sum, b) => sum + Number(b.totalPaid || 0), 0);

        const mExpenses = allExpenses
          .filter(e => {
            const eDate = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');
            return eDate.startsWith(monthKey);
          })
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        revenueOverTime.push({
          date: label,
          revenue: Math.round(mRevenue * 100) / 100,
          expenses: Math.round(mExpenses * 100) / 100,
          netIncome: Math.round((mRevenue - mExpenses) * 100) / 100
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
        const label = `${monthNames[m]} ${y}`;

        const mRevenue = allBookings
          .filter(b => b.bookingStatus !== 'Cancelled' || Number(b.totalPaid || 0) > 0)
          .filter(b => {
            const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
            return bDate.startsWith(monthKey);
          })
          .reduce((sum, b) => sum + Number(b.totalPaid || 0), 0);

        const mExpenses = allExpenses
          .filter(e => {
            const eDate = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');
            return eDate.startsWith(monthKey);
          })
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        revenueOverTime.push({
          date: label,
          revenue: Math.round(mRevenue * 100) / 100,
          expenses: Math.round(mExpenses * 100) / 100,
          netIncome: Math.round((mRevenue - mExpenses) * 100) / 100
        });
      }
    }

    // 3. Revenue by Service
    const serviceMap: Record<string, { revenue: number; count: number }> = {};
    let totalServiceRevenue = 0;

    for (const b of allBookings) {
      const isCancelled = b.bookingStatus === 'Cancelled';
      const paid = Number(b.totalPaid || 0);
      if (isCancelled && paid === 0) continue;

      const bookingDateStr = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
      if (!isDateInRange(bookingDateStr, startDate, endDate)) continue;

      const srv = b.serviceTitle || 'Editorial Shoot';
      if (!serviceMap[srv]) {
        serviceMap[srv] = { revenue: 0, count: 0 };
      }
      serviceMap[srv].revenue += paid;
      if (!isCancelled) {
        serviceMap[srv].count += 1;
      }
      totalServiceRevenue += paid;
    }

    const revenueByService: FinanceAnalyticsData['revenueByService'] = Object.entries(serviceMap)
      .map(([service, data]) => ({
        service,
        revenue: Math.round(data.revenue * 100) / 100,
        count: data.count,
        percentage: totalServiceRevenue > 0 ? Math.round((data.revenue / totalServiceRevenue) * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 4. Expenses by Category
    const categoryMap: Record<string, { amount: number; count: number }> = {};
    let totalCatExpense = 0;

    for (const e of allExpenses) {
      const expenseDateStr = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (!isDateInRange(expenseDateStr, startDate, endDate)) continue;

      const cat = e.category || 'Other';
      const amt = Number(e.amount || 0);
      if (!categoryMap[cat]) {
        categoryMap[cat] = { amount: 0, count: 0 };
      }
      categoryMap[cat].amount += amt;
      categoryMap[cat].count += 1;
      totalCatExpense += amt;
    }

    const expensesByCategory: FinanceAnalyticsData['expensesByCategory'] = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count,
        percentage: totalCatExpense > 0 ? Math.round((data.amount / totalCatExpense) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // 5. Paid vs Outstanding
    let paidTotal = 0;
    let paidCount = 0;
    let outstandingTotal = 0;
    let outstandingCount = 0;

    for (const b of allBookings) {
      const isCancelled = b.bookingStatus === 'Cancelled';
      const quote = Number(b.quoteAmount || 0);
      const paid = Number(b.totalPaid || 0);
      if (isCancelled && paid === 0) continue;

      const bookingDateStr = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
      if (!isDateInRange(bookingDateStr, startDate, endDate)) continue;

      paidTotal += paid;
      if (!isCancelled) {
        if (paid >= quote && quote > 0) paidCount++;
        const out = Math.max(0, quote - paid);
        if (out > 0) {
          outstandingTotal += out;
          outstandingCount++;
        }
      }
    }

    const paidVsOutstanding: FinanceAnalyticsData['paidVsOutstanding'] = [
      { name: 'Paid Collections', value: Math.round(paidTotal * 100) / 100, count: paidCount, color: '#10B981' },
      { name: 'Outstanding Balances', value: Math.round(outstandingTotal * 100) / 100, count: outstandingCount, color: '#F59E0B' }
    ];

    // 6. Income Components
    let totalDeposits = 0;
    let totalFinal = 0;
    let totalAdditional = 0;

    for (const b of allBookings) {
      const isCancelled = b.bookingStatus === 'Cancelled';
      const paid = Number(b.totalPaid || 0);
      if (isCancelled && paid === 0) continue;

      const bookingDateStr = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
      if (!isDateInRange(bookingDateStr, startDate, endDate)) continue;

      totalDeposits += Number(b.depositAmount || 0);
      totalFinal += Number(b.finalPayment || 0);
      totalAdditional += Number(b.additionalPayment || 0);
    }
    const totalCollected = totalDeposits + totalFinal + totalAdditional;

    const incomeComponents: FinanceAnalyticsData['incomeComponents'] = [
      {
        name: 'Deposit Payments',
        value: Math.round(totalDeposits * 100) / 100,
        percentage: totalCollected > 0 ? Math.round((totalDeposits / totalCollected) * 100) : 0,
        color: '#D4AF37'
      },
      {
        name: 'Final Balance Payments',
        value: Math.round(totalFinal * 100) / 100,
        percentage: totalCollected > 0 ? Math.round((totalFinal / totalCollected) * 100) : 0,
        color: '#10B981'
      },
      {
        name: 'Additional Shoot Payments',
        value: Math.round(totalAdditional * 100) / 100,
        percentage: totalCollected > 0 ? Math.round((totalAdditional / totalCollected) * 100) : 0,
        color: '#6366F1'
      }
    ];

    return {
      revenueOverTime,
      monthlyRevenue,
      revenueByService,
      expensesByCategory,
      paidVsOutstanding,
      incomeComponents
    };
  }

  public async getFinancialTransactions(filter?: {
    search?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    timeRange?: string;
    limit?: number;
  }): Promise<FinancialTransaction[]> {
    const db = this.getDB();
    const [bkSnaps, expSnaps] = await Promise.all([
      getDocs(collection(db, 'bookings')),
      getDocs(collection(db, 'expenses'))
    ]);

    const allBookings = bkSnaps.docs.map(d => d.data() as Booking);
    const allExpenses = expSnaps.docs.map(d => d.data() as Expense);

    const transactions: FinancialTransaction[] = [];

    // Transform Bookings into Transaction Records
    for (const b of allBookings) {
      const isCancelled = b.bookingStatus === 'Cancelled';
      const quote = Number(b.quoteAmount || 0);
      const paid = Number(b.totalPaid || 0);
      const deposit = Number(b.depositAmount || 0);
      const finalP = Number(b.finalPayment || 0);
      const additional = Number(b.additionalPayment || 0);
      const refund = Number(b.refundAmount || 0);
      const date = b.date || (b.createdAt ? b.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);

      const isRetained = isCancelled && paid > 0;

      if (deposit > 0) {
        let status: FinancialTransaction['status'] = 'Deposit Paid';
        if (isRetained) {
          status = 'Cancelled — Deposit Retained';
        } else if (isCancelled) {
          status = refund >= deposit ? 'Refunded' : 'Cancelled';
        } else if (paid >= quote) {
          status = 'Paid';
        }

        transactions.push({
          id: `tx_dep_${b.id}`,
          date,
          type: 'deposit',
          typeLabel: isRetained ? 'Retained Deposit' : isCancelled ? 'Cancelled Deposit' : 'Deposit Payment',
          title: isRetained
            ? `Retained Deposit - ${b.serviceTitle}`
            : isCancelled
            ? `Cancelled Deposit - ${b.serviceTitle}`
            : `Deposit - ${b.serviceTitle}`,
          clientOrPayee: b.clientName,
          serviceOrCategory: b.serviceTitle,
          amount: deposit,
          status,
          paymentMethod: 'Mobile Money / Transfer',
          notes: b.notes ? `Booking ref: ${b.bookingReference}. ${b.notes}` : `Booking ref: ${b.bookingReference}`,
          bookingId: b.id,
          bookingRef: b.bookingReference
        });
      }

      if (additional > 0) {
        let status: FinancialTransaction['status'] = 'Partially Paid';
        if (isRetained) {
          status = 'Cancelled — Payment Retained';
        } else if (isCancelled) {
          status = 'Cancelled';
        }

        transactions.push({
          id: `tx_add_${b.id}`,
          date,
          type: 'additional_payment',
          typeLabel: isRetained ? 'Retained Add-on' : 'Additional Payment',
          title: `Add-on - ${b.serviceTitle}`,
          clientOrPayee: b.clientName,
          serviceOrCategory: b.serviceTitle,
          amount: additional,
          status,
          paymentMethod: 'Bank Transfer / MoMo',
          notes: `Booking ref: ${b.bookingReference}`,
          bookingId: b.id,
          bookingRef: b.bookingReference
        });
      }

      if (finalP > 0) {
        let status: FinancialTransaction['status'] = 'Paid';
        if (isRetained) {
          status = 'Cancelled — Payment Retained';
        } else if (isCancelled) {
          status = 'Cancelled';
        }

        transactions.push({
          id: `tx_fin_${b.id}`,
          date,
          type: 'final_payment',
          typeLabel: isRetained ? 'Retained Final Payment' : 'Final Balance Payment',
          title: `Final Payment - ${b.serviceTitle}`,
          clientOrPayee: b.clientName,
          serviceOrCategory: b.serviceTitle,
          amount: finalP,
          status,
          paymentMethod: 'Direct Payment',
          notes: `Booking ref: ${b.bookingReference}`,
          bookingId: b.id,
          bookingRef: b.bookingReference
        });
      }

      if (quote > 0 && paid === 0 && !isCancelled) {
        transactions.push({
          id: `tx_pen_${b.id}`,
          date,
          type: 'booking_full',
          typeLabel: 'Pending Invoice',
          title: `Pending Quote - ${b.serviceTitle}`,
          clientOrPayee: b.clientName,
          serviceOrCategory: b.serviceTitle,
          amount: quote,
          status: 'Pending',
          paymentMethod: 'Unpaid',
          notes: `Booking ref: ${b.bookingReference}`,
          bookingId: b.id,
          bookingRef: b.bookingReference
        });
      }

      if (refund > 0) {
        transactions.push({
          id: `tx_ref_${b.id}`,
          date,
          type: 'refund',
          typeLabel: 'Client Refund',
          title: `Refund - ${b.serviceTitle}`,
          clientOrPayee: b.clientName,
          serviceOrCategory: b.serviceTitle,
          amount: -refund,
          status: 'Refunded',
          paymentMethod: 'Reversed Payment',
          notes: `Refunded for booking ${b.bookingReference}${isCancelled ? ' (Cancelled booking)' : ''}`,
          bookingId: b.id,
          bookingRef: b.bookingReference
        });
      }
    }

    // Transform Expenses into Transaction Records
    for (const e of allExpenses) {
      transactions.push({
        id: `tx_exp_${e.id}`,
        date: e.date || (e.createdAt ? e.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        type: 'expense',
        typeLabel: `Expense (${e.category})`,
        title: e.description || `Expense: ${e.category}`,
        clientOrPayee: e.description,
        serviceOrCategory: e.category,
        amount: -Number(e.amount || 0),
        status: 'Completed',
        paymentMethod: e.paymentMethod || 'Mobile Money',
        notes: [e.receiptRef ? `Receipt: ${e.receiptRef}` : '', e.notes || ''].filter(Boolean).join(' - ') || undefined,
        expenseId: e.id
      });
    }

    let result = transactions;

    if (filter) {
      if (filter.type && filter.type !== 'all') {
        if (filter.type === 'income') {
          result = result.filter(t => t.type !== 'expense' && t.type !== 'refund');
        } else if (filter.type === 'expense') {
          result = result.filter(t => t.type === 'expense');
        } else {
          result = result.filter(t => t.type === filter.type);
        }
      }

      if (filter.status && filter.status !== 'all') {
        result = result.filter(t => t.status.toLowerCase() === filter.status!.toLowerCase());
      }

      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        result = result.filter(t =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.clientOrPayee && t.clientOrPayee.toLowerCase().includes(q)) ||
          (t.serviceOrCategory && t.serviceOrCategory.toLowerCase().includes(q)) ||
          (t.bookingRef && t.bookingRef.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q))
        );
      }

      let filterStart = filter.startDate;
      let filterEnd = filter.endDate;
      if (filter.timeRange && !filterStart && !filterEnd) {
        const resolved = resolveDateFilter(filter.timeRange);
        filterStart = resolved.startDate;
        filterEnd = resolved.endDate;
      }

      if (filterStart || filterEnd) {
        result = result.filter(t => isDateInRange(t.date, filterStart, filterEnd));
      }
    }

    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filter?.limit && filter.limit > 0) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }
}

export const db = new Database();
