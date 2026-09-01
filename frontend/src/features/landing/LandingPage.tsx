import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import { VentrilocDashboard } from '../../components/site/VentrilocDashboard';
import { RiskCalculatorWidget } from './RiskCalculatorWidget';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';

const LOGOS = [
  'BOSCH', 'MAGNA', 'CONTINENTAL', 'SIEMENS', 'ZF GROUP',
  'VALEO', 'TATA MOTORS', 'MAHINDRA', 'ABB', 'SCHNEIDER', 'DENSO'
];

const SPECS: [string, string][] = [
  ['Standards', 'AIAG-VDA 2019 (Ed 1) · 21 CFR Part 11 · IATF 16949'],
  ['Documents', 'PFMEA · DFMEA · PFD · Control Plan (CP)'],
  ['AI Engine', 'Tenant-isolated RAG · OpenAI Embeddings · pgvector HNSW'],
  ['Database', 'PostgreSQL 15 + Neon Serverless · Row-Level Security (RLS)'],
  ['Security', 'JWT RS256 · RBAC 22 scopes · HMAC-SHA256 webhooks'],
  ['Deployment', 'Cloudflare Pages (Edge) + Render + Docker / Podman on-prem'],
  ['Storage', 'Cloudflare R2 / MinIO · 50MB evidence files · Pre-signed URLs'],
];

const INQUIRY_TYPES = ['Demo Request', 'Enterprise License', 'Quality Data Migration', 'General Inquiry'];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, guestLogin } = useAuth();

  const [showBanner, setShowBanner] = useState(true);
  const [guestLoading, setGuestLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', type: 'Demo Request', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleContactSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) return;
    setContactSubmitting(true);
    setContactError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error('Submission failed');
      setContactSuccess(true);
      setContactForm({ name: '', email: '', company: '', type: 'Demo Request', message: '' });
    } catch {
      setContactError('Could not send your message. Please try again later.');
    } finally {
      setContactSubmitting(false);
    }
  }, [contactForm]);

  const handlePrimaryCTA = async () => {
    if (token) { navigate('/app/projects'); return; }
    setGuestLoading(true);
    try {
      await guestLogin();
      navigate('/app/initializing');
    } catch (err) {
      console.error('Guest login failed:', err);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#202020] font-sans">
      <SEO
        title="FMEApex — Trusted Experts in AIAG-VDA 2019 Quality Intelligence & PFMEA"
        description="Turn your manufacturing quality data into a zero-defect growth engine with advanced AIAG-VDA 2019 FMEA, PFD linking, and 21 CFR Part 11 intelligence."
        canonical="/"
      />

      {/* ── Top News Announcement Banner ──────────────────────── */}
      {showBanner && (
        <aside
          aria-label="Release announcement"
          className="bg-[#202020] text-white py-2 px-4 text-[12px] border-b border-[#333338] relative z-40"
        >
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="px-2 py-0.5 rounded-full bg-[#FF682C] text-white font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
                Release v0.5.2
              </span>
              <p className="truncate text-[#E4E4E4]">
                <strong className="text-white font-semibold">Live:</strong> Shadcn Admin quality workspace, interactive Power BI studio & AIAG-VDA Excel export.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => navigate('/product')}
                className="text-[#FF682C] hover:text-white font-semibold underline underline-offset-4 transition-colors hidden sm:inline"
              >
                Learn what is new →
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="text-[#A1A1AA] hover:text-white text-[14px] leading-none"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── Sticky Clean SiteHeader ───────────────────────────── */}
      <SiteHeader />

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative pt-10 pb-16 lg:pt-14 lg:pb-24 px-4 sm:px-6 lg:px-8 bg-[#FAF9F6] border-b border-[#E4E4E4] overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#EBE6DD]/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-[#FF682C]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1440px] mx-auto grid lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBE6DD] border border-[#D4CFC4] text-[11px] font-mono font-bold text-[#816729] uppercase tracking-[0.12em] mb-5">
              <span>✦ AIAG-VDA 2019</span>
              <span className="text-[#A1A1AA]">•</span>
              <span>21 CFR Part 11</span>
            </div>

            <h1 className="text-[38px] sm:text-[52px] lg:text-[62px] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#202020] mb-5 ff-heading">
              Your Quality.<br />
              Our Analytics Expertise.<br />
              Powering Your{' '}
              <span className="text-[#FF682C]">Zero-Defect Growth</span>.
            </h1>

            <p className="text-[16px] sm:text-[17.5px] leading-[1.62] text-[#4D4D4D] max-w-[540px] mb-7 font-normal">
              FMEApex puts business intelligence, manufacturing data engineering, and AIAG-VDA expertise to work for your team. Unlocking the full potential of your quality lifecycle with human-in-the-loop AI and immutable compliance.
            </p>

            {/* Dual CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-8">
              <button
                onClick={handlePrimaryCTA}
                disabled={guestLoading}
                className="btn-ventriloc-primary h-[50px] px-8 text-[14.5px] tracking-wide flex items-center gap-2.5 shadow-md"
              >
                {guestLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  token ? 'Open Quality Workspace' : 'Start Free Preview'
                )}
                {!guestLoading && <span className="text-[16px]">→</span>}
              </button>

              <button
                onClick={() => navigate('/product')}
                className="btn-ventriloc-outline h-[50px] px-7 text-[14.5px]"
              >
                Explore Platform
              </button>
            </div>

            {/* Trust Metrics */}
            <div className="pt-5 border-t border-[#E4E4E4] grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="text-[20px] font-extrabold text-[#202020] font-mono">99.8%</div>
                <div className="text-[11.5px] text-[#828282] font-medium">Audit Pass Rate</div>
              </div>
              <div>
                <div className="text-[20px] font-extrabold text-[#FF682C] font-mono">&lt;120ms</div>
                <div className="text-[11.5px] text-[#828282] font-medium">Vector RAG Retrieval</div>
              </div>
              <div>
                <div className="text-[20px] font-extrabold text-[#816729] font-mono">100%</div>
                <div className="text-[11.5px] text-[#828282] font-medium">AIAG-VDA 7-Step Gating</div>
              </div>
            </div>
          </div>

          {/* Right Interactive Dashboard Canvas */}
          <div className="lg:col-span-6 reveal-2">
            <VentrilocDashboard />
          </div>
        </div>
      </section>

      {/* ── Infinite Partner Ticker ─────────────────────────────── */}
      <section className="py-8 bg-[#FFFFFF] border-b border-[#E4E4E4] overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 mb-3 flex items-center justify-between">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#828282] font-bold">
            <span className="text-[#816729]">Trusted by</span> 80+ global manufacturing leaders
          </p>
          <span className="text-[10.5px] font-mono text-[#A1A1AA] hidden sm:inline">Automotive & Aerospace Tier 1</span>
        </div>

        <div className="relative w-full overflow-hidden flex items-center">
          <div className="animate-ticker flex items-center gap-12 sm:gap-16 py-2">
            {[...LOGOS, ...LOGOS].map((brand, i) => (
              <span
                key={`${brand}-${i}`}
                className="text-[14px] sm:text-[16px] font-extrabold tracking-[0.16em] text-[#A1A1AA] hover:text-[#202020] transition-colors cursor-default whitespace-nowrap"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Quality Modules Section ────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F5F5F5]" id="solutions">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-[640px] mb-12">
            <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold mb-2">Our Core Modules</p>
            <h2 className="text-[34px] sm:text-[44px] font-extrabold tracking-[-0.03em] text-[#202020] ff-heading leading-[1.1]">
              Engineered for absolute quality adoption.
            </h2>
            <p className="mt-3 text-[16px] text-[#4D4D4D] leading-[1.6]">
              Every module is designed to be understood, adopted, and used daily on the shop floor and in engineering review rooms.
            </p>
          </div>

          {/* Clean Non-Overlapping Sequential Cards */}
          <div className="space-y-8">
            {/* Card 1: PFD ↔ PFMEA Sync */}
            <div className="bg-[#FFFFFF] border border-[#E4E4E4] rounded-[24px] p-6 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-10 h-1 bg-[#FF682C] rounded-full mb-4" />
                  <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#FF682C] font-bold">Module 01</span>
                  <h3 className="text-[26px] sm:text-[34px] font-extrabold text-[#202020] mt-1 mb-3 ff-heading">
                    Process Flow & Structure Analysis
                  </h3>
                  <div className="inline-block text-[12px] font-mono text-[#816729] font-bold bg-[#EBE6DD] px-3 py-1 rounded-md mb-4">
                    AIAG-VDA Step 2 & 3 · PFD ↔ PFMEA Bidirectional Sync
                  </div>
                  <p className="text-[15.5px] leading-[1.65] text-[#4D4D4D] mb-5">
                    We extract, map, and synchronize every manufacturing operation from your Process Flow Diagram directly into the PFMEA grid with zero data loss. Automatic orphan process detection prevents missing inspection gates.
                  </p>
                  <button
                    onClick={() => navigate('/product')}
                    className="inline-flex items-center gap-2 text-[13.5px] font-bold text-[#202020] hover:text-[#FF682C] transition-colors"
                  >
                    <span>Explore PFD ↔ PFMEA linking</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-[16px] bg-[#F9F9F8] border border-[#E4E4E4] p-5 font-mono text-[12px]">
                  <div className="text-[#816729] font-bold mb-3 uppercase tracking-wider text-[10.5px]">Process Synchronization Engine</div>
                  <div className="space-y-2.5">
                    <div className="p-3 bg-white rounded-lg border border-[#E4E4E4]">
                      <div className="flex justify-between items-center text-[#202020] font-bold text-[12.5px]">
                        <span>PFD Step 10: Automatic Bearing Press</span>
                        <span className="text-[#10B981] font-bold">SYNCED</span>
                      </div>
                      <div className="text-[#828282] text-[11px] mt-1">4M Allocation: Machine (Press-04) · Man (Operator 2)</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-[#E4E4E4]">
                      <div className="flex justify-between items-center text-[#202020] font-bold text-[12.5px]">
                        <span>PFMEA Row 10.1: Insufficient Press Force</span>
                        <span className="text-[#FF682C] font-bold">S=8 · O=3 · D=4</span>
                      </div>
                      <div className="text-[#828282] text-[11px] mt-1">Directly propagates to Control Plan Dimension Tolerances</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Risk & Action Priority */}
            <div className="bg-[#FFFFFF] border border-[#E4E4E4] rounded-[24px] p-6 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-10 h-1 bg-[#816729] rounded-full mb-4" />
                  <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#816729] font-bold">Module 02</span>
                  <h3 className="text-[26px] sm:text-[34px] font-extrabold text-[#202020] mt-1 mb-3 ff-heading">
                    Risk Visualization & Action Priority
                  </h3>
                  <div className="inline-block text-[12px] font-mono text-[#816729] font-bold bg-[#EBE6DD] px-3 py-1 rounded-md mb-4">
                    Deterministic AIAG-VDA AP (High, Medium, Low)
                  </div>
                  <p className="text-[15.5px] leading-[1.65] text-[#4D4D4D] mb-5">
                    Our methodology is design-driven: every visual is crafted with the quality engineer in mind, providing instant visual hierarchy over Severity, Occurrence, and Detection ratings. High-AP mandates trigger automated action tasks.
                  </p>
                  <button
                    onClick={() => navigate('/product')}
                    className="inline-flex items-center gap-2 text-[13.5px] font-bold text-[#202020] hover:text-[#816729] transition-colors"
                  >
                    <span>View Action Priority logic</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-[16px] bg-[#F9F9F8] border border-[#E4E4E4] p-5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#828282] font-bold mb-3">Live Matrix Evaluation</div>
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#EF4444]">High AP</span>
                      <div className="text-[15px] font-bold text-[#991B1B] mt-1">Mandatory</div>
                      <div className="text-[10px] text-[#DC2626] mt-0.5">Requires Closed-Loop Action</div>
                    </div>
                    <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#D97706]">Medium AP</span>
                      <div className="text-[15px] font-bold text-[#92400E] mt-1">Review</div>
                      <div className="text-[10px] text-[#B45309] mt-0.5">Engineering Discretion</div>
                    </div>
                    <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#059669]">Low AP</span>
                      <div className="text-[15px] font-bold text-[#065F46] mt-1">Acceptable</div>
                      <div className="text-[10px] text-[#047857] mt-0.5">Controls Verified</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: 21 CFR Part 11 Regulatory Governance */}
            <div className="bg-[#202020] text-white rounded-[24px] p-6 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-10 h-1 bg-[#FF682C] rounded-full mb-4" />
                  <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#FF682C] font-bold">Module 03</span>
                  <h3 className="text-[26px] sm:text-[34px] font-extrabold text-white mt-1 mb-3 ff-heading">
                    Regulatory Governance & 21 CFR Part 11
                  </h3>
                  <div className="inline-block text-[12px] font-mono text-[#E4E4E4] font-bold bg-[#333338] px-3 py-1 rounded-md mb-4 border border-[#44444C]">
                    Electronic Signatures · Reviewer Segregation · Immutable Audit Trail
                  </div>
                  <p className="text-[15.5px] leading-[1.65] text-[#A1A1AA] mb-5">
                    We establish strict regulatory controls, cryptographic digital signatures, and locked document revisions ensuring flawless regulatory inspection readiness. Database constraints reject any deletion on audit records.
                  </p>
                  <button
                    onClick={() => navigate('/learn/21-cfr-part-11-fmea')}
                    className="inline-flex items-center gap-2 text-[13.5px] font-bold text-white hover:text-[#FF682C] transition-colors"
                  >
                    <span>Read 21 CFR Part 11 specification</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-[16px] bg-[#18181B] border border-[#2E2E36] p-5 font-mono text-[11.5px] text-[#A1A1AA]">
                  <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-[#2E2E36] text-[10px] uppercase font-bold text-[#71717A]">
                    <span>Immutable Audit Trail Log</span>
                    <span className="text-[#10B981]">Active Partition</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white">
                      <span className="text-[#FF682C]">2026-09-01T08:14:05Z</span> • Rev C Approved by QA Director • Hash: e8046277
                    </div>
                    <div>
                      <span className="text-[#A1A1AA]">2026-09-01T08:02:14Z</span> • ACT-102 Evidence Uploaded (R2) • S=8, O=3, D=3
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: AI Quality Copilot & Data Agents */}
            <div className="bg-[#FFFFFF] border border-[#E4E4E4] rounded-[24px] p-6 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-10 h-1 bg-[#FF682C] rounded-full mb-4" />
                  <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#FF682C] font-bold">Module 04</span>
                  <h3 className="text-[26px] sm:text-[34px] font-extrabold text-[#202020] mt-1 mb-3 ff-heading">
                    AI Quality Copilot & Data Agents
                  </h3>
                  <div className="inline-block text-[12px] font-mono text-[#816729] font-bold bg-[#EBE6DD] px-3 py-1 rounded-md mb-4">
                    Tenant-Isolated RAG · Human-in-the-Loop Validation
                  </div>
                  <p className="text-[15.5px] leading-[1.65] text-[#4D4D4D] mb-5">
                    Our AI agents suggest failure modes, causes, and detection controls based strictly on your historical FMEA knowledge base. AI suggestions never overwrite live analysis rows without explicit engineering approval.
                  </p>
                  <button
                    onClick={() => navigate('/product')}
                    className="inline-flex items-center gap-2 text-[13.5px] font-bold text-[#202020] hover:text-[#FF682C] transition-colors"
                  >
                    <span>Discover AI Copilot architecture</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-[16px] bg-[#F9F9F8] border border-[#E4E4E4] p-5">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-[#FF682C] mb-2 uppercase">
                    <span>✦ AI Copilot Recommendation</span>
                  </div>
                  <div className="text-[12px] text-[#4D4D4D] mb-3">Based on 14 similar welding operations in database:</div>
                  <div className="p-3 bg-white rounded-lg border border-[#E4E4E4] text-[13px] font-semibold text-[#202020] mb-3">
                    Suggested Detection Control: High-frequency ultrasonic weld inspection
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 rounded bg-[#202020] text-white text-[11px] font-bold">Accept Suggestion</span>
                    <span className="px-2.5 py-1 rounded border border-[#E4E4E4] text-[#4D4D4D] text-[11px]">Modify</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Risk Simulator ──────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FFFFFF] border-b border-[#E4E4E4]" id="simulator">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-[620px] mx-auto mb-10">
            <span className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold">Interactive Tool</span>
            <h2 className="text-[32px] sm:text-[42px] font-extrabold tracking-[-0.03em] text-[#202020] mt-1.5 ff-heading">
              Simulate Action Priority in real-time
            </h2>
            <p className="mt-2.5 text-[15.5px] text-[#4D4D4D]">
              Adjust Severity, Occurrence, and Detection sliders to see how AIAG-VDA 2019 prioritizes corrective action tasks.
            </p>
          </div>

          <div className="max-w-[1000px] mx-auto">
            <RiskCalculatorWidget />
          </div>
        </div>
      </section>

      {/* ── Technical Specifications Bento ──────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF9F6] border-b border-[#E4E4E4]">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-8">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold">Engineering Specs</span>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold tracking-[-0.025em] text-[#202020] mt-1 ff-heading">
              Built for enterprise manufacturing scale
            </h2>
            <p className="mt-2 text-[15px] text-[#4D4D4D]">
              Engineered from day one with row-level tenant isolation, cryptographic audit trails, and zero spreadsheet dependencies.
            </p>
          </div>

          <div className="rounded-[16px] bg-white border border-[#E4E4E4] overflow-hidden shadow-sm">
            <div className="divide-y divide-[#E4E4E4]">
              {SPECS.map(([label, value]) => (
                <div key={label} className="grid grid-cols-1 sm:grid-cols-12 p-4 text-[13.5px] hover:bg-[#F9F9F8] transition-colors">
                  <div className="sm:col-span-3 font-mono font-bold text-[#816729] text-[11px] uppercase tracking-wider">
                    {label}
                  </div>
                  <div className="sm:col-span-9 font-mono text-[#202020] mt-1 sm:mt-0 font-medium">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact Section ─────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FFFFFF]" id="contact">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#FF682C] font-bold">Get In Touch</span>
              <h2 className="text-[34px] sm:text-[44px] font-extrabold tracking-[-0.03em] text-[#202020] mt-2 mb-4 ff-heading leading-[1.1]">
                Ready to talk about your next quality transformation?
              </h2>
              <p className="text-[16px] leading-[1.65] text-[#4D4D4D] mb-6">
                Whether you need an on-premise Docker deployment, migration from legacy spreadsheets, or a custom demo with your engineering team, our quality architects are ready.
              </p>
              <div className="space-y-2 text-[13px] font-mono text-[#828282]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>Response time SLA: <strong className="text-[#202020]">Within 4 business hours</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF682C]" />
                  <span>Direct email: <a href="mailto:quality@fmeapex.com" className="text-[#FF682C] font-bold hover:underline">quality@fmeapex.com</a></span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#FAF9F6] border border-[#E4E4E4] rounded-[20px] p-6 sm:p-8">
              {contactSuccess ? (
                <div className="p-8 text-center bg-white rounded-xl border border-[#A7F3D0]">
                  <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto mb-4 text-[20px]">✓</div>
                  <h3 className="text-[20px] font-bold text-[#202020] mb-2">Message received</h3>
                  <p className="text-[14px] text-[#4D4D4D]">Thank you for reaching out. A quality engineer will get in touch with you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {contactError && (
                    <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[13px] rounded-lg">
                      {contactError}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#828282] font-bold mb-1.5">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Jane Doe"
                        className="w-full h-[44px] px-3.5 rounded-lg bg-white border border-[#E4E4E4] text-[14px] text-[#202020] focus:outline-none focus:border-[#202020]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#828282] font-bold mb-1.5">Corporate Email</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="jane@manufacturer.com"
                        className="w-full h-[44px] px-3.5 rounded-lg bg-white border border-[#E4E4E4] text-[14px] text-[#202020] focus:outline-none focus:border-[#202020]"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#828282] font-bold mb-1.5">Company / Plant</label>
                      <input
                        type="text"
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        placeholder="Continental Plant 4"
                        className="w-full h-[44px] px-3.5 rounded-lg bg-white border border-[#E4E4E4] text-[14px] text-[#202020] focus:outline-none focus:border-[#202020]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#828282] font-bold mb-1.5">Inquiry Type</label>
                      <select
                        value={contactForm.type}
                        onChange={(e) => setContactForm({ ...contactForm, type: e.target.value })}
                        className="w-full h-[44px] px-3.5 rounded-lg bg-white border border-[#E4E4E4] text-[14px] text-[#202020] focus:outline-none focus:border-[#202020]"
                      >
                        {INQUIRY_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#828282] font-bold mb-1.5">Project Details / Goals</label>
                    <textarea
                      rows={3}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Tell us about your production lines, current FMEA tools, or migration requirements..."
                      className="w-full p-3.5 rounded-lg bg-white border border-[#E4E4E4] text-[14px] text-[#202020] focus:outline-none focus:border-[#202020]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full btn-ventriloc-primary h-[48px] text-[14px] font-bold shadow-sm"
                  >
                    {contactSubmitting ? 'Sending...' : 'Send Message →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  );
};

export default LandingPage;
