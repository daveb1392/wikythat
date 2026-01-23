import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../app/api/domain-metrics/route';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

describe('GET /api/domain-metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached metrics when available', async () => {
    const cachedMetrics = {
      backlinks: {
        total: 1250,
        referring_domains: 180,
      },
      keywords: {
        total: 45,
        organic_traffic_estimate: 2500,
        top_keywords: [
          { keyword: 'test keyword', position: 1, search_volume: 320 },
        ],
      },
      technologies: ['Next.js', 'React'],
      last_updated: new Date().toISOString(),
    };

    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { metrics: cachedMetrics },
              error: null,
            })),
          })),
        })),
      })),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metrics).toEqual(cachedMetrics);
    expect(data.cached).toBe(true);
  });

  it('should return mock data when DATAFORSEO_API_AUTH is not set', async () => {
    const originalAuth = process.env.DATAFORSEO_API_AUTH;
    delete process.env.DATAFORSEO_API_AUTH;

    // No cache
    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mock).toBe(true);
    expect(data.metrics).toHaveProperty('backlinks');
    expect(data.metrics).toHaveProperty('keywords');
    expect(data.metrics).toHaveProperty('technologies');

    // Restore
    if (originalAuth) {
      process.env.DATAFORSEO_API_AUTH = originalAuth;
    }
  });

  it('should fetch fresh metrics from DataForSEO when cache miss', async () => {
    process.env.DATAFORSEO_API_AUTH = 'test-auth';

    // No cache
    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    });

    // Mock DataForSEO API responses
    global.fetch = vi.fn((url: string) => {
      if (url.includes('backlinks/summary/live')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tasks: [
                {
                  result: [
                    {
                      backlinks: 1500,
                      referring_domains: 200,
                    },
                  ],
                },
              ],
            }),
        } as Response);
      }
      if (url.includes('domain_technologies/live')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tasks: [
                {
                  result: [
                    {
                      technologies: [{ name: 'Next.js' }, { name: 'React' }],
                    },
                  ],
                },
              ],
            }),
        } as Response);
      }
      if (url.includes('ranked_keywords/live')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tasks: [
                {
                  result: [
                    {
                      metrics: {
                        organic: {
                          count: 50,
                          etv: 3000,
                        },
                      },
                      items: [
                        {
                          keyword_data: {
                            keyword: 'test',
                            keyword_info: { search_volume: 500 },
                          },
                          ranked_serp_element: {
                            serp_item: { rank_absolute: 1 },
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cached).toBe(false);
    expect(data.metrics.backlinks.total).toBe(1500);
    expect(data.metrics.keywords.total).toBe(50);
    expect(data.metrics.technologies).toContain('Next.js');
  });

  it('should handle DataForSEO API errors gracefully', async () => {
    process.env.DATAFORSEO_API_AUTH = 'test-auth';

    // No cache
    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
    });

    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch domain metrics');
  });

  it('should handle missing nested data from DataForSEO', async () => {
    process.env.DATAFORSEO_API_AUTH = 'test-auth';

    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    });

    // Mock with missing nested data
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            tasks: [
              {
                result: [{}], // Empty result
              },
            ],
          }),
      } as Response)
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metrics.backlinks.total).toBe(0);
    expect(data.metrics.keywords.total).toBe(0);
    expect(data.metrics.technologies).toEqual([]);
  });

  it('should properly handle technologies not being an array', async () => {
    process.env.DATAFORSEO_API_AUTH = 'test-auth';

    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    });

    global.fetch = vi.fn((url: string) => {
      if (url.includes('domain_technologies/live')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tasks: [
                {
                  result: [
                    {
                      technologies: null, // Not an array
                    },
                  ],
                },
              ],
            }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tasks: [{ result: [{}] }] }),
      } as Response);
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metrics.technologies).toEqual([]);
  });
});
