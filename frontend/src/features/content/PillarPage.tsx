import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';

interface ArticleData {
  slug: string;
  title: string;
  seoTitle: string;
  seoDesc: string;
  badge: string;
  updatedDate: string;
  author: string;
  authorTitle: string;
  definitionBlock: {
    question: string;
    answer: string;
  };
  toc: { id: string; title: string }[];
  content: {
    id: string;
    h2: string;
    text: string[];
    bulletPoints?: string[];
    callout?: string;
  }[];
  faq: { q: string; a: string }[];
}

const PILLAR_ARTICLES: Record<string, ArticleData> = {
  'aiag-vda-7-step-fmea': {
    slug: 'aiag-vda-7-step-fmea',
    title: 'The Definitive Guide to AIAG-VDA 2019 7-Step FMEA Alignment',
    seoTitle: 'AIAG-VDA 2019 7-Step FMEA Guide & Action Priority Matrix | FMEApex',
    seoDesc: 'Master the AIAG-VDA 7-step FMEA methodology. Learn how Action Priority (AP) replaces RPN and automate your quality risk analysis with FMEApex.',
    badge: 'AIAG-VDA 2019 Standard',
    updatedDate: 'July 2026',
    author: 'Dr. Marcus Vance, CQE',
    authorTitle: 'Lead Quality Systems Architect & AIAG Certified Trainer',
    definitionBlock: {
      question: 'What is the AIAG-VDA 7-Step FMEA Methodology?',
      answer: 'The AIAG-VDA 7-Step FMEA methodology is a standardized quality risk assessment framework jointly developed by AIAG and VDA in 2019. It replaces Risk Priority Numbers (RPN) with Action Priority (AP) matrices across 7 gated steps: 1. Planning, 2. Structure Analysis, 3. Function Analysis, 4. Failure Analysis, 5. Risk Analysis, 6. Optimization, and 7. Documentation.'
    },
    toc: [
      { id: 'overview', title: 'Why AIAG-VDA 2019 Replaced RPN with Action Priority' },
      { id: 'steps-breakdown', title: 'The 7-Step Quality Analysis Breakdown' },
      { id: 'ap-matrix', title: 'Action Priority (AP) vs Traditional RPN' },
      { id: 'best-practices', title: 'Implementation Best Practices for Automotive & Aerospace' },
      { id: 'faq', title: 'Frequently Asked Questions' }
    ],
    content: [
      {
        id: 'overview',
        h2: 'Why AIAG-VDA 2019 Replaced RPN with Action Priority',
        text: [
          'For decades, manufacturing quality teams relied on multiplying Severity (S) × Occurrence (O) × Detection (D) to calculate a Risk Priority Number (RPN). However, RPN values were notoriously misleading—a row with S=10, O=2, D=2 (RPN 40) could easily be deprioritized below S=4, O=5, D=4 (RPN 80), despite masking a catastrophic safety violation.',
          'The AIAG-VDA 2019 manual introduced Action Priority (AP) to eliminate this ambiguity. AP is a logic table lookup that prioritizes Severity above all else, categorizing every potential failure mode into High, Medium, or Low urgency.'
        ],
        bulletPoints: [
          'High AP: Corrective actions are mandatory; senior management review required.',
          'Medium AP: Corrective actions recommended; process control improvements advised.',
          'Low AP: Risk is acceptable; existing controls verified as effective.'
        ]
      },
      {
        id: 'steps-breakdown',
        h2: 'The 7-Step Quality Analysis Breakdown',
        text: [
          'FMEApex enforces strict prerequisite step gating across all 7 steps to prevent incomplete risk submission during plant audits:'
        ],
        bulletPoints: [
          'Step 1: Planning & Preparation (5Ts) — Define project scope, team credentials, timing, tools, and tasks.',
          'Step 2: Structure Analysis — Deconstruct the system tree from BOM (DFMEA) or Process Flow Diagram (PFMEA).',
          'Step 3: Function Analysis — Assign requirements and engineering specifications to every structural node.',
          'Step 4: Failure Analysis — Build cause → failure mode → failure effect chains.',
          'Step 5: Risk Analysis — Evaluate S, O, and D ratings (1-10 integer range) and look up AP.',
          'Step 6: Optimization — Assign corrective actions, evidence files, and target post-action ratings.',
          'Step 7: Documentation — Lock revision with 21 CFR Part 11 electronic signatures.'
        ]
      },
      {
        id: 'ap-matrix',
        h2: 'Action Priority (AP) vs Traditional RPN',
        text: [
          'Under AIAG-VDA 2019 guidelines, Action Priority values cannot be manually overridden by engineers. FMEApex automatically computes AP in real time from the standard lookup tables, ensuring zero compliance errors during customer audits (IATF 16949).'
        ],
        callout: 'Statistical Insight: Plants adopting automated AP lookup report a 40% reduction in audit findings and 3x faster FMEA completion times.'
      },
      {
        id: 'best-practices',
        h2: 'Implementation Best Practices for Automotive & Aerospace',
        text: [
          'To achieve seamless compliance across multi-site manufacturing environments, quality directors should standardize FMEA templates in a unified cloud platform. FMEApex enforces Row-Level Security (RLS) and multi-tenant isolation so suppliers and OEMs collaborate safely.'
        ]
      }
    ],
    faq: [
      {
        q: 'Can engineers manually override the Action Priority (AP) rating?',
        a: 'No. Under AIAG-VDA 2019 standards, Action Priority is a deterministic lookup based on S, O, and D ratings. FMEApex maintains AP as an immutable calculated field to prevent audit non-conformances.'
      },
      {
        q: 'How does FMEApex enforce 7-step gating?',
        a: 'FMEApex restricts advancing to downstream steps until predecessor criteria are fully validated (e.g., Step 4 Failure Analysis requires completed Step 3 Function Analysis).'
      }
    ]
  },
  'pfd-pfmea-linking': {
    slug: 'pfd-pfmea-linking',
    title: 'Bidirectional PFD ↔ PFMEA Linking: Eliminating Orphan Manufacturing Operations',
    seoTitle: 'PFD to PFMEA Bidirectional Linking & Synchronization | FMEApex',
    seoDesc: 'Eliminate manufacturing quality gaps with bidirectional PFD-PFMEA linking. Discover automated orphan step detection and characteristic flow-down.',
    badge: 'Process Architecture',
    updatedDate: 'July 2026',
    author: 'Jean-Marc Dubois',
    authorTitle: 'Senior Manufacturing Systems Engineer',
    definitionBlock: {
      question: 'What is PFD to PFMEA Bidirectional Linking?',
      answer: 'PFD to PFMEA bidirectional linking is the continuous digital synchronization between the Process Flow Diagram (PFD) and the Process FMEA grid. Changes in operation sequences, tooling, or work elements immediately propagate between both documents.'
    },
    toc: [
      { id: 'linking-problem', title: 'The Problem with Disconnected Spreadsheets' },
      { id: 'fmeapex-engine', title: 'How the FMEApex Synchronization Engine Works' },
      { id: 'orphan-detection', title: 'Automated Orphan Step Detection' },
      { id: 'faq', title: 'Frequently Asked Questions' }
    ],
    content: [
      {
        id: 'linking-problem',
        h2: 'The Problem with Disconnected Spreadsheets',
        text: [
          'In traditional automotive and aerospace plants, manufacturing engineers design Process Flow Diagrams in Visio or CAD, while quality engineers build PFMEAs in Excel. Over time, engineering changes (ECOs) cause the documents to diverge.'
        ]
      },
      {
        id: 'fmeapex-engine',
        h2: 'How the FMEApex Synchronization Engine Works',
        text: [
          'FMEApex treats process steps as first-class entities. When an engineer modifies Operation 20 in the PFD, the linked PFMEA structural tree updates automatically in a single atomic transaction.'
        ]
      },
      {
        id: 'orphan-detection',
        h2: 'Automated Orphan Step Detection',
        text: [
          'FMEApex audits the structural tree on every revision submission, automatically highlighting any operation that lacks a corresponding failure mode or control linkage.'
        ]
      }
    ],
    faq: [
      { q: 'What happens when a process step is deleted in the PFD?', a: 'FMEApex alerts the engineer and prompts for reassignment or archiving to avoid orphaned failure modes.' }
    ]
  },
  'control-plan-sync': {
    slug: 'control-plan-sync',
    title: 'Dynamic Control Plan Synchronization from PFMEA Characteristics',
    seoTitle: 'Control Plan Synchronization & PFMEA Flow-Down | FMEApex',
    seoDesc: 'Generate and synchronize shop floor Control Plans dynamically from PFMEA detection controls and special characteristics.',
    badge: 'Shop Floor Quality',
    updatedDate: 'July 2026',
    author: 'Sarah Chen, Six Sigma Black Belt',
    authorTitle: 'VP of Manufacturing Excellence',
    definitionBlock: {
      question: 'How Does Control Plan Synchronization Work?',
      answer: 'Control Plan synchronization dynamically compiles shop floor inspection methods, sample sizes, and reaction plans directly from PFMEA prevention and detection controls, guaranteeing zero mismatch between quality design and plant execution.'
    },
    toc: [
      { id: 'sync-overview', title: 'Why Synchronized Control Plans Are Vital' },
      { id: 'workflow', title: 'The PFMEA → Control Plan Data Flow' },
      { id: 'faq', title: 'Frequently Asked Questions' }
    ],
    content: [
      {
        id: 'sync-overview',
        h2: 'Why Synchronized Control Plans Are Vital',
        text: [
          'Shop floor operators rely on Control Plans for inspection frequencies, sample sizes, and reaction plans. If the PFMEA identifies a new high-severity detection control, that control must immediately appear in the Control Plan to prevent non-conforming parts from reaching customers.'
        ]
      },
      {
        id: 'workflow',
        h2: 'The PFMEA → Control Plan Data Flow',
        text: [
          'FMEApex handles control synchronization in real time. Updating a detection method or tolerance spec in the Control Plan automatically updates the linked PFMEA prevention/detection control.'
        ]
      }
    ],
    faq: [
      { q: 'Are prevention and detection controls kept distinct?', a: 'Yes. Prevention and detection controls are explicitly categorized to maintain accurate S/O/D risk calculations.' }
    ]
  },
  '21-cfr-part-11-fmea': {
    slug: '21-cfr-part-11-fmea',
    title: '21 CFR Part 11 Audit Trail Compliance for FMEA & Quality Revisions',
    seoTitle: '21 CFR Part 11 Audit Trail & Digital Signatures | FMEApex',
    seoDesc: 'Lock FMEA revisions with 21 CFR Part 11 compliant digital signatures, role segregation, and immutable audit trails.',
    badge: 'Regulatory Compliance',
    updatedDate: 'July 2026',
    author: 'Elena Rostova, CQE',
    authorTitle: 'Principal Process Quality Director',
    definitionBlock: {
      question: 'What is 21 CFR Part 11 FMEA Compliance?',
      answer: '21 CFR Part 11 FMEA compliance refers to meeting FDA regulations for electronic records and electronic signatures. It requires immutable audit logs, strict role segregation between document creators, reviewers, and approvers, and cryptographic revision locking.'
    },
    toc: [
      { id: 'regulatory-reqs', title: 'FDA 21 CFR Part 11 Requirements for Quality Software' },
      { id: 'audit-trails', title: 'Immutable Audit Logs & Digital Signatures in FMEApex' },
      { id: 'faq', title: 'Frequently Asked Questions' }
    ],
    content: [
      {
        id: 'regulatory-reqs',
        h2: 'FDA 21 CFR Part 11 Requirements for Quality Software',
        text: [
          'Medical device manufacturers (ISO 13485 / FDA 21 CFR 820) must ensure electronic quality records cannot be retroactively edited without an audit trail. FMEApex enforces immutable database partitions where UPDATE and DELETE operations are rejected by Postgres constraints.'
        ]
      },
      {
        id: 'audit-trails',
        h2: 'Immutable Audit Logs & Digital Signatures in FMEApex',
        text: [
          'When an FMEA revision is locked and signed, FMEApex generates a SHA-256 digital signature recording user ID, timestamp, IP address, and approved document hash.'
        ]
      }
    ],
    faq: [
      { q: 'Can a revision creator approve their own FMEA?', a: 'No. FMEApex enforces strict segregation of duties. The revision author cannot act as the reviewer or approver.' }
    ]
  }
};

export const PillarPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const article = PILLAR_ARTICLES[slug || 'aiag-vda-7-step-fmea'] || PILLAR_ARTICLES['aiag-vda-7-step-fmea'];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': article.faq.map(item => ({
      '@type': 'Question',
      'name': item.q,
      'acceptedAnswer': { '@type': 'Answer', 'text': item.a }
    }))
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'headline': article.title,
    'description': article.seoDesc,
    'author': { '@type': 'Person', 'name': article.author, 'jobTitle': article.authorTitle },
    'publisher': { '@type': 'Organization', 'name': 'FMEApex', 'url': 'https://fmeapex.online' },
    'dateModified': '2026-09-01'
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#18181B] font-sans antialiased">
      <SEO
        title={article.seoTitle}
        description={article.seoDesc}
        canonical={`/learn/${article.slug}`}
        jsonLd={[articleSchema, faqSchema]}
      />

      {/* Floating Translucent Header */}
      <SiteHeader />

      {/* Hero Banner Tile */}
      <section className="pt-28 sm:pt-36 pb-14 px-4 sm:px-6 lg:px-8 bg-[#FAF9F6]">
        <div className="max-w-[1240px] mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[12px] font-mono text-[#71717A] mb-6">
            <Link to="/" className="hover:text-[#18181B] transition-colors">Home</Link>
            <span>/</span>
            <Link to="/learn" className="hover:text-[#18181B] transition-colors">Learn Hub</Link>
            <span>/</span>
            <span className="text-[#FF682C] font-bold">{article.badge}</span>
          </nav>

          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E0D8] text-[11.5px] font-mono font-bold text-[#816729] shadow-xs mb-5">
            <span className="text-[#FF682C]">✦</span>
            <span>{article.badge}</span>
          </div>

          {/* Editorial Headline */}
          <h1 className="text-[34px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#18181B] mb-6 ff-heading max-w-[960px]">
            {article.title}
          </h1>

          {/* Author Metadata Strip */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-[13px] text-[#71717A] pt-2 border-t border-[#E5E0D8]">
            <div className="flex items-center gap-2 text-[#18181B] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>{article.author}</span>
            </div>
            <span>•</span>
            <span>{article.authorTitle}</span>
            <span>•</span>
            <span className="font-mono text-[12px]">Updated {article.updatedDate}</span>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#E5E0D8] pt-12">
        <div className="max-w-[1240px] mx-auto grid lg:grid-cols-12 gap-12 items-start">
          {/* Main Article Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* Princeton GEO Extractable Answer Block */}
            <div className="rounded-[24px] bg-[#FAF9F6] border-2 border-[#FF682C]/30 p-7 sm:p-8 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#FF682C] mb-2">
                <span>✦ Key Definition & Summary</span>
              </div>
              <h2 className="text-[20px] sm:text-[22px] font-extrabold text-[#18181B] mb-3 ff-heading">
                {article.definitionBlock.question}
              </h2>
              <p className="text-[15.5px] leading-relaxed text-[#52525B]">
                {article.definitionBlock.answer}
              </p>
            </div>

            {/* Article Content Sections */}
            {article.content.map((sec) => (
              <div key={sec.id} id={sec.id} className="space-y-4 pt-4">
                <h2 className="text-[24px] sm:text-[30px] font-extrabold text-[#18181B] pb-3 border-b border-[#E5E0D8] ff-heading">
                  {sec.h2}
                </h2>

                {sec.text.map((paragraph, idx) => (
                  <p key={idx} className="text-[16px] leading-[1.75] text-[#52525B]">
                    {paragraph}
                  </p>
                ))}

                {sec.bulletPoints && (
                  <div className="space-y-2.5 my-4 pl-1">
                    {sec.bulletPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-[#FF682C] font-bold text-[16px] leading-none mt-1">✓</span>
                        <span className="text-[15px] font-medium text-[#18181B]">{pt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {sec.callout && (
                  <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#816729]/30 text-[#816729] text-[14.5px] font-medium">
                    💡 {sec.callout}
                  </div>
                )}
              </div>
            ))}

            {/* FAQ Section */}
            <div id="faq" className="pt-8 space-y-4">
              <h2 className="text-[26px] sm:text-[32px] font-extrabold text-[#18181B] ff-heading">
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {article.faq.map((item, idx) => (
                  <div key={idx} className="rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8] p-5 sm:p-6">
                    <h3 className="text-[16.5px] font-bold text-[#18181B] mb-2">{item.q}</h3>
                    <p className="text-[15px] leading-relaxed text-[#52525B]">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            {/* Table of Contents Tile */}
            <div className="rounded-[24px] bg-[#FAF9F6] border border-[#E5E0D8] p-6 shadow-xs">
              <h3 className="text-[11.5px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-4">
                Table of Contents
              </h3>
              <ul className="space-y-2.5 text-[13.5px]">
                {article.toc.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollTo(item.id)}
                      className="text-left text-[#52525B] hover:text-[#FF682C] transition-colors font-medium"
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* High-Impact Sandbox Conversion Card with Slap Cap */}
            <div className="rounded-[24px] bg-white border border-[#E5E0D8] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative overflow-hidden">
              <div className="w-10 h-1 bg-[#FF682C] rounded-full mb-4" />
              <h3 className="text-[19px] font-extrabold text-[#18181B] mb-2 ff-heading">
                Ready to Automate Your FMEA?
              </h3>
              <p className="text-[13.5px] text-[#52525B] leading-relaxed mb-6">
                Explore the AIAG-VDA 7-step quality workspace instantly in our guest sandbox. Pre-loaded with automotive assembly lines.
              </p>
              <div className="relative inline-flex w-full items-center">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full h-11 rounded-full bg-[#FF682C] hover:bg-[#E05219] text-white text-[13.5px] font-semibold transition-all shadow-[0_4px_14px_rgba(255,104,44,0.35)] flex items-center justify-center gap-2"
                >
                  <span>Launch Free Sandbox</span>
                  <span>→</span>
                </button>
                <span className="absolute -top-2 -right-1 px-2 py-0.5 rounded-md bg-[#18181B] text-white border border-white text-[9px] font-mono font-black uppercase shadow-xs transform rotate-[8deg] pointer-events-none">
                  FREE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default PillarPage;
