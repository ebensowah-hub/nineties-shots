/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActivePage, CategorySlug, PortfolioItem, AdminUser } from './types';
import { portfolioItems as staticPortfolioItems } from './data/portfolioData';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { PortfolioView } from './components/PortfolioView';
import { AboutView } from './components/AboutView';
import { ServicesView } from './components/ServicesView';
import { ContactView } from './components/ContactView';
import { NotFound } from './components/NotFound';
import { Lightbox } from './components/Lightbox';
import { Footer } from './components/Footer';
import { CustomCursor } from './components/CustomCursor';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { checkAdminAuthSession, getPublicData, trackEvent } from './lib/api';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [portfolioCategory, setPortfolioCategory] = useState<CategorySlug>('all');
  const [preselectedService, setPreselectedService] = useState<string | undefined>(undefined);
  
  // Dynamic Portfolio & Settings
  const [livePortfolio, setLivePortfolio] = useState<PortfolioItem[]>(staticPortfolioItems);
  const [liveSettings, setLiveSettings] = useState<any>(null);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Admin Portal State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await checkAdminAuthSession();
        if (res.authenticated && res.user) {
          setAdminUser(res.user);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setCheckingAuth(false);
      }
    };

    initAuth();
  }, []);

  // Hydrate live public portfolio data from API
  useEffect(() => {
    const hydrateData = async () => {
      try {
        const data = await getPublicData();
        if (data.portfolio && data.portfolio.length > 0) {
          setLivePortfolio(data.portfolio);
        }
        if (data.settings) {
          setLiveSettings(data.settings);
        }
      } catch (err) {
        // Silently use static fallback
      }
    };

    hydrateData();
  }, []);

  // Sync with browser hash / navigation for deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      
      if (hash === 'admin' || hash === 'login' || hash === 'portal') {
        setIsAdminMode(true);
        return;
      }

      setIsAdminMode(false);
      if (hash === 'work' || hash === 'portfolio') {
        setActivePage('work');
        trackEvent('page_view', { page: 'work' });
      } else if (hash === 'about') {
        setActivePage('about');
        trackEvent('page_view', { page: 'about' });
      } else if (hash === 'services') {
        setActivePage('services');
        trackEvent('page_view', { page: 'services' });
      } else if (hash === 'contact' || hash === 'book') {
        setActivePage('contact');
        trackEvent('page_view', { page: 'contact' });
      } else if (hash === '' || hash === 'home') {
        setActivePage('home');
        trackEvent('page_view', { page: 'home' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: ActivePage, category?: CategorySlug) => {
    setIsAdminMode(false);
    setActivePage(page);
    if (category) {
      setPortfolioCategory(category);
    }
    if (page === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = page;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackEvent('page_view', { page, category });
  };

  const handleOpenLightbox = (item: PortfolioItem) => {
    const index = livePortfolio.findIndex(p => p.id === item.id);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
    trackEvent('portfolio_open', { photoId: item.id, photoTitle: item.title });
  };

  const handleRequestQuote = (serviceTitle: string) => {
    setPreselectedService(serviceTitle);
    setActivePage('contact');
    window.location.hash = 'contact';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackEvent('booking_start', { serviceTitle });
  };

  const handleExitAdmin = () => {
    setIsAdminMode(false);
    window.location.hash = '';
    setActivePage('home');
  };

  // If in Admin Mode, render the dedicated Admin Portal
  if (isAdminMode) {
    if (checkingAuth) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono text-xs text-neutral-500">
          INITIALIZING NINETIES SHOTS PORTAL...
        </div>
      );
    }

    if (adminUser) {
      return (
        <AdminLayout
          user={adminUser}
          onLogout={() => {
            setAdminUser(null);
            handleExitAdmin();
          }}
          onViewPublicSite={handleExitAdmin}
        />
      );
    }

    return (
      <AdminLogin
        onLoginSuccess={user => setAdminUser(user)}
        onBackToSite={handleExitAdmin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#f4f4f5] relative selection:bg-white selection:text-black flex flex-col justify-between">
      {/* Subtle Custom Mouse Cursor on fine pointer desktop displays */}
      <CustomCursor />

      {/* Main Navigation */}
      <Navbar activePage={activePage} onNavigate={handleNavigate} />

      {/* Main Content Stage */}
      <main className="flex-1 w-full">
        {activePage === 'home' && (
          <HomeView
            portfolioItems={livePortfolio}
            onOpenLightbox={handleOpenLightbox}
            onNavigate={handleNavigate}
            onRequestQuote={handleRequestQuote}
          />
        )}

        {activePage === 'work' && (
          <PortfolioView
            items={livePortfolio}
            initialCategory={portfolioCategory}
            onOpenLightbox={handleOpenLightbox}
          />
        )}

        {activePage === 'about' && (
          <AboutView
            onBookShoot={() => handleNavigate('contact')}
          />
        )}

        {activePage === 'services' && (
          <ServicesView
            onRequestQuote={handleRequestQuote}
          />
        )}

        {activePage === 'contact' && (
          <ContactView
            preselectedService={preselectedService}
          />
        )}

        {activePage === '404' && (
          <NotFound
            onBackToWork={() => handleNavigate('work')}
          />
        )}
      </main>

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      <Lightbox
        items={livePortfolio}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(newIndex) => setLightboxIndex(newIndex)}
      />

      {/* Unobtrusive Direct WhatsApp Floating Action */}
      <WhatsAppFloatingButton />

      {/* Brand Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
