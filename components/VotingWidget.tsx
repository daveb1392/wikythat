'use client';

import { useState, useEffect } from 'react';

interface VotingWidgetProps {
  topic: string;
}

interface VoteData {
  wikipedia: number;
  grokipedia: number;
  userVote: 'wikipedia' | 'grokipedia' | null;
}

export default function VotingWidget({ topic }: VotingWidgetProps) {
  const [votes, setVotes] = useState<VoteData>({
    wikipedia: 0,
    grokipedia: 0,
    userVote: null,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load votes from localStorage
    const storageKey = `votes_${topic}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setVotes(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse votes:', e);
      }
    }
  }, [topic]);

  const handleVote = (source: 'wikipedia' | 'grokipedia') => {
    if (votes.userVote) return; // Already voted

    const newVotes = {
      ...votes,
      [source]: votes[source] + 1,
      userVote: source,
    };

    setVotes(newVotes);
    localStorage.setItem(`votes_${topic}`, JSON.stringify(newVotes));
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  const totalVotes = votes.wikipedia + votes.grokipedia;
  const wikiPercent =
    totalVotes > 0 ? Math.round((votes.wikipedia / totalVotes) * 100) : 0;
  const grokPercent =
    totalVotes > 0 ? Math.round((votes.grokipedia / totalVotes) * 100) : 0;

  return (
    <div className="my-8 rounded-lg bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-center text-xl font-bold">
        Which source do you trust more?
      </h3>

      <div className="flex gap-4">
        <button
          onClick={() => handleVote('wikipedia')}
          disabled={!!votes.userVote}
          className={`flex-1 rounded-lg border-2 p-4 transition ${
            votes.userVote === 'wikipedia'
              ? 'border-blue-500 bg-blue-100'
              : votes.userVote
                ? 'cursor-not-allowed border-gray-300 bg-gray-100'
                : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
          }`}
        >
          <div className="text-lg font-semibold">Wikipedia</div>
          {totalVotes > 0 && (
            <div className="mt-2">
              <div className="mb-1 h-2 w-full rounded bg-gray-200">
                <div
                  className="h-2 rounded bg-blue-600"
                  style={{ width: `${wikiPercent}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">
                {votes.wikipedia} votes ({wikiPercent}%)
              </div>
            </div>
          )}
        </button>

        <button
          onClick={() => handleVote('grokipedia')}
          disabled={!!votes.userVote}
          className={`flex-1 rounded-lg border-2 p-4 transition ${
            votes.userVote === 'grokipedia'
              ? 'border-purple-500 bg-purple-100'
              : votes.userVote
                ? 'cursor-not-allowed border-gray-300 bg-gray-100'
                : 'border-purple-300 bg-purple-50 hover:bg-purple-100'
          }`}
        >
          <div className="text-lg font-semibold">Grokipedia</div>
          {totalVotes > 0 && (
            <div className="mt-2">
              <div className="mb-1 h-2 w-full rounded bg-gray-200">
                <div
                  className="h-2 rounded bg-purple-600"
                  style={{ width: `${grokPercent}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">
                {votes.grokipedia} votes ({grokPercent}%)
              </div>
            </div>
          )}
        </button>
      </div>

      {votes.userVote && (
        <p className="mt-4 text-center text-sm text-gray-600">
          Thanks for voting! Your preference has been recorded.
        </p>
      )}
    </div>
  );
}
