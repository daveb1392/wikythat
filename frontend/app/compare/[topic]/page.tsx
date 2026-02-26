import { notFound } from 'next/navigation';
import Link from 'next/link';
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
import { slugify, deslugify } from '@/lib/slugify';

interface PageProps {
  params: Promise<{ topic: string }>;
}

export const revalidate = 86400; // ISR: revalidate every 24 hours

export async function generateStaticParams() {
  return seedTopics.map((topic) => ({
    topic: slugify(topic),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { topic: slug } = await params;
  const displayTopic = deslugify(slug);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000');
  const pageUrl = `${siteUrl}/compare/${slug}`;
  const description = `Compare ${displayTopic} on Wikipedia and Grokipedia side-by-side. See the differences between traditional encyclopedia and AI-powered knowledge with our detailed comparison.`;

  return {
    title: `${displayTopic}: Wikipedia vs Grokipedia Comparison`,
    description,
    keywords: [`${displayTopic}`, 'Wikipedia', 'Grokipedia', 'comparison', 'encyclopedia', 'AI knowledge', 'fact check'],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${displayTopic}: Wikipedia vs Grokipedia`,
      description,
      url: pageUrl,
      siteName: 'Wikithat',
      type: 'article',
      images: [
        {
          url: `${siteUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Compare ${displayTopic} on Wikipedia vs Grokipedia`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayTopic}: Wikipedia vs Grokipedia`,
      description,
      images: [`${siteUrl}/opengraph-image`],
    },
  };
}

function getRelatedTopics(currentTopic: string, count: number = 6): string[] {
  const current = currentTopic.toLowerCase();
  return seedTopics
    .filter((t) => t.toLowerCase() !== current)
    .sort(() => 0.5 - Math.random())
    .slice(0, count);
}

export default async function ComparePage({ params }: PageProps) {
  const { topic: slug } = await params;
  const displayTopic = deslugify(slug);

  // Fetch both APIs in parallel using the display title
  const [wikipediaData, grokipediaData] = await Promise.all([
    fetchWikipediaArticle(displayTopic),
    fetchGrokipediaArticle(displayTopic),
  ]);

  // Show 404 only if Wikipedia fails (Wikipedia is primary source)
  if (!wikipediaData) {
    notFound();
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000');
  const pageUrl = `${siteUrl}/compare/${slug}`;

  // Extract Wikipedia thumbnail to share with Grokipedia panel
  const sharedThumbnail = wikipediaData?.thumbnail || null;

  const relatedTopics = getRelatedTopics(displayTopic);

  // Structured data for SEO and AI crawlers
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${displayTopic}: Wikipedia vs Grokipedia Comparison`,
    description: `Compare ${displayTopic} on Wikipedia and Grokipedia side-by-side. See differences between traditional encyclopedia and AI-powered knowledge sources.`,
    url: pageUrl,
    about: {
      '@type': 'Thing',
      name: displayTopic,
      description: `Comparison of ${displayTopic} across Wikipedia and Grokipedia platforms`,
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
          name: displayTopic,
          item: pageUrl,
        },
      ],
    },
    mainEntity: {
      '@type': 'Article',
      headline: `${displayTopic}: Wikipedia vs Grokipedia Comparison`,
      description: `Detailed side-by-side comparison of ${displayTopic} across Wikipedia (traditional encyclopedia) and Grokipedia (AI-powered knowledge base)`,
      about: {
        '@type': 'Thing',
        name: displayTopic,
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
      keywords: `${displayTopic}, Wikipedia, Grokipedia, comparison, encyclopedia, AI knowledge, fact check`,
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

      <h1 className="mb-4 text-center text-4xl font-bold">
        Comparing: {displayTopic}
      </h1>

      {/* SEO intro paragraph - unique content per page */}
      <p className="mb-8 text-center text-gray-600 max-w-3xl mx-auto">
        How does <strong>Wikipedia</strong> describe {displayTopic} compared to <strong>Grokipedia</strong>,
        the AI-powered encyclopedia by xAI? Read both summaries below, then vote on which source
        you find more accurate and trustworthy.
      </p>

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
              wikipediaTopic={displayTopic}
              currentSlug={grokipediaData.url?.split('/').pop()}
            />
          </div>
        </div>
      )}

      {wikipediaData && grokipediaData && (
        <>
          <GrokVerdict
            topic={displayTopic}
            wikipediaUrl={wikipediaData.content_urls?.desktop.page || `https://en.wikipedia.org/wiki/${slug}`}
            grokipediaUrl={grokipediaData.url || `https://grokipedia.com/page/${slug}`}
          />

          <TrustCounter topic={displayTopic} />
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
          <TopicMappingWrapper wikipediaTopic={displayTopic} />
          <p className="text-gray-500 text-sm mt-4">
            Or try searching for another topic!
          </p>
          <p className="text-sm text-gray-500">
            Popular comparisons: Elon Musk, Bitcoin, COVID-19, AI
          </p>
        </div>
      )}

      <div className="mt-8">
        <ShareButtons topic={displayTopic} url={pageUrl} />
      </div>

      {/* Related Comparisons - Internal Linking */}
      <section className="mt-12 border-t pt-8">
        <h2 className="mb-6 text-center text-2xl font-bold">
          More Comparisons
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {relatedTopics.map((topic) => (
            <Link
              key={topic}
              href={`/compare/${slugify(topic)}`}
              className="rounded-lg border border-gray-200 bg-white p-4 text-center font-medium text-gray-900 transition hover:border-blue-500 hover:shadow-md"
            >
              {topic}
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:underline"
          >
            View all comparisons
          </Link>
        </div>
      </section>
    </main>
  );
}
