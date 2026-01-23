'use client';

import { useEffect, useState } from 'react';

interface DomainMetrics {
  backlinks: {
    total: number;
    referring_domains: number;
  };
  keywords: {
    total: number;
    organic_traffic_estimate: number;
    top_keywords: Array<{
      keyword: string;
      position: number;
      search_volume: number;
    }>;
  };
  technologies: string[];
  last_updated: string;
}

export default function DomainMetrics() {
  const [metrics, setMetrics] = useState<DomainMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/domain-metrics')
      .then((res) => res.json())
      .then((data) => {
        if (data.metrics) {
          setMetrics(data.metrics);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mb-12">
        <h2 className="mb-6 text-3xl font-bold text-gray-900">Domain Metrics</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-lg bg-gray-200"></div>
          <div className="h-32 rounded-lg bg-gray-200"></div>
          <div className="h-32 rounded-lg bg-gray-200"></div>
        </div>
      </section>
    );
  }

  if (error || !metrics) {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-3xl font-bold text-gray-900">Domain Metrics</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Backlinks */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Backlink Profile
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {metrics.backlinks.total.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Backlinks</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-800">
                {metrics.backlinks.referring_domains.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Referring Domains</p>
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Organic Keywords
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold text-green-600">
                {metrics.keywords.total.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Ranking Keywords</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-800">
                {metrics.keywords.organic_traffic_estimate.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Est. Monthly Traffic</p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 md:col-span-2 lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            {metrics.technologies.slice(0, 6).map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Top Keywords */}
        {metrics.keywords.top_keywords.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 md:col-span-2 lg:col-span-3">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Top Ranking Keywords
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-gray-500">
                  <tr>
                    <th className="pb-3">Keyword</th>
                    <th className="pb-3 text-center">Position</th>
                    <th className="pb-3 text-right">Search Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {metrics.keywords.top_keywords.map((kw, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-medium text-gray-900">{kw.keyword}</td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          #{kw.position}
                        </span>
                      </td>
                      <td className="py-3 text-right text-gray-600">
                        {kw.search_volume.toLocaleString()}/mo
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-gray-500">
        Data updated: {new Date(metrics.last_updated).toLocaleDateString()}
      </p>
    </section>
  );
}
