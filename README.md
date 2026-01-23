# Wikithat.com - Wikipedia vs Grokipedia Comparison Tool

A Next.js application that compares Wikipedia and Grokipedia articles side-by-side with AI-generated analysis from xAI's Grok.

## 🏗️ Project Structure

This is a monorepo with separate frontend and backend:

```
├── frontend/           # Next.js 15 application
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   ├── lib/           # Utility libraries
│   ├── tests/         # Vitest test suite
│   └── public/        # Static assets
│
├── backend/           # Python FastAPI server
│   ├── main.py        # Grokipedia scraper API
│   ├── tests/         # Pytest test suite
│   └── requirements.txt
│
├── scripts/           # Automation scripts
│   ├── fetch-domain-metrics.ts
│   └── generate-domain-valuation.ts
│
└── _deprecated/       # Archived code (not in use)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm 10+
- Python 3.11+
- Supabase account
- xAI API key

### Installation

```bash
# Install all dependencies
npm run install:all

# Or install separately
cd frontend && npm install
cd backend && pip install -r requirements.txt
```

### Development

```bash
# Run both frontend and backend together
npm run dev

# Or run separately
npm run dev:frontend  # Frontend on :3000
npm run dev:backend   # Backend on :8000
```

### Testing

```bash
# Run all tests
npm test

# Frontend tests only (Vitest)
cd frontend && npm test

# Backend tests only (Pytest)
cd backend && pytest

# With coverage
cd frontend && npm run test:coverage
cd backend && pytest --cov=main --cov-report=html
```

## 🔧 Environment Variables

### Frontend (.env.local)

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
XAI_API_KEY=xai-xxx
GROKIPEDIA_API_URL=http://localhost:8000

# Optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
DATAFORSEO_API_AUTH=your-base64-credentials
```

### Backend (.env)

```env
ANALYTICS_KEY=your-analytics-key
HEALTH_SECRET=your-secret-key
```

## 📦 Key Features

- **Side-by-Side Comparison**: View Wikipedia and Grokipedia articles simultaneously
- **AI-Powered Analysis**: Grok generates humorous, insightful comparisons
- **Smart Caching**: Supabase caching for articles (24h) and verdicts (7 days)
- **Rate Limiting**: Upstash Redis-based rate limiting for API protection
- **SEO Optimized**: ISR with 24-hour revalidation, sitemap, metadata
- **Security**: Input sanitization, prompt injection prevention, CORS protection
- **Domain Analytics**: DataForSEO integration for domain metrics and AI valuation

## 🧪 Testing Coverage

### Frontend Tests (Vitest)
- ✅ Grok Verdict API - Rate limiting, caching, URL validation, error handling
- ✅ Domain Metrics API - DataForSEO integration, caching, fallback data

### Backend Tests (Pytest)
- ✅ Page Endpoint - Fetching, parsing, caching, rate limiting
- ✅ Health Endpoint - Authentication, metrics reporting
- ✅ Reference Extraction - HTML parsing, URL normalization
- ✅ Slug Normalization - Capitalization, URL encoding
- ✅ Error Handling - Network errors, malformed HTML, empty responses

## 📊 API Endpoints

### Frontend APIs
- `POST /api/grok-verdict` - Generate AI comparison
- `GET /api/domain-metrics` - Fetch domain SEO metrics

### Backend APIs
- `GET /page/{slug}` - Fetch Grokipedia page content
- `GET /health?key=secret` - Health check with cache stats
- `GET /docs` - Interactive API documentation

## 🎯 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Python, FastAPI, BeautifulSoup4, Uvicorn
- **Database**: Supabase (PostgreSQL)
- **AI**: xAI Grok API (grok-4-1-fast-reasoning)
- **Testing**: Vitest (frontend), Pytest (backend)
- **Hosting**: Railway (both frontend and backend)
- **Rate Limiting**: Upstash Redis
- **Analytics**: DataForSEO for domain metrics

## 🔐 Security Features

- Input sanitization and validation
- Prompt injection prevention
- Rate limiting (10 req/min for verdicts, 100 req/min for pages)
- CORS protection
- Security headers (CSP, XSS, nosniff, frame-deny)
- URL domain validation

## 📈 Performance

- **Page Load**: <2 seconds (target)
- **Build Time**: ~30 seed topics pre-generated
- **Cache Strategy**:
  - Articles: 24-hour ISR revalidation
  - Verdicts: 7-day server cache
  - Pages: 2-day backend cache (1000 max)

## 🚢 Deployment

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed deployment instructions.

### Quick Deploy to Railway

1. Deploy backend as separate service from `backend/` directory
2. Deploy frontend with `GROKIPEDIA_API_URL` pointing to backend
3. Configure environment variables in Railway dashboard
4. Set up custom domain (optional)

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guide for AI assistants
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment checklist
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) - Security review
- [backend/README.md](./backend/README.md) - Backend API documentation

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome via GitHub issues.

## 📄 License

MIT

## 🙏 Acknowledgments

- Wikipedia for their open API
- xAI for Grok API
- Grokipedia for article content
- Supabase for database hosting
- Railway for application hosting
