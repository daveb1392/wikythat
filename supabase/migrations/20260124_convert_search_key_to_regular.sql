-- Convert search_key from GENERATED column to regular column so we can update it
-- Then backfill all existing rows

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

-- Step 6: Backfill all existing rows in batches
DO $$
DECLARE
  batch_size INT := 10000;
  total_updated INT := 0;
  rows_updated INT;
BEGIN
  RAISE NOTICE 'Starting backfill of search_key column...';

  LOOP
    -- Update next batch
    UPDATE grokipedia_slugs
    SET search_key = LOWER(
      regexp_replace(
        regexp_replace(
          COALESCE(title, slug),
          '\s+', '', 'g'
        ),
        '_', '', 'g'
      )
    )
    WHERE id IN (
      SELECT id
      FROM grokipedia_slugs
      WHERE search_key IS NULL
      LIMIT batch_size
    );

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    total_updated := total_updated + rows_updated;

    RAISE NOTICE 'Updated % rows (total: %)', rows_updated, total_updated;

    -- Exit when no more rows to update
    EXIT WHEN rows_updated = 0;

    -- Small delay to avoid overwhelming the database
    PERFORM pg_sleep(0.1);
  END LOOP;

  RAISE NOTICE 'Backfill complete! Total rows updated: %', total_updated;
END $$;
