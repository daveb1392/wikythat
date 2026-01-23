/**
 * Fetch Domain Appraisals Script
 *
 * Fetches domain valuations from multiple third-party appraisal services:
 * - Humbleworth
 * - Atom.com
 * - Saw.com
 * - DPC (DomainPriceCheck)
 * - GoDaddy
 * - Dynadot
 *
 * Usage:
 *   ts-node scripts/fetch-domain-appraisals.ts [domain]
 *   npm run fetch-appraisals [domain]
 *
 * Environment Variables Required:
 *   - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon key
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface DomainAppraisal {
  source: string;
  value_low?: number;
  value_high?: number;
  value_estimate?: number;
  currency: string;
  fetched_at: string;
  status: 'success' | 'failed' | 'not_available';
  error?: string;
}

interface AppraisalResults {
  domain: string;
  appraisals: DomainAppraisal[];
  average_value?: number;
  fetched_at: string;
}

async function fetchGoDaddyAppraisal(domain: string): Promise<DomainAppraisal> {
  console.log('   📊 GoDaddy...');
  try {
    // GoDaddy API endpoint (publicly available)
    const response = await fetch(
      `https://api.godaddy.com/v1/appraisal/${domain}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      source: 'GoDaddy',
      value_estimate: data.govalue || 0,
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'success',
    };
  } catch (error: any) {
    return {
      source: 'GoDaddy',
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'failed',
      error: error.message,
    };
  }
}

async function fetchDynadotAppraisal(domain: string): Promise<DomainAppraisal> {
  console.log('   📊 Dynadot...');
  try {
    // Note: Dynadot doesn't have a public API, would need to scrape
    // Placeholder for now
    return {
      source: 'Dynadot',
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'not_available',
      error: 'No public API available',
    };
  } catch (error: any) {
    return {
      source: 'Dynadot',
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'failed',
      error: error.message,
    };
  }
}

async function fetchHumbleworthAppraisal(domain: string): Promise<DomainAppraisal> {
  console.log('   📊 Humbleworth...');
  try {
    // Humbleworth has a simple API
    const response = await fetch(
      `https://humbleworth.com/api/domain/${domain}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      source: 'Humbleworth',
      value_estimate: data.value || 0,
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'success',
    };
  } catch (error: any) {
    return {
      source: 'Humbleworth',
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'failed',
      error: error.message,
    };
  }
}

async function fetchAtomAppraisal(domain: string): Promise<DomainAppraisal> {
  console.log('   📊 Atom.com...');
  try {
    // Note: Atom.com likely requires authentication or scraping
    return {
      source: 'Atom',
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'not_available',
      error: 'Requires authentication',
    };
  } catch (error: any) {
    return {
      source: 'Atom',
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'failed',
      error: error.message,
    };
  }
}

async function fetchSawAppraisal(domain: string): Promise<DomainAppraisal> {
  console.log('   📊 Saw.com...');
  try {
    // Note: Saw.com likely requires scraping
    return {
      source: 'Saw',
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'not_available',
      error: 'No public API available',
    };
  } catch (error: any) {
    return {
      source: 'Saw',
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'failed',
      error: error.message,
    };
  }
}

async function fetchDPCAppraisal(domain: string): Promise<DomainAppraisal> {
  console.log('   📊 DomainPriceCheck...');
  try {
    // DomainPriceCheck API (if available)
    const response = await fetch(
      `https://domainpricecheck.com/api/estimate/${domain}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      source: 'DomainPriceCheck',
      value_low: data.low || 0,
      value_high: data.high || 0,
      value_estimate: data.estimate || 0,
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'success',
    };
  } catch (error: any) {
    return {
      source: 'DomainPriceCheck',
      currency: 'USD',
      fetched_at: new Date().toISOString(),
      status: 'failed',
      error: error.message,
    };
  }
}

async function fetchAllAppraisals(domain: string): Promise<AppraisalResults> {
  console.log(`\n💰 Fetching appraisals for: ${domain}\n`);

  // Fetch all appraisals in parallel
  const [godaddy, dynadot, humbleworth, atom, saw, dpc] = await Promise.all([
    fetchGoDaddyAppraisal(domain),
    fetchDynadotAppraisal(domain),
    fetchHumbleworthAppraisal(domain),
    fetchAtomAppraisal(domain),
    fetchSawAppraisal(domain),
    fetchDPCAppraisal(domain),
  ]);

  const appraisals = [godaddy, dynadot, humbleworth, atom, saw, dpc];

  // Calculate average from successful appraisals
  const successfulAppraisals = appraisals.filter(
    (a) => a.status === 'success' && a.value_estimate && a.value_estimate > 0
  );

  const average_value =
    successfulAppraisals.length > 0
      ? successfulAppraisals.reduce((sum, a) => sum + (a.value_estimate || 0), 0) /
        successfulAppraisals.length
      : undefined;

  return {
    domain,
    appraisals,
    average_value,
    fetched_at: new Date().toISOString(),
  };
}

async function saveToDB(results: AppraisalResults) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not set');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n💾 Saving appraisals to database...');

  const { error } = await supabase.from('domain_appraisals').upsert({
    domain: results.domain,
    appraisals: results.appraisals,
    average_value: results.average_value,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Database save failed: ${error.message}`);
  }

  console.log('✅ Saved to database');
}

async function main() {
  const domain = process.argv[2] || process.env.DOMAIN || 'wikithat.com';

  try {
    console.log('🚀 Starting domain appraisal collection...');
    console.log(`📅 Date: ${new Date().toISOString()}`);

    const results = await fetchAllAppraisals(domain);

    console.log('\n📊 Appraisal Summary:');
    results.appraisals.forEach((appraisal) => {
      const status =
        appraisal.status === 'success'
          ? `✅ $${appraisal.value_estimate?.toLocaleString() || 'N/A'}`
          : appraisal.status === 'not_available'
            ? '⚠️  Not Available'
            : `❌ Failed (${appraisal.error})`;
      console.log(`   ${appraisal.source.padEnd(20)} ${status}`);
    });

    if (results.average_value) {
      console.log(`\n   💰 Average Value: $${Math.round(results.average_value).toLocaleString()}`);
    }

    await saveToDB(results);

    console.log('\n✨ Done! Appraisals updated successfully.\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
