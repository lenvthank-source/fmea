import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';

const PILLARS = [
  { slug: 'aiag-vda-7-step-fmea', title: 'AIAG-VDA 7-Step FMEA Standard', badge: 'Methodology', desc: 'Planning → Structure → Function → Failure → Risk → Optimization → Documentation with hard gating. Includes AP lookup tables and examples.' },
  { slug: 'pfd-pfmea-linking', title: 'PFD ↔ PFMEA Bidirectional Linking', badge: 'Sync Architecture', desc: 'Maintain strict synchronization between process flows and the PFMEA grid. Automatic orphan detection and characteristic flow-down.' },
  { slug: 'control-plan-sync', title: 'Control Plan Dynamic Generation', badge: 'Shop Floor', desc: 'Generate and propagate control plans directly from FMEA controls and characteristics. Serializable, revisioned, and audit-ready.' },
  { slug: '21-cfr-part-11-fmea', title: '21 CFR Part 11 Compliance in FMEA', badge: 'Regulatory', desc: 'Cryptographic digital signatures, typed immutable audit logs, and reviewer segregation required for FDA inspection readiness.' },
];

export const LearnHubPage: React.FC = () => (
  <div className="bg-[#FAF9F6] min-h-screen text-[#18181B] font-sans antialiased">
    <SEO
      title="Learn Hub — FMEApex | Quality Risk Knowledge Base"
      description="Deep-dive engineering guides on the AIAG-VDA 7-step FMEA, PFD-PFMEA linking, Control Plan sync, and 21 CFR Part 11 compliance."
      canonical="/learn"
    />
    <SiteHeader />

    {/* Hero */}
    <section className="pt-28 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[760px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E0D8] text-[11.5px] font-mono font-bold text-[#816729] shadow-xs mb-6">
          <span className="text-[#FF682C]">✦</span>
          <span>Knowledge Base</span>
        </div>
        <h1 className="text-[38px] sm:text-[54px] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#18181B] mb-5 ff-heading">
          Master quality risk,<br />step by step.
        </h1>
        <p className="text-[17px] sm:text-[19px] leading-[1.6] text-[#52525B] max-w-[580px] mx-auto">
          Authoritative guides designed for quality engineers, manufacturing leads, and regulatory audit readiness.
        </p>
      </div>
    </section>

    {/* Pillars Grid */}
    <section className="pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        {PILLARS.map((p) => (
          <Link
            key={p.slug}
            to={`/learn/${p.slug}`}
            className="group rounded-[28px] border border-[#E5E0D8] bg-white p-8 sm:p-9 flex flex-col justify-between hover:border-[#D4D4D8] hover:shadow-xs transition-all"
          >
            <div>
              <span className="inline-block px-3 py-1 rounded-md bg-[#FAF9F6] border border-[#E5E0D8] text-[#816729] text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
                {p.badge}
              </span>
              <h3 className="text-[22px] font-bold text-[#18181B] mb-3 group-hover:text-[#FF682C] transition-colors">{p.title}</h3>
              <p className="text-[14.5px] leading-relaxed text-[#52525B]">{p.desc}</p>
            </div>
            <div className="mt-7 pt-4 border-t border-[#E5E0D8] flex items-center justify-between text-[13px] font-bold text-[#FF682C]">
              <span>Read guide</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default LearnHubPage;
