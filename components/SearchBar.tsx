'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        // Fetch Wikipedia suggestions
        const wikiResponse = await fetch(`/api/search-wikipedia?q=${encodeURIComponent(query)}`);
        const wikiResults = await wikiResponse.json();

        if (wikiResults.length === 0) {
          setSuggestions([]);
          setIsLoading(false);
          return;
        }

        // Convert Wikipedia titles to Grokipedia slugs
        const slugs = wikiResults.map((title: string) => title.replace(/\s+/g, '_'));

        // Batch check if slugs exist in Grokipedia
        const slugCheckResponse = await fetch('/api/check-grokipedia-slug', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs }),
        });

        const slugCheckData = await slugCheckResponse.json();

        // Filter to only show results where both Wikipedia and Grokipedia have the article
        const filteredResults = wikiResults.filter((_: string, index: number) => {
          return slugCheckData.results[index]?.exists === true;
        });

        setSuggestions(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const searchTopic = selectedIndex >= 0 ? suggestions[selectedIndex] : query;
      setIsNavigating(true); // Show loading modal
      router.push(`/compare/${encodeURIComponent(searchTopic)}`);
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setIsNavigating(true); // Show loading modal
    router.push(`/compare/${encodeURIComponent(suggestion)}`);
    setSuggestions([]);
  };

  return (
    <div className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search any topic..."
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Compare
          </button>
        </div>
      </form>

      {suggestions.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-300 bg-white shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-blue-100' : ''
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {isLoading && suggestions.length === 0 && query.length >= 2 && (
        <div className="absolute right-24 top-1/2 -translate-y-1/2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}

      {/* Loading Modal - only show when navigating */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-8 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <div className="text-center">
                <p className="mb-1 text-xl font-bold text-gray-900">
                  Loading comparison...
                </p>
                <p className="text-sm text-gray-600">
                  Fetching {query} from Wikipedia & Grokipedia
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
