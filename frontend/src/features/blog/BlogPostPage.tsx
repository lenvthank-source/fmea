import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
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
    <div className="bg-[#F7F6F3] min-h-screen">
      <SEO
        title={`${title} — FMEApex Blog`}
        description={post?.excerpt || 'FMEApex blog post.'}
        canonical={`/blog/${slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: title,
          datePublished: post?.date || '2026-07-20',
          author: { '@type': 'Organization', name: 'FMEApex' },
        }}
      />
      <SiteHeader />

      <section className="pt-[130px] pb-20 px-5 sm:px-8 lg:px-12 bg-white border-b border-[#E6E1D8]">
        <div className="max-w-[720px] mx-auto">
          {post?.badge && (
            <span className="inline-block px-3 py-1.5 rounded-full bg-[#F0FDF9] border border-[#99E5DA] text-[#0D9488] text-[12px] font-[650] uppercase tracking-[0.06em] mb-4">
              {post.badge}
            </span>
          )}
          <h1 className="text-[36px] sm:text-[46px] font-[650] tracking-[-0.02em] leading-[1.12] text-[#0F172A]">
            {title}
          </h1>
          <p className="mt-4 text-[14.5px] text-[#8A8F98]">
            {post?.date ? `${post.date} · ${post.author || 'FMEApex Team'}` : 'Published via headless CMS'}
          </p>
        </div>
      </section>

      <section className="py-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[720px] mx-auto">
          <article className="rounded-[20px] border border-[#E6E1D8] bg-white p-8 sm:p-12 prose prose-slate max-w-none">
            {loading ? (
              <p className="text-[#8A8F98]">Loading…</p>
            ) : post ? (
              <div className="text-[#334155] leading-[1.7] text-[16px] whitespace-pre-wrap font-sans">
                {post.content || post.excerpt}
              </div>
            ) : fallback ? (
              <div className="text-center py-8">
                <p className="text-[#64748B] mb-2">This post hasn’t been published yet.</p>
                <p className="text-[13px] text-[#94A3B8]">Publish it with <code className="px-1.5 py-0.5 bg-[#F1F5F9] rounded text-[#0D9488] font-mono text-[12px]">POST /cms/blog/publish</code>.</p>
              </div>
            ) : null}
          </article>

          <div className="mt-8 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 h-[46px] px-6 rounded-full border border-[#D8D3C8] text-[14.5px] font-[600] text-[#334155] hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
            >
              ← Back to all posts
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};
export default BlogPostPage;
