-- Add normalized search_key column for fast slug lookups
-- This allows case-insensitive matching without slow ILIKE queries

-- Add search_key column
ALTER TABLE grokipedia_slugs
ADD COLUMN IF NOT EXISTS search_key TEXT;

-- Populate search_key from existing data
-- Normalize: lowercase, remove spaces and underscores
UPDATE grokipedia_slugs
SET search_key = LOWER(REPLACE(REPLACE(COALESCE(title, slug), ' ', ''), '_', ''))
WHERE search_key IS NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_grokipedia_slugs_search_key
ON grokipedia_slugs(search_key);

-- Create function to auto-update search_key
CREATE OR REPLACE FUNCTION update_grokipedia_search_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize title: lowercase, remove spaces and underscores
  NEW.search_key = LOWER(REPLACE(REPLACE(COALESCE(NEW.title, NEW.slug), ' ', ''), '_', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate search_key on insert/update
DROP TRIGGER IF EXISTS trg_update_grokipedia_search_key ON grokipedia_slugs;
CREATE TRIGGER trg_update_grokipedia_search_key
BEFORE INSERT OR UPDATE ON grokipedia_slugs
FOR EACH ROW
EXECUTE FUNCTION update_grokipedia_search_key();

-- Verify the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: search_key column added with index and trigger';
  RAISE NOTICE 'Total rows: %', (SELECT COUNT(*) FROM grokipedia_slugs);
  RAISE NOTICE 'Rows with search_key: %', (SELECT COUNT(*) FROM grokipedia_slugs WHERE search_key IS NOT NULL);
END $$;
