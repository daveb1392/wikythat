import Link from 'next/link';
import type { Metadata } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000');

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Wikithat.com. Learn how we collect, use, and protect your data when using our Wikipedia vs Grokipedia comparison tool.',
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
      <p className="mb-6 text-sm text-gray-500">Last updated: February 26, 2026</p>

      <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
        <h2 className="text-2xl font-bold mt-8 mb-4">Overview</h2>
        <p className="leading-relaxed">
          Wikithat (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates wikithat.com.
          This Privacy Policy explains what information we collect, how we use it, and your rights
          regarding your data.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Information We Collect</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">Analytics Data</h3>
        <p className="leading-relaxed">
          We use Google Analytics (GA4) to understand how visitors use our site. This collects:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Pages visited and time spent on each page</li>
          <li>Referring website or search engine</li>
          <li>Browser type, operating system, and device type</li>
          <li>Approximate geographic location (country/city level)</li>
          <li>Anonymous usage patterns and interactions</li>
        </ul>
        <p className="leading-relaxed">
          Google Analytics uses cookies to distinguish unique visitors. You can opt out of Google
          Analytics tracking by installing the{' '}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Google Analytics Opt-out Browser Add-on
          </a>.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">Voting Data</h3>
        <p className="leading-relaxed">
          When you vote on which source you trust more, your vote is stored locally in your browser
          (localStorage) and anonymously on our servers. We do not associate votes with any personal
          information.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">Search Queries</h3>
        <p className="leading-relaxed">
          When you search for a topic, the query is sent to our server to fetch results from Wikipedia
          and Grokipedia. We do not store or log individual search queries tied to any personal identifier.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Information We Do Not Collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>We do not require user registration or accounts</li>
          <li>We do not collect names, email addresses, or other personal identifiers</li>
          <li>We do not sell or share data with third-party advertisers</li>
          <li>We do not use tracking pixels beyond Google Analytics</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Cookies</h2>
        <p className="leading-relaxed">
          Our site uses the following cookies:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Google Analytics cookies</strong> (_ga, _gid): Used for analytics purposes</li>
          <li><strong>localStorage</strong>: Used to store your votes locally in your browser</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Third-Party Services</h2>
        <p className="leading-relaxed">
          We use the following third-party services:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Google Analytics (GA4)</strong>: Web analytics</li>
          <li><strong>Wikipedia API</strong>: Fetching encyclopedia content</li>
          <li><strong>Railway</strong>: Web hosting</li>
          <li><strong>Supabase</strong>: Database for caching article content</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Your Rights</h2>
        <p className="leading-relaxed">
          Under GDPR, CCPA, and similar data protection regulations, you have the right to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access the data we hold about you</li>
          <li>Request deletion of your data</li>
          <li>Opt out of analytics tracking</li>
          <li>Lodge a complaint with a supervisory authority</li>
        </ul>
        <p className="leading-relaxed">
          Since we collect minimal data and do not require accounts, most user data is limited to
          anonymous analytics. To exercise your rights, contact us at <strong>hello@wikithat.com</strong>.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Changes to This Policy</h2>
        <p className="leading-relaxed">
          We may update this Privacy Policy from time to time. Changes will be posted on this page
          with an updated revision date.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Contact</h2>
        <p className="leading-relaxed">
          For questions about this Privacy Policy, contact us at <strong>hello@wikithat.com</strong>.
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
