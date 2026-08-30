import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { AdminUser } from './src/types';

interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

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
    next();
  };

  // ==================== PUBLIC API ENDPOINTS ====================
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), brand: 'NINETIES SHOTS' });
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
      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      const auth = db.authenticateAdmin(String(username), String(password));
      if (!auth) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

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

      const success = db.updateAdminPassword(
        req.adminUser!.id,
        String(currentPassword),
        String(newPassword),
        req.adminUser!.username
      );

      if (!success) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }

      res.json({ success: true, message: 'Password updated successfully' });
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

      const booking = db.createBooking({
        inquiryId: inquiry.id,
        clientName: inquiry.clientName,
        clientEmail: inquiry.email,
        clientPhone: inquiry.phone,
        serviceTitle: inquiry.shootType,
        date: inquiry.preferredDate || new Date().toISOString().split('T')[0],
        location: inquiry.location || 'Studio',
        quoteAmount: Number(req.body.quoteAmount || 0),
        depositAmount: Number(req.body.depositAmount || 0),
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
      const booking = db.createBooking(req.body, req.adminUser!.username);
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
      const updated = db.updateBooking(req.params.id, req.body, req.adminUser!.username);
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

  // ==================== VITE & STATIC SERVING ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NINETIES SHOTS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
