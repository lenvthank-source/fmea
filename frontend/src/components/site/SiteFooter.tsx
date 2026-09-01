import React from 'react';
import { Link } from 'react-router-dom';

export const SiteFooter: React.FC = () => {
  return (
    <footer className="bg-[#FAFAFA] border-t border-[#E4E4E7] py-14 text-[#71717A] text-[13px]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[20px] tracking-tight text-[#09090B]">fmeapex</span>
              <span className="w-2 h-4 bg-[#FF682C] rounded-sm transform skew-x-[-14deg]" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] pl-2 border-l border-[#E4E4E7]">
                Quality Intelligence
              </span>
            </div>
            <p className="max-w-[340px] text-[13.5px] text-[#71717A] leading-relaxed">
              Automate AIAG-VDA 2019 FMEA workflows, eliminate spreadsheet risk, and maintain immutable 21 CFR Part 11 audit trails for mission-critical manufacturing.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>All Systems Operational · Neon Cloud RLS Active</span>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-semibold text-[#09090B] text-[12.5px] uppercase tracking-wider font-mono mb-3">Solutions</h4>
            <ul className="space-y-2">
              <li><Link to="/product" className="hover:text-[#09090B] transition-colors">PFD ↔ PFMEA Sync</Link></li>
              <li><Link to="/learn/aiag-vda-7-step-fmea" className="hover:text-[#09090B] transition-colors">7-Step AIAG-VDA</Link></li>
              <li><Link to="/product" className="hover:text-[#09090B] transition-colors">Control Plan Auto-Flow</Link></li>
              <li><Link to="/product" className="hover:text-[#09090B] transition-colors">Deterministic AP Matrix</Link></li>
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="font-semibold text-[#09090B] text-[12.5px] uppercase tracking-wider font-mono mb-3">Compliance</h4>
            <ul className="space-y-2">
              <li><Link to="/learn/21-cfr-part-11-fmea" className="hover:text-[#09090B] transition-colors">21 CFR Part 11</Link></li>
              <li><Link to="/learn" className="hover:text-[#09090B] transition-colors">IATF 16949 Standards</Link></li>
              <li><Link to="/product" className="hover:text-[#09090B] transition-colors">Immutable Audit Logs</Link></li>
              <li><Link to="/product" className="hover:text-[#09090B] transition-colors">Electronic Signatures</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-[#09090B] text-[12.5px] uppercase tracking-wider font-mono mb-3">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/pricing" className="hover:text-[#09090B] transition-colors">Pricing & Plans</Link></li>
              <li><Link to="/login" className="hover:text-[#09090B] transition-colors">Guest Sandbox</Link></li>
              <li><Link to="/about" className="hover:text-[#09090B] transition-colors">About FMEApex</Link></li>
              <li><a href="mailto:quality@fmeapex.online" className="hover:text-[#09090B] transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E4E4E7] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#A1A1AA]">
          <p>© 2026 FMEApex Inc. All rights reserved. Quality engineered to evolve.</p>
          <div className="flex items-center gap-6">
            <span>AIAG-VDA 2019 (1st Ed)</span>
            <span>·</span>
            <span>21 CFR Part 11 Compliant</span>
            <span>·</span>
            <span>ISO 9001:2015 Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
