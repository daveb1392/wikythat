-- Migration: 002_add_trust_votes
-- Description: Add trust votes table to track which source users trust more
-- Date: 2025-01-22

-- Trust votes table
CREATE TABLE IF NOT EXISTS trust_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('wikipedia', 'grokipedia')),
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic, source)
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_trust_votes_topic ON trust_votes(topic);

-- Enable Row Level Security
ALTER TABLE trust_votes ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON trust_votes FOR SELECT USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role to insert" ON trust_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to update" ON trust_votes FOR UPDATE USING (true);
