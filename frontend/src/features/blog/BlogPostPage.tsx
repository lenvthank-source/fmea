import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { API_BASE_URL } from '../../config';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/cms/blog/posts/${slug}`);
        if (r.ok) {
          const j = await r.json();
          if (!cancelled) setPost(j.data || j);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const title = post?.title || slug?.replace(/-/g, ' ') || 'Post';
  const fallback = !post && !loading;

  return (
    <div className="min-h-screen bg-[#080A19] text-white font-sans antialiased">
      <SEO
        title={`${title} — FMEApex Blog`}
        description={post?.excerpt || 'FMEApex blog post — headless CMS.'}
        canonical={`/blog/${slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: title,
          datePublished: post?.date || '2026-07-20',
          author: { '@type': 'Organization', name: 'FMEApex' },
        }}
      />

      {/* Hero Section */}
      <section className="relative w-full min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080A19] via-[#080A19] to-[#050505] z-0" />
        <div className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-16">
          <div className="max-w-[720px] mx-auto text-center">
            <h1 className="text-white text-[32px] sm:text-[42px] md:text-[48px] font-normal leading-[1.1] tracking-[-0.02em] mb-4">
              {title}
            </h1>
            {post && (
              <span className="inline-block px-3 py-1.5 rounded-[8px] bg-[#0D9488]/15 text-[#0D9488] font-[450] text-[11px] sm:text-[12px] uppercase tracking-[0.05em] mb-4">
                {post.badge || 'Blog'}
              </span>
            )}
            <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] leading-[1.5]">
              {post?.date ? `${post.date} · ${post.author || 'FMEApex Team'}` : 'Headless CMS — POST /cms/blog/publish from n8n'}
            </p>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="bg-[#050505] py-16 sm:py-24 border-y border-white/[0.07]">
        <div className="w-full max-w-[720px] mx-auto px-5 sm:px-8 md:px-[82px]">
          <div className="rounded-[24px] sm:rounded-[28px] bg-[#0c0c0c] border border-white/[0.09] p-8 sm:p-12">
            {post ? (
              <div className="prose prose-invert max-w-none" style={{ lineHeight: 1.7 }}>
                <div className="text-white/70 text-[15px] sm:text-[16px] font-[450] whitespace-pre-wrap">
                  {post.content || post.excerpt}
                </div>
              </div>
            ) : fallback ? (
              <div className="text-center py-12">
                <p className="text-white/50 text-[15px] font-[450] mb-4">
                  Headless CMS not yet populated for <code className="bg-[#050505] px-2 py-0.5 rounded-[6px] text-[#0D9488] font-mono text-[12px]">{slug}</code>.
                </p>
                <p className="text-white/40 text-[13px] font-[450] mb-6">
                  Publish via <code className="bg-[#050505] px-2 py-0.5 rounded-[6px] text-[#0D9488] font-mono text-[12px]">POST /cms/blog/publish</code> (n8n).
                </p>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 h-[52px] px-8 bg-[#E9E9E9] text-[#0A0707] rounded-[14px] font-[450] text-[15px] transition-colors hover:bg-white"
                >
                  ← Back to Blog
                </Link>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/50 text-[15px] font-[450] animate-pulse">Loading…</p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 h-[52px] px-8 border border-white/[0.15] rounded-[14px] text-white/70 font-[450] text-[15px] transition-colors hover:border-[#0D9488] hover:text-white hover:bg-white/[0.03]"
            >
              ← Back to Blog
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
export default BlogPostPage;