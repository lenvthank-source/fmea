import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';

const TIERS = [
  {
    name: 'Preview',
    price: '$0',
    desc: '10 shared projects, no login, anyone can edit — try at try.fmeapex.online',
    features: ['Up to 10 projects', 'No login required', 'Shared demo tenant', 'Feedback widget'],
    cta: 'Try Preview',
    to: '/login',
    highlight: false,
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    desc: 'Per month, tenant-isolated, 21 CFR ready',
    features: ['Unlimited projects', 'RBAC 22 perms', 'PFD↔PFMEA + Control Plan', 'R2 evidence 50MB'],
    cta: 'Start Team',
    to: '/login',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'On-prem Docker, license `exp + maxSeats`, super-admin health/logs',
    features: ['docker compose up -d', 'License JWT RS256', 'Pino logs + requestId', 'Super-admin Fleet/Health'],
    cta: 'Contact Sales',
    to: '/about',
    highlight: false,
  },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080A19] text-white font-sans antialiased">
      <SEO title="Pricing — FMEApex | Preview $0, Team $49, Enterprise Custom" description="FMEApex pricing: Preview $0 (10 projects, no login), Team $49, Enterprise custom on-prem with license." canonical="/pricing" />

      {/* Hero Section */}
      <section className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080A19] via-[#080A19] to-[#050505] z-0" />
        <div className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-20">
          <div className="max-w-[720px] mx-auto text-center">
            <h1 className="text-white text-[36px] sm:text-[48px] md:text-[56px] lg:text-[64px] font-normal leading-[1.05] tracking-[-0.02em] mb-6">
              Pricing — Start Free, Scale to On-Prem
            </h1>
            <p className="text-white/50 text-[16px] sm:text-[18px] md:text-[20px] font-[450] leading-[1.5] max-w-[640px] mx-auto">
              From <code className="bg-[#050505] px-2 py-0.5 rounded-[6px] text-[#0D9488] font-mono text-[12px]">frontend/public/pricing.md</code> Guest $0 5 projects → Preview $0 10 projects shared. One command deploy for enterprise.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="bg-[#050505] py-24 sm:py-32 border-y border-white/[0.07]">
        <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px] sm:gap-[24px]">
            {TIERS.map((t, i) => (
              <div
                key={t.name}
                className={`
                  relative p-8 rounded-[24px] sm:rounded-[28px]
                  bg-[#0d0d0d] border ${
                    t.highlight
                      ? 'border-[2px] border-[#0D9488]'
                      : 'border border-white/[0.09]'
                  }
                  transition-all duration-300 ease-out
                  hover:border-[#0D9488] hover:bg-[#121212] hover:-translate-y-[4px]
                  flex flex-col
                `}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="mb-4">
                  <h3 className="text-white text-[20px] sm:text-[22px] font-[450] leading-[1.2] mb-2">
                    {t.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-[42px] sm:text-[48px] font-[450] leading-[1]">
                      {t.price}
                    </span>
                    {t.period && (
                      <span className="text-white/50 text-[15px] font-[450]">
                        {t.period}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] leading-[1.5] mb-8 min-h-[48px]">
                  {t.desc}
                </p>
                <ul className="flex-1 mb-8 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="text-[#0D9488] text-[16px] leading-none mt-0.5 shrink-0">•</span>
                      <span className="text-white/70 text-[13px] sm:text-[14px] font-[450] leading-[1.5]">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(t.to)}
                  className={`
                    w-full h-[52px] rounded-[14px] font-[450] text-[15px] transition-colors
                    ${t.highlight
                      ? 'bg-[#0D9488] text-white hover:bg-[#0f766e]'
                      : 'bg-[#E9E9E9] text-[#0A0707] hover:bg-white'
                    }
                  `}
                >
                  {t.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-white/[0.06] py-14">
        <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div>
              <span className="font-[800] text-[18px] sm:text-[20px] bg-gradient-to-r from-[#0D9488] to-[#2563eb] bg-clip-text text-transparent">
                FMEApex
              </span>
              <p className="text-white/50 text-[12px] font-[450] mt-1">Quality Engineered To Evolve</p>
            </div>
            <nav className="flex flex-wrap gap-6 sm:gap-10 justify-center">
              {[
                { label: 'Product', to: '/product' },
                { label: 'Learn', to: '/learn' },
                { label: 'Blog', to: '/blog' },
                { label: 'Pricing', to: '/pricing' },
                { label: 'About', to: '/about' },
              ].map(l => (
                <a
                  key={l.label}
                  href={l.to}
                  className="text-white/50 font-[450] text-[12px] sm:text-[13px] hover:text-white transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <p className="text-white/40 text-[11px] font-[450] text-right md:text-right">
              © 2026 FMEApex. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default PricingPage;