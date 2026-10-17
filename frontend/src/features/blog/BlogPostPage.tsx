import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import { API_BASE_URL } from '../../config';
import { Calendar, User, ChevronRight, ArrowLeft, ShieldCheck } from 'lucide-react';

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
          const data = j.data || j;
          if (!cancelled) setPost(data);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const title = post?.title || slug?.replace(/-/g, ' ') || 'Engineering Dispatch';
  const fallback = !post && !loading;

  return (
    <div className="bg-[#FBFBFC] min-h-screen text-slate-900 font-sans antialiased selection:bg-[#FF5500]/20 selection:text-slate-900">
      <SEO
        title={`${title} — FMEApex Engineering Blog`}
        description={post?.excerpt || 'FMEApex engineering research and methodology dispatch.'}
        canonical={`/blog/${slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: title,
          datePublished: post?.date || '2026-07-20',
          author: { '@type': 'Organization', name: 'FMEApex Engineering Team' },
        }}
      />
      <SiteHeader />

      {/* Hero Header */}
      <section className="pt-32 sm:pt-40 pb-16 px-4 sm:px-6 lg:px-8 bg-tech-dots border-b border-slate-200">
        <div className="max-w-[820px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-6">
            <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/blog" className="hover:text-slate-900 transition-colors">Blog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold truncate max-w-[260px]">{title}</span>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>{post?.badge || 'Engineering Research'}</span>
            </div>

            <h1 className="text-[32px] sm:text-[46px] font-extrabold leading-[1.1] tracking-[-0.03em] text-slate-900 ff-heading">
              {title}
            </h1>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{post?.date || 'Published via FMEApex CMS'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{post?.author || 'FMEApex CFT Lead'}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[820px] mx-auto">
          <article className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-12 shadow-xs">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-5/6" />
              </div>
            ) : post ? (
              <div className="text-slate-700 leading-[1.8] text-[16px] whitespace-pre-wrap font-sans space-y-4">
                {post.content || post.excerpt}
              </div>
            ) : fallback ? (
              <div className="text-center py-12 space-y-3">
                <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Article Pending Peer Review</h3>
                <p className="text-sm text-slate-600 max-w-[460px] mx-auto">
                  This engineering dispatch is currently in technical CFT review before publication. Please check back shortly or explore our active quality guides.
                </p>
                <div className="pt-4">
                  <Link
                    to="/learn"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <span>Browse Quality Engineering Guides →</span>
                  </Link>
                </div>
              </div>
            ) : null}
          </article>

          {/* Navigation Back */}
          <div className="mt-8 flex items-center justify-between">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Articles</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#FF5500] hover:underline"
            >
              <span>Launch Free Guest Sandbox →</span>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default BlogPostPage;
