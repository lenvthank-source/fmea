import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';

const PILLARS = [
  { slug: 'aiag-vda-7-step-fmea', title: 'AIAG-VDA 7-Step FMEA', badge: 'Standards', desc: 'Planning → Structure → Function → Failure → Risk → Optimization → Documentation.' },
  { slug: 'pfd-pfmea-linking', title: 'PFD ↔ PFMEA Linking', badge: 'Linking', desc: 'Bidirectional PFD-PFMEA with orphan warnings and sequence.' },
  { slug: 'control-plan-sync', title: 'Control Plan Sync', badge: 'Control Plan', desc: 'CP propagation from FMEA controls, serializable.' },
  { slug: '21-cfr-part-11-fmea', title: '21 CFR Part 11', badge: 'Compliance', desc: 'Digital signatures, immutable audit_log, segregation.' },
];

export const LearnHubPage: React.FC = () => (
  <div className="min-h-screen bg-[#080A19] text-white font-sans antialiased">
    <SEO title="Learn — FMEApex Pillar Hub | 7-Step, PFD, Control Plan, 21 CFR" description="Learn hub: 7-step, PFD-PFMEA linking, Control Plan sync, 21 CFR Part 11 — tech articles with TechArticle+FAQ JSON-LD." canonical="/learn" />

    {/* Hero Section */}
    <section className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#080A19] via-[#080A19] to-[#050505] z-0" />
      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-20">
        <div className="max-w-[720px] mx-auto text-center">
          <h1 className="text-white text-[36px] sm:text-[48px] md:text-[56px] lg:text-[64px] font-normal leading-[1.05] tracking-[-0.02em] mb-6">
            Learn Hub
          </h1>
          <p className="text-white/50 text-[16px] sm:text-[18px] md:text-[20px] font-[450] leading-[1.5] max-w-[640px] mx-auto">
            Pillar tech articles — extractable <code className="bg-[#050505] px-2 py-0.5 rounded-[6px] text-[#0D9488] font-mono text-[12px]">ai-definition-block</code> for Princeton GEO, <code className="bg-[#050505] px-2 py-0.5 rounded-[6px] text-[#0D9488] font-mono text-[12px]">TechArticle+FAQPage 252</code>.
          </p>
        </div>
      </div>
    </section>

    {/* Pillars Grid */}
    <section className="bg-[#050505] py-24 sm:py-32 border-y border-white/[0.07]">
      <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px] sm:gap-[24px]">
          {PILLARS.map((p, i) => (
            <Link
              key={p.slug}
              to={`/learn/${p.slug}`}
              className={`
                relative p-8 rounded-[24px] sm:rounded-[28px]
                bg-[#0d0d0d] border border-white/[0.09]
                transition-all duration-300 ease-out
                hover:border-[#0D9488] hover:bg-[#121212] hover:-translate-y-[4px]
                block
              `}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <span className="inline-block px-3 py-1.5 rounded-[8px] bg-[#0D9488]/15 text-[#0D9488] font-[450] text-[11px] sm:text-[12px] uppercase tracking-[0.05em] mb-4">
                {p.badge}
              </span>
              <h3 className="text-white font-[450] text-[16px] sm:text-[17px] leading-[1.3] mb-2">
                {p.title}
              </h3>
              <p className="text-white/50 text-[13px] leading-[1.55] mb-4">
                {p.desc}
              </p>
              <span className="text-[#0D9488] font-[450] text-[12px] sm:text-[13px] uppercase tracking-[0.05em]">
                Read →
              </span>
            </Link>
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
              <Link
                key={l.label}
                to={l.to}
                className="text-white/50 font-[450] text-[12px] sm:text-[13px] hover:text-white transition-colors"
              >
                {l.label}
              </Link>
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
export default LearnHubPage;