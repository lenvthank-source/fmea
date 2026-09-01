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
  ['Standards Compliance', 'AIAG-VDA 2019 (1st Edition) · 21 CFR Part 11 · IATF 16949 · ISO 9001'],
  ['Document Coverage', 'PFMEA · DFMEA · Process Flow Diagrams (PFD) · Control Plans (CP)'],
  ['AI Vector Engine', 'Tenant-isolated RAG · OpenAI Embeddings · Neon pgvector HNSW Indexing'],
  ['Database Architecture', 'PostgreSQL 15 Serverless · Strict Row-Level Security (RLS) isolation'],
  ['Security & Auth', 'RS256 JWT · RBAC 22 granular scopes · HMAC-SHA256 outbound webhooks'],
  ['Deployment Targets', 'Cloudflare Pages Edge + Managed Render + Docker / Podman on-premises'],
  ['Evidence Storage', 'Cloudflare R2 / S3-compatible · 50MB max file size · Pre-signed upload URLs'],
];

const INQUIRY_TYPES = ['Demo Request', 'Enterprise License', 'Quality Data Migration', 'General Inquiry'];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, guestLogin } = useAuth();

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
      navigate('/app/projects');
    } catch (err) {
      console.error('Guest login failed:', err);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18181B] font-sans antialiased">
      <SEO
        title="FMEApex — Trusted Experts in AIAG-VDA 2019 Quality Intelligence & PFMEA"
        description="Turn your manufacturing quality data into a zero-defect growth engine with advanced AIAG-VDA 2019 FMEA, PFD linking, and 21 CFR Part 11 intelligence."
        canonical="/"
      />

      {/* ── 1. Floating Capsule Site Header ──────────────────── */}
      <SiteHeader />

      {/* ── 2. Hero Tile (Warm Ivory Canvas) ────────────────── */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-[#FAF9F6]">
        <div className="max-w-[1360px] mx-auto">
          {/* Top Hero Container */}
          <div className="max-w-[920px] mx-auto text-center mb-12">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E5E0D8] text-[12px] font-mono font-bold text-[#816729] shadow-xs mb-7">
              <span className="text-[#FF682C]">✦</span>
              <span>AIAG-VDA 2019 Standard</span>
              <span className="text-[#D4D4D8]">•</span>
              <span>21 CFR Part 11 Compliant</span>
            </div>

            {/* Ventriloc Signature Editorial Headline */}
            <h1 className="text-[40px] sm:text-[58px] lg:text-[70px] font-extrabold leading-[1.04] tracking-[-0.035em] text-[#18181B] mb-6 ff-heading">
              Your Quality.<br />
              Our Analytics Expertise.<br />
              Powering Your <span className="text-[#FF682C]">Zero-Defect Growth</span>.
            </h1>

            {/* Subtitle */}
            <p className="text-[17px] sm:text-[20px] leading-[1.6] text-[#52525B] max-w-[720px] mx-auto mb-9 font-normal">
              FMEApex puts business intelligence, manufacturing data engineering, and AIAG-VDA expertise to work for your engineering team. Unlocking zero-defect quality with deterministic risk matrices and immutable compliance.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <button
                onClick={handlePrimaryCTA}
                disabled={guestLoading}
                className="h-12 px-8 rounded-full bg-[#FF682C] hover:bg-[#E05219] disabled:opacity-50 text-white text-[15px] font-semibold transition-all shadow-[0_6px_20px_rgba(255,104,44,0.35)] hover:shadow-[0_8px_25px_rgba(255,104,44,0.45)] flex items-center gap-2"
              >
                {guestLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Launch Free Guest Sandbox</span>
                    <span className="text-[16px]">→</span>
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/product')}
                className="h-12 px-7 rounded-full border border-[#18181B] bg-transparent hover:bg-[#18181B] hover:text-white text-[#18181B] text-[15px] font-semibold transition-all"
              >
                Explore Platform
              </button>
            </div>

            {/* Trust Metrics Pill Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-[860px] mx-auto text-center">
              <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-xs">
                <div className="text-[24px] font-extrabold text-[#18181B] font-mono">99.8%</div>
                <div className="text-[12px] text-[#71717A] font-medium mt-0.5">Audit Pass Rate</div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-xs">
                <div className="text-[24px] font-extrabold text-[#10B981] font-mono">100%</div>
                <div className="text-[12px] text-[#71717A] font-medium mt-0.5">7-Step Gating</div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-xs">
                <div className="text-[24px] font-extrabold text-[#FF682C] font-mono">&lt;120ms</div>
                <div className="text-[12px] text-[#71717A] font-medium mt-0.5">Vector RAG Retrieval</div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-xs">
                <div className="text-[24px] font-extrabold text-[#18181B] font-mono">Zero</div>
                <div className="text-[12px] text-[#71717A] font-medium mt-0.5">Spreadsheet Loss</div>
              </div>
            </div>
          </div>

          {/* ── 3. The Studio Tile (Interactive Preview Canvas) ── */}
          <div className="shadow-[0_20px_60px_rgba(0,0,0,0.08)]  rounded-[24px]">
            <VentrilocDashboard />
          </div>
        </div>
      </section>

      {/* ── 4. Partner Marquee Tile ─────────────────────────── */}
      <section className="py-9 bg-white border-y border-[#E5E0D8] overflow-hidden">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 mb-3 flex items-center justify-between">
          <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-[#816729] font-bold">
            Trusted by 80+ global manufacturing leaders
          </p>
          <span className="text-[11px] font-mono text-[#A1A1AA] hidden sm:inline">Automotive & Aerospace Tier 1</span>
        </div>

        <div className="relative w-full overflow-hidden flex items-center">
          <div className="animate-ticker flex items-center gap-12 sm:gap-16 py-1.5">
            {[...LOGOS, ...LOGOS].map((brand, i) => (
              <span
                key={`${brand}-${i}`}
                className="text-[14.5px] sm:text-[16px] font-extrabold tracking-[0.16em] text-[#A1A1AA] hover:text-[#18181B] transition-colors cursor-default whitespace-nowrap"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Four Core Quality Feature Tiles ──────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAF9F6]" id="solutions">
        <div className="max-w-[1360px] mx-auto">
          <div className="max-w-[640px] mb-14">
            <span className="text-[11.5px] font-mono uppercase tracking-wider text-[#FF682C] font-bold">Our Core Modules</span>
            <h2 className="text-[34px] sm:text-[46px] font-extrabold tracking-tight text-[#18181B] mt-2 leading-[1.08] ff-heading">
              Engineered for absolute quality adoption.
            </h2>
            <p className="mt-3 text-[16.5px] text-[#52525B] leading-relaxed">
              Every module is designed to be understood, adopted, and used daily on the shop floor and in engineering review rooms.
            </p>
          </div>

          {/* Four High-End Distinct Tiles */}
          <div className="space-y-8">
            {/* Tile 1: PFD ↔ PFMEA Sync */}
            <div className="bg-white rounded-[32px] border border-[#E5E0D8] p-8 sm:p-12 shadow-xs hover:border-[#D4D4D8] transition-all">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-12 h-1 bg-[#FF682C] rounded-full mb-5" />
                  <span className="text-[11.5px] font-mono uppercase tracking-wider text-[#FF682C] font-bold">Module 01</span>
                  <h3 className="text-[26px] sm:text-[34px] font-extrabold text-[#18181B] mt-1 mb-3 ff-heading">
                    Process Flow & Structure Analysis
                  </h3>
                  <div className="inline-block text-[12px] font-mono text-[#816729] font-bold bg-[#EBE6DD] px-3 py-1 rounded-lg mb-4">
                    AIAG-VDA Step 2 & 3 · PFD ↔ PFMEA Bidirectional Sync
                  </div>
                  <p className="text-[15.5px] leading-relaxed text-[#52525B] mb-6">
                    Extract, map, and synchronize every manufacturing operation from your Process Flow Diagram directly into the PFMEA grid with zero data loss. Automatic orphan process detection prevents missing inspection gates.
                  </p>
                  <button
                    onClick={() => navigate('/product')}
                    className="inline-flex items-center gap-2 text-[14px] font-bold text-[#18181B] hover:text-[#FF682C] transition-colors"
                  >
                    <span>Explore PFD ↔ PFMEA linking</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8] p-6 font-mono text-[12px] space-y-3">
                  <div className="text-[#816729] font-bold uppercase tracking-wider text-[11px]">Process Synchronization Engine</div>
                  <div className="p-3.5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs">
                    <div className="flex justify-between items-center text-[#18181B] font-bold text-[13px]">
                      <span>PFD Step 10: Automatic Bearing Press</span>
                      <span className="text-[#10B981] font-bold">SYNCED</span>
                    </div>
                    <div className="text-[#71717A] text-[11.5px] mt-1">4M Allocation: Machine (Press-04) · Man (Operator 2)</div>
                  </div>
                  <div className="p-3.5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs">
                    <div className="flex justify-between items-center text-[#18181B] font-bold text-[13px]">
                      <span>PFMEA Row 10.1: Insufficient Press Force</span>
                      <span className="text-[#FF682C] font-bold">S=8 · O=3 · D=4</span>
                    </div>
                    <div className="text-[#71717A] text-[11.5px] mt-1">Directly propagates to Control Plan Dimension Tolerances</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tile 2: Risk Visualization & Action Priority */}
            <div className="bg-[#FAF9F6] rounded-[32px] border border-[#E5E0D8] p-8 sm:p-12 shadow-xs hover:border-[#D4D4D8] transition-all">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-12 h-1 bg-[#816729] rounded-full mb-5" />
                  <span className="text-[11.5px] font-mono uppercase tracking-wider text-[#816729] font-bold">Module 02</span>
                  <h3 className="text-[26px] sm:text-[34px] font-extrabold text-[#18181B] mt-1 mb-3 ff-heading">
                    Risk Visualization & Action Priority
                  </h3>
                  <div className="inline-block text-[12px] font-mono text-[#816729] font-bold bg-[#EBE6DD] px-3 py-1 rounded-lg mb-4">
                    Deterministic AIAG-VDA AP (High, Medium, Low)
                  </div>
                  <p className="text-[15.5px] leading-relaxed text-[#52525B] mb-6">
                    Our methodology is design-driven: every visual is crafted with the quality engineer in mind, providing instant visual hierarchy over Severity, Occurrence, and Detection ratings. High-AP mandates trigger automated action tasks.
                  </p>
                  <button
                    onClick={() => navigate('/product')}
                    className="inline-flex items-center gap-2 text-[14px] font-bold text-[#18181B] hover:text-[#816729] transition-colors"
                  >
                    <span>View Action Priority logic</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-2xl bg-white border border-[#E5E0D8] p-6 shadow-xs">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-3">Live Matrix Evaluation</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl">
                      <span className="text-[10.5px] font-mono font-bold uppercase text-[#EF4444]">High AP</span>
                      <div className="text-[16px] font-bold text-[#991B1B] mt-1">Mandatory</div>
                      <div className="text-[10.5px] text-[#DC2626] mt-0.5">Action Required</div>
                    </div>
                    <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl">
                      <span className="text-[10.5px] font-mono font-bold uppercase text-[#D97706]">Medium AP</span>
                      <div className="text-[16px] font-bold text-[#92400E] mt-1">Review</div>
                      <div className="text-[10.5px] text-[#B45309] mt-0.5">Discretionary</div>
                    </div>
                    <div className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl">
                      <span className="text-[10.5px] font-mono font-bold uppercase text-[#059669]">Low AP</span>
                      <div className="text-[16px] font-bold text-[#065F46] mt-1">Acceptable</div>
                      <div className="text-[10.5px] text-[#047857] mt-0.5">Controls Verified</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tile 3: Regulatory Governance & 21 CFR Part 11 (Deep Graphite Tile) */}
            <div className="bg-[#18181B] text-white rounded-[32px] p-8 sm:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-12 h-1 bg-[#FF682C] rounded-full mb-5" />
                  <span className="text-[11.5px] font-mono uppercase tracking-wider text-[#FF682C] font-bold">Module 03</span>
                  <h3 className="text-[26px] sm:text-[34px] font-extrabold text-white mt-1 mb-3 ff-heading">
                    Regulatory Governance & 21 CFR Part 11
                  </h3>
                  <div className="inline-block text-[12px] font-mono text-[#E4E4E4] font-bold bg-[#2A2A30] px-3 py-1 rounded-lg mb-4 border border-[#3E3E48]">
                    Electronic Signatures · Reviewer Segregation · Immutable Audit Trail
                  </div>
                  <p className="text-[15.5px] leading-relaxed text-[#A1A1AA] mb-6">
                    Establish strict regulatory controls, cryptographic digital signatures, and locked document revisions ensuring flawless regulatory inspection readiness. Database constraints permanently reject deletions on audit records.
                  </p>
                  <button
                    onClick={() => navigate('/learn/21-cfr-part-11-fmea')}
                    className="inline-flex items-center gap-2 text-[14px] font-bold text-white hover:text-[#FF682C] transition-colors"
                  >
                    <span>Read 21 CFR Part 11 specification</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-2xl bg-[#222228] border border-[#2E2E36] p-6 font-mono text-[12px] text-[#A1A1AA] space-y-3">
                  <div className="flex justify-between items-center pb-2.5 border-b border-[#2E2E36] text-[10.5px] uppercase font-bold text-[#71717A]">
                    <span>Immutable Audit Trail Partition</span>
                    <span className="text-[#10B981]">Active Lock</span>
                  </div>
                  <div className="p-3 bg-[#18181B] rounded-xl border border-[#2E2E36] text-white">
                    <span className="text-[#FF682C]">2026-09-01T08:14:05Z</span> • Rev C Approved by QA Director • Hash: e8046277
                  </div>
                  <div className="p-3 bg-[#18181B] rounded-xl border border-[#2E2E36]">
                    <span className="text-[#A1A1AA]">2026-09-01T08:02:14Z</span> • ACT-102 Evidence Uploaded (R2) • S=8, O=3, D=3
                  </div>
                </div>
              </div>
            </div>

            {/* Tile 4: AI Quality Copilot & Data Agents */}
            <div className="bg-white rounded-[32px] border border-[#E5E0D8] p-8 sm:p-12 shadow-xs hover:border-[#D4D4D8] transition-all">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="w-12 h-1 bg-[#FF682C] rounded-full mb-5" />
                  <span className="text-[11.5px] font-mono uppercase tracking-wider text-[#FF682C] font-bold">Module 04</span>
                  <h3 className="text-[26px] sm:text-[34px] font-extrabold text-[#18181B] mt-1 mb-3 ff-heading">
                    AI Quality Copilot & Data Agents
                  </h3>
                  <div className="inline-block text-[12px] font-mono text-[#816729] font-bold bg-[#EBE6DD] px-3 py-1 rounded-lg mb-4">
                    Tenant-Isolated Vector RAG · Human-in-the-Loop Validation
                  </div>
                  <p className="text-[15.5px] leading-relaxed text-[#52525B] mb-6">
                    Our AI agents suggest failure modes, causes, and detection controls based strictly on your historical FMEA knowledge base. AI suggestions never overwrite live analysis rows without explicit engineering approval.
                  </p>
                  <button
                    onClick={() => navigate('/product')}
                    className="inline-flex items-center gap-2 text-[14px] font-bold text-[#18181B] hover:text-[#FF682C] transition-colors"
                  >
                    <span>Discover AI Copilot architecture</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="lg:col-span-6 rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8] p-6 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-[#FF682C] uppercase">
                    <span>✦ AI Quality Recommendation</span>
                  </div>
                  <div className="text-[12.5px] text-[#52525B]">Based on 14 similar welding operations in database:</div>
                  <div className="p-3.5 bg-white rounded-xl border border-[#E5E0D8] text-[13.5px] font-semibold text-[#18181B] shadow-xs">
                    Suggested Detection Control: High-frequency ultrasonic weld inspection
                  </div>
                  <div className="flex gap-2 pt-1">
                    <span className="px-3 py-1 rounded-lg bg-[#18181B] text-white text-[11.5px] font-bold">Accept Suggestion</span>
                    <span className="px-3 py-1 rounded-lg border border-[#E5E0D8] text-[#52525B] text-[11.5px] font-semibold">Modify</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Interactive Action Priority Simulator Tile ──── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-y border-[#E5E0D8]" id="simulator">
        <div className="max-w-[1360px] mx-auto">
          <div className="text-center max-w-[640px] mx-auto mb-12">
            <span className="text-[11.5px] font-mono uppercase tracking-wider text-[#FF682C] font-bold">Interactive Tool</span>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-tight text-[#18181B] mt-2 ff-heading">
              Simulate Action Priority in real-time
            </h2>
            <p className="mt-3 text-[16px] text-[#52525B]">
              Adjust Severity, Occurrence, and Detection sliders to see how AIAG-VDA 2019 prioritizes corrective action tasks.
            </p>
          </div>

          <div className="max-w-[1020px] mx-auto">
            <RiskCalculatorWidget />
          </div>
        </div>
      </section>

      {/* ── 7. Technical Specifications Architecture Tile ──── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF9F6] border-b border-[#E5E0D8]">
        <div className="max-w-[1360px] mx-auto">
          <div className="mb-10 max-w-[620px]">
            <span className="text-[11.5px] font-mono uppercase tracking-wider text-[#816729] font-bold">Technical Specifications</span>
            <h2 className="text-[28px] sm:text-[38px] font-extrabold tracking-tight text-[#18181B] mt-1.5 ff-heading">
              Built for enterprise manufacturing scale
            </h2>
            <p className="mt-2 text-[15.5px] text-[#52525B]">
              Engineered from day one with row-level tenant isolation, cryptographic audit trails, and zero spreadsheet dependencies.
            </p>
          </div>

          <div className="rounded-[24px] bg-white border border-[#E5E0D8] divide-y divide-[#E5E0D8] overflow-hidden shadow-xs">
            {SPECS.map(([label, value]) => (
              <div key={label} className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-5 text-[13.5px] hover:bg-[#FDFCFB] transition-colors">
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

      {/* ── 8. Contact & Transformation Tile ────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white" id="contact">
        <div className="max-w-[1360px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <span className="text-[11.5px] font-mono uppercase tracking-wider text-[#FF682C] font-bold">Get In Touch</span>
              <h2 className="text-[34px] sm:text-[44px] font-extrabold tracking-tight text-[#18181B] mt-2 mb-4 leading-tight ff-heading">
                Ready to talk about your quality transformation?
              </h2>
              <p className="text-[16px] leading-relaxed text-[#52525B] mb-7">
                Whether you need an on-premise Docker deployment, migration from legacy spreadsheets, or a custom demo with your engineering team, our quality architects are ready.
              </p>
              <div className="space-y-2.5 text-[13px] font-mono text-[#71717A]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>Response time SLA: <strong className="text-[#18181B]">Within 4 business hours</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF682C]" />
                  <span>Direct email: <a href="mailto:quality@fmeapex.online" className="text-[#FF682C] font-bold hover:underline">quality@fmeapex.online</a></span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#FAF9F6] border border-[#E5E0D8] rounded-[28px] p-7 sm:p-10 shadow-xs">
              {contactSuccess ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#A7F3D0]">
                  <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto mb-4 text-[20px]">✓</div>
                  <h3 className="text-[19px] font-bold text-[#18181B] mb-1.5">Message received</h3>
                  <p className="text-[14px] text-[#52525B]">Thank you for reaching out. A quality engineer will get in touch with you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {contactError && (
                    <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[13px] rounded-xl">
                      {contactError}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-1.5">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Jane Doe"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-[#E5E0D8] text-[14px] text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-1.5">Corporate Email</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="jane@manufacturer.com"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-[#E5E0D8] text-[14px] text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-1.5">Company / Plant</label>
                      <input
                        type="text"
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        placeholder="Tier 1 Automotive Plant"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-[#E5E0D8] text-[14px] text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-1.5">Inquiry Type</label>
                      <select
                        value={contactForm.type}
                        onChange={(e) => setContactForm({ ...contactForm, type: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl bg-white border border-[#E5E0D8] text-[14px] text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      >
                        {INQUIRY_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-1.5">Project Details</label>
                    <textarea
                      rows={3}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Tell us about your production lines, current FMEA tools, or migration requirements..."
                      className="w-full p-4 rounded-xl bg-white border border-[#E5E0D8] text-[14px] text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full h-12 rounded-xl bg-[#FF682C] hover:bg-[#E05219] text-white text-[14.5px] font-semibold transition-all shadow-[0_4px_14px_rgba(255,104,44,0.3)] flex items-center justify-center gap-2"
                  >
                    {contactSubmitting ? 'Sending...' : 'Send Message →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Ventriloc Modern Minimalist Footer ───────────── */}
      <SiteFooter />
    </div>
  );
};

export default LandingPage;
