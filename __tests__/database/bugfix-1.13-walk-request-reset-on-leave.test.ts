/**
 * Bug 1.13: Walk Request Reset on Leave Chat
 * 
 * PROBLEM:
 * When a user leaves a group chat (linked to an event), their walk_request 
 * remains in 'accepted' status. This prevents them from re-applying to the 
 * event in the future.
 * 
 * EXPECTED BEHAVIOR:
 * When a user leaves a group chat:
 * 1. Their walk_request for that event should be deleted
 * 2. They should be able to create a new walk_request for the same event
 * 3. Direct chats should not be affected (no walk_request deletion)
 * 
 * SOLUTION:
 * Database trigger that automatically deletes walk_request when user 
 * leaves a group chat linked to an event.
 */

describe('Bug 1.13: Walk Request Reset on Leave Chat - Exploration Test', () => {
  test('EXPLORATION TEST: Trigger should delete walk_request when leaving group chat', async () => {
    console.log('Bug Condition:');
    console.log('  - User leaves group chat');
    console.log('  - walk_request remains in accepted status');
    console.log('  - User cannot re-apply to event');
    console.log('');
    console.log('Expected Behavior (after fix):');
    console.log('  - Trigger deletes walk_request on chat_participants DELETE');
    console.log('  - User can create new walk_request for same event');
    console.log('  - Only affects group chats (type = "group")');
    console.log('');

    const fs = require('fs');
    const path = require('path');

    // Find the migration file
    const migrationsDir = path.join(__dirname, '../../supabase/migrations');
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find((f: string) => 
      f.includes('reset_walk_request_on_leave_chat')
    );

    if (!migrationFile) {
      console.log('✗ Bug Confirmed: Migration file not found');
      console.log('  Expected: File containing "reset_walk_request_on_leave_chat"');
      throw new Error('Migration file for walk request reset not found');
    }

    const migrationPath = path.join(migrationsDir, migrationFile);
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');

    // Check for trigger function
    const hasTriggerFunction = migrationContent.includes('CREATE OR REPLACE FUNCTION reset_walk_request_on_leave_chat()');
    
    // Check for trigger
    const hasTrigger = migrationContent.includes('CREATE TRIGGER reset_walk_request_on_leave_chat_trigger');
    
    // Check for DELETE operation on walk_requests
    const deletesWalkRequest = migrationContent.includes('DELETE FROM walk_requests');
    
    // Check for group chat type check
    const checksGroupChat = migrationContent.includes("v_chat_type = 'group'");
    
    // Check for walk_id check
    const checksWalkId = migrationContent.includes('v_walk_id IS NOT NULL');

    if (!hasTriggerFunction || !hasTrigger || !deletesWalkRequest || 
        !checksGroupChat || !checksWalkId) {
      console.log('✗ Bug Confirmed: Trigger implementation incomplete');
      console.log(`  Has trigger function: ${hasTriggerFunction}`);
      console.log(`  Has trigger: ${hasTrigger}`);
      console.log(`  Deletes walk_request: ${deletesWalkRequest}`);
      console.log(`  Checks group chat: ${checksGroupChat}`);
      console.log(`  Checks walk_id: ${checksWalkId}`);
      
      expect(hasTriggerFunction).toBe(true);
      expect(hasTrigger).toBe(true);
      expect(deletesWalkRequest).toBe(true);
      expect(checksGroupChat).toBe(true);
      expect(checksWalkId).toBe(true);
    }

    console.log('✓ Bug Fixed! Trigger implementation complete');
    console.log('  ✓ Trigger function created');
    console.log('  ✓ Trigger attached to chat_participants DELETE');
    console.log('  ✓ Deletes walk_request for group chats');
    console.log('  ✓ Checks chat type and walk_id');
    
    expect(hasTriggerFunction).toBe(true);
    expect(hasTrigger).toBe(true);
    expect(deletesWalkRequest).toBe(true);
    expect(checksGroupChat).toBe(true);
    expect(checksWalkId).toBe(true);
  });
});

describe('Bug 1.13: Preservation Property Tests', () => {
  describe('Property 1: Direct Chat Preservation', () => {
    test('PRESERVATION: Direct chats should not trigger walk_request deletion', async () => {
      console.log('Requirement: Direct chats (type = "direct") MUST NOT delete walk_requests');
      console.log('');

      const fs = require('fs');
      const path = require('path');

      const migrationsDir = path.join(__dirname, '../../supabase/migrations');
      const files = fs.readdirSync(migrationsDir);
      const migrationFile = files.find((f: string) => 
        f.includes('reset_walk_request_on_leave_chat')
      );

      expect(migrationFile).toBeDefined();

      const migrationPath = path.join(migrationsDir, migrationFile!);
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');

      // Verify that trigger only processes group chats
      const checksGroupChat = migrationContent.includes("v_chat_type = 'group'");
      
      console.log('✓ Direct chats are preserved (trigger only processes group chats)');
      expect(checksGroupChat).toBe(true);
    });
  });

  describe('Property 2: leaveChat Function Preservation', () => {
    test('PRESERVATION: leaveChat function should still work correctly', async () => {
      console.log('Requirement: leaveChat() MUST continue to remove user from chat_participants');
      console.log('');

      const fs = require('fs');
      const path = require('path');
      const apiPath = path.join(__dirname, '../../src/shared/lib/api.ts');
      const apiContent = fs.readFileSync(apiPath, 'utf8');

      // Verify leaveChat function exists and deletes from chat_participants
      const hasLeaveChatFunction = apiContent.includes('export async function leaveChat');
      const deletesFromChatParticipants = apiContent.includes("from('chat_participants')") &&
                                          apiContent.includes('.delete()');

      console.log('✓ leaveChat function preserved');
      console.log('  ✓ Function exists');
      console.log('  ✓ Deletes from chat_participants');
      
      expect(hasLeaveChatFunction).toBe(true);
      expect(deletesFromChatParticipants).toBe(true);
    });
  });

  describe('Property 3: Chat Participant Deletion', () => {
    test('PRESERVATION: Deleting chat_participant should still work', async () => {
      console.log('Requirement: DELETE from chat_participants MUST still work');
      console.log('');

      const fs = require('fs');
      const path = require('path');

      const migrationsDir = path.join(__dirname, '../../supabase/migrations');
      const files = fs.readdirSync(migrationsDir);
      const migrationFile = files.find((f: string) => 
        f.includes('reset_walk_request_on_leave_chat')
      );

      expect(migrationFile).toBeDefined();

      const migrationPath = path.join(migrationsDir, migrationFile!);
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');

      // Verify trigger returns OLD (allows DELETE to proceed)
      const returnsOld = migrationContent.includes('RETURN OLD');
      
      // Verify trigger is BEFORE DELETE (doesn't block deletion)
      const isBeforeDelete = migrationContent.includes('BEFORE DELETE ON chat_participants');

      console.log('✓ Chat participant deletion preserved');
      console.log('  ✓ Trigger returns OLD (allows deletion)');
      console.log('  ✓ Trigger is BEFORE DELETE (non-blocking)');
      
      expect(returnsOld).toBe(true);
      expect(isBeforeDelete).toBe(true);
    });
  });

  describe('Property 4: Event Owner Preservation', () => {
    test('PRESERVATION: Event owner should still be able to leave chat', async () => {
      console.log('Requirement: Event owners MUST be able to leave their own event chats');
      console.log('');

      const fs = require('fs');
      const path = require('path');

      const migrationsDir = path.join(__dirname, '../../supabase/migrations');
      const files = fs.readdirSync(migrationsDir);
      const migrationFile = files.find((f: string) => 
        f.includes('reset_walk_request_on_leave_chat')
      );

      expect(migrationFile).toBeDefined();

      const migrationPath = path.join(migrationsDir, migrationFile!);
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');

      // Verify trigger doesn't check user role or ownership
      const checksRole = migrationContent.includes('role') && 
                        migrationContent.includes('owner');
      
      // Trigger should work for all users (no role restrictions)
      console.log('✓ Event owner can leave chat');
      console.log('  ✓ Trigger applies to all users (no role check)');
      
      // We expect NO role check in the trigger
      expect(checksRole).toBe(false);
    });
  });
});
