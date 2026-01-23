import { vi } from 'vitest';

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.XAI_API_KEY = 'test-xai-key';
process.env.GROKIPEDIA_API_URL = 'http://localhost:8000';
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.DATAFORSEO_API_AUTH = 'test-auth';

// Global test utilities
global.fetch = vi.fn();
