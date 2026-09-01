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
    <div className="min-h-screen bg-[#FDFCFB] text-[#202020] font-sans">
      <SEO
        title="FMEApex — Trusted Experts in AIAG-VDA 2019 Quality Intelligence & PFMEA"
        description="Turn your manufacturing quality data into a zero-defect growth engine with advanced AIAG-VDA 2019 FMEA, PFD linking, and 21 CFR Part 11 intelligence."
        canonical="/"
      />

      {/* ── Ventriloc-Styled News Announcement Banner ──────────── */}
      {showBanner && (
        <aside
          aria-label="Release announcement"
          className="bg-[#202020] text-white py-2.5 px-4 text-[12.5px] border-b border-[#333338] sticky top-0 z-50 transition-all"
        >
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="px-2 py-0.5 rounded-full bg-[#FF682C] text-white font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
                News
              </span>
              <p className="truncate text-[#E4E4E4]">
                <strong className="text-white font-semibold">Release v0.5.1 Live:</strong> Rebuilt Failure Details window, Safe Launch hierarchy & AIAG-VDA Excel auto-merging.
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

      <SiteHeader />

      {/* ── Ventriloc-Style Hero Section (pb-row-hero) ──────────── */}
      <section className="relative pt-[120px] lg:pt-[150px] pb-20 px-5 sm:px-8 lg:px-12 bg-[#FAF9F6] border-b border-[#E4E4E4] overflow-hidden">
        {/* Subtle Background Geometry */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#EBE6DD]/60 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#FF682C]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1440px] mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 reveal">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBE6DD] border border-[#D4CFC4] text-[11.5px] font-mono font-bold text-[#816729] uppercase tracking-[0.12em] mb-6">
              <span>✦ AIAG-VDA 2019</span>
              <span className="text-[#A1A1AA]">•</span>
              <span>21 CFR Part 11</span>
            </div>

            <h1 className="text-[44px] sm:text-[58px] lg:text-[68px] font-extrabold leading-[1.02] tracking-[-0.035em] text-[#202020] mb-6 ff-heading">
              Your Quality.<br />
              Our Analytics Expertise.<br />
              Powering Your{' '}
              <span className="title-highlight font-extrabold">
                Zero-Defect Growth
                <span className="title-highlight__underline" />
              </span>.
            </h1>

            <p className="text-[17px] sm:text-[18px] leading-[1.62] text-[#4D4D4D] max-w-[540px] mb-8 font-normal">
              FMEApex puts business intelligence, manufacturing data engineering, and AIAG-VDA expertise to work for your team. Unlocking the full potential of your quality lifecycle with human-in-the-loop AI and immutable compliance.
            </p>

            {/* Dual CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={handlePrimaryCTA}
                disabled={guestLoading}
                className="btn-ventriloc-primary h-[52px] px-8 text-[15px] tracking-wide flex items-center gap-2.5 shadow-md"
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
                className="btn-ventriloc-outline h-[52px] px-8 text-[15px]"
              >
                Explore Platform
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-[#E4E4E4] grid grid-cols-3 gap-4 text-left">
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

      {/* ── Ventriloc-Style Infinite Partner Ticker ─────────────── */}
      <section className="py-10 bg-[#FFFFFF] border-b border-[#E4E4E4] overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 mb-4 flex items-center justify-between">
          <p className="text-[12px] font-mono uppercase tracking-[0.14em] text-[#828282] font-bold">
            <span className="title-highlight text-[#816729]">Trusted by</span> 80+ global manufacturing leaders
          </p>
          <span className="text-[11px] font-mono text-[#A1A1AA] hidden sm:inline">Automotive & Aerospace Tier 1</span>
        </div>

        <div className="relative w-full overflow-hidden flex items-center">
          <div className="animate-ticker flex items-center gap-12 sm:gap-16 py-2">
            {[...LOGOS, ...LOGOS].map((brand, i) => (
              <span
                key={`${brand}-${i}`}
                className="text-[15px] sm:text-[17px] font-extrabold tracking-[0.16em] text-[#A1A1AA] hover:text-[#202020] transition-colors cursor-default whitespace-nowrap"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ventriloc-Style Stacked Sticky Cards (pb-row-services) ── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 bg-[#F5F5F5]" id="solutions">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-[620px] mb-16">
            <p className="text-[12px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold mb-3">Our Core Modules</p>
            <h2 className="text-[38px] sm:text-[48px] font-extrabold tracking-[-0.03em] text-[#202020] ff-heading leading-[1.08]">
              Engineered for absolute quality adoption.
            </h2>
            <p className="mt-4 text-[17px] text-[#4D4D4D] leading-[1.6]">
              Every module is designed to be understood, adopted, and used daily on the shop floor and in engineering review rooms.
            </p>
          </div>

          {/* Stacked Cards Container */}
          <div className="space-y-12">
            {/* Card 1: PFD ↔ PFMEA Sync */}
            <div className="sticky-stack-card bg-[#FFFFFF] border border-[#E4E4E4] p-8 sm:p-12 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)]">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-12 h-1.5 bg-[#FF682C] rounded-full mb-6" />
                  <span className="text-[12px] font-mono uppercase tracking-[0.12em] text-[#FF682C] font-bold">Module 01</span>
                  <h3 className="text-[30px] sm:text-[38px] font-extrabold text-[#202020] mt-1 mb-4 ff-heading">
                    Process Flow & Structure Analysis
                  </h3>
                  <div className="inline-block text-[13px] font-mono text-[#816729] font-bold bg-[#EBE6DD] px-3 py-1 rounded-md mb-4">
                    AIAG-VDA Step 2 & 3 · PFD ↔ PFMEA Bidirectional Sync
                  </div>
                  <p className="text-[16px] leading-[1.65] text-[#4D4D4D] mb-6">
                    We extract, map, and synchronize every manufacturing operation from your Process Flow Diagram directly into the PFMEA grid with zero data loss. Automatic orphan process detection prevents missing inspection gates.
                  </p>
                  <button
                    onClick={() => navigate('/product')}
                    className="inline-flex items-center gap-2 text-[14px] font-bold text-[#202020] hover:text-[#FF682C] transition-colors"
                  >
                    <span>Explore PFD ↔ PFMEA linking</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-[18px] bg-[#F5F5F5] border border-[#E4E4E4] p-6 font-mono text-[12px]">
                  <div className="text-[#816729] font-bold mb-3 uppercase tracking-wider text-[11px]">Process Synchronization Engine</div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-lg border border-[#E4E4E4]">
                      <div className="flex justify-between items-center text-[#202020] font-bold">
                        <span>PFD Step 10: Automatic Bearing Press</span>
                        <span className="text-[#10B981]">SYNCED</span>
                      </div>
                      <div className="text-[#828282] text-[11px] mt-1">4M Allocation: Machine (Press-04) · Man (Operator 2)</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-[#E4E4E4]">
                      <div className="flex justify-between items-center text-[#202020] font-bold">
                        <span>PFMEA Row 10.1: Insufficient Press Force</span>
                        <span className="text-[#FF682C]">S=8 · O=3 · D=4</span>
                      </div>
                      <div className="text-[#828282] text-[11px] mt-1">Directly propagates to Control Plan Dimension Tolerances</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Risk & Action Priority */}
            <div className="sticky-stack-card bg-[#FAF9F6] border border-[#E4E4E4] p-8 sm:p-12 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)]">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-12 h-1.5 bg-[#816729] rounded-full mb-6" />
                  <span className="text-[12px] font-mono uppercase tracking-[0.12em] text-[#816729] font-bold">Module 02</span>
                  <h3 className="text-[30px] sm:text-[38px] font-extrabold text-[#202020] mt-1 mb-4 ff-heading">
                    Risk Visualization & Action Priority
                  </h3>
                  <div className="inline-block text-[13px] font-mono text-[#816729] font-bold bg-[#EBE6DD] px-3 py-1 rounded-md mb-4">
                    Deterministic AIAG-VDA AP (High, Medium, Low)
                  </div>
                  <p className="text-[16px] leading-[1.65] text-[#4D4D4D] mb-6">
                    Our methodology is design-driven: every visual is crafted with the quality engineer in mind, providing instant visual hierarchy over Severity, Occurrence, and Detection ratings. High-AP mandates trigger automated action tasks.
                  </p>
                  <button
                    onClick={() => navigate('/product')}
                    className="inline-flex items-center gap-2 text-[14px] font-bold text-[#202020] hover:text-[#816729] transition-colors"
                  >
                    <span>View Action Priority logic</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-[18px] bg-white border border-[#E4E4E4] p-6">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#816729] font-bold mb-4">Live Matrix Derivation</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5]/60">
                      <div className="text-[11px] font-bold text-[#EF4444] uppercase">High AP</div>
                      <div className="text-[24px] font-extrabold text-[#B91C1C] my-1">Mandatory</div>
                      <div className="text-[11px] text-[#7F1D1D]">Requires Closed-Loop Action</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                      <div className="text-[11px] font-bold text-[#D97706] uppercase">Medium AP</div>
                      <div className="text-[24px] font-extrabold text-[#B45309] my-1">Review</div>
                      <div className="text-[11px] text-[#92400E]">Engineering Discretion</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                      <div className="text-[11px] font-bold text-[#16A34A] uppercase">Low AP</div>
                      <div className="text-[24px] font-extrabold text-[#15803D] my-1">Acceptable</div>
                      <div className="text-[11px] text-[#166534]">Controls Verified</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: 21 CFR Part 11 & Governance */}
            <div className="sticky-stack-card bg-[#202020] text-white border border-[#333338] p-8 sm:p-12 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-12 h-1.5 bg-[#10B981] rounded-full mb-6" />
                  <span className="text-[12px] font-mono uppercase tracking-[0.12em] text-[#10B981] font-bold">Module 03</span>
                  <h3 className="text-[30px] sm:text-[38px] font-extrabold text-white mt-1 mb-4 ff-heading">
                    Regulatory Governance & 21 CFR Part 11
                  </h3>
                  <div className="inline-block text-[13px] font-mono text-[#38BDF8] font-bold bg-[#18181C] px-3 py-1 rounded-md mb-4 border border-[#2E2E36]">
                    Electronic Signatures · Reviewer Segregation · Immutable Audit Trail
                  </div>
                  <p className="text-[16px] leading-[1.65] text-[#A1A1AA] mb-6">
                    We establish strict regulatory controls, cryptographic digital signatures, and locked document revisions ensuring flawless regulatory inspection readiness. Database constraints reject any deletion on audit records.
                  </p>
                  <button
                    onClick={() => navigate('/learn/21-cfr-part-11-fmea')}
                    className="inline-flex items-center gap-2 text-[14px] font-bold text-white hover:text-[#10B981] transition-colors"
                  >
                    <span>Read 21 CFR Part 11 specification</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-[18px] bg-[#141416] border border-[#2E2E36] p-6 font-mono text-[12px]">
                  <div className="flex items-center justify-between text-[#10B981] text-[11px] mb-3">
                    <span>DIGITAL AUDIT TRAIL LOG</span>
                    <span>ACTIVE PARTITION</span>
                  </div>
                  <div className="space-y-2 text-[#D4D4D8]">
                    <div className="p-2.5 rounded bg-[#1C1C20] border border-[#2A2A30]">
                      <span className="text-[#816729]">2026-09-01T00:14:05Z</span> &bull; Rev C Approved by QA Director &bull; Hash: e00f6377
                    </div>
                    <div className="p-2.5 rounded bg-[#1C1C20] border border-[#2A2A30]">
                      <span className="text-[#816729]">2026-09-01T00:08:14Z</span> &bull; ACT-102 Evidence Uploaded (R2) &bull; S=9 &rarr; S=9, O=1
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: AI Decision Copilot */}
            <div className="sticky-stack-card bg-[#FFFFFF] border border-[#E4E4E4] p-8 sm:p-12 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)]">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-12 h-1.5 bg-[#863B32] rounded-full mb-6" />
                  <span className="text-[12px] font-mono uppercase tracking-[0.12em] text-[#863B32] font-bold">Module 04</span>
                  <h3 className="text-[30px] sm:text-[38px] font-extrabold text-[#202020] mt-1 mb-4 ff-heading">
                    AI Quality Copilot & Data Agents
                  </h3>
                  <div className="inline-block text-[13px] font-mono text-[#863B32] font-bold bg-[#FDF2F0] px-3 py-1 rounded-md mb-4 border border-[#F5D5D0]">
                    Tenant-Isolated RAG · Human-in-the-Loop Validation
                  </div>
                  <p className="text-[16px] leading-[1.65] text-[#4D4D4D] mb-6">
                    Our AI agents suggest failure modes, causes, and detection controls based strictly on your historical FMEA knowledge base. AI suggestions never overwrite live analysis rows without explicit engineering approval.
                  </p>
                  <button
                    onClick={() => navigate('/product')}
                    className="inline-flex items-center gap-2 text-[14px] font-bold text-[#202020] hover:text-[#863B32] transition-colors"
                  >
                    <span>Discover AI Copilot architecture</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-[18px] bg-[#FBF9F7] border border-[#EBE6DD] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-[#FF682C] animate-pulse" />
                    <span className="text-[11.5px] font-mono text-[#202020] font-bold uppercase">AI Copilot Recommendation</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#E4E4E4] shadow-sm text-[13px]">
                    <div className="text-[11px] text-[#828282] font-mono">Based on 14 similar welding operations in database</div>
                    <div className="font-bold text-[#202020] mt-1">Suggested Detection Control: High-frequency ultrasonic weld inspection</div>
                    <div className="mt-3 flex gap-2">
                      <button className="px-3 py-1 rounded-full bg-[#202020] text-white text-[11px] font-bold">Accept Suggestion</button>
                      <button className="px-3 py-1 rounded-full border border-[#D4D4D8] text-[11px] font-medium">Modify</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Risk Priority Decision Simulator ─────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12 bg-[#FFFFFF] border-b border-[#E4E4E4]" id="calculator">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-[600px] mx-auto mb-14">
            <span className="text-[12px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold">Interactive Tool</span>
            <h2 className="text-[34px] sm:text-[44px] font-extrabold tracking-[-0.03em] text-[#202020] ff-heading mt-2">
              Simulate Action Priority in real-time
            </h2>
            <p className="mt-3 text-[16px] text-[#4D4D4D]">
              Adjust Severity, Occurrence, and Detection sliders to see how AIAG-VDA 2019 prioritizes corrective action tasks.
            </p>
          </div>

          <RiskCalculatorWidget />
        </div>
      </section>

      {/* ── Technical Specifications Bento ─────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12 bg-[#FAF9F6] border-b border-[#E4E4E4]" id="specs">
        <div className="max-w-[920px] mx-auto">
          <span className="text-[12px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold">Engineering Specs</span>
          <h2 className="text-[34px] sm:text-[42px] font-extrabold tracking-[-0.03em] text-[#202020] ff-heading mt-2 mb-4">
            Built for enterprise manufacturing scale
          </h2>
          <p className="text-[16px] text-[#4D4D4D] mb-10">
            Engineered from day one with row-level tenant isolation, cryptographic audit trails, and zero spreadsheet dependencies.
          </p>

          <div className="rounded-[20px] border border-[#E4E4E4] bg-white overflow-hidden divide-y divide-[#E4E4E4] shadow-sm">
            {SPECS.map(([k, v]) => (
              <div key={k} className="grid sm:grid-cols-[240px_1fr] px-6 py-4 items-center hover:bg-[#FDFCFB] transition-colors">
                <span className="text-[12.5px] font-mono font-bold text-[#816729] uppercase tracking-wider">{k}</span>
                <span className="text-[14.5px] text-[#202020] font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ventriloc-Styled Contact Section (pb-row-contact) ───── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 bg-[#FFFFFF]" id="contact">
        <div className="max-w-[1440px] mx-auto grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-20 items-start">
          <div>
            <span className="text-[12px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold">Get In Touch</span>
            <h2 className="text-[38px] sm:text-[48px] font-extrabold tracking-[-0.03em] text-[#202020] ff-heading mt-2 mb-6 leading-[1.08]">
              Ready to talk about your next quality transformation?
            </h2>
            <p className="text-[17px] leading-[1.65] text-[#4D4D4D] max-w-[440px] mb-8">
              Whether you need an on-premise Docker deployment, migration from legacy spreadsheets, or a custom demo with your engineering team, our quality architects are ready.
            </p>

            <div className="space-y-4 mb-8 text-[14px] text-[#4D4D4D]">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>Response time SLA: <strong>Within 4 business hours</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF682C]" />
                <span>Direct email: <strong>quality@fmeapex.com</strong></span>
              </div>
            </div>

            <button
              onClick={handlePrimaryCTA}
              disabled={guestLoading}
              className="btn-ventriloc-primary h-[50px] px-8 text-[14.5px]"
            >
              {guestLoading ? 'Loading…' : token ? 'Open Workspace' : 'Launch Free Preview'}
            </button>
          </div>

          {/* Contact Form Card */}
          <div className="rounded-[24px] border border-[#E4E4E4] bg-[#FAF9F6] p-8 sm:p-10 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.08)]">
            {contactError && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[13px] text-[#B91C1C]">
                {contactError}
              </div>
            )}
            {contactSuccess && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-[13px] text-[#15803D]">
                Thank you. Our engineering architect will contact you shortly.
              </div>
            )}
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-mono font-bold text-[#816729] uppercase tracking-wider mb-2">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Jane Doe"
                    className="w-full h-[48px] px-4 rounded-xl border border-[#D4CFC4] bg-white text-[14.5px] text-[#202020] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FF682C]/30 focus:border-[#FF682C] transition"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-mono font-bold text-[#816729] uppercase tracking-wider mb-2">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="jane@manufacturer.com"
                    className="w-full h-[48px] px-4 rounded-xl border border-[#D4CFC4] bg-white text-[14.5px] text-[#202020] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FF682C]/30 focus:border-[#FF682C] transition"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-mono font-bold text-[#816729] uppercase tracking-wider mb-2">Company / Plant</label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="e.g. Continental Plant 4"
                    className="w-full h-[48px] px-4 rounded-xl border border-[#D4CFC4] bg-white text-[14.5px] text-[#202020] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FF682C]/30 focus:border-[#FF682C] transition"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-mono font-bold text-[#816729] uppercase tracking-wider mb-2">Inquiry Type</label>
                  <select
                    value={contactForm.type}
                    onChange={(e) => setContactForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full h-[48px] px-4 rounded-xl border border-[#D4CFC4] bg-white text-[14.5px] text-[#202020] focus:outline-none focus:ring-2 focus:ring-[#FF682C]/30 focus:border-[#FF682C] transition"
                  >
                    {INQUIRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-mono font-bold text-[#816729] uppercase tracking-wider mb-2">Project Details / Goals</label>
                <textarea
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us about your production lines, current FMEA tools, or migration requirements…"
                  className="w-full px-4 py-3 rounded-xl border border-[#D4CFC4] bg-white text-[14.5px] text-[#202020] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FF682C]/30 focus:border-[#FF682C] transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={contactSubmitting}
                className="w-full btn-ventriloc-primary h-[50px] text-[15px] font-bold"
              >
                {contactSubmitting ? 'Sending inquiry…' : 'Send Message →'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default LandingPage;
