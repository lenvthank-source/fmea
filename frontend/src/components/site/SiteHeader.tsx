import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const SiteHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { label: 'Solutions', to: '/product' },
    { label: '7-Step Standard', to: '/learn/aiag-vda-7-step-fmea' },
    { label: '21 CFR Part 11', to: '/learn/21-cfr-part-11-fmea' },
    { label: 'Risk Simulator', to: '/#simulator' },
    { label: 'Pricing', to: '/pricing' },
  ];

  return (
    <header className="sticky top-0 inset-x-0 z-50 bg-[#FFFFFF] border-b border-[#E4E4E7] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors">
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-decoration-none group shrink-0">
            <div className="flex items-center tracking-[-0.03em] font-extrabold text-[22px] text-[#09090B]">
              <span>fmeapex</span>
              <span className="w-2 h-5 bg-[#FF682C] ml-1 rounded-sm transform skew-x-[-14deg] group-hover:scale-y-110 transition-transform" />
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-[0.14em] text-[#71717A] font-bold pl-2 border-l border-[#E4E4E7]">
              Quality Platform
            </span>
          </Link>

          {/* Centered Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className={`text-[13.5px] font-medium transition-colors ${
                  location.pathname === l.to
                    ? 'text-[#09090B] font-semibold'
                    : 'text-[#71717A] hover:text-[#09090B]'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-[13.5px] font-semibold text-[#09090B] hover:text-[#FF682C] px-3 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="h-10 px-4 rounded-xl bg-[#09090B] hover:bg-[#27272A] text-white text-[13.5px] font-semibold transition-all shadow-sm flex items-center gap-2"
            >
              <span>Launch Sandbox</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/20 text-white font-mono uppercase">Free</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="h-9 px-3 rounded-lg bg-[#09090B] text-white text-[12.5px] font-semibold"
            >
              Sandbox
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="w-9 h-9 rounded-lg border border-[#E4E4E7] flex items-center justify-center text-[#09090B]"
              aria-label="Toggle menu"
            >
              <span>{open ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden border-t border-[#E4E4E7] bg-white px-5 py-4 space-y-3 shadow-lg">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block text-[14px] font-medium text-[#71717A] hover:text-[#09090B] py-1.5"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#E4E4E7] space-y-2">
            <button
              onClick={() => { setOpen(false); navigate('/login'); }}
              className="w-full h-10 rounded-xl bg-[#09090B] text-white text-[13.5px] font-semibold"
            >
              Launch Sandbox
            </button>
            <button
              onClick={() => { setOpen(false); navigate('/login'); }}
              className="w-full h-10 rounded-xl border border-[#E4E4E7] text-[#09090B] text-[13.5px] font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
