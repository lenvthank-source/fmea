import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const SiteHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Solutions', to: '/product' },
    { label: '7-Step Standard', to: '/learn/aiag-vda-7-step-fmea' },
    { label: '21 CFR Part 11', to: '/learn/21-cfr-part-11-fmea' },
    { label: 'Risk Simulator', to: '/#simulator' },
    { label: 'Pricing', to: '/pricing' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-3 sm:pt-4 px-3 sm:px-6 pointer-events-none transition-all duration-300">
      <div className="max-w-[1340px] mx-auto pointer-events-auto">
        {/* Unified Translucent Fluid Liquid Glass Capsule */}
        <div
          className={`relative flex items-center justify-between px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border transition-all duration-500 overflow-hidden ${
            scrolled
              ? 'bg-[#FFFFFF]/85 backdrop-blur-2xl border-white/80 shadow-[0_12px_36px_rgba(0,0,0,0.07),inset_0_1px_2px_rgba(255,255,255,0.95)]'
              : 'bg-[#FFFFFF]/75 backdrop-blur-xl border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.85)]'
          }`}
        >
          {/* Fluid Liquid Motion Layer (Organic gradient streams) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            {/* Primary Orange Fluid Stream */}
            <div className="absolute -top-10 -left-10 w-56 h-28 rounded-full bg-gradient-to-r from-[#FF682C]/20 to-[#FF8A50]/15 blur-2xl animate-[drift_7s_ease-in-out_infinite]" />
            {/* Warm Laiton Gold Stream */}
            <div className="absolute -bottom-8 right-24 w-48 h-24 rounded-full bg-gradient-to-r from-[#816729]/15 to-[#B49748]/12 blur-2xl animate-[drift_9s_ease-in-out_2s_infinite_reverse]" />
            {/* Liquid Prismatic Center Blob */}
            <div className="absolute top-0 left-1/3 w-64 h-16 rounded-full bg-gradient-to-r from-orange-300/10 via-amber-200/15 to-emerald-300/10 blur-xl animate-[drift_11s_ease-in-out_4s_infinite]" />
            {/* Liquid specular sheen */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/20" />
          </div>

          {/* Left: Brand Wordmark */}
          <Link to="/" className="flex items-center gap-2 group relative z-10">
            <div className="flex items-center tracking-[-0.03em] font-extrabold text-[21px] sm:text-[23px] text-[#18181B]">
              <span>fmeapex</span>
              <span className="w-2 h-5 bg-[#FF682C] ml-1 rounded-sm transform skew-x-[-14deg] group-hover:scale-y-110 transition-transform" />
            </div>
            <span className="hidden md:inline-block text-[10px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold pl-2 border-l border-[#E5E0D8]">
              Quality Platform
            </span>
          </Link>

          {/* Center: Nav links */}
          <nav className="hidden lg:flex items-center gap-1 relative z-10">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                  location.pathname === l.to
                    ? 'bg-[#18181B] text-white shadow-xs'
                    : 'text-[#52525B] hover:text-[#18181B] hover:bg-black/[0.04]'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right: Action CTA with Slap Cap */}
          <div className="hidden sm:flex items-center gap-3 relative z-10">
            <div className="relative inline-flex items-center">
              <button
                onClick={() => navigate('/login')}
                className="h-9 sm:h-10 px-5 sm:px-6 rounded-full bg-[#FF682C] hover:bg-[#E05219] text-white text-[13.5px] font-semibold transition-all shadow-[0_4px_14px_rgba(255,104,44,0.35)] hover:shadow-[0_6px_20px_rgba(255,104,44,0.45)] hover:scale-[1.02] flex items-center gap-1.5"
              >
                <span>Launch Sandbox</span>
                <span className="text-[14px]">→</span>
              </button>
              {/* Slap Cap Pill Badge */}
              <span className="absolute -top-2.5 -right-2 px-2 py-0.5 rounded-md bg-[#18181B] text-[#FFFFFF] border-2 border-white text-[9.5px] font-mono font-black uppercase tracking-wider shadow-md transform rotate-[8deg] pointer-events-none select-none">
                FREE
              </span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center gap-2.5 relative z-10">
            <div className="relative inline-flex items-center">
              <button
                onClick={() => navigate('/login')}
                className="h-8 px-3.5 rounded-full bg-[#FF682C] text-white text-[12px] font-semibold shadow-xs"
              >
                Sandbox
              </button>
              <span className="absolute -top-2 -right-1.5 px-1.5 py-0.2 rounded-md bg-[#18181B] text-[#FFFFFF] border border-white text-[8px] font-mono font-black uppercase shadow-xs transform rotate-[8deg] pointer-events-none">
                FREE
              </span>
            </div>
            <button
              onClick={() => setOpen(!open)}
              className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center text-[#18181B]"
              aria-label="Toggle menu"
            >
              <span className="text-[14px] leading-none">{open ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {open && (
          <div className="sm:hidden mt-2 border border-[#E5E0D8] rounded-2xl bg-white/95 backdrop-blur-xl p-5 space-y-3 shadow-xl pointer-events-auto max-w-[360px] mx-auto">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block text-[14px] font-semibold text-[#52525B] hover:text-[#18181B] py-1.5"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[#E5E0D8]">
              <div className="relative inline-flex w-full items-center">
                <button
                  onClick={() => { setOpen(false); navigate('/login'); }}
                  className="w-full h-10 rounded-full bg-[#FF682C] text-white text-[13.5px] font-semibold shadow-sm"
                >
                  Launch Guest Sandbox
                </button>
                <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-md bg-[#18181B] text-[#FFFFFF] border border-white text-[9px] font-mono font-black uppercase shadow-xs transform rotate-[6deg] pointer-events-none">
                  FREE
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default SiteHeader;
