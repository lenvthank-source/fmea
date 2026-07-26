import React from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Paper, Grid, Breadcrumbs, Link, Chip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  NavigateNext, ExpandMore, Verified, ArrowForward, CheckCircle
} from '@mui/icons-material';
import { SEO } from '../../components/SEO/SEO';

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
      answer: 'The AIAG-VDA 7-Step FMEA methodology is a standardized quality risk assessment framework jointly developed by the AIAG and VDA in 2019. It replaces Risk Priority Numbers (RPN) with Action Priority (AP) matrices across 7 gated steps: 1. Planning, 2. Structure Analysis, 3. Function Analysis, 4. Failure Analysis, 5. Risk Analysis, 6. Optimization, and 7. Documentation.'
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
      { q: 'Can Action Priority (AP) values be manually changed?', a: 'No. Under AIAG-VDA 2019 rules, AP is a read-only field derived from Severity, Occurrence, and Detection lookup tables.' },
      { q: 'Is FMEApex compliant with IATF 16949 and AS9100?', a: 'Yes. FMEApex is fully audit-ready for IATF 16949 automotive quality standards and AS9100 aerospace requirements.' }
    ]
  },
  'pfd-pfmea-linking': {
    slug: 'pfd-pfmea-linking',
    title: 'How to Automate PFD to PFMEA Bidirectional Linking & Gap Analysis',
    seoTitle: 'PFD to PFMEA Bidirectional Linking & Gap Analysis | FMEApex',
    seoDesc: 'Eliminate process gap errors. Discover how bidirectional PFD to PFMEA synchronization ensures zero orphan steps in manufacturing.',
    badge: 'Process Engineering',
    updatedDate: 'July 2026',
    author: 'Elena Rostova, CQE',
    authorTitle: 'Principal Process Quality Director',
    definitionBlock: {
      question: 'What is PFD to PFMEA Bidirectional Linking?',
      answer: 'PFD to PFMEA bidirectional linking is a real-time data integration mechanism that synchronizes Process Flow Diagram (PFD) operation steps directly with Process Failure Mode and Effects Analysis (PFMEA) grids. Any modification to operation sequences, step numbers, or special characteristics instantly propagates in both directions.'
    },
    toc: [
      { id: 'problem', title: 'The Cost of Disconnected Process Flow Spreadsheets' },
      { id: 'how-it-works', title: 'How Bidirectional Linking Works in FMEApex' },
      { id: 'gap-analysis', title: 'Automated Gap Analysis & Zero-Orphan Policy' },
      { id: 'faq', title: 'Frequently Asked Questions' }
    ],
    content: [
      {
        id: 'problem',
        h2: 'The Cost of Disconnected Process Flow Spreadsheets',
        text: [
          'When Process Flow Diagrams (PFD) and PFMEAs are maintained in separate Excel spreadsheets, process engineering changes frequently fail to sync. Up to 30% of manufacturing line defects originate from out-of-date PFMEA rows that missed recent PFD process updates.'
        ]
      },
      {
        id: 'how-it-works',
        h2: 'How Bidirectional Linking Works in FMEApex',
        text: [
          'FMEApex enforces a unified relational schema. Creating or reordering an operation step in the PFD Workspace automatically updates the corresponding PFMEA structure tree, maintaining step numbers, operation names, and special characteristic flags.'
        ]
      },
      {
        id: 'gap-analysis',
        h2: 'Automated Gap Analysis & Zero-Orphan Policy',
        text: [
          'FMEApex automatically highlights PFD steps that lack a corresponding failure analysis chain as "Coverage Warnings", preventing quality teams from releasing incomplete process documentation.'
        ]
      }
    ],
    faq: [
      { q: 'What happens if a PFD step is deleted?', a: 'FMEApex warns the user of linked PFMEA failure mode dependencies before allowing deletion, keeping audit trails intact.' },
      { q: 'Can we import existing PFD Excel files?', a: 'Yes, FMEApex includes an automated Excel import parser that builds your PFD and PFMEA structure trees in seconds.' }
    ]
  },
  'control-plan-sync': {
    slug: 'control-plan-sync',
    title: 'Control Plan Synchronization & Real-Time PFMEA Integration',
    seoTitle: 'Control Plan Synchronization & PFMEA Integration | FMEApex',
    seoDesc: 'Automatically propagate prevention and detection controls from PFMEA to Control Plans. Ensure 100% compliance across your shop floor.',
    badge: 'Quality Control',
    updatedDate: 'July 2026',
    author: 'Marcus Vance, CQE',
    authorTitle: 'Lead Quality Systems Architect',
    definitionBlock: {
      question: 'What is Control Plan Synchronization?',
      answer: 'Control Plan Synchronization is an automated quality workflow where prevention methods, detection controls, reaction plans, and critical characteristics identified during PFMEA are automatically mapped into the production Control Plan in a single atomic transaction.'
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
    'dateModified': '2026-07-26'
  };

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 10 }}>
      <SEO
        title={article.seoTitle}
        description={article.seoDesc}
        canonical={`/en/learn/${article.slug}`}
        jsonLd={[articleSchema, faqSchema]}
      />

      {/* Hero Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', py: 8 }}>
        <Container maxWidth="lg">
          <Breadcrumbs separator={<NavigateNext fontSize="small" sx={{ color: '#94A3B8' }} />} sx={{ mb: 3 }}>
            <Link component={RouterLink} to="/" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#2DD4BF' } }}>Home</Link>
            <Link component={RouterLink} to="/en/learn/aiag-vda-7-step-fmea" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#2DD4BF' } }}>Learn Hub</Link>
            <Typography sx={{ color: '#2DD4BF', fontWeight: 600 }}>{article.badge}</Typography>
          </Breadcrumbs>

          <Chip label={article.badge} sx={{ bgcolor: 'rgba(45,212,191,0.15)', color: '#2DD4BF', fontWeight: 700, mb: 2 }} />
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, fontWeight: 800, lineHeight: 1.2, mb: 2 }}>
            {article.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', color: '#94A3B8', fontSize: '0.9rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Verified sx={{ color: '#2DD4BF', fontSize: '1.1rem' }} />
              <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 600 }}>{article.author}</Typography>
            </Box>
            <Typography variant="body2">• {article.authorTitle}</Typography>
            <Typography variant="body2">• Updated {article.updatedDate}</Typography>
          </Box>
        </Container>
      </Box>

      {/* Main Content Layout */}
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Grid container spacing={4}>
          {/* Main Article Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Princeton GEO Extractable Answer Block */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, borderLeft: '4px solid #0D9488', bgcolor: '#F0FDF4' }} className="ai-definition-block">
              <Typography variant="subtitle2" sx={{ color: '#0D9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                Key Definition & Summary
              </Typography>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 1, color: '#0F172A' }}>
                {article.definitionBlock.question}
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7 }}>
                {article.definitionBlock.answer}
              </Typography>
            </Paper>

            {/* Article Content Sections */}
            {article.content.map(sec => (
              <Box key={sec.id} id={sec.id} sx={{ mb: 5 }}>
                <Typography variant="h2" sx={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', mb: 2, pb: 1, borderBottom: '2px solid #E2E8F0' }}>
                  {sec.h2}
                </Typography>

                {sec.text.map((paragraph, idx) => (
                  <Typography key={idx} variant="body1" sx={{ color: '#334155', lineHeight: 1.8, fontSize: '1.02rem', mb: 2 }}>
                    {paragraph}
                  </Typography>
                ))}

                {sec.bulletPoints && (
                  <Box sx={{ my: 2, pl: 2 }}>
                    {sec.bulletPoints.map((pt, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                        <CheckCircle sx={{ color: '#0D9488', fontSize: '1.2rem', mt: 0.3 }} />
                        <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: 500 }}>{pt}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {sec.callout && (
                  <Paper elevation={0} sx={{ p: 2.5, my: 3, borderRadius: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                    <Typography variant="body2" sx={{ color: '#1E40AF', fontWeight: 600 }}>
                      💡 {sec.callout}
                    </Typography>
                  </Paper>
                )}
              </Box>
            ))}

            {/* FAQ Accordion */}
            <Box id="faq" sx={{ mt: 6 }}>
              <Typography variant="h2" sx={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', mb: 3 }}>
                Frequently Asked Questions
              </Typography>
              {article.faq.map((item, idx) => (
                <Accordion key={idx} sx={{ mb: 1.5, borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ fontWeight: 600, color: '#0F172A' }}>{item.q}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography sx={{ color: '#475569', lineHeight: 1.6 }}>{item.a}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Grid>

          {/* Sticky Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: 'sticky', top: 30 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', mb: 3, bgcolor: '#fff' }}>
                <Typography variant="subtitle2" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
                  Table of Contents
                </Typography>
                <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  {article.toc.map(item => (
                    <Box component="li" key={item.id} sx={{ mb: 1.5 }}>
                      <Typography
                        onClick={() => scrollTo(item.id)}
                        sx={{ cursor: 'pointer', color: '#334155', fontSize: '0.92rem', fontWeight: 500, '&:hover': { color: '#0D9488' }, transition: 'color 0.2s' }}
                      >
                        {item.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* Conversion CTA Box */}
              <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, background: 'linear-gradient(135deg, #0F172A 0%, #0D9488 100%)', color: '#fff' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                  Ready to Automate Your FMEAs?
                </Typography>
                <Typography variant="body2" sx={{ color: '#E2E8F0', mb: 3, lineHeight: 1.6 }}>
                  Test FMEApex instantly in our free guest sandbox. Zero setup required.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForward />}
                  sx={{ bgcolor: '#fff', color: '#0F172A', fontWeight: 700, '&:hover': { bgcolor: '#F1F5F9' } }}
                >
                  Start Free Trial
                </Button>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
