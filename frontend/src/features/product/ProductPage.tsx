import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import { VentrilocDashboard } from '../../components/site/VentrilocDashboard';

const FEATURES = [
  { t: '7-Step AIAG-VDA Workflow', d: 'Structure → Function → Failure → Risk → Optimization → Documentation with hard gating. No skipping. Zero spreadsheet loss.', tag: 'AIAG-VDA 2019' },
  { t: 'PFD ↔ PFMEA Sync', d: 'Bidirectional sync between process flow diagrams and PFMEA grid. Automatic orphan detection and characteristic flow-down.', tag: 'Sync Engine' },
  { t: 'AI Copilot (Vector RAG)', d: 'Tenant-isolated OpenAI embeddings suggest failure modes and detection controls. Every suggestion is human-reviewed before commit.', tag: 'AI Intelligence' },
  { t: 'Control Plan Auto-Flow', d: 'Control plans are dynamically compiled from FMEA characteristics and controls. Changes propagate bidirectionally.', tag: 'Shop Floor' },
  { t: 'Corrective Actions Lifecycle', d: 'Open → In Progress → Completed → Verified → Closed, with Cloudflare R2 evidence files and before/after risk recalculation.', tag: 'Closed Loop' },
  { t: '21 CFR Part 11 Compliance', d: 'Cryptographic audit trail, electronic signatures, revision locks, and reviewer segregation. Inspection-ready from day one.', tag: 'Regulatory' },
];

const SPECS: [string, string][] = [
  ['Standards Compliance', 'AIAG-VDA 2019 (1st Edition) · 21 CFR Part 11 · IATF 16949'],
  ['Document Types', 'PFMEA · DFMEA · Process Flow Diagram (PFD) · Control Plan (CP)'],
  ['AI Vector Engine', 'Tenant-isolated RAG · OpenAI Embeddings · Neon pgvector HNSW'],
  ['Database Architecture', 'PostgreSQL 15 Serverless · Strict Row-Level Security (RLS)'],
  ['Security & Auth', 'RS256 JWT · RBAC 22 granular scopes · HMAC-SHA256 webhooks'],
  ['Deployment Targets', 'Cloudflare Pages Edge + Managed Render + Docker / Podman on-premises'],
];

export const ProductPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#18181B] font-sans antialiased">
      <SEO
        title="Product — FMEApex | AIAG-VDA Quality Intelligence Platform"
        description="FMEApex product deep dive: 7-step FMEA, PFD-PFMEA linking, AI copilot, Control Plan sync, actions lifecycle, 21 CFR Part 11 compliance."
        canonical="/product"
      />
      <SiteHeader />

      {/* Hero Tile */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1340px] mx-auto">
          <div className="max-w-[820px] mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E0D8] text-[11.5px] font-mono font-bold text-[#816729] shadow-xs mb-6">
              <span className="text-[#FF682C]">✦</span>
              <span>Enterprise Quality OS</span>
            </div>
            <h1 className="text-[38px] sm:text-[54px] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#18181B] mb-5 ff-heading">
              A unified FMEA workspace,<br />
              not another fragile spreadsheet.
            </h1>
            <p className="text-[17px] sm:text-[19px] leading-[1.6] text-[#52525B] max-w-[620px] mb-8">
              Six connected modules—PFD, PFMEA, DFMEA, Control Plan, Actions, and an AI Copilot—in one tenant-isolated, audit-ready application.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/login')}
                className="h-12 px-8 rounded-full bg-[#FF682C] hover:bg-[#E05219] text-white text-[14.5px] font-semibold transition-all shadow-[0_6px_20px_rgba(255,104,44,0.35)] flex items-center gap-2"
              >
                <span>Launch Free Sandbox</span>
                <span>→</span>
              </button>
              <button
                onClick={() => navigate('/#contact')}
                className="h-12 px-7 rounded-full border border-[#18181B] hover:bg-[#18181B] hover:text-white text-[#18181B] text-[14.5px] font-semibold transition-all"
              >
                Talk to Quality Architects
              </button>
            </div>
          </div>

          {/* Interactive Live Dashboard Tile */}
          <div className="rounded-[28px] border border-[#E5E0D8] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden">
            <VentrilocDashboard />
          </div>
        </div>
      </section>

      {/* Feature Tiles Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-[#E5E0D8]">
        <div className="max-w-[1340px] mx-auto">
          <div className="max-w-[640px] mb-12">
            <span className="text-[11.5px] font-mono uppercase tracking-wider text-[#FF682C] font-bold">Platform Capabilities</span>
            <h2 className="text-[32px] sm:text-[42px] font-extrabold tracking-tight text-[#18181B] mt-2 ff-heading">
              Built for precision quality workflows
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.t}
                className="rounded-[24px] bg-[#FAF9F6] border border-[#E5E0D8] p-7 flex flex-col justify-between hover:border-[#D4D4D8] hover:shadow-xs transition-all"
              >
                <div>
                  <span className="inline-block text-[11px] font-mono font-bold text-[#816729] bg-[#EBE6DD] px-2.5 py-1 rounded-md mb-4">
                    {f.tag}
                  </span>
                  <h3 className="text-[19px] font-bold text-[#18181B] mb-2">{f.t}</h3>
                  <p className="text-[14px] leading-relaxed text-[#52525B]">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF9F6]">
        <div className="max-w-[1340px] mx-auto">
          <div className="max-w-[640px] mb-10">
            <span className="text-[11.5px] font-mono uppercase tracking-wider text-[#816729] font-bold">Architecture</span>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight text-[#18181B] mt-1.5 ff-heading">
              Technical Specifications
            </h2>
          </div>

          <div className="rounded-[24px] bg-white border border-[#E5E0D8] divide-y divide-[#E5E0D8] overflow-hidden shadow-xs">
            {SPECS.map(([label, value]) => (
              <div key={label} className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-5 text-[13.5px]">
                <div className="sm:col-span-4 font-mono font-bold text-[#816729] uppercase text-[11.5px] tracking-wider">
                  {label}
                </div>
                <div className="sm:col-span-8 font-mono text-[#18181B] font-medium mt-1 sm:mt-0">
                  {value}
                </div>
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
