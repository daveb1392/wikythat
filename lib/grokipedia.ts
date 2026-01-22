import { supabase } from './supabase';

export interface GrokipediaResult {
  title: string;
  extract: string;
  url?: string;
}

function extractSummary(content: string): string {
  // Strip "Fact-checked by Grok" headers
  const cleaned = content.replace(/Fact-checked by Grok/gi, '').trim();

  // Split into paragraphs
  const paragraphs = cleaned.split('\n\n').filter((p) => p.trim().length > 0);

  // Take first 2-3 paragraphs, max 600 chars
  let summary = '';
  for (const para of paragraphs) {
    if (summary.length + para.length > 600) {
      break;
    }
    summary += para + '\n\n';
  }

  return summary.trim() || cleaned.substring(0, 600);
}

export async function fetchGrokipediaArticle(
  topic: string
): Promise<GrokipediaResult | null> {
  // Check Supabase cache first
  const { data: cached } = await supabase
    .from('articles')
    .select('*')
    .eq('topic', topic)
    .eq('source', 'grokipedia')
    .single();

  if (cached) {
    return {
      title: cached.title,
      extract: cached.extract,
      url: cached.url,
    };
  }

  // Try our scraper API
  const slug = topic.replace(/\s+/g, '_');

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/scrape-grokipedia?slug=${encodeURIComponent(slug)}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.content_text) {
      return null;
    }

    const result: GrokipediaResult = {
      title: data.title || topic,
      extract: extractSummary(data.content_text),
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

    return result;
  } catch (error) {
    console.error('Grokipedia scraping error:', error);
    return null;
  }
}
