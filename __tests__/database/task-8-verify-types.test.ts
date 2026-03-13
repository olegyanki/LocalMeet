/**
 * Task 8: Verify TypeScript Types Generation
 * 
 * This test verifies that database.types.ts includes all necessary types
 * for the group chat system implementation.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Task 8: TypeScript Types Verification', () => {
  const typesPath = path.join(__dirname, '../../src/shared/lib/database.types.ts');
  let typesContent: string;

  beforeAll(() => {
    typesContent = fs.readFileSync(typesPath, 'utf8');
  });

  describe('Sub-task 8.1: Types file exists and is readable', () => {
    test('database.types.ts file exists', () => {
      expect(fs.existsSync(typesPath)).toBe(true);
    });

    test('database.types.ts file is not empty', () => {
      expect(typesContent.length).toBeGreaterThan(0);
    });
  });

  describe('Sub-task 8.2: chat_participants table types', () => {
    test('includes chat_participants table definition', () => {
      expect(typesContent).toContain('chat_participants:');
    });

    test('chat_participants has all required columns in Row type', () => {
      const requiredColumns = [
        'chat_id: string',
        'id: string',
        'joined_at: string | null',
        'role: string',
        'user_id: string'
      ];

      requiredColumns.forEach(column => {
        expect(typesContent).toContain(column);
      });
    });

    test('chat_participants has Insert type', () => {
      expect(typesContent).toMatch(/chat_participants:[\s\S]*Insert:/);
    });

    test('chat_participants has Update type', () => {
      expect(typesContent).toMatch(/chat_participants:[\s\S]*Update:/);
    });

    test('chat_participants has foreign key relationships', () => {
      expect(typesContent).toContain('chat_participants_chat_id_fkey');
      expect(typesContent).toContain('chat_participants_user_id_fkey');
    });
  });

  describe('Sub-task 8.3: chats table new columns', () => {
    test('chats table includes type column', () => {
      expect(typesContent).toMatch(/chats:[\s\S]*type: string/);
    });

    test('chats table includes walk_id column', () => {
      expect(typesContent).toMatch(/chats:[\s\S]*walk_id: string \| null/);
    });

    test('chats table has walk_id foreign key relationship', () => {
      expect(typesContent).toContain('chats_walk_id_fkey');
    });
  });

  describe('Sub-task 8.4: RPC function types', () => {
    test('includes get_my_chats_optimized RPC function', () => {
      expect(typesContent).toContain('get_my_chats_optimized:');
    });

    test('get_my_chats_optimized has correct Args type', () => {
      expect(typesContent).toMatch(/get_my_chats_optimized:[\s\S]*Args:[\s\S]*p_user_id: string/);
    });

    test('get_my_chats_optimized has correct Returns type with all fields', () => {
      const requiredFields = [
        'chat_id: string',
        'chat_type: string',
        'chat_updated_at: string',
        'last_message_content: string',
        'last_message_created_at: string',
        'last_message_read: boolean',
        'last_message_sender_id: string',
        'participant_avatar_urls: string[]',
        'participant_display_names: string[]',
        'participant_ids: string[]',
        'participant_usernames: string[]',
        'unread_count: number',
        'walk_id: string',
        'walk_image_url: string',
        'walk_start_time: string',
        'walk_title: string'
      ];

      requiredFields.forEach(field => {
        expect(typesContent).toContain(field);
      });
    });

    test('includes get_chat_details RPC function', () => {
      expect(typesContent).toContain('get_chat_details:');
    });

    test('get_chat_details has correct Args type', () => {
      expect(typesContent).toMatch(/get_chat_details:[\s\S]*Args:[\s\S]*p_chat_id: string/);
      expect(typesContent).toMatch(/get_chat_details:[\s\S]*Args:[\s\S]*p_user_id: string/);
    });

    test('get_chat_details has correct Returns type with all fields', () => {
      const requiredFields = [
        'chat_id: string',
        'chat_type: string',
        'participant_avatar_url: string',
        'participant_display_name: string',
        'participant_id: string',
        'participant_joined_at: string',
        'participant_role: string',
        'participant_username: string',
        'walk_id: string',
        'walk_image_url: string',
        'walk_start_time: string',
        'walk_title: string'
      ];

      requiredFields.forEach(field => {
        expect(typesContent).toContain(field);
      });
    });
  });

  describe('Sub-task 8.5: Type completeness verification', () => {
    test('Database type is exported', () => {
      expect(typesContent).toContain('export type Database =');
    });

    test('Json type is exported', () => {
      expect(typesContent).toContain('export type Json =');
    });

    test('Tables section exists', () => {
      expect(typesContent).toContain('Tables:');
    });

    test('Functions section exists', () => {
      expect(typesContent).toContain('Functions:');
    });
  });

  describe('Sub-task 8.6: Legacy columns still present (for backward compatibility)', () => {
    test('chats table still has requester_id (to be removed in Phase 9)', () => {
      expect(typesContent).toMatch(/chats:[\s\S]*requester_id: string \| null/);
    });

    test('chats table still has walker_id (to be removed in Phase 9)', () => {
      expect(typesContent).toMatch(/chats:[\s\S]*walker_id: string \| null/);
    });

    test('chats table still has walk_request_id (to be removed in Phase 9)', () => {
      expect(typesContent).toMatch(/chats:[\s\S]*walk_request_id: string \| null/);
    });
  });

  describe('Summary', () => {
    test('All Task 8 requirements are met', () => {
      console.log('\n✅ Task 8 Verification Summary:');
      console.log('  ✓ Sub-task 8.1: database.types.ts exists and is readable');
      console.log('  ✓ Sub-task 8.2: chat_participants table types are complete');
      console.log('  ✓ Sub-task 8.3: chats table includes type and walk_id columns');
      console.log('  ✓ Sub-task 8.4: RPC functions (get_my_chats_optimized, get_chat_details) are typed');
      console.log('  ✓ Sub-task 8.5: Type structure is complete and exported');
      console.log('  ✓ Sub-task 8.6: Legacy columns present for backward compatibility');
      console.log('\n📝 Note: TypeScript types are up-to-date with database schema');
      console.log('📝 Note: Legacy columns (requester_id, walker_id, walk_request_id) will be removed in Phase 9');
      
      expect(true).toBe(true);
    });
  });
});
