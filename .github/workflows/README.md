# GitHub Actions Workflows

This directory contains automated workflows for Wikithat.com.

## Workflows

### `sync-grokipedia-slugs.yml`

Automatically syncs all 6M+ Grokipedia article slugs to Supabase for fast search filtering.

**Schedule:** Every Sunday at 2 AM UTC

**Manual trigger:** Can be triggered anytime from the GitHub Actions tab

**Duration:** ~30-45 minutes

## Setup Instructions

### 1. Add GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Your Supabase anon/public key |

**How to find these:**
1. Go to your Supabase project dashboard
2. Click Settings → API
3. Copy "Project URL" and "anon public" key

### 2. Enable GitHub Actions

1. Go to your repository → Actions tab
2. If prompted, enable workflows
3. You should see "Sync Grokipedia Slugs" workflow

### 3. Test Manual Trigger

Before waiting for the scheduled run:

1. Go to Actions → Sync Grokipedia Slugs
2. Click "Run workflow" → Run workflow
3. Watch the logs to ensure it completes successfully

Expected output:
```
✅ Slug sync completed successfully!
📊 Total slugs synced: 6,142,391
```

### 4. Monitor Scheduled Runs

The workflow runs automatically every Sunday at 2 AM UTC.

Check status:
- Actions tab → Sync Grokipedia Slugs → Recent runs

Failed runs:
- Check the logs for error details
- Common issues:
  - Invalid Supabase credentials
  - Database connection timeout
  - Network issues fetching sitemaps

### 5. Customize Schedule (Optional)

Edit `sync-grokipedia-slugs.yml`:

```yaml
schedule:
  - cron: '0 2 * * 0'  # Every Sunday at 2 AM UTC
```

Common schedules:
- Daily at 3 AM: `'0 3 * * *'`
- Every Monday at 1 AM: `'0 1 * * 1'`
- First day of month: `'0 0 1 * *'`

**Recommendation:** Weekly is sufficient. Grokipedia doesn't add millions of articles daily.

## Troubleshooting

### Workflow not appearing?

1. Make sure file is in `.github/workflows/` directory
2. Push to GitHub: `git add . && git commit -m "Add workflow" && git push`
3. Check Actions tab

### Secrets not working?

1. Verify secret names match exactly (case-sensitive)
2. Re-copy values from Supabase dashboard
3. Make sure no extra spaces in secret values

### Sync timing out?

GitHub Actions free tier has a 6-hour timeout, which is plenty. If it times out:
1. Check Supabase database isn't full (500 MB free tier limit)
2. Check network connectivity in logs
3. Consider splitting into smaller batches

### Want to disable auto-sync?

Comment out the schedule section:

```yaml
# schedule:
#   - cron: '0 2 * * 0'
```

You can still trigger manually when needed.

## Best Practices

✅ Monitor first few runs to ensure they complete successfully

✅ Check Supabase database size after initial sync (~300 MB for 6M slugs)

✅ Set up GitHub notifications for failed workflow runs

✅ Review logs occasionally to catch any issues early

❌ Don't run sync more than once daily (unnecessary and wastes resources)

❌ Don't store secrets in code or commit them to Git
