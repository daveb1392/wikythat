import Link from 'next/link';
import type { Metadata } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000');

export const metadata: Metadata = {
  title: 'About Wikithat',
  description: 'Learn about Wikithat, the free tool that compares Wikipedia and Grokipedia articles side-by-side. Our mission, how it works, and who built it.',
  alternates: {
    canonical: `${siteUrl}/about`,
  },
};

export default function AboutPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Wikithat',
    url: `${siteUrl}/about`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Wikithat',
      url: siteUrl,
      description: 'A free comparison tool for Wikipedia and Grokipedia articles.',
      foundingDate: '2025',
    },
  };

  return (
    <main className="container mx-auto px-4 py-16 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <h1 className="mb-8 text-4xl font-bold">About Wikithat</h1>

      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-lg text-gray-700 leading-relaxed">
          Wikithat is a free, independent comparison tool that displays Wikipedia and Grokipedia
          articles side-by-side. Our goal is simple: help people see how the same topic is described
          by a human-edited encyclopedia versus an AI-generated one.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Why We Built This</h2>
        <p className="text-gray-700 leading-relaxed">
          When xAI launched Grokipedia in October 2025, it raised an important question: how does
          AI-generated knowledge compare to the collaboratively edited content that Wikipedia has
          built over two decades? Rather than speculating, we built a tool that lets anyone compare
          the two sources directly and form their own opinion.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">How It Works</h2>
        <p className="text-gray-700 leading-relaxed">
          When you search for a topic on Wikithat, we fetch the corresponding articles from both
          Wikipedia (via its public REST API) and Grokipedia (via our scraping backend). The summaries
          are displayed side-by-side so you can compare them directly. An AI-generated verdict
          powered by Grok highlights the key differences between the two sources.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Our Principles</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li><strong>Independence:</strong> Wikithat is not affiliated with Wikipedia, the Wikimedia Foundation, xAI, or Grokipedia.</li>
          <li><strong>Transparency:</strong> We show you the content from both sources without editorializing or filtering.</li>
          <li><strong>Free access:</strong> Wikithat is completely free to use, with no registration required.</li>
          <li><strong>Community input:</strong> Our voting feature lets users share which source they find more trustworthy on each topic.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Technology</h2>
        <p className="text-gray-700 leading-relaxed">
          Wikithat is built with Next.js and hosted on Railway. We use the Wikipedia REST API for
          Wikipedia content and a custom Python backend for Grokipedia scraping. AI-generated verdicts
          are powered by the Grok API from xAI.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Contact</h2>
        <p className="text-gray-700 leading-relaxed">
          Have feedback, found a bug, or want to suggest a feature? Reach out to us
          at <strong>hello@wikithat.com</strong>.
        </p>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; Back to comparisons
        </Link>
      </div>
    </main>
  );
}
