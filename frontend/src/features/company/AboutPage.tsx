import React from 'react';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';

const CUSTOMERS = ['Bosch', 'Magna', 'Continental', 'Siemens', 'Tata Motors', 'Mahindra', 'Valeo', 'ZF Group'];

const VALUES = [
  { t: 'Dense, not fanciful', d: 'Spreadsheet-grade grids, single-viewport bento chrome, keyboard-first. No marketing fluff inside the product.' },
  { t: 'Explicit, not magical', d: 'Every S/O/D rating, every AP lookup, every PFD↔PFMEA link is visible, versioned, and auditable.' },
  { t: 'Deployable anywhere', d: 'One `docker compose up` — your data stays in your infrastructure, behind your firewall.' },
];

export const AboutPage: React.FC = () => (
  <div className="bg-[#F7F6F3] min-h-screen">
    <SEO
      title="About — FMEApex | Quality Engineered To Evolve"
      description="About FMEApex: a modular AI platform for production quality risk, trusted by manufacturing and automotive teams."
      canonical="/about"
    />
    <SiteHeader />

    {/* Hero */}
    <section className="pt-[120px] pb-20 px-5 sm:px-8 lg:px-12">
      <div className="max-w-[860px] mx-auto text-center">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-[#0D9488] text-[12px] font-[650] uppercase tracking-[0.08em]">
          About us
        </span>
        <h1 className="mt-5 text-[40px] sm:text-[52px] leading-[1.06] font-[650] tracking-[-0.02em] text-[#0F172A]">
          Software that factories actually trust.
        </h1>
        <p className="mt-5 text-[17px] leading-[1.6] text-[#5B6470] max-w-[640px] mx-auto">
          We build modular AI systems for quality engineering. FMEApex makes the AIAG-VDA 7-step FMEA rigorous, linked, and audit-ready — without the EHS-suite bloat.
        </p>
      </div>
    </section>

    {/* Mission + Build */}
    <section className="py-16 px-5 sm:px-8 lg:px-12 bg-white border-y border-[#E6E1D8]">
      <div className="max-w-[1000px] mx-auto grid sm:grid-cols-2 gap-5">
        <div className="rounded-[20px] border border-[#E6E1D8] bg-[#FAF9F6] p-8">
          <h3 className="text-[20px] font-[650] text-[#0F172A] mb-3">Our mission</h3>
          <p className="text-[14.5px] leading-[1.65] text-[#5B6470]">
            Cut the time quality engineers spend chasing risk paperwork. Every severity, occurrence, and detection rating in FMEApex is explicit, traceable, and reproducible — so audits take hours, not weeks.
          </p>
        </div>
        <div className="rounded-[20px] border border-[#E6E1D8] bg-[#FAF9F6] p-8">
          <h3 className="text-[20px] font-[650] text-[#0F172A] mb-3">How we build</h3>
          <p className="text-[14.5px] leading-[1.65] text-[#5B6470]">
            Dense bento chrome, spreadsheet-grade tables, keyboard navigation everywhere, ConfirmDialog on every destructive action, 21 CFR Part 11 locks. On-prem ships as one command.
          </p>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-16 px-5 sm:px-8 lg:px-12">
      <div className="max-w-[1000px] mx-auto">
        <h2 className="text-[32px] sm:text-[40px] font-[650] tracking-[-0.02em] text-[#0F172A] mb-10">What we believe</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {VALUES.map((v) => (
            <div key={v.t} className="rounded-[16px] border border-[#E6E1D8] bg-white p-6">
              <h3 className="text-[17px] font-[650] text-[#0F172A] mb-2">{v.t}</h3>
              <p className="text-[13.5px] leading-[1.6] text-[#5B6470]">{v.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Customers */}
    <section className="py-16 px-5 sm:px-8 lg:px-12 bg-white border-t border-[#E6E1D8]">
      <div className="max-w-[1000px] mx-auto">
        <h2 className="text-[28px] font-[650] tracking-[-0.02em] text-[#0F172A]">Trusted by manufacturing &amp; automotive makers</h2>
        <p className="mt-2 text-[14.5px] text-[#5B6470]">Teams exploring FMEApex in preview deployments.</p>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CUSTOMERS.map((c) => (
            <div key={c} className="rounded-[14px] border border-[#E6E1D8] bg-[#FAF9F6] p-5 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-[10px] bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488] font-[650] text-[16px]">{c.charAt(0)}</div>
              <span className="text-[13px] font-[600] text-[#334155]">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
);
export default AboutPage;
