/**
 * Generate Domain Valuation Script
 *
 * Uses xAI Grok API to analyze domain metrics and generate a comprehensive
 * valuation report including potential use cases, market value, and opportunities.
 * This script is designed to be modular and reusable across projects.
 *
 * Usage:
 *   ts-node scripts/generate-domain-valuation.ts [domain]
 *   npm run generate-valuation [domain]
 *
 * Environment Variables Required:
 *   - XAI_API_KEY: Your xAI Grok API key
 *   - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon key
 *
 * Cron Schedule (monthly, 1st day at 3am - after metrics fetch):
 *   0 3 1 * * cd /path/to/project && npm run generate-valuation
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

interface DomainValuation {
  estimated_value_range: string;
  key_strengths: string[];
  potential_use_cases: string[];
  monetization_opportunities: string[];
  competitive_advantages: string[];
  improvement_recommendations: string[];
  market_analysis: string;
  full_report: string;
  generated_at: string;
}

async function fetchMetricsFromDB(domain: string): Promise<DomainMetrics> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not set');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`\n📊 Fetching metrics for ${domain} from database...`);

  const { data, error } = await supabase
    .from('domain_metrics')
    .select('*')
    .eq('domain', domain)
    .single();

  if (error || !data) {
    throw new Error(
      `No metrics found for ${domain}. Run fetch-domain-metrics.ts first.`
    );
  }

  console.log('✅ Metrics loaded from database');
  return data.metrics as DomainMetrics;
}

async function generateValuationWithGrok(
  domain: string,
  metrics: DomainMetrics
): Promise<DomainValuation> {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable not set');
  }

  console.log('\n🤖 Generating valuation with Grok AI...');
  console.log(`   API Key present: ${apiKey ? 'Yes' : 'No'} (${apiKey?.substring(0, 10)}...)`);
  console.log(`   Using model: grok-4-1-fast-reasoning`);

  if (process.env.DEBUG) {
    console.log('\n📝 Prompt being sent:');
    console.log('─'.repeat(80));
    console.log('Domain:', domain);
    console.log('Metrics:', JSON.stringify(metrics, null, 2));
    console.log('─'.repeat(80));
  }

  const prompt = `Analyze this domain as an expert domain valuation specialist:

**Domain:** ${domain}

**Current Metrics:**
- Total Backlinks: ${metrics.backlinks.total.toLocaleString()}
- Referring Domains: ${metrics.backlinks.referring_domains.toLocaleString()}
- DoFollow Links: ${metrics.backlinks.dofollow.toLocaleString()}
- Ranking Keywords: ${metrics.keywords.total.toLocaleString()}
- Monthly Traffic Estimate: ${metrics.keywords.organic_traffic_estimate.toLocaleString()} visits
- Tech Stack: ${metrics.technologies.length > 0 ? metrics.technologies.join(', ') : 'Not detected'}

${
  metrics.keywords.top_keywords.length > 0
    ? `**Top Keywords:**
${metrics.keywords.top_keywords
  .slice(0, 5)
  .map((kw) => `- "${kw.keyword}" (Rank #${kw.position}, ${kw.search_volume.toLocaleString()}/mo)`)
  .join('\n')}`
    : ''
}

Provide a comprehensive valuation covering:

1. **Estimated Market Value** - Give a realistic price range in USD
2. **Key Strengths** - 3-5 specific strengths this domain has
3. **Potential Use Cases** - 5-7 concrete business ideas or applications
4. **Monetization Ideas** - 3-5 specific revenue opportunities
5. **Competitive Advantages** - 3-4 things that make this domain valuable vs competitors
6. **Growth Recommendations** - 3-5 actionable steps to increase value
7. **Market Analysis** - 2-3 paragraphs on market position, niche demand, and growth potential
8. **Executive Summary** - 400-500 word comprehensive report

Be specific, realistic, and data-driven. Consider brandability, SEO metrics, market demand, and revenue potential.`;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-reasoning',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert domain valuation analyst. Provide detailed, data-driven domain valuations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Grok API Error Response:', errorText);
    throw new Error(`Grok API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Grok API');
  }

  console.log('✅ Valuation generated');

  // Debug: Show raw response if needed
  if (process.env.DEBUG) {
    console.log('\n🔍 Debug - Grok Response:');
    console.log(content);
  }

  // Parse Grok's natural response into structured data
  const valuation = parseGrokResponse(content);
  valuation.generated_at = new Date().toISOString();

  return valuation;
}

function parseGrokResponse(text: string): Omit<DomainValuation, 'generated_at'> {
  // Extract sections from Grok's response
  const extractSection = (header: string): string => {
    const regex = new RegExp(`(?:^|\\n)\\*?\\*?${header}\\*?\\*?:?\\s*([\\s\\S]*?)(?=\\n\\*?\\*?[A-Z][\\w\\s]+\\*?\\*?:|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const extractList = (header: string): string[] => {
    const section = extractSection(header);
    const items = section.match(/(?:^|\n)\s*[-•*]\s*(.+?)(?=\n|$)/g);
    return items ? items.map(item => item.replace(/^\s*[-•*]\s*/, '').trim()) : [];
  };

  // Extract value range
  const valueMatch = text.match(/\$?([\d,]+)\s*[-–to]\s*\$?([\d,]+)/i) ||
                     text.match(/\$?([\d,]+)/i);
  let estimated_value_range = 'Contact for pricing';
  if (valueMatch) {
    if (valueMatch[2]) {
      estimated_value_range = `$${valueMatch[1]} - $${valueMatch[2]}`;
    } else {
      estimated_value_range = `$${valueMatch[1]}`;
    }
  }

  return {
    estimated_value_range,
    key_strengths: extractList('Key Strengths?|Strengths?') || extractList('1\\.'),
    potential_use_cases: extractList('(?:Potential )?Use Cases?|Applications?') || extractList('3\\.'),
    monetization_opportunities: extractList('Monetization|Revenue') || extractList('4\\.'),
    competitive_advantages: extractList('Competitive Advantages?|Advantages?') || extractList('5\\.'),
    improvement_recommendations: extractList('(?:Growth )?Recommendations?|Improvements?') || extractList('6\\.'),
    market_analysis: extractSection('Market Analysis|Market Position|Market'),
    full_report: text, // Store full response as the report
  };
}

async function saveValuationToDB(domain: string, valuation: DomainValuation) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not set');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n💾 Saving valuation to database...');

  // Use upsert with onConflict to properly update existing records
  const { error } = await supabase
    .from('domain_valuations')
    .upsert(
      {
        domain,
        valuation,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: 'domain',
      }
    );

  if (error) {
    throw new Error(`Database save failed: ${error.message}`);
  }

  console.log('✅ Valuation saved to database');
}

async function main() {
  const domain = process.argv[2] || process.env.DOMAIN || 'wikithat.com';

  try {
    console.log('🚀 Starting domain valuation generation...');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🌐 Domain: ${domain}`);

    const metrics = await fetchMetricsFromDB(domain);
    const valuation = await generateValuationWithGrok(domain, metrics);

    console.log('\n💰 Valuation Summary:');
    console.log(`   Estimated Value: ${valuation.estimated_value_range}`);
    console.log(`   Key Strengths: ${valuation.key_strengths.length}`);
    console.log(`   Use Cases: ${valuation.potential_use_cases.length}`);
    console.log(`   Monetization Ideas: ${valuation.monetization_opportunities.length}`);

    await saveValuationToDB(domain, valuation);

    console.log('\n📝 Full Report Preview:');
    console.log('─'.repeat(80));
    console.log(valuation.full_report.substring(0, 500) + '...');
    console.log('─'.repeat(80));

    console.log('\n✨ Done! Valuation report generated and saved.\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
