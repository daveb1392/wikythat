import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ComparisonPanel from '@/components/ComparisonPanel';
import GrokVerdict from '@/components/GrokVerdict';
import ShareButtons from '@/components/ShareButtons';
import TrustCounter from '@/components/TrustCounter';
import SearchBar from '@/components/SearchBar';
import { fetchWikipediaArticle } from '@/lib/wikipedia';
import { fetchGrokipediaArticle } from '@/lib/grokipedia';
import { seedTopics } from '@/lib/seed-topics';

interface PageProps {
  params: Promise<{ topic: string }>;
}

export const revalidate = 0; // Always fetch fresh data
export const dynamic = 'force-dynamic'; // Disable static generation

export async function generateStaticParams() {
  return seedTopics.map((topic) => ({
    topic: encodeURIComponent(topic),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic);

  return {
    title: `${decodedTopic}: Wikipedia vs Grokipedia | Wikithat`,
    description: `Compare ${decodedTopic} on Wikipedia and Grokipedia side-by-side. See the differences between traditional encyclopedia and AI-powered knowledge.`,
    openGraph: {
      title: `${decodedTopic}: Wikipedia vs Grokipedia`,
      description: `Compare ${decodedTopic} on Wikipedia and Grokipedia`,
      type: 'article',
    },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic);

  // Fetch both APIs in parallel
  const [wikipediaData, grokipediaData] = await Promise.all([
    fetchWikipediaArticle(decodedTopic),
    fetchGrokipediaArticle(decodedTopic),
  ]);

  // Show 404 only if Wikipedia fails (Wikipedia is primary source)
  if (!wikipediaData) {
    notFound();
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const pageUrl = `${siteUrl}/compare/${topic}`;

  // Extract Wikipedia thumbnail to share with Grokipedia panel
  const sharedThumbnail = wikipediaData?.thumbnail || null;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 max-w-2xl mx-auto">
        <SearchBar />
      </div>

      <h1 className="mb-8 text-center text-4xl font-bold">
        Comparing: {decodedTopic}
      </h1>

      <div className="mb-8 grid gap-8 md:grid-cols-2">
        <ComparisonPanel source="wikipedia" data={wikipediaData} sharedThumbnail={sharedThumbnail} />
        <ComparisonPanel source="grokipedia" data={grokipediaData} sharedThumbnail={sharedThumbnail} />
      </div>

      {wikipediaData && grokipediaData && (
        <>
          <GrokVerdict
            topic={decodedTopic}
            wikipediaUrl={wikipediaData.content_urls?.desktop.page || `https://en.wikipedia.org/wiki/${topic}`}
            grokipediaUrl={grokipediaData.url || `https://grokipedia.com/page/${topic}`}
          />

          <TrustCounter topic={decodedTopic} />
        </>
      )}

      {wikipediaData && !grokipediaData && (
        <div className="my-8 rounded-lg border-2 border-gray-300 bg-gray-50 p-8 text-center">
          <div className="mb-4 text-5xl">🚧</div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">
            Can&apos;t compare yet
          </h3>
          <p className="text-gray-600 mb-4">
            We need both Wikipedia and Grokipedia articles to generate Grok&apos;s
            analysis. Try searching for another topic!
          </p>
          <p className="text-sm text-gray-500">
            Popular comparisons: Elon Musk, Bitcoin, COVID-19, AI
          </p>
        </div>
      )}

      <div className="mt-8">
        <ShareButtons topic={decodedTopic} url={pageUrl} />
      </div>
    </main>
  );
}
