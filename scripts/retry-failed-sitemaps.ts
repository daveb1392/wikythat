/**
 * Retry Failed Sitemaps Script
 *
 * Re-processes sitemaps that failed during initial sync due to timeouts.
 * Retries with smaller batch sizes to avoid database timeout issues.
 *
 * Usage:
 *   npx tsx scripts/retry-failed-sitemaps.ts
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

const SITEMAP_BASE_URL = 'https://assets.grokipedia.com/sitemap/sitemap-';

// Sitemaps that failed during initial sync
const FAILED_SITEMAPS = [
  67, 79, 83, 88, 101, 102, 105, 109, 110, 111,
  114, 115, 118, 119, 125, 126, 127, 129, 130, 131
];

interface SitemapEntry {
  slug: string;
  title: string | null;
  lastModified: string | null;
}

async function fetchSitemap(sitemapNum: number): Promise<SitemapEntry[]> {
  const sitemapUrl = `${SITEMAP_BASE_URL}${String(sitemapNum).padStart(5, '0')}.xml`;

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
  batchSize: number = 500
): Promise<{ inserted: number; skipped: number }> {
  let insertedCount = 0;
  let skippedCount = 0;

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
      skippedCount += skipped;

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

        // If timeout, try even smaller batches
        if (error.code === '57014') {
          console.log(`   🔄 Retrying with smaller batch size (100)...`);
          const retryResult = await batchInsertSlugs(batch, 100);
          insertedCount += retryResult.inserted;
          skippedCount += retryResult.skipped;
        }
      } else {
        insertedCount += toInsert.length;
      }

      // Longer delay between batches to reduce database load
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.error(`   ⚠️  Batch insert exception:`, err);
    }
  }

  return { inserted: insertedCount, skipped: skippedCount };
}

async function main() {
  console.log('🔄 Retrying failed sitemaps...\n');
  console.log(`📋 Found ${FAILED_SITEMAPS.length} failed sitemaps to retry\n`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let processedCount = 0;

  for (const sitemapNum of FAILED_SITEMAPS) {
    processedCount++;
    console.log(`\n📄 Processing sitemap ${processedCount}/${FAILED_SITEMAPS.length} (sitemap-${String(sitemapNum).padStart(5, '0')}.xml)...`);

    try {
      const entries = await fetchSitemap(sitemapNum);
      console.log(`   Found ${entries.length} entries`);

      // Use smaller batch size (500 instead of 1000) to avoid timeouts
      const result = await batchInsertSlugs(entries, 500);
      console.log(`   ✅ Inserted ${result.inserted}, skipped ${result.skipped} (already up-to-date)`);

      totalInserted += result.inserted;
      totalSkipped += result.skipped;
      console.log(`   📊 Total: ${totalInserted.toLocaleString()} inserted, ${totalSkipped.toLocaleString()} skipped`);
    } catch (error) {
      console.error(`   ❌ Error processing sitemap:`, error);
      // Continue with next sitemap instead of failing completely
    }
  }

  console.log('\n✅ Retry completed!');
  console.log(`📊 Total inserted/updated: ${totalInserted.toLocaleString()}`);
  console.log(`📊 Total skipped (unchanged): ${totalSkipped.toLocaleString()}`);
  console.log(`📊 Total processed: ${(totalInserted + totalSkipped).toLocaleString()}`);
  console.log(`📊 Processed ${processedCount}/${FAILED_SITEMAPS.length} sitemaps`);
}

main();
