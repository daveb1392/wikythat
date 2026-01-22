-- Migration: 001_initial_schema
-- Description: Initial schema with articles and comparisons tables
-- Date: 2025-01-22

-- Articles cache table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('wikipedia', 'grokipedia')),
  title TEXT NOT NULL,
  extract TEXT NOT NULL,
  thumbnail_url TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic, source)
);

-- Comparisons cache table
CREATE TABLE IF NOT EXISTS comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL UNIQUE,
  verdict TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_comparisons_topic ON comparisons(topic);

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON articles FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON comparisons FOR SELECT USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role to insert" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to update" ON articles FOR UPDATE USING (true);
CREATE POLICY "Allow service role to insert" ON comparisons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to update" ON comparisons FOR UPDATE USING (true);
