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

async function batchInsertSlugs(
  slugs: SitemapEntry[],
  batchSize: number = 1000,
  delayMs: number = 100
): Promise<{ success: boolean; error?: any; inserted: number; skipped: number }> {
  let totalInserted = 0;
  let totalSkipped = 0;

  for (let i = 0; i < slugs.length; i += batchSize) {
    const batch = slugs.slice(i, i + batchSize);

    // Deduplicate within this batch (keep last occurrence)
    const uniqueBatch = Array.from(
      new Map(
        batch.map((entry) => [entry.slug, entry])
      ).values()
    );

    try {
      // Check which slugs already exist
      const existingSlugs = uniqueBatch.map((entry) => entry.slug);
      const { data: existing } = await supabase
        .from('grokipedia_slugs')
        .select('slug, last_modified')
        .in('slug', existingSlugs);

      const existingMap = new Map(
        (existing || []).map((item: any) => [item.slug, item.last_modified])
      );

      // Filter to only new or modified slugs
      const toInsert = uniqueBatch.filter((entry) => {
        const existingLastModified = existingMap.get(entry.slug);

        // Insert if new
        if (!existingLastModified) {
          return true;
        }

        // Insert if modified date changed
        if (entry.lastModified && existingLastModified !== entry.lastModified) {
          return true;
        }

        // Skip if unchanged
        return false;
      });

      const skipped = uniqueBatch.length - toInsert.length;
      totalSkipped += skipped;

      if (toInsert.length === 0) {
        // All slugs already exist and are up-to-date, skip this batch
        continue;
      }

      const { error } = await supabase
        .from('grokipedia_slugs')
        .upsert(
          toInsert.map((entry) => ({
            slug: entry.slug,
            title: entry.title,
            last_modified: entry.lastModified,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'slug' }
        );

      if (error) {
        console.error(`   ⚠️  Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        // If timeout error, try with smaller batches
        if (error.code === '57014' && batchSize > 100) {
          console.log(`   🔄 Retrying batch with smaller size (${Math.floor(batchSize / 2)})...`);
          return await batchInsertSlugs(batch, Math.floor(batchSize / 2), delayMs * 2);
        }
        return { success: false, error, inserted: totalInserted, skipped: totalSkipped };
      }

      totalInserted += toInsert.length;

      // Add delay between batches to reduce database load
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (err) {
      console.error(`   ⚠️  Batch insert exception:`, err);
      return { success: false, error: err, inserted: totalInserted, skipped: totalSkipped };
    }
  }

  return { success: true, inserted: totalInserted, skipped: totalSkipped };
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

    let totalInserted = 0;
    let totalSkipped = 0;
    let processedSitemaps = 0;
    const failedSitemaps: { url: string; entries: SitemapEntry[] }[] = [];

    // Process each sitemap
    for (const sitemapUrl of sitemapUrls) {
      processedSitemaps++;
      console.log(`\n📄 Processing sitemap ${processedSitemaps}/${sitemapUrls.length}...`);
      console.log(`   ${sitemapUrl}`);

      try {
        const entries = await fetchSitemap(sitemapUrl);
        console.log(`   Found ${entries.length} entries`);

        const result = await batchInsertSlugs(entries);

        if (result.success) {
          totalInserted += result.inserted;
          totalSkipped += result.skipped;
          console.log(`   ✅ Inserted ${result.inserted}, skipped ${result.skipped} (already up-to-date)`);
          console.log(`   📊 Total: ${totalInserted.toLocaleString()} inserted, ${totalSkipped.toLocaleString()} skipped`);
        } else {
          console.log(`   ⚠️  Failed to insert, will retry later`);
          failedSitemaps.push({ url: sitemapUrl, entries });
        }
      } catch (error) {
        console.error(`   ❌ Error processing sitemap:`, error);
        // Continue with next sitemap instead of failing completely
      }

      // Add a small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Retry failed sitemaps with slower rate
    if (failedSitemaps.length > 0) {
      console.log(`\n🔄 Retrying ${failedSitemaps.length} failed sitemaps with slower rate...\n`);

      for (let i = 0; i < failedSitemaps.length; i++) {
        const { url, entries } = failedSitemaps[i];
        console.log(`\n📄 Retry ${i + 1}/${failedSitemaps.length}: ${url}`);
        console.log(`   Found ${entries.length} entries (cached)`);

        try {
          // Use smaller batch size (500) and longer delay (300ms) for retries
          const result = await batchInsertSlugs(entries, 500, 300);

          if (result.success) {
            totalInserted += result.inserted;
            totalSkipped += result.skipped;
            console.log(`   ✅ Retry successful! Inserted ${result.inserted}, skipped ${result.skipped}`);
          } else {
            console.log(`   ❌ Retry failed, skipping`);
          }
        } catch (error) {
          console.error(`   ❌ Error during retry:`, error);
        }
      }
    }

    await updateSyncStatus('completed', totalInserted);

    console.log('\n✅ Sync completed!');
    console.log(`📊 Total inserted/updated: ${totalInserted.toLocaleString()}`);
    console.log(`📊 Total skipped (unchanged): ${totalSkipped.toLocaleString()}`);
    console.log(`📊 Total processed: ${(totalInserted + totalSkipped).toLocaleString()}`);
    if (failedSitemaps.length > 0) {
      console.log(`⚠️  Some sitemaps may have failed. Check logs above.`);
    }
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    await updateSyncStatus('failed', undefined, String(error));
    process.exit(1);
  }
}

main();
