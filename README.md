# Wikithat.com

Compare Wikipedia and Grokipedia articles side-by-side with AI-powered analysis by Grok.

## Features

- 🔍 **Smart Search** - Autocomplete shows only topics available on BOTH sources  
- 📊 **Side-by-Side Comparison** - See Wikipedia and Grokipedia articles together
- 🤖 **Grok AI Analysis** - Hilarious, sarcastic comparison of how each source frames the topic
- 🗳️ **Trust Voting** - Users vote on which source they trust more
- ⚡ **6M+ Article Cache** - Instant validation of Grokipedia article existence
- 🛡️ **Production-Ready Security** - Rate limiting, prompt injection prevention, input sanitization

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/yourusername/wikithat.git
cd wikithat
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Run migrations in Supabase (see RAILWAY_DEPLOYMENT.md)

# 4. Sync Grokipedia slugs (one-time, ~30-45 min)
npm run sync-slugs

# 5. Start dev server
npm run dev
```

## Deploy to Railway

See **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** for complete guide.

**Quick steps:**
1. Push to GitHub  
2. Connect Railway to repo
3. Add environment variables
4. Deploy automatically (~10-15 min)

## Documentation

- 📖 [Railway Deployment](./RAILWAY_DEPLOYMENT.md)
- 🔒 [Security Docs](./SECURITY.md)
- 🗄️ [Slug Cache System](./GROKIPEDIA_SLUG_CACHE.md)

## Tech Stack

Next.js 15 • Supabase • xAI Grok • Cheerio • Tailwind CSS • Railway

---

Built with ❤️ for truth-seeking comparisons
