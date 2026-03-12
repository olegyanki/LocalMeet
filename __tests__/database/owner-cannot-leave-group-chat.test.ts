import { supabase } from '../../src/shared/lib/supabase';

describe('Owner Cannot Leave Group Chat', () => {
  let testUserId: string;
  let testChatId: string;
  let testWalkId: string;

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
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('chat_participants').delete().eq('chat_id', testChatId);
    await supabase.from('chats').delete().eq('id', testChatId);
    await supabase.from('walks').delete().eq('id', testWalkId);
    await supabase.from('profiles').delete().eq('id', testUserId);
  });

  test('RESTRICTION: Owner cannot leave group chat while event exists', async () => {
    console.log('Testing restriction: Event owner cannot leave group chat while event exists');
    console.log('');
    console.log('Business Rule:');
    console.log('  - Event owners must remain in group chats to coordinate the event');
    console.log('  - This ensures participants can always reach the organizer');
    console.log('  - Once event is deleted, the chat is automatically deleted too');
    console.log('');

    // Attempt to delete owner's participation (leave chat)
    const { error } = await supabase
      .from('chat_participants')
      .delete()
      .eq('chat_id', testChatId)
      .eq('user_id', testUserId);

    // Should fail due to RLS policy
    expect(error).toBeTruthy();
    console.log('✓ Database correctly prevents owner from leaving group chat');

    // Verify owner is still in the chat
    const { data: participants, error: fetchError } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('chat_id', testChatId)
      .eq('user_id', testUserId);

    expect(fetchError).toBeNull();
    expect(participants).toHaveLength(1);
    expect(participants![0].role).toBe('owner');
    console.log('✓ Owner remains in the group chat while event exists');
  });

  test('PRESERVATION: Regular members can still leave group chats', async () => {
    console.log('Testing preservation: Regular members can leave group chats');
    console.log('');

    // Create another user as regular member
    const memberId = '00000000-0000-0000-0000-000000000002';
    
    const { error: memberError } = await supabase
      .from('profiles')
      .insert({
        id: memberId,
        username: 'testmember',
        display_name: 'Test Member'
      });

    if (memberError) throw memberError;

    // Add member to chat
    const { error: addError } = await supabase
      .from('chat_participants')
      .insert({
        chat_id: testChatId,
        user_id: memberId,
        role: 'member'
      });

    expect(addError).toBeNull();

    // Member should be able to leave
    const { error: leaveError } = await supabase
      .from('chat_participants')
      .delete()
      .eq('chat_id', testChatId)
      .eq('user_id', memberId);

    expect(leaveError).toBeNull();
    console.log('✓ Regular members can leave group chats');

    // Clean up member
    await supabase.from('profiles').delete().eq('id', memberId);
  });

  test('PRESERVATION: Users can still leave direct chats', async () => {
    console.log('Testing preservation: Users can leave direct chats');
    console.log('');

    // Create direct chat
    const { data: directChat, error: directChatError } = await supabase
      .from('chats')
      .insert({
        type: 'direct'
      })
      .select()
      .single();

    if (directChatError) throw directChatError;

    // Add user as member (not owner) in direct chat
    const { error: addError } = await supabase
      .from('chat_participants')
      .insert({
        chat_id: directChat.id,
        user_id: testUserId,
        role: 'member'
      });

    expect(addError).toBeNull();

    // User should be able to leave direct chat
    const { error: leaveError } = await supabase
      .from('chat_participants')
      .delete()
      .eq('chat_id', directChat.id)
      .eq('user_id', testUserId);

    expect(leaveError).toBeNull();
    console.log('✓ Users can leave direct chats');

    // Clean up direct chat
    await supabase.from('chats').delete().eq('id', directChat.id);
  });
});