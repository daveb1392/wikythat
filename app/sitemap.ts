import type { MetadataRoute } from 'next';
import { seedTopics } from '@/lib/seed-topics';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
  ];

  const topicPages = seedTopics.map((topic) => ({
    url: `${baseUrl}/compare/${encodeURIComponent(topic)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...routes, ...topicPages];
}
