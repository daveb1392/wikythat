'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { LOGOS, LOGO_SIZES } from '@/lib/logos';

interface GrokVerdictProps {
  topic: string;
  wikipediaUrl: string;
  grokipediaUrl: string;
}

export default function GrokVerdict({
  topic,
  wikipediaUrl,
  grokipediaUrl,
}: GrokVerdictProps) {
  const [verdict, setVerdict] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchVerdict() {
      try {
        const response = await fetch('/api/grok-verdict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            wikipediaUrl,
            grokipediaUrl,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch verdict');
        }

        const data = await response.json();
        setVerdict(data.verdict);
      } catch (err) {
        console.error('Error fetching verdict:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchVerdict();
  }, [topic, wikipediaUrl, grokipediaUrl]);

  if (loading) {
    return (
      <div className="my-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-8 shadow-xl">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-purple-200 border-t-white"></div>
          <div className="text-center">
            <p className="mb-2 text-xl font-bold text-white">
              Grok is doing the magic...
            </p>
            <p className="text-sm text-purple-200">
              Reading both articles in full, analyzing biases, finding what Wikipedia won&apos;t tell you
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white delay-0"></div>
              <div className="h-2 w-2 animate-pulse rounded-full bg-white delay-75"></div>
              <div className="h-2 w-2 animate-pulse rounded-full bg-white delay-150"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 p-6 text-center">
        <p className="text-lg font-semibold italic text-gray-800">
          Wikipedia&apos;s playing it safe, Grok&apos;s bringing the spice 🌶️
        </p>
      </div>
    );
  }

  // Format text with bold patterns (don't match across newlines)
  const formatText = (text: string) => {
    // Remove word count if present
    const cleanedText = text.replace(/\(Word count:.*?\)/gi, '').trim();

    const parts = cleanedText.split(/(\*\*[^\n*]+?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <span key={idx} className="font-extrabold text-purple-700">
            {boldText}
          </span>
        );
      }
      return part;
    });
  };

  // Format paragraphs to handle headings and sections
  const formatParagraph = (text: string) => {
    const trimmed = text.trim();

    if (!trimmed) return null;

    // Check if it's a heading (starts with ###)
    if (trimmed.startsWith('###')) {
      const headingText = trimmed.replace(/^###\s*/, '');
      return (
        <h3 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-purple-200">
          {headingText}
        </h3>
      );
    }

    // Check if it's "**VERDICT:**" (markdown format)
    if (/^\*\*VERDICT:?\*\*$/i.test(trimmed)) {
      return (
        <div className="my-10 text-center">
          <div className="inline-block border-t-4 border-b-4 border-purple-600 py-4 px-16">
            <h4 className="text-4xl font-black text-purple-900 tracking-widest">
              VERDICT
            </h4>
          </div>
        </div>
      );
    }

    // Also support plain "VERDICT:" without markdown (fallback)
    if (/^VERDICT:?\s*$/i.test(trimmed)) {
      return (
        <div className="my-10 text-center">
          <div className="inline-block border-t-4 border-b-4 border-purple-600 py-4 px-16">
            <h4 className="text-4xl font-black text-purple-900 tracking-widest">
              VERDICT
            </h4>
          </div>
        </div>
      );
    }

    // Check if it's "Wikipedia says:" or "Grok says:"
    if (/^\*\*Wikipedia says:\*\*$/i.test(trimmed)) {
      return (
        <div className="mt-8 mb-4 flex items-center gap-3 pb-2 border-b-2 border-blue-200">
          <Image
            src={LOGOS.wikipedia.icon}
            alt="Wikipedia"
            width={LOGO_SIZES.icon.width}
            height={LOGO_SIZES.icon.height}
            className="object-contain"
          />
          <h4 className="text-2xl font-bold text-blue-700">Wikipedia says:</h4>
        </div>
      );
    }

    if (/^\*\*Grokipedia says:\*\*$/i.test(trimmed)) {
      return (
        <div className="mt-8 mb-4 flex items-center gap-3 pb-2 border-b-2 border-purple-200">
          <Image
            src={LOGOS.grokipedia.icon}
            alt="Grokipedia"
            width={LOGO_SIZES.icon.width}
            height={LOGO_SIZES.icon.height}
            className="object-contain"
          />
          <h4 className="text-2xl font-bold text-purple-700">Grokipedia says:</h4>
        </div>
      );
    }

    // Regular paragraph
    return (
      <p className="text-lg leading-relaxed mb-4 text-gray-800">
        {formatText(trimmed)}
      </p>
    );
  };

  return (
    <div className="my-8 rounded-lg border-2 border-purple-300 bg-white p-8 shadow-xl">
      <div className="text-gray-800">
        {verdict
          .replace(/\(Word count:.*?\)/gi, '')
          .replace(/\(\d+\s+words?\)/gi, '')
          .trim()
          .split('\n\n')
          .map((paragraph, i, arr) => {
            const formatted = formatParagraph(paragraph);
            // Check if previous paragraph was "VERDICT"
            const prevParagraph = i > 0 ? arr[i - 1].trim() : '';
            const isAfterVerdict =
              /^\*\*VERDICT:?\*\*$/i.test(prevParagraph) ||
              /^VERDICT:?\s*$/i.test(prevParagraph);

            if (formatted && isAfterVerdict && paragraph.trim() && !paragraph.includes('**')) {
              return (
                <div key={i} className="text-center my-6">
                  <p className="text-xl font-semibold italic text-gray-800">
                    {formatText(paragraph.trim())}
                  </p>
                </div>
              );
            }

            return formatted ? <div key={i}>{formatted}</div> : null;
          })}
      </div>
    </div>
  );
}
