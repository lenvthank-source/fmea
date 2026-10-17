import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import {
  BookOpen,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface GlossaryData {
  term: string;
  slug: string;
  category: string;
  seoTitle: string;
  seoDesc: string;
  definition: string;
  details: string[];
  standardsRef: string;
}

const GLOSSARY: Record<string, GlossaryData> = {
  'action-priority': {
    term: 'Action Priority (AP)',
    slug: 'action-priority',
    category: 'AIAG-VDA 2019 Standard',
    seoTitle: 'What is Action Priority (AP) in FMEA? Definition & Matrix | FMEApex',
    seoDesc: 'Learn what Action Priority (AP) is in AIAG-VDA 2019 FMEA. Understand how AP replaces RPN and categorizes risk into High, Medium, or Low priority.',
    definition: 'Action Priority (AP) is a logic-table driven risk evaluation metric introduced in the AIAG-VDA 2019 FMEA manual that replaces the traditional Risk Priority Number (RPN). AP categorizes risk into High (H), Medium (M), or Low (L) urgency based on combinations of Severity, Occurrence, and Detection ratings, prioritizing severity above all else.',
    details: [
      'High AP: Indicates failure modes with severe consequences or high probability of escaping detection. Corrective action is mandatory with senior management review.',
      'Medium AP: Indicates moderate risk where process control improvements or design tweaks are strongly recommended to reduce occurrence or enhance detection.',
      'Low AP: Indicates low risk where existing prevention and detection controls are verified as sufficient and acceptable.',
      'Eliminates arbitrary RPN thresholds (such as RPN > 100) which frequently ignored catastrophic safety hazards having low occurrence (e.g. S=10, O=2, D=2 = RPN 40).'
    ],
    standardsRef: 'AIAG-VDA 2019 1st Edition §5.4 — Risk Analysis & AP Table 5.1'
  },
  'process-flow-diagram': {
    term: 'Process Flow Diagram (PFD)',
    slug: 'process-flow-diagram',
    category: 'Process Engineering',
    seoTitle: 'What is a Process Flow Diagram (PFD) in PFMEA? Definition | FMEApex',
    seoDesc: 'Discover how Process Flow Diagrams (PFD) define manufacturing operations, process steps, and special characteristics before PFMEA risk analysis.',
    definition: 'A Process Flow Diagram (PFD) is a sequential schematic detailing every operation, material handling step, automated workstation, inspection checkpoint, and scrap buffer in a manufacturing process, establishing the structural foundation for Step 2 of the PFMEA.',
    details: [
      'Assigns unique sequential operation numbers (e.g., Op 10, Op 20) and identifies 4M resources (Machine, Man, Material, Method).',
      'Establishes the mandatory structural baseline for PFMEA Step 2 Structure Analysis; zero orphan operations are permitted.',
      'Flags customer-designated Critical Characteristics (CC) and Significant Characteristics (SC) that flow down directly into shop-floor Control Plans.'
    ],
    standardsRef: 'AIAG-VDA 2019 Step 2 & IATF 16949 Section 8.3.5.2'
  },
  'control-plan': {
    term: 'Control Plan (CP)',
    slug: 'control-plan',
    category: 'Quality Documentation',
    seoTitle: 'What is a Control Plan in Manufacturing? Definition & Flow-Down | FMEApex',
    seoDesc: 'Understand the role of Control Plans (CP) in manufacturing quality, their linkage to PFMEA controls, and AIAG-VDA synchronization requirements.',
    definition: 'A Control Plan (CP) is an authoritative quality document describing the systems, measurement equipment, inspection frequencies, sample sizes, and reaction plans required at every process step to guarantee all product and process characteristics remain within engineering tolerances.',
    details: [
      'Covers three distinct phases: Prototype Control Plan, Pre-launch Control Plan, and Production Control Plan.',
      'Prevention and detection controls defined in the PFMEA (Step 5) flow down directly into inspection methods and reaction plans.',
      'Editing a parameter or tolerance in the Control Plan must synchronize bidirectionally back to the PFMEA in a serializable transaction.'
    ],
    standardsRef: 'AIAG APQP 3rd Edition & IATF 16949 Annex A'
  },
  '21-cfr-part-11': {
    term: '21 CFR Part 11 Compliance',
    slug: '21-cfr-part-11',
    category: 'Regulatory Standards',
    seoTitle: 'What is 21 CFR Part 11 in FMEA? Electronic Signatures & Audit Trails | FMEApex',
    seoDesc: 'Learn FDA 21 CFR Part 11 requirements for FMEA software: cryptographic digital signatures, immutable audit logs, and reviewer segregation.',
    definition: '21 CFR Part 11 is the Title 21 Code of Federal Regulations rule governing electronic records and electronic signatures. In quality engineering software, it mandates that digital signatures be cryptographically verifiable, document revisions be immutable once locked, and audit trails permanently record all modifications.',
    details: [
      'Cryptographic SHA-256 digital signatures with printed name of the signer, date/time stamp, and the specific meaning of the signing (e.g., Author, Reviewer, Approver).',
      'Strict reviewer segregation ensuring an engineer who authors an FMEA row cannot act as its sole reviewer or approver.',
      'Immutable audit trail stored in a dedicated database partition that enforces strict rejection of all UPDATE and DELETE commands.'
    ],
    standardsRef: 'FDA Title 21 CFR Part 11 & EU GMP Annex 11'
  }
};

export const GlossaryPage: React.FC = () => {
  const { term = 'action-priority' } = useParams<{ term: string }>();
  const navigate = useNavigate();
  const data = GLOSSARY[term] || GLOSSARY['action-priority'];

  return (
    <div className="bg-[#FBFBFC] min-h-screen text-slate-900 font-sans antialiased selection:bg-[#FF5500]/20 selection:text-slate-900">
      <SEO
        title={data.seoTitle}
        description={data.seoDesc}
        canonical={`/glossary/${term}`}
      />
      <SiteHeader />

      {/* Hero Header */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-tech-dots border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-6">
            <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/learn" className="hover:text-slate-900 transition-colors">Glossary</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">{data.term}</span>
          </div>

          <div className="max-w-[880px]">
            {/* Pill Capsule */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-xs mb-6">
              <BookOpen className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>{data.category}</span>
              <span className="text-slate-300">•</span>
              <span>Engineering Standard Term</span>
            </div>

            <h1 className="text-[34px] sm:text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-slate-900 mb-5 ff-heading">
              What is {data.term}?
            </h1>

            <p className="text-xs font-mono text-slate-500 mb-4">
              Reference: <strong className="text-slate-700">{data.standardsRef}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Term Navigation Tabs */}
      <section className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-[1320px] mx-auto flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-slate-400 font-bold uppercase tracking-wider mr-2 hidden sm:inline">
            Glossary:
          </span>
          {Object.values(GLOSSARY).map((g) => (
            <Link
              key={g.slug}
              to={`/glossary/${g.slug}`}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                g.slug === term
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {g.term}
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Definition & Takeaways */}
          <div className="lg:col-span-8 space-y-8">
            {/* Extractable Princeton GEO Box */}
            <div className="rounded-2xl border-2 border-slate-900 bg-white p-6 sm:p-9 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#FF5500]" />
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FF5500] mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Authoritative Engineering Definition</span>
              </div>
              <p className="text-[17px] sm:text-[19px] leading-[1.65] font-medium text-slate-900">
                {data.definition}
              </p>
            </div>

            {/* In-Depth Engineering Takeaways */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
              <h2 className="text-xl font-bold text-slate-900 ff-heading">
                Key Technical Takeaways & Manufacturing Application
              </h2>

              <div className="space-y-4">
                {data.details.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Platform Engines */}
            <div className="p-6 rounded-2xl bg-slate-100/70 border border-slate-200 text-xs font-mono text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <strong className="text-slate-900 block font-bold mb-0.5">Automated Implementation in FMEApex:</strong>
                <span>Enforced natively across all 7 steps with deterministic database lookup.</span>
              </div>
              <button
                onClick={() => navigate('/#simulator')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Test in AP Simulator</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF5500]" />
              </button>
            </div>
          </div>

          {/* Right Column: Sandbox Promotion */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
              <div className="text-xs font-mono text-[#FF5500] font-bold uppercase tracking-wider mb-2">
                Interactive Practice
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Experience {data.term} in Action
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Explore real Electric Drive Unit and Battery Laser Welding FMEAs pre-loaded with verified S/O/D ratings and AP calculations.
              </p>

              <button
                onClick={() => navigate('/login')}
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>Launch Free Sandbox</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF5500]" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-2xs space-y-3">
              <div className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                Explore Core Standards
              </div>
              <div className="space-y-2 text-xs">
                <Link to="/learn/aiag-vda-7-step-fmea" className="block text-slate-700 hover:text-[#FF5500] font-medium transition-colors">
                  → AIAG-VDA 2019 7-Step Handbook
                </Link>
                <Link to="/learn/pfd-pfmea-linking" className="block text-slate-700 hover:text-[#FF5500] font-medium transition-colors">
                  → PFD ↔ PFMEA Bidirectional Linking Guide
                </Link>
                <Link to="/learn/control-plan-sync" className="block text-slate-700 hover:text-[#FF5500] font-medium transition-colors">
                  → Control Plan Dynamic Flow-Down
                </Link>
                <Link to="/learn/21-cfr-part-11-fmea" className="block text-slate-700 hover:text-[#FF5500] font-medium transition-colors">
                  → 21 CFR Part 11 Digital Signatures
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default GlossaryPage;
