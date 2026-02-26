import Link from 'next/link';
import type { Metadata } from 'next';
import { topicCategories } from '@/lib/seed-topics';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000');

export const metadata: Metadata = {
  title: 'Browse Topics - Wikipedia vs Grokipedia by Category',
  description: 'Browse Wikipedia vs Grokipedia comparisons by category: Politics, Technology, Science, Crypto, and Business. Find the topics that interest you most.',
  alternates: {
    canonical: `${siteUrl}/topics`,
  },
  openGraph: {
    title: 'Browse Topics - Wikithat',
    description: 'Browse Wikipedia vs Grokipedia comparisons by category.',
    url: `${siteUrl}/topics`,
  },
};

export default function TopicsPage() {
  return (
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="mb-4 text-4xl font-bold text-center">Browse by Category</h1>
      <p className="mb-12 text-center text-gray-600 text-lg">
        Explore Wikipedia vs Grokipedia comparisons organized by topic
      </p>

      <div className="space-y-6">
        {topicCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/topics/${category.slug}`}
            className="block rounded-lg border border-gray-200 bg-white p-6 transition hover:border-blue-500 hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h2>
            <p className="text-gray-600 mb-3">{category.description}</p>
            <p className="text-sm text-blue-600">
              {category.topics.length} comparisons &rarr;
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; Back to home
        </Link>
      </div>
    </main>
  );
}
