-- Domain valuations table
CREATE TABLE IF NOT EXISTS domain_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  valuation JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_domain_valuations_domain ON domain_valuations(domain);

-- Enable Row Level Security
ALTER TABLE domain_valuations ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON domain_valuations FOR SELECT USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role to insert" ON domain_valuations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to update" ON domain_valuations FOR UPDATE USING (true);
