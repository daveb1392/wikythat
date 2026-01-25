import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CachedArticle {
  id?: string;
  topic: string;
  source: 'wikipedia' | 'grokipedia';
  title: string;
  extract: string;
  thumbnail_url?: string;
  url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CachedComparison {
  id?: string;
  topic: string;
  verdict: string;
  created_at?: string;
}

export interface TopicMapping {
  id?: string;
  wikipedia_topic: string;
  grokipedia_slug: string;
  vote_count: number;
  created_at?: string;
  updated_at?: string;
}
