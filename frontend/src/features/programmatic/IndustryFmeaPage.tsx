import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Layers,
  ChevronRight,
  Factory
} from 'lucide-react';

interface IndustryData {
  name: string;
  slug: string;
  standard: string;
  seoTitle: string;
  seoDesc: string;
  headline: string;
  summary: string;
  sampleFailures: { step: string; mode: string; cause: string; effect: string; ap: 'High' | 'Medium' | 'Low' }[];
  keyFeatures: string[];
}

const INDUSTRIES: Record<string, IndustryData> = {
  'automotive-iatf-16949': {
    name: 'Automotive & Tier 1',
    slug: 'automotive-iatf-16949',
    standard: 'IATF 16949 & AIAG-VDA 2019',
    seoTitle: 'Automotive FMEA Software (IATF 16949 & AIAG-VDA) | FMEApex',
    seoDesc: 'Automate automotive PFMEA & DFMEA workflows matching IATF 16949 standards. Integrated AP lookup and Control Plan sync for OEMs & Tier-1 suppliers.',
    headline: 'AIAG-VDA Compliant FMEA Software for Automotive OEMs & Tier 1 Suppliers',
    summary: 'Automotive OEMs mandate strict compliance with IATF 16949 and AIAG-VDA 2019 standards. FMEApex automates AP lookup tables, guarantees PFD-PFMEA linking, and streamlines PPAP submission packages.',
    sampleFailures: [
      { step: 'Robotic Arc Welding', mode: 'Incomplete Weld Penetration', cause: 'Voltage fluctuation during cycle', effect: 'Structural frame fatigue failure under load', ap: 'High' },
      { step: 'Torque Assembly', mode: 'Fastener Under-Torqued', cause: 'Calibrated transducer drift', effect: 'Loosening during vehicle operation', ap: 'High' },
      { step: 'E-Coat Dip Tank', mode: 'Insufficient Coating Thickness', cause: 'Current density imbalance', effect: 'Premature corrosion of underbody panel', ap: 'Medium' },
      { step: 'Dielectric Insulation Test', mode: 'Hi-Pot Voltage Breakdown', cause: 'Phase wire insulation pinhole', effect: 'High voltage chassis short circuit', ap: 'High' },
    ],
    keyFeatures: [
      'Automatic AIAG-VDA 2019 Action Priority (AP) lookup replacing RPN',
      'Bidirectional PFD ↔ PFMEA ↔ Control Plan synchronization with serializable transactions',
      'PPAP Audit-ready documentation exports with complete CFT signatures',
      'Customer-specific Special Characteristics (CC/SC) flow-down directly from DFMEA',
    ],
  },
  'aerospace-as9100': {
    name: 'Aerospace & Defense',
    slug: 'aerospace-as9100',
    standard: 'AS9100 & AS13004',
    seoTitle: 'Aerospace FMEA Software (AS9100 & AS13004) | FMEApex',
    seoDesc: 'Streamline aerospace PFMEA & DFMEA workflows matching AS9100 and AS13004 standards. Full risk mitigation, flight-critical quality control, and audit trails.',
    headline: 'AS9100 & AS13004 Audit-Ready FMEA Software for Aerospace Manufacturers',
    summary: 'Aerospace flight-critical components require zero-defect manufacturing risk analysis. FMEApex enforces strict AS13004 risk matrices, flight safety characteristics tracking, and 21 CFR Part 11 style audit logs.',
    sampleFailures: [
      { step: 'Turbine Blade CNC Milling', mode: 'Dimensional Overtolerance', cause: 'Tool bit thermal expansion', effect: 'Aerodynamic imbalance & engine vibration', ap: 'High' },
      { step: 'Composite Layer Curing', mode: 'Interlaminar Void Formation', cause: 'Autoclave pressure drop', effect: 'Structural delamination during flight', ap: 'High' },
      { step: 'Titanium Fastener Swaging', mode: 'Insufficient Collar Collapse', cause: 'Hydraulic swaging pressure loss', effect: 'Joint slippage under flight shear stress', ap: 'High' },
    ],
    keyFeatures: [
      'AS13004 compliant risk matrices and flight safety classification',
      'Flight-critical characteristic traceability down to raw material heat lots',
      'Immutable cryptographic revision signatures with permanent audit ledger',
      'Role-based access control and air-gapped Docker deployment for defense suppliers',
    ],
  },
  'medical-iso-13485': {
    name: 'Medical Devices',
    slug: 'medical-iso-13485',
    standard: 'ISO 13485 & 21 CFR Part 11',
    seoTitle: 'Medical Device FMEA Software (ISO 13485 & 21 CFR Part 11) | FMEApex',
    seoDesc: 'Accelerate ISO 13485 & ISO 14971 risk management. 21 CFR Part 11 compliant digital signatures, audit-ready DFMEA/PFMEA, and Control Plan sync.',
    headline: 'FDA 21 CFR Part 11 Audit-Ready FMEA Software for Medical Devices',
    summary: 'Medical device manufacturers must comply with ISO 14971 risk management and FDA 21 CFR Part 11. FMEApex locks approved revisions with digital signatures and segregates creator/reviewer/approver duties.',
    sampleFailures: [
      { step: 'Catheter Ultrasonic Sealing', mode: 'Micro-leak in Fluid Channel', cause: 'Horn frequency drift', effect: 'Sterility loss & fluid contamination', ap: 'High' },
      { step: 'Blister Pack Heat Seal', mode: 'Incomplete Seal Perimeter', cause: 'Platen temperature drop', effect: 'Exposed drug product in storage', ap: 'High' },
      { step: 'Implantable Lead Crimping', mode: 'Lead Conductor Fracture', cause: 'Crimp tool over-travel', effect: 'Pacing signal interruption in vivo', ap: 'High' },
    ],
    keyFeatures: [
      '21 CFR Part 11 electronic signatures with typed meaning and timestamp',
      'ISO 14971 hazard analysis integration linking harms to failure effects',
      'Strict reviewer segregation (author cannot review or approve own FMEA)',
      'Cloudflare R2 evidence storage for CAPA verification files (50MB limit)',
    ],
  },
  'semiconductor-jedec': {
    name: 'Semiconductor & Fab',
    slug: 'semiconductor-jedec',
    standard: 'JEDEC & IATF Semiconductor',
    seoTitle: 'Semiconductor FMEA Software (JEDEC & Wafer Fab Quality) | FMEApex',
    seoDesc: 'Optimize wafer fab and IC packaging FMEA workflows. Automate risk priority calculations for semiconductor manufacturing yield and reliability.',
    headline: 'High-Yield Semiconductor FMEA Software for Fab & Packaging Facilities',
    summary: 'Wafer fabrication and advanced IC packaging demand extreme precision. FMEApex helps semiconductor quality engineers track die-level failure mechanisms and package thermal stress risks.',
    sampleFailures: [
      { step: 'Wire Bonding', mode: 'Non-Wetting Bond Pad', cause: 'Surface oxidation prior to bond', effect: 'Open circuit electrical failure', ap: 'High' },
      { step: 'CMP Wafer Polish', mode: 'Micro-scratching on Die', cause: 'Slurry particle agglomeration', effect: 'Interlayer dielectric breakdown', ap: 'High' },
      { step: 'Molding Encapsulation', mode: 'Void Entrapment in Epoxy', cause: 'Transfer mold vacuum pressure loss', effect: 'Moisture ingress and popcorn cracking', ap: 'Medium' },
    ],
    keyFeatures: [
      'Wafer Fab & Assembly packaging templates for JEDEC standards',
      'Die-level failure mechanism libraries (electromigration, dielectric breakdown)',
      'Automated yield failure chain tracking with PFD station synchronization',
      'Multi-tenant enterprise RLS data security ensuring IP protection across foundries',
    ],
  },
};

export const IndustryFmeaPage: React.FC = () => {
  const { industry = 'automotive-iatf-16949' } = useParams<{ industry: string }>();
  const navigate = useNavigate();
  const data = INDUSTRIES[industry] || INDUSTRIES['automotive-iatf-16949'];

  return (
    <div className="bg-[#FBFBFC] min-h-screen text-slate-900 font-sans antialiased selection:bg-[#FF5500]/20 selection:text-slate-900">
      <SEO
        title={data.seoTitle}
        description={data.seoDesc}
        canonical={`/fmea/${industry}`}
      />
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-tech-dots border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-6">
            <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/#workflow" className="hover:text-slate-900 transition-colors">Solutions</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">{data.name}</span>
          </div>

          <div className="max-w-[880px]">
            {/* Standards Compliance Capsule */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-xs mb-6">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>{data.standard}</span>
              <span className="text-slate-300">•</span>
              <span>Domain Workspace</span>
            </div>

            <h1 className="text-[34px] sm:text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-slate-900 mb-5 ff-heading">
              {data.headline}
            </h1>

            <p className="text-[17px] sm:text-[19px] leading-[1.6] text-slate-600 mb-8 font-normal">
              {data.summary}
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => navigate('/login')}
                className="h-12 px-7 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[14.5px] font-semibold transition-all shadow-md flex items-center gap-2"
              >
                <span>Launch {data.name} Sandbox</span>
                <ArrowRight className="w-4 h-4 text-[#FF5500]" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('matrix');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-12 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[14.5px] font-semibold transition-all shadow-xs"
              >
                View Sample Failure Chains
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Tabs Selector */}
      <section className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-[1320px] mx-auto flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-slate-400 font-bold uppercase tracking-wider mr-2 hidden sm:inline">
            Industries:
          </span>
          {Object.values(INDUSTRIES).map((ind) => (
            <Link
              key={ind.slug}
              to={`/fmea/${ind.slug}`}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                ind.slug === industry
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {ind.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content: Overview & Matrix */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8" id="matrix">
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Failure Chains Table */}
          <div className="lg:col-span-8 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-200 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3">
                <Layers className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>AIAG-VDA 2019 Step 4 & 5</span>
              </div>
              <h2 className="text-[26px] sm:text-[34px] font-extrabold text-slate-900 tracking-tight ff-heading">
                Sample {data.name} Failure Chain Matrix
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Deterministic Cause → Mode → Effect chains mapped to {data.standard} standards with Action Priority calculation.
              </p>
            </div>

            {/* Table Container */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Process Step</th>
                      <th className="py-3 px-4">Failure Mode</th>
                      <th className="py-3 px-4">Potential Cause</th>
                      <th className="py-3 px-4">Failure Effect</th>
                      <th className="py-3 px-3 text-center">AP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.sampleFailures.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {row.step}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {row.mode}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {row.cause}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {row.effect}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                              row.ap === 'High'
                                ? 'badge-high-ap'
                                : row.ap === 'Medium'
                                ? 'badge-med-ap'
                                : 'badge-low-ap'
                            }`}
                          >
                            {row.ap.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GEO Extractable Definition Box */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-2">
              <div className="text-xs font-mono font-bold text-[#FF5500] uppercase tracking-wider flex items-center gap-1.5">
                <Factory className="w-4 h-4" />
                <span>Regulatory Architecture Summary</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-sans">
                FMEApex for {data.name} guarantees full compliance with {data.standard}. By combining automated Action Priority calculation, serializable PFD ↔ PFMEA linking, and 21 CFR Part 11 digital signatures, plant engineering teams eliminate audit findings and ensure complete functional safety.
              </p>
            </div>
          </div>

          {/* Right Column: Key Capabilities Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wider font-bold mb-4">
                <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
                <span>Domain Capabilities</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Engineered for {data.name}
              </h3>
              <div className="space-y-3.5 text-xs">
                {data.keyFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Launch Free Sandbox Session</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FF5500]" />
                </button>
              </div>
            </div>

            {/* Support / Direct Outreach */}
            <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 shadow-xs space-y-3">
              <div className="text-xs font-mono text-[#FF5500] font-bold uppercase tracking-wider">
                Need Custom OEM Templates?
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                We assist Tier 1 and medical plants with custom customer-specific requirements (CSRs) for Ford, GM, Stellantis, BMW, and Medtronic.
              </p>
              <div className="pt-2">
                <a
                  href="mailto:quality@fmeapex.online"
                  className="text-xs font-mono text-white underline hover:text-[#FF5500] transition-colors"
                >
                  Contact Quality Architect →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default IndustryFmeaPage;
