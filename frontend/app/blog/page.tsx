import Link from 'next/link';
import type { Metadata } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000');

export const metadata: Metadata = {
  title: 'Blog - Wikipedia vs Grokipedia Insights',
  description: 'In-depth articles comparing Wikipedia and Grokipedia. Analysis, accuracy reviews, and insights about traditional vs AI-powered encyclopedias.',
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    title: 'Wikithat Blog - Wikipedia vs Grokipedia Insights',
    description: 'In-depth articles comparing Wikipedia and Grokipedia.',
    url: `${siteUrl}/blog`,
    type: 'website',
  },
};

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    slug: 'wikipedia-vs-grokipedia-complete-comparison',
    title: 'Wikipedia vs Grokipedia: The Complete 2026 Comparison',
    description: 'An in-depth look at how Wikipedia and Grokipedia differ in accuracy, tone, coverage, and editorial approach across dozens of topics.',
    date: '2026-02-26',
    readTime: '8 min read',
  },
];

export default function BlogPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Wikithat Blog',
    description: 'In-depth articles comparing Wikipedia and Grokipedia',
    url: `${siteUrl}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'Wikithat',
      url: siteUrl,
    },
  };

  return (
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <h1 className="mb-4 text-4xl font-bold text-center">Blog</h1>
      <p className="mb-12 text-center text-gray-600 text-lg">
        In-depth analysis of Wikipedia vs Grokipedia
      </p>

      <div className="space-y-8">
        {blogPosts.map((post) => (
          <article key={post.slug} className="rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-md">
            <Link href={`/blog/${post.slug}`}>
              <time className="text-sm text-gray-500">{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              <span className="text-sm text-gray-400 mx-2">&middot;</span>
              <span className="text-sm text-gray-500">{post.readTime}</span>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 hover:text-blue-600">
                {post.title}
              </h2>
              <p className="mt-2 text-gray-600">{post.description}</p>
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/" className="text-blue-600 hover:underline">
          Back to comparisons
        </Link>
      </div>
    </main>
  );
}
