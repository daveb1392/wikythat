import { supabase } from './supabase';

export interface GrokipediaResult {
  title: string;
  extract: string;
  url?: string;
}

function extractSummary(content: string): string {
  // Content is already clean from the scraper (first span after h1)
  // Just return it as-is
  return content.trim();
}

export async function fetchGrokipediaArticle(
  topic: string
): Promise<GrokipediaResult | null> {
  console.log(`[Grokipedia] Fetching article: "${topic}"`);

  // Check Supabase cache first
  const { data: cached } = await supabase
    .from('articles')
    .select('*')
    .eq('topic', topic)
    .eq('source', 'grokipedia')
    .single();

  if (cached) {
    console.log(`[Grokipedia] ✅ CACHE HIT for "${topic}"`);
    return {
      title: cached.title,
      extract: cached.extract,
      url: cached.url,
    };
  }

  console.log(`[Grokipedia] ❌ CACHE MISS for "${topic}" - calling Python backend`);

  // Step 1: Check user-curated mappings first (highest priority)
  const { data: mappingData } = await supabase
    .from('topic_mappings')
    .select('grokipedia_slug')
    .eq('wikipedia_topic', topic)
    .single();

  let slug: string;

  if (mappingData?.grokipedia_slug) {
    slug = mappingData.grokipedia_slug;
    console.log(`[Grokipedia] ✅ Found user-curated mapping: "${topic}" → "${slug}"`);
  } else {
    // Step 2: Try normalized search_key lookup (automatic matching)
    const searchKey = topic.toLowerCase().replace(/[\s_]/g, '');

    const { data: slugData } = await supabase
      .from('grokipedia_slugs')
      .select('slug')
      .eq('search_key', searchKey)
      .order('slug')  // Alphabetical order for consistency
      .limit(1);

    if (slugData && slugData.length > 0) {
      slug = slugData[0].slug;
      console.log(`[Grokipedia] 🔍 Found slug via search_key "${searchKey}": "${slug}"`);
    } else {
      // Step 3: Fallback to simple conversion
      slug = topic.replace(/\s+/g, '_');
      console.log(`[Grokipedia] ⚠️  No match found, using fallback: "${slug}"`);
    }
  }

  try {
    const apiUrl = process.env.GROKIPEDIA_API_URL || 'http://localhost:8000';
    const apiKey = process.env.GROKIPEDIA_API_KEY;
    console.log(`[Grokipedia] Backend URL: ${apiUrl}/page/${slug}`);

    const response = await fetch(
      `${apiUrl}/page/${encodeURIComponent(slug)}`,
      {
        headers: {
          'X-API-Key': apiKey || '',
        },
      }
    );

    if (!response.ok) {
      console.warn(`[Grokipedia] ⚠️  Backend returned ${response.status} for "${topic}"`);
      return null;
    }

    const data = await response.json();

    // If no content, provide a fallback message instead of returning null
    const extract = data.content_text && data.content_text.trim().length > 0
      ? extractSummary(data.content_text)
      : "Content not available via scraping. Grokipedia requires JavaScript rendering for full content. The page exists - visit directly to view.";

    const result: GrokipediaResult = {
      title: data.title || topic,
      extract,
      url: data.url,
    };

    // Cache in Supabase
    await supabase.from('articles').upsert({
      topic,
      source: 'grokipedia',
      title: result.title,
      extract: result.extract,
      url: result.url,
    });

    console.log(`[Grokipedia] 💾 Cached article for "${topic}"`);
    return result;
  } catch (error) {
    console.error(`[Grokipedia] ❌ Error fetching "${topic}":`, error);
    return null;
  }
}
