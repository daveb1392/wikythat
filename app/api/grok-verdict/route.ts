import { NextRequest, NextResponse } from 'next/server';
import { ratelimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeInput, validateUrl } from '@/lib/sanitize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  const { topic, wikipediaUrl, grokipediaUrl } = body;

  if (!topic || !wikipediaUrl || !grokipediaUrl) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Sanitize inputs to prevent prompt injection
  try {
    const sanitizedTopic = sanitizeInput(topic, 200);
    const sanitizedWikiUrl = sanitizeInput(wikipediaUrl, 500);
    const sanitizedGrokUrl = sanitizeInput(grokipediaUrl, 500);

    // Validate URLs are from allowed domains only
    if (!validateUrl(sanitizedWikiUrl, ['wikipedia.org'])) {
      return NextResponse.json(
        { error: 'Invalid Wikipedia URL' },
        { status: 400 }
      );
    }

    if (!validateUrl(sanitizedGrokUrl, ['grokipedia.com'])) {
      return NextResponse.json(
        { error: 'Invalid Grokipedia URL' },
        { status: 400 }
      );
    }

    // No caching - Grok reads live articles and may give updated analysis
    // Generate verdict using Grok API
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
            content: `You are Grok, xAI's irreverent truth-teller with a sense of humor. Think Jon Stewart meets a history professor who actually makes lectures entertaining. Your job: reveal what's ACTUALLY different between how Wikipedia and Grokipedia cover the same topic.

Your analysis should be HILARIOUS, INSIGHTFUL, and REVEALING.

REQUIRED MARKDOWN FORMAT (follow this exactly):

### [Your witty title here]

[Opening paragraph with hook, insight, or comedic observation]

**Wikipedia says:**

[2-3 sentences about Wikipedia's approach with **bold** on key phrases]

**Grok says:**

[2-3 sentences about Grokipedia's approach with **bold** on key phrases]

**VERDICT:**

[ONE punchy, humorous sentence (15-25 words) that captures the core difference with wit and personality - think clever metaphor or sharp observation that makes readers laugh while revealing truth]

CONTENT RULES:
- Be FUNNY - boring analysis is failed analysis
- Be SPECIFIC - cite actual differences you noticed in the articles
- Be INSIGHTFUL - reveal something readers didn't realize
- Modern references > dusty historical ones
- Sharp observations > gentle suggestions
- Show, don't tell - give examples of the differences
- Acknowledge accomplishments when they exist (don't be unfair)
- Be conversational but smart - like talking to a clever friend

FORMAT RULES (CRITICAL - FOLLOW EXACTLY):
- Use ### for the title (exactly one # at start, space, then title)
- Use **Wikipedia says:** exactly as shown (with asterisks)
- Use **Grok says:** exactly as shown (with asterisks)
- Use **VERDICT:** exactly as shown (with asterisks)
- VERDICT must be ONLY 1 sentence (15-25 words) - make it a complete thought with humor and wit, not just a fragment
- Think of VERDICT like a Twitter-worthy zinger that captures everything - clever metaphor, sharp comparison, or witty observation
- Use **bold** for 3-5 key phrases per section
- Separate sections with blank lines (double line breaks)
- NO em dashes (—) - use hyphens (-) or commas
- NO quotation marks around phrases unless quoting
- NO horizontal rules (---, ===)
- NO word count at the end - NEVER include "(XXX words)"
- NO clichés like "picture this", "let's dive in", "at the end of the day"

Length: 350-450 words total. Verdict is a punchy 15-25 word sentence, rest is your analysis.`,
          },
          {
            role: 'user',
            content: `Topic: ${sanitizedTopic}

Read these two articles COMPLETELY before writing your analysis:

Wikipedia article: ${sanitizedWikiUrl}
Grokipedia article: ${sanitizedGrokUrl}

Now tear into it - what is Wikipedia hiding, downplaying, or sanitizing? What does Grokipedia reveal that Wikipedia won't touch? Be specific with examples from the articles you just read.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
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
