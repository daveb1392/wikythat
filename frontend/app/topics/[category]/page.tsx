import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { topicCategories } from '@/lib/seed-topics';
import { slugify } from '@/lib/slugify';

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return topicCategories.map((cat) => ({
    category: cat.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = topicCategories.find((c) => c.slug === slug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000');

  return {
    title: `${category.name} - Wikipedia vs Grokipedia Comparisons`,
    description: category.description,
    alternates: {
      canonical: `${siteUrl}/topics/${slug}`,
    },
    openGraph: {
      title: `${category.name} Comparisons - Wikithat`,
      description: category.description,
      url: `${siteUrl}/topics/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const category = topicCategories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} - Wikipedia vs Grokipedia Comparisons`,
    description: category.description,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: category.topics.map((topic, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${topic}: Wikipedia vs Grokipedia`,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wikithat.com'}/compare/${slugify(topic)}`,
      })),
    },
  };

  return (
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mb-4">
        <Link href="/topics" className="text-blue-600 hover:underline text-sm">
          &larr; All categories
        </Link>
      </div>

      <h1 className="mb-4 text-4xl font-bold">{category.name}</h1>
      <p className="mb-10 text-gray-600 text-lg">{category.description}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {category.topics.map((topic) => (
          <Link
            key={topic}
            href={`/compare/${slugify(topic)}`}
            className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-500 hover:shadow-md"
          >
            <h2 className="font-semibold text-gray-900">{topic}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Wikipedia vs Grokipedia comparison
            </p>
          </Link>
        ))}
      </div>

      {/* Cross-link to other categories */}
      <section className="mt-12 border-t pt-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Other Categories</h2>
        <div className="flex flex-wrap gap-3">
          {topicCategories
            .filter((c) => c.slug !== slug)
            .map((cat) => (
              <Link
                key={cat.slug}
                href={`/topics/${cat.slug}`}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition"
              >
                {cat.name}
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
