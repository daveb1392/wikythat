# Deep SEO Audit: wikithat.com

## Executive Summary

Wikithat.com is a Next.js-powered comparison tool that displays Wikipedia and Grokipedia articles side-by-side, allowing users to compare traditional encyclopedia content against AI-generated knowledge. While the site has solid foundational technical SEO (fast TTFB, schema markup, meta tags), it suffers from **several critical issues** that are likely preventing it from gaining any organic search traction. The most severe: a broken non-www/www redirect configuration that renders every URL in the sitemap either a 404 or 405 error for search engine crawlers, an OG image that returns 404, virtually zero indexable content on compare pages, and no supporting content infrastructure (blog, about, legal pages).[1]

***

## Site Architecture & Technology

| Attribute | Value |
|-----------|-------|
| Framework | Next.js (with SSR/prerendering) |
| Hosting | Railway (us-west2 edge) |
| Total indexed pages (sitemap) | 30 (1 homepage + 29 compare pages) |
| Pages linked from homepage | 12 compare pages |
| Analytics | Google Analytics (G-VMT7FGYDCT) + Google Ads (AW-17802176552) |
| SSL | Valid (TLSv1.3 / TLS_AES_128_GCM_SHA256) |
| Server response | ~254ms TTFB, ~294ms total load |
| HTML payload | ~48KB (homepage), ~38KB (compare pages) |

The site runs on Next.js with server-side rendering enabled (`x-nextjs-prerender: 1`) and aggressive CDN caching (`s-maxage=31536000`, `x-nextjs-cache: HIT`). It is hosted on Railway's edge infrastructure. The tech stack is modern and performant from a speed standpoint.

***

## 🚨 Critical Issues

### Broken Non-WWW / WWW Redirect (Severity: CRITICAL)

This is the single most damaging SEO issue on the site. The canonical URL configuration and the actual server behavior are in direct conflict:

| URL Pattern | HTTP Method | Status Code | Outcome |
|-------------|-------------|-------------|---------|
| `https://wikithat.com/` | HEAD | **405** Method Not Allowed | Crawler blocked |
| `https://wikithat.com/` | GET (with redirect) | 200 (→ www) | Works for browsers only |
| `https://wikithat.com/compare/Bitcoin` | GET | **404** | Page not found |
| `https://www.wikithat.com/` | GET | **200** | ✅ Works |
| `https://www.wikithat.com/compare/Bitcoin` | GET | **200** | ✅ Works |
| `http://wikithat.com/` | GET | **405** | Crawler blocked |

The cascade of problems this causes:

- **All canonical tags** point to `https://wikithat.com` (non-www), which returns 405 or 404 for crawlers
- **The sitemap.xml** lists all 30 URLs as non-www (`https://wikithat.com/compare/...`), and every compare page URL returns **404**
- **The robots.txt** sitemap reference points to `https://wikithat.com/sitemap.xml` (non-www)
- **Googlebot** will attempt to crawl canonical URLs and receive errors — meaning Google likely cannot properly index any page

**Fix:** Set up a proper 301 redirect from `wikithat.com` → `www.wikithat.com` at the DNS/load balancer level (not just the application), update all canonical tags to use `www.wikithat.com`, and update the sitemap to use `www.` URLs.

### Missing OG Image (Severity: HIGH)

Every page on the site references `https://wikithat.com/og-image.png` in OpenGraph and Twitter Card meta tags, but this URL returns **404**. This means:

- Social media shares (Twitter/X, Facebook, LinkedIn) will show no preview image
- Link unfurling in messaging apps (Slack, Discord, WhatsApp) will appear broken
- This directly impacts click-through rates from any social sharing or link sharing

**Fix:** Upload an actual og-image.png file to the www subdomain and update references to use `https://www.wikithat.com/og-image.png`.

### Extremely Thin Content on Compare Pages (Severity: HIGH)

The compare pages — which constitute 97% of the site's pages — have approximately **173 words of visible, server-rendered text**. The actual Wikipedia and Grokipedia article content appears to be loaded client-side via JavaScript, with only a truncated preview ("Read more →") rendered in the initial HTML.

This means Googlebot sees:

- A page title and H1 ("Comparing: Bitcoin")
- Two H2 headings ("Wikipedia" / "Grokipedia")
- A few sentences of preview text
- Schema markup
- No substantive content to index

For a comparison tool to rank, Google needs to see the actual comparison content in the initial HTML response. Client-side rendered content may eventually get indexed by Googlebot's rendering engine, but it is deprioritized and unreliable for new, low-authority domains.

**Fix:** Server-side render the full article comparison text (or at least a substantial excerpt of 500+ words per side) directly in the HTML response.

### Zero Internal Linking on Compare Pages (Severity: HIGH)

The compare pages contain **zero internal navigation links** — no link back to the homepage, no links to related comparisons, no breadcrumb navigation in the rendered HTML (despite breadcrumb schema being present). The only internal links are to static assets (CSS, JS, favicon).

This creates an "orphan page" problem where:

- Link equity from any external source cannot flow between pages
- Crawlers have no path to discover other compare pages from a compare page
- Users have no way to navigate to related topics

**Fix:** Add a visible navigation bar, "Related Comparisons" section, and functional breadcrumb links matching the breadcrumb schema that already exists.

***

## High-Priority Issues

### No Supporting Pages (Severity: HIGH)

The following standard pages all return **404**:

| Page | Status | SEO Impact |
|------|--------|------------|
| `/about` | 404 | Missing E-E-A-T signal — who built this tool? |
| `/blog` | 404 | No content marketing funnel |
| `/privacy` | 404 | Legal compliance issue (GDPR/CCPA) with GA tracking active |
| `/terms` | 404 | Legal compliance issue |
| `/contact` | 404 | Missing E-E-A-T signal |
| `/faq` | 404 | Despite having FAQPage schema on homepage |

Google's E-E-A-T guidelines heavily weight author/publisher transparency. A tool that compares encyclopedia sources but has no information about who operates it sends a poor trust signal. The privacy policy gap is particularly concerning given that Google Analytics and Google Ads tracking pixels are active on every page.[2]

### Invalid manifest.json (Severity: MEDIUM)

The HTML references `/manifest.json` for PWA support, but the file returns invalid JSON. This can cause console errors and may negatively impact Lighthouse scores.

### Duplicate Title on Homepage (Severity: MEDIUM)

The homepage `<title>` tag reads: `"Wikithat - Compare Wikipedia vs Grokipedia Side-by-Side"` which is acceptable, but the compare page titles contain a duplicate brand: `"Bitcoin: Wikipedia vs Grokipedia Comparison | Wikithat | Wikithat"`. The double "Wikithat" wastes valuable title tag characters.

***

## What's Working Well

### Meta Tags & Open Graph
The meta tag implementation is thorough and well-structured (aside from the non-www canonical and broken OG image issues). Each compare page has a unique, descriptive meta description and title tag. The `googlebot` directive (`max-video-preview:-1, max-image-preview:large, max-snippet:-1`) correctly signals to Google that it can use rich snippets freely.

### Schema Markup
The structured data implementation is above average:

- **Homepage:** `WebSite` schema with `SearchAction`, plus `FAQPage` schema with three Q&A pairs
- **Compare pages:** `WebPage` with `BreadcrumbList` and `Article` schema, including proper publisher and about entities

This is a strong foundation for rich results, provided Google can actually crawl and index the pages.

### robots.txt Configuration
The robots.txt explicitly allows AI crawlers (GPTBot, ChatGPT-User, Claude-Web, PerplexityBot, Google-Extended, etc.) with a `Crawl-delay: 1`. This is a smart move for Answer Engine Optimization (AEO) and positions the site to be cited by AI search tools. The `/wiki/` path is correctly disallowed to prevent crawling of internal wiki content.[3][1]

### Image Optimization
All images use Next.js Image component with proper `alt` text, `width`/`height` attributes (preventing CLS), `srcSet` for responsive loading, and `loading="lazy"` for below-fold images. The logo uses `fetchPriority` preload.

### Server Performance
TTFB of ~254ms and total page load of ~294ms is excellent. The Railway edge CDN caching with `s-maxage=31536000` means cached pages serve near-instantly. The site passes the Core Web Vitals speed threshold comfortably from a server perspective.

***

## Content & Keyword Strategy Assessment

### Current State
The site targets a very narrow niche: "Wikipedia vs Grokipedia comparison." Search volume for these terms is likely near-zero since Grokipedia itself is a new platform. The keyword meta tag lists `Wikipedia, Grokipedia, comparison, encyclopedia, AI knowledge, fact check, Grok AI, knowledge comparison` — but there is no content strategy to capture any of these terms through informational or long-tail content.

### Content Gap Analysis

- **No blog content** to capture informational queries like "wikipedia vs ai encyclopedia," "how accurate is grokipedia," "AI generated knowledge reliability"
- **No category/hub pages** grouping comparisons by topic (e.g., "Technology Comparisons," "Political Figure Comparisons")
- **No editorial commentary** on compare pages analyzing differences, biases, or accuracy — just raw side-by-side content
- **Only 29 compare pages** in the sitemap — to build meaningful organic traffic, the site would need hundreds or thousands of indexed comparison pages[4]

### Recommendations for Content Growth

- Add unique editorial analysis/verdict on each compare page (the "Grok verdict" feature exists but loads client-side)
- Create category landing pages that aggregate comparisons by topic
- Launch a blog targeting long-tail queries around AI vs traditional knowledge, encyclopedia accuracy, fact-checking
- Programmatically generate compare pages for high-volume Wikipedia topics to scale indexable pages into the thousands
- Add user-generated content signals (the voting feature exists but its data isn't visible in SSR HTML)

***

## Backlink & Domain Authority Profile

The site has **zero detectable backlinks** and no measurable domain authority. No SEO tools (Moz, Ahrefs, Semrush) return data for wikithat.com, confirming it is a brand-new domain with no external link profile.

Without backlinks, ranking for any competitive keyword is essentially impossible. The top Google results for comparable queries have domain authorities of 90+ and hundreds of thousands of referring domains. Building initial backlinks through digital PR, product launches (Product Hunt, Hacker News), and outreach to AI/tech publications would be the fastest path to establishing baseline authority.[5][6]

***

## Prioritized Action Plan

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P0 | Fix non-www → www 301 redirect at infrastructure level | Low | Critical — enables indexing |
| 🔴 P0 | Update all canonical tags, sitemap URLs to use `www.` | Low | Critical — enables indexing |
| 🔴 P0 | Upload valid og-image.png to correct path | Low | High — fixes social sharing |
| 🔴 P1 | Server-side render full comparison content | Medium | High — enables content indexing |
| 🔴 P1 | Add internal navigation/cross-links on compare pages | Low | High — enables crawlability |
| 🟡 P2 | Create /about, /privacy, /terms pages | Low | Medium — E-E-A-T + legal compliance |
| 🟡 P2 | Fix duplicate "Wikithat \| Wikithat" in compare page titles | Low | Low-Medium |
| 🟡 P2 | Fix manifest.json | Low | Low |
| 🟢 P3 | Build category/hub pages for topic groups | Medium | Medium — internal linking + new entry points |
| 🟢 P3 | Launch blog with AI vs encyclopedia content | High | High long-term — organic traffic driver |
| 🟢 P3 | Scale to hundreds/thousands of compare pages | Medium | High — expands indexable footprint |
| 🟢 P3 | Start backlink acquisition (PR, Product Hunt, outreach) | High | Critical long-term — domain authority |

***

## Technical SEO Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| **Crawlability** | 2/10 | Broken redirects, sitemap points to 404s, no internal links |
| **Indexability** | 2/10 | Canonicals broken, thin content, CSR dependency |
| **On-Page SEO** | 6/10 | Good meta tags, schema, headings — broken by redirect issues |
| **Content Quality** | 2/10 | ~173 words SSR per page, no editorial, no blog |
| **Site Architecture** | 2/10 | Flat structure, no navigation, no supporting pages |
| **Page Speed** | 9/10 | Excellent TTFB, CDN caching, optimized images |
| **Schema/Structured Data** | 8/10 | Strong implementation with WebSite, FAQPage, SearchAction, Article |
| **Mobile** | 8/10 | Responsive viewport, Next.js responsive design |
| **Security** | 9/10 | Valid TLS 1.3, HTTPS |
| **Backlink Profile** | 0/10 | No detectable backlinks |
| **Overall** | 3/10 | Strong tech foundation undermined by critical configuration errors and content gaps |

The site has a solid technical foundation that would score much higher once the non-www redirect, content rendering, and internal linking issues are resolved. The P0 fixes (redirect + canonical + OG image) require minimal effort and would immediately unlock the ability for Google to crawl and index the site properly.