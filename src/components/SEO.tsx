import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  type?: 'website' | 'article' | 'product';
  image?: string;
  noIndex?: boolean;
  jsonLd?: object;
  keywords?: string;
}

const SITE_URL = 'https://aynn.io';
const DEFAULT_IMAGE = 'https://storage.googleapis.com/gpt-engineer-file-uploads/Pz2xKwkLPlXyG6FmqAI4XtwjtIx2/social-images/social-1765237957534-Screenshot 2025-12-09 at 2.52.15 AM.png';

export const SEO = ({
  title,
  description,
  canonical,
  type = 'website',
  image = DEFAULT_IMAGE,
  noIndex = false,
  jsonLd,
  keywords,
}: SEOProps) => {
  const fullTitle = title.includes('AYN') ? title : `${title} | AYN`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="AYN" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@ayn_ai" />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

// Pre-configured JSON-LD schemas
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AYN AI',
  alternateName: ['AYN', 'عين AI', 'Perceptive AI', 'AYN Artificial Intelligence'],
  url: 'https://aynn.io',
  logo: 'https://aynn.io/favicon-brain.png',
  description: 'AYN AI is a perceptive artificial intelligence platform that learns your habits, understands your goals, and helps you succeed with AI employees, custom AI agents, and business automation.',
  sameAs: [
    'https://twitter.com/ayn_ai'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: 'https://aynn.io/support'
  },
  foundingDate: '2024',
  slogan: 'AI That Knows You'
};

// SoftwareApplication schema for AI platform
export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AYN AI Platform',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  description: 'AYN AI is a personal AI assistant and business automation platform featuring AI employees, custom AI agents, and smart automation tools.',
  url: 'https://aynn.io',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free to get started'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150'
  }
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AYN AI',
  alternateName: ['AYN', 'عين AI'],
  url: 'https://aynn.io',
  description: 'AYN AI - Personal AI Assistant That Learns You. Smart AI platform for AI employees, custom AI agents, and business automation.',
  inLanguage: ['en', 'ar', 'fr'],
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://aynn.io/search?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
};

export const createServiceSchema = (service: {
  name: string;
  description: string;
  url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: service.name,
  description: service.description,
  url: service.url,
  provider: {
    '@type': 'Organization',
    name: 'AYN',
    url: 'https://aynn.io'
  }
});

// BreadcrumbList schema for navigation hierarchy
export const createBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }))
});

// FAQPage schema for FAQ sections
export const createFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

export default SEO;
