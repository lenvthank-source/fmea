import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const SiteHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [lang, setLang] = useState<'En' | 'Fr'>('En');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const services = [
    { title: 'PFD ↔ PFMEA Sync', sub: 'Bidirectional sync & orphan detection', to: '/product' },
    { title: '7-Step AIAG-VDA 2019', sub: 'Hard-gated quality analysis steps', to: '/learn/aiag-vda-7-step-fmea' },
    { title: 'Control Plan Auto-Propagation', sub: 'Characteristics flow directly to CP', to: '/product' },
    { title: 'Risk & Action Priority (AP)', sub: 'S/O/D lookup matrix & High-AP mandate', to: '/product' },
    { title: '21 CFR Part 11 Compliance', sub: 'Electronic signatures & immutable audit log', to: '/learn/21-cfr-part-11-fmea' },
    { title: 'AI Decision Intelligence', sub: 'Tenant-isolated RAG suggestions', to: '/product' },
  ];

  const platformLinks = [
    { label: 'Overview', to: '/product' },
    { label: 'Learn Hub', to: '/learn' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Blog', to: '/blog' },
    { label: 'About', to: '/about' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#FFFFFF]/92 backdrop-blur-md shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] border-b border-[#E4E4E4] py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          {/* Ventriloc-styled Wordmark Logo */}
          <Link to="/" className="flex items-center gap-2 text-decoration-none group shrink-0">
            <div className="flex items-center tracking-[-0.03em] font-extrabold text-[22px] sm:text-[24px] text-[#202020]">
              <span>fmeapex</span>
              <span className="w-2 h-5 bg-[#FF682C] ml-1 rounded-sm transform skew-x-[-14deg] group-hover:scale-y-110 transition-transform" />
            </div>
            <span className="hidden md:inline-block text-[10px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold pl-2 border-l border-[#D4D4D8]">
              Quality Platform
            </span>
          </Link>

          {/* Centered Floating Nav Capsule (Ventriloc signature) */}
          <nav className="hidden lg:flex items-center bg-[#F5F5F5] p-1.5 rounded-full border border-[#E4E4E4] shadow-sm relative">
            {/* Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('services')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`px-4 py-2 rounded-full text-[13.5px] font-semibold transition-all flex items-center gap-1.5 ${
                  activeDropdown === 'services' ? 'bg-[#202020] text-white' : 'text-[#4D4D4D] hover:text-[#202020]'
                }`}
              >
                <span>Services & Solutions</span>
                <span className={`text-[10px] transition-transform duration-200 ${activeDropdown === 'services' ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Mega Dropdown Menu */}
              {activeDropdown === 'services' && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-[420px] bg-white rounded-[20px] border border-[#E4E4E4] shadow-[0_24px_50px_-16px_rgba(0,0,0,0.18)] p-3 grid grid-cols-1 gap-1 animate-fadeIn">
                  {services.map((s) => (
                    <Link
                      key={s.title}
                      to={s.to}
                      className="p-3 rounded-[12px] hover:bg-[#F5F5F5] transition-colors group"
                    >
                      <div className="text-[13.5px] font-bold text-[#202020] group-hover:text-[#FF682C] transition-colors flex items-center justify-between">
                        <span>{s.title}</span>
                        <span className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </div>
                      <div className="text-[11.5px] text-[#828282] mt-0.5">{s.sub}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Standard Nav Links */}
            {platformLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-full text-[13.5px] font-semibold transition-all ${
                  location.pathname === l.to
                    ? 'bg-[#202020] text-white shadow-sm'
                    : 'text-[#4D4D4D] hover:text-[#202020] hover:bg-white/80'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions & Language Toggle */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Language Switcher Pill (Ventriloc style) */}
            <div className="flex items-center bg-[#F5F5F5] p-1 rounded-full border border-[#E4E4E4] text-[11px] font-bold font-mono">
              <button
                onClick={() => setLang('Fr')}
                className={`px-2.5 py-1 rounded-full transition-all ${lang === 'Fr' ? 'bg-[#202020] text-white' : 'text-[#828282] hover:text-[#202020]'}`}
              >
                FR
              </button>
              <button
                onClick={() => setLang('En')}
                className={`px-2.5 py-1 rounded-full transition-all ${lang === 'En' ? 'bg-[#202020] text-white' : 'text-[#828282] hover:text-[#202020]'}`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="text-[13.5px] font-bold text-[#202020] hover:text-[#FF682C] px-3 py-2 transition-colors"
            >
              Log in
            </button>

            {/* Ventriloc Primary Orange CTA */}
            <button
              onClick={() => navigate('/login')}
              className="btn-ventriloc-primary h-[44px] px-6 text-[13.5px] tracking-wide"
            >
              Try the preview
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="btn-ventriloc-primary h-[38px] px-4 text-[12.5px]"
            >
              Try Preview
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="w-10 h-10 rounded-full bg-[#F5F5F5] border border-[#E4E4E4] flex items-center justify-center text-[#202020]"
              aria-label="Toggle Menu"
            >
              <span className="text-[18px]">{open ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-x-0 top-[70px] bottom-0 bg-[#FFFFFF] border-t border-[#E4E4E4] p-6 flex flex-col justify-between overflow-y-auto z-50">
          <div className="space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#816729] font-bold">Solutions</div>
            <div className="space-y-2">
              {services.map((s) => (
                <Link
                  key={s.title}
                  to={s.to}
                  className="block p-2.5 rounded-[10px] bg-[#F5F5F5] text-[13.5px] font-bold text-[#202020]"
                >
                  {s.title}
                </Link>
              ))}
            </div>

            <div className="text-[11px] font-mono uppercase tracking-wider text-[#816729] font-bold pt-4">Navigation</div>
            <div className="space-y-1">
              {platformLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="block py-2 text-[15px] font-semibold text-[#202020]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-[#E4E4E4] space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full h-[48px] rounded-full border border-[#202020] text-[#202020] font-bold text-[14px]"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full btn-ventriloc-primary h-[48px] text-[14px]"
            >
              Try the preview →
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
