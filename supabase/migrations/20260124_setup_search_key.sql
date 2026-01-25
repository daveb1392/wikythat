-- Convert search_key from GENERATED column to regular column
-- This allows us to update it via Python script or other methods

-- Step 1: Drop the existing generated column
ALTER TABLE grokipedia_slugs DROP COLUMN IF EXISTS search_key;

-- Step 2: Add it back as a regular column
ALTER TABLE grokipedia_slugs ADD COLUMN search_key TEXT;

-- Step 3: Create the index
CREATE INDEX IF NOT EXISTS idx_grokipedia_slugs_search_key
ON grokipedia_slugs(search_key);

-- Step 4: Create the trigger function to auto-populate for NEW rows
CREATE OR REPLACE FUNCTION update_grokipedia_search_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize: lowercase, remove ALL spaces and underscores
  NEW.search_key = LOWER(
    regexp_replace(
      regexp_replace(
        COALESCE(NEW.title, NEW.slug),
        '\s+', '', 'g'
      ),
      '_', '', 'g'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger
DROP TRIGGER IF EXISTS trg_update_grokipedia_search_key ON grokipedia_slugs;
CREATE TRIGGER trg_update_grokipedia_search_key
BEFORE INSERT OR UPDATE ON grokipedia_slugs
FOR EACH ROW
EXECUTE FUNCTION update_grokipedia_search_key();

-- Done! Now run the Python backfill script to populate existing rows
