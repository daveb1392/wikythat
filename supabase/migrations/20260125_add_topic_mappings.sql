-- Create table to store user-curated Wikipedia → Grokipedia topic mappings
-- This allows users to correct mismatches and improves future lookups

CREATE TABLE IF NOT EXISTS topic_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wikipedia_topic TEXT NOT NULL,
  grokipedia_slug TEXT NOT NULL,
  vote_count INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one mapping per Wikipedia topic (most voted wins)
  UNIQUE(wikipedia_topic)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_topic_mappings_wikipedia_topic
ON topic_mappings(wikipedia_topic);

-- Enable Row Level Security
ALTER TABLE topic_mappings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read mappings
CREATE POLICY "Anyone can read topic mappings"
ON topic_mappings FOR SELECT
TO public
USING (true);

-- Allow anyone to insert/update mappings (voting system)
CREATE POLICY "Anyone can create/update topic mappings"
ON topic_mappings FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE topic_mappings IS 'User-curated mappings between Wikipedia topics and Grokipedia slugs';
