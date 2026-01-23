'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { LOGOS, LOGO_SIZES } from '@/lib/logos';

interface TrustCounterProps {
  topic: string;
}

export default function TrustCounter({ topic }: TrustCounterProps) {
  const [votes, setVotes] = useState({ wikipedia: 0, grokipedia: 0 });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const fetchVotes = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/trust-vote?topic=${encodeURIComponent(topic)}`
      );
      if (response.ok) {
        const data = await response.json();
        setVotes(data);
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    } finally {
      setLoading(false);
    }
  }, [topic]);

  useEffect(() => {
    // Check if user has already voted for this topic
    const votedTopics = JSON.parse(
      localStorage.getItem('voted_topics') || '{}'
    );
    if (votedTopics[topic]) {
      setHasVoted(true);
    }

    // Fetch current vote counts
    fetchVotes();
  }, [topic, fetchVotes]);

  const handleVote = async (source: 'wikipedia' | 'grokipedia') => {
    if (hasVoted || voting) return;

    setVoting(true);
    try {
      const response = await fetch('/api/trust-vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, source }),
      });

      if (response.ok) {
        // Update local vote count
        setVotes((prev) => ({
          ...prev,
          [source]: prev[source] + 1,
        }));

        // Mark as voted in localStorage
        const votedTopics = JSON.parse(
          localStorage.getItem('voted_topics') || '{}'
        );
        votedTopics[topic] = source;
        localStorage.setItem('voted_topics', JSON.stringify(votedTopics));
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  const totalVotes = votes.wikipedia + votes.grokipedia;
  const wikipediaPercent =
    totalVotes > 0 ? Math.round((votes.wikipedia / totalVotes) * 100) : 0;
  const grokipediaPercent =
    totalVotes > 0 ? Math.round((votes.grokipedia / totalVotes) * 100) : 0;

  if (loading) {
    return (
      <div className="my-8 rounded-lg border-2 border-gray-300 bg-white p-6">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8 rounded-lg border-2 border-gray-300 bg-white p-8 shadow-lg">
      <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">
        Which source do you trust more?
      </h3>

      {hasVoted && (
        <p className="mb-4 text-center text-sm text-green-600 font-semibold">
          ✓ Thanks for voting! Here are the results:
        </p>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {/* Wikipedia Button */}
        <button
          onClick={() => handleVote('wikipedia')}
          disabled={hasVoted || voting}
          className={`group relative overflow-hidden rounded-lg border-2 p-6 transition-all ${
            hasVoted
              ? 'cursor-not-allowed border-gray-300 bg-gray-50'
              : 'border-blue-500 bg-blue-50 hover:bg-blue-100 hover:shadow-lg'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center">
              <Image
                src={LOGOS.wikipedia.icon}
                alt="Wikipedia"
                width={LOGO_SIZES.icon.width}
                height={LOGO_SIZES.icon.height}
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-blue-900">Wikipedia</span>
            <div className="w-full">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-blue-700">
                  {votes.wikipedia} votes
                </span>
                <span className="font-bold text-blue-900">
                  {wikipediaPercent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${wikipediaPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </button>

        {/* Grokipedia Button */}
        <button
          onClick={() => handleVote('grokipedia')}
          disabled={hasVoted || voting}
          className={`group relative overflow-hidden rounded-lg border-2 p-6 transition-all ${
            hasVoted
              ? 'cursor-not-allowed border-gray-300 bg-gray-50'
              : 'border-purple-500 bg-purple-50 hover:bg-purple-100 hover:shadow-lg'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center">
              <Image
                src={LOGOS.grokipedia.icon}
                alt="Grokipedia"
                width={LOGO_SIZES.icon.width}
                height={LOGO_SIZES.icon.height}
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-purple-900">
              Grokipedia
            </span>
            <div className="w-full">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-purple-700">
                  {votes.grokipedia} votes
                </span>
                <span className="font-bold text-purple-900">
                  {grokipediaPercent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-purple-200">
                <div
                  className="h-full bg-purple-600 transition-all duration-500"
                  style={{ width: `${grokipediaPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </button>
      </div>

      {totalVotes > 0 && (
        <p className="text-center text-sm text-gray-600">
          Total votes: {totalVotes.toLocaleString()}
        </p>
      )}
    </div>
  );
}
