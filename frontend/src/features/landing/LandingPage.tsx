import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import { VentrilocDashboard } from '../../components/site/VentrilocDashboard';
import { RiskCalculatorWidget } from './RiskCalculatorWidget';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';

const LOGOS = [
  'BOSCH', 'MAGNA', 'CONTINENTAL', 'SIEMENS', 'ZF GROUP',
  'VALEO', 'TATA MOTORS', 'MAHINDRA', 'ABB', 'SCHNEIDER', 'DENSO'
];

const SPECS: [string, string][] = [
  ['Standards', 'AIAG-VDA 2019 (Ed 1) · 21 CFR Part 11 · IATF 16949'],
  ['Documents', 'PFMEA · DFMEA · PFD · Control Plan (CP)'],
  ['AI Engine', 'Tenant-isolated RAG · OpenAI Embeddings · pgvector HNSW'],
  ['Database', 'PostgreSQL 15 + Neon Serverless · Row-Level Security (RLS)'],
  ['Security', 'JWT RS256 · RBAC 22 scopes · HMAC-SHA256 webhooks'],
  ['Deployment', 'Cloudflare Pages (Edge) + Render + Docker / Podman on-prem'],
  ['Storage', 'Cloudflare R2 / MinIO · 50MB evidence files · Pre-signed URLs'],
];

const INQUIRY_TYPES = ['Demo Request', 'Enterprise License', 'Quality Data Migration', 'General Inquiry'];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, guestLogin } = useAuth();

  const [guestLoading, setGuestLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', type: 'Demo Request', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleContactSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) return;
    setContactSubmitting(true);
    setContactError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error('Submission failed');
      setContactSuccess(true);
      setContactForm({ name: '', email: '', company: '', type: 'Demo Request', message: '' });
    } catch {
      setContactError('Could not send your message. Please try again later.');
    } finally {
      setContactSubmitting(false);
    }
  }, [contactForm]);

  const handlePrimaryCTA = async () => {
    if (token) { navigate('/app/projects'); return; }
    setGuestLoading(true);
    try {
      await guestLogin();
      navigate('/app/projects');
    } catch (err) {
      console.error('Guest login failed:', err);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#09090B] font-sans antialiased">
      <SEO
        title="FMEApex — Modern AIAG-VDA 2019 Quality Platform & PFMEA Software"
        description="Replace spreadsheets with modern AIAG-VDA 7-Step FMEA authoring, bidirectional PFD linking, and 21 CFR Part 11 compliant audit trails."
        canonical="/"
      />

      {/* Sticky Header */}
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA] border-b border-[#E4E4E7]">
        <div className="max-w-[1360px] mx-auto">
          {/* Eyebrow & Headline */}
          <div className="max-w-[840px] mx-auto text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E4E4E7] text-[12px] font-mono font-semibold text-[#09090B] shadow-xs mb-6">
              <span className="text-[#FF682C]">✦</span>
              <span>AIAG-VDA 2019 Standard</span>
              <span className="text-[#D4D4D8]">•</span>
              <span>21 CFR Part 11 Compliant</span>
            </div>

            <h1 className="text-[36px] sm:text-[54px] lg:text-[64px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#09090B] mb-5">
              The modern operating system for <span className="text-[#FF682C]">manufacturing quality</span>.
            </h1>

            <p className="text-[16px] sm:text-[19px] leading-relaxed text-[#71717A] max-w-[680px] mx-auto mb-8 font-normal">
              Eliminate spreadsheet chaos. FMEApex connects your process flow diagrams, failure nets, deterministic risk matrices, and corrective actions in a unified, audit-ready platform.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 mb-10">
              <button
                onClick={handlePrimaryCTA}
                disabled={guestLoading}
                className="h-12 px-7 rounded-xl bg-[#09090B] hover:bg-[#27272A] disabled:opacity-50 text-white text-[14.5px] font-semibold transition-all shadow-sm flex items-center gap-2"
              >
                {guestLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Launch Free Guest Sandbox</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/product')}
                className="h-12 px-6 rounded-xl border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] text-[#09090B] text-[14.5px] font-semibold transition-all shadow-xs"
              >
                Explore Platform
              </button>
            </div>

            {/* Trust Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-[800px] mx-auto text-center">
              <div className="bg-white border border-[#E4E4E7] rounded-xl p-3.5 shadow-xs">
                <div className="text-[22px] font-extrabold text-[#09090B] font-mono">99.8%</div>
                <div className="text-[11.5px] text-[#71717A] font-medium mt-0.5">Audit Pass Rate</div>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-xl p-3.5 shadow-xs">
                <div className="text-[22px] font-extrabold text-[#10B981] font-mono">100%</div>
                <div className="text-[11.5px] text-[#71717A] font-medium mt-0.5">7-Step Gating</div>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-xl p-3.5 shadow-xs">
                <div className="text-[22px] font-extrabold text-[#FF682C] font-mono">&lt;120ms</div>
                <div className="text-[11.5px] text-[#71717A] font-medium mt-0.5">AI Vector RAG</div>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-xl p-3.5 shadow-xs">
                <div className="text-[22px] font-extrabold text-[#09090B] font-mono">Zero</div>
                <div className="text-[11.5px] text-[#71717A] font-medium mt-0.5">Spreadsheet Loss</div>
              </div>
            </div>
          </div>

          {/* Interactive Studio Preview Window */}
          <div className="mt-8 rounded-2xl border border-[#E4E4E7] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
            <VentrilocDashboard />
          </div>
        </div>
      </section>

      {/* Infinite Partner Logo Ticker */}
      <section className="py-7 bg-[#FFFFFF] border-b border-[#E4E4E7] overflow-hidden">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 mb-3 flex items-center justify-between">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#71717A] font-bold">
            Trusted by global manufacturing leaders
          </p>
          <span className="text-[11px] font-mono text-[#A1A1AA] hidden sm:inline">Automotive & Aerospace Tier 1</span>
        </div>

        <div className="relative w-full overflow-hidden flex items-center">
          <div className="animate-ticker flex items-center gap-12 sm:gap-16 py-1">
            {[...LOGOS, ...LOGOS].map((brand, i) => (
              <span
                key={`${brand}-${i}`}
                className="text-[13.5px] sm:text-[15px] font-extrabold tracking-[0.16em] text-[#A1A1AA] hover:text-[#09090B] transition-colors cursor-default whitespace-nowrap"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Core Quality Pillars (2x2 Bento Grid) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA] border-b border-[#E4E4E7]" id="features">
        <div className="max-w-[1360px] mx-auto">
          <div className="max-w-[620px] mb-12">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF682C] font-bold">Four Core Pillars</span>
            <h2 className="text-[30px] sm:text-[40px] font-extrabold tracking-tight text-[#09090B] mt-1.5 leading-tight">
              Engineered for absolute quality adoption.
            </h2>
            <p className="mt-3 text-[16px] text-[#71717A] leading-relaxed">
              Every module is designed to be understood and used daily on the shop floor and in engineering review rooms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-7 sm:p-9 shadow-xs hover:border-[#D4D4D8] transition-all flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F4F4F5] text-[11px] font-mono font-semibold text-[#09090B] mb-4">
                  <span>AIAG-VDA Step 2 & 3</span>
                </div>
                <h3 className="text-[22px] font-bold text-[#09090B] tracking-tight mb-2">
                  PFD ↔ PFMEA Bidirectional Sync
                </h3>
                <p className="text-[14.5px] text-[#71717A] leading-relaxed mb-6">
                  Extract, map, and synchronize every manufacturing operation from your Process Flow Diagram directly into the PFMEA grid with zero data loss. Automatic orphan process detection prevents missing inspection gates.
                </p>
              </div>

              <div className="p-4 bg-[#F9F9F8] rounded-xl border border-[#E4E4E7] font-mono text-[12px] space-y-2">
                <div className="flex justify-between items-center text-[#09090B] font-semibold">
                  <span>PFD Step 10: Automatic Bearing Press</span>
                  <span className="text-[#10B981]">SYNCED</span>
                </div>
                <div className="text-[11px] text-[#71717A]">4M Allocation: Machine (Press-04) · Man (Operator 2)</div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-7 sm:p-9 shadow-xs hover:border-[#D4D4D8] transition-all flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F4F4F5] text-[11px] font-mono font-semibold text-[#09090B] mb-4">
                  <span>Step 5 Risk Analysis</span>
                </div>
                <h3 className="text-[22px] font-bold text-[#09090B] tracking-tight mb-2">
                  Deterministic Action Priority (AP)
                </h3>
                <p className="text-[14.5px] text-[#71717A] leading-relaxed mb-6">
                  Lookup-based S/O/D ratings strictly derived from AIAG-VDA 2019 standards. Automatic High-AP mandates trigger closed-loop corrective action tasks with before and after ratings.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
                  <span className="font-bold text-[#EF4444]">High AP</span>
                  <div className="text-[10px] text-[#991B1B] mt-0.5">Mandatory Action</div>
                </div>
                <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg">
                  <span className="font-bold text-[#D97706]">Medium AP</span>
                  <div className="text-[10px] text-[#92400E] mt-0.5">Review Required</div>
                </div>
                <div className="p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg">
                  <span className="font-bold text-[#059669]">Low AP</span>
                  <div className="text-[10px] text-[#065F46] mt-0.5">Controls Verified</div>
                </div>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-7 sm:p-9 shadow-xs hover:border-[#D4D4D8] transition-all flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F4F4F5] text-[11px] font-mono font-semibold text-[#09090B] mb-4">
                  <span>Regulatory Compliance</span>
                </div>
                <h3 className="text-[22px] font-bold text-[#09090B] tracking-tight mb-2">
                  21 CFR Part 11 & Immutable Audit
                </h3>
                <p className="text-[14.5px] text-[#71717A] leading-relaxed mb-6">
                  Cryptographic digital signatures, locked revisions, and typed audit trails ensure inspection readiness from day one. Database constraints permanently reject deletions on audit partitions.
                </p>
              </div>

              <div className="p-3.5 bg-[#F9F9F8] rounded-xl border border-[#E4E4E7] font-mono text-[11px] text-[#71717A] space-y-1.5">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#09090B]">
                  <span>Audit Trail</span>
                  <span className="text-[#10B981]">Locked Partition</span>
                </div>
                <div>Rev C Approved by QA Director • Hash: e8046277</div>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-7 sm:p-9 shadow-xs hover:border-[#D4D4D8] transition-all flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F4F4F5] text-[11px] font-mono font-semibold text-[#09090B] mb-4">
                  <span>AI Copilot</span>
                </div>
                <h3 className="text-[22px] font-bold text-[#09090B] tracking-tight mb-2">
                  Tenant-Isolated Quality Intelligence
                </h3>
                <p className="text-[14.5px] text-[#71717A] leading-relaxed mb-6">
                  Vector search suggestions for failure modes, causes, and detection controls based strictly on your historical FMEA knowledge base. AI never modifies live rows without human approval.
                </p>
              </div>

              <div className="p-3.5 bg-[#F9F9F8] rounded-xl border border-[#E4E4E7] text-[12px] space-y-2">
                <div className="text-[11px] font-mono text-[#FF682C] font-semibold uppercase">✦ AI Suggestion</div>
                <div className="text-[#09090B] font-medium">Detection Control: Ultrasonic weld inspection</div>
                <div className="flex gap-2 text-[10.5px] font-semibold">
                  <span className="px-2 py-0.5 bg-[#09090B] text-white rounded">Accept</span>
                  <span className="px-2 py-0.5 border border-[#E4E4E7] rounded text-[#71717A]">Modify</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Risk Simulator */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FFFFFF] border-b border-[#E4E4E7]" id="simulator">
        <div className="max-w-[1360px] mx-auto">
          <div className="text-center max-w-[620px] mx-auto mb-10">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF682C] font-bold">Interactive Tool</span>
            <h2 className="text-[30px] sm:text-[40px] font-extrabold tracking-tight text-[#09090B] mt-1.5">
              Simulate Action Priority in real-time
            </h2>
            <p className="mt-2.5 text-[15px] text-[#71717A]">
              Adjust Severity, Occurrence, and Detection sliders to see how AIAG-VDA 2019 prioritizes corrective action tasks.
            </p>
          </div>

          <div className="max-w-[960px] mx-auto">
            <RiskCalculatorWidget />
          </div>
        </div>
      </section>

      {/* Specifications Bento */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA] border-b border-[#E4E4E7]">
        <div className="max-w-[1360px] mx-auto">
          <div className="mb-8">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold">Technical Specifications</span>
            <h2 className="text-[26px] sm:text-[34px] font-extrabold tracking-tight text-[#09090B] mt-1">
              Built for enterprise manufacturing scale
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E4E7] divide-y divide-[#E4E4E7] overflow-hidden shadow-xs">
            {SPECS.map(([label, value]) => (
              <div key={label} className="grid grid-cols-1 sm:grid-cols-12 p-4 text-[13px]">
                <div className="sm:col-span-3 font-mono font-bold text-[#71717A] uppercase text-[11px] tracking-wider">
                  {label}
                </div>
                <div className="sm:col-span-9 font-mono text-[#09090B] font-medium mt-1 sm:mt-0">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FFFFFF]" id="contact">
        <div className="max-w-[1360px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF682C] font-bold">Get In Touch</span>
              <h2 className="text-[32px] sm:text-[40px] font-extrabold tracking-tight text-[#09090B] mt-1.5 mb-4 leading-tight">
                Ready to talk about your quality transformation?
              </h2>
              <p className="text-[15.5px] leading-relaxed text-[#71717A] mb-6">
                Whether you need an on-premise Docker deployment, migration from legacy spreadsheets, or a custom demo with your engineering team, our quality architects are ready.
              </p>
              <div className="space-y-2 text-[13px] font-mono text-[#71717A]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>Response time SLA: <strong className="text-[#09090B]">Within 4 business hours</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF682C]" />
                  <span>Direct email: <a href="mailto:quality@fmeapex.online" className="text-[#FF682C] font-bold hover:underline">quality@fmeapex.online</a></span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl p-6 sm:p-8">
              {contactSuccess ? (
                <div className="p-8 text-center bg-white rounded-xl border border-[#A7F3D0]">
                  <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto mb-4 text-[20px]">✓</div>
                  <h3 className="text-[18px] font-bold text-[#09090B] mb-1.5">Message received</h3>
                  <p className="text-[13.5px] text-[#71717A]">Thank you for reaching out. A quality engineer will get in touch with you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {contactError && (
                    <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[13px] rounded-lg">
                      {contactError}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-1.5">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Jane Doe"
                        className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#E4E4E7] text-[14px] text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-1.5">Corporate Email</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="jane@manufacturer.com"
                        className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#E4E4E7] text-[14px] text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B]"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-1.5">Company / Plant</label>
                      <input
                        type="text"
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        placeholder="Tier 1 Automotive Plant"
                        className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#E4E4E7] text-[14px] text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-1.5">Inquiry Type</label>
                      <select
                        value={contactForm.type}
                        onChange={(e) => setContactForm({ ...contactForm, type: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#E4E4E7] text-[14px] text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B]"
                      >
                        {INQUIRY_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-bold mb-1.5">Project Details</label>
                    <textarea
                      rows={3}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Tell us about your production lines, current FMEA tools, or migration requirements..."
                      className="w-full p-3.5 rounded-xl bg-white border border-[#E4E4E7] text-[14px] text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full h-11 rounded-xl bg-[#09090B] hover:bg-[#27272A] text-white text-[14px] font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {contactSubmitting ? 'Sending...' : 'Send Message →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default LandingPage;
