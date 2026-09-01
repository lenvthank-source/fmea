import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { SEO } from '../../components/SEO/SEO';

export const Login: React.FC = () => {
  const { login, token, guestLogin } = useAuth();
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#FAFAFA] text-[#09090B]">
      <SEO
        title="Sign In — FMEApex"
        description="Sign in to your FMEApex workspace or launch the instant guest sandbox."
        canonical="/login"
      />

      <div className="w-full max-w-[420px] flex flex-col items-center">
        {/* Brand Logo Header */}
        <Link to="/" className="flex items-center gap-2 mb-8 group">
          <div className="flex items-center tracking-[-0.03em] font-extrabold text-[26px] text-[#09090B]">
            <span>fmeapex</span>
            <span className="w-2.5 h-6 bg-[#FF682C] ml-1 rounded-sm transform skew-x-[-14deg] group-hover:scale-y-110 transition-transform" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold pl-2 border-l border-[#E4E4E7]">
            Quality Platform
          </span>
        </Link>

        {/* Main Authentication Card */}
        <div className="w-full bg-[#FFFFFF] rounded-2xl border border-[#E4E4E7] p-7 sm:p-9 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-[#09090B] tracking-tight">
              Welcome back
            </h1>
            <p className="text-[13.5px] text-[#71717A] mt-1">
              Enter your credentials or launch an instant guest sandbox.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B91C1C] flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Instant Guest Sandbox Access */}
          <button
            onClick={handleGuestAccess}
            disabled={guestLoading || signInLoading}
            className="w-full h-11 rounded-xl bg-[#09090B] hover:bg-[#27272A] disabled:opacity-50 text-white text-[13.5px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {guestLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-[#FF682C]">⚡</span>
                <span>Launch Instant Guest Sandbox</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/20 text-white font-mono uppercase">Free</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E4E4E7]" />
            <span className="text-[10.5px] font-semibold font-mono uppercase tracking-wider text-[#A1A1AA]">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-[#E4E4E7]" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-[#09090B] mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@manufacturer.com"
                className="w-full h-11 px-3.5 rounded-xl border border-[#E4E4E7] bg-white text-[14px] text-[#09090B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#09090B] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 px-3.5 rounded-xl border border-[#E4E4E7] bg-white text-[14px] text-[#09090B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={signInLoading || guestLoading}
              className="w-full h-11 rounded-xl bg-[#FF682C] hover:bg-[#E05219] disabled:opacity-50 text-white text-[14px] font-semibold transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {signInLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In to Workspace →'
              )}
            </button>
          </form>

          {/* Compliance Tag */}
          <div className="mt-6 pt-4 border-t border-[#F4F4F5] text-center text-[11px] font-mono text-[#A1A1AA]">
            <span>21 CFR Part 11 Compliant · Row-Level Tenant Security</span>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-[13px] text-[#71717A] hover:text-[#09090B] font-medium transition-colors"
          >
            ← Back to FMEApex Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
