import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import { API_BASE_URL } from '../../config';
import { Newspaper, Search, ArrowRight, Calendar, User } from 'lucide-react';

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  badge: string;
  author: string;
};

const FALLBACK: Post[] = [
  {
    slug: 'ai-fmea-7-step-deep-dive',
    title: 'AI FMEA 7-Step Deep Dive — From 5Ts Planning to 21 CFR Part 11 Documentation',
    excerpt: 'How FMEApex enforces strict phase gating and deterministic AP lookups without probabilistic AI black-box hallucinations.',
    date: 'July 2026',
    badge: 'Core Methodology',
    author: 'Dr. Marcus Vance, CQE',
  },
  {
    slug: 'pfd-pfmea-orphan-detection',
    title: 'PFD ↔ PFMEA Bidirectional Linking & Orphan Operation Detection at Scale',
    excerpt: 'Detect missing operations and special characteristic gaps across shop floor routings before external customer audits.',
    date: 'July 2026',
    badge: 'Sync Architecture',
    author: 'K. Patel (Process Lead)',
  },
  {
    slug: 'control-plan-enterprise-sync',
    title: 'Dynamic Control Plan Generation for Automotive Tier-1 Powertrain Lines',
    excerpt: 'Serializable propagation of critical tolerances and reaction plans between the PFMEA matrix and plant floor inspection stations.',
    date: 'June 2026',
    badge: 'Automotive Quality',
    author: 'FMEApex Engineering CFT',
  },
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
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = posts.filter(
    (p) =>
      !q ||
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(q.toLowerCase()) ||
      p.badge.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="bg-[#FBFBFC] min-h-screen text-slate-900 font-sans antialiased selection:bg-[#FF5500]/20 selection:text-slate-900">
      <SEO
        title="Engineering Blog — FMEApex | Quality Intelligence & AIAG-VDA Deep Dives"
        description="Technical deep-dives, methodology breakdowns, and shipping updates for automotive, aerospace, and medical quality engineers."
        canonical="/blog"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'FMEApex Engineering Blog',
          url: 'https://fmeapex.online/blog',
        }}
      />
      <SiteHeader />

      {/* Hero */}
      <section className="pt-32 sm:pt-40 pb-16 px-4 sm:px-6 lg:px-8 bg-tech-dots border-b border-slate-200">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-xs mb-6">
            <Newspaper className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Engineering Dispatches & Research</span>
          </div>

          <h1 className="text-[38px] sm:text-[54px] font-extrabold leading-[1.06] tracking-[-0.035em] text-slate-900 mb-5 ff-heading">
            Ideas & rigor for <span className="text-[#FF5500]">quality engineers.</span>
          </h1>

          <p className="text-[17px] sm:text-[20px] leading-[1.6] text-slate-600 max-w-[620px] mx-auto mb-10 font-normal">
            Technical analysis, functional safety case studies, and engineering architecture for zero-defect manufacturing systems.
          </p>

          {/* Search Box */}
          <div className="relative max-w-[480px] mx-auto">
            <input
              type="text"
              placeholder="Search articles by keyword, standard, or topic…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-xs transition"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((p) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-7 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono font-bold uppercase tracking-wider border border-slate-200">
                      {p.badge}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {p.date}
                    </span>
                  </div>

                  <h2 className="text-[18px] font-bold text-slate-900 leading-snug group-hover:text-[#FF5500] transition-colors mb-3 ff-heading">
                    {p.title}
                  </h2>

                  <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">
                    {p.excerpt}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {p.author}
                  </span>
                  <span className="text-slate-900 group-hover:text-[#FF5500] font-bold flex items-center gap-1 transition-colors">
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 p-8 rounded-2xl bg-white border border-slate-200 max-w-[600px] mx-auto">
              <p className="text-base text-slate-600 mb-2">No articles found matching “{q}”.</p>
              <button
                onClick={() => setQ('')}
                className="text-xs font-mono font-bold text-[#FF5500] hover:underline"
              >
                Clear search query
              </button>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default BlogListPage;
