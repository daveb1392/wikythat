import Image from 'next/image';
import type { WikipediaResult } from '@/lib/wikipedia';
import type { GrokipediaResult } from '@/lib/grokipedia';

interface ComparisonPanelProps {
  source: 'wikipedia' | 'grokipedia';
  data: WikipediaResult | GrokipediaResult | null;
  sharedThumbnail?: {
    source: string;
    width: number;
    height: number;
  } | null;
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
                  Grokipedia hasn't written about this topic yet. Check back
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
    <div className={`rounded-lg border-2 ${borderColor} ${bgColor} p-6`}>
      <h2 className={`mb-4 text-2xl font-bold ${titleColor}`}>
        {isWikipedia ? 'Wikipedia' : 'Grokipedia'}
      </h2>

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

      <p className="mb-4 whitespace-pre-line text-gray-700">{data.extract}</p>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-block font-semibold ${linkColor} hover:underline`}
        >
          Read more →
        </a>
      )}
    </div>
  );
}
