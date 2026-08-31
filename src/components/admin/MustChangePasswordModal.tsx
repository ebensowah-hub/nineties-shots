import React, { useState } from 'react';
import { changeAdminPassword } from '../../lib/api';
import { AdminUser } from '../../types';
import { ShieldAlert, Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface MustChangePasswordModalProps {
  user: AdminUser;
  onPasswordChanged: (updatedUser: AdminUser) => void;
}

export const MustChangePasswordModal: React.FC<MustChangePasswordModalProps> = ({ user, onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword) {
      setError('Please provide both current and new passwords.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password confirmation does not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await changeAdminPassword(currentPassword, newPassword);
      if (res.user) {
        onPasswordChanged(res.user);
      } else {
        onPasswordChanged({ ...user, mustChangePassword: false });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update security credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider">
              Set New Password
            </h2>
            <p className="text-[11px] font-mono text-neutral-400">
              MANDATORY SECURITY INITIALIZATION
            </p>
          </div>
        </div>

        <p className="text-xs font-sans text-neutral-300 leading-relaxed">
          Your account is currently using an initial bootstrap security credential. Please choose a strong, custom passphrase to secure your administration dashboard.
        </p>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/80 text-red-300 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
              Current Passphrase
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
              New Passphrase (min 8 chars)
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
              Confirm New Passphrase
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pt-1">
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPass ? 'Hide Passwords' : 'Show Passwords'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
          >
            {loading ? (
              <span>SECURING ACCOUNT...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>SAVE & CONTINUE TO PORTAL</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
