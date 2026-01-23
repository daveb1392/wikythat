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
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  title: 'Wikithat - Compare Wikipedia vs Grokipedia',
  description:
    'Compare any topic side-by-side on Wikipedia and Grokipedia. See how traditional encyclopedia stacks up against AI-powered knowledge.',
  icons: {
    icon: LOGOS.wikithat.favicon,
  },
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
                <span>© {new Date().getFullYear()} Wikithat</span>
                <span className="hidden sm:inline">•</span>
                <span>Data from Wikipedia & Grokipedia</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Not affiliated with Wikipedia or Grokipedia
              </p>
              <p className="text-xs text-gray-600 font-medium">
                Powered by Grok · Built with ❤️
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
