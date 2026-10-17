import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import { VentrilocDashboard } from '../../components/site/VentrilocDashboard';
import {
  Layers,
  GitBranch,
  ShieldCheck,
  Cpu,
  FileSpreadsheet,
  Lock,
  ArrowRight,
  CheckCircle2,
  Server
} from 'lucide-react';

const ENGINES = [
  {
    icon: Layers,
    title: '7-Step AIAG-VDA Authoring Engine',
    tag: 'Core Methodology',
    desc: 'Full enforcement of the AIAG-VDA 2019 handbook: Structure → Function → Failure → Risk → Optimization → Documentation. Hard gating prevents phase skipping.',
    details: ['Structural 4M decomposition (Machine, Man, Material, Method)', 'Deterministic Action Priority (AP) calculation', 'Severity inheritance from worst-case customer effect'],
  },
  {
    icon: GitBranch,
    title: 'PFD ↔ PFMEA Bidirectional Sync',
    tag: 'Sync Architecture',
    desc: 'Extract, map, and synchronize every manufacturing operation from your Process Flow Diagram directly into the PFMEA grid with zero data loss.',
    details: ['Real-time orphan operation detection & coverage warnings', '4M allocation directly attached to PFD sequence', 'Special characteristic flow-down from DFMEA to shop floor'],
  },
  {
    icon: FileSpreadsheet,
    title: 'Dynamic Control Plan (CP) Compiler',
    tag: 'Shop Floor Bridge',
    desc: 'Control Plans are dynamically generated from FMEA controls and characteristics. Editing a tolerance or sample frequency propagates bidirectionally.',
    details: ['Pre-launch, Prototype, and Production Control Plans', 'Classification of Critical (CC) and Significant (SC) features', 'Reaction plan linkages for out-of-control conditions'],
  },
  {
    icon: ShieldCheck,
    title: 'Closed-Loop Corrective Action Lifecycle',
    tag: 'Action Priority Optimization',
    desc: 'Mandatory corrective action workflows triggered for all High-AP evaluation rows. Actions track responsible CFT owners, target dates, and evidence.',
    details: ['Transition lifecycle: Open → InProgress → Completed → Verified → Closed', 'Mandatory Cloudflare R2 evidence file upload (50MB limit)', 'Before vs. After S/O/D ratings and AP recalculation'],
  },
  {
    icon: Lock,
    title: '21 CFR Part 11 Regulatory Suite',
    tag: 'Compliance & Audit',
    desc: 'Establish strict regulatory controls, cryptographic digital signatures, and locked document revisions ensuring flawless regulatory inspection readiness.',
    details: ['Cryptographic SHA-256 digital signatures with typed meaning', 'Reviewer segregation (author cannot review or approve own work)', 'PostgreSQL immutable audit log partition rejecting UPDATE/DELETE'],
  },
  {
    icon: Cpu,
    title: 'Tenant-Isolated Vector RAG Copilot',
    tag: 'Engineering Intelligence',
    desc: 'AI copilot suggests failure modes, causes, and detection controls based strictly on your historical FMEA knowledge base. Never modifies data without approval.',
    details: ['Neon pgvector HNSW indexing strictly filtered by tenantId', 'Human-in-the-loop review (proposed → accepted / rejected)', 'Automatic 30-day suggestion expiration to prevent stale data'],
  },
];

const ARCHITECTURE_SPECS: [string, string, string][] = [
  ['Standards Compliance', 'Methodology', 'AIAG-VDA 2019 (1st Edition) · 21 CFR Part 11 · IATF 16949 · ISO 9001'],
  ['Document Types', 'Coverage', 'PFMEA · DFMEA · Process Flow Diagrams (PFD) · Control Plans (CP)'],
  ['Database Isolation', 'Security', 'PostgreSQL 15 Serverless · Strict Row-Level Security (RLS) session variables'],
  ['Vector RAG Engine', 'AI Pipeline', 'Tenant-isolated RAG · OpenAI Embeddings · Neon pgvector HNSW (M=16, ef=64)'],
  ['Authentication & RBAC', 'Access Control', 'RS256 JWT tokens · 22 granular role scopes · JIT provisioning'],
  ['Evidence Storage', 'Storage', 'Cloudflare R2 / S3-compatible · Pre-signed upload URLs · 50MB file size limit'],
  ['Deployment Targets', 'DevOps', 'Cloudflare Pages Edge + Managed Render + Docker / Podman on-premises'],
];

export const ProductPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FBFBFC] min-h-screen text-slate-900 font-sans antialiased selection:bg-[#FF5500]/20 selection:text-slate-900">
      <SEO
        title="Product Architecture — FMEApex | Deterministic AIAG-VDA Quality OS"
        description="Explore the 6 core engines of FMEApex: 7-step FMEA authoring, PFD-PFMEA linking, Control Plan auto-flow, 21 CFR Part 11 compliance, and RLS tenant isolation."
        canonical="/product"
      />
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-tech-dots border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto">
          <div className="max-w-[840px] mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-xs mb-6">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>Platform Deep Dive</span>
              <span className="text-slate-300">•</span>
              <span>Six Connected Modules</span>
            </div>

            <h1 className="text-[38px] sm:text-[54px] font-extrabold leading-[1.06] tracking-[-0.035em] text-slate-900 mb-6 ff-heading">
              A unified FMEA operating system,<br />
              <span className="text-[#FF5500]">not another fragile spreadsheet.</span>
            </h1>

            <p className="text-[17px] sm:text-[20px] leading-[1.6] text-slate-600 max-w-[700px] mb-8 font-normal">
              Six connected quality engines—PFD, PFMEA, DFMEA, Control Plan, Corrective Actions, and a Vector RAG Copilot—operating inside a tenant-isolated, audit-locked database.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => navigate('/login')}
                className="h-12 px-7 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[14.5px] font-semibold transition-all shadow-md flex items-center gap-2"
              >
                <span>Launch Interactive Sandbox</span>
                <ArrowRight className="w-4 h-4 text-[#FF5500]" />
              </button>

              <button
                onClick={() => navigate('/#contact')}
                className="h-12 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[14.5px] font-semibold transition-all shadow-xs"
              >
                Schedule Technical Architecture Review
              </button>
            </div>
          </div>

          {/* Interactive Live Studio Preview Canvas */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-800 shadow-[0_20px_60px_rgba(15,23,42,0.18)] overflow-hidden">
            <VentrilocDashboard />
          </div>
        </div>
      </section>

      {/* Six Core Engineering Engines */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto">
          <div className="max-w-[720px] mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
              <Cpu className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Platform Modules</span>
            </div>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-tight text-slate-900 leading-[1.08] ff-heading">
              Engineered for Manufacturing Rigor.
            </h2>
            <p className="mt-3 text-[16px] text-slate-600 leading-relaxed">
              Every engine enforces domain constraints defined in the AIAG-VDA 2019 standard, preventing the data drift and orphan steps that plague disconnected files.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ENGINES.map((engine) => {
              const Icon = engine.icon;
              return (
                <div
                  key={engine.title}
                  className="rounded-2xl bg-[#FBFBFC] border border-slate-200 p-7 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs">
                        <Icon className="w-5 h-5 text-[#FF5500]" />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-slate-200/60 px-2.5 py-0.5 rounded">
                        {engine.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {engine.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed mb-5">
                      {engine.desc}
                    </p>

                    <div className="space-y-2 border-t border-slate-200/80 pt-4">
                      {engine.details.map((detail) => (
                        <div key={detail} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FBFBFC]">
        <div className="max-w-[1320px] mx-auto">
          <div className="max-w-[720px] mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-200 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
              <Server className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Full Stack Specifications</span>
            </div>
            <h2 className="text-[32px] sm:text-[42px] font-extrabold tracking-tight text-slate-900 ff-heading">
              Enterprise Technical Specifications
            </h2>
            <p className="mt-2 text-[15.5px] text-slate-600">
              Deterministic architectures designed for multi-tenant isolation, air-gapped on-premises deployments, and zero spreadsheet vulnerabilities.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-200 overflow-hidden shadow-xs">
            {ARCHITECTURE_SPECS.map(([label, category, value]) => (
              <div key={label} className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-5 text-sm items-center hover:bg-slate-50/60 transition-colors">
                <div className="sm:col-span-4 font-mono font-bold text-slate-900 text-[13px]">
                  {label}
                </div>
                <div className="sm:col-span-2 text-xs font-mono text-[#FF5500] font-bold uppercase mt-1 sm:mt-0">
                  {category}
                </div>
                <div className="sm:col-span-6 font-mono text-slate-600 text-xs sm:text-sm mt-1 sm:mt-0">
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
