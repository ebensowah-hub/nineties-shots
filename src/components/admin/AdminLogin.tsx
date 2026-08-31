import React, { useState } from 'react';
import { loginAdmin } from '../../lib/api';
import { AdminUser } from '../../types';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToSite }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await loginAdmin(username.trim(), password.trim(), remember);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-neutral-200 flex flex-col justify-center items-center px-4 py-12 selection:bg-white selection:text-black">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-neutral-900 border border-neutral-800 text-white mb-2">
            <ShieldCheck className="w-6 h-6 stroke-[1.4]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white uppercase tracking-[0.2em]">
            NINETIES SHOTS
          </h1>
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-neutral-500">
            BUSINESS PORTAL // OWNER AUTHENTICATION
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-neutral-950 border border-neutral-850 p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/80 text-red-300 text-xs font-mono flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                ADMIN IDENTIFIER
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="admin"
                  required
                  className="w-full bg-neutral-900/90 border border-neutral-800 pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                SECURITY PASSPHRASE
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-neutral-900/90 border border-neutral-800 pl-10 pr-10 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded-none bg-neutral-900 border-neutral-800 text-white accent-white"
                />
                <span>Keep session active</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>AUTHENTICATING...</span>
              ) : (
                <>
                  <span>ENTER CONTROL CENTER</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Security notice */}
          <div className="pt-4 border-t border-neutral-900 text-center">
            <div className="text-[10px] font-mono text-neutral-600 leading-relaxed">
              Authorized personnel only. All access attempts are recorded in the security audit log.
            </div>
          </div>
        </div>

        {/* Back to Public Site */}
        <div className="text-center">
          <button
            onClick={onBackToSite}
            className="text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
          >
            ← Return to Public Portfolio
          </button>
        </div>
      </div>
    </div>
  );
};
