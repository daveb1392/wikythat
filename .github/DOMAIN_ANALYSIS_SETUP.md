# GitHub Actions - Monthly Domain Analysis Setup

This workflow automatically analyzes your domain metrics and generates AI valuations on the 1st of every month.

## Required GitHub Secrets

Go to your repository **Settings → Secrets and variables → Actions → New repository secret** and add:

### 1. `DATAFORSEO_API_AUTH`
- **Value:** `your-base64-encoded-dataforseo-credentials`
- **Description:** Base64 encoded DataForSEO credentials (`echo -n "email:password" | base64`)

### 2. `XAI_API_KEY`
- **Value:** `xai-your-api-key-here`
- **Description:** xAI Grok API key for AI valuation generation (get from https://x.ai/api)

### 3. `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://your-project.supabase.co`
- **Description:** Your Supabase project URL (from Supabase Dashboard → Settings → API)

### 4. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `your-supabase-anon-key`
- **Description:** Your Supabase anon/public key (from Supabase Dashboard → Settings → API)

## How It Works

### Automatic Monthly Run
- **Schedule:** 1st day of every month at 2:00 AM UTC
- **What it does:**
  1. Fetches domain metrics from DataForSEO (backlinks, keywords, traffic, tech stack)
  2. Generates AI valuation report using Grok
  3. Saves results to Supabase
  4. Updates `/for-sale` page automatically

### Manual Trigger
You can also run the analysis manually:

1. Go to **Actions** tab in GitHub
2. Click **Monthly Domain Analysis** workflow
3. Click **Run workflow** dropdown
4. (Optional) Enter a different domain name
5. Click **Run workflow** button

## Viewing Results

After the workflow runs:
- ✅ Check the **Actions** tab for execution logs
- ✅ Visit `/for-sale` page to see updated metrics
- ✅ Query Supabase tables: `domain_metrics` and `domain_valuations`

## Cost

Per execution (monthly):
- DataForSEO APIs: ~$0.15
- Grok API: ~$0.02
- **Total: ~$0.17/month** (or $2/year)

GitHub Actions minutes used: ~2-3 minutes (free tier includes 2,000 min/month)

## Troubleshooting

### Workflow fails with "No metrics found"
- The valuation step requires metrics to be fetched first
- Both steps run in sequence, so this shouldn't happen
- If it does, run manually and check logs

### DataForSEO API errors
- Check your account balance at dataforseo.com
- Verify the `DATAFORSEO_API_AUTH` secret is correct
- Ensure you haven't hit rate limits

### Grok API errors
- Verify the `XAI_API_KEY` secret is correct
- Check your xAI account has credits
- Review API logs at x.ai/api

### Supabase errors
- Ensure migrations are run:
  - `20260123_add_domain_metrics.sql`
  - `20260123_add_domain_valuations.sql`
- Check RLS policies allow inserts
- Verify the anon key has correct permissions

## Porting to Another Project

1. Copy `.github/workflows/monthly-domain-analysis.yml` to new project
2. Copy both migration files from `supabase/migrations/`
3. Copy scripts: `fetch-domain-metrics.ts` and `generate-domain-valuation.ts`
4. Add npm scripts to `package.json`:
   ```json
   "fetch-metrics": "tsx scripts/fetch-domain-metrics.ts",
   "generate-valuation": "tsx scripts/generate-domain-valuation.ts"
   ```
5. Set up GitHub secrets (same 4 secrets above)
6. Update default domain in workflow file or scripts
7. Done! Workflow will run automatically

## Disabling Automatic Runs

If you want to disable the monthly cron but keep manual triggers:

```yaml
on:
  # schedule:
  #   - cron: '0 2 1 * *'  # Commented out
  workflow_dispatch:  # Manual trigger still works
```

## Changing Schedule

To run on different schedule, update the cron expression:

- **Weekly (Mondays):** `0 2 * * 1`
- **Bi-weekly (1st & 15th):** `0 2 1,15 * *`
- **Quarterly:** `0 2 1 1,4,7,10 *`
- **After each push:** Remove `schedule`, add `on: [push]`

[Crontab guru](https://crontab.guru/) - helpful cron expression builder
