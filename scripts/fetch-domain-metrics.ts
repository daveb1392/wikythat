/**
 * Fetch Domain Metrics Script
 *
 * Fetches comprehensive domain metrics from DataForSEO APIs and caches them in Supabase.
 * This script is designed to be modular and reusable across projects.
 *
 * Usage:
 *   ts-node scripts/fetch-domain-metrics.ts [domain]
 *   npm run fetch-metrics [domain]
 *
 * Environment Variables Required:
 *   - DATAFORSEO_API_AUTH: Base64 encoded "login:password"
 *   - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon key
 *
 * Cron Schedule (monthly, 1st day at 2am):
 *   0 2 1 * * cd /path/to/project && npm run fetch-metrics
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface DomainMetrics {
  backlinks: {
    total: number;
    referring_domains: number;
    dofollow: number;
    nofollow: number;
  };
  keywords: {
    total: number;
    organic_traffic_estimate: number;
    top_keywords: Array<{
      keyword: string;
      position: number;
      search_volume: number;
    }>;
  };
  technologies: string[];
  last_updated: string;
}

async function fetchDomainMetrics(domain: string): Promise<DomainMetrics> {
  const auth = process.env.DATAFORSEO_API_AUTH;

  if (!auth) {
    throw new Error('DATAFORSEO_API_AUTH environment variable not set');
  }

  console.log(`\n🔍 Fetching metrics for: ${domain}\n`);

  // Fetch backlinks summary
  console.log('📊 Fetching backlinks data...');
  const backlinksResponse = await fetch(
    'https://api.dataforseo.com/v3/backlinks/summary/live',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          target: domain,
        },
      ]),
    }
  );

  if (!backlinksResponse.ok) {
    throw new Error(`Backlinks API failed: ${backlinksResponse.statusText}`);
  }

  const backlinksData = await backlinksResponse.json();
  const backlinksResult = backlinksData.tasks?.[0]?.result?.[0];

  console.log('✅ Backlinks data fetched');

  // Fetch domain technologies
  console.log('📊 Fetching tech stack...');
  const techResponse = await fetch(
    'https://api.dataforseo.com/v3/domain_analytics/technologies/domain_technologies/live',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          target: domain,
        },
      ]),
    }
  );

  if (!techResponse.ok) {
    throw new Error(`Technologies API failed: ${techResponse.statusText}`);
  }

  const techData = await techResponse.json();
  const techResult = techData.tasks?.[0]?.result?.[0];

  console.log('✅ Tech stack data fetched');

  // Fetch keywords (using DataForSEO Labs)
  console.log('📊 Fetching keyword rankings...');
  const keywordsResponse = await fetch(
    'https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          target: domain,
          language_code: 'en',
          location_code: 2840, // United States
        },
      ]),
    }
  );

  if (!keywordsResponse.ok) {
    throw new Error(`Keywords API failed: ${keywordsResponse.statusText}`);
  }

  const keywordsData = await keywordsResponse.json();
  const keywordsResult = keywordsData.tasks?.[0]?.result?.[0];

  console.log('✅ Keyword data fetched');

  // Debug: Log API responses if needed
  if (process.env.DEBUG) {
    console.log('\n🔍 Debug - Raw API Responses:');
    console.log('Backlinks:', JSON.stringify(backlinksResult, null, 2));
    console.log('Technologies:', JSON.stringify(techResult, null, 2));
    console.log('Keywords:', JSON.stringify(keywordsResult, null, 2));
  }

  // Structure the metrics
  const metrics: DomainMetrics = {
    backlinks: {
      total: backlinksResult?.backlinks || 0,
      referring_domains: backlinksResult?.referring_domains || 0,
      dofollow: backlinksResult?.dofollow || 0,
      nofollow: backlinksResult?.nofollow || 0,
    },
    keywords: {
      total: keywordsResult?.metrics?.organic?.count || 0,
      organic_traffic_estimate: keywordsResult?.metrics?.organic?.etv || 0,
      top_keywords:
        Array.isArray(keywordsResult?.items)
          ? keywordsResult.items.slice(0, 10).map((item: any) => ({
              keyword: item.keyword_data?.keyword || '',
              position: item.ranked_serp_element?.serp_item?.rank_absolute || 0,
              search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
            }))
          : [],
    },
    technologies:
      Array.isArray(techResult?.technologies)
        ? techResult.technologies.map((t: any) => t.name)
        : [],
    last_updated: new Date().toISOString(),
  };

  return metrics;
}

async function saveToDB(domain: string, metrics: DomainMetrics) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not set');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n💾 Saving to database...');

  // Use upsert with onConflict to properly update existing records
  const { error } = await supabase
    .from('domain_metrics')
    .upsert(
      {
        domain,
        metrics,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: 'domain',
      }
    );

  if (error) {
    throw new Error(`Database save failed: ${error.message}`);
  }

  console.log('✅ Saved to database');
}

async function main() {
  const domain = process.argv[2] || process.env.DOMAIN || 'wikithat.com';

  try {
    console.log('🚀 Starting domain metrics fetch...');
    console.log(`📅 Date: ${new Date().toISOString()}`);

    const metrics = await fetchDomainMetrics(domain);

    console.log('\n📈 Metrics Summary:');
    console.log(`   Backlinks: ${metrics.backlinks.total.toLocaleString()}`);
    console.log(`   Referring Domains: ${metrics.backlinks.referring_domains.toLocaleString()}`);
    console.log(`   Ranking Keywords: ${metrics.keywords.total.toLocaleString()}`);
    console.log(`   Est. Monthly Traffic: ${metrics.keywords.organic_traffic_estimate.toLocaleString()}`);
    console.log(`   Technologies: ${metrics.technologies.length}`);

    await saveToDB(domain, metrics);

    console.log('\n✨ Done! Metrics updated successfully.\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
