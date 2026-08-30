import React, { useState } from 'react';
import { changeAdminPassword } from '../../lib/api';
import { CurrencyConverterTool } from './CurrencyConverterTool';
import {
  Settings as SettingsIcon,
  Phone,
  MessageSquare,
  Instagram,
  Mail,
  MapPin,
  Lock,
  Check,
  AlertCircle,
  Shield,
  Save,
  Image as ImageIcon,
  DollarSign,
  Globe
} from 'lucide-react';

interface AdminSettingsProps {
  settings: any;
  onUpdateSettings: (settings: any) => Promise<void>;
}

type SettingsSection = 'currency' | 'profile' | 'security';

export const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onUpdateSettings }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('currency');

  // Business fields
  const [phone, setPhone] = useState(settings?.phone || '020 806 6924');
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsappNumber || '+233208066924');
  const [whatsappDefaultMessage, setWhatsappDefaultMessage] = useState(settings?.whatsappDefaultMessage || '');
  const [email, setEmail] = useState(settings?.email || '');
  const [location, setLocation] = useState(settings?.location || 'Available Worldwide — Studio & On-Location');
  const [availabilityNotice, setAvailabilityNotice] = useState(settings?.availabilityNotice || 'Accepting select portrait sessions, lifestyle projects, and commissioned photo shoots for 2026.');
  const [heroImage, setHeroImage] = useState(settings?.heroImage || '');
  const [photographerPortrait, setPhotographerPortrait] = useState(settings?.photographerPortrait || '');

  // Social handles
  const [instagramUrl, setInstagramUrl] = useState(
    settings?.socials?.find((s: any) => s.platform === 'instagram')?.url || 'https://www.instagram.com/nineties_shots/'
  );
  const [instagramLabel, setInstagramLabel] = useState(
    settings?.socials?.find((s: any) => s.platform === 'instagram')?.label || '@nineties_shots'
  );

  const [tiktokUrl, setTiktokUrl] = useState(
    settings?.socials?.find((s: any) => s.platform === 'tiktok')?.url || 'https://www.tiktok.com/@nineties_shot1'
  );
  const [tiktokLabel, setTiktokLabel] = useState(
    settings?.socials?.find((s: any) => s.platform === 'tiktok')?.label || '@nineties_shot1'
  );

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const updatedSocials = [
        { platform: 'instagram', label: instagramLabel.trim(), url: instagramUrl.trim() },
        { platform: 'tiktok', label: tiktokLabel.trim(), url: tiktokUrl.trim() }
      ];

      await onUpdateSettings({
        phone: phone.trim(),
        whatsappNumber: whatsappNumber.trim(),
        whatsappDefaultMessage: whatsappDefaultMessage.trim(),
        email: email.trim(),
        location: location.trim(),
        availabilityNotice: availabilityNotice.trim(),
        heroImage: heroImage.trim(),
        photographerPortrait: photographerPortrait.trim(),
        socials: updatedSocials
      });

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword) {
      setPasswordError('Please provide both current and new passwords.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password confirmation does not match.');
      return;
    }

    try {
      setUpdatingPassword(true);
      await changeAdminPassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-neutral-900 pb-6">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 block">
          SYSTEM PREFERENCES & BUSINESS PROFILE
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
          Admin Settings
        </h1>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-900 pb-3 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveSection('currency')}
          className={`px-4 py-2.5 flex items-center gap-2 uppercase tracking-wider font-bold transition-colors cursor-pointer ${
            activeSection === 'currency'
              ? 'bg-white text-black'
              : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Currency & Pricing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('profile')}
          className={`px-4 py-2.5 flex items-center gap-2 uppercase tracking-wider font-bold transition-colors cursor-pointer ${
            activeSection === 'profile'
              ? 'bg-white text-black'
              : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Contact & Social Channels</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('security')}
          className={`px-4 py-2.5 flex items-center gap-2 uppercase tracking-wider font-bold transition-colors cursor-pointer ${
            activeSection === 'security'
              ? 'bg-white text-black'
              : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Passphrase & Security</span>
        </button>
      </div>

      {/* SECTION 1: CURRENCY & PRICING */}
      {activeSection === 'currency' && (
        <div className="space-y-6 animate-fade-in">
          <CurrencyConverterTool />
        </div>
      )}

      {/* SECTION 2: CONTACT & PROFILE */}
      {activeSection === 'profile' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-fade-in">
          <div className="bg-neutral-950 border border-neutral-900 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <h2 className="text-sm font-mono uppercase font-bold text-white tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4 text-neutral-400" />
                <span>Contact & Social Channels</span>
              </h2>
              {settingsSaved && (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Saved successfully</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Public Display Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="020 806 6924"
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">WhatsApp Destination (International)</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  placeholder="+233208066924"
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              {/* Instagram */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Instagram Handle</label>
                <input
                  type="text"
                  value={instagramLabel}
                  onChange={e => setInstagramLabel(e.target.value)}
                  placeholder="@nineties_shots"
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Instagram Profile URL</label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={e => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/nineties_shots/"
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              {/* TikTok */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">TikTok Handle</label>
                <input
                  type="text"
                  value={tiktokLabel}
                  onChange={e => setTiktokLabel(e.target.value)}
                  placeholder="@nineties_shot1"
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">TikTok Profile URL</label>
                <input
                  type="url"
                  value={tiktokUrl}
                  onChange={e => setTiktokUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@nineties_shot1"
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              {/* Email */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-neutral-400 uppercase">
                  Studio Inquiries Email (Leave blank if direct WhatsApp only)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="inquiries@ninetiesshots.com"
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              {/* Location & Availability */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Studio Location Text</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Availability Status Notice</label>
                <input
                  type="text"
                  value={availabilityNotice}
                  onChange={e => setAvailabilityNotice(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SECTION 3: SECURITY & PASSPHRASE */}
      {activeSection === 'security' && (
        <div className="bg-neutral-950 border border-neutral-900 p-6 space-y-6 animate-fade-in">
          <div className="border-b border-neutral-900 pb-3">
            <h2 className="text-sm font-mono uppercase font-bold text-white tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-400" />
              <span>Admin Authentication Security</span>
            </h2>
          </div>

          {passwordError && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Passphrase updated successfully. Please use your new passphrase next time you log in.</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md text-xs font-mono">
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 uppercase">Current Passphrase *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 uppercase">New Passphrase (min 8 characters) *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 uppercase">Confirm New Passphrase *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs uppercase tracking-wider font-bold border border-neutral-700 transition-colors"
            >
              {updatingPassword ? 'Updating...' : 'Update Passphrase'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
