import React from 'react';
import { SEO } from '../../components/SEO/SEO';

const CUSTOMERS = [
  { name: 'Bosch', sector: 'Automotive' },
  { name: 'Magna', sector: 'Automotive' },
  { name: 'Continental', sector: 'Automotive' },
  { name: 'Siemens', sector: 'Industrial' },
  { name: 'Tata Motors', sector: 'Automotive' },
  { name: 'Mahindra', sector: 'Automotive' },
  { name: 'Valeo', sector: 'Automotive' },
  { name: 'ZF Group', sector: 'Automotive' },
];

export const AboutPage: React.FC = () => (
  <div className="min-h-screen bg-[#080A19] text-white font-sans antialiased">
    <SEO title="About — FMEApex | Quality Engineered To Evolve" description="About FMEApex: modular AI platform for production quality risk, trusted by manufacturing and automotive makers." canonical="/about" />

    {/* Hero Section */}
    <section className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#080A19] via-[#080A19] to-[#050505] z-0" />
      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-20">
        <div className="max-w-[720px] mx-auto text-center">
          <h1 className="text-white text-[36px] sm:text-[48px] md:text-[56px] lg:text-[64px] font-normal leading-[1.05] tracking-[-0.02em] mb-6">
            About FMEApex
          </h1>
          <p className="text-white/50 text-[16px] sm:text-[18px] md:text-[20px] font-[450] leading-[1.5] max-w-[640px] mx-auto">
            We build modular AI systems that reason, adapt and collaborate — applied to quality engineering. FMEApex makes AIAG-VDA 7-step FMEA rigorous, linked and audit-ready.
          </p>
        </div>
      </div>
    </section>

    {/* Mission & Build Philosophy */}
    <section className="bg-[#050505] py-24 sm:py-32 border-y border-white/[0.07]">
      <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px] sm:gap-[24px]">
          <div className="relative p-8 rounded-[24px] sm:rounded-[28px] bg-[#0d0d0d] border border-white/[0.09] transition-all duration-300 ease-out hover:border-[#0D9488] hover:bg-[#121212] hover:-translate-y-[4px]">
            <h3 className="text-white text-[20px] sm:text-[22px] font-[450] leading-[1.2] mb-4">
              Our Mission
            </h3>
            <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] leading-[1.6]">
              Reduce quality risk with software that is dense, predictable and fast — no AI slop, no hidden magic. Every S/O/D [1,10], every AP H/M/L lookup, every PFD↔PFMEA link is explicit and auditable.
            </p>
          </div>
          <div className="relative p-8 rounded-[24px] sm:rounded-[28px] bg-[#0d0d0d] border border-white/[0.09] transition-all duration-300 ease-out hover:border-[#0D9488] hover:bg-[#121212] hover:-translate-y-[4px]">
            <h3 className="text-white text-[20px] sm:text-[22px] font-[450] leading-[1.2] mb-4">
              How We Build
            </h3>
            <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] leading-[1.6]">
              Single-viewport bento chrome, spreadsheet-dense tables, spreadsheet-grade keyboard (Enter/Backspace), ConfirmDialog everywhere, 21 CFR Part 11 locks. On-prem ships as one <code className="bg-[#050505] px-2 py-0.5 rounded-[6px] text-[#0D9488] font-mono text-[12px]">docker compose up</code>.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Trusted Customers */}
    <section className="bg-[#000] py-24 sm:py-32 border-t border-white/[0.06]">
      <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]">
        <div className="max-w-[593px] mb-16">
          <h2 className="text-white text-[28px] sm:text-[36px] font-[450] leading-[1.1] tracking-[-0.02em] mb-3">
            Trusted by Manufacturing & Automotive Makers
          </h2>
          <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] leading-[1.6] max-w-[420px]">
            Logos are placeholders — replace <code className="bg-[#050505] px-2 py-0.5 rounded-[6px] text-[#0D9488] font-mono text-[12px]">frontend/public/logos/customers/*</code> without code deploy. Customers have tested our platform in preview.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-[16px] sm:gap-[20px]">
          {CUSTOMERS.map((c, i) => (
            <div
              key={c.name}
              className={`
                relative p-6 rounded-[20px] bg-[#0c0c0c] border border-white/[0.08]
                transition-all duration-300 ease-out
                hover:border-[#0D9488] hover:bg-[#101010] hover:-translate-y-[3px]
              `}
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <div className="w-[40px] h-[40px] rounded-[14px] bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center mb-4 text-[18px] font-[450]">
                {c.name.charAt(0)}
              </div>
              <h4 className="text-white font-[450] text-[14px] sm:text-[15px] mb-1">
                {c.name}
              </h4>
              <p className="text-white/40 text-[11px] sm:text-[12px] font-[450] uppercase tracking-[0.05em]">
                {c.sector}
              </p>
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
export default AboutPage;