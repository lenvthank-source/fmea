import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import {
  Check,
  X,
  ArrowRight,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';

interface CompetitorData {
  competitor: string;
  slug: string;
  seoTitle: string;
  seoDesc: string;
  headline: string;
  summary: string;
  matrix: { feature: string; fmeapex: boolean | string; competitor: boolean | string; detail: string }[];
}

const COMPARISONS: Record<string, CompetitorData> = {
  'excel-fmea': {
    competitor: 'Microsoft Excel',
    slug: 'excel-fmea',
    seoTitle: 'FMEApex vs Excel: Why Modern FMEA Belongs Off Spreadsheets',
    seoDesc: 'Compare FMEApex vs Microsoft Excel for FMEA management. Eliminate broken links, manual S/O/D scoring, and un-audited revisions.',
    headline: 'FMEApex vs Excel: Why Quality Leaders Are Retiring Spreadsheets',
    summary: 'Excel templates seem convenient initially, but lead to broken nested formulas, forgotten process steps, and catastrophic audit failures. FMEApex provides a deterministic, relational quality operating system.',
    matrix: [
      { feature: 'AIAG-VDA 7-Step Guided Gating', fmeapex: true, competitor: false, detail: 'Prerequisite steps must complete before revision progression.' },
      { feature: 'PFD ↔ PFMEA Bidirectional Linking', fmeapex: true, competitor: 'Manual Copy/Paste', detail: 'Modifications propagate instantly with orphan detection.' },
      { feature: 'Deterministic AP Table Engine', fmeapex: true, competitor: 'Fragile IF Formulas', detail: 'Standardized AIAG-VDA lookup locked at database level.' },
      { feature: 'Dynamic Control Plan Synchronization', fmeapex: true, competitor: false, detail: 'Tolerance edits propagate bidirectionally in serializable transactions.' },
      { feature: '21 CFR Part 11 Audit Trail & Signatures', fmeapex: true, competitor: false, detail: 'Cryptographic SHA-256 digital signatures with immutable audit log.' },
      { feature: 'Tenant-Isolated Vector RAG Copilot', fmeapex: true, competitor: false, detail: 'AI suggestions retrieved strictly from approved past revisions.' },
      { feature: 'Multi-User Concurrent Authoring', fmeapex: true, competitor: 'File Lock Conflicts', detail: 'Cloud and on-prem concurrency with PostgreSQL RLS data security.' },
    ],
  },
  'iq-rm': {
    competitor: 'APIS IQ-RM',
    slug: 'iq-rm',
    seoTitle: 'FMEApex vs APIS IQ-RM: Modern Cloud FMEA Platform Comparison',
    seoDesc: 'Compare FMEApex vs APIS IQ-RM. Modern web UI, cloud multi-tenancy, instant AI copilot suggestions vs legacy desktop installation.',
    headline: 'FMEApex vs APIS IQ-RM: Modern Cloud Simplicity vs 90s Desktop Bloat',
    summary: 'APIS IQ-RM is a complex desktop tool requiring expensive workstation licenses and weeks of specialized training. FMEApex delivers full AIAG-VDA 2019 compliance in a modern browser with zero friction.',
    matrix: [
      { feature: 'Cloud-Native Web Access (Zero Install)', fmeapex: true, competitor: false, detail: 'Run anywhere in Chrome/Firefox without IT workstation deployment.' },
      { feature: 'Modern Intuitive Interface', fmeapex: true, competitor: 'Complex Windows GUI', detail: 'Engineers get up to speed in minutes rather than weeks of certification.' },
      { feature: 'Automated Control Plan Auto-Flow', fmeapex: true, competitor: 'Complex Module Setup', detail: 'Dynamic compilation directly from PFMEA characteristics and controls.' },
      { feature: 'Tenant-Isolated Vector RAG Copilot', fmeapex: true, competitor: false, detail: 'Semantic failure and detection suggestions from past audits.' },
      { feature: 'Air-Gapped Docker Deployment Option', fmeapex: true, competitor: 'Dongle / Local License', detail: 'Single Docker Compose bundle for enterprise corporate firewalls.' },
      { feature: 'Transparent Cloud & On-Prem Pricing', fmeapex: true, competitor: 'Opaque Quote Requests', detail: 'Honest per-seat and site licenses with free instant guest sandbox.' },
    ],
  },
};

export const CompetitorVsPage: React.FC = () => {
  const { competitor = 'excel-fmea' } = useParams<{ competitor: string }>();
  const navigate = useNavigate();
  const data = COMPARISONS[competitor] || COMPARISONS['excel-fmea'];

  return (
    <div className="bg-[#FBFBFC] min-h-screen text-slate-900 font-sans antialiased selection:bg-[#FF5500]/20 selection:text-slate-900">
      <SEO
        title={data.seoTitle}
        description={data.seoDesc}
        canonical={`/vs/${competitor}`}
      />
      <SiteHeader />

      {/* Hero Header */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-tech-dots border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-6">
            <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/#workflow" className="hover:text-slate-900 transition-colors">Comparisons</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">vs {data.competitor}</span>
          </div>

          <div className="max-w-[880px]">
            {/* Pill Capsule */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-xs mb-6">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>Platform Benchmark</span>
              <span className="text-slate-300">•</span>
              <span>FMEApex vs {data.competitor}</span>
            </div>

            <h1 className="text-[34px] sm:text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-slate-900 mb-5 ff-heading">
              {data.headline}
            </h1>

            <p className="text-[17px] sm:text-[19px] leading-[1.6] text-slate-600 mb-8 font-normal">
              {data.summary}
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => navigate('/login')}
                className="h-12 px-7 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[14.5px] font-semibold transition-all shadow-md flex items-center gap-2"
              >
                <span>Launch Free Sandbox</span>
                <ArrowRight className="w-4 h-4 text-[#FF5500]" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('matrix');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-12 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[14.5px] font-semibold transition-all shadow-xs"
              >
                Inspect Comparison Matrix
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Competitor Switcher Tabs */}
      <section className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-[1320px] mx-auto flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-slate-400 font-bold uppercase tracking-wider mr-2 hidden sm:inline">
            Compare With:
          </span>
          {Object.values(COMPARISONS).map((comp) => (
            <Link
              key={comp.slug}
              to={`/vs/${comp.slug}`}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                comp.slug === competitor
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              vs {comp.competitor}
            </Link>
          ))}
        </div>
      </section>

      {/* Comparison Matrix Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8" id="matrix">
        <div className="max-w-[1320px] mx-auto">
          <div className="max-w-[720px] mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-200 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Architectural Rigor</span>
            </div>
            <h2 className="text-[28px] sm:text-[38px] font-extrabold text-slate-900 tracking-tight leading-tight ff-heading">
              Detailed Feature & Architecture Matrix
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Examine how FMEApex solves data integrity, auditability, and team collaboration issues present in {data.competitor}.
            </p>
          </div>

          {/* Precision Comparison Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="grid grid-cols-12 bg-slate-900 text-white p-4 sm:p-5 text-xs font-mono font-bold uppercase tracking-wider">
              <div className="col-span-12 sm:col-span-5">Capability / Requirement</div>
              <div className="col-span-6 sm:col-span-4 text-emerald-400 flex items-center gap-1.5 mt-2 sm:mt-0">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>FMEApex Quality OS</span>
              </div>
              <div className="col-span-6 sm:col-span-3 text-slate-400 flex items-center gap-1.5 mt-2 sm:mt-0">
                <X className="w-4 h-4 text-rose-400" />
                <span>{data.competitor}</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {data.matrix.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 p-4 sm:p-5 text-sm items-start hover:bg-slate-50/70 transition-colors"
                >
                  <div className="col-span-12 sm:col-span-5 pr-4 mb-2 sm:mb-0">
                    <div className="font-bold text-slate-900">{row.feature}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{row.detail}</div>
                  </div>

                  <div className="col-span-6 sm:col-span-4 pr-3">
                    <span className="sm:hidden font-mono text-[10px] uppercase text-emerald-600 font-bold block mb-0.5">
                      FMEApex:
                    </span>
                    {typeof row.fmeapex === 'boolean' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs font-bold border border-emerald-200">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Supported
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 font-medium text-xs border border-emerald-200">
                        {row.fmeapex}
                      </span>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <span className="sm:hidden font-mono text-[10px] uppercase text-slate-500 font-bold block mb-0.5">
                      {data.competitor}:
                    </span>
                    {typeof row.competitor === 'boolean' ? (
                      row.competitor ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Supported
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono text-xs font-bold border border-rose-200">
                          <X className="w-3.5 h-3.5 text-rose-500" />
                          Missing
                        </span>
                      )
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200">
                        {row.competitor}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Conversion Tile */}
          <div className="mt-12 p-8 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div>
              <h3 className="text-xl font-bold">Ready to modernize your quality workflows?</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-[600px]">
                Import your existing Excel files directly using our guided column mapper, or test the live platform in our free sandbox.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-6 h-12 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-semibold text-sm transition-all shadow-md shrink-0 flex items-center gap-2"
            >
              <span>Switch to FMEApex Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default CompetitorVsPage;
