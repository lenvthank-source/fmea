import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Lock, ArrowUpRight } from 'lucide-react';
import { useBackendReady } from '../../hooks/useBackendWarmup';

export const SiteFooter: React.FC = () => {
  const { isBackendReady } = useBackendReady();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-[13.5px] font-sans antialiased">
      {/* Upper Status Banner with Real Telemetry */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 font-bold ${
                isBackendReady ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                }`}
              />
              <span>{isBackendReady ? 'Production Infrastructure Operational' : 'Backend Starting Up...'}</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">Multi-Tenant PostgreSQL 15 RLS Enforced</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>21 CFR Part 11 SHA-256 Signatures</span>
            </span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="hidden md:inline text-slate-400">AIAG-VDA 2019 (1st Edition)</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-14">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-white font-mono text-sm font-bold">
                <span className="text-[#FF5500]">F</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[20px] tracking-tight text-white">
                  fmeapex
                </span>
                <span className="w-1.5 h-4 bg-[#FF5500] rounded-xs" />
              </div>
            </div>

            <p className="max-w-[360px] text-sm text-slate-400 leading-relaxed">
              The deterministic AIAG-VDA 2019 quality intelligence platform. Unifying Process Flow Diagrams, PFMEAs, and Control Plans in a cryptographic, audit-ready system of record.
            </p>

            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#FF5500] hover:text-white transition-colors"
              >
                <span>Launch Interactive Guest Sandbox</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Column 1: Core Methodology */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono mb-4">
              Methodology
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/learn/aiag-vda-7-step-fmea" className="hover:text-white transition-colors">
                  7-Step AIAG-VDA Method
                </Link>
              </li>
              <li>
                <Link to="/#simulator" className="hover:text-white transition-colors">
                  Action Priority (AP) Engine
                </Link>
              </li>
              <li>
                <Link to="/learn/pfd-pfmea-linking" className="hover:text-white transition-colors">
                  PFD ↔ PFMEA Sync
                </Link>
              </li>
              <li>
                <Link to="/learn/control-plan-sync" className="hover:text-white transition-colors">
                  Control Plan Auto-Flow
                </Link>
              </li>
              <li>
                <Link to="/learn" className="hover:text-white transition-colors">
                  Quality Engineering Guides
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Industry Solutions */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono mb-4">
              Solutions
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/fmea/automotive-iatf-16949" className="hover:text-white transition-colors">
                  Automotive (IATF 16949)
                </Link>
              </li>
              <li>
                <Link to="/fmea/aerospace-as9100" className="hover:text-white transition-colors">
                  Aerospace (AS9100/AS13004)
                </Link>
              </li>
              <li>
                <Link to="/fmea/medical-iso-13485" className="hover:text-white transition-colors">
                  Medical (ISO 13485)
                </Link>
              </li>
              <li>
                <Link to="/fmea/semiconductor-jedec" className="hover:text-white transition-colors">
                  Semiconductor (JEDEC)
                </Link>
              </li>
              <li>
                <Link to="/vs/excel-fmea" className="hover:text-white transition-colors">
                  FMEApex vs Excel
                </Link>
              </li>
              <li>
                <Link to="/vs/iq-rm" className="hover:text-white transition-colors">
                  FMEApex vs APIS IQ-RM
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Compliance & Security */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono mb-4">
              Compliance
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/learn/21-cfr-part-11-fmea" className="hover:text-white transition-colors">
                  21 CFR Part 11 Electronic Records
                </Link>
              </li>
              <li>
                <Link to="/product" className="hover:text-white transition-colors">
                  IATF 16949 §8.3.5 Verification
                </Link>
              </li>
              <li>
                <Link to="/product" className="hover:text-white transition-colors">
                  Immutable Audit Ledger
                </Link>
              </li>
              <li>
                <Link to="/product" className="hover:text-white transition-colors">
                  Reviewer Segregation Rules
                </Link>
              </li>
              <li>
                <Link to="/glossary/action-priority" className="hover:text-white transition-colors">
                  Glossary: Action Priority (AP)
                </Link>
              </li>
              <li>
                <Link to="/glossary/process-flow-diagram" className="hover:text-white transition-colors">
                  Glossary: Process Flow (PFD)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform & Company */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  Transparent Plans & Pricing
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Free Guest Sandbox
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Engineering Deep Dives & Blog
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Our Engineering Philosophy
                </Link>
              </li>
              <li>
                <Link to="/#specs" className="hover:text-white transition-colors">
                  On-Premises Docker Specs
                </Link>
              </li>
              <li>
                <a href="mailto:quality@fmeapex.online" className="hover:text-white transition-colors">
                  Contact Quality Architect
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Lower Legal & Certification Row */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <p>© 2026 FMEApex. Precision manufacturing intelligence. All rights reserved.</p>
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AIAG-VDA 2019 Certified</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>IATF 16949 Compliant</span>
            </span>
            <span>•</span>
            <span>Annex 11 & Part 11</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
