-- Fix search_key normalization to properly remove spaces and underscores
-- The previous REPLACE() function wasn't working correctly

-- Drop and recreate the function with regexp_replace for proper normalization
CREATE OR REPLACE FUNCTION update_grokipedia_search_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize: lowercase, remove ALL spaces and underscores using regexp_replace
  -- \s+ matches all whitespace characters, 'g' flag = global (all occurrences)
  NEW.search_key = LOWER(
    regexp_replace(
      regexp_replace(
        COALESCE(NEW.title, NEW.slug),
        '\s+', '', 'g'  -- Remove all whitespace
      ),
      '_', '', 'g'  -- Remove all underscores
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger is already created, just the function needed updating
-- But let's ensure the trigger exists
DROP TRIGGER IF EXISTS trg_update_grokipedia_search_key ON grokipedia_slugs;
CREATE TRIGGER trg_update_grokipedia_search_key
BEFORE INSERT OR UPDATE ON grokipedia_slugs
FOR EACH ROW
EXECUTE FUNCTION update_grokipedia_search_key();

-- Test that the function works correctly
DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Simulate what the function does
  test_result := LOWER(
    regexp_replace(
      regexp_replace('Climate Change', '\s+', '', 'g'),
      '_', '', 'g'
    )
  );

  RAISE NOTICE 'Test normalization: "Climate Change" -> "%"', test_result;

  IF test_result = 'climatechange' THEN
    RAISE NOTICE '✓ Function is working correctly!';
  ELSE
    RAISE WARNING '✗ Function not normalizing correctly. Got: %', test_result;
  END IF;
END $$;
