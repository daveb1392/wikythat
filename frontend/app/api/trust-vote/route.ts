import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ratelimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `trust_vote_${identifier}`
  );

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        },
      }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { topic, source } = body;

  if (!topic || !source) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  if (source !== 'wikipedia' && source !== 'grokipedia') {
    return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
  }

  try {
    const sanitizedTopic = sanitizeInput(topic, 200);

    // Try to get existing vote count
    const { data: existing } = await supabase
      .from('trust_votes')
      .select('*')
      .eq('topic', sanitizedTopic)
      .eq('source', source)
      .single();

    if (existing) {
      // Increment existing vote count
      const { error: updateError } = await supabase
        .from('trust_votes')
        .update({
          vote_count: existing.vote_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('topic', sanitizedTopic)
        .eq('source', source);

      if (updateError) {
        console.error('Error updating vote:', updateError);
        return NextResponse.json(
          { error: 'Failed to record vote' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, count: existing.vote_count + 1 });
    } else {
      // Create new vote record
      const { error: insertError } = await supabase
        .from('trust_votes')
        .insert({
          topic: sanitizedTopic,
          source,
          vote_count: 1,
        });

      if (insertError) {
        console.error('Error inserting vote:', insertError);
        return NextResponse.json(
          { error: 'Failed to record vote' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, count: 1 });
    }
  } catch (error: any) {
    console.error('Trust vote error:', error.message);
    return NextResponse.json(
      { error: 'Failed to record vote. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const topic = searchParams.get('topic');

  if (!topic) {
    return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
  }

  try {
    const sanitizedTopic = sanitizeInput(topic, 200);

    const { data, error } = await supabase
      .from('trust_votes')
      .select('*')
      .eq('topic', sanitizedTopic);

    if (error) {
      console.error('Error fetching votes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch votes' },
        { status: 500 }
      );
    }

    const wikipediaVotes =
      data?.find((v) => v.source === 'wikipedia')?.vote_count || 0;
    const grokipediaVotes =
      data?.find((v) => v.source === 'grokipedia')?.vote_count || 0;

    return NextResponse.json({
      wikipedia: wikipediaVotes,
      grokipedia: grokipediaVotes,
    });
  } catch (error: any) {
    console.error('Error fetching trust votes:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}
