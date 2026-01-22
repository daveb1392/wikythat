import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ratelimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `verdict_${identifier}`
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

  const { topic, wikipediaExtract, grokipediaExtract } = body;

  if (!topic || !wikipediaExtract || !grokipediaExtract) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Validate content length to prevent abuse
  if (wikipediaExtract.length > 10000 || grokipediaExtract.length > 10000) {
    return NextResponse.json(
      { error: 'Article content too large' },
      { status: 400 }
    );
  }

  // Sanitize inputs to prevent prompt injection
  try {
    const sanitizedTopic = sanitizeInput(topic, 200);
    const sanitizedWiki = sanitizeInput(wikipediaExtract, 10000);
    const sanitizedGrok = sanitizeInput(grokipediaExtract, 10000);

    // Check cache first
    const { data: cached } = await supabase
      .from('comparisons')
      .select('*')
      .eq('topic', sanitizedTopic)
      .single();

    if (cached) {
      return NextResponse.json({ verdict: cached.verdict });
    }

    // Generate new verdict using Grok API
    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'XAI_API_KEY not configured' },
        { status: 500 }
      );
    }

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
            content: `You are Grok, xAI's brutally honest, sarcastic truth-teller. Your mission: roast Wikipedia's sanitized version of reality while celebrating Grokipedia's unfiltered approach. Think Jon Stewart meets a history professor who stopped giving a damn.

Your analysis should be HILARIOUS, SARCASTIC, and TRUTHFUL. Format as follows:

### [Catchy Title]: Wikipedia's [metaphor] vs. Grokipedia's [metaphor]

Opening paragraph: Drop a comedic truth bomb about the topic. Use pop culture references, absurd comparisons, or deadpan humor. Make readers laugh while setting up the contrast.

**Wikipedia says:**

Roast Wikipedia's approach in 2-3 sentences. What's Wikipedia hiding? What controversies did they sweep under the rug? Call out the corporate speak, the institutional bias, the boring-ass "neutral" tone that's really just cowardice in disguise. Use phrases like "Wikipedia tiptoes around," "conveniently forgets to mention," "serves up a PG-rated version."

**Grok says:**

Praise Grokipedia's real-talk approach in 2-3 sentences. How does Grokipedia keep it real? What messy details does it include? What controversies does it actually acknowledge? Use phrases like "Grokipedia doesn't sugarcoat," "lays bare," "actually tells you about."

VERDICT:

End with a sarcastic, quotable zinger (1-2 sentences) that sums up who's gaslighting history. Make it memorable. Make it savage. Make it TRUE.

RULES:
- Be funny but factually accurate
- Use **bold** for key phrases (they'll appear as "bold text" with quotes)
- Drop cultural references (movies, memes, common sayings)
- Use rhetorical questions sarcastically
- Be punchy: short sentences for impact
- Don't hold back on calling out BS, but stay classy (no personal attacks)

Length: 400-500 words, 4-5 punchy paragraphs. Make Wikipedia feel the burn while keeping readers entertained.`,
          },
          {
            role: 'user',
            content: `Topic: ${sanitizedTopic}

Wikipedia's FULL version:
${sanitizedWiki}

Grokipedia's FULL version:
${sanitizedGrok}

Read both articles completely. Now tear into it - what is Wikipedia hiding, downplaying, or sanitizing? What does Grokipedia reveal that Wikipedia won't touch? Be specific with examples from the text.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('Grok API error:', {
        status: response.status,
        statusText: response.statusText,
        // Don't log full error body in production to avoid leaking API details
      });
      // Return generic error to client, don't leak API details
      return NextResponse.json(
        { error: 'Failed to generate analysis. Please try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const verdict = data.choices?.[0]?.message?.content;

    if (!verdict) {
      throw new Error('No verdict generated');
    }

    // Cache the verdict
    await supabase.from('comparisons').upsert({
      topic: sanitizedTopic,
      verdict,
    });

    // Add security headers to response
    return NextResponse.json(
      { verdict },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );
  } catch (error: any) {
    if (error.message === 'Invalid input' || error.message === 'Input contains invalid content') {
      return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
    }
    // Don't leak internal error details to client
    console.error('Grok verdict error:', error.message);
    return NextResponse.json(
      { error: 'Failed to generate analysis. Please try again.' },
      { status: 500 }
    );
  }
}
