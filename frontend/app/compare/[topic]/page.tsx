import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ComparisonPanel from '@/components/ComparisonPanel';
import GrokVerdict from '@/components/GrokVerdict';
import ShareButtons from '@/components/ShareButtons';
import TrustCounter from '@/components/TrustCounter';
import SearchBar from '@/components/SearchBar';
import TopicMappingWrapper from '@/components/TopicMappingWrapper';
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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000');
  const pageUrl = `${siteUrl}/compare/${topic}`;
  const description = `Compare ${decodedTopic} on Wikipedia and Grokipedia side-by-side. See the differences between traditional encyclopedia and AI-powered knowledge with our detailed comparison.`;

  return {
    title: `${decodedTopic}: Wikipedia vs Grokipedia Comparison | Wikithat`,
    description,
    keywords: [`${decodedTopic}`, 'Wikipedia', 'Grokipedia', 'comparison', 'encyclopedia', 'AI knowledge', 'fact check'],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${decodedTopic}: Wikipedia vs Grokipedia`,
      description,
      url: pageUrl,
      siteName: 'Wikithat',
      type: 'article',
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `Compare ${decodedTopic} on Wikipedia vs Grokipedia`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${decodedTopic}: Wikipedia vs Grokipedia`,
      description,
      images: [`${siteUrl}/og-image.png`],
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
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000');
  const pageUrl = `${siteUrl}/compare/${topic}`;

  // Extract Wikipedia thumbnail to share with Grokipedia panel
  const sharedThumbnail = wikipediaData?.thumbnail || null;

  // Structured data for SEO and AI crawlers
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${decodedTopic}: Wikipedia vs Grokipedia Comparison`,
    description: `Compare ${decodedTopic} on Wikipedia and Grokipedia side-by-side. See differences between traditional encyclopedia and AI-powered knowledge sources.`,
    url: pageUrl,
    about: {
      '@type': 'Thing',
      name: decodedTopic,
      description: `Comparison of ${decodedTopic} across Wikipedia and Grokipedia platforms`,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Compare',
          item: `${siteUrl}/compare`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: decodedTopic,
          item: pageUrl,
        },
      ],
    },
    mainEntity: {
      '@type': 'Article',
      headline: `${decodedTopic}: Wikipedia vs Grokipedia Comparison`,
      description: `Detailed side-by-side comparison of ${decodedTopic} across Wikipedia (traditional encyclopedia) and Grokipedia (AI-powered knowledge base)`,
      about: {
        '@type': 'Thing',
        name: decodedTopic,
      },
      author: {
        '@type': 'Organization',
        name: 'Wikithat',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Wikithat',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/logo.png`,
        },
      },
      isAccessibleForFree: true,
      genre: 'Comparison',
      keywords: `${decodedTopic}, Wikipedia, Grokipedia, comparison, encyclopedia, AI knowledge, fact check`,
    },
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

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

      {/* Topic mapping banner - shown when Grokipedia article is found */}
      {grokipediaData && (
        <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
            <span>Wrong Grokipedia match?</span>
            <TopicMappingWrapper
              wikipediaTopic={decodedTopic}
              currentSlug={grokipediaData.url?.split('/').pop()}
            />
          </div>
        </div>
      )}

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
            Can&apos;t find Grokipedia match
          </h3>
          <p className="text-gray-600 mb-4">
            We couldn&apos;t automatically find the matching Grokipedia article.
            Help us by selecting the correct topic:
          </p>
          <TopicMappingWrapper wikipediaTopic={decodedTopic} />
          <p className="text-gray-500 text-sm mt-4">
            Or try searching for another topic!
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
