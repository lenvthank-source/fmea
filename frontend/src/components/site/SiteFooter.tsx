import React from 'react';
import { Link } from 'react-router-dom';

export const SiteFooter: React.FC = () => {
  return (
    <footer className="bg-[#FAF9F6] border-t border-[#E5E0D8] py-16 text-[#52525B] text-[13.5px]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[22px] tracking-tight text-[#18181B]">fmeapex</span>
              <span className="w-2 h-5 bg-[#FF682C] rounded-sm transform skew-x-[-14deg]" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#816729] font-bold pl-2 border-l border-[#E5E0D8]">
                Quality Intelligence
              </span>
            </div>
            <p className="max-w-[340px] text-[14px] text-[#71717A] leading-relaxed">
              Automate AIAG-VDA 2019 FMEA workflows, eliminate spreadsheet risk, and maintain immutable 21 CFR Part 11 audit trails for mission-critical manufacturing.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#10B981] pt-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>All Systems Operational · Neon Cloud RLS Active</span>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-bold text-[#18181B] text-[12px] uppercase tracking-wider font-mono mb-4">Solutions</h4>
            <ul className="space-y-2.5">
              <li><Link to="/product" className="hover:text-[#FF682C] transition-colors">PFD ↔ PFMEA Sync</Link></li>
              <li><Link to="/learn/aiag-vda-7-step-fmea" className="hover:text-[#FF682C] transition-colors">7-Step AIAG-VDA Standard</Link></li>
              <li><Link to="/product" className="hover:text-[#FF682C] transition-colors">Control Plan Auto-Flow</Link></li>
              <li><Link to="/product" className="hover:text-[#FF682C] transition-colors">Deterministic AP Matrix</Link></li>
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="font-bold text-[#18181B] text-[12px] uppercase tracking-wider font-mono mb-4">Compliance</h4>
            <ul className="space-y-2.5">
              <li><Link to="/learn/21-cfr-part-11-fmea" className="hover:text-[#FF682C] transition-colors">21 CFR Part 11</Link></li>
              <li><Link to="/learn" className="hover:text-[#FF682C] transition-colors">IATF 16949 Standards</Link></li>
              <li><Link to="/product" className="hover:text-[#FF682C] transition-colors">Immutable Audit Logs</Link></li>
              <li><Link to="/product" className="hover:text-[#FF682C] transition-colors">Electronic Signatures</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-bold text-[#18181B] text-[12px] uppercase tracking-wider font-mono mb-4">Platform</h4>
            <ul className="space-y-2.5">
              <li><Link to="/pricing" className="hover:text-[#FF682C] transition-colors">Pricing & Plans</Link></li>
              <li><Link to="/login" className="hover:text-[#FF682C] transition-colors">Guest Sandbox</Link></li>
              <li><Link to="/about" className="hover:text-[#FF682C] transition-colors">About FMEApex</Link></li>
              <li><a href="mailto:quality@fmeapex.online" className="hover:text-[#FF682C] transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#A1A1AA]">
          <p>© 2026 FMEApex Inc. All rights reserved. Quality engineered to evolve.</p>
          <div className="flex items-center gap-4 sm:gap-6 font-mono text-[11px]">
            <span>AIAG-VDA 2019 (1st Ed)</span>
            <span>·</span>
            <span>21 CFR Part 11</span>
            <span>·</span>
            <span>ISO 9001:2015</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
