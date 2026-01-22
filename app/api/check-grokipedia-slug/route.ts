import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * Check if a Grokipedia slug exists in our cache
 * GET /api/check-grokipedia-slug?slug=Bill_Clinton
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawSlug = searchParams.get('slug');

  if (!rawSlug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  try {
    const slug = sanitizeInput(rawSlug, 200);

    // Check if slug exists in cache
    const { data, error } = await supabase
      .from('grokipedia_slugs')
      .select('slug, title, last_modified')
      .eq('slug', slug)
      .single();

    if (error) {
      // If not found, return false
      if (error.code === 'PGRST116') {
        return NextResponse.json({ exists: false, slug });
      }
      throw error;
    }

    return NextResponse.json({
      exists: true,
      slug: data.slug,
      title: data.title,
      lastModified: data.last_modified,
    });
  } catch (error: any) {
    console.error('Error checking slug:', error.message);
    return NextResponse.json(
      { error: 'Failed to check slug' },
      { status: 500 }
    );
  }
}

/**
 * Batch check multiple slugs
 * POST /api/check-grokipedia-slug with body: { slugs: ["Bill_Clinton", "Hillary_Clinton"] }
 */
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { slugs } = body;

  if (!Array.isArray(slugs) || slugs.length === 0) {
    return NextResponse.json(
      { error: 'slugs array is required' },
      { status: 400 }
    );
  }

  if (slugs.length > 50) {
    return NextResponse.json(
      { error: 'Maximum 50 slugs per request' },
      { status: 400 }
    );
  }

  try {
    const sanitizedSlugs = slugs.map((slug) => sanitizeInput(slug, 200));

    const { data, error } = await supabase
      .from('grokipedia_slugs')
      .select('slug, title')
      .in('slug', sanitizedSlugs);

    if (error) {
      throw error;
    }

    // Create a map of slug -> exists
    const existsMap = new Map(data.map((item) => [item.slug, true]));

    const results = sanitizedSlugs.map((slug) => ({
      slug,
      exists: existsMap.has(slug),
      title: data.find((item) => item.slug === slug)?.title || null,
    }));

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error batch checking slugs:', error.message);
    return NextResponse.json(
      { error: 'Failed to check slugs' },
      { status: 500 }
    );
  }
}
