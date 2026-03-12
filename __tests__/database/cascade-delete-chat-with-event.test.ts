import { supabase } from '../../src/shared/lib/supabase';

describe('Cascade Delete Chat with Event', () => {
  let testUserId: string;
  let testWalkId: string;
  let testChatId: string;

  beforeAll(async () => {
    // Create test user
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        username: 'testowner',
        display_name: 'Test Owner'
      })
      .select()
      .single();

    if (userError) throw userError;
    testUserId = userData.id;

    // Create test walk
    const { data: walkData, error: walkError } = await supabase
      .from('walks')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        user_id: testUserId,
        title: 'Test Walk',
        start_time: new Date().toISOString(),
        duration: 3600,
        latitude: 50.4501,
        longitude: 30.5234
      })
      .select()
      .single();

    if (walkError) throw walkError;
    testWalkId = walkData.id;

    // Create group chat for the walk
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .insert({
        type: 'group',
        walk_id: testWalkId
      })
      .select()
      .single();

    if (chatError) throw chatError;
    testChatId = chatData.id;

    // Add owner as participant
    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert({
        chat_id: testChatId,
        user_id: testUserId,
        role: 'owner'
      });

    if (participantError) throw participantError;

    // Add some messages to the chat
    const { error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: testChatId,
          sender_id: testUserId,
          content: 'Welcome to the event chat!',
          type: 'text'
        },
        {
          chat_id: testChatId,
          sender_id: testUserId,
          content: 'Looking forward to meeting everyone!',
          type: 'text'
        }
      ]);

    if (messageError) throw messageError;
  });

  afterAll(async () => {
    // Clean up any remaining data
    await supabase.from('profiles').delete().eq('id', testUserId);
  });

  test('CASCADE DELETE: Deleting event automatically deletes group chat', async () => {
    console.log('Testing cascade delete: Event deletion removes group chat');
    console.log('');
    console.log('Business Logic:');
    console.log('  - When an event is deleted, its group chat becomes meaningless');
    console.log('  - All chat data (messages, participants) should be cleaned up');
    console.log('  - This prevents orphaned chats and maintains data consistency');
    console.log('');

    // Verify chat exists before deletion
    const { data: chatBefore, error: chatBeforeError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', testChatId)
      .single();

    expect(chatBeforeError).toBeNull();
    expect(chatBefore).toBeTruthy();
    expect(chatBefore.walk_id).toBe(testWalkId);
    console.log('✓ Group chat exists before event deletion');

    // Verify participants exist
    const { data: participantsBefore, error: participantsBeforeError } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('chat_id', testChatId);

    expect(participantsBeforeError).toBeNull();
    expect(participantsBefore).toHaveLength(1);
    console.log('✓ Chat participants exist before event deletion');

    // Verify messages exist
    const { data: messagesBefore, error: messagesBeforeError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', testChatId);

    expect(messagesBeforeError).toBeNull();
    expect(messagesBefore!.length).toBeGreaterThan(0);
    console.log('✓ Chat messages exist before event deletion');

    // Delete the event (walk)
    const { error: deleteWalkError } = await supabase
      .from('walks')
      .delete()
      .eq('id', testWalkId);

    expect(deleteWalkError).toBeNull();
    console.log('✓ Event deleted successfully');

    // Verify chat was automatically deleted
    const { data: chatAfter, error: chatAfterError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', testChatId)
      .single();

    // Should return null because chat was deleted
    expect(chatAfter).toBeNull();
    console.log('✓ Group chat automatically deleted with event');

    // Verify participants were also deleted (CASCADE from chat deletion)
    const { data: participantsAfter, error: participantsAfterError } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('chat_id', testChatId);

    expect(participantsAfterError).toBeNull();
    expect(participantsAfter).toHaveLength(0);
    console.log('✓ Chat participants automatically cleaned up');

    // Verify messages were also deleted (CASCADE from chat deletion)
    const { data: messagesAfter, error: messagesAfterError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', testChatId);

    expect(messagesAfterError).toBeNull();
    expect(messagesAfter).toHaveLength(0);
    console.log('✓ Chat messages automatically cleaned up');
  });

  test('PRESERVATION: Direct chats are not affected by event deletion', async () => {
    console.log('Testing preservation: Direct chats remain unaffected');
    console.log('');

    // Create a direct chat (not linked to any event)
    const { data: directChat, error: directChatError } = await supabase
      .from('chats')
      .insert({
        type: 'direct',
        walk_id: null // Direct chats are not linked to events
      })
      .select()
      .single();

    if (directChatError) throw directChatError;

    // Add participants to direct chat
    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert({
        chat_id: directChat.id,
        user_id: testUserId,
        role: 'member'
      });

    expect(participantError).toBeNull();

    // Create another event and delete it
    const { data: anotherWalk, error: walkError } = await supabase
      .from('walks')
      .insert({
        user_id: testUserId,
        title: 'Another Walk',
        start_time: new Date().toISOString(),
        duration: 3600,
        latitude: 50.4501,
        longitude: 30.5234
      })
      .select()
      .single();

    if (walkError) throw walkError;

    // Delete the other event
    const { error: deleteError } = await supabase
      .from('walks')
      .delete()
      .eq('id', anotherWalk.id);

    expect(deleteError).toBeNull();

    // Verify direct chat still exists
    const { data: directChatAfter, error: directChatAfterError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', directChat.id)
      .single();

    expect(directChatAfterError).toBeNull();
    expect(directChatAfter).toBeTruthy();
    console.log('✓ Direct chats remain unaffected by event deletions');

    // Clean up direct chat
    await supabase.from('chat_participants').delete().eq('chat_id', directChat.id);
    await supabase.from('chats').delete().eq('id', directChat.id);
  });

  test('EDGE CASE: Group chat without walk_id remains unaffected', async () => {
    console.log('Testing edge case: Group chats without walk_id');
    console.log('');

    // Create a group chat without walk_id (edge case)
    const { data: orphanChat, error: orphanChatError } = await supabase
      .from('chats')
      .insert({
        type: 'group',
        walk_id: null // Group chat without event link
      })
      .select()
      .single();

    if (orphanChatError) throw orphanChatError;

    // Create and delete an event
    const { data: tempWalk, error: tempWalkError } = await supabase
      .from('walks')
      .insert({
        user_id: testUserId,
        title: 'Temp Walk',
        start_time: new Date().toISOString(),
        duration: 3600,
        latitude: 50.4501,
        longitude: 30.5234
      })
      .select()
      .single();

    if (tempWalkError) throw tempWalkError;

    const { error: deleteTempError } = await supabase
      .from('walks')
      .delete()
      .eq('id', tempWalk.id);

    expect(deleteTempError).toBeNull();

    // Verify orphan group chat still exists
    const { data: orphanChatAfter, error: orphanChatAfterError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', orphanChat.id)
      .single();

    expect(orphanChatAfterError).toBeNull();
    expect(orphanChatAfter).toBeTruthy();
    console.log('✓ Group chats without walk_id remain unaffected');

    // Clean up orphan chat
    await supabase.from('chats').delete().eq('id', orphanChat.id);
  });
});