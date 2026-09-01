import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import { VentrilocDashboard } from '../../components/site/VentrilocDashboard';

const FEATURES = [
  { t: '7-Step AIAG-VDA', d: 'Guided Structure → Function → Failure → Risk → Optimization → Documentation with hard gating. No skipping. No orphan data.', tag: 'Methodology' },
  { t: 'PFD ↔ PFMEA Linking', d: 'Bidirectional sync between process flow diagrams and PFMEA — orphan detection and sequence mismatch warnings included.', tag: 'Linking' },
  { t: 'AI Copilot (RAG)', d: 'Tenant-isolated vector search suggests failure modes and controls. Every suggestion is human-reviewed before commit.', tag: 'AI' },
  { t: 'Control Plan Sync', d: 'Control plans are generated from FMEA controls and characteristics. Changes propagate bidirectionally.', tag: 'Control Plan' },
  { t: 'Actions Lifecycle', d: 'Open → In Progress → Completed → Verified → Closed, with evidence files and before/after risk recalculation.', tag: 'Actions' },
  { t: '21 CFR Part 11', d: 'Typed audit trail, electronic signatures, revision locks, reviewer segregation. Audit ready from day one.', tag: 'Compliance' },
];

const SPECS: [string, string][] = [
  ['Standards', 'AIAG-VDA 2019, 21 CFR Part 11'],
  ['Documents', 'PFMEA, DFMEA, PFD, Control Plan'],
  ['AI Engine', 'LLM + RAG, HNSW vector index (tenant-isolated)'],
  ['Database', 'PostgreSQL 15 + pgvector, row-level security'],
  ['Security', 'JWT, RBAC (22 permissions), HMAC webhooks'],
  ['Deployment', 'Docker Compose — single-command on-prem'],
];

export const ProductPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <SEO
        title="Product — FMEApex | AIAG-VDA FMEA Platform"
        description="FMEApex product deep dive: 7-step FMEA, PFD-PFMEA linking, AI copilot, Control Plan sync, actions lifecycle, 21 CFR Part 11 compliance."
        canonical="/product"
      />
      <SiteHeader />

      {/* Hero */}
      <section className="pt-[120px] pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-[#0D9488] text-[12px] font-[650] uppercase tracking-[0.08em]">
              The platform
            </span>
            <h1 className="mt-5 text-[40px] sm:text-[52px] leading-[1.05] font-[650] tracking-[-0.02em] text-[#0F172A]">
              A complete FMEA workspace, not another spreadsheet.
            </h1>
            <p className="mt-5 text-[17px] leading-[1.6] text-[#5B6470] max-w-[480px]">
              Six connected modules — PFD, PFMEA, DFMEA, Control Plan, Actions, and an AI Copilot — in one tenant-isolated, audit-ready application.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/login')}
                className="btn-ventriloc-primary h-[48px] px-7 text-[14.5px]"
              >
                Try the preview
              </button>
              <button
                onClick={() => navigate('/#contact')}
                className="btn-ventriloc-outline h-[48px] px-7 text-[14.5px]"
              >
                Book a demo
              </button>
            </div>
          </div>
          <div className="reveal">
            <VentrilocDashboard />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-5 sm:px-8 lg:px-12 bg-white border-y border-[#E6E1D8]">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-[36px] sm:text-[44px] font-[650] tracking-[-0.02em] text-[#0F172A]">Everything, connected.</h2>
          <p className="mt-3 text-[16px] text-[#5B6470] max-w-[560px]">Each module is editable from day one and linked to the rest. No copy-paste. No drift.</p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.t}
                className="group rounded-[16px] border border-[#E6E1D8] bg-white p-6 hover:-translate-y-1 hover:shadow-[0_20px_44px_-18px_rgba(15,23,42,0.15)] transition-all"
              >
                <span className="inline-block px-2.5 py-1 rounded-md bg-[#F0FDF9] border border-[#99E5DA] text-[#0D9488] text-[11px] font-[650] uppercase tracking-[0.06em]">
                  {f.tag}
                </span>
                <h3 className="mt-4 text-[17px] font-[650] text-[#0F172A]">{f.t}</h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-[#5B6470]">{f.d}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-[600] text-[#0D9488]">
                  Learn more <span aria-hidden="true">→</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="py-20 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[840px] mx-auto">
          <h2 className="text-[32px] sm:text-[40px] font-[650] tracking-[-0.02em] text-[#0F172A]">Technical specifications</h2>
          <p className="mt-3 text-[16px] text-[#5B6470]">Enterprise-grade architecture, deployable on-prem.</p>

          <div className="mt-10 rounded-[16px] border border-[#E6E1D8] bg-white overflow-hidden divide-y divide-[#EFEBE3]">
            {SPECS.map(([k, v]) => (
              <div key={k} className="grid sm:grid-cols-[200px_1fr] px-6 py-4">
                <span className="text-[13px] font-[600] text-[#8A8F98] uppercase tracking-[0.06em] py-0.5">{k}</span>
                <span className="text-[14.5px] text-[#334155]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};
export default ProductPage;
