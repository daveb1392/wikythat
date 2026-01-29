import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import SearchBar from '@/components/SearchBar';
import { seedTopics } from '@/lib/seed-topics';
import { LOGOS, LOGO_SIZES } from '@/lib/logos';

export const metadata: Metadata = {
  title: 'Wikithat - Compare Wikipedia vs Grokipedia Side-by-Side',
  description: 'Compare any topic side-by-side on Wikipedia and Grokipedia. See how traditional encyclopedia stacks up against AI-powered knowledge. Get AI-generated verdicts powered by Grok.',
  keywords: ['Wikipedia', 'Grokipedia', 'comparison', 'encyclopedia', 'AI knowledge', 'fact check', 'Grok AI', 'knowledge comparison'],
  openGraph: {
    title: 'Wikithat - Compare Wikipedia vs Grokipedia',
    description: 'Compare any topic side-by-side. Traditional encyclopedia vs AI-powered knowledge.',
    type: 'website',
    siteName: 'Wikithat',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Wikithat - Compare Wikipedia and Grokipedia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wikithat - Compare Wikipedia vs Grokipedia',
    description: 'Compare any topic side-by-side. Traditional encyclopedia vs AI-powered knowledge.',
    images: ['/og-image.png'],
  },
};

export default function HomePage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000');

  // Structured data for homepage
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Wikithat',
    url: siteUrl,
    description: 'Compare Wikipedia and Grokipedia articles side-by-side',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/compare/{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Wikithat?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Wikithat is a comparison tool that lets you view Wikipedia and Grokipedia articles side-by-side to see the differences between traditional encyclopedia content and AI-powered knowledge.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does Wikithat work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Simply search for any topic, and Wikithat will display the Wikipedia and Grokipedia articles side-by-side. You can then compare the content, vote on which source you trust more, and see an AI-generated verdict powered by Grok.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Wikithat affiliated with Wikipedia or Grokipedia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, Wikithat is an independent comparison tool and is not affiliated with Wikipedia or Grokipedia.',
        },
      },
    ],
  };

  return (
    <main className="container mx-auto px-4 py-16">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-bold">
          <span className="text-blue-600">Wikipedia</span> vs{' '}
          <span className="text-purple-600">Grokipedia</span>
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          Compare any topic side-by-side and see the difference
        </p>

        <div className="flex justify-center">
          <SearchBar />
        </div>
      </div>

      <section className="mt-16">
        <h2 className="mb-6 text-center text-2xl font-bold">
          Popular Comparisons
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {seedTopics.slice(0, 12).map((topic) => (
            <Link
              key={topic}
              href={`/compare/${encodeURIComponent(topic)}`}
              className="group rounded-lg border border-gray-300 bg-white p-4 transition hover:border-blue-500 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-center gap-2">
                <Image
                  src={LOGOS.wikipedia.icon}
                  alt="Wikipedia"
                  width={LOGO_SIZES.iconSmall.width}
                  height={LOGO_SIZES.iconSmall.height}
                  className="object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                />
                <span className="text-gray-400">vs</span>
                <Image
                  src={LOGOS.grokipedia.icon}
                  alt="Grokipedia"
                  width={LOGO_SIZES.iconSmall.width}
                  height={LOGO_SIZES.iconSmall.height}
                  className="object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="text-center font-semibold text-gray-900">
                {topic}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 p-8">
        <h2 className="mb-4 text-center text-2xl font-bold">How It Works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-4xl">🔍</div>
            <h3 className="mb-2 font-semibold">Search</h3>
            <p className="text-gray-700">
              Enter any topic you want to compare
            </p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl">⚖️</div>
            <h3 className="mb-2 font-semibold">Compare</h3>
            <p className="text-gray-700">
              See Wikipedia and Grokipedia side-by-side
            </p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl">🗳️</div>
            <h3 className="mb-2 font-semibold">Vote</h3>
            <p className="text-gray-700">Share which source you trust more</p>
          </div>
        </div>
      </section>
    </main>
  );
}
