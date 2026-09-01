import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const SiteHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<'En' | 'Fr'>('En');

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
    <header className="fixed top-0 inset-x-0 z-50 pt-3 sm:pt-4 px-4 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between pointer-events-auto">
        {/* Left: Brand Wordmark */}
        <Link to="/" className="flex items-center gap-2 group bg-white/80 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none px-3 py-1.5 sm:p-0 rounded-full border border-[#E5E0D8] sm:border-none shadow-xs sm:shadow-none">
          <div className="flex items-center tracking-[-0.03em] font-extrabold text-[22px] sm:text-[24px] text-[#18181B]">
            <span>fmeapex</span>
            <span className="w-2 h-5 bg-[#FF682C] ml-1 rounded-sm transform skew-x-[-14deg] group-hover:scale-y-110 transition-transform" />
          </div>
          <span className="hidden md:inline-block text-[10px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold pl-2 border-l border-[#E5E0D8]">
            Quality Platform
          </span>
        </Link>

        {/* Center: Ventriloc Signature Floating Nav Capsule (Desktop) */}
        <nav className={`hidden lg:flex items-center gap-1 bg-[#FFFFFF]/90 backdrop-blur-md px-3 py-1.5 rounded-full border transition-all ${scrolled ? 'border-[#D4CFC4] shadow-[0_8px_30px_rgba(0,0,0,0.08)]' : 'border-[#E5E0D8] shadow-[0_4px_24px_rgba(0,0,0,0.06)]'}`}>
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                location.pathname === l.to
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F5F3]'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right: Actions & Language Toggle */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Language Switcher Pill */}
          <div className="flex items-center bg-[#FFFFFF]/90 backdrop-blur-md p-0.5 rounded-full border border-[#E5E0D8] text-[11px] font-bold font-mono shadow-xs">
            <button
              onClick={() => setLang('Fr')}
              className={`px-2 py-0.5 rounded-full transition-all ${lang === 'Fr' ? 'bg-[#18181B] text-white' : 'text-[#71717A] hover:text-[#18181B]'}`}
            >
              FR
            </button>
            <button
              onClick={() => setLang('En')}
              className={`px-2 py-0.5 rounded-full transition-all ${lang === 'En' ? 'bg-[#18181B] text-white' : 'text-[#71717A] hover:text-[#18181B]'}`}
            >
              EN
            </button>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="text-[13.5px] font-semibold text-[#18181B] hover:text-[#FF682C] px-3 py-1.5 transition-colors"
          >
            Log in
          </button>

          <button
            onClick={() => navigate('/login')}
            className="h-10 px-5 rounded-full bg-[#FF682C] hover:bg-[#E05219] text-white text-[13.5px] font-semibold transition-all shadow-[0_4px_14px_rgba(255,104,44,0.3)] hover:shadow-[0_6px_20px_rgba(255,104,44,0.4)] flex items-center gap-2"
          >
            <span>Launch Sandbox</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/25 text-white font-mono uppercase font-bold">Free</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="h-8 px-3 rounded-full bg-[#FF682C] text-white text-[12px] font-semibold shadow-sm"
          >
            Sandbox
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="w-8 h-8 rounded-full bg-white border border-[#E5E0D8] flex items-center justify-center text-[#18181B] shadow-xs"
            aria-label="Toggle menu"
          >
            <span className="text-[14px] leading-none">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="sm:hidden mt-2 border border-[#E5E0D8] rounded-2xl bg-white/95 backdrop-blur-md p-5 space-y-3 shadow-xl pointer-events-auto max-w-[360px] mx-auto">
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
          <div className="pt-3 border-t border-[#E5E0D8] space-y-2">
            <button
              onClick={() => { setOpen(false); navigate('/login'); }}
              className="w-full h-10 rounded-full bg-[#FF682C] text-white text-[13.5px] font-semibold"
            >
              Launch Guest Sandbox
            </button>
            <button
              onClick={() => { setOpen(false); navigate('/login'); }}
              className="w-full h-10 rounded-full border border-[#E5E0D8] text-[#18181B] text-[13.5px] font-semibold"
            >
              Log in
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
