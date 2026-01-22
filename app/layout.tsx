import type { Metadata } from 'next';
import Link from 'next/link';
import Analytics from '@/components/Analytics';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  title: 'Wikithat - Compare Wikipedia vs Grokipedia',
  description:
    'Compare any topic side-by-side on Wikipedia and Grokipedia. See how traditional encyclopedia stacks up against AI-powered knowledge.',
  openGraph: {
    title: 'Wikithat - Compare Wikipedia vs Grokipedia',
    description:
      'Compare any topic side-by-side on Wikipedia and Grokipedia.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-gray-50" suppressHydrationWarning>
        <Analytics />

        <header className="border-b bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              <span className="text-blue-600">Wiki</span>
              <span className="text-purple-600">that</span>
            </Link>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t bg-white py-6">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>
              Compare Wikipedia and Grokipedia articles side-by-side.
              <br />
              <span className="text-sm">
                Built with Next.js • Data from Wikipedia & Grokipedia APIs
              </span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
