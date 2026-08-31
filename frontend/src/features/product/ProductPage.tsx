import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';

const FEATURES = [
  { title: '7-Step AIAG-VDA', desc: 'Guided Structure → Function → Failure → Risk → Optimization → Documentation with gating.', tab: '7-Step Workflow' },
  { title: 'PFD ↔ PFMEA Linking', desc: 'Bidirectional sync, orphan detection, view-aware linking with rAF throttling.', tab: 'PFD-PFMEA' },
  { title: 'AI Copilot (RAG)', desc: 'HNSW M=16 tenant-isolated embeddings, Human-in-the-loop proposed→accepted.', tab: 'AI Copilot' },
  { title: 'Control Plan Sync', desc: 'Serializable control propagation between FMEA and Control Plans.', tab: 'Control Plan' },
  { title: 'Actions Lifecycle', desc: 'Open→InProgress→Completed→Verified→Closed with R2 evidence 50MB.', tab: 'Actions' },
  { title: '21 CFR Part 11', desc: 'Revision locks, typed audit_log, approval segregation.', tab: 'Revisions' },
];

const SPECS = [
  ['Standards', 'AIAG-VDA 2019, 21 CFR Part 11'],
  ['Documents', 'PFMEA, DFMEA, PFD, Control Plan'],
  ['AI Engine', 'Secure LLM + RAG HNSW 1536d'],
  ['Database', 'Neon Postgres 15 + pgvector, RLS tenantId'],
  ['Security', 'JWT 15m/7d + 72h inactivity, RBAC 22 perms, HMAC webhooks'],
  ['Deploy', 'Cloudflare Pages + Render Docker + BullMQ'],
];

export const ProductPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080A19] text-white font-sans antialiased">
      <SEO title="Product — FMEApex Deep Dive | 7-Step, PFD-PFMEA, Control Plan" description="Explore FMEApex product deep dive: AIAG-VDA 7-step, PFD-PFMEA linking, AI copilot, Control Plan sync, Actions lifecycle, 21 CFR Part 11." canonical="/product" />

      {/* Hero Section */}
      <section className="relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080A19] via-[#080A19] to-[#050505] z-0" />
        <div className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-20">
          <div className="max-w-[720px] mx-auto text-center">
            <h1 className="text-white text-[36px] sm:text-[48px] md:text-[56px] lg:text-[64px] font-normal leading-[1.05] tracking-[-0.02em] mb-6">
              Product — Built for Quality Teams
            </h1>
            <p className="text-white/50 text-[16px] sm:text-[18px] md:text-[20px] font-[450] leading-[1.5] max-w-[640px] mx-auto mb-10">
              FMEApex unifies 7-step FMEA, PFD, Control Plan and Actions in one tenant-isolated workspace. Try the live demo — 10 shared projects, no login required in preview.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center h-[52px] px-8 bg-[#E9E9E9] text-[#0A0707] font-[450] text-[15px] rounded-[14px] transition-colors hover:bg-white"
            >
              Launch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-[#050505] py-24 sm:py-32 border-y border-white/[0.07]">
        <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px] sm:gap-[24px]">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`
                  relative p-8 rounded-[24px] sm:rounded-[28px]
                  bg-[#0d0d0d] border border-white/[0.09]
                  transition-all duration-300 ease-out
                  hover:border-[#0D9488] hover:bg-[#121212] hover:-translate-y-[4px]
                `}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="w-[48px] h-[48px] rounded-[20px] bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center mb-6 text-[20px]">
                  <span className="font-[450]">{f.title.charAt(0)}</span>
                </div>
                <h3 className="text-white font-[450] text-[16px] sm:text-[17px] leading-[1.3] mb-2">
                  {f.title}
                </h3>
                <p className="text-white/50 text-[13px] leading-[1.55] mb-4">
                  {f.desc}
                </p>
                <span className="text-[#0D9488] font-[450] text-[12px] uppercase tracking-[0.05em]">
                  {f.tab} →
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="bg-[#000] py-24 sm:py-32 border-t border-white/[0.06]">
        <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]">
          <div className="max-w-[593px] mb-16">
            <h2 className="text-white text-[28px] sm:text-[36px] font-[450] leading-[1.1] tracking-[-0.02em] mb-3">
              Technical Specifications
            </h2>
            <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] leading-[1.6] max-w-[420px]">
              Enterprise-grade, production-ready architecture.
            </p>
          </div>

          <div className="rounded-[24px] sm:rounded-[28px] bg-[#0c0c0c] border border-white/[0.09] overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-white/[0.07]">
              <h3 className="text-white text-[20px] sm:text-[22px] font-[450] leading-[1.2]">
                Specifications
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {SPECS.map(([k, v]) => (
                <div key={k} className="p-6 sm:p-8 border-b border-white/[0.04] last:border-0 sm:border-r sm:border-r-white/[0.04]">
                  <span className="text-white font-[450] text-[13px] sm:text-[14px] block mb-1">
                    {k}
                  </span>
                  <span className="text-white/50 text-[13px] sm:text-[14px] leading-[1.5]">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
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
                <button
                  key={l.label}
                  onClick={() => navigate(l.to)}
                  className="text-white/50 font-[450] text-[12px] sm:text-[13px] hover:text-white transition-colors"
                >
                  {l.label}
                </button>
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
export default ProductPage;