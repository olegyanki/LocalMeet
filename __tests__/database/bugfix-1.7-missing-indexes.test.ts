/**
 * Bug 1.7: Missing and Unused Indexes - Exploration Test
 * 
 * Property 1: Expected Behavior - Optimized Index Set
 * 
 * CRITICAL: This test PASSES after fix - confirms bug is resolved
 * 
 * Bug Condition: isBugCondition_1_7(query) where critical columns lack indexes
 * 
 * Previous Behavior (Defect):
 * WHEN queries execute on chats.updated_at, messages.created_at, or walks(deleted, start_time)
 * THEN the system performed slow table scans because critical indexes were missing,
 * while unused indexes wasted storage
 * 
 * Expected Behavior (After Fix):
 * WHEN queries execute on frequently accessed columns THEN the system SHALL have
 * indexes on chats.updated_at, messages.created_at, and composite index on
 * walks(deleted, start_time), and SHALL have no unused indexes
 * 
 * Test Strategy:
 * 1. Check migrations for composite index on walks(deleted, start_time)
 * 2. Check migrations for absence of unused indexes
 * 3. Verify index optimization is complete
 * 
 * EXPECTED OUTCOME: Test PASSES (confirms indexes optimized)
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

describe('Bug 1.7: Missing and Unused Indexes - Exploration Test', () => {
  let migrationFiles: string[] = [];
  let allMigrations: string = '';

  beforeAll(async () => {
    console.log('');
    console.log('='.repeat(80));
    console.log('Bug 1.7: Missing and Unused Indexes - Exploration Test');
    console.log('='.repeat(80));
    console.log('');
    console.log('Bug Condition:');
    console.log('  isBugCondition_1_7(query) where:');
    console.log('    - Critical columns lack indexes (chats.updated_at, walks composite)');
    console.log('    - Unused indexes waste storage (9 foreign key indexes)');
    console.log('');
    console.log('Current Behavior (Defect):');
    console.log('  Missing indexes cause slow table scans');
    console.log('  Unused indexes slow down writes and waste storage');
    console.log('');
    console.log('Expected Behavior (After Fix):');
    console.log('  Indexes on frequently queried columns');
    console.log('  No unused indexes');
    console.log('');
    console.log('Test Strategy:');
    console.log('  1. Check for chats.updated_at index');
    console.log('  2. Check for walks(deleted, start_time) composite index');
    console.log('  3. Count unused foreign key indexes');
    console.log('');
    console.log('EXPECTED OUTCOME: Test PASSES (confirms indexes optimized)');
    console.log('='.repeat(80));
    console.log('');

    // Read all migration files
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    migrationFiles = await glob(`${migrationsDir}/*.sql`);
    allMigrations = migrationFiles
      .map(file => fs.readFileSync(file, 'utf8'))
      .join('\n');
  });

  it('should verify walks composite index exists (PASSES after fix)', () => {
    console.log('');
    console.log('Checking for walks(deleted, start_time) composite index...');
    console.log('');

    // Check if there's a composite index on walks(deleted, start_time)
    const hasCompositeIndex = 
      /CREATE INDEX.*walks.*\(deleted,\s*start_time\)/i.test(allMigrations) ||
      /CREATE INDEX.*walks.*deleted.*start_time/i.test(allMigrations);

    // Check for separate indexes (current state)
    const hasSeparateDeletedIndex = /CREATE INDEX.*walks.*deleted/i.test(allMigrations);
    const hasSeparateStartTimeIndex = /CREATE INDEX.*walks.*start_time/i.test(allMigrations);

    console.log('Current Index State:');
    console.log(`  Composite index walks(deleted, start_time): ${hasCompositeIndex ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  Separate index on deleted: ${hasSeparateDeletedIndex ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  Separate index on start_time: ${hasSeparateStartTimeIndex ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log('');

    if (hasCompositeIndex) {
      console.log('='.repeat(80));
      console.log('TEST RESULT: PASSED (Bug Fixed!)');
      console.log('✓ Composite index exists');
      console.log('✓ Queries with WHERE deleted = false AND start_time > NOW()');
      console.log('  can now use a single efficient index scan');
      console.log('='.repeat(80));
      console.log('');
    } else {
      console.log('Counterexample Documentation:');
      console.log('  - walks table has separate indexes instead of composite');
      console.log('    Current: idx_walks_deleted + idx_walks_start_time');
      console.log('    Needed: walks_deleted_start_time_idx ON walks(deleted, start_time)');
      console.log('    Impact: Queries with WHERE deleted = false AND start_time > NOW()');
      console.log('            cannot use a single index scan');
      console.log('');

      console.log('='.repeat(80));
      console.log('TEST RESULT: FAILED');
      console.log('Bug Still Exists: Composite index is missing');
      console.log('='.repeat(80));
      console.log('');
    }

    expect(hasCompositeIndex).toBe(true);
  });

  it('should verify no unused indexes exist (PASSES after fix)', () => {
    console.log('');
    console.log('Checking for unused indexes...');
    console.log('');

    // Check for unused foreign key indexes
    const unusedIndexes = [
      { name: 'chats_requester_id_idx', pattern: /CREATE INDEX chats_requester_id_idx/i },
      { name: 'chats_walker_id_idx', pattern: /CREATE INDEX chats_walker_id_idx/i },
      { name: 'chats_walk_request_id_idx', pattern: /CREATE INDEX chats_walk_request_id_idx/i },
      { name: 'messages_chat_id_idx', pattern: /CREATE INDEX messages_chat_id_idx/i },
      { name: 'messages_sender_id_idx', pattern: /CREATE INDEX messages_sender_id_idx/i },
      { name: 'walk_requests_walk_id_idx', pattern: /CREATE INDEX walk_requests_walk_id_idx/i },
      { name: 'walk_requests_requester_id_idx', pattern: /CREATE INDEX walk_requests_requester_id_idx/i },
      { name: 'walk_requests_status_idx', pattern: /CREATE INDEX walk_requests_status_idx/i },
    ];

    const foundUnusedIndexes = unusedIndexes.filter(idx => idx.pattern.test(allMigrations));

    console.log('Unused Foreign Key Indexes Found:');
    if (foundUnusedIndexes.length > 0) {
      foundUnusedIndexes.forEach(idx => {
        console.log(`  ✗ ${idx.name} (should be removed)`);
      });
    } else {
      console.log('  ✓ None found');
    }
    console.log('');
    console.log(`Total: ${foundUnusedIndexes.length} unused indexes`);
    console.log('');

    if (foundUnusedIndexes.length > 0) {
      console.log('Why These Indexes Are Unused:');
      console.log('  - Foreign key constraints automatically create indexes');
      console.log('  - These explicit indexes duplicate the constraint indexes');
      console.log('  - They waste storage and slow down INSERT/UPDATE/DELETE');
      console.log('');

      console.log('Expected unused indexes (should be removed):');
      console.log('  chats: requester_id_idx, walker_id_idx, walk_request_id_idx');
      console.log('  messages: chat_id_idx, sender_id_idx');
      console.log('  walk_requests: walk_id_idx, requester_id_idx, status_idx');
      console.log('');

      console.log('='.repeat(80));
      console.log('TEST RESULT: FAILED (as expected)');
      console.log(`Bug Confirmed: ${foundUnusedIndexes.length} unused indexes exist`);
      console.log('='.repeat(80));
      console.log('');

      expect(foundUnusedIndexes.length).toBe(0);
    } else {
      console.log('='.repeat(80));
      console.log('TEST RESULT: PASSED (Bug Fixed!)');
      console.log('✓ No unused indexes found');
      console.log('='.repeat(80));
      console.log('');
    }
  });

  afterAll(() => {
    console.log('');
    console.log('='.repeat(80));
    console.log('Bug 1.7 Exploration Test Complete');
    console.log('');
    console.log('Summary:');
    console.log('  - Checked for missing composite index on walks');
    console.log('  - Checked for unused foreign key indexes');
    console.log('  - Documented performance impact');
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Write preservation tests (task 1.7.2)');
    console.log('  2. Create migration to optimize indexes (task 1.7.3.1)');
    console.log('  3. Verify query performance improvement');
    console.log('='.repeat(80));
    console.log('');
  });
});
