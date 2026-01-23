import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { ratelimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeInput, validateSlug } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `scrape_${identifier}`
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

  const searchParams = request.nextUrl.searchParams;
  const rawSlug = searchParams.get('slug');

  if (!rawSlug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  // Sanitize and validate slug
  try {
    const slug = sanitizeInput(rawSlug, 200);
    if (!validateSlug(slug)) {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
    }

    // Fetch the Grokipedia page
    const response = await fetch(`https://grokipedia.com/page/${slug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Wikithat/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Find the article element
    const article = $('article').first();

    if (article.length === 0) {
      return NextResponse.json(
        { error: 'Article content not found' },
        { status: 404 }
      );
    }

    // Extract title from h1
    const h1 = article.find('h1').first();
    const title = h1.text().trim() || slug.replace(/_/g, ' ');

    // Extract first span after h1 - this is the summary
    const firstSpan = h1.next('span').first();
    const contentText = firstSpan.text().trim();

    // Extract references
    const references: { number: number; url: string }[] = [];
    $('#references li a, .references li a').each((i, elem) => {
      const url = $(elem).attr('href');
      if (url) {
        references.push({ number: i + 1, url });
      }
    });

    // Return structured data with security headers
    return NextResponse.json(
      {
        title,
        slug,
        url: `https://grokipedia.com/page/${slug}`,
        content_text: contentText,
        char_count: contentText.length,
        word_count: contentText.split(/\s+/).length,
        references_count: references.length,
        references,
      },
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
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    // Don't leak internal error details
    console.error('Scraping error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch article. Please try again.' },
      { status: 500 }
    );
  }
}
