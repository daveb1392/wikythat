# Product Requirements Document: Wikithat.com

**Version:** 2.2 | **Status:** Claude Code Ready | **Date:** January 21, 2026

---

## 1. Overview

**Product:** Wikithat.com  
**Tagline:** "Wiki That? Or Grok It? Compare and Decide."

A lightweight web app for side-by-side comparisons of Wikipedia and Grokipedia articles. Users search a topic, get summaries from both sources, with humorous AI-generated verdicts favoring Grokipedia's "truth-seeking" positioning.

**Business Model:** Drive viral traffic via SEO/social, monetize through AdSense/affiliates, flip domain for $5-15k with traffic proof-of-concept — or scale into a product.

**Target Audience:** Tech enthusiasts, AI fans, researchers, students, X/Elon users debating "biased" encyclopedias.

---

## 2. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monthly Uniques | 5k-20k in 1-2 months | GA4 |
| Engagement Rate | ≥10% | (Shares + Votes) / Sessions |
| Page Load Time | <2 seconds | Lighthouse |
| Organic Traffic | ≥50% of total | GA4 Source/Medium |
| Lighthouse Score | >95 | PageSpeed Insights |
| Google Ranking | Page 1 | "Wikipedia vs Grokipedia" |

---

## 3. Technical Architecture

### 3.1 Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | SSG/ISR for SEO, scales to full product |
| Styling | Tailwind CSS 3.x | Utility-first, minimal bundle |
| Components | React Server Components | Zero client JS by default |
| Hosting | Railway | Simple deploys, predictable pricing |
| Analytics | GA4 + GTM | Traffic proof for flip valuation |

### 3.2 API Strategy (Hybrid Approach)

**Primary: Unofficial Grokipedia API (Free)**
```
Endpoint: https://grokipedia-api.com/page/{slug}
Rate Limit: 100 req/min per IP
Auth: None required
Response: { title, slug, url, content_text, char_count, word_count, references_count, references }
Cache: Server-side 2-day TTL built-in
Source: github.com/jasonniebauer/grokipedia-api
```

**Fallback: xAI Grok API (Paid)**
```
Endpoint: https://api.x.ai/v1/chat/completions
Model: grok-3 or grok-4
Pricing: ~$3/M input tokens, ~$15/M output tokens
Auth: Bearer token (XAI_API_KEY)
Use when: Unofficial API fails or returns null
```

**Wikipedia REST API (Free)**
```
Endpoint: https://en.wikipedia.org/api/rest_v1/page/summary/{title}
Rate Limit: 200 req/sec
Auth: None (use proper User-Agent)
Response: { title, extract, thumbnail, content_urls, description }
```

---

## 4. Project Structure

```
wikithat/
├── app/
│   ├── layout.tsx                    # Root layout with metadata
│   ├── page.tsx                      # Homepage with hero search
│   ├── globals.css                   # Tailwind imports
│   ├── compare/
│   │   └── [topic]/
│   │       └── page.tsx              # Comparison page (SSG)
│   ├── sitemap.ts                    # Dynamic sitemap
│   └── robots.ts                     # Robots.txt
├── components/
│   ├── SearchBar.tsx                 # Client component with autocomplete
│   ├── ComparisonPanel.tsx           # Server component for display
│   ├── VotingWidget.tsx              # Client component for polling
│   ├── ShareButtons.tsx              # Server component
│   ├── FunnySummary.tsx              # Server component
│   └── Analytics.tsx                 # GA4 script component
├── lib/
│   ├── wikipedia.ts                  # Wikipedia API client
│   ├── grokipedia.ts                 # Hybrid Grokipedia client
│   ├── verdicts.ts                   # Funny summary generator
│   └── seed-topics.ts                # Pre-generated topic list
├── public/
│   ├── favicon.ico
│   └── og-default.png                # Fallback OG image
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── README.md
```

---

## 5. Environment Variables

```env
# Required for production
NEXT_PUBLIC_SITE_URL=https://wikithat.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Optional
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
XAI_API_KEY=xai-xxxx              # Fallback API (only used if unofficial fails)
```

---

## 6. Core Implementation

### 6.1 Wikipedia Client (`lib/wikipedia.ts`)

```typescript
export interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
  content_urls: { desktop: { page: string } };
  description?: string;
}

export async function getWikipediaSummary(topic: string): Promise<WikiSummary | null> {
  const slug = encodeURIComponent(topic.replace(/ /g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
  
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Wikithat/1.0 (https://wikithat.com; contact@wikithat.com)' },
      next: { revalidate: 86400 } // Cache 24 hours
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
```

### 6.2 Hybrid Grokipedia Client (`lib/grokipedia.ts`)

```typescript
export interface GrokipediaResult {
  source: 'unofficial-api' | 'xai-fallback' | 'failed';
  title: string;
  content: string;
  url?: string;
  wordCount?: number;
}

interface GrokipediaPage {
  title: string;
  slug: string;
  url: string;
  content_text: string;
  word_count: number;
}

// Primary: Unofficial API (free)
async function fetchFromUnofficialAPI(topic: string): Promise<GrokipediaResult | null> {
  const slug = topic.replace(/ /g, '_');
  const url = `https://grokipedia-api.com/page/${encodeURIComponent(slug)}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    
    const data: GrokipediaPage = await res.json();
    return {
      source: 'unofficial-api',
      title: data.title,
      content: extractSummary(data.content_text),
      url: data.url,
      wordCount: data.word_count
    };
  } catch {
    return null;
  }
}

// Fallback: xAI Grok API (paid)
async function fetchFromXAI(topic: string, apiKey: string): Promise<GrokipediaResult | null> {
  const systemPrompt = `You are Grok, generating a Grokipedia-style article summary.
Write in an authoritative, slightly irreverent tone. Be factual but add personality.
Aim for "maximum truth" - acknowledge controversies Wikipedia might downplay.
Keep summaries to 2-3 paragraphs (150-250 words).`;

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Write a Grokipedia summary for "${topic}".` }
        ],
        max_tokens: 500,
        temperature: 0.8
      }),
      cache: 'no-store' // Don't cache API calls
    });

    if (!res.ok) return null;
    const data = await res.json();
    
    return {
      source: 'xai-fallback',
      title: topic,
      content: data.choices[0].message.content,
      url: `https://grokipedia.com/page/${topic.replace(/ /g, '_')}`
    };
  } catch {
    return null;
  }
}

// Main export: tries unofficial first, falls back to xAI
export async function getGrokipediaSummary(topic: string): Promise<GrokipediaResult> {
  // Try unofficial API first (free)
  const unofficial = await fetchFromUnofficialAPI(topic);
  if (unofficial) return unofficial;
  
  // Fallback to xAI if key provided
  const apiKey = process.env.XAI_API_KEY;
  if (apiKey) {
    const xai = await fetchFromXAI(topic, apiKey);
    if (xai) return xai;
  }
  
  // Both failed
  return {
    source: 'failed',
    title: topic,
    content: 'Grokipedia content unavailable. The AI truth-seekers are taking a break.'
  };
}

// Helper: extract first 2-3 paragraphs
function extractSummary(content: string, maxLength = 600): string {
  const cleaned = content.replace(/^Fact-checked by Grok\n+\w+\n+/i, '');
  const paragraphs = cleaned.split('\n\n').filter(p => p.trim().length > 50);
  let summary = '';
  
  for (const p of paragraphs.slice(0, 3)) {
    if ((summary + p).length > maxLength) break;
    summary += (summary ? '\n\n' : '') + p;
  }
  
  return summary || paragraphs[0]?.slice(0, maxLength) || content.slice(0, maxLength);
}
```

### 6.3 Comparison Page (`app/compare/[topic]/page.tsx`)

```tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getWikipediaSummary } from '@/lib/wikipedia';
import { getGrokipediaSummary } from '@/lib/grokipedia';
import { seedTopics } from '@/lib/seed-topics';
import ComparisonPanel from '@/components/ComparisonPanel';
import FunnySummary from '@/components/FunnySummary';
import VotingWidget from '@/components/VotingWidget';
import ShareButtons from '@/components/ShareButtons';

// Static generation with ISR
export const dynamic = 'force-static';
export const revalidate = 86400; // Revalidate every 24 hours

// Pre-generate seed topic pages at build time
export async function generateStaticParams() {
  return seedTopics.map(topic => ({
    topic: encodeURIComponent(topic.replace(/ /g, '_'))
  }));
}

// Dynamic metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic).replace(/_/g, ' ');
  
  return {
    title: `${decodedTopic}: Wikipedia vs Grokipedia Comparison | Wikithat`,
    description: `Compare ${decodedTopic} on Wikipedia and Grokipedia side-by-side. See AI-generated summaries and vote for the best explanation.`,
    openGraph: {
      title: `${decodedTopic}: Wikipedia vs Grokipedia`,
      description: `Which explains ${decodedTopic} better? Compare and decide.`,
      url: `https://wikithat.com/compare/${topic}`,
    },
    alternates: {
      canonical: `https://wikithat.com/compare/${topic}`
    }
  };
}

interface Props {
  params: Promise<{ topic: string }>;
}

export default async function ComparePage({ params }: Props) {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic).replace(/_/g, ' ');
  
  // Fetch both sources in parallel
  const [wiki, grok] = await Promise.all([
    getWikipediaSummary(decodedTopic),
    getGrokipediaSummary(decodedTopic)
  ]);
  
  // 404 if both fail
  if (!wiki && grok.source === 'failed') {
    notFound();
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
        Compare: <span className="text-blue-600">{decodedTopic}</span>
      </h1>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <ComparisonPanel 
          source="wikipedia"
          title={wiki?.title || decodedTopic}
          content={wiki?.extract || 'Wikipedia content unavailable.'}
          url={wiki?.content_urls?.desktop?.page}
          thumbnail={wiki?.thumbnail?.source}
        />
        
        <ComparisonPanel 
          source="grokipedia"
          title={grok.title}
          content={grok.content}
          url={grok.url}
          badge={grok.source === 'xai-fallback' ? 'AI Generated' : undefined}
        />
      </div>
      
      <FunnySummary topic={decodedTopic} grokSource={grok.source} />
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-8">
        <VotingWidget topic={topic} />
        <ShareButtons topic={decodedTopic} slug={topic} />
      </div>
    </main>
  );
}
```

### 6.4 SearchBar Component (`components/SearchBar.tsx`)

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce API calls
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&origin=*`
        );
        const data = await res.json();
        setSuggestions(data[1] || []);
        setIsOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSubmit = (topic: string) => {
    const slug = encodeURIComponent(topic.replace(/ /g, '_'));
    router.push(`/compare/${slug}`);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const topic = selectedIndex >= 0 ? suggestions[selectedIndex] : query;
      if (topic) handleSubmit(topic);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(query); }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search any topic... (e.g., Elon Musk, Bitcoin, AI)"
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Compare
        </button>
      </form>
      
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              onClick={() => handleSubmit(suggestion)}
              className={`px-4 py-2 cursor-pointer ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 6.5 VotingWidget Component (`components/VotingWidget.tsx`)

```tsx
'use client';

import { useState, useEffect } from 'react';

const options = [
  { id: 'wikipedia', label: 'Wikipedia', color: 'bg-blue-500' },
  { id: 'grokipedia', label: 'Grokipedia', color: 'bg-green-500' },
  { id: 'both-good', label: 'Both Good', color: 'bg-purple-500' },
  { id: 'both-bad', label: 'Both Bad', color: 'bg-gray-500' },
];

export default function VotingWidget({ topic }: { topic: string }) {
  const [voted, setVoted] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, number>>({});

  useEffect(() => {
    const stored = localStorage.getItem(`vote-${topic}`);
    if (stored) {
      setVoted(stored);
      loadResults();
    }
  }, [topic]);

  const loadResults = () => {
    const allVotes = JSON.parse(localStorage.getItem(`votes-${topic}`) || '{}');
    setResults(allVotes);
  };

  const handleVote = (optionId: string) => {
    localStorage.setItem(`vote-${topic}`, optionId);
    const allVotes = JSON.parse(localStorage.getItem(`votes-${topic}`) || '{}');
    allVotes[optionId] = (allVotes[optionId] || 0) + 1;
    localStorage.setItem(`votes-${topic}`, JSON.stringify(allVotes));
    setVoted(optionId);
    setResults(allVotes);
  };

  const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-gray-50 rounded-lg p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold text-center mb-4">
        Which explanation is better?
      </h3>
      
      <div className="space-y-2">
        {options.map(option => {
          const count = results[option.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          
          return (
            <button
              key={option.id}
              onClick={() => !voted && handleVote(option.id)}
              disabled={!!voted}
              className={`w-full p-3 rounded-lg text-left transition relative overflow-hidden ${
                voted 
                  ? 'bg-gray-100 cursor-default' 
                  : 'bg-white border-2 border-gray-200 hover:border-blue-400 cursor-pointer'
              }`}
            >
              {voted && (
                <div 
                  className={`absolute left-0 top-0 h-full ${option.color} opacity-20`}
                  style={{ width: `${percentage}%` }}
                />
              )}
              <span className="relative flex justify-between">
                <span>{option.label}</span>
                {voted && <span className="font-semibold">{percentage}%</span>}
              </span>
            </button>
          );
        })}
      </div>
      
      {voted && (
        <p className="text-center text-sm text-gray-500 mt-3">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
        </p>
      )}
    </div>
  );
}
```

### 6.6 ComparisonPanel Component (`components/ComparisonPanel.tsx`)

```tsx
import Image from 'next/image';

interface Props {
  source: 'wikipedia' | 'grokipedia';
  title: string;
  content: string;
  url?: string;
  thumbnail?: string;
  badge?: string;
}

export default function ComparisonPanel({ source, title, content, url, thumbnail, badge }: Props) {
  const isWiki = source === 'wikipedia';
  
  return (
    <div className={`rounded-lg border-2 p-6 ${
      isWiki ? 'border-blue-200 bg-blue-50/30' : 'border-green-200 bg-green-50/30'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-bold ${isWiki ? 'text-blue-700' : 'text-green-700'}`}>
          {isWiki ? '📘 Wikipedia' : '🤖 Grokipedia'}
        </h2>
        {badge && (
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            {badge}
          </span>
        )}
      </div>
      
      {thumbnail && (
        <div className="mb-4">
          <Image
            src={thumbnail}
            alt={title}
            width={200}
            height={150}
            className="rounded-lg object-cover"
          />
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      
      <p className="text-gray-700 whitespace-pre-line leading-relaxed">
        {content}
      </p>
      
      {url && (
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-block mt-4 text-sm ${
            isWiki ? 'text-blue-600 hover:text-blue-800' : 'text-green-600 hover:text-green-800'
          }`}
        >
          Read full article →
        </a>
      )}
    </div>
  );
}
```

### 6.7 FunnySummary Component (`components/FunnySummary.tsx`)

```tsx
const verdicts = [
  "Wikipedia gives you the facts. Grokipedia gives you the *real* facts. 🎯",
  "One was written by volunteers. One was written by an AI that doesn't sleep. You decide.",
  "Wikipedia: peer-reviewed. Grokipedia: Grok-reviewed. Both have their merits.",
  "The encyclopedia wars have begun. Pick your fighter.",
  "Old school meets new school. Encyclopedia edition.",
  "Wikipedia's been around since 2001. Grokipedia arrived with attitude.",
];

interface Props {
  topic: string;
  grokSource: string;
}

export default function FunnySummary({ topic, grokSource }: Props) {
  // Deterministic selection based on topic (consistent per page)
  const index = topic.length % verdicts.length;
  const verdict = verdicts[index];
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 text-center">
      <p className="text-lg italic text-gray-700">"{verdict}"</p>
      {grokSource === 'xai-fallback' && (
        <p className="text-xs text-gray-500 mt-2">
          Grokipedia content generated via xAI Grok API
        </p>
      )}
    </div>
  );
}
```

### 6.8 ShareButtons Component (`components/ShareButtons.tsx`)

```tsx
interface Props {
  topic: string;
  slug: string;
}

export default function ShareButtons({ topic, slug }: Props) {
  const url = `https://wikithat.com/compare/${slug}`;
  const text = `I just compared "${topic}" on Wikipedia vs Grokipedia 🤖`;
  
  const links = [
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: '𝕏'
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: 'f'
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: 'in'
    },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">Share:</span>
      {links.map(link => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
          title={`Share on ${link.name}`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
```

### 6.9 Root Layout (`app/layout.tsx`)

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Analytics from '@/components/Analytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wikithat - Compare Wikipedia vs Grokipedia',
  description: 'Side-by-side comparisons of Wikipedia and Grokipedia articles. See how AI explains topics differently.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wikithat.com'),
  openGraph: {
    title: 'Wikithat - Wikipedia vs Grokipedia',
    description: 'Compare any topic on Wikipedia and Grokipedia side-by-side.',
    siteName: 'Wikithat',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <a href="/" className="text-xl font-bold">
              Wiki<span className="text-blue-600">that</span>
            </a>
            <span className="text-sm text-gray-500">Wiki That? Or Grok It?</span>
          </div>
        </nav>
        {children}
        <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
          <p>Wikithat.com — Compare Wikipedia and Grokipedia side-by-side</p>
          <p className="mt-1">Not affiliated with Wikipedia or xAI/Grokipedia</p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
```

### 6.10 Homepage (`app/page.tsx`)

```tsx
import SearchBar from '@/components/SearchBar';
import { seedTopics } from '@/lib/seed-topics';
import Link from 'next/link';

export default function Home() {
  const popularTopics = seedTopics.slice(0, 12);
  
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Wiki<span className="text-blue-600">that</span> or{' '}
          <span className="text-green-600">Grok</span> it?
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Compare any topic on Wikipedia vs Grokipedia side-by-side
        </p>
        <SearchBar />
      </div>
      
      <div className="mt-16">
        <h2 className="text-xl font-semibold mb-4 text-center">Popular Comparisons</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {popularTopics.map(topic => (
            <Link
              key={topic}
              href={`/compare/${encodeURIComponent(topic.replace(/ /g, '_'))}`}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-center text-sm"
            >
              {topic}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
```

### 6.11 Sitemap (`app/sitemap.ts`)

```typescript
import { MetadataRoute } from 'next';
import { seedTopics } from '@/lib/seed-topics';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wikithat.com';
  
  const topicPages = seedTopics.map(topic => ({
    url: `${baseUrl}/compare/${encodeURIComponent(topic.replace(/ /g, '_'))}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...topicPages,
  ];
}
```

### 6.12 Analytics Component (`components/Analytics.tsx`)

```tsx
import Script from 'next/script';

export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
```

### 6.13 Seed Topics (`lib/seed-topics.ts`)

```typescript
export const seedTopics = [
  'Elon Musk',
  'Donald Trump',
  'Artificial Intelligence',
  'Bitcoin',
  'Climate Change',
  'Tesla',
  'SpaceX',
  'ChatGPT',
  'Wikipedia',
  'Joe Biden',
  'Taylor Swift',
  'Cryptocurrency',
  'Machine Learning',
  'Neural Network',
  'Grok',
  'xAI',
  'Electric Vehicles',
  'Mars Colonization',
  'Neuralink',
  'OpenAI',
  'Sam Altman',
  'Dogecoin',
  'Starlink',
  'The Boring Company',
  'Twitter',
  'Mark Zuckerberg',
  'Meta',
  'Apple',
  'Google',
  'Microsoft',
];
```

### 6.14 Next.js Config (`next.config.ts`)

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
};

export default nextConfig;
```

---

## 7. Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Init project (from project root)
railway init

# Deploy
railway up

# Set environment variables
railway variables set NEXT_PUBLIC_SITE_URL=https://wikithat.com
railway variables set NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
railway variables set XAI_API_KEY=xai-xxxx  # Optional fallback
```

---

## 8. Implementation Checklist

```
[ ] npx create-next-app@latest wikithat --typescript --tailwind --app
[ ] Create lib/wikipedia.ts
[ ] Create lib/grokipedia.ts (hybrid client)
[ ] Create lib/seed-topics.ts
[ ] Create components/SearchBar.tsx (client)
[ ] Create components/ComparisonPanel.tsx
[ ] Create components/VotingWidget.tsx (client)
[ ] Create components/ShareButtons.tsx
[ ] Create components/FunnySummary.tsx
[ ] Create components/Analytics.tsx
[ ] Create app/page.tsx (homepage)
[ ] Create app/compare/[topic]/page.tsx
[ ] Create app/sitemap.ts
[ ] Create app/layout.tsx (update with nav/footer)
[ ] Update next.config.ts
[ ] Test locally: npm run dev
[ ] Deploy to Railway: railway up
[ ] Set environment variables
[ ] Submit sitemap to Google Search Console
[ ] Marketing: X threads, Reddit, $100 ads
```

---

## 9. Cost Summary

| Item | Monthly | Notes |
|------|---------|-------|
| Railway | $5-10 | Hobby tier |
| Domain | ~$1 | $12/year |
| Wikipedia API | $0 | Free |
| Grokipedia API | $0 | Free unofficial |
| xAI fallback | $0-20 | Only if unofficial fails |
| **Total** | **~$6-30** | |

---

**Status: ✅ Claude Code Ready**

Next.js 15 App Router + hybrid API fallback + Railway. All code provided. Estimated build: 1-2 days.