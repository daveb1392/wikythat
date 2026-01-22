# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wikithat.com** is a Next.js 15 web application that compares Wikipedia and Grokipedia articles side-by-side. Users search for topics and see summaries from both sources with AI-generated humorous verdicts.

**Tech Stack:**
- Next.js 15 (App Router) with React Server Components
- Tailwind CSS for styling
- Supabase for caching
- xAI Grok API for AI-generated verdicts
- Cheerio for web scraping
- Railway for hosting
- TypeScript

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Core Architecture

### API Strategy: Scraper + Supabase Cache + Grok Verdict

The application uses a **custom scraping approach with Supabase caching**:

1. **Grokipedia**: Custom scraper API route (`/api/scrape-grokipedia`) scrapes grokipedia.com using Cheerio
2. **Wikipedia**: REST API (`https://en.wikipedia.org/api/rest_v1/page/summary/{title}`) - free, 200 req/sec
3. **Supabase**: Caches both Wikipedia and Grokipedia articles to reduce API calls
4. **Grok Verdict**: xAI Grok API (`/api/grok-verdict`) generates snarky comparisons between the two sources

Key files: `lib/grokipedia.ts`, `lib/wikipedia.ts`, `lib/supabase.ts`, `app/api/scrape-grokipedia/route.ts`, `app/api/grok-verdict/route.ts`

### Static Generation Strategy

Pages use **ISR (Incremental Static Regeneration)** with 24-hour revalidation:
- Seed topics (defined in `lib/seed-topics.ts`) are pre-generated at build time via `generateStaticParams()`
- Non-seed topics are generated on-demand and cached
- Set `revalidate: 86400` for 24-hour cache lifetime

Key file: `app/compare/[topic]/page.tsx`

### Component Pattern

**Server Components (default):**
- `ComparisonPanel.tsx` - displays article summaries
- `ShareButtons.tsx` - social media share links
- `Analytics.tsx` - GA4 tracking script

**Client Components ('use client'):**
- `SearchBar.tsx` - search with Wikipedia autocomplete, keyboard navigation
- `VotingWidget.tsx` - localStorage-based voting (no backend)
- `GrokVerdict.tsx` - fetches and displays AI-generated comparison

### Data Flow

1. User searches topic → `SearchBar` navigates to `/compare/[topic]`
2. `page.tsx` fetches both Wikipedia and Grokipedia (checks Supabase cache first)
3. Results rendered server-side
4. `GrokVerdict` component fetches Grok's snarky comparison from `/api/grok-verdict`
5. Voting data stored in browser localStorage (no database)

## Environment Variables

```env
# Required for production
NEXT_PUBLIC_SITE_URL=https://wikithat.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Supabase (required for caching)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# xAI Grok API (required for AI-generated verdicts)
XAI_API_KEY=xai-xxxx
```

## Supabase Setup

Run the schema in `supabase-schema.sql` to create the required tables:
- `articles` - caches Wikipedia and Grokipedia content
- `comparisons` - caches Grok-generated verdicts

Tables use Row Level Security (RLS) with public read access.

## Security Features

### Rate Limiting
All API routes (`/api/scrape-grokipedia` and `/api/grok-verdict`) use Upstash Redis for rate limiting:
- **10 requests per minute per IP**
- Returns 429 status when limit exceeded
- Prevents API abuse and protects xAI API costs
- Falls back to in-memory rate limiting in development

Setup: Create free account at [upstash.com](https://upstash.com), create Redis database, add credentials to `.env`

### Prompt Injection Prevention
The `lib/sanitize.ts` module protects against prompt injection attacks:
- Sanitizes all user inputs before sending to Grok API
- Removes common injection patterns (`ignore previous instructions`, `system:`, etc.)
- Limits input lengths (200 chars for topics, 2000 chars for extracts)
- Validates slug formats for scraping

### Input Validation
- All API routes validate request bodies and query params
- JSON parsing errors return 400 status
- Missing required fields return 400 status
- Invalid slugs/topics are rejected before processing

## Key Implementation Details

### Wikipedia Autocomplete

`SearchBar.tsx` uses Wikipedia's OpenSearch API for real-time suggestions with 300ms debounce. Supports arrow key navigation and Enter/Escape handling.

### Grok Content Extraction

`lib/grokipedia.ts` includes `extractSummary()` helper that:
- Strips "Fact-checked by Grok" headers
- Takes first 2-3 paragraphs (max 600 chars)
- Returns early if content exceeds limit

### SEO & Metadata

- Dynamic metadata in `app/compare/[topic]/page.tsx` using `generateMetadata()`
- Sitemap auto-generated from seed topics in `app/sitemap.ts`
- Set `metadataBase` in `app/layout.tsx` for absolute URLs
- Use `next/image` with `remotePatterns` for Wikipedia thumbnails

### Error Handling

- Both APIs return `null` on failure
- Page shows 404 (`notFound()`) only if BOTH APIs fail
- Grokipedia shows fallback message if both unofficial and xAI fail
- Voting widget gracefully handles missing localStorage

## Railway Deployment

```bash
# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up

# Set environment variables
railway variables set NEXT_PUBLIC_SITE_URL=https://wikithat.com
railway variables set NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Config: `next.config.ts` sets `output: 'standalone'` for Railway compatibility.

## Code Organization

```
app/
├── layout.tsx          # Root layout with nav, footer, Analytics
├── page.tsx            # Homepage with SearchBar + popular topics
├── globals.css         # Tailwind directives
├── compare/[topic]/    # Dynamic comparison pages (ISR enabled)
├── sitemap.ts          # SEO sitemap generation
└── robots.ts           # Robots.txt rules

components/
├── SearchBar.tsx       # Client: search with autocomplete
├── ComparisonPanel.tsx # Server: side-by-side article display
├── VotingWidget.tsx    # Client: localStorage voting UI
├── ShareButtons.tsx    # Server: social share links
├── GrokVerdict.tsx     # Client: fetches AI-generated verdict
└── Analytics.tsx       # Server: GA4 script injection

lib/
├── wikipedia.ts        # Wikipedia API client with Supabase caching
├── grokipedia.ts       # Grokipedia scraper with Supabase caching
├── supabase.ts         # Supabase client and types
├── rate-limit.ts       # Upstash rate limiting utility
├── sanitize.ts         # Input sanitization for prompt injection prevention
└── seed-topics.ts      # Pre-generated topic list for SSG

app/api/
├── scrape-grokipedia/  # Cheerio-based Grokipedia scraper (rate-limited)
└── grok-verdict/       # xAI Grok API for generating comparisons (rate-limited)
```

## Seed Topics System

`lib/seed-topics.ts` contains 30 high-traffic topics (Elon Musk, Bitcoin, AI, etc.) that are:
- Pre-generated at build time via `generateStaticParams()`
- Displayed on homepage as "Popular Comparisons"
- Included in sitemap for SEO

To add new seed topics, update `seedTopics` array and redeploy.

## Testing Checklist

When implementing:
1. Test search autocomplete with 2+ character queries
2. Verify ISR works: check `Cache-Control` headers in production
3. Test Grokipedia fallback by temporarily blocking unofficial API
4. Confirm voting persists across page reloads (localStorage)
5. Validate social share URLs on X/Facebook/LinkedIn
6. Check image loading with Wikipedia thumbnails (Next.js Image)
7. Test 404 handling for non-existent topics

## Performance Targets

- Page load: <2 seconds (Lighthouse)
- Build time: Static generation for 30 seed topics
- Cache: 24-hour revalidation, 2-day server-side TTL (Grokipedia API)
- Bundle: Minimal client JS (only SearchBar, VotingWidget)
