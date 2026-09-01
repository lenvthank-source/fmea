import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';

const TIERS = [
  {
    name: 'Preview',
    price: '$0',
    period: '',
    desc: 'Shared sandbox, 10 projects, no login required.',
    features: ['Up to 10 shared projects', 'No login required', 'All modules unlocked', 'Community support'],
    cta: 'Launch preview',
    to: '/login',
    highlight: false,
  },
  {
    name: 'Team',
    price: '$49',
    period: '/ mo per user',
    desc: 'Dedicated tenant, RBAC, unlimited projects.',
    features: ['Unlimited projects', 'Tenant isolation (RLS)', 'PFD ↔ PFMEA + Control Plan', 'AI Copilot with RAG', 'Evidence storage 50 MB/file'],
    cta: 'Start Team',
    to: '/login',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'On-prem Docker, licensed, with super-admin dashboard.',
    features: ['One-command docker compose up', 'License JWT (exp + seats)', 'Health & log endpoints', 'Fleet / health panels', 'Priority support'],
    cta: 'Contact us',
    to: '/about',
    highlight: false,
  },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <SEO
        title="Pricing — FMEApex | Preview $0, Team $49, Enterprise Custom"
        description="FMEApex pricing: free preview, $49/mo team, enterprise on-prem."
        canonical="/pricing"
      />
      <SiteHeader />

      {/* Hero */}
      <section className="pt-[120px] pb-14 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[760px] mx-auto text-center">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-[#0D9488] text-[12px] font-[650] uppercase tracking-[0.08em]">
            Pricing
          </span>
          <h1 className="mt-5 text-[40px] sm:text-[52px] leading-[1.05] font-[650] tracking-[-0.02em] text-[#0F172A]">
            Start free. Scale to on-prem.
          </h1>
          <p className="mt-4 text-[17px] text-[#5B6470] max-w-[520px] mx-auto">
            Transparent pricing — no per-document fees, no surprise lock-ins.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="pb-24 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-[20px] border p-8 flex flex-col bg-white transition-all ${
                t.highlight
                  ? 'border-[#0D9488] shadow-[0_24px_60px_-20px_rgba(13,148,136,0.25)]'
                  : 'border-[#E6E1D8] hover:shadow-[0_20px_44px_-18px_rgba(15,23,42,0.12)]'
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[#0D9488] text-white text-[11px] font-[650] uppercase tracking-[0.06em]">
                  Most popular
                </span>
              )}
              <h3 className="text-[20px] font-[650] text-[#0F172A]">{t.name}</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-[44px] font-[650] leading-none text-[#0F172A]">{t.price}</span>
                {t.period && <span className="text-[14px] text-[#8A8F98]">{t.period}</span>}
              </div>
              <p className="mt-3 text-[14px] text-[#5B6470] min-h-[44px]">{t.desc}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-[#0D9488]/10 flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                    </span>
                    <span className="text-[13.5px] leading-[1.5] text-[#334155]">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate(t.to)}
                className={`mt-8 w-full h-[48px] rounded-[12px] text-[14.5px] font-[600] transition-colors ${
                  t.highlight
                    ? 'bg-[#0D9488] text-white hover:bg-[#0F766E]'
                    : 'bg-[#0F172A] text-white hover:bg-[#1E293B]'
                }`}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-[13px] text-[#8A8F98] mt-10 max-w-[480px] mx-auto">
          All prices USD. Enterprise licensing is seat- and project-based — <span className="text-[#0D9488] font-[600]">contact us</span> for a quote.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
};
export default PricingPage;
