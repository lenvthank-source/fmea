import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../../config';
import { SEO } from '../../components/SEO/SEO';
import { RiskCalculatorWidget } from './RiskCalculatorWidget';
import ApogeeHero from '../../components/ApogeeHero';

const STEPS = [
  { title: 'Planning (5Ts)', desc: 'Scope, team, timing, tools, tasks' },
  { title: 'Structure Analysis', desc: 'Hierarchies from BOM/PFD' },
  { title: 'Function Analysis', desc: 'Functions, requirements, specs' },
  { title: 'Failure Analysis', desc: 'Cause → mode → effect chains' },
  { title: 'Risk Analysis', desc: 'S / O / D ratings 1-10' },
  { title: 'Optimization', desc: 'Actions on High AP items' },
  { title: 'Documentation', desc: 'Locked, signed revisions' },
];

const FEATURES = [
  { title: '7-Step Workflow', desc: 'AIAG-VDA gating, zero skips' },
  { title: 'PFD ↔ PFMEA', desc: 'Bidirectional sync, orphan flags' },
  { title: 'AI Copilot', desc: 'RAG suggestions, HITL review' },
  { title: 'Control Plan', desc: 'Serializable propagation' },
  { title: 'Actions', desc: 'Lifecycle + R2 evidence' },
  { title: '21 CFR Part 11', desc: 'Signatures, immutable audit' },
];

const SPECS = [
  ['Standards', 'AIAG-VDA 2019 · 21 CFR Part 11'],
  ['Documents', 'PFMEA · DFMEA · PFD · Control Plan'],
  ['AI Engine', 'LLM + RAG, HNSW tenant-isolated'],
  ['Database', 'Postgres 15 + pgvector, RLS'],
  ['Security', 'JWT 15m/7d · RBAC · HMAC webhooks'],
  ['Deploy', 'Render · Cloudflare · serverless'],
  ['Files', 'R2 / MinIO, 50 MB presigned'],
];

const INQUIRY_TYPES = ['Demo Request', 'Purchase Inquiry', 'Feature Request', 'General Support'];

const MARQUEE_ITEMS = ['AIAG-VDA 2019', 'PFD ↔ PFMEA', 'Control Plan', '21 CFR Part 11', 'RAG Copilot', 'Auto ERP / MES', 'Zero-Login Preview', 'Action Lifecycle'];

function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.unobserve(el); }
    }, { threshold: 0.1, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

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
    try { await guestLogin(); navigate('/app/initializing'); } catch (err) { console.error('Failed to create guest user:', err); } finally { setGuestLoading(false); }
  };

  const featuresObs = useInView();
  const specsObs = useInView();
  const contactObs = useInView();
  const stepsObs = useInView();

  useEffect(() => {
    const id = 'fmea-landing-kf';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `@keyframes pulseDot{0%,100%{opacity:0.4}50%{opacity:1}}`;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#080A19] text-white font-sans antialiased">
      <SEO
        title="FMEApex — Quality Engineered To Evolve | AIAG-VDA AI FMEA"
        description="Modular AI platform for quality engineering. 7-step AIAG-VDA FMEA, PFD↔PFMEA linking, Control Plan sync, Actions lifecycle, 21 CFR Part 11. Try the shared preview — no login."
        canonical="/"
      />

      {/* 1. HERO — ApogeeHero includes nav + video + copy + stat card */}
      <ApogeeHero />

      {/* 2. TRUST MARQUEE — infinite, muted */}
      <section className="bg-[#050505] border-y border-white/[0.07] py-[20px] overflow-hidden">
        <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
        <div className="flex gap-24 whitespace-nowrap animate-[marquee_26s_linear_infinite] max-w-max">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((m, i) => (
            <span key={i} className="text-white/50 font-[450] text-[13px] sm:text-[14px] uppercase tracking-[0.12em]">{m} ·</span>
          ))}
        </div>
      </section>

      {/* 3. 7-STEP METHODOLOGY — compact dark bento grid */}
      <section id="process" ref={stepsObs.ref} className="bg-[#000] py-20 sm:py-28">
        <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]">
          <div className="flex items-end justify-between gap-8 mb-16 flex-wrap">
            <div>
              <h2 className="text-white text-[28px] sm:text-[36px] font-[450] leading-[1.1] tracking-[-0.02em]">
                The 7-Step Methodology
              </h2>
              <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] mt-2 max-w-[480px]">
                AIAG-VDA 2019 — gated, auditable, zero skips
              </p>
            </div>
            <span className="text-[#0D9488] font-[450] text-[12px] uppercase tracking-[0.1em]">
              AIAG-VDA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] sm:gap-[20px]">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className={`
                  relative p-6 sm:p-8 rounded-[24px] sm:rounded-[28px]
                  bg-[#0c0c0c] border border-white/[0.08]
                  transition-all duration-300 ease-out
                  ${stepsObs.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[14px]'}
                  hover:border-[#0D9488] hover:bg-[#101010] hover:-translate-y-[3px]
                `}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[#0D9488] font-[450] text-[13px] sm:text-[14px]">
                    0{i + 1}
                  </span>
                  <span
                    className="w-[6px] h-[6px] rounded-full bg-[#28282a]"
                    style={{
                      animation: i === 2 ? 'pulseDot 1.8s infinite ease-in-out' : 'none',
                    }}
                  />
                </div>
                <h3 className="text-white font-[450] text-[15px] sm:text-[16px] leading-[1.3] mb-2">
                  {s.title}
                </h3>
                <p className="text-white/50 text-[13px] leading-[1.55]">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURES — bento grid, dark */}
      <section id="features" ref={featuresObs.ref} className="bg-[#050505] border-y border-white/[0.07] py-24 sm:py-32">
        <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]">
          <div className="max-w-[593px] mb-16">
            <h2 className="text-white text-[28px] sm:text-[36px] font-[450] leading-[1.1] tracking-[-0.02em] mb-3">
              Everything You Need
            </h2>
            <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] leading-[1.6]">
              Purpose-built dense tooling — keyboard-fast, no AI slop, no learning curve.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px] sm:gap-[24px]">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`
                  relative p-8 rounded-[24px] sm:rounded-[28px]
                  bg-[#0d0d0d] border border-white/[0.09]
                  transition-all duration-300 ease-out
                  ${featuresObs.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[18px]'}
                  hover:border-[#0D9488] hover:bg-[#121212] hover:-translate-y-[4px]
                `}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="w-[48px] h-[48px] rounded-[20px] bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center mb-6 text-[20px]">
                  {/* Icon placeholder - using text representation */}
                  <span className="font-[450]">{f.title.charAt(0)}</span>
                </div>
                <h3 className="text-white font-[450] text-[16px] sm:text-[17px] leading-[1.3] mb-2">
                  {f.title}
                </h3>
                <p className="text-white/50 text-[13px] leading-[1.55]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. RISK MATRIX — interactive, dark */}
      <section className="bg-[#000] py-24 sm:py-32 border-b border-white/[0.06]">
        <div className="w-full max-w-[720px] mx-auto px-5 sm:px-8 md:px-[82px] text-center">
          <h2 className="text-white text-[28px] sm:text-[36px] font-[450] leading-[1.1] tracking-[-0.02em] mb-3">
            Visualize Risk Priorities Instantly
          </h2>
          <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] leading-[1.6] max-w-[440px] mx-auto mb-12">
            Severity × Occurrence → Action Priority. Live matrix, no learning curve.
          </p>
          <div className="flex flex-col items-center gap-8">
            <RiskCalculatorWidget />
          </div>
        </div>
      </section>

      {/* 6. SPECS — two-column detailed, dark */}
      <section id="specifications" ref={specsObs.ref} className="bg-[#050505] border-y border-white/[0.07] py-24 sm:py-32">
        <div className="w-full max-w-[720px] mx-auto px-5 sm:px-8 md:px-[82px]">
          <div className="mb-12">
            <h2 className="text-white text-[28px] sm:text-[36px] font-[450] leading-[1.1] tracking-[-0.02em] mb-3">
              Technical Specifications
            </h2>
            <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] leading-[1.6] max-w-[420px]">
              Enterprise-grade, production-ready architecture.
            </p>
          </div>

          <div
            className={`
              rounded-[24px] sm:rounded-[28px] bg-[#0c0c0c] border border-white/[0.09] overflow-hidden
              ${specsObs.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[16px]'}
              transition-all duration-500 ease-out
            `}
          >
            <table className="w-full text-left" role="table">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.05]">
                  <th className="w-[32%] px-6 py-5 text-white/50 font-[450] text-[11px] sm:text-[12px] uppercase tracking-[0.08em]">
                    Category
                  </th>
                  <th className="px-6 py-5 text-white/50 font-[450] text-[11px] sm:text-[12px] uppercase tracking-[0.08em]">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {SPECS.map(([c, d]) => (
                  <tr key={c} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-6 py-5 text-white font-[450] text-[13px] sm:text-[14px]">
                      {c}
                    </td>
                    <td className="px-6 py-5 text-white/50 text-[13px] sm:text-[14px]">
                      {d}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. CONTACT — dark premium CTA strip with form card */}
      <section id="contact" ref={contactObs.ref} className="bg-[#000] py-24 sm:py-32">
        <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">
            <div className="lg:col-span-5"
              style={{
                opacity: contactObs.inView ? 1 : 0,
                transform: contactObs.inView ? 'translateX(0)' : 'translateX(-20px)',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
              }}
            >
              <h2 className="text-white text-[28px] sm:text-[36px] font-[450] leading-[1.1] tracking-[-0.02em] mb-4">
                Get in Touch
              </h2>
              <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] leading-[1.6] mb-8 max-w-[380px]">
                Demo, pricing or enterprise — the team reads every inquiry inside the admin dashboard.
              </p>
              <button
                onClick={handlePrimaryCTA}
                disabled={guestLoading}
                className="w-full sm:w-auto h-[52px] px-8 bg-[#0D9488] text-white font-[450] text-[15px] rounded-[14px] transition-colors hover:bg-[#0f766e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {guestLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  token ? 'Go to Dashboard' : 'Launch Preview'
                )}
              </button>
            </div>

            <div className="lg:col-span-7"
              style={{
                opacity: contactObs.inView ? 1 : 0,
                transform: contactObs.inView ? 'translateX(0)' : 'translateX(20px)',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
              }}
            >
              <form onSubmit={handleContactSubmit} className="p-8 sm:p-10 rounded-[28px] bg-[#0c0c0c] border border-white/[0.09]">
                {contactError && (
                  <div className="mb-6 p-4 rounded-[12px] bg-red-900/20 border border-red-900/30 text-red-300 text-[13px] font-[450]">
                    {contactError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[20px] mb-6">
                  <div>
                    <label htmlFor="name" className="block text-white/50 text-[12px] font-[450] uppercase tracking-[0.08em] mb-2">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full h-[48px] px-4 bg-[#050505] border border-white/[0.08] rounded-[10px] text-white placeholder-white/30 text-[14px] font-[450] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-white/50 text-[12px] font-[450] uppercase tracking-[0.08em] mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full h-[48px] px-4 bg-[#050505] border border-white/[0.08] rounded-[10px] text-white placeholder-white/30 text-[14px] font-[450] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[20px] mb-6">
                  <div>
                    <label htmlFor="company" className="block text-white/50 text-[12px] font-[450] uppercase tracking-[0.08em] mb-2">
                      Company
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={contactForm.company}
                      onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))}
                      className="w-full h-[48px] px-4 bg-[#050505] border border-white/[0.08] rounded-[10px] text-white placeholder-white/30 text-[14px] font-[450] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-white/50 text-[12px] font-[450] uppercase tracking-[0.08em] mb-2">
                      Inquiry Type
                    </label>
                    <select
                      id="type"
                      value={contactForm.type}
                      onChange={e => setContactForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full h-[48px] px-4 bg-[#050505] border border-white/[0.08] rounded-[10px] text-white text-[14px] font-[450] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all appearance-none bg-no-repeat bg-right-[12px] bg-center"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}
                    >
                      {INQUIRY_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-6">
                  <label htmlFor="message" className="block text-white/50 text-[12px] font-[450] uppercase tracking-[0.08em] mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-4 bg-[#050505] border border-white/[0.08] rounded-[10px] text-white placeholder-white/30 text-[14px] font-[450] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all resize-none"
                    placeholder="Your message..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={contactSubmitting || !contactForm.name || !contactForm.email || !contactForm.message}
                  className="w-full h-[52px] bg-[#0D9488] text-white font-[450] text-[15px] rounded-[14px] transition-colors hover:bg-[#0f766e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {contactSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER — deep black, minimal */}
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

      {contactSuccess && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
          <div className="px-6 py-4 rounded-[14px] bg-green-900/30 border border-green-900/50 text-green-300 font-[450] text-[14px] flex items-center gap-2">
            Thanks — we'll be in touch soon.
          </div>
        </div>
      )}
    </div>
  );
};