import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import { seedTopics } from '@/lib/seed-topics';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-bold">
          <span className="text-blue-600">Wikipedia</span> vs{' '}
          <span className="text-purple-600">Grokipedia</span>
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          Compare any topic side-by-side and see the difference
        </p>

        <div className="flex justify-center">
          <SearchBar />
        </div>
      </div>

      <section className="mt-16">
        <h2 className="mb-6 text-center text-2xl font-bold">
          Popular Comparisons
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {seedTopics.slice(0, 12).map((topic) => (
            <Link
              key={topic}
              href={`/compare/${encodeURIComponent(topic)}`}
              className="rounded-lg border border-gray-300 bg-white p-4 text-center font-semibold transition hover:border-blue-500 hover:shadow-md"
            >
              {topic}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 p-8">
        <h2 className="mb-4 text-center text-2xl font-bold">How It Works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-4xl">🔍</div>
            <h3 className="mb-2 font-semibold">Search</h3>
            <p className="text-gray-700">
              Enter any topic you want to compare
            </p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl">⚖️</div>
            <h3 className="mb-2 font-semibold">Compare</h3>
            <p className="text-gray-700">
              See Wikipedia and Grokipedia side-by-side
            </p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl">🗳️</div>
            <h3 className="mb-2 font-semibold">Vote</h3>
            <p className="text-gray-700">Share which source you trust more</p>
          </div>
        </div>
      </section>
    </main>
  );
}
