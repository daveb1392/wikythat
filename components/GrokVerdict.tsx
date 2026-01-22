'use client';

import { useEffect, useState } from 'react';

interface GrokVerdictProps {
  topic: string;
  wikipediaExtract: string;
  grokipediaExtract: string;
}

export default function GrokVerdict({
  topic,
  wikipediaExtract,
  grokipediaExtract,
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
            wikipediaExtract,
            grokipediaExtract,
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
  }, [topic, wikipediaExtract, grokipediaExtract]);

  if (loading) {
    return (
      <div className="my-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-8 shadow-xl">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-white"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              🤖
            </div>
          </div>
          <div className="text-center">
            <p className="mb-2 text-xl font-bold text-white">
              Grok is doing the magic...
            </p>
            <p className="text-sm text-purple-200">
              Reading both articles in full, analyzing biases, finding what Wikipedia won't tell you
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
          Wikipedia's playing it safe, Grok's bringing the spice 🌶️
        </p>
      </div>
    );
  }

  // Format text with bold patterns
  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <span key={idx} className="font-extrabold text-purple-700">
            "{boldText}"
          </span>
        );
      }
      return part;
    });
  };

  // Format paragraphs to handle headings and sections
  const formatParagraph = (text: string) => {
    // Check if it's a heading (starts with ###)
    if (text.startsWith('###')) {
      const headingText = text.replace(/^###\s*/, '');
      return (
        <h3 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gray-200">
          {headingText}
        </h3>
      );
    }

    // Check if it's "VERDICT:" (case insensitive, on its own line)
    if (/^VERDICT:\s*$/i.test(text.trim())) {
      return (
        <div className="my-6 text-center">
          <div className="inline-block border-t-2 border-b-2 border-purple-600 py-2 px-8">
            <h4 className="text-2xl font-black text-purple-900 tracking-wider">
              VERDICT
            </h4>
          </div>
        </div>
      );
    }

    // Check if it's "Wikipedia says:" or "Grok says:"
    if (/^\*\*Wikipedia says:\*\*$/i.test(text.trim())) {
      return (
        <div className="mt-6 mb-3 flex items-center gap-3">
          <span className="text-2xl">📚</span>
          <h4 className="text-xl font-bold text-blue-700">Wikipedia says:</h4>
        </div>
      );
    }

    if (/^\*\*Grok says:\*\*$/i.test(text.trim())) {
      return (
        <div className="mt-6 mb-3 flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <h4 className="text-xl font-bold text-purple-700">Grok says:</h4>
        </div>
      );
    }

    // Regular paragraph
    return (
      <p className="text-lg leading-loose">
        {formatText(text)}
      </p>
    );
  };

  return (
    <div className="my-8 rounded-lg border-2 border-purple-300 bg-white p-8 shadow-xl">
      <div className="mb-6 text-center">
        <div className="mb-2 text-3xl">🤖</div>
        <h3 className="text-2xl font-bold text-gray-900">Grok's Analysis</h3>
        <p className="text-sm text-gray-600">AI-powered comparison</p>
      </div>

      <div className="space-y-6 text-gray-800">
        {verdict.split('\n\n').map((paragraph, i) => (
          <div key={i}>
            {formatParagraph(paragraph)}
          </div>
        ))}
      </div>
    </div>
  );
}
