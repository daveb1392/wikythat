-- Domain metrics cache table
CREATE TABLE IF NOT EXISTS domain_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  metrics JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_domain_metrics_domain ON domain_metrics(domain);

-- Enable Row Level Security
ALTER TABLE domain_metrics ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON domain_metrics FOR SELECT USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role to insert" ON domain_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to update" ON domain_metrics FOR UPDATE USING (true);
