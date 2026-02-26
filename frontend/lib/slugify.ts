import { seedTopics } from './seed-topics';

/**
 * Convert a topic title to a URL-safe slug.
 * "Elon Musk" → "elon-musk", "COVID-19" → "covid-19"
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Build a slug → title map from seed topics for accurate reverse lookup
const slugToTitleMap: Record<string, string> = {};
for (const topic of seedTopics) {
  slugToTitleMap[slugify(topic)] = topic;
}

/**
 * Convert a URL slug back to a display title.
 * Uses seed topic map for exact matches, falls back to title-case heuristic.
 * "elon-musk" → "Elon Musk", "covid-19" → "COVID-19"
 */
export function deslugify(slug: string): string {
  // Check seed topic map for exact mapping (handles COVID-19, iPhone, etc.)
  if (slugToTitleMap[slug]) {
    return slugToTitleMap[slug];
  }

  // Fallback: title case
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
