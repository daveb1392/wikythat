# Scripts

Maintenance and utility scripts for Wikithat.com.

## Grokipedia Slug Sync

### `sync-grokipedia-slugs.ts`

Fetches all 6M+ article slugs from Grokipedia's sitemap and stores them in Supabase for fast lookups.

**What it does:**
1. Fetches sitemap index from `https://assets.grokipedia.com/sitemap/sitemap-index.xml`
2. Parses all 135+ sitemap files
3. Extracts slug, title, and last modified date for each article
4. Batch inserts/updates into `grokipedia_slugs` table
5. Updates sync status in `grokipedia_sync_status` table

**Usage:**

```bash
# One-time manual sync
npm run sync-slugs

# Or run directly with tsx
npx tsx scripts/sync-grokipedia-slugs.ts
```

**Duration:**
- Initial sync: ~30-45 minutes (6M+ slugs)
- Updates: ~15-30 minutes (only changed entries)

**Scheduling:**

For production, run this weekly via cron or GitHub Actions:

```yaml
# .github/workflows/sync-slugs.yml
name: Sync Grokipedia Slugs
on:
  schedule:
    - cron: '0 2 * * 0' # Every Sunday at 2 AM
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run sync-slugs
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

**Monitoring:**

Check sync status via Supabase dashboard or API:

```sql
SELECT * FROM grokipedia_sync_status ORDER BY updated_at DESC LIMIT 1;
```

**Troubleshooting:**

If sync fails mid-way:
- The script is designed to be idempotent (can be run multiple times)
- Already synced slugs will be updated, not duplicated
- Check `grokipedia_sync_status.error_message` for details

**Performance:**

- Uses batch inserts (1000 slugs per query)
- Small 100ms delay between sitemaps to be respectful
- Upserts on conflict, so safe to re-run
