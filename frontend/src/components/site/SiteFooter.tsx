import React from 'react';
import { Link } from 'react-router-dom';

const COLS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Product', to: '/product' },
      { label: '7-Step Workflow', to: '/product' },
      { label: 'PFD ↔ PFMEA', to: '/product' },
      { label: 'Control Plan', to: '/product' },
      { label: 'AI Copilot', to: '/product' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Careers', to: '/about' },
      { label: 'Contact', to: '/#contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Learn Hub', to: '/learn' },
      { label: 'Blog', to: '/blog' },
      { label: 'AIAG-VDA Guide', to: '/learn/aiag-vda-7-step-fmea' },
      { label: '21 CFR Part 11', to: '/learn/21-cfr-part-11-fmea' },
    ],
  },
];

export const SiteFooter: React.FC = () => (
  <footer className="relative bg-[#0B1220] text-white overflow-hidden rounded-t-[32px]">
    {/* Accent shape */}
    <div className="absolute -right-24 -bottom-24 w-[380px] h-[380px] rounded-[48px] bg-[#0D9488]/25 rotate-[18deg] pointer-events-none" />
    <div className="absolute -right-12 -bottom-12 w-[220px] h-[220px] rounded-[40px] bg-[#14B8A6]/30 rotate-[18deg] pointer-events-none" />

    <div className="relative w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-20 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Brand */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-white flex items-center justify-center">
              <span className="text-[#0B1220] font-bold text-[16px] leading-none">F</span>
            </div>
            <span className="text-[20px] font-[650] tracking-[-0.02em]">FMEApex</span>
          </div>
          <p className="mt-5 text-[15px] leading-[1.65] text-white/60 max-w-[360px]">
            The AI-native FMEA platform for quality engineering. AIAG-VDA 2019 compliant, audit-ready, built for modern manufacturing teams.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 h-[38px] rounded-full bg-white/[0.06] border border-white/10 text-[13px] text-white/70">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
            System status — Operational
          </div>
        </div>

        {/* Link columns */}
        {COLS.map((col) => (
          <div key={col.title} className="lg:col-span-2">
            <h4 className="text-[12px] font-[650] uppercase tracking-[0.12em] text-white/40 mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-[14px] text-white/70 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-7 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[13px] text-white/40">© 2026 FMEApex. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="text-[13px] text-white/40 hover:text-white/80 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-[13px] text-white/40 hover:text-white/80 transition-colors">Terms</Link>
          <span className="text-[13px] text-white/40">AIAG-VDA 2019 · 21 CFR Part 11</span>
        </div>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
