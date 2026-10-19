import { Helmet } from 'react-helmet-async';
export interface SEOProps {
 title?: string; description?: string; keywords?: string; canonical?: string; lang?: string;
 ogType?: string; ogImage?: string; jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
 noindex?: boolean; alternates?: Array<{ lang: string; href: string }>;
}
const BASE_URL = 'https://fmeapex.online';
export function SEO({title = 'FMEApex — Connected quality engineering', description = 'Connect design structure, process risk, control plans, and verified actions in a digital FMEA workspace.', keywords = 'FMEA, DFMEA, PFMEA, process flow, control plan, quality engineering', canonical = '/', lang = 'en', ogType = 'website', ogImage = `${BASE_URL}/social-preview.svg`, jsonLd, noindex = false, alternates = []}: SEOProps) {
 const fullCanonical = canonical.startsWith('https://') ? canonical : `${BASE_URL}${canonical.split(/[?#]/)[0]}`;
 return <Helmet htmlAttributes={{lang}}>
  <title>{title}</title><meta name="description" content={description}/><meta name="keywords" content={keywords}/>
  <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'}/><link rel="canonical" href={fullCanonical}/>
  {alternates.map(alt => <link key={alt.lang} rel="alternate" hrefLang={alt.lang} href={alt.href}/>)}
  <meta property="og:type" content={ogType}/><meta property="og:url" content={fullCanonical}/><meta property="og:title" content={title}/>
  <meta property="og:description" content={description}/><meta property="og:image" content={ogImage}/><meta property="og:site_name" content="FMEApex"/>
  <meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content={title}/><meta name="twitter:description" content={description}/><meta name="twitter:image" content={ogImage}/>
  {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\u003c')}</script>}
 </Helmet>;
}
