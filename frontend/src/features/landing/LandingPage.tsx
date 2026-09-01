import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import { MockupDashboard } from '../../components/site/MockupDashboard';
import { RiskCalculatorWidget } from './RiskCalculatorWidget';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const STEPS = [
  { n: '01', title: 'Planning (5Ts)', desc: 'Scope, team, timing, tools, tasks' },
  { n: '02', title: 'Structure', desc: 'Process steps from BOM / PFD' },
  { n: '03', title: 'Function', desc: 'What each step must achieve' },
  { n: '04', title: 'Failure', desc: 'Cause → mode → effect chains' },
  { n: '05', title: 'Risk', desc: 'S/O/D 1-10, Action Priority' },
  { n: '06', title: 'Optimization', desc: 'Actions on High-AP items' },
  { n: '07', title: 'Documentation', desc: 'Locked, signed, immutable' },
];

const FEATURES = [
  { icon: '7', title: '7-Step Workflow', desc: 'AIAG-VDA gating at every stage — zero skipped steps, zero ambiguity.' },
  { icon: '↔', title: 'PFD ↔ PFMEA', desc: 'Bidirectional sync detects orphan processes and sequence mismatches instantly.' },
  { icon: '✦', title: 'AI Copilot', desc: 'Tenant-isolated RAG suggestions with human review before anything lands.' },
  { icon: '☷', title: 'Control Plan', desc: 'Controls propagate from FMEA characteristics automatically.' },
  { icon: '⚑', title: 'Actions', desc: 'Lifecycle tracking with evidence files and risk re-calculation.' },
  { icon: '§', title: '21 CFR Part 11', desc: 'Electronic signatures, typed audit log, approval segregation.' },
];

const SPECS: [string, string][] = [
  ['Standards', 'AIAG-VDA 2019 · 21 CFR Part 11'],
  ['Documents', 'PFMEA · DFMEA · PFD · Control Plan'],
  ['AI Engine', 'LLM + RAG · HNSW tenant-isolated · 1536-dim'],
  ['Database', 'PostgreSQL 15 + pgvector · row-level security'],
  ['Security', 'JWT 15m access / 7d refresh · RBAC 22 perms'],
  ['Deployment', 'Render.com · Cloudflare Pages · Docker on-prem'],
  ['Storage', 'R2 / MinIO · 50 MB files · presigned URLs'],
];

const INQUIRY_TYPES = ['Demo Request', 'Purchase Inquiry', 'Feature Request', 'General Support'];

const LOGOS = ['BOSCH', 'MAGNA', 'CONTINENTAL', 'SIEMENS', 'TATA MOTORS', 'MAHINDRA', 'VALEO', 'ZF'];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

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
    try { await guestLogin(); navigate('/app/initializing'); } catch (err) { console.error('Guest login failed:', err); } finally { setGuestLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#0F172A]">
      <SEO
        title="FMEApex — AI-Powered FMEA Platform | AIAG-VDA 7-Step"
        description="AI-native FMEA workspace: 7-step AIAG-VDA workflow, PFD↔PFMEA bidirectional linking, Control Plan sync, actions lifecycle, 21 CFR Part 11 audit-ready."
        canonical="/"
      />
      <SiteHeader />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-[100px] pb-20 px-5 sm:px-8 lg:px-12 bg-[#F7F6F3]">
        <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left copy */}
          <div className="reveal">
            <p className="text-[13px] font-[650] uppercase tracking-[0.14em] text-[#0D9488] mb-4">AIAG-VDA <span className="text-[#8A8F98]">2019 · 21 CFR Part 11</span></p>
            <h1 className="text-[42px] sm:text-[56px] lg:text-[64px] font-[650] leading-[1.02] tracking-[-0.025em] text-[#0F172A] mb-6">
              Quality.<br />Engineered<br />to evolve.
            </h1>
            <p className="text-[17px] leading-[1.6] text-[#5B6470] max-w-[480px] mb-8">
              A workspace where PFD feeds PFMEA feeds Control Plan — with AI that suggests, humans who approve, and audits that always pass.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePrimaryCTA}
                disabled={guestLoading}
                className="h-[48px] px-7 rounded-full bg-[#0F172A] text-white text-[14.5px] font-[600] hover:bg-[#1E293B] transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {guestLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  token ? 'Open dashboard' : 'Try the preview'
                )}
              </button>
              <button
                onClick={() => navigate('/product')}
                className="h-[48px] px-7 rounded-full border border-[#D8D3C8] bg-white/70 text-[14.5px] font-[600] text-[#0F172A] hover:bg-white transition-colors"
              >
                Explore product
              </button>
            </div>
          </div>

          {/* Right mockup */}
          <div className="reveal-2 hidden lg:block">
            <MockupDashboard />
          </div>
        </div>
      </section>

      {/* ── Trust logos ─────────────────────────────────────────── */}
      <section className="py-12 px-5 sm:px-8 lg:px-12 border-t border-[#E6E1D8]">
        <div className="max-w-[1440px] mx-auto">
          <p className="text-[11px] font-[600] uppercase tracking-[0.14em] text-[#8A8F98] text-center mb-6">Trusted by teams designing the systems the world rides in</p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {LOGOS.map((brand) => (
              <span key={brand} className="text-[13px] font-[700] tracking-[0.12em] text-[#B4BEC9] hover:text-[#5B6470] transition-colors cursor-default">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7-Step methodology ──────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12" id="methodology">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-[36px] sm:text-[44px] font-[650] tracking-[-0.02em] text-[#0F172A]">The 7-step methodology</h2>
              <p className="mt-2 text-[16px] text-[#5B6470] max-w-[440px]">AIAG-VDA 2019 — gated, auditable, zero skips.</p>
            </div>
            <span className="text-[#0D9488] text-[12px] font-[600] uppercase tracking-[0.14em]">AIAG-VDA</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-[14px] border border-[#E6E1D8] bg-white p-5 hover:-translate-y-1 hover:shadow-[0_16px_36px_-16px_rgba(15,23,42,0.12)] hover:border-[#0D9488]/30 transition-all"
              >
                <span className="text-[11px] font-[700] text-[#0D9488] tracking-[0.08em]">{s.n}</span>
                <h3 className="text-[14px] font-[650] text-[#0F172A] mt-2 leading-[1.25]">{s.title}</h3>
                <p className="text-[12px] text-[#5B6470] mt-1 leading-[1.45]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features bento ──────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12 bg-white border-y border-[#E6E1D8]">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-[560px] mb-14">
            <h2 className="text-[36px] sm:text-[44px] font-[650] tracking-[-0.02em] text-[#0F172A]">Everything you need</h2>
            <p className="mt-3 text-[16px] text-[#5B6470]">Dense tooling with zero learning curve — keyboard-first, audit-ready, no AI slop.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-[16px] border border-[#E9E4DA] bg-white p-7 hover:-translate-y-1 hover:shadow-[0_20px_44px_-18px_rgba(15,23,42,0.14)] hover:border-[#0D9488]/30 transition-all"
              >
                <div className="w-[44px] h-[44px] rounded-[12px] bg-[#0D9488]/10 flex items-center justify-center mb-5 font-[700] text-[18px] text-[#0D9488]">
                  {f.icon}
                </div>
                <h3 className="text-[16px] font-[650] text-[#0F172A] mb-2">{f.title}</h3>
                <p className="text-[13.5px] leading-[1.6] text-[#5B6470]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Risk widget ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-[560px] mx-auto mb-14">
            <h2 className="text-[32px] sm:text-[40px] font-[650] tracking-[-0.02em] text-[#0F172A]">Visualize risk priorities instantly</h2>
            <p className="mt-3 text-[16px] text-[#5B6470]">Severity × Occurrence → Action Priority. See the difference AI mitigation makes.</p>
          </div>
          <RiskCalculatorWidget />
        </div>
      </section>

      {/* ── Specs table ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12 bg-white border-y border-[#E6E1D8]" id="specs">
        <div className="max-w-[860px] mx-auto">
          <h2 className="text-[32px] sm:text-[40px] font-[650] tracking-[-0.02em] text-[#0F172A] mb-3">Technical specifications</h2>
          <p className="text-[16px] text-[#5B6470] mb-10">Production-grade from commit one. No EHS bloatware inside.</p>
          <div className="rounded-[16px] border border-[#E6E1D8] bg-[#FAF9F6] overflow-hidden divide-y divide-[#EFEBE3]">
            {SPECS.map(([k, v]) => (
              <div key={k} className="grid sm:grid-cols-[200px_1fr] px-6 py-4">
                <span className="text-[12px] font-[600] text-[#8A8F98] uppercase tracking-[0.08em] py-0.5">{k}</span>
                <span className="text-[14px] text-[#334155]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12" id="contact">
        <div className="max-w-[1440px] mx-auto grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-start">
          <div>
            <h2 className="text-[36px] sm:text-[44px] font-[650] tracking-[-0.02em] text-[#0F172A] mb-4">Get in touch</h2>
            <p className="text-[16px] leading-[1.6] text-[#5B6470] max-w-[380px] mb-8">
              Demo, pricing, or enterprise — the team reads every inquiry inside the admin dashboard.
            </p>
            <button
              onClick={handlePrimaryCTA}
              disabled={guestLoading}
              className="h-[52px] px-8 rounded-full bg-[#0D9488] text-white text-[15px] font-[600] hover:bg-[#0F766E] transition-colors disabled:opacity-50"
            >
              {guestLoading ? 'Loading…' : token ? 'Open dashboard' : 'Launch preview'}
            </button>
          </div>

          <div className="rounded-[20px] border border-[#E6E1D8] bg-white p-8 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.08)]">
            {contactError && (
              <div className="mb-5 px-4 py-3 rounded-[10px] bg-[#FEF2F2] border border-[#FCA5A5] text-[13px] text-[#B91C1C]">
                {contactError}
              </div>
            )}
            {contactSuccess && (
              <div className="mb-5 px-4 py-3 rounded-[10px] bg-[#F0FDF9] border border-[#99E5DA] text-[13px] text-[#047857]">
                Thanks — we'll get back to you shortly.
              </div>
            )}
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-[600] text-[#8A8F98] uppercase tracking-[0.06em] mb-1.5">Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full h-[46px] px-4 rounded-[10px] border border-[#D8D3C8] bg-white text-[14px] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-[600] text-[#8A8F98] uppercase tracking-[0.06em] mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                    className="w-full h-[46px] px-4 rounded-[10px] border border-[#D8D3C8] bg-white text-[14px] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-[600] text-[#8A8F98] uppercase tracking-[0.06em] mb-1.5">Company</label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="Company"
                    className="w-full h-[46px] px-4 rounded-[10px] border border-[#D8D3C8] bg-white text-[14px] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-[600] text-[#8A8F98] uppercase tracking-[0.06em] mb-1.5">Type</label>
                  <select
                    value={contactForm.type}
                    onChange={(e) => setContactForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full h-[46px] px-4 rounded-[10px] border border-[#D8D3C8] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition appearance-none bg-no-repeat bg-right-[14px] bg-center"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238a8f98' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}
                  >
                    {INQUIRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-[600] text-[#8A8F98] uppercase tracking-[0.06em] mb-1.5">Message</label>
                <textarea
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us about your process, your plant, your goals…"
                  className="w-full px-4 py-3 rounded-[10px] border border-[#D8D3C8] bg-white text-[14px] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={contactSubmitting}
                className="w-full h-[50px] rounded-[12px] bg-[#0F172A] text-white text-[14.5px] font-[600] hover:bg-[#1E293B] transition-colors disabled:opacity-50"
              >
                {contactSubmitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default LandingPage;
