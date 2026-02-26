import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Analytics from '@/components/Analytics';
// import ForSaleBanner from '@/components/ForSaleBanner';
import DonationButton from '@/components/DonationButton';
import { LOGOS, LOGO_SIZES } from '@/lib/logos';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://wikithat.com' : 'http://localhost:3000')
  ),
  title: {
    default: 'Wikithat - Compare Wikipedia vs Grokipedia',
    template: '%s | Wikithat',
  },
  description:
    'Compare any topic side-by-side on Wikipedia and Grokipedia. See how traditional encyclopedia stacks up against AI-powered knowledge. Get AI-generated verdicts powered by Grok.',
  keywords: ['Wikipedia', 'Grokipedia', 'comparison', 'encyclopedia', 'AI', 'fact check', 'knowledge', 'Grok'],
  authors: [{ name: 'Wikithat' }],
  creator: 'Wikithat',
  publisher: 'Wikithat',
  icons: {
    icon: LOGOS.wikithat.favicon,
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Wikithat - Compare Wikipedia vs Grokipedia',
    description:
      'Compare any topic side-by-side on Wikipedia and Grokipedia. Traditional encyclopedia vs AI-powered knowledge.',
    type: 'website',
    siteName: 'Wikithat',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wikithat - Compare Wikipedia vs Grokipedia',
    description: 'Compare any topic side-by-side. Traditional encyclopedia vs AI-powered knowledge.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    // AI crawler meta tags for ChatGPT, Claude, Perplexity, etc.
    'ai-content-declaration': 'ai-generated-verdict-only',
    'content-type': 'comparison-tool',
    'topic-categories': 'encyclopedia,ai,knowledge-comparison,fact-checking',
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
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
        {/* <ForSaleBanner /> */}

        <header className="border-b bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src={LOGOS.wikithat.main}
                  alt="Wikithat"
                  width={LOGO_SIZES.header.width}
                  height={LOGO_SIZES.header.height}
                  className="object-contain"
                  priority
                />
              </Link>
              <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-600">
                <Link href="/topics" className="hover:text-blue-600 transition">Topics</Link>
                <Link href="/blog" className="hover:text-blue-600 transition">Blog</Link>
              </nav>
              <DonationButton />
            </div>
          </div>

          {/* Ad Slot - Header Leaderboard (728x90) */}
          {/* <div className="container mx-auto px-4 py-2">
            <div className="bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-gray-500 text-sm font-medium" style={{ height: '90px', maxWidth: '728px', margin: '0 auto' }}>
              Ad Space - 728x90 Leaderboard
            </div>
          </div> */}
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t bg-gradient-to-r from-blue-50 to-purple-50 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800 mb-4">
                Compare Wikipedia and Grokipedia articles side-by-side
              </p>

              {/* Ad Slot - Footer Medium Rectangle (300x250) */}
              {/* <div className="bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-gray-500 text-sm font-medium mb-6" style={{ height: '250px', maxWidth: '300px', margin: '0 auto 1.5rem' }}>
                Ad Space - 300x250 Rectangle
              </div> */}

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 mb-4">
                <Link href="/topics" className="hover:text-blue-600 transition">Topics</Link>
                <span className="hidden sm:inline">&middot;</span>
                <Link href="/blog" className="hover:text-blue-600 transition">Blog</Link>
                <span className="hidden sm:inline">&middot;</span>
                <span>© {new Date().getFullYear()} Wikithat</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 mb-2">
                <Link href="/about" className="hover:text-blue-600 transition">About</Link>
                <span className="hidden sm:inline">&middot;</span>
                <Link href="/privacy" className="hover:text-blue-600 transition">Privacy Policy</Link>
                <span className="hidden sm:inline">&middot;</span>
                <Link href="/terms" className="hover:text-blue-600 transition">Terms</Link>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Not affiliated with Wikipedia or Grokipedia
              </p>
              <p className="text-xs text-gray-600 font-medium">
                Powered by Grok
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
