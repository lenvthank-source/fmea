import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Menu, X, ArrowUpRight, Cpu, ChevronDown } from 'lucide-react';
import { useBackendReady } from '../../hooks/useBackendWarmup';

export const SiteHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isBackendReady } = useBackendReady();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSolutionsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Platform', to: '/product' },
    { label: '7-Step Standard', to: '/#workflow' },
    { label: 'AP Simulator', to: '/#simulator' },
    { label: 'PFD ↔ PFMEA', to: '/#sync' },
    { label: 'Guides', to: '/learn' },
    { label: 'Blog', to: '/blog' },
    { label: 'Pricing', to: '/pricing' },
  ];

  const industrySolutions = [
    { label: 'Automotive (IATF 16949)', to: '/fmea/automotive-iatf-16949', tag: 'AIAG-VDA' },
    { label: 'Aerospace & Defense', to: '/fmea/aerospace-as9100', tag: 'AS13004' },
    { label: 'Medical Devices', to: '/fmea/medical-iso-13485', tag: '21 CFR 820' },
    { label: 'Semiconductor Yield', to: '/fmea/semiconductor-jedec', tag: 'JEDEC' },
  ];

  const handleLinkClick = (e: React.MouseEvent, to: string) => {
    if (to.startsWith('/#')) {
      e.preventDefault();
      const targetId = to.replace('/#', '');
      if (location.pathname === '/') {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        navigate(`/?scroll=${targetId}`);
      }
      return;
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-3 sm:pt-4 px-3 sm:px-6 pointer-events-none transition-all duration-200">
      <div className="max-w-[1360px] mx-auto pointer-events-auto">
        {/* Handcrafted Precision Engineering Navigation Bar */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl border transition-all duration-300 ${
            scrolled
              ? 'bg-white/95 backdrop-blur-md border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.08)]'
              : 'bg-white/85 backdrop-blur-sm border-slate-200/80 shadow-[0_2px_12px_rgba(15,23,42,0.03)]'
          }`}
        >
          {/* Left: Brand Identity */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-mono text-sm font-bold shadow-xs transition-transform group-hover:scale-105">
              <span className="text-[#FF5500]">F</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-[18px] sm:text-[19px] tracking-tight text-slate-900">
                  fmeapex
                </span>
                <span className="w-1.5 h-3.5 bg-[#FF5500] rounded-xs" />
              </div>
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase mt-0.5">
                AIAG-VDA 2019
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/60">
            {navLinks.slice(0, 4).map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={(e) => handleLinkClick(e, l.to)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  location.pathname === l.to
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {l.label}
              </Link>
            ))}

            {/* Solutions Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                onBlur={() => setTimeout(() => setSolutionsOpen(false), 200)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1 ${
                  location.pathname.startsWith('/fmea/')
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>Solutions</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
              </button>

              {solutionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 p-2 rounded-xl bg-white border border-slate-200 shadow-xl space-y-1 z-50">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Industry Workspaces
                  </div>
                  {industrySolutions.map((sol) => (
                    <Link
                      key={sol.to}
                      to={sol.to}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                    >
                      <span>{sol.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">
                        {sol.tag}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navLinks.slice(4).map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={(e) => handleLinkClick(e, l.to)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  location.pathname === l.to
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right: Telemetry Badge + Sandbox CTA */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Live System Indicator connected to useBackendWarmup */}
            <div
              title={isBackendReady ? 'Backend operational and PostgreSQL RLS enforced' : 'Waking up cold-start backend services'}
              className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors ${
                isBackendReady
                  ? 'bg-emerald-50 border-emerald-200/70 text-emerald-700'
                  : 'bg-amber-50 border-amber-200/70 text-amber-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
                }`}
              />
              <span>{isBackendReady ? 'RLS Active • Live API' : 'Warming API...'}</span>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Launch Sandbox</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#FF5500]" />
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="sm:hidden h-8 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold"
            >
              Sandbox
            </button>

            <button
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation menu"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {open && (
          <div className="lg:hidden mt-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Core Navigation */}
            <div>
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
                Core Platform
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {navLinks.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    onClick={(e) => {
                      handleLinkClick(e, l.to);
                      setOpen(false);
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Industry Solutions */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
                Industry Workspaces
              </div>
              <div className="space-y-1">
                {industrySolutions.map((sol) => (
                  <Link
                    key={sol.to}
                    to={sol.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <span>{sol.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">
                      {sol.tag}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Action Buttons & Telemetry */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/login');
                }}
                className="w-full h-11 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Launch Free Guest Sandbox</span>
                <ArrowUpRight className="w-4 h-4 text-[#FF5500]" />
              </button>

              <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-1 px-1">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  AIAG-VDA 2019
                </span>
                <span
                  className={`flex items-center gap-1 font-bold ${
                    isBackendReady ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  {isBackendReady ? 'API Operational' : 'API Warming...'}
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
