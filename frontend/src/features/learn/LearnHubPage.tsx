import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import { ArrowRight, BookOpen } from 'lucide-react';

const PILLARS = [
  { slug: 'aiag-vda-7-step-fmea', title: 'AIAG-VDA 7-Step FMEA Standard', badge: 'Core Standard', desc: 'Planning → Structure → Function → Failure → Risk → Optimization → Documentation with hard gating. Includes AP lookup tables and real examples.' },
  { slug: 'pfd-pfmea-linking', title: 'PFD ↔ PFMEA Bidirectional Linking', badge: 'Sync Architecture', desc: 'Maintain strict synchronization between process flows and the PFMEA grid. Automatic orphan detection and characteristic flow-down.' },
  { slug: 'control-plan-sync', title: 'Control Plan Dynamic Generation', badge: 'Shop Floor', desc: 'Generate and propagate control plans directly from FMEA controls and characteristics. Serializable, revisioned, and audit-ready.' },
  { slug: '21-cfr-part-11-fmea', title: '21 CFR Part 11 Compliance in FMEA', badge: 'Regulatory', desc: 'Cryptographic digital signatures, typed immutable audit logs, and reviewer segregation required for FDA and OEM inspection readiness.' },
];

export const LearnHubPage: React.FC = () => (
  <div className="bg-[#FBFBFC] min-h-screen text-slate-900 font-sans antialiased selection:bg-[#FF5500]/20 selection:text-slate-900">
    <SEO
      title="Knowledge Hub — FMEApex | Quality Risk & AIAG-VDA Engineering Guides"
      description="Deep-dive engineering guides on the AIAG-VDA 7-step FMEA, PFD-PFMEA linking, Control Plan sync, and 21 CFR Part 11 compliance."
      canonical="/learn"
    />
    <SiteHeader />

    {/* Hero */}
    <section className="pt-32 sm:pt-40 pb-16 px-4 sm:px-6 lg:px-8 bg-tech-dots border-b border-slate-200">
      <div className="max-w-[800px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-xs mb-6">
          <BookOpen className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>Quality Engineering Knowledge Base</span>
        </div>
        <h1 className="text-[38px] sm:text-[54px] font-extrabold leading-[1.06] tracking-[-0.035em] text-slate-900 mb-5 ff-heading">
          Master quality risk,<br />
          <span className="text-[#FF5500]">step by verifiable step.</span>
        </h1>
        <p className="text-[17px] sm:text-[20px] leading-[1.6] text-slate-600 max-w-[620px] mx-auto">
          Authoritative technical specifications and methodology handbooks designed for quality engineers, manufacturing leads, and regulatory audit directors.
        </p>
      </div>
    </section>

    {/* Pillars Grid */}
    <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-7">
        {PILLARS.map((p) => (
          <Link
            key={p.slug}
            to={`/learn/${p.slug}`}
            className="group rounded-2xl border border-slate-200 bg-white p-8 sm:p-9 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
          >
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-wider mb-4 border border-slate-200">
                {p.badge}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-2.5 group-hover:text-[#FF5500] transition-colors">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {p.desc}
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-bold text-slate-900 group-hover:text-[#FF5500]">
              <span>Read Full Engineering Guide</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default LearnHubPage;
