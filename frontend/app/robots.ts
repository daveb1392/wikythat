import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/wiki/',
      },
      // Explicitly allow AI crawlers for ChatGPT, Claude, Perplexity, etc.
      {
        userAgent: [
          'GPTBot',              // OpenAI ChatGPT
          'ChatGPT-User',        // ChatGPT web browsing
          'CCBot',               // Common Crawl (used by many AI models)
          'Claude-Web',          // Anthropic Claude
          'anthropic-ai',        // Anthropic's crawler
          'PerplexityBot',       // Perplexity AI
          'Google-Extended',     // Google AI training
          'Applebot-Extended',   // Apple Intelligence
          'Diffbot',             // Diffbot AI
          'cohere-ai',           // Cohere AI
        ],
        allow: '/',
        disallow: '/wiki/',
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
