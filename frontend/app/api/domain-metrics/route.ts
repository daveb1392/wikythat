import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DomainMetrics {
  backlinks: {
    total: number;
    referring_domains: number;
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

export async function GET() {
  const domain = 'wikithat.com';

  // Check cache first (7-day expiry)
  const { data: cached } = await supabase
    .from('domain_metrics')
    .select('*')
    .eq('domain', domain)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .single();

  if (cached?.metrics) {
    return NextResponse.json({
      metrics: cached.metrics,
      cached: true,
    });
  }

  // If no DataForSEO credentials, return mock data for development
  if (!process.env.DATAFORSEO_API_AUTH) {
    const mockMetrics: DomainMetrics = {
      backlinks: {
        total: 1250,
        referring_domains: 180,
      },
      keywords: {
        total: 45,
        organic_traffic_estimate: 2500,
        top_keywords: [
          { keyword: 'wikipedia vs grokipedia', position: 1, search_volume: 320 },
          { keyword: 'compare wikipedia grokipedia', position: 2, search_volume: 180 },
          { keyword: 'wikipedia grok comparison', position: 3, search_volume: 150 },
        ],
      },
      technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase'],
      last_updated: new Date().toISOString(),
    };

    return NextResponse.json({
      metrics: mockMetrics,
      cached: false,
      mock: true,
    });
  }

  try {
    const auth = process.env.DATAFORSEO_API_AUTH;

    // Fetch backlinks summary
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

    const backlinksData = await backlinksResponse.json();

    // Fetch domain technologies
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

    const techData = await techResponse.json();

    // Fetch keywords (using DataForSEO Labs)
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

    const keywordsData = await keywordsResponse.json();

    // Parse and structure the data
    const metrics: DomainMetrics = {
      backlinks: {
        total: backlinksData.tasks?.[0]?.result?.[0]?.backlinks || 0,
        referring_domains: backlinksData.tasks?.[0]?.result?.[0]?.referring_domains || 0,
      },
      keywords: {
        total: keywordsData.tasks?.[0]?.result?.[0]?.metrics?.organic?.count || 0,
        organic_traffic_estimate:
          keywordsData.tasks?.[0]?.result?.[0]?.metrics?.organic?.etv || 0,
        top_keywords:
          Array.isArray(keywordsData.tasks?.[0]?.result?.[0]?.items)
            ? keywordsData.tasks[0].result[0].items.slice(0, 5).map((item: any) => ({
                keyword: item.keyword_data?.keyword || '',
                position: item.ranked_serp_element?.serp_item?.rank_absolute || 0,
                search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
              }))
            : [],
      },
      technologies:
        Array.isArray(techData.tasks?.[0]?.result?.[0]?.technologies)
          ? techData.tasks[0].result[0].technologies.map((t: any) => t.name)
          : [],
      last_updated: new Date().toISOString(),
    };

    // Cache for 7 days
    await supabase.from('domain_metrics').upsert({
      domain,
      metrics,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      metrics,
      cached: false,
    });
  } catch (error: any) {
    console.error('DataForSEO API error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch domain metrics' },
      { status: 500 }
    );
  }
}
