# Railway Deployment Guide

Complete guide to deploy Wikithat.com to Railway.

## Prerequisites

- ✅ Supabase account with database set up
- ✅ xAI API key (for Grok analysis)
- ✅ Railway account (free tier is fine to start)
- ✅ GitHub repository pushed

## Step-by-Step Deployment

### 1. Prepare Supabase Database

**Run all migrations:**

Go to Supabase Dashboard → SQL Editor → New Query

Run each migration in order:

```sql
-- 1. Run: supabase/migrations/001_initial_schema.sql
-- 2. Run: supabase/migrations/002_add_trust_votes.sql
-- 3. Run: supabase/migrations/003_add_grokipedia_slugs.sql
```

**Sync Grokipedia slugs (one-time):**

From your local machine:
```bash
npm run sync-slugs
```

This takes ~30-45 minutes. Once complete, you'll have 6M+ slugs cached.

**Verify tables exist:**

```sql
SELECT COUNT(*) FROM grokipedia_slugs;
-- Should return ~6,000,000+

SELECT * FROM grokipedia_sync_status;
-- Should show 'completed' status
```

---

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Connect your GitHub account
5. Select your `wikithat` repository
6. Railway will auto-detect Next.js and configure build

---

### 3. Configure Environment Variables

In Railway dashboard → Your Project → Variables tab

Add these environment variables:

#### Required Variables

| Variable | Where to Get It | Example |
|----------|-----------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | `eyJhbGciOiJIUzI1...` |
| `XAI_API_KEY` | [x.ai/api](https://x.ai/api) → API Keys | `xai-xxxxx...` |
| `NEXT_PUBLIC_SITE_URL` | Your Railway domain (see below) | `https://wikithat-production.up.railway.app` |

#### Optional (for production optimizations)

| Variable | Value | Purpose |
|----------|-------|---------|
| `UPSTASH_REDIS_REST_URL` | From Upstash dashboard | Distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | From Upstash dashboard | Distributed rate limiting |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | Analytics tracking |

---

### 4. Get Your Railway Domain

After adding environment variables, Railway will deploy automatically.

1. Wait for build to complete (~2-3 minutes)
2. Click **Settings** → **Networking** → **Generate Domain**
3. Copy the domain (e.g., `wikithat-production.up.railway.app`)
4. Go back to **Variables** → Update `NEXT_PUBLIC_SITE_URL` with this domain
5. Railway will auto-redeploy

---

### 5. Verify Deployment

Visit your Railway domain and test:

✅ Homepage loads
✅ Search autocomplete works (only shows topics on both Wikipedia & Grokipedia)
✅ Comparison page loads (try "Bill Clinton")
✅ Grok analysis appears after ~15 seconds
✅ Trust counter displays
✅ No console errors

**Test these specific searches:**
- ✅ "Bill Clinton" - should show in autocomplete (exists on both)
- ✅ "Jeffrey Epstein" - should show in autocomplete
- ❌ "Hillary Clinton" - should NOT show in autocomplete (Grokipedia missing)

---

### 6. Set Up Custom Domain (Optional)

**If you have a custom domain:**

1. Railway → Settings → Networking → Custom Domain
2. Add your domain (e.g., `wikithat.com`)
3. Railway will show you DNS records to add
4. Add CNAME record at your DNS provider:
   ```
   CNAME  @  your-project.up.railway.app
   ```
5. Wait for DNS propagation (~10-60 minutes)
6. Update `NEXT_PUBLIC_SITE_URL` variable to your custom domain

---

### 7. Enable Rate Limiting (Recommended for Production)

Without Upstash, rate limiting uses in-memory storage (resets on restart).

**Set up Upstash Redis:**

1. Go to [upstash.com](https://upstash.com)
2. Create free account
3. Create new Redis database
4. Copy REST URL and REST TOKEN
5. Add to Railway environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
6. Railway will auto-redeploy

**Why?** Distributed rate limiting across multiple Railway instances.

---

## Environment Variables Reference

### Complete List

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# xAI Grok API (Required)
XAI_API_KEY=xai-xxxxx

# Site URL (Required)
NEXT_PUBLIC_SITE_URL=https://wikithat.com

# Upstash Redis (Optional but recommended)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX...

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Railway Configuration Explained

**File:** `railway.toml`

```toml
[build]
builder = "NIXPACKS"  # Railway's auto-detect build system

[deploy]
startCommand = "npm start"  # Runs Next.js production server
restartPolicyType = "ON_FAILURE"  # Auto-restart if crashes
restartPolicyMaxRetries = 10  # Try up to 10 times
```

**File:** `next.config.ts`

```typescript
output: 'standalone'  # Optimized for Railway deployment
```

This reduces deployment size from ~500MB to ~100MB.

---

## Monitoring & Maintenance

### Check Deployment Health

**Railway Dashboard:**
- Deployments tab → Recent deploys
- Logs tab → Real-time application logs
- Metrics tab → CPU, Memory, Network usage

**Common log patterns to watch:**

✅ Good:
```
✓ Ready in 1234ms
✓ Compiled /api/grok-verdict in 234ms
```

⚠️ Warning:
```
Rate limit exceeded for IP xxx.xxx.xxx.xxx
Failed to fetch Grokipedia article: timeout
```

❌ Error:
```
Error: supabaseUrl is required
XAI_API_KEY not configured
```

### Update Grokipedia Slugs

Slug cache updates automatically via GitHub Actions (every Sunday).

**Manual update from Railway:**

Railway doesn't support cron jobs, so use GitHub Actions workflow or:

1. Run locally: `npm run sync-slugs`
2. Slugs sync directly to Supabase
3. Railway automatically uses updated cache

### Cost Monitoring

**Railway Free Tier:**
- $5 credit/month
- ~500 hours of runtime
- Good for side projects

**Estimated costs:**
- Railway: $0-5/month (free tier)
- Supabase: Free (under 500MB, 50k API requests)
- xAI Grok API: ~$0.01 per comparison (varies by usage)
- Upstash Redis: Free (10k commands/day)

**Total:** ~$0-10/month for small-scale usage

---

## Troubleshooting

### Build fails

**Error:** `Module not found`

**Fix:**
```bash
# Locally
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Deployment succeeds but site shows 500 error

**Check:** Missing environment variables

**Fix:** Railway → Variables → Ensure all required variables are set

### Grok analysis not loading

**Check:** XAI_API_KEY is valid

**Test locally:**
```bash
curl -X POST https://api.x.ai/v1/chat/completions \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"grok-4-1-fast-reasoning","messages":[{"role":"user","content":"test"}]}'
```

### Search autocomplete empty

**Check:** Grokipedia slugs synced

**Query Supabase:**
```sql
SELECT COUNT(*) FROM grokipedia_slugs;
```

Should be ~6,000,000+. If 0, run `npm run sync-slugs` locally.

### Rate limiting not working across restarts

**Fix:** Set up Upstash Redis (see step 7 above)

---

## Deployment Checklist

Before going live:

- [ ] All Supabase migrations applied
- [ ] Grokipedia slugs synced (6M+ entries)
- [ ] All environment variables set in Railway
- [ ] `NEXT_PUBLIC_SITE_URL` updated with Railway domain
- [ ] Custom domain configured (if applicable)
- [ ] Test search autocomplete
- [ ] Test full comparison flow (search → compare → Grok analysis)
- [ ] Verify rate limiting works (try 11 requests quickly)
- [ ] Check Railway logs for errors
- [ ] Set up Upstash Redis for production
- [ ] Enable GitHub Actions for weekly slug sync
- [ ] Monitor first 24 hours for issues

---

## Going Live

Once deployed and tested:

1. **Announce:** Share on X, Product Hunt, HN, etc.
2. **Monitor:** Watch Railway logs and Supabase dashboard
3. **Iterate:** Track which topics users search most
4. **Scale:** Upgrade Railway/Supabase as traffic grows

---

## Support

**Railway issues:** [railway.app/help](https://railway.app/help)

**Supabase issues:** [supabase.com/docs](https://supabase.com/docs)

**xAI API issues:** [x.ai/api/docs](https://x.ai/api/docs)

**Project issues:** [GitHub Issues](https://github.com/yourusername/wikithat/issues)

---

**Last Updated:** January 22, 2025

**Deployment Time:** ~10-15 minutes (excluding slug sync)

🚀 **You're ready to deploy!**
