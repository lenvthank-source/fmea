import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { API_BASE_URL } from '../../config';

type Post = { slug: string; title: string; excerpt: string; date: string; badge: string; author: string; };

const FALLBACK: Post[] = [
  { slug: 'ai-fmea-7-step-deep-dive', title: 'AI FMEA 7-Step Deep Dive — From Planning to Documentation', excerpt: 'How FMEApex enforces gating and AP lookups without AI slop.', date: '2026-07-20', badge: 'Product', author: 'FMEApex Team' },
  { slug: 'pfd-pfmea-orphan-detection', title: 'PFD ↔ PFMEA Orphan Detection at Scale', excerpt: 'Detect missing links before audit — with one query.', date: '2026-07-18', badge: 'Engineering', author: 'FMEApex Team' },
  { slug: 'control-plan-enterprise-sync', title: 'Control Plan Sync for Automotive', excerpt: 'Serializable control propagation for ZF, Bosch, Magna.', date: '2026-07-15', badge: 'Automotive', author: 'FMEApex Team' },
];

export const BlogListPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(FALLBACK);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/cms/blog/posts`);
        if (r.ok) {
          const j = await r.json();
          const arr = j.data || j;
          if (Array.isArray(arr) && arr.length) {
            if (!cancelled) setPosts(arr);
          }
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = posts.filter(p => !q || p.title.toLowerCase().includes(q.toLowerCase()) || p.excerpt.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#080A19] text-white font-sans antialiased">
      <SEO
        title="Blog — FMEApex | Quality, AI, Automotive"
        description="FMEApex blog — headless CMS (n8n automate POST /cms/blog/publish), BlogPosting JSON-LD, sitemap indexed."
        canonical="/blog"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Blog', name: 'FMEApex Blog', url: 'https://fmeapex.online/blog' }}
      />

      {/* Hero Section */}
      <section className="relative w-full min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080A19] via-[#080A19] to-[#050505] z-0" />
        <div className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-20">
          <div className="max-w-[720px] mx-auto text-center">
            <h1 className="text-white text-[36px] sm:text-[48px] md:text-[56px] lg:text-[64px] font-normal leading-[1.05] tracking-[-0.02em] mb-6">
              Blog
            </h1>
            <p className="text-white/50 text-[16px] sm:text-[18px] md:text-[20px] font-[450] leading-[1.5] max-w-[640px] mx-auto mb-8">
              Headless CMS <code className="bg-[#050505] px-2 py-0.5 rounded-[6px] text-[#0D9488] font-mono text-[12px]">POST /cms/blog/publish</code> → <code className="bg-[#050505] px-2 py-0.5 rounded-[6px] text-[#0D9488] font-mono text-[12px]">n8n</code> automation. Fallback 3 posts seed until first publish.
            </p>
            <div className="relative max-w-[400px] mx-auto">
              <input
                type="text"
                placeholder="Search posts…"
                value={q}
                onChange={e => setQ(e.target.value)}
                className="w-full h-[52px] px-6 pl-12 bg-[#050505] border border-white/[0.08] rounded-[14px] text-white placeholder-white/30 text-[14px] font-[450] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="bg-[#050505] py-24 sm:py-32 border-y border-white/[0.07]">
        <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px] sm:gap-[24px]">
            {filtered.map((p, i) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className={`
                  relative p-8 rounded-[24px] sm:rounded-[28px]
                  bg-[#0d0d0d] border border-white/[0.09]
                  transition-all duration-300 ease-out
                  hover:border-[#0D9488] hover:bg-[#121212] hover:-translate-y-[4px]
                  block h-full flex flex-col
                `}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="inline-block px-3 py-1.5 rounded-[8px] bg-[#0D9488]/15 text-[#0D9488] font-[450] text-[11px] sm:text-[12px] uppercase tracking-[0.05em] mb-4 w-fit">
                  {p.badge}
                </span>
                <h3 className="text-white font-[450] text-[16px] sm:text-[17px] leading-[1.3] mb-2 flex-1">
                  {p.title}
                </h3>
                <p className="text-white/50 text-[13px] leading-[1.55] mb-3 flex-1">
                  {p.excerpt}
                </p>
                <p className="text-white/40 text-[11px] sm:text-[12px] font-[450]">
                  {p.date} · {p.author}
                </p>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-white/50 text-[15px] font-[450]">No posts found matching "{q}"</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center mt-12">
            <Link
              to="/learn"
              className="h-[52px] px-8 border border-white/[0.15] rounded-[14px] text-white/70 font-[450] text-[15px] transition-colors hover:border-[#0D9488] hover:text-white hover:bg-white/[0.03] flex items-center justify-center"
            >
              Learn Hub
            </Link>
            <Link
              to="/product"
              className="h-[52px] px-8 bg-[#E9E9E9] text-[#0A0707] rounded-[14px] font-[450] text-[15px] transition-colors hover:bg-white flex items-center justify-center"
            >
              Product
            </Link>
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
};
export default BlogListPage;