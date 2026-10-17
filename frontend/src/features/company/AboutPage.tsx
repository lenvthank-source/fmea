import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import {
  ShieldCheck,
  Cpu,
  GitBranch,
  Lock,
  ArrowRight,
  Server
} from 'lucide-react';

const DOGMAS = [
  {
    icon: Cpu,
    title: 'Deterministic Over Black-Box AI',
    desc: 'Quality engineers hold ultimate liability for functional safety. In FMEApex, every Action Priority rating is calculated by an auditable lookup engine. AI copilot suggests failure modes, but never commits or modifies data without an explicit engineering sign-off.',
  },
  {
    icon: GitBranch,
    title: 'The Golden Thread: Never Out of Sync',
    desc: 'The link between the Process Flow Diagram (PFD), the PFMEA grid, and the Control Plan (CP) is the foundation of manufacturing quality. A modification to an operation tolerance in the Control Plan must immediately synchronize to the PFMEA in a serializable transaction.',
  },
  {
    icon: Lock,
    title: 'Cryptographic Audit Integrity (21 CFR Part 11)',
    desc: 'Audit readiness cannot be an afterthought performed days before an OEM visit. FMEApex seals approved document revisions with cryptographic SHA-256 digital signatures and enforces reviewer segregation so an engineer cannot approve their own authoring.',
  },
  {
    icon: Server,
    title: 'Complete Infrastructure Sovereignty',
    desc: 'Defense, aerospace, and Tier 1 automotive suppliers often operate in strictly isolated, air-gapped environments. FMEApex ships as an enterprise Docker Compose bundle that deploys behind your firewall with zero outbound telemetry dependencies.',
  },
];

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FBFBFC] min-h-screen text-slate-900 font-sans antialiased selection:bg-[#FF5500]/20 selection:text-slate-900">
      <SEO
        title="About Our Mission — FMEApex | Deterministic Quality Engineering"
        description="Learn why we built FMEApex: replacing fragile Excel spreadsheets and bloated legacy desktop tools with modern, auditable AIAG-VDA 2019 quality software."
        canonical="/about"
      />
      <SiteHeader />

      {/* Hero */}
      <section className="pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8 bg-tech-dots border-b border-slate-200">
        <div className="max-w-[840px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-xs mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
            <span>Our Founding Philosophy</span>
          </div>

          <h1 className="text-[38px] sm:text-[54px] font-extrabold leading-[1.06] tracking-[-0.035em] text-slate-900 mb-6 ff-heading">
            Quality software that manufacturing engineers <span className="text-[#FF5500]">actually respect and adopt.</span>
          </h1>

          <p className="text-[17px] sm:text-[20px] leading-[1.6] text-slate-600 max-w-[680px] mx-auto">
            Manufacturing quality software has been frozen in time for twenty years—divided between clunky Windows desktop monoliths and fragile 50-column Excel files. We built FMEApex to bring deterministic software rigor to automotive, aerospace, and medical production plants.
          </p>
        </div>
      </section>

      {/* Narrative Section: The Excel Problem */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>The Industry Challenge</span>
            </div>
            <h2 className="text-[30px] sm:text-[38px] font-extrabold tracking-tight text-slate-900 leading-tight ff-heading">
              Why Spreadsheets Fail Critical Manufacturing Audits.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              In modern powertrain, battery, and medical device manufacturing, a single unnoticed failure mode can cause catastrophic field failures, regulatory recalls, and brand destruction.
            </p>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Yet 70% of plants manage their FMEAs in disconnected spreadsheets. Cell formulas break silently, Control Plans diverge from PFMEAs within weeks of SOP, and audit histories are lost in chaotic network drive folders.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#FBFBFC] border border-slate-200 space-y-4 font-mono text-xs">
            <div className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              The Cost of Legacy Spreadsheet FMEAs
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="text-rose-600 font-bold">Audit Non-Conformances</div>
              <div className="text-slate-600 mt-1">IATF 16949 audit failure due to unlinked process operations missing from Control Plan.</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="text-amber-600 font-bold">Arbitrary RPN Risk Blindspots</div>
              <div className="text-slate-600 mt-1">Severe safety hazards (S=10, O=2, D=2 = RPN 40) overlooked because RPN was below 100.</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="text-blue-600 font-bold">Uncontrolled Revision Drift</div>
              <div className="text-slate-600 mt-1">Multiple CFT members editing local copies of FMEA_revB_final_v3.xlsx.</div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Engineering Dogmas */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FBFBFC] border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto">
          <div className="max-w-[720px] mb-14 text-center mx-auto">
            <h2 className="text-[32px] sm:text-[42px] font-extrabold tracking-tight text-slate-900 ff-heading">
              Our Core Engineering Dogmas
            </h2>
            <p className="mt-3 text-[16px] text-slate-600">
              The foundational design decisions that govern every line of code in the FMEApex platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {DOGMAS.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.title} className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#FBFBFC] border border-slate-200 flex items-center justify-center text-slate-800 mb-4">
                      <Icon className="w-5 h-5 text-[#FF5500]" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {d.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {d.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-[840px] mx-auto text-center">
          <h2 className="text-[32px] sm:text-[42px] font-extrabold text-slate-900 mb-4 ff-heading">
            Experience the platform firsthand.
          </h2>
          <p className="text-[16px] text-slate-600 max-w-[580px] mx-auto mb-8 leading-relaxed">
            Launch an instant guest sandbox session to explore the AIAG-VDA 7-step FMEA workspace with pre-populated manufacturing data. Zero signup required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[14.5px] font-semibold transition-all shadow-md flex items-center gap-2"
            >
              <span>Launch Free Guest Sandbox</span>
              <ArrowRight className="w-4 h-4 text-[#FF5500]" />
            </button>
            <button
              onClick={() => navigate('/#contact')}
              className="h-12 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[14.5px] font-semibold transition-all"
            >
              Talk to Quality Architects
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default AboutPage;
