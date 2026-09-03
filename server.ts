import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { AdminUser } from './src/types';
import {
  getLiveRateToGHS,
  getAllRatesToGHS,
  calculateGHSConversion,
  SUPPORTED_CURRENCIES
} from './src/server/currencyService';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  validateFinancialFields,
  checkRateDeviation
} from './src/server/validation';

interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
}

async function startServer() {
  const app = express();
  const rawPort = process.env.PORT;
  const parsedPort = parseInt(rawPort || '3000', 10);
  const PORT = !isNaN(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

  // JSON payload parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger for API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
      });
    }
    next();
  });

  // ==================== AUTH MIDDLEWARE ====================
  const requireAdminAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-admin-token']) {
      token = String(req.headers['x-admin-token']).trim();
    }

    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
      return;
    }

    const adminUser = db.validateSession(token);
    if (!adminUser) {
      res.status(401).json({ error: 'Unauthorized: Session invalid or expired. Please log in again.' });
      return;
    }

    req.adminUser = adminUser;

    // Strict Server-Side Password Change Enforcement
    if (adminUser.mustChangePassword) {
      const allowedPaths = ['/api/admin/change-password', '/api/admin/logout', '/api/admin/me'];
      if (!allowedPaths.includes(req.path)) {
        res.status(403).json({
          error: 'PASSWORD_CHANGE_REQUIRED',
          message: 'Password change is required before accessing administrative features.'
        });
        return;
      }
    }

    next();
  };

  // ==================== PUBLIC API ENDPOINTS ====================
  // Production-grade health check that tests database readiness and static asset availability
  app.get('/api/health', (req, res) => {
    try {
      const dbHealthy = db.isHealthy();
      const isProd = process.env.NODE_ENV === 'production';
      const frontendReady = !isProd || fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));

      if (!dbHealthy || !frontendReady) {
        console.warn(`[NINETIES SHOTS] [HEALTH DEGRADED] database=${dbHealthy}, frontendReady=${frontendReady}`);
        res.status(503).json({
          status: 'degraded',
          subsystem: !dbHealthy ? 'database' : 'static_frontend',
          time: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        status: 'ok',
        time: new Date().toISOString(),
        brand: 'NINETIES SHOTS'
      });
    } catch (err) {
      res.status(503).json({
        status: 'error',
        time: new Date().toISOString()
      });
    }
  });

  // Public Configuration
  app.get('/api/public/config', (req, res) => {
    try {
      const settings = db.getSettings();
      res.json({
        brandName: settings.brandName,
        tagline: settings.tagline,
        phone: settings.phone,
        whatsappNumber: settings.whatsappNumber,
        whatsappDefaultMessage: settings.whatsappDefaultMessage,
        email: settings.email,
        location: settings.location,
        availabilityNotice: settings.availabilityNotice,
        heroImage: settings.heroImage,
        heroAlt: settings.heroAlt,
        photographerPortrait: settings.photographerPortrait,
        photographerPortraitAlt: settings.photographerPortraitAlt,
        socials: settings.socials
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve public configuration' });
    }
  });

  // Public Portfolio (Only Published)
  app.get('/api/public/portfolio', (req, res) => {
    try {
      const items = db.getPortfolio(false);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load portfolio' });
    }
  });

  // Public Services (Only Enabled)
  app.get('/api/public/services', (req, res) => {
    try {
      const services = db.getServices(false);
      res.json(services);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load services' });
    }
  });

  // Public Inquiry Submission
  app.post('/api/inquiries', (req, res) => {
    try {
      const fullName = req.body.fullName || req.body.clientName || '';
      const email = req.body.email || '';
      const phoneOrWhatsapp = req.body.phoneOrWhatsapp || req.body.phone || '';
      const shootType = req.body.shootType || 'Editorial & Fashion';
      const preferredDate = req.body.preferredDate || '';
      const location = req.body.location || '';
      const budgetRange = req.body.budgetRange || '';
      const message = req.body.message || '';

      if (!fullName.trim() || (!email.trim() && !phoneOrWhatsapp.trim())) {
        res.status(400).json({
          error: 'Validation failed: Full Name and at least one contact channel (Phone or Email) are required.'
        });
        return;
      }

      const inquiry = db.createInquiry({
        fullName: String(fullName).trim().slice(0, 150),
        email: String(email).trim().slice(0, 150),
        phoneOrWhatsapp: String(phoneOrWhatsapp).trim().slice(0, 50),
        shootType: String(shootType).slice(0, 100),
        preferredDate: String(preferredDate).slice(0, 50),
        location: String(location).slice(0, 150),
        budgetRange: String(budgetRange || '').slice(0, 100),
        message: String(message || '').slice(0, 3000)
      });

      res.status(201).json({
        success: true,
        reference: inquiry.reference,
        inquiryId: inquiry.id,
        message: 'Inquiry received securely. We will be in touch shortly.'
      });
    } catch (err: any) {
      console.error('Error submitting inquiry:', err);
      res.status(500).json({ error: 'Internal server error while processing inquiry.' });
    }
  });

  // First-party Privacy Analytics Event
  app.post('/api/analytics/event', (req, res) => {
    try {
      const { eventType, path: eventPath, target, metadata } = req.body;
      if (!eventType) {
        res.status(400).json({ error: 'Missing eventType' });
        return;
      }
      db.recordAnalyticsEvent({
        eventType,
        path: eventPath,
        target,
        metadata
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to record event' });
    }
  });

  // ==================== ADMIN AUTH ENDPOINTS ====================
  app.post('/api/admin/login', (req, res) => {
    try {
      const { username, password } = req.body;
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      // Rate limit check (IP+Username and Account-level lockout)
      const rateLimit = checkLoginRateLimit(clientIp, String(username));
      if (!rateLimit.allowed) {
        if (rateLimit.isAccountLockout) {
          db.addAuditLog(
            'Account Locked',
            String(username),
            'auth',
            'admin-login',
            `Account locked due to exceeding failure threshold (15 attempts/hour) across networks.`
          );
        } else {
          db.addAuditLog(
            'Failed Login Rate Limit',
            String(username),
            'auth',
            'admin-login',
            `IP rate limit triggered from IP ${clientIp}`
          );
        }

        res.status(429).json({
          error: rateLimit.message || 'Too many login attempts. Please try again later.',
          retryAfterSeconds: rateLimit.retryAfterSeconds
        });
        return;
      }

      const auth = db.authenticateAdmin(String(username), String(password));
      if (!auth) {
        // Record failed attempt
        const { isNowLocked } = recordFailedLogin(clientIp, String(username));
        db.addAuditLog(
          'Failed Login Attempt',
          String(username),
          'auth',
          'admin-login',
          `Failed login attempt from IP ${clientIp}`
        );

        if (isNowLocked) {
          db.addAuditLog(
            'Account Locked',
            String(username),
            'auth',
            'admin-login',
            `Account locked: reached failure threshold across network requests.`
          );
        }

        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      // Successful login - clear failed attempts
      clearLoginAttempts(clientIp, String(username));

      res.json({
        success: true,
        token: auth.token,
        user: auth.user
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error during login' });
    }
  });

  app.post('/api/admin/logout', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-admin-token']) {
      token = String(req.headers['x-admin-token']).trim();
    }

    if (token) {
      db.deleteSession(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Revoke all sessions
  app.post('/api/admin/sessions/revoke-all', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const keepCurrent = Boolean(req.body?.keepCurrent);
      const authHeader = req.headers.authorization;
      let currentToken = '';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        currentToken = authHeader.substring(7).trim();
      } else if (req.headers['x-admin-token']) {
        currentToken = String(req.headers['x-admin-token']).trim();
      }

      const revokedCount = db.revokeAllSessions(
        req.adminUser!.id,
        keepCurrent ? currentToken : undefined
      );

      db.addAuditLog(
        'Revoke All Sessions',
        req.adminUser!.username,
        'auth',
        req.adminUser!.id,
        keepCurrent
          ? `Revoked ${revokedCount} other active sessions (kept current session)`
          : `Revoked all ${revokedCount} active sessions for this account`
      );

      res.json({
        success: true,
        revokedCount,
        message: keepCurrent
          ? `Successfully revoked ${revokedCount} other active sessions.`
          : 'All active sessions have been revoked.'
      });
    } catch (err: any) {
      console.error('Error revoking sessions:', err);
      res.status(500).json({ error: 'Failed to revoke sessions' });
    }
  });

  app.get('/api/admin/me', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.adminUser });
  });

  app.post('/api/admin/change-password', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required' });
        return;
      }

      if (String(newPassword).length < 8) {
        res.status(400).json({ error: 'New password must be at least 8 characters long' });
        return;
      }

      const result = db.updateAdminPassword(
        req.adminUser!.id,
        String(currentPassword),
        String(newPassword),
        req.adminUser!.username
      );

      if (!result.success) {
        res.status(400).json({ error: result.error || 'Failed to change password' });
        return;
      }

      res.json({
        success: true,
        message: 'Password updated successfully',
        token: result.newToken,
        user: result.user
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update password' });
    }
  });

  // ==================== ADMIN PROTECTED CRUD ====================
  // Dashboard Overview
  app.get('/api/admin/dashboard', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const stats = db.getDashboardStats();
      const recentInquiries = db.getInquiries().slice(0, 5);
      const upcomingBookings = db.getBookings()
        .filter(b => b.bookingStatus !== 'Cancelled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

      res.json({
        stats,
        recentInquiries,
        upcomingBookings
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve dashboard stats' });
    }
  });

  // Inquiries Management
  app.get('/api/admin/inquiries', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const inquiries = db.getInquiries(search, status);
    res.json(inquiries);
  });

  app.get('/api/admin/inquiries/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const inquiry = db.getInquiryById(req.params.id);
    if (!inquiry) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }
    res.json(inquiry);
  });

  app.patch('/api/admin/inquiries/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const updated = db.updateInquiry(req.params.id, req.body, req.adminUser!.username);
      if (!updated) {
        res.status(404).json({ error: 'Inquiry not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update inquiry' });
    }
  });

  app.post('/api/admin/inquiries/:id/convert-booking', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const inquiry = db.getInquiryById(req.params.id);
      if (!inquiry) {
        res.status(404).json({ error: 'Inquiry not found' });
        return;
      }

      // Financial validation
      const finValidation = validateFinancialFields(req.body);
      if (!finValidation.valid) {
        res.status(400).json({
          error: 'Validation failed: Invalid financial values',
          details: finValidation.errors
        });
        return;
      }

      const booking = db.createBooking({
        inquiryId: inquiry.id,
        clientName: inquiry.clientName,
        clientEmail: inquiry.email,
        clientPhone: inquiry.phone,
        serviceTitle: inquiry.shootType,
        date: inquiry.preferredDate || new Date().toISOString().split('T')[0],
        location: inquiry.location || 'Studio',
        quoteAmount: finValidation.sanitized.quoteAmount,
        depositAmount: finValidation.sanitized.depositAmount,
        additionalPayment: finValidation.sanitized.additionalPayment,
        finalPayment: finValidation.sanitized.finalPayment,
        refundAmount: finValidation.sanitized.refundAmount,
        originalAmount: finValidation.sanitized.originalAmount,
        exchangeRate: finValidation.sanitized.exchangeRate,
        bookingStatus: 'Confirmed',
        notes: req.body.notes || `Converted from inquiry ${inquiry.reference}. Message: ${inquiry.message}`
      }, req.adminUser!.username);

      res.status(201).json({ success: true, booking });
    } catch (err) {
      res.status(500).json({ error: 'Failed to convert inquiry to booking' });
    }
  });

  app.delete('/api/admin/inquiries/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const success = db.deleteInquiry(req.params.id, req.adminUser!.username);
    if (!success) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }
    res.json({ success: true });
  });

  // Bookings Management
  app.get('/api/admin/bookings', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const bookings = db.getBookings(search, status);
    res.json(bookings);
  });

  app.post('/api/admin/bookings', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      // Financial validation
      const finValidation = validateFinancialFields(req.body);
      if (!finValidation.valid) {
        res.status(400).json({
          error: 'Validation failed: Invalid financial values',
          details: finValidation.errors
        });
        return;
      }

      const payload = {
        ...req.body,
        ...finValidation.sanitized
      };

      const booking = db.createBooking(payload, req.adminUser!.username);
      res.status(201).json(booking);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create booking' });
    }
  });

  app.get('/api/admin/bookings/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const booking = db.getBookingById(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json(booking);
  });

  app.patch('/api/admin/bookings/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const existing = db.getBookingById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      // Merge current and updated fields for holistic financial integrity check
      const mergedFinance = {
        quoteAmount: req.body.quoteAmount !== undefined ? req.body.quoteAmount : existing.quoteAmount,
        depositAmount: req.body.depositAmount !== undefined ? req.body.depositAmount : existing.depositAmount,
        additionalPayment: req.body.additionalPayment !== undefined ? req.body.additionalPayment : existing.additionalPayment,
        finalPayment: req.body.finalPayment !== undefined ? req.body.finalPayment : existing.finalPayment,
        refundAmount: req.body.refundAmount !== undefined ? req.body.refundAmount : existing.refundAmount,
        originalAmount: req.body.originalAmount !== undefined ? req.body.originalAmount : existing.originalAmount,
        exchangeRate: req.body.exchangeRate !== undefined ? req.body.exchangeRate : existing.exchangeRate
      };

      const finValidation = validateFinancialFields(mergedFinance);
      if (!finValidation.valid) {
        res.status(400).json({
          error: 'Validation failed: Invalid financial values',
          details: finValidation.errors
        });
        return;
      }

      const updates = {
        ...req.body,
        ...finValidation.sanitized
      };

      const updated = db.updateBooking(req.params.id, updates, req.adminUser!.username);
      if (!updated) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update booking' });
    }
  });

  app.delete('/api/admin/bookings/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const success = db.deleteBooking(req.params.id, req.adminUser!.username);
    if (!success) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({ success: true });
  });

  // Clients CRM
  app.get('/api/admin/clients', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const search = req.query.search as string;
    const clients = db.getClients(search);
    res.json(clients);
  });

  app.get('/api/admin/clients/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const clientData = db.getClientById(req.params.id);
    if (!clientData) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json(clientData);
  });

  app.patch('/api/admin/clients/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const updated = db.updateClient(req.params.id, req.body, req.adminUser!.username);
      if (!updated) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update client' });
    }
  });

  // Portfolio Management
  app.get('/api/admin/portfolio', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const portfolio = db.getPortfolio(true);
    res.json(portfolio);
  });

  app.post('/api/admin/portfolio', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const item = db.addPortfolioItem(req.body, req.adminUser!.username);
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add portfolio item' });
    }
  });

  app.patch('/api/admin/portfolio/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const updated = db.updatePortfolioItem(req.params.id, req.body, req.adminUser!.username);
      if (!updated) {
        res.status(404).json({ error: 'Portfolio item not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update portfolio item' });
    }
  });

  app.delete('/api/admin/portfolio/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const success = db.deletePortfolioItem(req.params.id, req.adminUser!.username);
    if (!success) {
      res.status(404).json({ error: 'Portfolio item not found' });
      return;
    }
    res.json({ success: true });
  });

  app.post('/api/admin/portfolio/:id/set-hero', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const success = db.setHeroImage(req.params.id, req.adminUser!.username);
    if (!success) {
      res.status(404).json({ error: 'Portfolio item not found' });
      return;
    }
    res.json({ success: true });
  });

  app.post('/api/admin/portfolio/portrait', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const { url, alt } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Portrait image URL is required' });
      return;
    }
    const success = db.setPhotographerPortrait(url, alt || 'NINETIES SHOTS Photographer Portrait', req.adminUser!.username);
    res.json({ success });
  });

  // Services Management
  app.get('/api/admin/services', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const services = db.getServices(true);
    res.json(services);
  });

  app.post('/api/admin/services', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const srv = db.addService(req.body, req.adminUser!.username);
      res.status(201).json(srv);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add service' });
    }
  });

  app.patch('/api/admin/services/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const updated = db.updateService(req.params.id, req.body, req.adminUser!.username);
      if (!updated) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update service' });
    }
  });

  app.delete('/api/admin/services/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const success = db.deleteService(req.params.id, req.adminUser!.username);
    if (!success) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json({ success: true });
  });

  // Settings Management
  app.get('/api/admin/settings', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    res.json(db.getSettings());
  });

  app.patch('/api/admin/settings', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const updated = db.updateSettings(req.body, req.adminUser!.username);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Analytics & Audit Logs
  app.get('/api/admin/analytics', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    res.json(db.getAnalyticsSummary());
  });

  app.get('/api/admin/audit-logs', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    res.json(db.getAuditLogs());
  });

  // ==================== FINANCE & EXPENSES ENDPOINTS ====================
  // 1. Financial Overview Summary
  app.get('/api/admin/finance/overview', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const timeRange = (req.query.timeRange as string) || 'all';
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const overview = db.getFinanceOverview(timeRange, startDate, endDate);
      res.json(overview);
    } catch (err) {
      console.error('Error fetching financial overview:', err);
      res.status(500).json({ error: 'Failed to calculate financial overview' });
    }
  });

  // 2. Financial Analytics Charts Data
  app.get('/api/admin/finance/analytics', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const timeRange = (req.query.timeRange as string) || 'this_year';
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const analytics = db.getFinanceAnalytics(timeRange, startDate, endDate);
      res.json(analytics);
    } catch (err) {
      console.error('Error fetching financial analytics:', err);
      res.status(500).json({ error: 'Failed to compute financial analytics' });
    }
  });

  // 3. Unified Financial Transactions Ledger
  app.get('/api/admin/finance/transactions', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const search = req.query.search as string;
      const type = req.query.type as string;
      const status = req.query.status as string;
      const timeRange = req.query.timeRange as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const transactions = db.getFinancialTransactions({
        search,
        type,
        status,
        timeRange,
        startDate,
        endDate,
        limit
      });
      res.json(transactions);
    } catch (err) {
      console.error('Error fetching financial transactions:', err);
      res.status(500).json({ error: 'Failed to retrieve transaction ledger' });
    }
  });

  // 4. Expenses CRUD
  app.get('/api/admin/expenses', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const category = req.query.category as string;
      const search = req.query.search as string;
      const timeRange = req.query.timeRange as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const paymentMethod = req.query.paymentMethod as string;

      const expenses = db.getExpenses({
        category,
        search,
        timeRange,
        startDate,
        endDate,
        paymentMethod
      });
      res.json(expenses);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      res.status(500).json({ error: 'Failed to retrieve expenses' });
    }
  });

  app.post('/api/admin/expenses', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { amount, description, category, date, paymentMethod, receiptRef, notes } = req.body;

      if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
        res.status(400).json({ error: 'Validation error: A valid positive expense amount is required.' });
        return;
      }
      if (!description || typeof description !== 'string' || !description.trim()) {
        res.status(400).json({ error: 'Validation error: Expense description is required.' });
        return;
      }

      const expense = db.createExpense(
        {
          amount: Number(amount),
          description: description.trim(),
          category: category || 'Equipment',
          date: date || new Date().toISOString().split('T')[0],
          paymentMethod: paymentMethod || 'Mobile Money',
          receiptRef,
          notes
        },
        req.adminUser!.username
      );

      res.status(201).json(expense);
    } catch (err) {
      console.error('Error creating expense:', err);
      res.status(500).json({ error: 'Failed to create expense entry' });
    }
  });

  app.get('/api/admin/expenses/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const expense = db.getExpenseById(req.params.id);
    if (!expense) {
      res.status(404).json({ error: 'Expense record not found' });
      return;
    }
    res.json(expense);
  });

  app.put('/api/admin/expenses/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { amount, description, category, date, paymentMethod, receiptRef, notes } = req.body;

      if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) < 0)) {
        res.status(400).json({ error: 'Validation error: Expense amount must be a positive number.' });
        return;
      }

      const updated = db.updateExpense(
        req.params.id,
        {
          amount: amount !== undefined ? Number(amount) : undefined,
          description: description !== undefined ? description.trim() : undefined,
          category,
          date,
          paymentMethod,
          receiptRef,
          notes
        },
        req.adminUser!.username
      );

      if (!updated) {
        res.status(404).json({ error: 'Expense record not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      console.error('Error updating expense:', err);
      res.status(500).json({ error: 'Failed to update expense entry' });
    }
  });

  app.patch('/api/admin/expenses/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const updated = db.updateExpense(req.params.id, req.body, req.adminUser!.username);
      if (!updated) {
        res.status(404).json({ error: 'Expense record not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      console.error('Error updating expense:', err);
      res.status(500).json({ error: 'Failed to update expense entry' });
    }
  });

  app.delete('/api/admin/expenses/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const success = db.deleteExpense(req.params.id, req.adminUser!.username);
      if (!success) {
        res.status(404).json({ error: 'Expense record not found' });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting expense:', err);
      res.status(500).json({ error: 'Failed to delete expense entry' });
    }
  });

  // ==================== CURRENCY CONVERSION ENDPOINTS ====================
  // Get live exchange rates status for all supported currencies to GHS
  app.get('/api/admin/currency/rates', requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const base = req.query.base as string;
      if (base) {
        const rateInfo = await getLiveRateToGHS(base);
        res.json(rateInfo);
        return;
      }
      const allRates = await getAllRatesToGHS();
      res.json({
        targetCurrency: 'GHS',
        targetSymbol: 'GH₵',
        supportedCurrencies: SUPPORTED_CURRENCIES,
        ...allRates
      });
    } catch (err: any) {
      console.error('Error fetching currency rates:', err);
      res.status(500).json({ error: 'Failed to retrieve currency exchange rates.' });
    }
  });

  // Perform a currency conversion to GHS (Server-authoritative calculation)
  app.post('/api/admin/currency/convert', requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { amount, fromCurrency, manualRate, note } = req.body;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: 'Validation failed: A valid positive amount is required.' });
        return;
      }

      const currencyCode = String(fromCurrency || 'GHS').toUpperCase().trim();
      if (!currencyCode) {
        res.status(400).json({ error: 'Validation failed: Source currency is required.' });
        return;
      }

      let rate = 1.0;
      let rateType: 'live' | 'manual' | 'manual-flagged' = 'live';
      let provider = 'Bank of Ghana (Parity)';
      let convertedAt = new Date().toISOString();
      let deviationWarning: string | undefined = undefined;

      if (currencyCode === 'GHS') {
        rate = 1.0;
        rateType = 'live';
        provider = 'Bank of Ghana (Parity)';
      } else if (manualRate !== undefined && manualRate !== null && Number(manualRate) > 0) {
        // Manual rate override specified by authorized admin
        rate = Number(manualRate);
        rateType = 'manual';
        provider = 'Manual Admin Override';

        // Step 5: Check deviation against live market reference rate
        try {
          const liveInfo = await getLiveRateToGHS(currencyCode);
          if (liveInfo.success && liveInfo.rate && liveInfo.rate > 0) {
            const deviationCheck = checkRateDeviation(rate, liveInfo.rate);
            if (deviationCheck.isFlagged) {
              rateType = 'manual-flagged';
              deviationWarning = deviationCheck.warning;
            }
          }
        } catch {
          // Graceful fallback if live provider unavailable
        }
      } else {
        // Live rate request from external provider
        const liveInfo = await getLiveRateToGHS(currencyCode);
        if (!liveInfo.success || !liveInfo.rate || liveInfo.rate <= 0) {
          res.status(503).json({
            success: false,
            error: 'Exchange rate unavailable. Please retry or enter a manual exchange rate.',
            isLive: false,
            baseCurrency: currencyCode,
            targetCurrency: 'GHS'
          });
          return;
        }

        rate = liveInfo.rate;
        rateType = 'live';
        provider = liveInfo.provider;
        convertedAt = liveInfo.lastUpdated;
      }

      // Calculate precise conversion in integer pesewas
      const { ghsAmount } = calculateGHSConversion(numAmount, rate);

      const combinedNote = [
        note ? String(note).slice(0, 200) : '',
        deviationWarning ? `[WARNING: ${deviationWarning}]` : ''
      ].filter(Boolean).join(' ') || undefined;

      // Save conversion history record
      const record = db.addConversionRecord(
        {
          originalAmount: numAmount,
          originalCurrency: currencyCode,
          exchangeRate: rate,
          convertedAmount: ghsAmount,
          convertedCurrency: 'GHS',
          rateType,
          provider,
          convertedAt,
          note: combinedNote
        },
        req.adminUser!.username
      );

      res.json({
        success: true,
        conversion: record,
        formattedOriginal: `${currencyCode} ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        formattedGHS: `GH₵${ghsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        flagged: rateType === 'manual-flagged',
        warning: deviationWarning
      });
    } catch (err: any) {
      console.error('Error converting currency:', err);
      res.status(500).json({ error: 'Server error processing currency conversion.' });
    }
  });

  // Get conversion history
  app.get('/api/admin/currency/history', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const history = db.getConversionHistory(50);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve conversion history.' });
    }
  });

  // Clear conversion history
  app.post('/api/admin/currency/history/clear', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      db.clearConversionHistory(req.adminUser!.username);
      res.json({ success: true, message: 'Conversion history cleared.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to clear conversion history.' });
    }
  });

  // ==================== API 404 GUARD ====================
  // Ensure unhandled /api/* routes return structured JSON rather than falling through to frontend HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: 'API_ENDPOINT_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.path} does not exist.`
    });
  });

  // ==================== VITE & STATIC SERVING ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');

    if (!fs.existsSync(indexPath)) {
      console.warn(`[NINETIES SHOTS] [STARTUP WARNING] Production frontend build not found at: ${indexPath}`);
    }

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send('NINETIES SHOTS production build is initializing. Please refresh in a moment.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NINETIES SHOTS] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[NINETIES SHOTS] Subsystem status: Environment=${process.env.NODE_ENV || 'development'}, Database=${db.isHealthy() ? 'OK' : 'DEGRADED'}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[NINETIES SHOTS] [FATAL] Port ${PORT} is already in use. Cannot bind.`);
    } else {
      console.error('[NINETIES SHOTS] [FATAL] Server listener error:', err);
    }
    process.exit(1);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[NINETIES SHOTS] [UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[NINETIES SHOTS] [UNHANDLED REJECTION]:', reason);
});

startServer().catch((err) => {
  console.error('[NINETIES SHOTS] [FATAL STARTUP FAILURE]:', err);
  process.exit(1);
});
