import Image from 'next/image';
import type { WikipediaResult } from '@/lib/wikipedia';
import type { GrokipediaResult } from '@/lib/grokipedia';
import { LOGOS, LOGO_SIZES } from '@/lib/logos';

interface ComparisonPanelProps {
  source: 'wikipedia' | 'grokipedia';
  data: WikipediaResult | GrokipediaResult | null;
  sharedThumbnail?: {
    source: string;
    width: number;
    height: number;
  } | null;
}

// Extract first paragraph and truncate to character limit
function truncateToFirstParagraph(text: string, maxChars: number = 400): string {
  // Split by double newlines to get paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  // Skip common headers (Fact-checked by Grok, timestamps, short titles)
  // Find the first substantial paragraph (> 100 chars is likely real content)
  const contentParagraph = paragraphs.find(p => p.length > 100) || paragraphs[0] || text;

  // Truncate to max characters
  if (contentParagraph.length <= maxChars) {
    return contentParagraph;
  }

  // Truncate at word boundary
  const truncated = contentParagraph.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.substring(0, lastSpace > 0 ? lastSpace : maxChars) + '...';
}

export default function ComparisonPanel({
  source,
  data,
  sharedThumbnail,
}: ComparisonPanelProps) {
  const isWikipedia = source === 'wikipedia';
  const bgColor = isWikipedia ? 'bg-blue-50' : 'bg-purple-50';
  const borderColor = isWikipedia ? 'border-blue-200' : 'border-purple-200';
  const titleColor = isWikipedia ? 'text-blue-900' : 'text-purple-900';
  const linkColor = isWikipedia ? 'text-blue-600' : 'text-purple-600';

  if (!data) {
    return (
      <div className={`rounded-lg border-2 ${borderColor} ${bgColor} p-6`}>
        <h2 className={`mb-4 text-2xl font-bold ${titleColor}`}>
          {isWikipedia ? 'Wikipedia' : 'Grokipedia'}
        </h2>
        {isWikipedia ? (
          <p className="text-gray-600">No Wikipedia article found.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-semibold text-yellow-900 mb-1">
                  Not covered yet
                </p>
                <p className="text-sm text-yellow-800">
                  Grokipedia hasn&apos;t written about this topic yet. Check back
                  later, or explore other comparisons!
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 italic">
              Want to see this comparison? Grokipedia is constantly adding new
              topics.
            </p>
          </div>
        )}
      </div>
    );
  }

  const wikiData = data as WikipediaResult;
  const grokData = data as GrokipediaResult;
  const url = isWikipedia
    ? wikiData.content_urls?.desktop.page
    : grokData.url;

  return (
    <div className={`flex flex-col rounded-lg border-2 ${borderColor} ${bgColor} p-6`}>
      <div className="mb-4 flex items-center gap-3 h-10">
        <Image
          src={isWikipedia ? LOGOS.wikipedia.icon : LOGOS.grokipedia.icon}
          alt={isWikipedia ? 'Wikipedia' : 'Grokipedia'}
          width={LOGO_SIZES.icon.width}
          height={LOGO_SIZES.icon.height}
          className="object-contain flex-shrink-0"
        />
        <h2 className={`text-2xl font-bold ${titleColor}`}>
          {isWikipedia ? 'Wikipedia' : 'Grokipedia'}
        </h2>
      </div>

      {(sharedThumbnail || (isWikipedia && wikiData.thumbnail)) && (
        <div className="mb-4 flex justify-center">
          <Image
            src={sharedThumbnail?.source || wikiData.thumbnail?.source || ''}
            alt={data.title}
            width={sharedThumbnail?.width || wikiData.thumbnail?.width || 200}
            height={sharedThumbnail?.height || wikiData.thumbnail?.height || 200}
            className="rounded-lg"
          />
        </div>
      )}

      <h3 className="mb-3 text-xl font-semibold">{data.title}</h3>

      <p className="mb-4 flex-1 whitespace-pre-line text-gray-700">
        {truncateToFirstParagraph(data.extract)}
      </p>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-block font-semibold ${linkColor} hover:underline mt-auto`}
        >
          Read more →
        </a>
      )}
    </div>
  );
}
