import { supabase } from './supabase';

export interface WikipediaResult {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls?: {
    desktop: {
      page: string;
    };
  };
}

export async function fetchWikipediaArticle(
  title: string
): Promise<WikipediaResult | null> {
  console.log(`[Wikipedia] Fetching article: "${title}"`);

  // Check Supabase cache first
  const { data: cached } = await supabase
    .from('articles')
    .select('*')
    .eq('topic', title)
    .eq('source', 'wikipedia')
    .single();

  if (cached) {
    console.log(`[Wikipedia] ✅ CACHE HIT for "${title}"`);
    return {
      title: cached.title,
      extract: cached.extract,
      thumbnail: cached.thumbnail_url
        ? {
            source: cached.thumbnail_url,
            width: 0,
            height: 0,
          }
        : undefined,
      content_urls: cached.url
        ? {
            desktop: {
              page: cached.url,
            },
          }
        : undefined,
    };
  }

  console.log(`[Wikipedia] ❌ CACHE MISS for "${title}" - fetching from Wikipedia API`);

  try {
    const encodedTitle = encodeURIComponent(title);
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
      {
        headers: {
          'User-Agent': 'Wikithat.com/1.0',
        },
        next: { revalidate: 86400 }, // 24 hour cache
      }
    );

    if (!response.ok) {
      console.warn(`[Wikipedia] ⚠️  API returned ${response.status} for "${title}"`);
      return null;
    }

    const data = await response.json();
    const result: WikipediaResult = {
      title: data.title,
      extract: data.extract,
      thumbnail: data.thumbnail,
      content_urls: data.content_urls,
    };

    // Cache in Supabase
    await supabase.from('articles').upsert({
      topic: title,
      source: 'wikipedia',
      title: result.title,
      extract: result.extract,
      thumbnail_url: result.thumbnail?.source,
      url: result.content_urls?.desktop.page,
    });

    console.log(`[Wikipedia] 💾 Cached article for "${title}"`);
    return result;
  } catch (error) {
    console.error(`[Wikipedia] ❌ Error fetching "${title}":`, error);
    return null;
  }
}

export async function searchWikipedia(query: string): Promise<string[]> {
  console.log(`[Wikipedia] Search query: "${query}"`);
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodedQuery}&limit=5&format=json`,
      {
        headers: {
          'User-Agent': 'Wikithat.com/1.0',
        },
      }
    );

    if (!response.ok) {
      console.warn(`[Wikipedia] Search API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results = data[1] || []; // OpenSearch returns [query, [titles], [descriptions], [urls]]
    console.log(`[Wikipedia] Search results: ${results.length} matches for "${query}"`);
    return results;
  } catch (error) {
    console.error(`[Wikipedia] Search error for "${query}":`, error);
    return [];
  }
}
