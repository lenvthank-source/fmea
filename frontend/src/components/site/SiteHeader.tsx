import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const SiteHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const links = [
    { label: 'Product', to: '/product' },
    { label: 'Learn', to: '/learn' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Blog', to: '/blog' },
    { label: 'About', to: '/about' },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#F7F6F3]/90 backdrop-blur-md border-b border-[#E6E1D8]' : 'bg-transparent'}`}>
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-[10px] bg-[#0F172A] flex items-center justify-center">
              <span className="text-white font-bold text-[15px] leading-none">F</span>
            </div>
            <span className="text-[19px] font-[650] tracking-[-0.02em] text-[#0F172A]">FMEApex</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-full text-[14.5px] font-[500] transition-colors ${
                  location.pathname === l.to
                    ? 'text-[#0F172A] bg-white shadow-sm border border-[#E6E1D8]'
                    : 'text-[#5B6470] hover:text-[#0F172A] hover:bg-white/60'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 h-[42px] rounded-full text-[14.5px] font-[550] text-[#0F172A] hover:bg-white transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-5 h-[42px] rounded-full bg-[#0F172A] text-white text-[14.5px] font-[550] hover:bg-[#1E293B] transition-colors flex items-center gap-2"
            >
              Try the preview
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* Mobile burger */}
          <button
            className="lg:hidden w-[44px] h-[44px] rounded-full bg-white border border-[#E6E1D8] flex items-center justify-center"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <div className="relative w-5 h-5">
              <span className={`absolute left-0 top-[6px] h-[2px] w-5 bg-[#0F172A] rounded transition-all duration-300 ${open ? 'rotate-45 top-[9px]' : ''}`} />
              <span className={`absolute left-0 top-[12px] h-[2px] w-5 bg-[#0F172A] rounded transition-all duration-300 ${open ? '-rotate-45 top-[9px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-400 ease-out ${open ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-[#F7F6F3] border-t border-[#E6E1D8] px-5 py-4 space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="block px-4 py-3 rounded-[12px] text-[16px] font-[550] text-[#0F172A] hover:bg-white"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 pb-2 flex gap-3">
            <button onClick={() => navigate('/login')} className="flex-1 h-[48px] rounded-full border border-[#0F172A] text-[#0F172A] font-[550] text-[15px]">Login</button>
            <button onClick={() => navigate('/login')} className="flex-1 h-[48px] rounded-full bg-[#0F172A] text-white font-[550] text-[15px]">Try the preview</button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
