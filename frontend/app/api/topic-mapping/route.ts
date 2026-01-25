import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeInput } from '@/lib/sanitize';

export const runtime = 'edge';

/**
 * Save or update a Wikipedia → Grokipedia topic mapping
 * POST /api/topic-mapping
 * Body: { wikipediaTopic: string, grokipediaSlug: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wikipediaTopic, grokipediaSlug } = body;

    // Validate inputs
    if (!wikipediaTopic || !grokipediaSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: wikipediaTopic, grokipediaSlug' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedTopic = sanitizeInput(wikipediaTopic, 200);
    const sanitizedSlug = sanitizeInput(grokipediaSlug, 200);

    // Check if mapping exists
    const { data: existing } = await supabase
      .from('topic_mappings')
      .select('*')
      .eq('wikipedia_topic', sanitizedTopic)
      .single();

    if (existing) {
      // Mapping exists - increment vote count if same slug, or replace if different
      if (existing.grokipedia_slug === sanitizedSlug) {
        // Same mapping - increment votes
        const { error } = await supabase
          .from('topic_mappings')
          .update({
            vote_count: existing.vote_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('wikipedia_topic', sanitizedTopic);

        if (error) {
          console.error('[topic-mapping] Error updating mapping:', error);
          return NextResponse.json({ error: 'Failed to update mapping' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          action: 'upvoted',
          voteCount: existing.vote_count + 1,
        });
      } else {
        // Different slug - replace mapping (reset votes)
        const { error } = await supabase
          .from('topic_mappings')
          .update({
            grokipedia_slug: sanitizedSlug,
            vote_count: 1,
            updated_at: new Date().toISOString(),
          })
          .eq('wikipedia_topic', sanitizedTopic);

        if (error) {
          console.error('[topic-mapping] Error updating mapping:', error);
          return NextResponse.json({ error: 'Failed to update mapping' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          action: 'updated',
          voteCount: 1,
        });
      }
    } else {
      // New mapping - insert
      const { error } = await supabase.from('topic_mappings').insert({
        wikipedia_topic: sanitizedTopic,
        grokipedia_slug: sanitizedSlug,
        vote_count: 1,
      });

      if (error) {
        console.error('[topic-mapping] Error creating mapping:', error);
        return NextResponse.json({ error: 'Failed to create mapping' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'created',
        voteCount: 1,
      });
    }
  } catch (error) {
    console.error('[topic-mapping] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Search Grokipedia topics by query
 * GET /api/topic-mapping?q=search_query
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Search by normalized search_key
    const searchKey = query.toLowerCase().replace(/[\s_]/g, '');

    const { data, error } = await supabase
      .from('grokipedia_slugs')
      .select('slug, title')
      .ilike('search_key', `%${searchKey}%`)
      .order('slug')
      .limit(20);

    if (error) {
      console.error('[topic-mapping] Error searching topics:', error);
      return NextResponse.json({ error: 'Failed to search topics' }, { status: 500 });
    }

    return NextResponse.json({
      results: data || [],
    });
  } catch (error) {
    console.error('[topic-mapping] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
