#!/usr/bin/env python3
"""
Backfill search_key column for existing grokipedia_slugs rows.
Run this after the migration to populate search_key for all existing slugs.

Usage:
    python backend/backfill_search_key.py
"""

import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

BATCH_SIZE = 10000  # Fetch 10k rows per batch (balance between speed and reliability)

def normalize_text(text):
    """Normalize text: lowercase, remove spaces and underscores."""
    if not text:
        return ""
    return text.lower().replace(' ', '').replace('_', '')

def backfill_search_keys():
    """Backfill search_key for all rows using UUID cursor-based pagination."""
    print("🚀 Starting search_key backfill...\n")
    print(f"📊 Processing in batches of {BATCH_SIZE:,} rows\n")

    updated = 0
    processed = 0
    last_id = None
    max_retries = 3
    start_time = time.time()
    consecutive_complete_batches = 0  # Track batches with all rows already done

    while True:
        print(f"📄 Fetching batch of {BATCH_SIZE:,} rows...")

        # Fetch batch using cursor-based pagination (UUIDs can be compared)
        query = supabase.table('grokipedia_slugs')\
            .select('id, slug, title, search_key')\
            .order('id')\
            .limit(BATCH_SIZE)

        if last_id:
            query = query.gt('id', last_id)

        # Retry logic for network errors
        for retry in range(max_retries):
            try:
                result = query.execute()
                rows = result.data
                time.sleep(0.5)  # Small delay to avoid hammering the API
                break
            except Exception as e:
                if retry < max_retries - 1:
                    print(f"   ⚠️  Network error (retry {retry + 1}/{max_retries}): {str(e)[:100]}")
                    time.sleep(2 * (retry + 1))  # 2s, 4s, 6s backoff
                else:
                    print(f"   ❌ Failed after {max_retries} retries: {str(e)[:150]}")
                    rows = []
                    break

        if not rows:
            elapsed = time.time() - start_time
            print(f"\n✅ Backfill complete!")
            print(f"📊 Total processed: {processed:,} rows")
            print(f"📊 Total updated: {updated:,} rows")
            print(f"⏱️  Time: {elapsed / 60:.1f} minutes ({processed / elapsed:.0f} rows/sec)")
            break

        last_id = rows[-1]['id']
        processed += len(rows)
        print(f"   ✓ Fetched {len(rows):,} rows")

        # Collect rows that need updating
        rows_to_update = []
        for row in rows:
            # Calculate what the normalized search_key should be
            correct_search_key = normalize_text(row.get('title') or row.get('slug'))
            current_search_key = row.get('search_key')

            # Update if missing OR incorrect (e.g., still has spaces)
            if not current_search_key or current_search_key != correct_search_key:
                rows_to_update.append({
                    'id': row['id'],
                    'slug': row.get('slug', 'unknown'),
                    'search_key': correct_search_key
                })

        if not rows_to_update:
            print(f"   ✓ All rows in batch already normalized\n")
            consecutive_complete_batches += 1
            time.sleep(0.5)  # Shorter sleep when skipping
            continue

        # Reset counter when we find rows to update
        consecutive_complete_batches = 0

        print(f"   📝 Updating {len(rows_to_update):,} rows...")

        # Update rows using bulk upsert (much faster than individual updates)
        batch_updated = 0
        sub_batch_size = 1000  # Upsert 1000 rows at a time

        for i in range(0, len(rows_to_update), sub_batch_size):
            sub_batch = rows_to_update[i:i + sub_batch_size]

            # Prepare data for bulk upsert
            upsert_data = [{
                'id': item['id'],
                'slug': item['slug'],
                'search_key': item['search_key']
            } for item in sub_batch]

            # Bulk upsert (updates existing rows by id)
            for retry in range(max_retries):
                try:
                    supabase.table('grokipedia_slugs')\
                        .upsert(upsert_data, on_conflict='id')\
                        .execute()
                    batch_updated += len(sub_batch)
                    updated += len(sub_batch)
                    break
                except Exception as e:
                    if retry < max_retries - 1:
                        print(f"      ⚠️  Retry {retry + 1}/{max_retries} for sub-batch")
                        time.sleep(1)
                    else:
                        print(f"      ⚠️  Failed sub-batch: {str(e)[:100]}")

            # Progress update
            if (i + sub_batch_size) % 5000 == 0 or i + sub_batch_size >= len(rows_to_update):
                print(f"      ... {min(i + sub_batch_size, len(rows_to_update)):,}/{len(rows_to_update):,} updated")

        elapsed = time.time() - start_time
        rate = processed / elapsed if elapsed > 0 else 0
        eta_seconds = (3300000 - processed) / rate if rate > 0 else 0

        print(f"   ✅ Updated {batch_updated:,} rows")
        print(f"📊 Total: {processed:,} processed | {updated:,} updated | {rate:.0f} rows/sec | ETA: {eta_seconds / 60:.0f}m\n")

        # Sleep between batches to avoid rate limits
        time.sleep(1)

if __name__ == '__main__':
    backfill_search_keys()
