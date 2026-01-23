import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/grok-verdict/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/rate-limit', () => ({
  ratelimit: {
    limit: vi.fn(),
  },
  getClientIdentifier: vi.fn(() => 'test-client-ip'),
}));

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

vi.mock('@/lib/sanitize', () => ({
  sanitizeInput: vi.fn((input: string) => input),
  validateUrl: vi.fn((url: string, domains: string[]) => {
    return domains.some(domain => url.includes(domain));
  }),
}));

describe('POST /api/grok-verdict', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: rate limit passes
    const { ratelimit } = require('@/lib/rate-limit');
    ratelimit.limit.mockResolvedValue({
      success: true,
      limit: 10,
      reset: Date.now() + 60000,
      remaining: 9,
    });
  });

  it('should return 429 when rate limited', async () => {
    const { ratelimit } = require('@/lib/rate-limit');
    ratelimit.limit.mockResolvedValue({
      success: false,
      limit: 10,
      reset: Date.now() + 60000,
      remaining: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/grok-verdict', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'Test Topic',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Test',
        grokipediaUrl: 'https://grokipedia.com/page/Test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Too many requests');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
  });

  it('should return 400 for invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/grok-verdict', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid JSON');
  });

  it('should return 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/grok-verdict', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'Test Topic',
        // Missing wikipediaUrl and grokipediaUrl
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 400 for invalid Wikipedia URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/grok-verdict', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'Test Topic',
        wikipediaUrl: 'https://evil.com/wiki/Test',
        grokipediaUrl: 'https://grokipedia.com/page/Test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid Wikipedia URL');
  });

  it('should return 400 for invalid Grokipedia URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/grok-verdict', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'Test Topic',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Test',
        grokipediaUrl: 'https://evil.com/page/Test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid Grokipedia URL');
  });

  it('should return cached verdict when available', async () => {
    const cachedVerdict = '### Test Verdict\n\nThis is a cached verdict.';

    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { verdict: cachedVerdict },
              error: null,
            })),
          })),
        })),
      })),
      upsert: vi.fn(),
    });

    const request = new NextRequest('http://localhost:3000/api/grok-verdict', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'Test Topic',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Test',
        grokipediaUrl: 'https://grokipedia.com/page/Test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.verdict).toBe(cachedVerdict);
    expect(response.headers.get('X-Cache')).toBe('HIT');
  });

  it('should generate new verdict when cache miss', async () => {
    const newVerdict = '### Test Verdict\n\nThis is a new verdict.';

    // Mock Grok API response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: newVerdict,
                },
              },
            ],
          }),
      } as Response)
    );

    const request = new NextRequest('http://localhost:3000/api/grok-verdict', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'Test Topic',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Test',
        grokipediaUrl: 'https://grokipedia.com/page/Test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.verdict).toBe(newVerdict);
    expect(response.headers.get('X-Cache')).toBe('MISS');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.x.ai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should return 500 when XAI_API_KEY is not configured', async () => {
    const originalApiKey = process.env.XAI_API_KEY;
    delete process.env.XAI_API_KEY;

    const request = new NextRequest('http://localhost:3000/api/grok-verdict', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'Test Topic',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Test',
        grokipediaUrl: 'https://grokipedia.com/page/Test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('XAI_API_KEY not configured');

    // Restore
    process.env.XAI_API_KEY = originalApiKey;
  });

  it('should handle Grok API errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)
    );

    const request = new NextRequest('http://localhost:3000/api/grok-verdict', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'Test Topic',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Test',
        grokipediaUrl: 'https://grokipedia.com/page/Test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate analysis. Please try again.');
  });

  it('should include security headers in response', async () => {
    const cachedVerdict = '### Test Verdict';

    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { verdict: cachedVerdict },
              error: null,
            })),
          })),
        })),
      })),
    });

    const request = new NextRequest('http://localhost:3000/api/grok-verdict', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'Test Topic',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Test',
        grokipediaUrl: 'https://grokipedia.com/page/Test',
      }),
    });

    const response = await POST(request);

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });
});
