import { useEffect, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { SEO } from '../SEO/SEO';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { TrialButton } from './TrialButton';
import { useBackendReady } from '../../hooks/useBackendWarmup';

export function PublicLayout({ title, description, canonical, children, noindex = false, article = false }: { title: string; description: string; canonical: string; children: ReactNode; noindex?: boolean; article?: boolean }) {
 const location = useLocation();
 useBackendReady();
 useEffect(() => {
  if (!location.hash) { window.scrollTo(0,0); return; }
  const timer = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 100);
  return () => window.clearTimeout(timer);
 }, [location.pathname,location.hash]);
 return <div className="fmea-story public-site">
  <SEO title={`${title} — FMEApex`} description={description} canonical={canonical} noindex={noindex} ogType={article ? 'article' : 'website'} jsonLd={noindex ? undefined : {
   '@context':'https://schema.org', '@type':article ? 'Article' : 'WebPage',
   ...(article ? {headline:title,author:{'@type':'Organization',name:'FMEApex'}} : {name:title}),
   description, url:`https://fmeapex.online${canonical}`, inLanguage:'en',
   publisher:{'@type':'Organization',name:'FMEApex',url:'https://fmeapex.online/'},
  }} />
  <a className="story-skip" href="#main-content">Skip to content</a><SiteHeader />
  <main id="main-content" className="story-container">{children}</main><SiteFooter />
 </div>;
}
export function PublicCTA({ title = 'Follow the connection in a real workspace.', description = 'Explore the reference project, then try your own process.' }: {title?:string;description?:string}) {
 return <section className="public-cta"><div><h2>{title}</h2><p>{description}</p></div><TrialButton /></section>;
}
export function PublicNotFound() {
 const location = useLocation();
 return <PublicLayout title="Page not found" description="Find FMEApex guides, platform information, and engineering resources." canonical={location.pathname} noindex>
  <section className="public-hero"><span className="public-kicker">Page not found</span><h1>Let’s find the right connection.</h1><p>This page is unavailable. Browse the engineering resources or return to the product story.</p><div className="public-actions"><Link className="story-button" to="/learn">Browse resources</Link><Link className="public-link" to="/">Return home</Link></div></section>
 </PublicLayout>;
}
export function EnglishAlias() {
 const { lang } = useParams(); const location = useLocation();
 if (!lang || !['en','de','ja','zh'].includes(lang)) return <PublicNotFound />;
 const english = location.pathname.replace(/^\/(en|de|ja|zh)(?=\/|$)/,'') || '/';
 return <Navigate replace to={`${english}${location.search}${location.hash}`} />;
}
