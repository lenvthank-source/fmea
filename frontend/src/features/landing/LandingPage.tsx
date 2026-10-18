import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import { VentrilocDashboard } from '../../components/site/VentrilocDashboard';
import { RiskCalculatorWidget } from './RiskCalculatorWidget';
import { useAuth } from '../auth/AuthContext';
import { useBackendReady } from '../../hooks/useBackendWarmup';
import { API_BASE_URL } from '../../config';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  GitBranch,
  FileSpreadsheet,
  Lock,
  Server,
  ChevronRight,
  Check,
  X,
  Workflow
} from 'lucide-react';

const SEVEN_STEPS = [
  {
    step: 1,
    name: 'Planning & Preparation',
    tag: '5Ts Initiation',
    desc: 'Define scope, project boundaries, cross-functional team (CFT), and schedule using the 5Ts framework.',
    input: 'Customer requirements, engineering scope, project milestones',
    output: 'FMEA Project Charter, 5Ts matrix, Team member assignments',
    gating: 'Scope definition and CFT sign-off required before structure decomposition.',
  },
  {
    step: 2,
    name: 'Structure Analysis',
    tag: '4M Tree Allocation',
    desc: 'Map the complete manufacturing sequence from PFD down to Station Work Elements across 4M: Machine, Man, Material, Method.',
    input: 'Process Flow Diagram (PFD) or Bill of Materials (DFMEA)',
    output: 'Structural hierarchy tree with zero orphan operation steps',
    gating: 'Every process step must link to at least one 4M work element.',
  },
  {
    step: 3,
    name: 'Function Analysis',
    tag: 'Requirements & Specs',
    desc: 'Establish functions and engineering specifications for each structure level: Item Function → Step Function → Element Function.',
    input: 'Product specifications, drawing tolerances, process parameters',
    output: 'Functional network linking process parameters to product characteristics',
    gating: 'Functions must have quantifiable engineering tolerances or acceptance criteria.',
  },
  {
    step: 4,
    name: 'Failure Analysis',
    tag: 'Cause → Mode → Effect',
    desc: 'Construct deterministic failure chains: Failure Cause (at Work Element) → Failure Mode (at Station) → Failure Effect (Customer / Plant).',
    input: 'Historical warranty data, scrap logs, process risk brainstorming',
    output: 'Validated failure chains with inherited severity from worst-case effect',
    gating: 'Completeness rule: Each failure mode must link to ≥1 effect and ≥1 cause.',
  },
  {
    step: 5,
    name: 'Risk Analysis',
    tag: 'S / O / D & Action Priority',
    desc: 'Evaluate Severity (S), Occurrence (O), and Detection (D) ratings [1-10]. Action Priority (High, Medium, Low) is looked up deterministically.',
    input: 'AIAG-VDA 2019 rating tables and prevention/detection control methods',
    output: 'Read-only Action Priority (AP) calculation; legacy RPN comparison',
    gating: 'Ratings strictly restricted to integer range [1, 10]; AP cannot be manually edited.',
  },
  {
    step: 6,
    name: 'Optimization',
    tag: 'High-AP Corrective Actions',
    desc: 'Mandatory corrective action tracking for all High-AP risks. Actions require assigned owners, target dates, and verified evidence files.',
    input: 'Engineering redesign, automated Poka-Yoke, upgraded inspection sensors',
    output: 'Post-action S/O/D ratings, recalculated AP, Cloudflare R2 evidence',
    gating: 'Action closure blocked until evidence uploaded and post-action ratings verified.',
  },
  {
    step: 7,
    name: 'Documentation',
    tag: '21 CFR Part 11 Lock',
    desc: 'Formal CFT review, reviewer segregation verification, cryptographic SHA-256 digital signature, and revision locking.',
    input: 'Completed CFT reviews and verified corrective action closures',
    output: 'Locked immutable revision, Control Plan auto-flow, audit ledger entry',
    gating: 'Locked revisions reject all future writes; audit trail rejects UPDATE and DELETE.',
  },
];

const COMPARISON_ROWS = [
  {
    feature: 'Action Priority (AP) Calculation',
    excel: 'Manual nested IF formulas that easily break or get altered across users',
    fmeapex: 'Deterministic AIAG-VDA 2019 matrix lookup engine locked at database level',
  },
  {
    feature: 'PFD ↔ PFMEA Synchronization',
    excel: 'Disconnected sheets; steps added to PFD are forgotten in PFMEA',
    fmeapex: 'Bidirectional sync with automatic orphan operation detection & coverage alerts',
  },
  {
    feature: 'Control Plan (CP) Flow-Down',
    excel: 'Manual copy-paste of controls into separate Word or Excel templates',
    fmeapex: 'Dynamic automated compilation; tolerance edits propagate bidirectionally in serializable transactions',
  },
  {
    feature: 'High-Risk Action Mandates',
    excel: 'RPN thresholds (e.g. >100) ignore high-severity hazards (e.g. S=10, O=2, D=2 = RPN 40)',
    fmeapex: 'Mandatory action workflows automatically triggered for all High-AP ratings',
  },
  {
    feature: 'Audit Trail & Immutability',
    excel: 'File modification timestamps easily manipulated; no change history',
    fmeapex: '21 CFR Part 11 compliant SHA-256 signatures; PostgreSQL immutable audit partition',
  },
  {
    feature: 'AI Quality Knowledge Retrieval',
    excel: 'Engineers recreate failure modes from scratch for every new project',
    fmeapex: 'Tenant-isolated pgvector RAG retrieves proven controls from approved revisions',
  },
];

const TECHNICAL_SPECS: [string, string, string][] = [
  ['AIAG-VDA 2019 (1st Ed)', 'Methodology', 'Strict 7-Step gating, deterministic AP tables, 4M structure allocation'],
  ['21 CFR Part 11 & Annex 11', 'Regulatory', 'Cryptographic SHA-256 digital signatures, reviewer segregation, immutable log partition'],
  ['PostgreSQL 15 Serverless', 'Database', 'Row-Level Security (RLS) with session tenant variables on all queries'],
  ['Tenant-Isolated Vector RAG', 'AI Engine', 'OpenAI Embeddings + Neon pgvector HNSW indexing (M=16, ef_construction=64)'],
  ['Cloudflare R2 Storage', 'Evidence', '50MB max file size with pre-signed upload URLs for corrective action validation'],
  ['On-Premises Deployment', 'Infrastructure', 'Single-command Docker Compose deployment ready for air-gapped corporate firewalls'],
];

const INQUIRY_TYPES = ['Demo Request', 'Enterprise On-Premises License', 'Excel Data Migration', 'Architecture & Security Review'];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, guestLogin } = useAuth();
  const { isBackendReady } = useBackendReady();

  const [guestLoading, setGuestLoading] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState(1);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', type: 'Demo Request', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  // Handle smooth scroll target if provided in query string or hash
  React.useEffect(() => {
    const handleScrollTarget = () => {
      const params = new URLSearchParams(window.location.search);
      const target = params.get('scroll') || (window.location.hash ? window.location.hash.substring(1) : null);
      if (target) {
        setTimeout(() => {
          const el = document.getElementById(target);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    };
    handleScrollTarget();
  }, []);

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
      setContactError('Could not deliver your inquiry. Please email quality@fmeapex.online directly.');
    } finally {
      setContactSubmitting(false);
    }
  }, [contactForm]);

  const handlePrimaryCTA = async () => {
    if (token) {
      navigate('/app/projects');
      return;
    }
    setGuestLoading(true);
    try {
      await guestLogin();
      navigate('/app/projects');
    } catch (err) {
      console.error('Guest login failed:', err);
      navigate('/login');
    } finally {
      setGuestLoading(false);
    }
  };

  const selectedStep = SEVEN_STEPS.find((s) => s.step === activeStepTab) || SEVEN_STEPS[0];

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-slate-900 font-sans antialiased selection:bg-[#FF5500]/20 selection:text-slate-900">
      <SEO
        title="FMEApex — Deterministic AIAG-VDA 2019 Quality Intelligence Platform"
        description="Replace fragile Excel sheets with deterministic AIAG-VDA 2019 FMEA intelligence. PFD-PFMEA linking, Control Plan auto-flow, and 21 CFR Part 11 compliance."
        canonical="/"
      />

      {/* ── 1. Handcrafted Precision Navigation ────────────── */}
      <SiteHeader />

      {/* ── 2. Hero Section (Industrial Canvas) ────────────── */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-tech-dots border-b border-slate-200/70">
        <div className="max-w-[1320px] mx-auto">
          {/* Hero Core Content */}
          <div className="max-w-[960px] mx-auto text-center mb-12 sm:mb-16">
            {/* Standards Compliance Capsule */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-xs mb-6">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>AIAG-VDA 2019 (1st Ed.)</span>
              <span className="text-slate-300">•</span>
              <span>IATF 16949 §8.3.5</span>
              <span className="text-slate-300">•</span>
              <span>21 CFR Part 11</span>
            </div>

            {/* Authoritative Engineering Headline */}
            <h1 className="text-[38px] sm:text-[56px] lg:text-[68px] font-extrabold leading-[1.05] tracking-[-0.035em] text-slate-900 mb-6 ff-heading">
              The Deterministic FMEA Platform.<br />
              <span className="text-[#FF5500]">Engineered for Zero-Defect Manufacturing.</span>
            </h1>

            {/* Subtitle addressing actual engineering pain points */}
            <p className="text-[17px] sm:text-[20px] leading-[1.6] text-slate-600 max-w-[760px] mx-auto mb-10 font-normal">
              Eliminate spreadsheet chaos and OEM audit anxiety. FMEApex unifies Process Flow Diagrams (PFD), PFMEAs, and Control Plans in a single cryptographic system of record with strict AIAG-VDA 7-step gating.
            </p>

            {/* Action Row */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 mb-12">
              <button
                onClick={handlePrimaryCTA}
                disabled={guestLoading}
                className="h-12 px-7 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 text-white text-[14.5px] font-semibold transition-all shadow-md flex items-center gap-2 group"
              >
                {guestLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>{isBackendReady ? 'Entering Sandbox...' : 'Warming Services...'}</span>
                  </span>
                ) : (
                  <>
                    <span>Launch Free Guest Sandbox</span>
                    <ArrowRight className="w-4 h-4 text-[#FF5500] group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('simulator');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-12 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[14.5px] font-semibold transition-all shadow-xs"
              >
                Simulate Action Priority (AP)
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('workflow');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-12 px-5 rounded-xl text-slate-600 hover:text-slate-900 text-[14px] font-medium transition-colors flex items-center gap-1"
              >
                <span>7-Step Method</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Four Concrete Verification Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-[920px] mx-auto text-left">
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-mono text-[#FF5500] font-bold">
                  <Cpu className="w-4 h-4" />
                  <span>STEP 5 RISK</span>
                </div>
                <div className="text-[17px] font-extrabold text-slate-900 mt-1">Deterministic AP</div>
                <div className="text-[12px] text-slate-500 mt-0.5 leading-tight">
                  High, Medium, Low lookup table. Replaces flawed legacy RPN.
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 font-bold">
                  <Workflow className="w-4 h-4" />
                  <span>7-STEP GATING</span>
                </div>
                <div className="text-[17px] font-extrabold text-slate-900 mt-1">Zero Skipped Phases</div>
                <div className="text-[12px] text-slate-500 mt-0.5 leading-tight">
                  Prerequisites strictly enforced before revision progression.
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-bold">
                  <GitBranch className="w-4 h-4" />
                  <span>TRI-DIRECTIONAL</span>
                </div>
                <div className="text-[17px] font-extrabold text-slate-900 mt-1">PFD ↔ PFMEA ↔ CP</div>
                <div className="text-[12px] text-slate-500 mt-0.5 leading-tight">
                  Serializable bidirectional sync prevents orphan operations.
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-700 font-bold">
                  <Lock className="w-4 h-4" />
                  <span>PART 11 COMPLIANT</span>
                </div>
                <div className="text-[17px] font-extrabold text-slate-900 mt-1">SHA-256 Signatures</div>
                <div className="text-[12px] text-slate-500 mt-0.5 leading-tight">
                  Immutable audit log partition rejects UPDATE and DELETE queries.
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. The Studio Canvas (Interactive Workbench Proof) ── */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] overflow-hidden bg-white">
            <VentrilocDashboard />
          </div>
        </div>
      </section>

      {/* ── 4. The 7-Step AIAG-VDA Interactive Methodology ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200" id="workflow">
        <div className="max-w-[1320px] mx-auto">
          {/* Section Header */}
          <div className="max-w-[720px] mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
              <Layers className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>AIAG-VDA 2019 Core Standard</span>
            </div>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-tight text-slate-900 leading-[1.08] ff-heading">
              The 7-Step Quality Analysis Methodology.
            </h2>
            <p className="mt-3 text-[16px] text-slate-600 leading-relaxed">
              AIAG-VDA 2019 eliminated guesswork by replacing informal brainstorming with a phased, gated quality architecture. Every step produces verifiable outputs required by the next.
            </p>
          </div>

          {/* Interactive Step Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-8">
            {SEVEN_STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => setActiveStepTab(s.step)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeStepTab === s.step
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-[#FBFBFC] hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className={`text-[11px] font-mono font-bold ${activeStepTab === s.step ? 'text-[#FF5500]' : 'text-slate-400'}`}>
                  STEP 0{s.step}
                </div>
                <div className="text-[13px] font-bold mt-1 line-clamp-1">
                  {s.name}
                </div>
              </button>
            ))}
          </div>

          {/* Step Detail Inspection Card */}
          <div className="rounded-2xl border border-slate-200 bg-[#FBFBFC] p-6 sm:p-10 shadow-xs">
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Concept & Description */}
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-200/80 text-xs font-mono font-bold text-slate-800">
                  <span>Step 0{selectedStep.step}</span>
                  <span>•</span>
                  <span>{selectedStep.tag}</span>
                </div>
                <h3 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 ff-heading">
                  {selectedStep.name}
                </h3>
                <p className="text-[15.5px] leading-relaxed text-slate-600">
                  {selectedStep.desc}
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => navigate('/learn/aiag-vda-7-step-fmea')}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#FF5500] hover:text-slate-900 transition-colors"
                  >
                    <span>Read in-depth AIAG-VDA 7-Step handbook</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Gating Rule & Data I/O */}
              <div className="lg:col-span-6 space-y-3 font-mono text-xs">
                {/* Input Artifact */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-slate-400 font-bold uppercase text-[10.5px]">Required Entry Input</div>
                  <div className="text-slate-800 font-medium text-[13px] mt-1 font-sans">
                    {selectedStep.input}
                  </div>
                </div>

                {/* Output Artifact */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-emerald-600 font-bold uppercase text-[10.5px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mandated Output Artifact</span>
                  </div>
                  <div className="text-slate-800 font-medium text-[13px] mt-1 font-sans">
                    {selectedStep.output}
                  </div>
                </div>

                {/* Platform Gating Rule */}
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900">
                  <div className="font-bold uppercase text-[10.5px] flex items-center gap-1.5 text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Prerequisite Gating Constraint</span>
                  </div>
                  <div className="font-sans text-[12.5px] mt-1 text-amber-800">
                    {selectedStep.gating}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. The Golden Thread (PFD ↔ PFMEA ↔ Control Plan Sync) ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FBFBFC] border-b border-slate-200" id="sync">
        <div className="max-w-[1320px] mx-auto">
          <div className="max-w-[720px] mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-200/70 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
              <GitBranch className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Bidirectional Data Synchronization</span>
            </div>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-tight text-slate-900 leading-[1.08] ff-heading">
              The Golden Thread: Never Out of Sync.
            </h2>
            <p className="mt-3 text-[16px] text-slate-600 leading-relaxed">
              When a manufacturing engineer modifies a process parameter or tolerance in the Control Plan, traditional teams rely on manual memory to update the PFMEA. FMEApex links them in a serializable, bidirectional transaction.
            </p>
          </div>

          {/* Tri-Directional Sync Visualizer */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Box 1: PFD */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 font-mono font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Process Flow Diagram (PFD)
              </h3>
              <p className="text-xs text-slate-500 font-mono mb-4">
                Shop Floor Operations Sequence
              </p>
              <div className="space-y-2 text-xs font-mono text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-slate-800 font-bold">
                  <span>Op 20: Stator Fastener Torque</span>
                  <span className="text-emerald-600 text-[10px]">SYNCED</span>
                </div>
                <div className="text-[11px] text-slate-500">Work Element: Multi-Spindle Tooling</div>
                <div className="text-[11px] text-slate-500">4M Category: Machine (M-04)</div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Orphan operations flagged automatically</span>
              </div>
            </div>

            {/* Box 2: PFMEA */}
            <div className="rounded-2xl bg-white border-2 border-slate-900 p-6 sm:p-7 shadow-md relative">
              <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-md bg-[#FF5500] text-white text-[10.5px] font-mono font-bold uppercase tracking-wider">
                Active Core
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-4 font-mono font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                AIAG-VDA PFMEA Matrix
              </h3>
              <p className="text-xs text-slate-500 font-mono mb-4">
                Failure Chain & Risk Analysis
              </p>
              <div className="space-y-2 text-xs font-mono text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-slate-800 font-bold">
                  <span>Row 20.1: Under-torque</span>
                  <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">HIGH AP</span>
                </div>
                <div className="text-[11px] text-slate-500">S=9 · O=4 · D=4 (Worst-case inherited)</div>
                <div className="text-[11px] text-slate-500">Action: Dynamic angle-torque window</div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Inherits severity from worst-case customer effect</span>
              </div>
            </div>

            {/* Box 3: Control Plan */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 font-mono font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Control Plan (CP)
              </h3>
              <p className="text-xs text-slate-500 font-mono mb-4">
                Quality Inspection Specifications
              </p>
              <div className="space-y-2 text-xs font-mono text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-slate-800 font-bold">
                  <span>Fastener Clamp Torque</span>
                  <span className="text-blue-600 text-[10px]">AUTO-FLOW</span>
                </div>
                <div className="text-[11px] text-slate-500">Spec: 48.0 ± 2.5 N·m</div>
                <div className="text-[11px] text-slate-500">Evaluation: 100% per fastener transducer</div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Editing CP tolerance synchronizes back to PFMEA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Excel Spreadsheets vs. FMEApex Engine ────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto">
          <div className="max-w-[720px] mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-50 text-xs font-mono font-bold text-rose-700 uppercase tracking-wider mb-3">
              <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" />
              <span>Spreadsheet Risk Elimination</span>
            </div>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-tight text-slate-900 leading-[1.08] ff-heading">
              Why Tier 1 Manufacturers are Retiring Excel.
            </h2>
            <p className="mt-3 text-[16px] text-slate-600 leading-relaxed">
              Excel is a blank calculator, not a quality engineering database. Disconnected files, broken cell formulas, and unverified change histories lead to audit failure findings and costly recall liabilities.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="grid grid-cols-12 bg-slate-900 text-white p-4 sm:p-5 text-xs font-mono font-bold uppercase tracking-wider">
              <div className="col-span-12 sm:col-span-4">Engineering Requirement</div>
              <div className="col-span-6 sm:col-span-4 text-slate-400 mt-2 sm:mt-0 flex items-center gap-1.5">
                <X className="w-4 h-4 text-rose-400" />
                <span>Legacy Excel Spreadsheets</span>
              </div>
              <div className="col-span-6 sm:col-span-4 text-emerald-400 mt-2 sm:mt-0 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>FMEApex Quality OS</span>
              </div>
            </div>

            <div className="divide-y divide-slate-200 bg-[#FBFBFC]">
              {COMPARISON_ROWS.map((row) => (
                <div key={row.feature} className="grid grid-cols-12 p-4 sm:p-5 text-sm items-start hover:bg-white transition-colors">
                  <div className="col-span-12 sm:col-span-4 font-bold text-slate-900 mb-2 sm:mb-0">
                    {row.feature}
                  </div>
                  <div className="col-span-12 sm:col-span-4 text-slate-600 text-xs sm:text-sm pr-4 mb-2 sm:mb-0">
                    <span className="sm:hidden font-mono text-[10px] uppercase text-rose-500 font-bold block mb-0.5">Legacy Excel:</span>
                    {row.excel}
                  </div>
                  <div className="col-span-12 sm:col-span-4 text-slate-900 font-medium text-xs sm:text-sm pl-0 sm:pl-2">
                    <span className="sm:hidden font-mono text-[10px] uppercase text-emerald-600 font-bold block mb-0.5">FMEApex:</span>
                    <span className="text-emerald-950 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-200/60 inline-block">
                      {row.fmeapex}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Interactive Action Priority Simulator Tile ──── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FBFBFC] border-b border-slate-200" id="simulator">
        <div className="max-w-[1320px] mx-auto">
          <div className="max-w-[720px] mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-200 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
              <Cpu className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Interactive Simulator</span>
            </div>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-tight text-slate-900 leading-[1.08] ff-heading">
              Simulate Action Priority in Real-Time.
            </h2>
            <p className="mt-3 text-[16px] text-slate-600 leading-relaxed">
              Test how AIAG-VDA 2019 prioritizes Severity (S), Occurrence (O), and Detection (D) into High, Medium, or Low Action Priority. See firsthand why OEM auditors banned arbitrary RPN cutoffs.
            </p>
          </div>

          <div className="max-w-[1100px] mx-auto">
            <RiskCalculatorWidget />
          </div>
        </div>
      </section>

      {/* ── 8. Technical Specifications Architecture ────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200" id="specs">
        <div className="max-w-[1320px] mx-auto">
          <div className="max-w-[720px] mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
              <Server className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Enterprise Infrastructure</span>
            </div>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-tight text-slate-900 leading-[1.08] ff-heading">
              Engineered for Enterprise Manufacturing Scale.
            </h2>
            <p className="mt-3 text-[16px] text-slate-600 leading-relaxed">
              Row-level PostgreSQL data isolation, cryptographic SHA-256 digital signature chains, pre-signed Cloudflare R2 evidence storage, and one-command Docker on-premises deployment.
            </p>
          </div>

          {/* Technical Spec List */}
          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-200 overflow-hidden bg-[#FBFBFC]">
            {TECHNICAL_SPECS.map(([name, cat, detail]) => (
              <div key={name} className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-5 text-sm items-center hover:bg-white transition-colors">
                <div className="sm:col-span-4 font-mono font-bold text-slate-900 text-[13px]">
                  {name}
                </div>
                <div className="sm:col-span-2 text-xs font-mono text-[#FF5500] font-bold uppercase mt-1 sm:mt-0">
                  {cat}
                </div>
                <div className="sm:col-span-6 text-slate-600 text-xs sm:text-sm mt-1 sm:mt-0">
                  {detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Direct Engineering Contact & Demo ──────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FBFBFC]" id="contact">
        <div className="max-w-[1320px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Direct Outreach Info */}
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-200 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Talk to a Quality Architect</span>
              </div>
              <h2 className="text-[32px] sm:text-[42px] font-extrabold tracking-tight text-slate-900 leading-tight ff-heading">
                Ready to Upgrade Your Quality Infrastructure?
              </h2>
              <p className="text-[16px] leading-relaxed text-slate-600">
                Whether you need an on-premises air-gapped Docker deployment, migration from legacy Excel or APIS IQ databases, or an interactive demonstration for your CFT engineering team, our quality architects are ready.
              </p>

              <div className="space-y-3 font-mono text-xs text-slate-600 pt-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>SLA Response Window: <strong className="text-slate-900">Within 4 business hours</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
                  <span>Engineering Desk: <a href="mailto:quality@fmeapex.online" className="text-[#FF5500] font-bold hover:underline">quality@fmeapex.online</a></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Deployment Targets: Cloudflare Edge, Render Cloud, or Docker On-Prem</span>
                </div>
              </div>
            </div>

            {/* Right Column: Inquiry Submission Form */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-9 shadow-sm">
              {contactSuccess ? (
                <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Inquiry Dispatched</h3>
                  <p className="text-sm text-slate-600">
                    Thank you. An FMEA Quality Systems Architect will review your manufacturing details and respond within 4 business hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {contactError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                      {contactError}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Dr. Markus Weber"
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                        Corporate Email
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="m.weber@powertrain-oem.com"
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                        Manufacturing Facility / Plant
                      </label>
                      <input
                        type="text"
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        placeholder="Tier 1 Propulsion Assembly"
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                        Inquiry Scope
                      </label>
                      <select
                        value={contactForm.type}
                        onChange={(e) => setContactForm({ ...contactForm, type: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                      >
                        {INQUIRY_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                      Process Operations & Scope Details
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your current FMEA tooling (Excel, APIS IQ), number of assembly lines, or on-premises requirements..."
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {contactSubmitting ? 'Transmitting Details...' : 'Send Inquiry to Quality Team →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Handcrafted Technical Footer ─────────────────── */}
      <SiteFooter />
    </div>
  );
};

export default LandingPage;
