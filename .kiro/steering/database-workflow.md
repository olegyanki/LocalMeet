# Database Workflow & Best Practices

## Overview

This project uses Supabase (PostgreSQL) with a migration-based workflow. All database changes MUST be done through migrations, not through the Supabase Dashboard UI.

## Core Principles

1. **Migrations First** - All schema changes go through migration files
2. **Type Safety** - TypeScript types are generated from database schema
3. **Version Control** - All migrations and types are committed to Git
4. **Code Review** - Database changes are reviewed like code changes
5. **Reproducibility** - Same migrations work on local, staging, and production

## File Structure

```
supabase/migrations/          # Migration files (timestamped)
src/shared/lib/
├── database.types.ts         # Auto-generated TypeScript types
├── supabase.ts              # Supabase client configuration
└── api.ts                   # API functions using typed queries
```

## Migration Workflow

### Step 1: Create Migration File

```bash
npx supabase migration new descriptive_name
```

Creates: `supabase/migrations/TIMESTAMP_descriptive_name.sql`

### Step 2: Write SQL

```sql
-- supabase/migrations/20260308123456_add_phone_to_profiles.sql
ALTER TABLE profiles ADD COLUMN phone TEXT;
CREATE INDEX idx_profiles_phone ON profiles(phone);
COMMENT ON COLUMN profiles.phone IS 'User phone number';
```

### Step 3: Apply Migration

```bash
# Using CLI
npx supabase db push

# Using MCP Tool (preferred in Kiro)
mcp_supabase_apply_migration({
  name: 'add_phone_to_profiles',
  query: '-- SQL content'
})
```

### Step 4: Generate TypeScript Types

```bash
npx supabase gen types typescript --local > src/shared/lib/database.types.ts
```

**CRITICAL**: This is NOT automatic. Run after every migration.

### Step 5: Update API Functions

```typescript
// src/shared/lib/api.ts
export interface UserProfile {
  phone: string | null;  // ← New field automatically typed
  // ...
}
```

### Step 6: Commit to Git

```bash
git add supabase/migrations/20260308123456_add_phone_to_profiles.sql
git add src/shared/lib/database.types.ts
git commit -m "Add phone column to profiles"
```

## Common Migration Patterns

### Adding Columns

```sql
-- Nullable column (safe)
ALTER TABLE profiles ADD COLUMN phone TEXT;

-- With default value
ALTER TABLE profiles ADD COLUMN verified BOOLEAN DEFAULT false NOT NULL;

-- With constraint
ALTER TABLE profiles ADD COLUMN email TEXT UNIQUE;
```

### Modifying Columns

```sql
-- Change type
ALTER TABLE profiles ALTER COLUMN age TYPE INTEGER USING age::INTEGER;

-- Add NOT NULL (ensure no nulls first)
UPDATE profiles SET phone = '' WHERE phone IS NULL;
ALTER TABLE profiles ALTER COLUMN phone SET NOT NULL;
```

### Creating Indexes

```sql
-- Simple index
CREATE INDEX idx_profiles_username ON profiles(username);

-- Composite index
CREATE INDEX idx_walks_user_time ON walks(user_id, start_time);

-- Partial index
CREATE INDEX idx_walks_active ON walks(start_time) WHERE deleted = false;

-- GiST index for geospatial
CREATE INDEX idx_walks_location ON walks USING gist(ll_to_earth(latitude, longitude));
```

For more patterns, see: [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

### Creating RPC Functions

```sql
CREATE OR REPLACE FUNCTION get_nearby_walks(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION
)
RETURNS TABLE (id UUID, title TEXT, distance DOUBLE PRECISION) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'  -- CRITICAL: Always set this
AS $$
BEGIN
  RETURN QUERY
  SELECT w.id, w.title,
    earth_distance(
      ll_to_earth(p_latitude, p_longitude),
      ll_to_earth(w.latitude, w.longitude)
    ) / 1000.0 AS distance
  FROM walks w
  WHERE earth_box(ll_to_earth(p_latitude, p_longitude), p_radius_km * 1000) 
    @> ll_to_earth(w.latitude, w.longitude)
    AND w.deleted = false
  ORDER BY distance;
END;
$$;
```

**CRITICAL**: Always set `search_path TO 'public'` to avoid ambiguous references.

### Foreign Keys

```sql
-- CASCADE delete
ALTER TABLE messages 
ADD CONSTRAINT messages_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

-- RESTRICT (prevent deletion)
ALTER TABLE walk_requests 
ADD CONSTRAINT walk_requests_walk_id_fkey 
FOREIGN KEY (walk_id) REFERENCES walks(id) ON DELETE RESTRICT;

-- SET NULL (preserve parent)
ALTER TABLE chats 
ADD CONSTRAINT chats_walk_request_id_fkey 
FOREIGN KEY (walk_request_id) REFERENCES walk_requests(id) ON DELETE SET NULL;
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- View all profiles
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT TO authenticated USING (true);

-- Insert own profile only
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Update own profile only
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

### Complex Migration Example: Group Chat System

This example shows a complete migration that adds new tables, migrates existing data, and updates policies:

```sql
-- supabase/migrations/20260311175120_031_group_chat_system.sql

-- Step 1: Add new columns to existing table
ALTER TABLE chats 
ADD COLUMN type TEXT CHECK (type IN ('group', 'direct')),
ADD COLUMN walk_id UUID REFERENCES walks(id) ON DELETE SET NULL;

-- Step 2: Create new junction table
CREATE TABLE chat_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_chats_type ON chats(type);
CREATE INDEX idx_chats_walk_id ON chats(walk_id) WHERE walk_id IS NOT NULL;

-- Step 4: Migrate existing data
UPDATE chats SET type = 'direct' WHERE type IS NULL;

INSERT INTO chat_participants (chat_id, user_id, role)
SELECT id, requester_id, 'member' FROM chats WHERE requester_id IS NOT NULL
UNION ALL
SELECT id, walker_id, 'member' FROM chats WHERE walker_id IS NOT NULL;

-- Step 5: Make type column NOT NULL after migration
ALTER TABLE chats ALTER COLUMN type SET NOT NULL;

-- Step 6: Create database triggers for automation
CREATE OR REPLACE FUNCTION create_group_chat_on_walk_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO chats (type, walk_id) VALUES ('group', NEW.id);
    INSERT INTO chat_participants (chat_id, user_id, role)
    SELECT currval(pg_get_serial_sequence('chats', 'id')), NEW.user_id, 'owner';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_group_chat_on_walk_insert_trigger
    AFTER INSERT ON walks
    FOR EACH ROW
    EXECUTE FUNCTION create_group_chat_on_walk_insert();

-- Step 7: Update RLS policies
DROP POLICY IF EXISTS "Users can view chats" ON chats;
CREATE POLICY "Users can view their chats"
ON chats FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chat_participants cp 
        WHERE cp.chat_id = chats.id AND cp.user_id = auth.uid()
    )
);

-- Step 8: Enable RLS on new table
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants of their chats"
ON chat_participants FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chat_participants cp 
        WHERE cp.chat_id = chat_participants.chat_id AND cp.user_id = auth.uid()
    )
);

-- Step 9: Create optimized RPC function
CREATE OR REPLACE FUNCTION get_my_chats_optimized(p_user_id UUID)
RETURNS TABLE (
    chat_id UUID,
    chat_type TEXT,
    walk_id UUID,
    event_title TEXT,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    participant_avatars TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as chat_id,
        c.type as chat_type,
        c.walk_id,
        w.title as event_title,
        m.content as last_message,
        m.created_at as last_message_time,
        COUNT(CASE WHEN m2.read = false AND m2.sender_id != p_user_id THEN 1 END) as unread_count,
        ARRAY_AGG(DISTINCT p.avatar_url) FILTER (WHERE p.avatar_url IS NOT NULL) as participant_avatars
    FROM chats c
    JOIN chat_participants cp ON c.id = cp.chat_id
    LEFT JOIN walks w ON c.walk_id = w.id
    LEFT JOIN messages m ON c.id = m.chat_id AND m.created_at = (
        SELECT MAX(created_at) FROM messages WHERE chat_id = c.id
    )
    LEFT JOIN messages m2 ON c.id = m2.chat_id
    LEFT JOIN chat_participants cp2 ON c.id = cp2.chat_id
    LEFT JOIN profiles p ON cp2.user_id = p.id
    WHERE cp.user_id = p_user_id
    GROUP BY c.id, c.type, c.walk_id, w.title, m.content, m.created_at
    ORDER BY COALESCE(m.created_at, c.created_at) DESC;
END;
$$;

-- Step 10: Add validation and comments
COMMENT ON TABLE chat_participants IS 'Junction table for chat membership with roles';
COMMENT ON COLUMN chats.type IS 'Chat type: group (linked to events) or direct (1-on-1)';
COMMENT ON COLUMN chats.walk_id IS 'Links group chats to events, NULL for direct chats';
```

**Key Migration Principles Demonstrated:**
- **Data Preservation**: Existing chats migrated to new structure
- **Atomic Operations**: All changes in single transaction
- **Performance**: Indexes added for new query patterns
- **Automation**: Triggers handle future chat creation
- **Security**: RLS policies updated for new schema
- **Optimization**: RPC function eliminates N+1 queries

## TypeScript Type Generation

### How It Works

Supabase CLI reads your database schema and generates TypeScript types for:
- Tables (Row, Insert, Update types)
- RPC Functions (Args, Returns types)
- Enums and Views

### Using Generated Types

```typescript
import type { Database } from './database.types';

// Type for RPC function return
type GetNearbyWalksRow = Database['public']['Functions']['get_nearby_walks']['Returns'][number];

// Use in API
export async function getNearbyWalks(lat: number, lng: number): Promise<NearbyWalk[]> {
  const { data, error } = await supabase.rpc('get_nearby_walks', {
    p_latitude: lat,
    p_longitude: lng,
    p_radius_km: 15,
  });

  if (error) throw error;

  return data.map((row: GetNearbyWalksRow) => ({
    distance: row.distance,  // Autocomplete works!
    walk: { id: row.id, title: row.title },
  }));
}
```

### When to Regenerate

Regenerate types after ANY schema change:
- ✅ Added/removed table or column
- ✅ Changed column type
- ✅ Created/modified RPC function
- ✅ Created/modified View or ENUM

## Best Practices

### DO ✅

1. **Always use migrations** for schema changes
2. **Generate types** after every migration
3. **Commit migrations and types** together
4. **Use descriptive names** (`add_phone_to_profiles`, not `migration_1`)
5. **Add SQL comments** for complex logic
6. **Test migrations** on local database first
7. **Set search_path** in RPC functions
8. **Use RPC functions** for complex queries (avoid N+1)
9. **Add indexes** for frequently queried columns

### DON'T ❌

1. **Don't use Supabase Dashboard** for schema changes (only experiments)
2. **Don't edit old migrations** (create new ones to fix)
3. **Don't skip type generation** (types will be out of sync)
4. **Don't hardcode SQL** in app code (use RPC functions)
5. **Don't forget CASCADE rules** on foreign keys (data loss risk)
6. **Don't use SELECT *** in RPC (specify columns)
7. **Don't forget table aliases** in RPC functions
8. **Don't create indexes blindly** (analyze query patterns first)

## Troubleshooting

### Migration Failed

```bash
npx supabase migration list      # Check status
npx supabase db reset            # Reset local DB (DESTRUCTIVE)
npx supabase db push --include-all
```

### Types Out of Sync

```bash
npx supabase gen types typescript --local > src/shared/lib/database.types.ts
npx supabase status              # Check connection
```

### RPC Function Errors

**"function does not exist"** → Check `search_path` in function definition  
**"column reference is ambiguous"** → Qualify columns with table aliases  
**"relation does not exist"** → Set `search_path TO 'public'`

```sql
-- Fix: Add search_path and table aliases
CREATE OR REPLACE FUNCTION function_name(...)
SET search_path TO 'public'  -- ← Add this
AS $$
BEGIN
  SELECT t.column_name  -- ← Qualify columns
  FROM table_name t
  WHERE t.id = param;
END;
$$;
```

## Migration Checklist

Before committing:

- [ ] Migration file created with descriptive name
- [ ] SQL tested on local database
- [ ] Migration applied successfully
- [ ] Types regenerated
- [ ] API functions updated
- [ ] TypeScript compiles without errors
- [ ] Tests pass (see [database-testing.md](./database-testing.md))
- [ ] Migration and types committed together

## Automation Scripts

```json
{
  "scripts": {
    "db:migrate": "npx supabase db push && npx supabase gen types typescript --local > src/shared/lib/database.types.ts",
    "db:status": "npx supabase status"
  }
}
```

Usage:
```bash
npm run db:migrate  # Apply migration + generate types
```

## Production Deployment

```bash
# Link to production
npx supabase link --project-ref your-project-ref

# Apply migrations
npx supabase db push --linked

# Generate types
npx supabase gen types typescript --linked > src/shared/lib/database.types.ts
```

**IMPORTANT**: Always test on staging before production!

## Testing

For database testing workflow (Property-Based Testing, Exploration Tests, Preservation Tests), see:

**[database-testing.md](./database-testing.md)**

## Resources

- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
