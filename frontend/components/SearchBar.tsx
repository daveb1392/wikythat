'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/slugify';

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
        // Fetch Wikipedia suggestions - show all results
        // Grokipedia availability will be checked on the comparison page
        const wikiResponse = await fetch(`/api/search-wikipedia?q=${encodeURIComponent(query)}`);
        const wikiResults = await wikiResponse.json();

        setSuggestions(wikiResults);
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

    // Only allow navigation if a suggestion is selected OR there are suggestions (auto-select first)
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      // User selected a suggestion with arrow keys
      const searchTopic = suggestions[selectedIndex];
      setIsNavigating(true);
      router.push(`/compare/${slugify(searchTopic)}`);
      setSuggestions([]);
    } else if (suggestions.length > 0) {
      // Auto-select first suggestion when user presses Enter
      const searchTopic = suggestions[0];
      setIsNavigating(true);
      router.push(`/compare/${slugify(searchTopic)}`);
      setSuggestions([]);
    }
    // If no suggestions, do nothing (prevents navigation to invalid topics)
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
    router.push(`/compare/${slugify(suggestion)}`);
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
            placeholder="Search any topic (select from suggestions)..."
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

      {/* No results message */}
      {!isLoading && suggestions.length === 0 && query.length >= 2 && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-yellow-300 bg-yellow-50 p-4 shadow-lg">
          <p className="text-sm text-yellow-800">
            <strong>No matches found.</strong> Try a different search term.
          </p>
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
