-- Migration: 003_add_grokipedia_slugs
-- Description: Add table to cache all 6M+ Grokipedia article slugs for fast lookup
-- Date: 2025-01-22

-- Grokipedia slugs cache table
CREATE TABLE IF NOT EXISTS grokipedia_slugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT,
  last_modified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_grokipedia_slugs_slug ON grokipedia_slugs(slug);
CREATE INDEX IF NOT EXISTS idx_grokipedia_slugs_title ON grokipedia_slugs USING gin(to_tsvector('english', title));

-- Enable Row Level Security
ALTER TABLE grokipedia_slugs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for checking if slug exists)
CREATE POLICY "Allow public read access" ON grokipedia_slugs FOR SELECT USING (true);

-- Allow service role to insert/update (for syncing slugs)
CREATE POLICY "Allow service role to insert" ON grokipedia_slugs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to update" ON grokipedia_slugs FOR UPDATE USING (true);
CREATE POLICY "Allow service role to delete" ON grokipedia_slugs FOR DELETE USING (true);

-- Create a metadata table to track sync status
CREATE TABLE IF NOT EXISTS grokipedia_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_slugs INTEGER NOT NULL DEFAULT 0,
  last_sync_started TIMESTAMP WITH TIME ZONE,
  last_sync_completed TIMESTAMP WITH TIME ZONE,
  sync_status TEXT CHECK (sync_status IN ('idle', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sync status table
ALTER TABLE grokipedia_sync_status ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON grokipedia_sync_status FOR SELECT USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role to insert" ON grokipedia_sync_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to update" ON grokipedia_sync_status FOR UPDATE USING (true);

-- Insert initial sync status record
INSERT INTO grokipedia_sync_status (sync_status) VALUES ('idle');
