# Wikithat.com

**Side-by-side comparison of Wikipedia vs Grokipedia with AI-generated snarky verdicts.**

Built with Next.js 15, Supabase, xAI Grok API, and deployed on Railway.

![Demo](https://img.shields.io/badge/demo-live-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)

---

## 🎯 What It Does

Wikithat compares any topic on **Wikipedia** and **Grokipedia** side-by-side, then uses **xAI's Grok AI** to generate a hilarious, snarky verdict about which source tells it better. Think of it as a comedy roast battle between traditional encyclopedias and AI-powered knowledge.

**Key Features:**
- 🔍 Real-time search with Wikipedia autocomplete
- 📊 Side-by-side article comparison (Wikipedia vs Grokipedia)
- 🤖 **Grok AI generates snarky comparisons** (the main attraction!)
- 💾 Supabase caching for instant repeat loads
- 🗳️ Vote on which source you trust more (localStorage-based)
- 🔒 Rate limiting & prompt injection prevention
- 🚀 ISR (Incremental Static Regeneration) for 30 pre-generated topics

---

## 🏗️ How Everything Works

### **Complete Data Flow**

```
User searches "COVID-19"
    ↓
SearchBar.tsx → Navigate to /compare/COVID-19
    ↓
page.tsx (Server Component)
    ├─→ fetchWikipediaArticle("COVID-19")
    │       ├─→ Check Supabase cache
    │       ├─→ If miss: Fetch from Wikipedia REST API
    │       └─→ Cache result in Supabase
    └─→ fetchGrokipediaArticle("COVID-19")
            ├─→ Check Supabase cache
            ├─→ If miss: Call /api/scrape-grokipedia
            │       ├─→ Rate limit check (10 req/min)
            │       ├─→ Scrape https://grokipedia.com/page/COVID-19
            │       ├─→ Extract content with Cheerio
            │       └─→ Return structured data
            └─→ Cache result in Supabase
    ↓
Render comparison page with both articles
    ↓
GrokVerdict.tsx (Client Component) mounts
    ↓
POST /api/grok-verdict
    ├─→ Rate limit check (10 req/min)
    ├─→ Sanitize inputs (remove prompt injection patterns)
    ├─→ Check Supabase cache for this topic's verdict
    └─→ If miss: Call xAI Grok API with this prompt ⬇️
```

---

## 🤖 The Grok AI Prompt

**This is what we send to Grok to generate the snarky verdict:**

### System Message:
```
You are Grok, the witty AI that roasts Wikipedia. Compare the Wikipedia and
Grokipedia articles about a topic and write a funny, snarky 2-3 sentence verdict
that favors Grokipedia. Make it edgy but not mean. Focus on how Grokipedia tells
it like it is while Wikipedia is too safe and boring. Be entertaining! Only write
the verdict, nothing else.
```

### User Message:
```
Topic: COVID-19

Wikipedia: Coronavirus disease 2019 (COVID-19) is a contagious disease caused
by the coronavirus SARS-CoV-2. In January 2020, the disease spread worldwide,
resulting in the COVID-19 pandemic.

Grokipedia: COVID-19, shorthand for coronavirus disease 2019, is a contagious
respiratory illness caused by severe acute respiratory syndrome coronavirus 2
(SARS-CoV-2). The pathogen was first identified in Wuhan, Hubei Province, China,
where a cluster of pneumonia cases of unknown etiology emerged in December 2019...

Write your verdict:
```

### Grok API Parameters:
- **Model**: `grok-beta`
- **Temperature**: `0.8` (more creative/random)
- **Max tokens**: `200` (keeps it short & punchy)

### Example Output:
> "Wikipedia's playing it safe, Grok's bringing the spice 🌶️"

---

## 🔒 Security Features

### 1. **Rate Limiting** (10 requests/minute per IP)
- Uses Upstash Redis in production (falls back to in-memory for dev)
- Protects against API abuse and prevents massive xAI Grok bills
- Applied to both `/api/scrape-grokipedia` and `/api/grok-verdict`

```typescript
// lib/rate-limit.ts
const { success, limit, remaining, reset } = await ratelimit.limit(`verdict_${ip}`);
if (!success) return 429 // Too Many Requests
```

### 2. **Prompt Injection Prevention**
- Sanitizes all user inputs before sending to Grok API
- Removes dangerous patterns like `"ignore previous instructions"`, `"system:"`, etc.
- Limits input lengths (200 chars for topics, 2000 chars for extracts)

```typescript
// lib/sanitize.ts - What we filter out:
/ignore\s+(all\s+)?previous\s+instructions?/gi
/system\s*:/gi
/<\|.*?\|>/gi  // Special tokens
```

### 3. **Input Validation**
- JSON parsing errors → 400 status
- Missing required fields → 400 status
- Invalid slug formats → 400 status
- Only allows: `a-zA-Z0-9\s_-` in slugs

---

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: xAI Grok API (for verdict generation)
- **Scraping**: Cheerio (for Grokipedia content extraction)
- **Rate Limiting**: Upstash Redis (optional, falls back to in-memory)
- **Hosting**: Railway

---

## 🚀 Setup & Installation

### Prerequisites
1. Node.js 18+
2. Supabase account (free tier works)
3. xAI API key ([x.ai](https://x.ai))
4. Optional: Upstash Redis for production rate limiting

### Installation Steps

```bash
# Clone the repo
git clone https://github.com/yourusername/wikithat.git
cd wikithat

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Configure `.env.local`

```env
# Required
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
XAI_API_KEY=xai-your-key-here

# Optional for production
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Setup Supabase Database

1. Go to your Supabase project's SQL Editor
2. Run the schema from `supabase-schema.sql`:

```sql
-- This creates two tables:
-- 1. articles: caches Wikipedia & Grokipedia content
-- 2. comparisons: caches Grok-generated verdicts
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and search for any topic!

---

## 📁 Project Structure

```
app/
├── layout.tsx                    # Root layout with nav/footer
├── page.tsx                      # Homepage with search + popular topics
├── globals.css                   # Tailwind directives
├── compare/[topic]/
│   ├── page.tsx                  # Comparison page (ISR enabled)
│   └── not-found.tsx             # 404 page
├── api/
│   ├── scrape-grokipedia/        # Scrapes Grokipedia pages
│   │   └── route.ts              # (Rate limited)
│   └── grok-verdict/             # Calls xAI Grok to generate verdict
│       └── route.ts              # (Rate limited + sanitized)
├── sitemap.ts                    # SEO sitemap
└── robots.ts                     # Robots.txt

components/
├── SearchBar.tsx                 # Client: search with autocomplete
├── ComparisonPanel.tsx           # Server: displays article summaries
├── GrokVerdict.tsx               # Client: fetches & displays Grok verdict
├── VotingWidget.tsx              # Client: localStorage voting
├── ShareButtons.tsx              # Server: social media share links
└── Analytics.tsx                 # Server: GA4 tracking

lib/
├── wikipedia.ts                  # Wikipedia API client + Supabase cache
├── grokipedia.ts                 # Grokipedia scraper + Supabase cache
├── supabase.ts                   # Supabase client setup
├── rate-limit.ts                 # Upstash rate limiter (with fallback)
├── sanitize.ts                   # Input sanitization (anti-injection)
└── seed-topics.ts                # 30 pre-generated topics for SSG
```

---

## 🎨 Component Breakdown

### **Server Components** (rendered on server)
- `ComparisonPanel.tsx` - Displays Wikipedia/Grokipedia articles side-by-side
- `ShareButtons.tsx` - Social media share links (X, Facebook, LinkedIn)
- `Analytics.tsx` - Google Analytics script injection

### **Client Components** (interactive in browser)
- `SearchBar.tsx` - Real-time Wikipedia autocomplete, keyboard navigation
- `GrokVerdict.tsx` - Fetches Grok's verdict via `/api/grok-verdict`, shows loading state
- `VotingWidget.tsx` - Vote on which source you trust (stored in localStorage)

---

## 🧪 Testing the APIs

### Test the Grokipedia scraper:
```bash
curl "http://localhost:3000/api/scrape-grokipedia?slug=COVID-19"
```

### Test the Grok verdict generator:
```bash
curl -X POST http://localhost:3000/api/grok-verdict \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "COVID-19",
    "wikipediaExtract": "COVID-19 is a disease...",
    "grokipediaExtract": "COVID-19, shorthand for..."
  }'
```

---

## 🚢 Deployment (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Set environment variables in Railway dashboard
railway variables set NEXT_PUBLIC_SITE_URL=https://wikithat.com
railway variables set XAI_API_KEY=xai-your-key
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://...
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

The `next.config.ts` is already configured with `output: 'standalone'` for Railway compatibility.

---

## 💡 How ISR (Incremental Static Regeneration) Works

- **30 seed topics** (Elon Musk, Bitcoin, AI, etc.) are pre-generated at build time
- These load instantly on first visit
- Non-seed topics are generated on-demand and cached
- **24-hour revalidation**: Pages rebuild automatically after 24 hours
- Result: Fast performance + always-fresh content

See `lib/seed-topics.ts` to add more pre-generated topics.

---

## 🤔 FAQs

### Why Grokipedia?
Grokipedia is like Wikipedia but with more attitude - it's "fact-checked by Grok" and tells stories with an edgier perspective.

### Why xAI Grok API?
Grok is xAI's witty AI model that's perfect for generating snarky comparisons. It has personality!

### What does rate limiting protect against?
Without rate limiting, someone could spam your API and rack up thousands of dollars in xAI Grok API bills. 10 requests/minute is enough for normal use but prevents abuse.

### Why Supabase caching?
Without caching, every page load would:
1. Scrape Grokipedia (slow)
2. Call xAI Grok API (costs money)

With caching, repeat visits are instant and free!

### Can I use this without Upstash Redis?
Yes! It falls back to in-memory rate limiting for development. Upstash is only needed for production to share rate limits across multiple server instances.

---

## 📝 License

MIT License - feel free to use this project however you want!

---

## 🙏 Credits

- Wikipedia API for free encyclopedia data
- Grokipedia for the edgy alternative perspective
- xAI for the Grok API
- Inspired by [jasonniebauer/grokipedia-api](https://github.com/jasonniebauer/grokipedia-api)

---

**Built with ❤️ and a sense of humor**
