import React from 'react';
import { Link } from 'react-router-dom';

const COLS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Solutions',
    links: [
      { label: 'PFD ↔ PFMEA Sync', to: '/product' },
      { label: '7-Step AIAG-VDA Gating', to: '/product' },
      { label: 'Control Plan Auto-Flow', to: '/product' },
      { label: 'Action Priority (AP) Matrix', to: '/product' },
      { label: 'AI Quality Copilot (RAG)', to: '/product' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Product Architecture', to: '/product' },
      { label: 'Pricing & Tiers', to: '/pricing' },
      { label: 'Security & 21 CFR Part 11', to: '/learn/21-cfr-part-11-fmea' },
      { label: 'Docker On-Premise', to: '/product' },
      { label: 'Release Notes (v0.5.1)', to: '/product' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Learn Hub', to: '/learn' },
      { label: 'Quality Blog', to: '/blog' },
      { label: 'Careers', to: '/about' },
      { label: 'Contact', to: '/#contact' },
    ],
  },
];

export const SiteFooter: React.FC = () => (
  <footer className="bg-[#202020] text-white pt-20 pb-12 border-t border-[#333338] font-sans">
    <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-[#333338]">
        {/* Brand Column */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center tracking-[-0.03em] font-extrabold text-[24px] text-white">
              <span>fmeapex</span>
              <span className="w-2 h-5 bg-[#FF682C] ml-1 rounded-sm transform skew-x-[-14deg]" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold pl-2 border-l border-[#44444C]">
              Quality Intelligence
            </span>
          </div>

          <p className="mt-5 text-[15px] leading-[1.65] text-[#A1A1AA] max-w-[400px]">
            Trusted by global manufacturing, automotive, and aerospace engineering leaders to automate AIAG-VDA 2019 FMEA, eliminate spreadsheets, and ensure 21 CFR Part 11 audit readiness.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-[#2A2A30] border border-[#3A3A42] text-[11px] font-mono text-[#D4D4D8]">
              AIAG-VDA 2019
            </span>
            <span className="px-3 py-1 rounded-full bg-[#2A2A30] border border-[#3A3A42] text-[11px] font-mono text-[#D4D4D8]">
              21 CFR Part 11
            </span>
            <span className="px-3 py-1 rounded-full bg-[#2A2A30] border border-[#3A3A42] text-[11px] font-mono text-[#D4D4D8]">
              IATF 16949
            </span>
          </div>

          <div className="mt-6 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#18181A] border border-[#2E2E34] text-[12px] text-[#A1A1AA]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Telemetry: All Systems Operational (Neon pgvector + R2)</span>
          </div>
        </div>

        {/* Link Columns */}
        {COLS.map((col) => (
          <div key={col.title} className="lg:col-span-2 sm:col-span-4">
            <h4 className="text-[11.5px] font-mono font-bold uppercase tracking-[0.14em] text-[#816729] mb-4">
              {col.title}
            </h4>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-[14px] text-[#D4D4D8] hover:text-[#FF682C] transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Sub-Footer */}
      <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] text-[#828282]">
        <p>© 2026 FMEApex. All rights reserved. Design inspired by Ventriloc BI & Fabric systems.</p>

        <div className="flex items-center gap-6">
          <Link to="/about" className="hover:text-white transition-colors">Privacy</Link>
          <Link to="/about" className="hover:text-white transition-colors">Terms</Link>
          <Link to="/#contact" className="hover:text-white transition-colors">Security Disclosures</Link>
          <span className="font-mono text-[11px] text-[#816729]">v0.5.1 Enterprise</span>
        </div>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
