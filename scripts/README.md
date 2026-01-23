# Domain Analysis Scripts

Modular scripts for automated domain valuation and metrics tracking. Designed to be portable across projects.

## Scripts

### 1. `fetch-domain-metrics.ts`
Fetches comprehensive domain metrics from DataForSEO APIs:
- Backlink profile (total, referring domains, dofollow/nofollow)
- Organic keyword rankings
- Traffic estimates
- Technology stack
- Top performing keywords

### 2. `generate-domain-valuation.ts`
Uses Grok AI to analyze metrics and generate:
- Estimated market value range
- Key strengths and competitive advantages
- Potential use cases and business ideas
- Monetization opportunities
- Improvement recommendations
- Comprehensive valuation report

## Usage

### Manual Execution

```bash
# Fetch metrics for default domain (wikithat.com)
npm run fetch-metrics

# Fetch metrics for specific domain
npm run fetch-metrics example.com

# Generate valuation report
npm run generate-valuation

# Generate valuation for specific domain  
npm run generate-valuation example.com

# Run both (fetch + valuation)
npm run analyze-domain
```

### Environment Variables Required

```env
# DataForSEO API (Base64 encoded "login:password")
DATAFORSEO_API_AUTH=your-base64-credentials

# xAI Grok API
XAI_API_KEY=xai-your-key-here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Automated Execution (Cron Jobs)

### Monthly Schedule (Recommended)

```bash
# Edit crontab
crontab -e

# Add: Run on 1st of month at 2am
0 2 1 * * cd /path/to/project && npm run analyze-domain >> /var/log/domain-analysis.log 2>&1
```

### Alternative Schedules

- **Weekly:** `0 2 * * 1` (Mondays at 2am)
- **Bi-weekly:** `0 2 1,15 * *` (1st and 15th)
- **Quarterly:** `0 2 1 1,4,7,10 *` (Jan/Apr/Jul/Oct)

## Cost Per Execution

- Backlinks: $0.02
- Technologies: $0.01
- Keywords: $0.10-$0.13
- Grok Valuation: $0.01-$0.02
- **Total: ~$0.15-$0.20/domain**

Monthly cost for 1 domain: ~$0.20
Yearly cost for 1 domain: ~$2.40

## Porting to Other Projects

1. Copy `scripts/` folder
2. Copy migrations from `supabase/migrations/`
3. Install deps: `npm install @supabase/supabase-js dotenv`
4. Add npm scripts to `package.json`
5. Set environment variables
6. Run Supabase migrations
7. Update default domain or pass as argument
