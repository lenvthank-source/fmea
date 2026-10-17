import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useBackendReady } from '../../hooks/useBackendWarmup';
import { SEO } from '../../components/SEO/SEO';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, token, guestLogin } = useAuth();
  const { isBackendReady } = useBackendReady();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  useEffect(() => {
    if (token) navigate('/app/projects', { replace: true });
  }, [token, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSignInLoading(true);
    try {
      await login(email, password, 'guest-tenant');
      navigate('/app/projects');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setError('');
    setGuestLoading(true);
    try {
      await guestLogin();
      navigate('/app/projects');
    } catch (err: any) {
      setError(err.message || 'Guest access initialization failed');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-tech-dots bg-[#FBFBFC] text-slate-900 font-sans antialiased">
      <SEO
        title="Sign In — FMEApex | Quality Intelligence Workspace"
        description="Sign in to your FMEApex workspace or launch the instant guest sandbox."
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

        {/* Main Authentication Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-7 sm:p-9 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
              Sign In to Workspace
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your plant credentials or launch an instant sandbox session.
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

          {/* Instant Guest Sandbox Access */}
          <button
            onClick={handleGuestAccess}
            disabled={guestLoading || signInLoading}
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs group"
          >
            {guestLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>{isBackendReady ? 'Initializing Session...' : 'Waking Up Sandbox...'}</span>
              </span>
            ) : (
              <>
                <span className="text-[#FF5500]">⚡</span>
                <span>Launch Free Guest Sandbox</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono uppercase tracking-wider">
                  No Card Required
                </span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10.5px] font-semibold font-mono uppercase tracking-wider text-slate-400">
              or sign in with corporate account
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold mb-1.5">
                Corporate Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@plant-oem.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={signInLoading || guestLoading}
              className="w-full h-11 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 mt-2"
            >
              {signInLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Plant Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Compliance Tag */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
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
