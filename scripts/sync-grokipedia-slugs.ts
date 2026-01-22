/**
 * Sync Grokipedia Slugs Script
 *
 * Fetches all 6M+ article slugs from Grokipedia's sitemap and stores them in Supabase.
 * Run this script periodically (daily/weekly) to keep the slug cache updated.
 *
 * Usage:
 *   npx tsx scripts/sync-grokipedia-slugs.ts
 */

// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

// Now create Supabase client after env vars are loaded
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SITEMAP_INDEX_URL = 'https://assets.grokipedia.com/sitemap/sitemap-index.xml';

interface SitemapEntry {
  slug: string;
  title: string | null;
  lastModified: string | null;
}

async function fetchSitemapIndex(): Promise<string[]> {
  console.log('📥 Fetching sitemap index...');
  const response = await fetch(SITEMAP_INDEX_URL);
  const xml = await response.text();

  const sitemapUrls: string[] = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;

  while ((match = locRegex.exec(xml)) !== null) {
    sitemapUrls.push(match[1]);
  }

  console.log(`✅ Found ${sitemapUrls.length} sitemap files`);
  return sitemapUrls;
}

async function fetchSitemap(sitemapUrl: string): Promise<SitemapEntry[]> {
  const response = await fetch(sitemapUrl);
  const xml = await response.text();

  const entries: SitemapEntry[] = [];
  const urlRegex = /<url>(.*?)<\/url>/gs;
  let match;

  while ((match = urlRegex.exec(xml)) !== null) {
    const urlBlock = match[1];

    const locMatch = /<loc>(.*?)<\/loc>/.exec(urlBlock);
    const lastmodMatch = /<lastmod>(.*?)<\/lastmod>/.exec(urlBlock);

    if (locMatch) {
      const fullUrl = locMatch[1];
      const rawSlug = fullUrl.replace('https://grokipedia.com/page/', '');

      // Step 1: Decode HTML entities (&quot; &apos; &amp; etc.)
      const htmlDecoded = rawSlug
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      // Step 2: Try to decode URL percent-encoding (%20, %22, etc.)
      let decodedSlug: string;
      try {
        decodedSlug = decodeURIComponent(htmlDecoded);
      } catch (error) {
        // If still fails, use the HTML-decoded version
        decodedSlug = htmlDecoded;
      }

      // Convert slug to title (replace underscores with spaces)
      const title = decodedSlug.replace(/_/g, ' ');

      entries.push({
        slug: decodedSlug,
        title,
        lastModified: lastmodMatch ? lastmodMatch[1] : null,
      });
    }
  }

  return entries;
}

async function batchInsertSlugs(slugs: SitemapEntry[]): Promise<void> {
  // Supabase has a limit on batch inserts, so we'll do 1000 at a time
  const BATCH_SIZE = 1000;

  for (let i = 0; i < slugs.length; i += BATCH_SIZE) {
    const batch = slugs.slice(i, i + BATCH_SIZE);

    // Deduplicate within this batch (keep last occurrence)
    const uniqueBatch = Array.from(
      new Map(
        batch.map((entry) => [entry.slug, entry])
      ).values()
    );

    const { error } = await supabase
      .from('grokipedia_slugs')
      .upsert(
        uniqueBatch.map((entry) => ({
          slug: entry.slug,
          title: entry.title,
          last_modified: entry.lastModified,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'slug' }
      );

    if (error) {
      console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
      throw error;
    }
  }
}

async function updateSyncStatus(
  status: 'idle' | 'running' | 'completed' | 'failed',
  totalSlugs?: number,
  errorMessage?: string
) {
  const updates: any = {
    sync_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'running') {
    updates.last_sync_started = new Date().toISOString();
  }

  if (status === 'completed') {
    updates.last_sync_completed = new Date().toISOString();
    if (totalSlugs !== undefined) {
      updates.total_slugs = totalSlugs;
    }
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  await supabase
    .from('grokipedia_sync_status')
    .update(updates)
    .eq('id', (await supabase.from('grokipedia_sync_status').select('id').single()).data?.id);
}

async function main() {
  console.log('🚀 Starting Grokipedia slug sync...\n');

  try {
    await updateSyncStatus('running');

    // Fetch all sitemap URLs
    const sitemapUrls = await fetchSitemapIndex();

    let totalSlugs = 0;
    let processedSitemaps = 0;

    // Process each sitemap
    for (const sitemapUrl of sitemapUrls) {
      processedSitemaps++;
      console.log(`\n📄 Processing sitemap ${processedSitemaps}/${sitemapUrls.length}...`);
      console.log(`   ${sitemapUrl}`);

      try {
        const entries = await fetchSitemap(sitemapUrl);
        console.log(`   Found ${entries.length} entries`);

        await batchInsertSlugs(entries);
        totalSlugs += entries.length;
        console.log(`   ✅ Inserted/updated ${entries.length} slugs`);
        console.log(`   📊 Total progress: ${totalSlugs.toLocaleString()} slugs`);
      } catch (error) {
        console.error(`   ❌ Error processing sitemap:`, error);
        // Continue with next sitemap instead of failing completely
      }

      // Add a small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await updateSyncStatus('completed', totalSlugs);

    console.log('\n✅ Sync completed successfully!');
    console.log(`📊 Total slugs synced: ${totalSlugs.toLocaleString()}`);
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    await updateSyncStatus('failed', undefined, String(error));
    process.exit(1);
  }
}

main();
