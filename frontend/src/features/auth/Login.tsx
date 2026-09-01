import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      setError(err.message || 'Login failed');
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
    <div className="min-h-screen flex bg-[#F7F6F3] text-[#0F172A]">
      <SEO
        title="Sign In — FMEApex"
        description="Sign in to your FMEApex workspace or launch the instant guest sandbox."
        canonical="/login"
      />

      {/* Left rail — brand / showcase (desktop) */}
      <aside className="hidden lg:flex flex-col w-[520px] shrink-0 bg-[#0B1220] text-white p-12 justify-between">
        <div>
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#0D9488] flex items-center justify-center">
              <span className="text-white font-[650] text-[16px]">F</span>
            </div>
            <span className="text-[19px] font-[650] tracking-[-0.02em]">FMEApex</span>
          </a>
        </div>

        <div>
          <p className="text-[11px] font-[650] uppercase tracking-[0.18em] text-[#2DD4BF]">AIAG-VDA 2019 · 21 CFR Part 11</p>
          <h2 className="mt-4 text-[40px] leading-[1.1] font-[650] tracking-[-0.02em]">
            Quality engineering, engineered like software.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.6] text-[#94A3B8] max-w-[420px]">
            7-step FMEAs, PFD↔PFMEA linking, Control Plan sync, and an AI copilot that suggests failures, effects, and controls — all inside one audit-ready workspace.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { t: '7-step guided workflow', d: 'Gated steps with automatic Action Priority lookup' },
              { t: 'PFD ↔ PFMEA sync', d: 'Zero orphan process steps across lines' },
              { t: 'Immutable audit trail', d: 'Cryptographic signatures, revision locks' },
            ].map((f) => (
              <div key={f.t} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0D9488]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#2DD4BF]" />
                </div>
                <div>
                  <p className="text-[14.5px] font-[600] text-[#E2E8F0]">{f.t}</p>
                  <p className="text-[13.5px] text-[#64748B]">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[12px] text-[#475569]">© 2026 FMEApex. Quality Engineered To Evolve.</p>
      </aside>

      {/* Right column — form */}
      <main className="flex-1 flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-[440px]">
          {/* Mobile brand */}
          <a href="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-[10px] bg-[#0F172A] flex items-center justify-center">
              <span className="text-white font-bold text-[15px]">F</span>
            </div>
            <span className="text-[19px] font-[650] tracking-[-0.02em]">FMEApex</span>
          </a>

          <div className="bg-white rounded-[20px] border border-[#E6E1D8] p-8 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.15)]">
            <h1 className="text-[24px] font-[650] tracking-[-0.01em]">Sign in</h1>
            <p className="text-[14px] text-[#64748B] mt-1">Use your work email, or launch the shared sandbox.</p>

            {error && (
              <div className="mt-5 px-4 py-3 rounded-[10px] bg-[#FEF2F2] border border-[#FCA5A5] text-[13.5px] text-[#B91C1C]">
                {error}
              </div>
            )}

            {/* Guest sandbox */}
            <button
              onClick={handleGuestAccess}
              disabled={guestLoading || signInLoading}
              className="mt-6 w-full h-[50px] rounded-[12px] bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white text-[14.5px] font-[600] transition-colors flex items-center justify-center gap-2"
            >
              {guestLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                'Launch guest sandbox (no signup)'
              )}
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#E6E1D8]" />
              <span className="text-[11px] font-[600] uppercase tracking-[0.08em] text-[#94A3B8]">or continue with email</span>
              <div className="flex-1 h-px bg-[#E6E1D8]" />
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-[13px] font-[600] text-[#334155] mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-[48px] px-4 rounded-[12px] border border-[#D8D3C8] bg-white text-[14.5px] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/25 focus:border-[#0D9488] transition"
                />
              </div>
              <div>
                <label className="block text-[13px] font-[600] text-[#334155] mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[48px] px-4 rounded-[12px] border border-[#D8D3C8] bg-white text-[14.5px] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/25 focus:border-[#0D9488] transition"
                />
              </div>
              <button
                type="submit"
                disabled={signInLoading || guestLoading}
                className="w-full h-[50px] rounded-[12px] bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 text-white text-[14.5px] font-[600] transition-colors flex items-center justify-center"
              >
                {signInLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[13px] text-[#8A8F98] mt-6">
            <a href="/" className="hover:text-[#0D9488] transition-colors">← Back to fmeapex.online</a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
