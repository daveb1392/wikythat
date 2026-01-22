# Database Migrations

This directory contains SQL migration files for Supabase database schema.

## Migration Files

Migrations are numbered sequentially and should be applied in order:

- **001_initial_schema.sql** - Initial database schema with articles and comparisons tables
- **002_add_trust_votes.sql** - Trust votes feature to track which source users trust more
- **003_add_grokipedia_slugs.sql** - Slug cache for all 6M+ Grokipedia articles for fast search filtering

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content in order (001, 002, etc.)
4. Click **Run** to execute

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 3: Manual Execution

If you prefer to run the complete schema at once, you can use the main `supabase-schema.sql` file in the project root which contains all migrations combined.

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| 001 | 2025-01-22 | Initial schema with articles and comparisons |
| 002 | 2025-01-22 | Added trust votes table |
| 003 | 2025-01-22 | Added Grokipedia slugs cache (6M+ entries) and sync status tracking |

## Notes

- All tables have Row Level Security (RLS) enabled
- Public users can SELECT (read) from all tables
- Only the service role can INSERT/UPDATE
- All timestamps are in UTC
- Unique constraints prevent duplicate entries
