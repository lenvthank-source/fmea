import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import {
  Check,
  ArrowRight,
  ShieldCheck,
  Server,
  Users,
  FileCheck2,
  HelpCircle
} from 'lucide-react';

const TIERS = [
  {
    name: 'Guest Sandbox',
    tag: 'Instant Evaluation',
    price: '$0',
    period: 'free exploration',
    desc: 'Instant, friction-free access to explore the complete AIAG-VDA 7-step FMEA workspace with pre-populated automotive and battery datasets.',
    features: [
      'Instant 72-hour sandbox session',
      'Full 7-step PFMEA & DFMEA authoring',
      'PFD ↔ PFMEA bidirectional synchronization',
      'Deterministic Action Priority (AP) calculation',
      'Control Plan dynamic auto-generation',
      'Export to AIAG-VDA Excel reports',
    ],
    cta: 'Launch Instant Sandbox',
    to: '/login',
    highlight: false,
    icon: Users,
  },
  {
    name: 'Quality Engineering Team',
    tag: 'Production Plants',
    price: '$49',
    period: '/ seat / month',
    desc: 'Dedicated tenant-isolated cloud deployment for automotive and aerospace CFT quality engineering teams with Vector RAG knowledge retrieval.',
    features: [
      'Dedicated PostgreSQL tenant isolation (RLS)',
      'Tenant-isolated AI Copilot with vector RAG search',
      'PFD ↔ PFMEA ↔ Control Plan serializable sync',
      '50MB Cloudflare R2 evidence storage per action',
      'Mandatory High-AP corrective action tracking',
      'Granular Role-Based Access Control (22 scopes)',
      'Automated email notifications on action due dates',
    ],
    cta: 'Start Team Deployment',
    to: '/login',
    highlight: true,
    icon: ShieldCheck,
  },
  {
    name: 'Enterprise On-Premises',
    tag: 'Air-Gapped Compliance',
    price: 'Custom',
    period: 'annual site license',
    desc: 'Self-hosted Docker Compose deployment behind your corporate firewall for defense, aerospace, and medical plants requiring complete data sovereignty.',
    features: [
      'Single-command Docker Compose on-premises setup',
      '100% air-gapped deployment with zero external telemetry',
      '21 CFR Part 11 cryptographic signatures & locks',
      'Immutable audit log partition rejecting DELETE/UPDATE',
      'Enterprise SSO via SAML 2.0 / OIDC / Azure AD',
      'Custom PLM (Teamcenter/Windchill) & MES connectors',
      'Dedicated Quality Solutions Architect & SLA guarantee',
    ],
    cta: 'Talk to Enterprise Team',
    to: '/#contact',
    highlight: false,
    icon: Server,
  },
];

const COMPARISON_MATRIX = [
  { feature: '7-Step AIAG-VDA Authoring & Gating', sandbox: true, team: true, onprem: true },
  { feature: 'Deterministic Action Priority (AP) Engine', sandbox: true, team: true, onprem: true },
  { feature: 'PFD ↔ PFMEA Bidirectional Linking', sandbox: true, team: true, onprem: true },
  { feature: 'Dynamic Control Plan (CP) Flow-Down', sandbox: true, team: true, onprem: true },
  { feature: 'Excel / CSV Import & Export', sandbox: true, team: true, onprem: true },
  { feature: 'Dedicated PostgreSQL RLS Tenant Isolation', sandbox: false, team: true, onprem: true },
  { feature: 'Tenant-Isolated Vector RAG Copilot', sandbox: false, team: true, onprem: true },
  { feature: 'Cloudflare R2 Evidence Storage (50MB)', sandbox: false, team: true, onprem: true },
  { feature: 'Automated High-AP Corrective Action Flow', sandbox: false, team: true, onprem: true },
  { feature: '21 CFR Part 11 Electronic Signatures & Locks', sandbox: false, team: false, onprem: true },
  { feature: 'Immutable Audit Log Database Partition', sandbox: false, team: false, onprem: true },
  { feature: 'Air-Gapped Docker On-Premises Deployment', sandbox: false, team: false, onprem: true },
  { feature: 'SSO / SAML 2.0 / OIDC Integration', sandbox: false, team: false, onprem: true },
  { feature: 'Dedicated Quality Architect Onboarding', sandbox: false, team: false, onprem: true },
];

const FAQS = [
  {
    q: 'Can FMEApex be deployed completely air-gapped without an internet connection?',
    a: 'Yes. Our Enterprise On-Premises license ships as a verified Docker Compose bundle that runs entirely within your internal corporate intranet, firewall, or air-gapped factory network with zero external data telemetry.',
  },
  {
    q: 'How does the free Guest Sandbox work?',
    a: 'The Guest Sandbox requires zero credit cards or registration. It instantly provisions an isolated session loaded with real-world Electric Drive Unit and Battery Laser Welding manufacturing data so you can test all 7 steps immediately.',
  },
  {
    q: 'How are legacy Excel spreadsheets migrated into FMEApex?',
    a: 'FMEApex provides a structured import wizard that maps standard AIAG-VDA 2019 Excel columns (Process Steps, 4M Elements, Failure Modes, Causes, Effects, S/O/D ratings) directly into the relational database with automatic validation.',
  },
  {
    q: 'What regulatory standards does the platform comply with?',
    a: 'FMEApex is engineered around AIAG-VDA 2019 (1st Edition), IATF 16949 §8.3.5 requirements, ISO 9001:2015 risk management, and 21 CFR Part 11 / EU Annex 11 electronic records regulations.',
  },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FBFBFC] min-h-screen text-slate-900 font-sans antialiased selection:bg-[#FF5500]/20 selection:text-slate-900">
      <SEO
        title="Pricing & Deployment — FMEApex | Transparent Quality OS Plans"
        description="FMEApex pricing: free guest sandbox, $49/seat team plan, and enterprise on-premises air-gapped Docker deployments."
        canonical="/pricing"
      />
      <SiteHeader />

      {/* Hero */}
      <section className="pt-32 sm:pt-40 pb-16 px-4 sm:px-6 lg:px-8 bg-tech-dots border-b border-slate-200">
        <div className="max-w-[840px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-xs mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
            <span>Deployment Architecture & Pricing</span>
          </div>
          <h1 className="text-[38px] sm:text-[54px] font-extrabold leading-[1.06] tracking-[-0.035em] text-slate-900 mb-5 ff-heading">
            Start in sandbox.<br />
            <span className="text-[#FF5500]">Scale to plant-wide compliance.</span>
          </h1>
          <p className="text-[17px] sm:text-[20px] leading-[1.6] text-slate-600 max-w-[640px] mx-auto">
            Zero setup friction. Explore every module in the free guest sandbox, then upgrade when your engineering plant is ready for dedicated multi-tenant cloud or on-premises Docker.
          </p>
        </div>
      </section>

      {/* Tiers Grid */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto grid md:grid-cols-3 gap-8 items-stretch">
          {TIERS.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.name}
                className={`rounded-2xl p-7 sm:p-9 flex flex-col justify-between transition-all ${
                  t.highlight
                    ? 'bg-slate-900 text-white border-2 border-slate-900 shadow-xl relative'
                    : 'bg-[#FBFBFC] text-slate-900 border border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {t.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-[#FF5500] text-white text-[11px] font-mono font-bold uppercase tracking-wider shadow-xs">
                    Recommended for Plants
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded ${
                      t.highlight ? 'bg-slate-800 text-[#FF5500]' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {t.tag}
                    </span>
                    <Icon className={`w-5 h-5 ${t.highlight ? 'text-[#FF5500]' : 'text-slate-400'}`} />
                  </div>

                  <h3 className="text-xl font-extrabold">{t.name}</h3>
                  <p className={`text-xs mt-2 leading-relaxed ${t.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                    {t.desc}
                  </p>

                  <div className={`mt-6 mb-7 pb-6 border-b ${t.highlight ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className="text-[40px] font-black font-mono tracking-tight">{t.price}</span>
                    <span className={`text-xs ml-2 font-mono ${t.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t.period}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {t.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${t.highlight ? 'text-[#FF5500]' : 'text-emerald-600'}`} />
                        <span className={t.highlight ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6">
                  <button
                    onClick={() => navigate(t.to)}
                    className={`w-full h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      t.highlight
                        ? 'bg-[#FF5500] hover:bg-[#E04B00] text-white shadow-md'
                        : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs'
                    }`}
                  >
                    <span>{t.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FBFBFC] border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto">
          <div className="max-w-[720px] mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-200 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
              <FileCheck2 className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Full Comparison</span>
            </div>
            <h2 className="text-[32px] sm:text-[42px] font-extrabold tracking-tight text-slate-900 ff-heading">
              Compare Platform Capabilities
            </h2>
            <p className="mt-2 text-[15.5px] text-slate-600">
              Detailed breakdown of technical features and compliance controls across deployment tiers.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="grid grid-cols-12 bg-slate-900 text-white p-4 sm:p-5 text-xs font-mono font-bold uppercase tracking-wider">
              <div className="col-span-6 sm:col-span-6">Capability</div>
              <div className="col-span-2 text-center">Sandbox</div>
              <div className="col-span-2 text-center text-[#FF5500]">Team</div>
              <div className="col-span-2 text-center">On-Prem</div>
            </div>

            <div className="divide-y divide-slate-100">
              {COMPARISON_MATRIX.map((row) => (
                <div key={row.feature} className="grid grid-cols-12 p-3.5 sm:p-4 text-xs items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-6 font-medium text-slate-800">
                    {row.feature}
                  </div>
                  <div className="col-span-2 text-center">
                    {row.sandbox ? (
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-slate-300 font-mono">—</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    {row.team ? (
                      <Check className="w-4 h-4 text-[#FF5500] mx-auto font-bold" />
                    ) : (
                      <span className="text-slate-300 font-mono">—</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    {row.onprem ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto font-bold" />
                    ) : (
                      <span className="text-slate-300 font-mono">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise FAQs */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto">
          <div className="max-w-[720px] mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Technical FAQ</span>
            </div>
            <h2 className="text-[32px] sm:text-[42px] font-extrabold tracking-tight text-slate-900 ff-heading">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-[1100px]">
            {FAQS.map((faq) => (
              <div key={faq.q} className="p-6 rounded-2xl bg-[#FBFBFC] border border-slate-200">
                <h4 className="text-base font-bold text-slate-900 mb-2">
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default PricingPage;
