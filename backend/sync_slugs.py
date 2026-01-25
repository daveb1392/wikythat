#!/usr/bin/env python3
"""
Sync Grokipedia Slugs Script

Fetches all 6M+ article slugs from Grokipedia's sitemap and stores them in Supabase.
Run this script periodically (daily/weekly) to keep the slug cache updated.

Usage:
    python backend/sync_slugs.py
"""

import os
import re
import sys
import time
import json
import requests
from urllib.parse import unquote
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")
GROKIPEDIA_BASE_URL = "https://assets.grokipedia.com/sitemap"

# Validate environment
if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing Supabase credentials")
    print("Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
    print(f"Debug: SUPABASE_URL = {SUPABASE_URL}")
    print(f"Debug: SUPABASE_KEY = {SUPABASE_KEY}")
    sys.exit(1)

# Debug: print loaded values
print(f"🔍 Loaded SUPABASE_URL: {SUPABASE_URL}")
print(f"🔍 Loaded SUPABASE_KEY: {SUPABASE_KEY[:20]}... (length: {len(SUPABASE_KEY) if SUPABASE_KEY else 0})")
print()

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class SitemapEntry:
    def __init__(self, slug: str, title: Optional[str], last_modified: Optional[str]):
        self.slug = slug
        self.title = title
        self.last_modified = last_modified

def fetch_sitemap_index() -> List[str]:
    """Fetch list of all sitemap URLs from the sitemap index."""
    print("📥 Fetching sitemap index...")

    url = f"{GROKIPEDIA_BASE_URL}/sitemap-index.xml"
    response = requests.get(url, timeout=30)

    if response.status_code != 200:
        raise Exception(f"Failed to fetch sitemap index: {response.status_code}")

    xml = response.text

    # Extract <loc> URLs
    sitemap_urls = re.findall(r'<loc>(.*?)</loc>', xml)

    print(f"✅ Found {len(sitemap_urls)} sitemap files\n")
    return sitemap_urls

def decode_slug(raw_slug: str) -> str:
    """Decode HTML entities and URL encoding from slug."""
    # Step 1: Decode HTML entities
    html_decoded = (
        raw_slug
        .replace('&quot;', '"')
        .replace('&apos;', "'")
        .replace('&amp;', '&')
        .replace('&lt;', '<')
        .replace('&gt;', '>')
    )

    # Step 2: Decode URL percent-encoding
    try:
        decoded = unquote(html_decoded)
        # Step 3: Ensure valid UTF-8 encoding
        return decoded.encode('utf-8', errors='ignore').decode('utf-8')
    except Exception:
        return html_decoded.encode('utf-8', errors='ignore').decode('utf-8')

def fetch_sitemap(sitemap_url: str) -> List[SitemapEntry]:
    """Fetch and parse a single sitemap XML file."""
    response = requests.get(sitemap_url, timeout=30)

    if response.status_code != 200:
        raise Exception(f"Failed to fetch sitemap: {response.status_code}")

    xml = response.text
    entries = []

    # Extract <url> blocks
    url_blocks = re.findall(r'<url>(.*?)</url>', xml, re.DOTALL)

    for block in url_blocks:
        loc_match = re.search(r'<loc>(.*?)</loc>', block)
        lastmod_match = re.search(r'<lastmod>(.*?)</lastmod>', block)

        if loc_match:
            full_url = loc_match.group(1)
            raw_slug = full_url.replace('https://grokipedia.com/page/', '')

            # Decode slug
            decoded_slug = decode_slug(raw_slug)

            # Convert slug to title (replace underscores with spaces)
            title = decoded_slug.replace('_', ' ')

            last_modified = lastmod_match.group(1) if lastmod_match else None

            entries.append(SitemapEntry(decoded_slug, title, last_modified))

    return entries

def batch_insert_slugs(
    slugs: List[SitemapEntry],
    batch_size: int = 100,
    delay_ms: int = 50
) -> Dict[str, any]:
    """Upsert slugs into Supabase in batches (database handles duplicates)."""
    total_upserted = 0
    total_failed = 0

    for i in range(0, len(slugs), batch_size):
        batch = slugs[i:i + batch_size]

        # Deduplicate within batch (keep last occurrence)
        unique_batch = {}
        for entry in batch:
            unique_batch[entry.slug] = entry
        batch = list(unique_batch.values())

        try:
            # Skip checking existing - just upsert everything
            # Database ON CONFLICT handles duplicates (no duplicates created)
            to_insert = batch

            # Upsert new/modified slugs - sanitize and validate each entry
            data = []
            for entry in to_insert:
                try:
                    # Sanitize strings: remove NULL bytes and non-printable characters
                    slug_clean = entry.slug.replace('\x00', '').strip()
                    title_clean = entry.title.replace('\x00', '').strip() if entry.title else None

                    # Skip if slug becomes empty after sanitization
                    if not slug_clean:
                        total_failed += 1
                        continue

                    # Generate normalized search_key for fast lookups
                    search_key = title_clean.lower().replace(' ', '').replace('_', '') if title_clean else slug_clean.lower().replace('_', '')

                    item = {
                        'slug': slug_clean,
                        'title': title_clean,
                        'search_key': search_key,
                        'last_modified': entry.last_modified,
                        'updated_at': datetime.utcnow().isoformat()
                    }

                    # Test JSON serialization
                    json.dumps(item)
                    data.append(item)

                except Exception as e:
                    # Skip entries that can't be serialized
                    print(f"   ⚠️  Skipping invalid entry: {repr(entry.slug[:100])}... ({e})")
                    total_failed += 1
                    continue

            if not data:
                continue

            try:
                supabase.table('grokipedia_slugs').upsert(data, on_conflict='slug').execute()
            except Exception as e:
                print(f"   ⚠️  Batch upsert failed: {e}")
                print(f"   🔍 Attempting single inserts for this batch...")

                # Try inserting one by one
                success_count = 0
                for item in data:
                    try:
                        supabase.table('grokipedia_slugs').upsert([item], on_conflict='slug').execute()
                        success_count += 1
                    except Exception as single_err:
                        print(f"      ✗ Failed: {repr(item['slug'][:80])}")
                        total_failed += 1

                total_upserted += success_count
                continue

            total_upserted += len(data)

            # Add delay between batches
            if delay_ms > 0:
                time.sleep(delay_ms / 1000.0)

        except Exception as err:
            print(f"   ⚠️  Batch insert error: {err}")
            return {'success': False, 'error': str(err), 'upserted': total_upserted, 'failed': total_failed}

    return {'success': True, 'upserted': total_upserted, 'failed': total_failed}

def main():
    """Main sync function."""
    print("🚀 Starting Grokipedia slug sync...\n")

    start_time = time.time()

    try:
        # Fetch all sitemap URLs
        sitemap_urls = fetch_sitemap_index()

        total_upserted = 0
        total_failed = 0
        processed_sitemaps = 0
        failed_sitemaps = []

        # Process each sitemap
        for sitemap_url in sitemap_urls:
            processed_sitemaps += 1
            print(f"\n📄 Processing sitemap {processed_sitemaps}/{len(sitemap_urls)}...")
            print(f"   {sitemap_url}")

            try:
                entries = fetch_sitemap(sitemap_url)
                print(f"   Found {len(entries)} entries")

                result = batch_insert_slugs(entries)

                if result['success']:
                    total_upserted += result['upserted']
                    total_failed += result['failed']
                    print(f"   ✅ Upserted {result['upserted']}, failed {result['failed']}")
                    print(f"   📊 Total: {total_upserted:,} upserted, {total_failed:,} failed")
                else:
                    print(f"   ⚠️  Failed to upsert, will retry later")
                    failed_sitemaps.append({'url': sitemap_url, 'entries': entries})

            except Exception as error:
                print(f"   ❌ Error processing sitemap: {error}")
                # Continue with next sitemap

            # Small delay between sitemaps
            time.sleep(0.1)

        # Retry failed sitemaps with slower rate
        if failed_sitemaps:
            print(f"\n🔄 Retrying {len(failed_sitemaps)} failed sitemaps with slower rate...\n")

            for i, failed in enumerate(failed_sitemaps):
                sitemap_url = failed['url']
                entries = failed['entries']
                print(f"\n📄 Retry {i + 1}/{len(failed_sitemaps)}: {sitemap_url}")
                print(f"   Found {len(entries)} entries (cached)")

                try:
                    # Use even smaller batch size (50) and longer delay (200ms) for retries
                    result = batch_insert_slugs(entries, batch_size=50, delay_ms=200)

                    if result['success']:
                        total_upserted += result['upserted']
                        total_failed += result['failed']
                        print(f"   ✅ Retry successful! Upserted {result['upserted']}, failed {result['failed']}")
                    else:
                        print(f"   ❌ Retry failed, skipping")

                except Exception as error:
                    print(f"   ❌ Error during retry: {error}")

        elapsed = time.time() - start_time

        print('\n✅ Sync completed!')
        print(f'📊 Total upserted: {total_upserted:,}')
        print(f'📊 Total failed: {total_failed:,}')
        print(f'📊 Total processed: {total_upserted + total_failed:,}')
        print(f'⏱️  Time elapsed: {elapsed / 60:.1f} minutes')

        if failed_sitemaps:
            print(f'⚠️  Some sitemaps may have failed. Check logs above.')

        if total_failed > 0:
            print(f'\n⚠️  Note: {total_failed:,} entries failed (likely invalid characters or duplicates)')

    except Exception as error:
        print(f'\n❌ Sync failed: {error}')
        sys.exit(1)

if __name__ == '__main__':
    main()
