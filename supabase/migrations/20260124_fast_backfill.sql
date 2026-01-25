-- Fast backfill: disable trigger, update all rows in large batches, re-enable trigger
-- This is MUCH faster because the trigger doesn't fire during updates

-- Step 1: Disable the trigger temporarily
ALTER TABLE grokipedia_slugs DISABLE TRIGGER trg_update_grokipedia_search_key;

-- Step 2: Update ALL rows at once (no trigger overhead)
-- This updates the entire table in one statement
UPDATE grokipedia_slugs
SET search_key = LOWER(
  regexp_replace(
    regexp_replace(
      COALESCE(title, slug),
      '\s+', '', 'g'
    ),
    '_', '', 'g'
  )
);

-- Step 3: Re-enable the trigger for future inserts/updates
ALTER TABLE grokipedia_slugs ENABLE TRIGGER trg_update_grokipedia_search_key;

-- Verify
SELECT COUNT(*) as total_rows,
       COUNT(search_key) as rows_with_search_key
FROM grokipedia_slugs;
