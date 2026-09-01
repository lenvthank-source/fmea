import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';

const PILLARS = [
  { slug: 'aiag-vda-7-step-fmea', title: 'AIAG-VDA 7-Step FMEA', badge: 'Standards', desc: 'Planning → Structure → Function → Failure → Risk → Optimization → Documentation. Each step with examples, checklists, and AP lookup tables.' },
  { slug: 'pfd-pfmea-linking', title: 'PFD ↔ PFMEA Linking', badge: 'Linking', desc: 'Bidirectional sync between process flow and PFMEA. Orphan detection, sequence mismatches, and one-click relink.' },
  { slug: 'control-plan-sync', title: 'Control Plan Sync', badge: 'Control Plan', desc: 'Generate and propagate control plans from FMEA characteristics. Serializable, revisioned, and audit-ready.' },
  { slug: '21-cfr-part-11-fmea', title: '21 CFR Part 11', badge: 'Compliance', desc: 'Digital signatures, typed audit logs, reviewer segregation. What regulated industries require from FMEA software.' },
];

export const LearnHubPage: React.FC = () => (
  <div className="bg-[#F7F6F3] min-h-screen">
    <SEO
      title="Learn — FMEApex Knowledge Hub"
      description="Guides on the AIAG-VDA 7-step FMEA, PFD-PFMEA linking, Control Plan sync, and 21 CFR Part 11 compliance."
      canonical="/learn"
    />
    <SiteHeader />

    {/* Hero */}
    <section className="pt-[120px] pb-16 px-5 sm:px-8 lg:px-12">
      <div className="max-w-[720px] mx-auto text-center">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-[#0D9488] text-[12px] font-[650] uppercase tracking-[0.08em]">
          Learn Hub
        </span>
        <h1 className="mt-5 text-[40px] sm:text-[52px] leading-[1.05] font-[650] tracking-[-0.02em] text-[#0F172A]">
          Master quality risk, step by step.
        </h1>
        <p className="mt-5 text-[17px] leading-[1.6] text-[#5B6470] max-w-[580px] mx-auto">
          Deep-dive guides built with structured JSON-LD and FAQ blocks — engineered for both GIS professionals and AI-powered answers.
        </p>
      </div>
    </section>

    {/* Pillars */}
    <section className="pb-24 px-5 sm:px-8 lg:px-12">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
        {PILLARS.map((p) => (
          <Link
            key={p.slug}
            to={`/learn/${p.slug}`}
            className="group rounded-[20px] border border-[#E6E1D8] bg-white p-8 flex flex-col hover:-translate-y-1 hover:shadow-[0_24px_48px_-16px_rgba(15,23,42,0.14)] hover:border-[#0D9488]/30 transition-all"
          >
            <span className="inline-block self-start px-3 py-1 rounded-full bg-[#F0FDF9] border border-[#99E5DA] text-[#0D9488] text-[11px] font-[650] uppercase tracking-[0.06em] mb-4">
              {p.badge}
            </span>
            <h3 className="text-[20px] font-[650] text-[#0F172A] leading-[1.25] mb-3">{p.title}</h3>
            <p className="text-[14px] leading-[1.6] text-[#5B6470] flex-1">{p.desc}</p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-[600] text-[#0D9488]">
              Read the guide <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>

    <SiteFooter />
  </div>
);
export default LearnHubPage;
