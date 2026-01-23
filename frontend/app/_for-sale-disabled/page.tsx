import type { Metadata } from 'next';
import Link from 'next/link';
import DomainMetrics from '@/components/DomainMetrics';
import DomainValuation from '@/components/DomainValuation';

export const metadata: Metadata = {
  title: 'Wikithat.com - For Sale',
  description: 'Premium domain: Wikithat.com - Wikipedia vs Grokipedia comparison platform for sale.',
};

export default function ForSalePage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            Wikithat.com
          </h1>
          <p className="text-2xl font-semibold text-green-600">For Sale</p>
        </div>

        {/* Domain Metrics */}
        <DomainMetrics />

        {/* AI Valuation */}
        <DomainValuation />

        {/* What You Get */}
        <section className="mb-12">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">What You Get</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-2 text-xl font-semibold text-gray-900">🎯 Unique Concept</h3>
              <p className="text-gray-700">
                First-of-its-kind platform comparing Wikipedia (traditional encyclopedia) vs Grokipedia (AI-powered knowledge).
                Side-by-side article comparisons with AI-generated verdicts.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-2 text-xl font-semibold text-gray-900">💻 Functional Website</h3>
              <p className="text-gray-700">
                Built with Next.js and TypeScript. Currently deployed and operational with search, comparison features,
                and caching to minimize API costs. Not a perfect codebase, but it works.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-2 text-xl font-semibold text-gray-900">💰 Low Operating Costs</h3>
              <p className="text-gray-700">
                Runs on free tiers for most services. Hosting ~$5-20/month. Grok API is pay-per-use but cached for 7 days
                to reduce costs by 95%+.
              </p>
            </div>
          </div>
        </section>

        {/* Why Buy */}
        <section className="mb-12 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 p-8">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Why Buy This?</h2>
          <ul className="space-y-3 text-gray-800">
            <li className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <span><strong>Great Domain:</strong> Memorable, catchy, perfect for comparison/reference sites</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <span><strong>Unique Concept:</strong> Wikipedia vs AI-powered encyclopedia - first of its kind</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🚀</span>
              <span><strong>Already Built:</strong> Working site with search, comparisons, and AI verdicts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <span><strong>Monetization Ready:</strong> Add ads, affiliate links, or premium features</span>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="rounded-lg border-2 border-green-500 bg-green-50 p-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-green-900">Interested?</h2>
          <p className="mb-6 text-lg text-gray-700">
            Make an offer for the domain and working site.
          </p>
          <div className="mb-6">
            <a
              href="mailto:david@badovinac.com?subject=Wikithat.com%20Purchase%20Inquiry"
              className="mt-2 inline-block rounded-lg bg-green-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-green-700"
            >
              Contact: david@badovinac.com
            </a>
          </div>
          <p className="text-sm text-gray-600">
            Includes source code, database, and deployment assistance
          </p>
        </section>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Wikithat
          </Link>
        </div>
      </div>
    </main>
  );
}
