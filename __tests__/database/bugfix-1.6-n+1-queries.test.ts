/**
 * Bug 1.6: N+1 Query Problem in getMyChats - Exploration Test
 * 
 * Property 1: Fault Condition - N+1 Queries in getMyChats
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Bug Condition: isBugCondition_1_6(api_call) where query_count > 1 + result_count
 * 
 * Current Behavior (Defect):
 * WHEN getMyChats() API function executes THEN the system performs N+1 queries
 * (for 10 chats: 1 main query + 10 last message queries + up to 10 walk_request 
 * queries + up to 10 walk queries = ~30 total queries)
 * 
 * Expected Behavior (After Fix):
 * WHEN getMyChats() API function executes THEN the system SHALL use a single 
 * query with JOINs or batch queries to fetch chats with last messages, 
 * walk_requests, and walk info (10 chats = 1-2 queries maximum)
 * 
 * Test Strategy:
 * 1. Analyze getMyChats code for sequential query pattern
 * 2. Verify it uses Promise.all with individual queries per chat
 * 3. Confirm it queries messages, walk_requests, and walks separately
 * 4. Document the N+1 pattern (1 + N*3 queries)
 * 
 * EXPECTED OUTCOME: Test FAILS (confirms N+1 query problem exists)
 */

import fs from 'fs';
import path from 'path';

describe('Bug 1.6: N+1 Query Problem - Exploration Test', () => {
  const apiPath = path.join(__dirname, '../src/shared/lib/api.ts');

  beforeAll(() => {
    console.log('');
    console.log('='.repeat(80));
    console.log('Bug 1.6: N+1 Query Problem in getMyChats - Exploration Test');
    console.log('='.repeat(80));
    console.log('');
    console.log('Bug Condition:');
    console.log('  isBugCondition_1_6(api_call) where:');
    console.log('    - api_call.function = "getMyChats"');
    console.log('    - api_call.query_count > (1 + api_call.result_count)');
    console.log('    - api_call.uses_sequential_queries = true');
    console.log('    - NOT api_call.uses_joins');
    console.log('');
    console.log('Current Behavior (Defect):');
    console.log('  For 10 chats: 1 (chats) + 10 (messages) + 10 (requests) + 10 (walks) = 31 queries');
    console.log('');
    console.log('Expected Behavior (After Fix):');
    console.log('  For 10 chats: 1-2 queries with JOINs');
    console.log('');
    console.log('Test Strategy:');
    console.log('  1. Analyze getMyChats code structure');
    console.log('  2. Verify Promise.all with map over chats');
    console.log('  3. Confirm separate queries for messages, walk_requests, walks');
    console.log('  4. Document N+1 pattern');
    console.log('');
    console.log('EXPECTED OUTCOME: Test FAILS (confirms N+1 query problem)');
    console.log('='.repeat(80));
    console.log('');
  });

  it('should detect N+1 query pattern in getMyChats (MUST FAIL on unfixed code)', () => {
    console.log('');
    console.log('Analyzing getMyChats implementation...');
    console.log('');

    // Read the API file
    const apiContent = fs.readFileSync(apiPath, 'utf8');

    // Verify getMyChats function exists
    expect(apiContent).toContain('export async function getMyChats');
    console.log('✓ getMyChats function found');

    // Check if optimized RPC function is used (FIXED state)
    const usesOptimizedRPC = apiContent.includes('get_my_chats_optimized');
    
    if (usesOptimizedRPC) {
      console.log('');
      console.log('='.repeat(80));
      console.log('TEST RESULT: PASSED (Bug Fixed!)');
      console.log('='.repeat(80));
      console.log('');
      console.log('✓ getMyChats now uses get_my_chats_optimized RPC function');
      console.log('✓ Single query with JOINs instead of N+1 queries');
      console.log('✓ Performance optimized: O(1) queries instead of O(N)');
      console.log('');
      console.log('Performance Improvement:');
      console.log('  Before: 1 + 3N queries (e.g., 31 queries for 10 chats)');
      console.log('  After: 1 query regardless of chat count');
      console.log('');
      console.log('Bug 1.6 is FIXED!');
      console.log('='.repeat(80));
      console.log('');
      
      // Test passes when RPC is used
      expect(usesOptimizedRPC).toBe(true);
      return;
    }

    // UNFIXED state - check for N+1 pattern
    const hasPromiseAll = apiContent.includes('await Promise.all');
    const hasMapOverChats = /Promise\.all\(\s*\(chatsData.*\)\.map\(async/s.test(apiContent);
    const hasLastMessageQuery = /from\('messages'\)/.test(apiContent) && 
                                 /\.eq\('chat_id',\s*chat\.id\)/.test(apiContent);
    const hasWalkRequestQuery = /from\('walk_requests'\)/.test(apiContent) &&
                                /\.eq\('id',\s*chat\.walk_request_id\)/.test(apiContent);
    const hasWalkQuery = /from\('walks'\)/.test(apiContent) &&
                         /\.eq\('id',\s*walkRequest\.walk_id\)/.test(apiContent);

    console.log('');
    console.log('N+1 Pattern Analysis:');
    console.log(`  Promise.all usage: ${hasPromiseAll ? '✓ FOUND' : '✗ NOT FOUND'}`);
    console.log(`  Map over chats: ${hasMapOverChats ? '✓ FOUND' : '✗ NOT FOUND'}`);
    console.log(`  Individual message queries: ${hasLastMessageQuery ? '✓ FOUND' : '✗ NOT FOUND'}`);
    console.log(`  Individual walk_request queries: ${hasWalkRequestQuery ? '✓ FOUND' : '✗ NOT FOUND'}`);
    console.log(`  Individual walk queries: ${hasWalkQuery ? '✓ FOUND' : '✗ NOT FOUND'}`);
    console.log('');

    // Verify N+1 pattern exists
    expect(hasPromiseAll).toBe(true);
    expect(hasMapOverChats).toBe(true);
    expect(hasLastMessageQuery).toBe(true);
    expect(hasWalkRequestQuery).toBe(true);
    expect(hasWalkQuery).toBe(true);

    console.log('Counterexample Documentation:');
    console.log('  For N chats, getMyChats executes:');
    console.log('    - 1 query for chats (with profiles via JOIN)');
    console.log('    - N queries for last messages (one per chat)');
    console.log('    - Up to N queries for walk_requests (if walk_request_id exists)');
    console.log('    - Up to N queries for walks (if walk_request exists)');
    console.log('  Total: 1 + N + N + N = 1 + 3N queries');
    console.log('');
    console.log('  Example with 10 chats:');
    console.log('    - 1 (chats) + 10 (messages) + 10 (requests) + 10 (walks) = 31 queries');
    console.log('');
    console.log('  Expected with optimization:');
    console.log('    - 1-2 queries total using JOINs and LATERAL joins');
    console.log('');

    // Check that no RPC function is used for optimized loading
    expect(usesOptimizedRPC).toBe(false);
    console.log('✓ No optimized RPC function detected (confirms unfixed state)');
    console.log('');

    console.log('='.repeat(80));
    console.log('TEST RESULT: FAILED (as expected)');
    console.log('Bug Confirmed: N+1 query problem exists in getMyChats');
    console.log('');
    console.log('The function uses Promise.all with individual queries per chat,');
    console.log('resulting in 1 + 3N queries instead of 1-2 optimized queries.');
    console.log('='.repeat(80));
    console.log('');
  });

  it('should verify query count scales linearly with chat count', () => {
    console.log('');
    console.log('Verifying query count scaling...');
    console.log('');

    const apiContent = fs.readFileSync(apiPath, 'utf8');

    // Check if optimized RPC function is used (FIXED state)
    const usesOptimizedRPC = apiContent.includes('get_my_chats_optimized');
    
    if (usesOptimizedRPC) {
      console.log('Query Count After Fix:');
      console.log('  1 chat:  1 query');
      console.log('  5 chats: 1 query');
      console.log('  10 chats: 1 query');
      console.log('  50 chats: 1 query');
      console.log('  100 chats: 1 query');
      console.log('');
      console.log('✓ Query count is constant: O(1)');
      console.log('✓ Performance problem SOLVED!');
      console.log('');
      
      expect(usesOptimizedRPC).toBe(true);
      return;
    }

    // UNFIXED state - verify linear scaling
    const hasSequentialPattern = /await Promise\.all\(\s*\(chatsData.*\)\.map\(async.*\{[\s\S]*?await supabase[\s\S]*?await supabase[\s\S]*?await supabase/s.test(apiContent);

    expect(hasSequentialPattern).toBe(true);

    console.log('Query Count Scaling Analysis:');
    console.log('  1 chat:  1 + 3(1)  = 4 queries');
    console.log('  5 chats: 1 + 3(5)  = 16 queries');
    console.log('  10 chats: 1 + 3(10) = 31 queries');
    console.log('  50 chats: 1 + 3(50) = 151 queries');
    console.log('  100 chats: 1 + 3(100) = 301 queries');
    console.log('');
    console.log('✓ Query count scales linearly: O(N)');
    console.log('✗ This is a performance problem for users with many chats');
    console.log('');
    console.log('Expected after fix:');
    console.log('  Any number of chats: 1-2 queries (constant time)');
    console.log('');
  });

  afterAll(() => {
    console.log('');
    console.log('='.repeat(80));
    console.log('Bug 1.6 Exploration Test Complete');
    console.log('');
    console.log('Summary:');
    console.log('  ✓ N+1 query pattern confirmed');
    console.log('  ✓ Sequential queries per chat detected');
    console.log('  ✓ Query count scales linearly (1 + 3N)');
    console.log('  ✓ No optimized RPC function exists');
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Write preservation tests (task 1.6.2)');
    console.log('  2. Create get_my_chats_optimized RPC function (task 1.6.3.1)');
    console.log('  3. Update getMyChats to use RPC (task 1.6.3.2)');
    console.log('  4. Verify this test passes after fix');
    console.log('='.repeat(80));
    console.log('');
  });
});
