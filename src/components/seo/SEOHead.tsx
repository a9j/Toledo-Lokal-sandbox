import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'business.business' | 'event';
  keywords?: string[];
  jsonLd?: Record<string, unknown>;
}

const DEFAULT_TITLE = 'ToledoLokal - Discover the Glass City';
const DEFAULT_DESCRIPTION = 'Discover local businesses, events, and community in Toledo, Ohio. Your guide to the Glass City.';
const DEFAULT_IMAGE = 'https://storage.googleapis.com/gpt-engineer-file-uploads/6G2pHJ9eYIcpVB1xcAga8mH45693/social-images/social-1768013827620-RW1_1859.jpg';
const SITE_URL = 'https://toledolokal.com';

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  keywords = [],
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ToledoLokal` : DEFAULT_TITLE;
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  
  // Default keywords for Toledo
  const defaultKeywords = [
    'Toledo Ohio',
    'Glass City',
    'local businesses',
    'Toledo events',
    'Toledo restaurants',
    'Toledo attractions',
    'things to do in Toledo',
    'Toledo community',
  ];
  
  const allKeywords = [...new Set([...defaultKeywords, ...keywords])];

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update meta tags
    const updateMeta = (property: string, content: string, isName = false) => {
      const attribute = isName ? 'name' : 'property';
      let element = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard meta tags
    updateMeta('description', description, true);
    updateMeta('keywords', allKeywords.join(', '), true);
    updateMeta('author', 'ToledoLokal', true);

    // Open Graph
    updateMeta('og:title', fullTitle);
    updateMeta('og:description', description);
    updateMeta('og:image', image);
    updateMeta('og:url', fullUrl);
    updateMeta('og:type', type);
    updateMeta('og:site_name', 'ToledoLokal');
    updateMeta('og:locale', 'en_US');

    // Twitter
    updateMeta('twitter:title', fullTitle, true);
    updateMeta('twitter:description', description, true);
    updateMeta('twitter:image', image, true);
    updateMeta('twitter:card', 'summary_large_image', true);
    updateMeta('twitter:site', '@ToledoLokal', true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // JSON-LD structured data
    const existingScript = document.querySelector('script[data-seo-jsonld]');
    if (existingScript) {
      existingScript.remove();
    }

    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    // Cleanup on unmount
    return () => {
      const seoScript = document.querySelector('script[data-seo-jsonld]');
      if (seoScript) {
        seoScript.remove();
      }
    };
  }, [fullTitle, description, image, fullUrl, type, allKeywords, jsonLd]);

  return null;
}

// Helper to create LocalBusiness JSON-LD
export function createBusinessJsonLd(business: {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  slug?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    address: business.address ? {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: 'Toledo',
      addressRegion: 'OH',
      addressCountry: 'US',
    } : undefined,
    telephone: business.phone,
    url: business.website,
    image: business.image,
    aggregateRating: business.rating ? {
      '@type': 'AggregateRating',
      ratingValue: business.rating,
      reviewCount: business.reviewCount || 0,
    } : undefined,
  };
}

// Helper to create Event JSON-LD
export function createEventJsonLd(event: {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  image?: string;
  ticketUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location ? {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Toledo',
        addressRegion: 'OH',
        addressCountry: 'US',
      },
    } : undefined,
    image: event.image,
    offers: event.ticketUrl ? {
      '@type': 'Offer',
      url: event.ticketUrl,
    } : undefined,
  };
}

// Helper to create WebSite JSON-LD
export function createWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ToledoLokal',
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/explore?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// Helper to create Organization JSON-LD
export function createOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ToledoLokal',
    url: SITE_URL,
    logo: `${SITE_URL}/pwa-512x512.png`,
    description: DEFAULT_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Toledo',
      addressRegion: 'OH',
      addressCountry: 'US',
    },
    sameAs: [
      'https://twitter.com/ToledoLokal',
    ],
  };
}
