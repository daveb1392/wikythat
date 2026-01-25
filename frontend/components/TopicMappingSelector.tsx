'use client';

import { useState, useEffect } from 'react';

interface TopicMappingSelectorProps {
  wikipediaTopic: string;
  currentSlug?: string;
  onSelect: (slug: string) => void;
}

interface GrokipediaResult {
  slug: string;
  title: string;
}

export default function TopicMappingSelector({
  wikipediaTopic,
  currentSlug,
  onSelect,
}: TopicMappingSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GrokipediaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search for Grokipedia topics
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/topic-mapping?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Error searching topics:', error);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Save mapping
  const handleSelect = async (slug: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/topic-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wikipediaTopic,
          grokipediaSlug: slug,
        }),
      });

      if (response.ok) {
        onSelect(slug);
        setIsOpen(false);
        setQuery('');
      } else {
        alert('Failed to save mapping. Please try again.');
      }
    } catch (error) {
      console.error('Error saving mapping:', error);
      alert('Failed to save mapping. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 font-medium rounded-lg hover:bg-blue-50 hover:border-blue-600 transition-all shadow-sm hover:shadow"
      >
        {currentSlug ? (
          <>
            <span>🔄</span>
            <span>Change Grokipedia match</span>
          </>
        ) : (
          <>
            <span>🔍</span>
            <span>Select correct Grokipedia topic</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Select Grokipedia Topic</h3>
          <p className="text-sm text-gray-600 mt-1">
            Wikipedia topic: <span className="font-medium">{wikipediaTopic}</span>
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Grokipedia topics..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center text-gray-500 py-8">Searching...</div>
          )}

          {!loading && query.length < 2 && (
            <div className="text-center text-gray-500 py-8">
              Type at least 2 characters to search
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center text-gray-500 py-8">No results found</div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={result.slug}
                  onClick={() => handleSelect(result.slug)}
                  disabled={saving}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium">{result.title || result.slug}</div>
                  <div className="text-sm text-gray-500">{result.slug}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={() => {
              setIsOpen(false);
              setQuery('');
            }}
            disabled={saving}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
