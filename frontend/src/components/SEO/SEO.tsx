import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  lang?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = 'FMEApex — AI-Powered FMEA & Quality Risk Platform';
const DEFAULT_DESCRIPTION = 'Streamline FMEA quality processes with AIAG-VDA 7-step compliance, PFD-PFMEA bidirectional linking, Control Plan sync, and 21 CFR Part 11 audit trails.';
const DEFAULT_KEYWORDS = 'FMEA, PFMEA, DFMEA, PFD, Control Plan, AIAG-VDA, Quality Risk, 21 CFR Part 11, Action Priority';
const BASE_URL = 'https://fmeapex.online';

export const SEO: React.FC<SEOProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical = '/',
  lang = 'en',
  ogType = 'website',
  ogImage = `${BASE_URL}/favicon.svg`,
  jsonLd,
}) => {
  const fullCanonical = canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`;

  // Generate i18n hreflang URLs
  const cleanPath = canonical.replace(/^\/(en|de|ja|zh)/, '');
  const alternateLanguages = [
    { code: 'en', href: `${BASE_URL}/en${cleanPath}` },
    { code: 'de', href: `${BASE_URL}/de${cleanPath}` },
    { code: 'ja', href: `${BASE_URL}/ja${cleanPath}` },
    { code: 'zh', href: `${BASE_URL}/zh${cleanPath}` },
    { code: 'x-default', href: `${BASE_URL}/en${cleanPath}` },
  ];

  return (
    <Helmet htmlAttributes={{ lang }}>
      {/* Basic Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullCanonical} />

      {/* i18n Alternate Links */}
      {alternateLanguages.map(alt => (
        <link key={alt.code} rel="alternate" hrefLang={alt.code} href={alt.href} />
      ))}

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="FMEApex" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Custom JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
