-- Backfill search_key for all existing rows using batched updates
-- This uses PostgreSQL's native batching to avoid timeouts

-- First, make sure the trigger function is fixed
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

-- Now update all rows in batches of 5000
-- This manually applies the normalization without relying on the trigger
DO $$
DECLARE
  batch_size INT := 5000;
  total_updated INT := 0;
  rows_updated INT;
BEGIN
  RAISE NOTICE 'Starting backfill of search_key column...';

  LOOP
    -- Update next batch using the same normalization logic as the trigger
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
         OR search_key != LOWER(
           regexp_replace(
             regexp_replace(
               COALESCE(title, slug),
               '\s+', '', 'g'
             ),
             '_', '', 'g'
           )
         )
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
