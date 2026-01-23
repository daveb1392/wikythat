# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wikithat.com** is a Next.js 15 web application that compares Wikipedia and Grokipedia articles side-by-side. Users search for topics and see summaries from both sources with AI-generated humorous verdicts.

**Tech Stack:**
- **Frontend:** Next.js 15 (App Router) with React Server Components, Tailwind CSS, TypeScript
- **Backend:** Python FastAPI with BeautifulSoup for Grokipedia scraping
- **Database:** Supabase for caching articles and domain metrics
- **AI:** xAI Grok API for AI-generated verdicts
- **Hosting:** Railway for both frontend and backend
- **APIs:** Wikipedia REST API, DataForSEO for domain metrics

## Development Commands

### Frontend (Next.js)
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

### Backend (Python API)
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server
python main.py
# or with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# API docs available at http://localhost:8000/docs
```

## Core Architecture

### API Strategy: Python Backend + Supabase Cache + Grok Verdict

The application uses a **separate Python backend for Grokipedia scraping with Supabase caching**:

1. **Grokipedia**: Python FastAPI (`backend/main.py`) scrapes grokipedia.com using BeautifulSoup
   - Runs on port 8000 in development
   - 2-day content caching, rate limiting (100 req/min)
   - More secure than client-side scraping, handles JavaScript-rendered content
2. **Wikipedia**: REST API (`https://en.wikipedia.org/api/rest_v1/page/summary/{title}`) - free, 200 req/sec
3. **Supabase**: Caches both Wikipedia and Grokipedia articles to reduce API calls
4. **Grok Verdict**: xAI Grok API (`/api/grok-verdict`) generates snarky comparisons between the two sources

Key files:
- Frontend: `lib/grokipedia.ts`, `lib/wikipedia.ts`, `lib/supabase.ts`, `app/api/grok-verdict/route.ts`
- Backend: `backend/main.py` (Python FastAPI server)

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

### Data Flow (Complete User Journey)

**1. Homepage / Search**
- User lands on homepage → sees seed topics and `SearchBar`
- User types in search (2+ chars) → `SearchBar` queries:
  - Wikipedia OpenSearch API (gets article suggestions)
  - `/api/check-grokipedia-slug` (batch checks `grokipedia_slugs` table)
  - **Only shows topics available on BOTH platforms** (prevents 404s)
- User clicks suggestion or presses Enter → navigates to `/compare/[topic]`

**2. Comparison Page (`/compare/[topic]`)**
- Server-side rendering fetches both sources in parallel:
  - **Wikipedia**: Calls `lib/wikipedia.ts` → checks Supabase `articles` cache → if miss, fetches from Wikipedia API → caches result
  - **Grokipedia**: Calls `lib/grokipedia.ts` → checks Supabase `articles` cache → if miss, calls Python backend `/page/{slug}` → backend scrapes grokipedia.com → caches result
- Both summaries rendered server-side in `ComparisonPanel`

**3. Grok Verdict (Client-Side)**
- `GrokVerdict` component loads on client
- Calls `/api/grok-verdict` with both article summaries
- Backend checks `comparisons` cache (7-day TTL) → if miss, calls xAI Grok API → caches verdict
- **7-day cache prevents cost explosion if site goes viral**

**4. Weekly Slug Sync (GitHub Actions)**
- Runs every Sunday at 2 AM UTC (or manual trigger)
- `scripts/sync-grokipedia-slugs.ts` calls Python backend:
  - `/sitemap-index` → gets list of 6M+ sitemap URLs
  - `/sitemap?url=...` → fetches individual sitemaps (rate-limited)
- Inserts/updates slugs in Supabase `grokipedia_slugs` table
- Enables autocomplete to know which topics exist on Grokipedia

## Environment Variables

### Frontend (.env.local)
```env
# Required for production
NEXT_PUBLIC_SITE_URL=https://wikithat.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Supabase (required for caching)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# xAI Grok API (required for AI-generated verdicts)
XAI_API_KEY=xai-xxxx

# Python Grokipedia API (required for scraping)
GROKIPEDIA_API_URL=http://localhost:8000  # Development
# GROKIPEDIA_API_URL=https://your-backend.railway.app  # Production

# Upstash Redis (optional, for rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# DataForSEO API (optional, for domain metrics)
DATAFORSEO_API_AUTH=your-base64-encoded-credentials
```

### Backend (backend/.env)
```env
# Optional: API Analytics
ANALYTICS_KEY=your-analytics-key

# Required: Health endpoint secret
HEALTH_SECRET=your-secret-key
```

## Supabase Setup

Run the schema in `supabase-schema.sql` to create the required tables:

**Core Tables:**
- `articles` - Caches full Wikipedia and Grokipedia article content (title, extract, thumbnail, URL)
  - Unique constraint on `(topic, source)` to prevent duplicates
  - 2-day TTL for Grokipedia content
- `comparisons` - Caches Grok-generated verdicts (AI comparison between both sources)
  - **7-day TTL to prevent API cost explosion during viral traffic**
  - Unique constraint on `topic`
- `grokipedia_slugs` - Lightweight index of 6M+ Grokipedia article slugs (from sitemaps)
  - Used by SearchBar autocomplete to filter results
  - Updated weekly via GitHub Actions
  - Stores: slug, title, last_modified timestamp
- `grokipedia_sync_status` - Tracks weekly sitemap sync progress
  - Fields: total_slugs, last_sync_started, last_sync_completed, sync_status, error_message
- `trust_votes` - Stores vote counts per topic/source (currently localStorage-based, table for future use)
- `domain_metrics` - Caches DataForSEO domain metrics (for /for-sale page)
- `domain_valuations` - Caches AI-generated domain valuations

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
├── backend/                    # Python FastAPI backend
│   ├── main.py                # Grokipedia scraper API (BeautifulSoup)
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment variables template
│   └── README.md             # Backend documentation
│
├── frontend/                  # Reserved for future frontend-only files
│
├── _deprecated/               # Archived old code (not in use)
│   └── scrape-grokipedia/    # Old Cheerio-based scraper (replaced)
│
├── app/                       # Next.js App Router (Frontend)
│   ├── layout.tsx            # Root layout with nav, footer, Analytics
│   ├── page.tsx              # Homepage with SearchBar + popular topics
│   ├── globals.css           # Tailwind directives
│   ├── compare/[topic]/      # Dynamic comparison pages (ISR enabled)
│   ├── for-sale/             # Domain for-sale page with metrics
│   ├── sitemap.ts            # SEO sitemap generation
│   ├── robots.ts             # Robots.txt rules
│   └── api/
│       ├── grok-verdict/     # xAI Grok API for generating comparisons
│       └── domain-metrics/   # DataForSEO domain metrics API
│
├── components/                # React components
│   ├── SearchBar.tsx         # Client: search with autocomplete
│   ├── ComparisonPanel.tsx   # Server: side-by-side article display
│   ├── VotingWidget.tsx      # Client: localStorage voting UI
│   ├── ShareButtons.tsx      # Server: social share links
│   ├── GrokVerdict.tsx       # Client: fetches AI-generated verdict
│   ├── DomainMetrics.tsx     # Client: displays domain metrics
│   ├── DomainValuation.tsx   # Client: displays AI valuation
│   └── Analytics.tsx         # Server: GA4 script injection
│
├── lib/                       # Utility libraries
│   ├── wikipedia.ts          # Wikipedia API client with Supabase caching
│   ├── grokipedia.ts         # Calls Python backend API
│   ├── supabase.ts           # Supabase client and types
│   ├── rate-limit.ts         # Upstash rate limiting utility
│   ├── sanitize.ts           # Input sanitization for prompt injection prevention
│   └── seed-topics.ts        # Pre-generated topic list for SSG
│
└── scripts/                   # Automation scripts
    ├── sync-grokipedia-slugs.ts     # Weekly sitemap sync (GitHub Actions)
    ├── fetch-domain-metrics.ts      # DataForSEO API fetcher
    └── generate-domain-valuation.ts # Grok-powered domain valuation
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

## Current Implementation Status

### **Architecture Migration (COMPLETED ✅)**

**Goal:** Move all Grokipedia scraping through Python backend to prevent abuse and enable proper rate limiting via Redis.

**Python Backend Endpoints:**
- ✅ `/page/{slug}` - Scrapes single Grokipedia article with full content extraction
- ✅ `/sitemap-index` - Fetches Grokipedia sitemap index XML (rate-limited)
- ✅ `/sitemap?url=` - Fetches individual sitemap XML files (rate-limited)
- ✅ `/health` - Health check with cache stats

---

### **✅ COMPLETED TASKS**

**1. Backend Improvements ✅**
- ✅ Comprehensive logging (requests, responses, cache hits/misses, errors, rate limits, timing)
- ✅ `/sitemap-index` endpoint with rate limiting and error handling
- ✅ `/sitemap` endpoint with URL validation (only allows assets.grokipedia.com)
- ✅ All endpoints tested and working (`/docs` at http://localhost:8000/docs)

**2. Frontend Logging ✅**
- ✅ Server-side logging in all API routes:
  - `/api/grok-verdict` - logs cache hits/misses, API costs (~$0.02/call), response times
  - `lib/wikipedia.ts` - logs cache hits/misses, API status codes
  - `lib/grokipedia.ts` - logs backend API calls, cache status
  - `/api/search-wikipedia` - logs query and result counts

**3. Cache & Cost Management ✅**
- ✅ 7-day Grok verdict cache enforced (line 80 in `grok-verdict/route.ts`)
- ✅ Prevents API cost explosion during viral traffic
- ✅ Cache hit logging shows "$0.02 saved" for monitoring

**4. Slug Sync Migration ✅**
- ✅ `scripts/sync-grokipedia-slugs.ts` now calls Python backend:
  - Uses `GROKIPEDIA_API_URL/sitemap-index` instead of direct fetch
  - Uses `GROKIPEDIA_API_URL/sitemap?url=...` for individual sitemaps
  - Smart upsert logic (only inserts NEW/CHANGED slugs, skips existing)
- ✅ `.github/workflows/sync-grokipedia-slugs.yml` updated with `GROKIPEDIA_API_URL` env var
- ✅ Currently synced: 3.3M+ slugs (partial sync completed)

**5. Monetization Features ✅**
- ✅ `DonationButton.tsx` component with:
  - BTC, Solana, Ethereum wallet addresses
  - Copy-to-clipboard functionality
  - Modal UI with success feedback
  - Placed in header next to logo
- ✅ Ad placeholder DIVs:
  - Header: 728x90 leaderboard (below navigation)
  - Footer: 300x250 medium rectangle (above footer text)

**6. UI Improvements ✅**
- ✅ ComparisonPanel text truncation:
  - Shows first substantial paragraph only (skips "Fact-checked by Grok" headers)
  - 400 character limit with "..." truncation
  - Even text display across both Wikipedia and Grokipedia cards
  - "Read more →" link to full article

**7. SearchBar Behavior ✅**
- ✅ Shows all Wikipedia suggestions (no Grokipedia filtering for now - partial slug sync)
- ✅ Mandatory selection from dropdown (Enter auto-selects first suggestion)
- ✅ No navigation allowed without valid suggestion
- ✅ Shows "No matches found" when Wikipedia has no results

---

### **⏳ REMAINING TASKS**

**1. Complete Slug Sync (Optional - for production)**
   - Run full sync to populate remaining ~2.7M slugs (currently at 3.3M/6M)
   - Re-enable Grokipedia filtering in SearchBar once sync completes
   - Monitor sync progress via `grokipedia_sync_status` table

**2. Production Deployment Checklist**
   - [ ] Set GitHub Secret: `GROKIPEDIA_API_URL` → production backend URL
   - [ ] Deploy Python backend to Railway
   - [ ] Deploy Next.js frontend to Railway/Vercel
   - [ ] Run initial slug sync in production
   - [ ] Verify rate limiting works (Upstash Redis)
   - [ ] Monitor Grok API costs (should see cache hits in logs)
   - [ ] Test donation buttons and ad placeholders render correctly

**3. End-to-End Testing (In Progress)**
   - ✅ Search autocomplete works with Wikipedia API
   - ✅ Comparison page loads both sources correctly
   - ✅ Text truncation displays evenly across cards
   - ✅ Backend logging shows cache hits/misses
   - ✅ Frontend logging tracks API calls and costs
   - ⏳ Grok verdict generation (needs XAI_API_KEY to test fully)
   - ⏳ Full slug sync to test filtering behavior

**4. Performance Optimization (Future)**
   - Consider CDN for static assets
   - Optimize image loading for thumbnails
   - Add loading skeletons for better UX
   - Monitor and tune cache TTLs based on traffic patterns

---

### **Development URLs**

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Backend Docs:** http://localhost:8000/docs
- **Supabase Dashboard:** https://supabase.com/dashboard

### **Key Files Modified**

**Backend:**
- `backend/main.py` - Added logging, sitemap endpoints, improved error handling

**Frontend:**
- `frontend/app/api/grok-verdict/route.ts` - Added cost tracking, detailed logging
- `frontend/lib/wikipedia.ts` - Added cache logging
- `frontend/lib/grokipedia.ts` - Added backend API logging
- `frontend/components/SearchBar.tsx` - Enforced selection, simplified to show all Wikipedia results
- `frontend/components/ComparisonPanel.tsx` - Added smart paragraph truncation
- `frontend/components/DonationButton.tsx` - NEW: Crypto donation modal
- `frontend/app/layout.tsx` - Added donation button and ad placeholders

**Scripts:**
- `scripts/sync-grokipedia-slugs.ts` - Updated to use Python backend API
- `.github/workflows/sync-grokipedia-slugs.yml` - Added GROKIPEDIA_API_URL env var
