-- Add normalized search_key column for fast slug lookups
-- This allows case-insensitive matching without slow ILIKE queries

-- Step 1: Add column (fast)
ALTER TABLE grokipedia_slugs
ADD COLUMN IF NOT EXISTS search_key TEXT;

-- Step 2: Create index CONCURRENTLY (won't block, takes longer but safer)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grokipedia_slugs_search_key
ON grokipedia_slugs(search_key);

-- Step 3: Create function to auto-update search_key
CREATE OR REPLACE FUNCTION update_grokipedia_search_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize title: lowercase, remove spaces and underscores
  NEW.search_key = LOWER(REPLACE(REPLACE(COALESCE(NEW.title, NEW.slug), ' ', ''), '_', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to auto-populate search_key on insert/update
DROP TRIGGER IF EXISTS trg_update_grokipedia_search_key ON grokipedia_slugs;
CREATE TRIGGER trg_update_grokipedia_search_key
BEFORE INSERT OR UPDATE ON grokipedia_slugs
FOR EACH ROW
EXECUTE FUNCTION update_grokipedia_search_key();

-- Note: Backfilling 3.3M rows will be done by the Python sync script
-- The trigger will handle new inserts automatically
