import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';

const VALUES = [
  { t: 'Deterministic, not magical', d: 'Every severity, occurrence, and detection rating in FMEApex is explicit, versioned, and auditable. AI assists but never overwrites engineering judgment.' },
  { t: 'Connected shop floor intelligence', d: 'Process flow diagrams, PFMEAs, and Control Plans are linked in real time. Changes propagate bidirectionally with zero copy-paste errors.' },
  { t: 'Deployable anywhere on-prem', d: 'One docker compose up command ships your entire quality platform behind your corporate firewall, keeping mission-critical data isolated.' },
];

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#18181B] font-sans antialiased">
      <SEO
        title="About — FMEApex | Quality Engineered to Evolve"
        description="About FMEApex: an enterprise quality intelligence platform built for automotive, aerospace, and medical manufacturing teams."
        canonical="/about"
      />
      <SiteHeader />

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[820px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E0D8] text-[11.5px] font-mono font-bold text-[#816729] shadow-xs mb-6">
            <span className="text-[#FF682C]">✦</span>
            <span>Our Mission</span>
          </div>
          <h1 className="text-[38px] sm:text-[54px] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#18181B] mb-5 ff-heading">
            Quality software that manufacturing engineers actually adopt.
          </h1>
          <p className="text-[17px] sm:text-[19px] leading-[1.6] text-[#52525B] max-w-[640px] mx-auto">
            We build modular AI systems for quality engineering. FMEApex makes the AIAG-VDA 7-step FMEA rigorous, linked, and audit-ready—without bloated enterprise IT overhead.
          </p>
        </div>
      </section>

      {/* Mission Tiles */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-[#E5E0D8]">
        <div className="max-w-[1200px] mx-auto grid sm:grid-cols-2 gap-8">
          <div className="rounded-[28px] border border-[#E5E0D8] bg-[#FAF9F6] p-8 sm:p-10 shadow-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF682C] font-bold">Purpose</span>
            <h3 className="text-[24px] font-bold text-[#18181B] mt-2 mb-3 ff-heading">Eliminate Spreadsheet Chaos</h3>
            <p className="text-[15px] leading-relaxed text-[#52525B]">
              Quality engineers spend hundreds of hours manually copy-pasting numbers across disconnected Excel files. FMEApex ensures every process step, failure mode, and control plan is synchronized in a single verifiable system of record.
            </p>
          </div>
          <div className="rounded-[28px] border border-[#E5E0D8] bg-[#FAF9F6] p-8 sm:p-10 shadow-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#816729] font-bold">Standard</span>
            <h3 className="text-[24px] font-bold text-[#18181B] mt-2 mb-3 ff-heading">Built on AIAG-VDA & 21 CFR Part 11</h3>
            <p className="text-[15px] leading-relaxed text-[#52525B]">
              Deterministic Action Priority lookup tables, immutable audit log partitions, electronic signatures, and reviewer segregation make inspection readiness automatic from day one.
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF9F6]">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-[32px] sm:text-[40px] font-extrabold text-[#18181B] mb-12 text-center ff-heading">
            What We Believe
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div key={v.t} className="rounded-[24px] bg-white border border-[#E5E0D8] p-8 shadow-xs">
                <div className="w-10 h-1 bg-[#FF682C] rounded-full mb-4" />
                <h4 className="text-[18px] font-bold text-[#18181B] mb-2">{v.t}</h4>
                <p className="text-[14px] leading-relaxed text-[#52525B]">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#E5E0D8]">
        <div className="max-w-[820px] mx-auto text-center">
          <h2 className="text-[32px] sm:text-[42px] font-extrabold text-[#18181B] mb-4 ff-heading">
            Experience the platform firsthand.
          </h2>
          <p className="text-[16px] text-[#52525B] max-w-[560px] mx-auto mb-8">
            Launch an instant guest sandbox session to explore the AIAG-VDA 7-step FMEA workspace with pre-populated manufacturing data.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="h-12 px-8 rounded-full bg-[#FF682C] hover:bg-[#E05219] text-white text-[14.5px] font-semibold transition-all shadow-[0_6px_20px_rgba(255,104,44,0.35)]"
          >
            Launch Free Guest Sandbox →
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default AboutPage;
