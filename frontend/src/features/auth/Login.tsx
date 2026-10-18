import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useBackendReady } from '../../hooks/useBackendWarmup';
import { SEO } from '../../components/SEO/SEO';
import { ArrowRight, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, token, guestLogin } = useAuth();
  const { isBackendReady } = useBackendReady();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (token) {
      navigate('/app/projects', { replace: true });
      return;
    }

    const hasLoggedOut = sessionStorage.getItem('logged_out') === 'true';
    if (!hasLoggedOut) {
      // Direct Entry: automatically initialize guest session and open workspace right away!
      guestLogin()
        .then(() => {
          navigate('/app/projects', { replace: true });
        })
        .catch((err) => {
          console.error('Direct guest entry failed:', err);
          setCheckingAccess(false);
        });
    } else {
      // User explicitly logged out from dashboard — display the Administrator Sign In window
      setCheckingAccess(false);
    }
  }, [token, navigate, guestLogin]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSignInLoading(true);
    try {
      await login(email, password, 'guest-tenant');
      sessionStorage.removeItem('logged_out');
      navigate('/app/projects');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleReturnToGuest = async () => {
    setError('');
    setGuestLoading(true);
    try {
      sessionStorage.removeItem('logged_out');
      await guestLogin();
      navigate('/app/projects');
    } catch (err: any) {
      setError(err.message || 'Guest access initialization failed');
    } finally {
      setGuestLoading(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-tech-dots bg-[#FBFBFC] text-slate-900 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-mono text-lg font-bold shadow-xs animate-pulse">
            <span className="text-[#FF5500]">F</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Opening Quality Workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-tech-dots bg-[#FBFBFC] text-slate-900 font-sans antialiased">
      <SEO
        title="Admin Sign In — FMEApex | Quality Intelligence Workspace"
        description="Corporate & Administrator sign-in gate for FMEApex quality platform."
        canonical="/login"
      />

      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Brand Logo Header */}
        <Link to="/" className="flex items-center gap-2.5 mb-8 group">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-mono text-base font-bold shadow-xs transition-transform group-hover:scale-105">
            <span className="text-[#FF5500]">F</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-[22px] tracking-tight text-slate-900">
                fmeapex
              </span>
              <span className="w-1.5 h-4 bg-[#FF5500] rounded-xs" />
            </div>
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase mt-0.5">
              AIAG-VDA 2019 Quality Platform
            </span>
          </div>
        </Link>

        {/* Administrator Authentication Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-7 sm:p-9 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-700">
              <Lock className="w-5 h-5 text-slate-800" />
            </div>
            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">
              Corporate & Administrator Sign In
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with plant or administrative credentials to manage platform-wide quality programs.
            </p>

            {/* Live Backend Readiness Pill */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isBackendReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
                }`}
              />
              <span className={isBackendReady ? 'text-emerald-700' : 'text-amber-700'}>
                {isBackendReady ? 'API Live • RLS Active' : 'Backend Waking Up...'}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Secure Email / Password Form (CIA Triad: Confidentiality - No hardcoded or prefilled credentials) */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold mb-1.5">
                Corporate / Admin Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@plant-oem.com"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={signInLoading || guestLoading}
              className="w-full h-11 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 mt-1"
            >
              {signInLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-400">
              or continue without credentials
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Instant Guest Sandbox Access */}
          <button
            type="button"
            onClick={handleReturnToGuest}
            disabled={guestLoading || signInLoading}
            className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-slate-200"
          >
            {guestLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                <span>Launching Sandbox...</span>
              </span>
            ) : (
              <>
                <span className="text-[#FF5500]">⚡</span>
                <span>Launch Free Guest Sandbox Instead</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono uppercase tracking-wider">
                  24h
                </span>
              </>
            )}
          </button>

          {/* Compliance Tag */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>21 CFR Part 11 Compliant</span>
            <span>•</span>
            <span>PostgreSQL RLS Protected</span>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors inline-flex items-center gap-1"
          >
            <span>← Return to FMEApex Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
