import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
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
    <div className="bg-[#F7F6F3] min-h-screen">
      <SEO
        title="Blog — FMEApex | Quality, AI, Automotive"
        description="FMEApex blog — headless CMS. Product updates, engineering deep-dives, automotive compliance."
        canonical="/blog"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Blog', name: 'FMEApex Blog', url: 'https://fmeapex.online/blog' }}
      />
      <SiteHeader />

      {/* Hero */}
      <section className="pt-[120px] pb-14 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[680px] mx-auto text-center">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-[#0D9488] text-[12px] font-[650] uppercase tracking-[0.08em]">
            Blog
          </span>
          <h1 className="mt-5 text-[40px] sm:text-[52px] leading-[1.05] font-[650] tracking-[-0.02em] text-[#0F172A]">
            Ideas for quality engineers.
          </h1>
          <p className="mt-4 text-[16px] text-[#5B6470] max-w-[500px] mx-auto">
            Shipping notes, engineering deep-dives, and what we learn running FMEAs at scale.
          </p>

          <div className="relative max-w-[420px] mx-auto mt-8">
            <input
              type="text"
              placeholder="Search posts…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full h-[48px] pl-11 pr-4 rounded-[12px] border border-[#D8D3C8] bg-white text-[14.5px] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="pb-24 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <Link
              key={p.slug}
              to={`/blog/${p.slug}`}
              className="group rounded-[18px] border border-[#E6E1D8] bg-white p-6 flex flex-col hover:-translate-y-1 hover:shadow-[0_20px_44px_-16px_rgba(15,23,42,0.14)] hover:border-[#0D9488]/30 transition-all h-full"
            >
              <span className="inline-block self-start px-2.5 py-1 rounded-md bg-[#F0FDF9] border border-[#99E5DA] text-[#0D9488] text-[10.5px] font-[650] uppercase tracking-[0.06em] mb-3">
                {p.badge}
              </span>
              <h3 className="text-[16.5px] font-[650] text-[#0F172A] leading-[1.3] flex-1 mb-3">{p.title}</h3>
              <p className="text-[13.5px] leading-[1.55] text-[#5B6470] flex-1 mb-4">{p.excerpt}</p>
              <p className="text-[12px] text-[#8A8F98]">{p.date} · {p.author}</p>
            </Link>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-[14px] text-[#8A8F98] py-16">No posts found matching “{q}”.</p>
        )}
      </section>

      <SiteFooter />
    </div>
  );
};
export default BlogListPage;
