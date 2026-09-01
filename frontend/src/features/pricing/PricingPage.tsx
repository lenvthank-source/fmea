import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';

const TIERS = [
  {
    name: 'Guest Sandbox',
    price: '$0',
    period: 'free forever',
    desc: 'Instant exploration of the AIAG-VDA 7-step FMEA workspace. No credit card required.',
    features: ['Instant sandbox workspace', 'PFD ↔ PFMEA bidirectional linking', 'Action Priority (AP) calculator', 'Deterministic S/O/D risk matrix', 'Export to Excel reports'],
    cta: 'Launch Sandbox',
    to: '/login',
    highlight: false,
  },
  {
    name: 'Quality Engineering Team',
    price: '$49',
    period: '/ seat / month',
    desc: 'Dedicated tenant isolation with AI Copilot RAG, Control Plan synchronization, and Cloudflare R2 evidence.',
    features: ['Dedicated tenant isolation (RLS)', 'AI Copilot with vector RAG search', 'PFD ↔ PFMEA ↔ Control Plan sync', '50MB Cloudflare R2 evidence storage', 'Automated high-AP corrective action flow', 'Role-based access control (RBAC 22 scopes)'],
    cta: 'Start Team Workspace',
    to: '/login',
    highlight: true,
  },
  {
    name: 'Enterprise On-Prem',
    price: 'Custom',
    period: 'annual license',
    desc: 'Self-hosted Docker deployment behind your corporate firewall with 21 CFR Part 11 compliance.',
    features: ['Single-command Docker Compose on-prem', '21 CFR Part 11 digital signatures & locks', 'SSO / SAML 2.0 / OIDC integration', 'Immutable audit log partition', 'Dedicated SLA & engineering onboarding', 'Custom PLM / ERP / MES connectors'],
    cta: 'Talk to Enterprise Team',
    to: '/#contact',
    highlight: false,
  },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#18181B] font-sans antialiased">
      <SEO
        title="Pricing — FMEApex | Transparent Quality Platform Plans"
        description="FMEApex pricing: free guest sandbox, $49/seat team plan, and enterprise on-premise Docker deployment."
        canonical="/pricing"
      />
      <SiteHeader />

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[820px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E0D8] text-[11.5px] font-mono font-bold text-[#816729] shadow-xs mb-6">
            <span className="text-[#FF682C]">✦</span>
            <span>Transparent Pricing</span>
          </div>
          <h1 className="text-[38px] sm:text-[54px] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#18181B] mb-5 ff-heading">
            Start in sandbox.<br />Scale to plant-wide compliance.
          </h1>
          <p className="text-[17px] sm:text-[19px] leading-[1.6] text-[#52525B] max-w-[620px] mx-auto">
            Zero setup friction. Explore every module in guest sandbox, then upgrade when your engineering plant is ready.
          </p>
        </div>
      </section>

      {/* Tiers Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1340px] mx-auto grid md:grid-cols-3 gap-7">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`rounded-[28px] p-8 sm:p-9 flex flex-col justify-between transition-all ${
                t.highlight
                  ? 'bg-white border-2 border-[#FF682C] shadow-[0_12px_40px_rgba(255,104,44,0.12)] relative'
                  : 'bg-white border border-[#E5E0D8] shadow-xs hover:border-[#D4D4D8]'
              }`}
            >
              {t.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FF682C] text-white text-[11px] font-mono font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-[20px] font-extrabold text-[#18181B]">{t.name}</h3>
                <p className="text-[13.5px] text-[#71717A] mt-1.5 leading-relaxed">{t.desc}</p>
                <div className="mt-6 mb-7 pb-7 border-b border-[#E5E0D8]">
                  <span className="text-[44px] font-extrabold text-[#18181B] font-mono">{t.price}</span>
                  <span className="text-[13px] text-[#71717A] ml-2 font-mono">{t.period}</span>
                </div>

                <div className="space-y-3 text-[13.5px] text-[#52525B]">
                  {t.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <span className="text-[#FF682C] font-bold">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E5E0D8]">
                <button
                  onClick={() => navigate(t.to)}
                  className={`w-full h-12 rounded-full text-[14px] font-semibold transition-all ${
                    t.highlight
                      ? 'bg-[#FF682C] hover:bg-[#E05219] text-white shadow-[0_4px_14px_rgba(255,104,44,0.3)]'
                      : 'border border-[#18181B] hover:bg-[#18181B] hover:text-white text-[#18181B]'
                  }`}
                >
                  {t.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default PricingPage;
