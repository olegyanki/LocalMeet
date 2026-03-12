# Design Document: Group Chat System

## Overview

This design document specifies the technical implementation for refactoring the LocalMeet chat system from 1-on-1 conversations to group chats for events. The current system supports only direct chats between two users (event creator and one participant). The new system will enable group conversations where all accepted participants of an event can communicate together.

### Current State

The existing chat system has these characteristics:
- **1-on-1 chats only**: Each chat connects exactly two users (requester and walker)
- **Walk request coupling**: Chats are created when walk requests are accepted
- **Direct participant references**: `chats` table has `requester_id` and `walker_id` columns
- **Limited scalability**: Cannot support more than 2 participants per chat

### Target State

The new group chat system will provide:
- **Multi-participant chats**: Support for 2-50 participants per chat
- **Event-based groups**: Automatic group creation when events are created
- **Flexible architecture**: Support for both group chats and future direct messages
- **Optimized performance**: O(1) database queries for chat list loading
- **Backward compatibility**: Existing 1-on-1 chats preserved and functional

### Key Design Decisions

1. **Participant Junction Table**: Use `chat_participants` table instead of direct foreign keys
2. **Chat Type Discrimination**: Add `type` column ('group' or 'direct') to support both chat types
3. **Event Association**: Link group chats to events via `walk_id` foreign key
4. **Role-Based Access**: Implement owner/member roles for participant management
5. **Database Triggers**: Automate group chat creation and participant addition
6. **RPC Optimization**: Single-query chat list loading to avoid N+1 problems



## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Native App                        │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                    │
│  ├─ ChatsListScreen (displays all group chats)             │
│  ├─ ChatScreen (displays messages, sends messages)          │
│  └─ EventDetailsScreen (shows chat access)                  │
├─────────────────────────────────────────────────────────────┤
│  API Layer (@shared/lib/api.ts)                            │
│  ├─ getMyGroupChats(userId)                                │
│  ├─ getGroupChatMessages(chatId)                           │
│  ├─ sendGroupMessage(chatId, senderId, content)            │
│  ├─ leaveGroupChat(chatId, userId)                         │
│  └─ removeParticipant(chatId, userId, removedUserId)       │
├─────────────────────────────────────────────────────────────┤
│  Supabase Client                                            │
│  ├─ Real-time subscriptions (messages, participants)        │
│  └─ RPC function calls                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
├─────────────────────────────────────────────────────────────┤
│  RPC Functions                                              │
│  ├─ get_my_group_chats_optimized(user_id)                  │
│  └─ get_group_chat_details(chat_id)                        │
├─────────────────────────────────────────────────────────────┤
│  Database Triggers                                          │
│  ├─ create_group_chat_on_walk_insert()                     │
│  ├─ add_participant_on_request_accept()                    │
│  └─ transfer_ownership_on_creator_leave()                  │
├─────────────────────────────────────────────────────────────┤
│  Row Level Security (RLS) Policies                         │
│  ├─ chat_participants: view/insert/delete own records      │
│  ├─ chats: view chats where user is participant            │
│  └─ messages: view/send messages in participant chats      │
├─────────────────────────────────────────────────────────────┤
│  Database Tables                                            │
│  ├─ chats (id, type, walk_id, created_at, updated_at)     │
│  ├─ chat_participants (id, chat_id, user_id, role, ...)   │
│  └─ messages (id, chat_id, sender_id, content, ...)       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Group Chat Creation Flow
```
User creates event
    ↓
walks table INSERT
    ↓
Trigger: create_group_chat_on_walk_insert()
    ↓
1. INSERT into chats (type='group', walk_id=new_walk.id)
    ↓
2. INSERT into chat_participants (user_id=creator, role='owner')
    ↓
Group chat ready for participants
```

#### Participant Addition Flow
```
Event creator accepts walk request
    ↓
walk_requests UPDATE (status='accepted')
    ↓
Trigger: add_participant_on_request_accept()
    ↓
1. Find chat WHERE walk_id = walk_request.walk_id
    ↓
2. INSERT into chat_participants (user_id=requester, role='member')
    ↓
Participant can now send/receive messages
```

#### Message Sending Flow
```
User sends message
    ↓
API: sendGroupMessage(chatId, senderId, content)
    ↓
RLS Policy: Verify user is chat participant
    ↓
INSERT into messages
    ↓
Real-time broadcast to all participants
    ↓
All participants receive message instantly
```



## Components and Interfaces

### Database Schema

#### New Table: chat_participants

```sql
CREATE TABLE public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)  -- Prevent duplicate memberships
);

CREATE INDEX chat_participants_chat_id_idx ON public.chat_participants(chat_id);
CREATE INDEX chat_participants_user_id_idx ON public.chat_participants(user_id);
```

**Purpose**: Junction table that connects users to chats with role information.

**Columns**:
- `id`: Unique identifier for the membership record
- `chat_id`: Reference to the chat
- `user_id`: Reference to the user/participant
- `role`: Either 'owner' (event creator) or 'member' (accepted participant)
- `joined_at`: Timestamp when user joined the chat

**Constraints**:
- UNIQUE(chat_id, user_id): Prevents a user from being added to the same chat twice
- CASCADE on chat deletion: When chat is deleted, all memberships are removed
- CASCADE on user deletion: When user is deleted, all their memberships are removed

#### Modified Table: chats

```sql
-- Add new columns
ALTER TABLE public.chats 
  ADD COLUMN type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('group', 'direct')),
  ADD COLUMN walk_id UUID REFERENCES public.walks(id) ON DELETE SET NULL;

-- Create index for walk_id lookups
CREATE INDEX chats_walk_id_idx ON public.chats(walk_id);

-- After data migration, remove old columns
ALTER TABLE public.chats 
  DROP COLUMN requester_id,
  DROP COLUMN walker_id;
```

**New Columns**:
- `type`: Discriminates between 'group' (event chats) and 'direct' (future 1-on-1 chats)
- `walk_id`: Links group chats to events (NULL for direct chats)

**Removed Columns** (after migration):
- `requester_id`: Replaced by chat_participants table
- `walker_id`: Replaced by chat_participants table

#### Unchanged Table: messages

The messages table requires no schema changes. It already supports:
- Multiple message types (text, image, audio)
- Sender identification
- Read status tracking
- Timestamps

### Database Triggers

#### Trigger 1: Auto-create group chat on event creation

```sql
CREATE OR REPLACE FUNCTION public.create_group_chat_on_walk_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_chat_id UUID;
BEGIN
  -- Create group chat for the new walk
  INSERT INTO public.chats (type, walk_id)
  VALUES ('group', NEW.id)
  RETURNING id INTO new_chat_id;
  
  -- Add walk creator as owner
  INSERT INTO public.chat_participants (chat_id, user_id, role)
  VALUES (new_chat_id, NEW.user_id, 'owner');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_group_chat_on_walk_insert_trigger
  AFTER INSERT ON public.walks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_group_chat_on_walk_insert();
```

**Purpose**: Automatically creates a group chat when an event is created and adds the creator as owner.

**Execution**: Runs AFTER INSERT on walks table.

**Operations**:
1. Insert new chat with type='group' and walk_id=new event id
2. Insert chat_participant record for event creator with role='owner'

#### Trigger 2: Auto-add participant on request acceptance

```sql
CREATE OR REPLACE FUNCTION public.add_participant_on_request_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_chat_id UUID;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Find the group chat for this walk
    SELECT id INTO target_chat_id
    FROM public.chats
    WHERE walk_id = NEW.walk_id AND type = 'group'
    LIMIT 1;
    
    -- If chat exists, add participant
    IF target_chat_id IS NOT NULL THEN
      INSERT INTO public.chat_participants (chat_id, user_id, role)
      VALUES (target_chat_id, NEW.requester_id, 'member')
      ON CONFLICT (chat_id, user_id) DO NOTHING;  -- Idempotent
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER add_participant_on_request_accept_trigger
  AFTER UPDATE ON public.walk_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.add_participant_on_request_accept();
```

**Purpose**: Automatically adds users to group chat when their walk request is accepted.

**Execution**: Runs AFTER UPDATE on walk_requests table.

**Operations**:
1. Check if status changed to 'accepted'
2. Find the group chat associated with the walk
3. Insert chat_participant record with role='member'
4. Use ON CONFLICT DO NOTHING for idempotency

#### Trigger 3: Transfer ownership on creator leave

```sql
CREATE OR REPLACE FUNCTION public.transfer_ownership_on_creator_leave()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  remaining_count INTEGER;
  next_owner_id UUID;
BEGIN
  -- Only proceed if deleting an owner
  IF OLD.role = 'owner' THEN
    -- Count remaining participants
    SELECT COUNT(*) INTO remaining_count
    FROM public.chat_participants
    WHERE chat_id = OLD.chat_id;
    
    -- If participants remain, transfer ownership
    IF remaining_count > 0 THEN
      -- Find earliest joined member
      SELECT user_id INTO next_owner_id
      FROM public.chat_participants
      WHERE chat_id = OLD.chat_id
      ORDER BY joined_at ASC
      LIMIT 1;
      
      -- Promote to owner
      UPDATE public.chat_participants
      SET role = 'owner'
      WHERE chat_id = OLD.chat_id AND user_id = next_owner_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER transfer_ownership_on_creator_leave_trigger
  BEFORE DELETE ON public.chat_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.transfer_ownership_on_creator_leave();
```

**Purpose**: Transfers ownership to the next participant when the owner leaves the chat.

**Execution**: Runs BEFORE DELETE on chat_participants table.

**Operations**:
1. Check if deleted participant is owner
2. Count remaining participants
3. If participants remain, find earliest joined member
4. Promote that member to owner role



### RPC Functions

#### Function 1: get_my_chats_optimized

```sql
CREATE OR REPLACE FUNCTION public.get_my_chats_optimized(p_user_id UUID)
RETURNS TABLE (
  chat_id UUID,
  chat_type TEXT,
  walk_id UUID,
  chat_updated_at TIMESTAMPTZ,
  walk_title TEXT,
  walk_image_url TEXT,
  walk_start_time TIMESTAMPTZ,
  participant_ids UUID[],
  participant_usernames TEXT[],
  participant_display_names TEXT[],
  participant_avatar_urls TEXT[],
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  last_message_sender_id UUID,
  last_message_read BOOLEAN,
  unread_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS chat_id,
    c.type AS chat_type,
    c.walk_id,
    c.updated_at AS chat_updated_at,
    w.title AS walk_title,
    w.image_url AS walk_image_url,
    w.start_time AS walk_start_time,
    -- Aggregate all participant IDs
    ARRAY_AGG(DISTINCT p.id ORDER BY p.id) AS participant_ids,
    ARRAY_AGG(DISTINCT p.username ORDER BY p.id) AS participant_usernames,
    ARRAY_AGG(DISTINCT p.display_name ORDER BY p.id) AS participant_display_names,
    ARRAY_AGG(DISTINCT p.avatar_url ORDER BY p.id) AS participant_avatar_urls,
    -- Last message details
    m.content AS last_message_content,
    m.created_at AS last_message_created_at,
    m.sender_id AS last_message_sender_id,
    m.read AS last_message_read,
    -- Unread count for this user
    (
      SELECT COUNT(*)::INTEGER
      FROM public.messages msg
      WHERE msg.chat_id = c.id 
        AND msg.sender_id != p_user_id
        AND msg.read = false
    ) AS unread_count
  FROM public.chats c
  -- Join to get user's membership
  INNER JOIN public.chat_participants cp ON cp.chat_id = c.id AND cp.user_id = p_user_id
  -- Join to get all participants
  INNER JOIN public.chat_participants cp_all ON cp_all.chat_id = c.id
  INNER JOIN public.profiles p ON cp_all.user_id = p.id
  -- Join to get walk details (for group chats)
  LEFT JOIN public.walks w ON c.walk_id = w.id
  -- Join to get last message
  LEFT JOIN LATERAL (
    SELECT msg.content, msg.created_at, msg.sender_id, msg.read
    FROM public.messages msg
    WHERE msg.chat_id = c.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) m ON true
  GROUP BY c.id, c.type, c.walk_id, c.updated_at, w.title, w.image_url, w.start_time,
           m.content, m.created_at, m.sender_id, m.read
  ORDER BY c.updated_at DESC;
END;
$$;
```

**Purpose**: Fetch all chats for a user with complete details in a single query (O(1) complexity).

**Returns**: All chats where user is a participant, with:
- Chat metadata (id, type, timestamps)
- Event details (title, image, start time)
- All participant information (aggregated arrays)
- Last message details
- Unread message count

**Performance**: Single query replaces 1 + 3N queries (where N = number of chats).

#### Function 2: get_chat_details

```sql
CREATE OR REPLACE FUNCTION public.get_chat_details(p_chat_id UUID, p_user_id UUID)
RETURNS TABLE (
  chat_id UUID,
  chat_type TEXT,
  walk_id UUID,
  walk_title TEXT,
  walk_image_url TEXT,
  walk_start_time TIMESTAMPTZ,
  participant_id UUID,
  participant_username TEXT,
  participant_display_name TEXT,
  participant_avatar_url TEXT,
  participant_role TEXT,
  participant_joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_id = p_chat_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant of this chat';
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id AS chat_id,
    c.type AS chat_type,
    c.walk_id,
    w.title AS walk_title,
    w.image_url AS walk_image_url,
    w.start_time AS walk_start_time,
    p.id AS participant_id,
    p.username AS participant_username,
    p.display_name AS participant_display_name,
    p.avatar_url AS participant_avatar_url,
    cp.role AS participant_role,
    cp.joined_at AS participant_joined_at
  FROM public.chats c
  LEFT JOIN public.walks w ON c.walk_id = w.id
  INNER JOIN public.chat_participants cp ON cp.chat_id = c.id
  INNER JOIN public.profiles p ON cp.user_id = p.id
  WHERE c.id = p_chat_id
  ORDER BY cp.joined_at ASC;
END;
$$;
```

**Purpose**: Fetch detailed information about a specific chat including all participants.

**Security**: Verifies user is a participant before returning data.

**Returns**: Chat details with all participants (one row per participant).



### Row Level Security (RLS) Policies

#### Policies for chat_participants table

```sql
-- Enable RLS
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Users can view participants of chats they're in
CREATE POLICY "Users can view participants of their chats"
  ON public.chat_participants FOR SELECT
  USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

-- System can insert participants (via triggers)
CREATE POLICY "System can insert participants"
  ON public.chat_participants FOR INSERT
  WITH CHECK (true);  -- Controlled by triggers with SECURITY DEFINER

-- Users can leave chats (delete their own membership)
CREATE POLICY "Users can leave chats"
  ON public.chat_participants FOR DELETE
  USING (user_id = auth.uid());

-- Owners can remove other participants
CREATE POLICY "Owners can remove participants"
  ON public.chat_participants FOR DELETE
  USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

#### Updated Policies for chats table

```sql
-- Users can view chats they're participants of
CREATE POLICY "Users can view their chats"
  ON public.chats FOR SELECT
  USING (
    id IN (
      SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

-- System creates chats (via triggers)
CREATE POLICY "System can create chats"
  ON public.chats FOR INSERT
  WITH CHECK (true);  -- Controlled by triggers with SECURITY DEFINER

-- No direct updates to chats (use triggers)
-- No direct deletes (cascade from walks or manual admin action)
```

#### Updated Policies for messages table

```sql
-- Users can view messages in chats they're participants of
CREATE POLICY "Users can view messages in their chats"
  ON public.messages FOR SELECT
  USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

-- Users can send messages to chats they're participants of
CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    chat_id IN (
      SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

-- Users can update read status of messages
CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE
  USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );
```

### API Layer Design

#### TypeScript Types

```typescript
// Universal chat types (works for both group and direct chats)
export interface Chat {
  id: string;
  type: 'group' | 'direct';
  walk_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile: UserProfile;
}

export interface ChatWithDetails {
  id: string;
  type: 'group' | 'direct';
  walk_id: string | null;
  walk_title?: string;
  walk_image_url?: string | null;
  walk_start_time?: string;
  participants: ChatParticipant[];
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean;
  };
  unread_count: number;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  image_url?: string | null;
  audio_url?: string | null;
  audio_duration?: number | null;
  read: boolean;
  created_at: string;
  sender?: UserProfile;
}
```

#### API Functions

```typescript
// Get all chats for a user (both group and direct)
export async function getMyChats(userId: string): Promise<ChatWithDetails[]> {
  const { data, error } = await supabase.rpc('get_my_chats_optimized', {
    p_user_id: userId,
  });

  if (error) throw error;

  return data.map((row: any) => ({
    id: row.chat_id,
    type: row.chat_type,
    walk_id: row.walk_id,
    walk_title: row.walk_title,
    walk_image_url: row.walk_image_url,
    walk_start_time: row.walk_start_time,
    participants: row.participant_ids.map((id: string, index: number) => ({
      id: id,
      user_id: id,
      profile: {
        id: id,
        username: row.participant_usernames[index],
        display_name: row.participant_display_names[index],
        avatar_url: row.participant_avatar_urls[index],
      },
    })),
    lastMessage: row.last_message_content ? {
      content: row.last_message_content,
      created_at: row.last_message_created_at,
      sender_id: row.last_message_sender_id,
      read: row.last_message_read,
    } : undefined,
    unread_count: row.unread_count,
  }));
}

// Get messages for a chat (works for both group and direct)
export async function getChatMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(*)
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Send a message to a chat (works for both group and direct)
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  imageUrl?: string,
  audioUrl?: string,
  audioDuration?: number
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      content,
      image_url: imageUrl,
      audio_url: audioUrl,
      audio_duration: audioDuration,
    })
    .select(`
      *,
      sender:profiles!sender_id(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

// Leave a chat (works for both group and direct)
export async function leaveChat(chatId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_participants')
    .delete()
    .eq('chat_id', chatId)
    .eq('user_id', userId);

  if (error) throw error;
}

// Remove a participant from a chat (owner only, typically for group chats)
export async function removeChatParticipant(
  chatId: string,
  removedUserId: string
): Promise<void> {
  const { error } = await supabase
    .from('chat_participants')
    .delete()
    .eq('chat_id', chatId)
    .eq('user_id', removedUserId);

  if (error) throw error;
}

// Mark all messages in a chat as read
export async function markChatAsRead(chatId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('chat_id', chatId)
    .neq('sender_id', userId)
    .eq('read', false);

  if (error) throw error;
}
```



## Data Models

### Entity Relationship Diagram

```
┌─────────────────┐
│     walks       │
│─────────────────│
│ id (PK)         │
│ user_id (FK)    │◄──────┐
│ title           │       │
│ start_time      │       │
│ ...             │       │
└─────────────────┘       │
        │                 │
        │ 1               │
        │                 │
        │ N               │
        ▼                 │
┌─────────────────┐       │
│     chats       │       │
│─────────────────│       │
│ id (PK)         │       │
│ type            │       │
│ walk_id (FK)    │───────┘
│ created_at      │
│ updated_at      │
└─────────────────┘
        │
        │ 1
        │
        │ N
        ▼
┌──────────────────────┐         ┌─────────────────┐
│  chat_participants   │    N    │    profiles     │
│──────────────────────│◄────────│─────────────────│
│ id (PK)              │         │ id (PK)         │
│ chat_id (FK)         │         │ username        │
│ user_id (FK)         │─────────│ display_name    │
│ role                 │    1    │ avatar_url      │
│ joined_at            │         │ ...             │
└──────────────────────┘         └─────────────────┘
        │                                 │
        │                                 │
        │                                 │
        │                                 │
        ▼                                 ▼
┌─────────────────┐                      │
│    messages     │                      │
│─────────────────│                      │
│ id (PK)         │                      │
│ chat_id (FK)    │──────────────────────┘
│ sender_id (FK)  │──────────────────────┘
│ content         │
│ image_url       │
│ audio_url       │
│ read            │
│ created_at      │
└─────────────────┘
```

### Cardinality Rules

1. **walks → chats**: One-to-One (each event has exactly one group chat)
2. **chats → chat_participants**: One-to-Many (each chat has multiple participants)
3. **profiles → chat_participants**: One-to-Many (each user can be in multiple chats)
4. **chats → messages**: One-to-Many (each chat has multiple messages)
5. **profiles → messages**: One-to-Many (each user can send multiple messages)

### Data Constraints

#### Business Rules

1. **Unique Participation**: A user cannot be added to the same chat twice (enforced by UNIQUE constraint)
2. **Owner Requirement**: Every group chat must have at least one owner
3. **Role Validation**: Participant role must be either 'owner' or 'member'
4. **Type Validation**: Chat type must be either 'group' or 'direct'
5. **Group Chat Association**: Group chats must have a walk_id, direct chats must have walk_id = NULL

#### Referential Integrity

1. **CASCADE on chat deletion**: When a chat is deleted, all participants and messages are deleted
2. **CASCADE on user deletion**: When a user is deleted, all their participations and messages are deleted
3. **SET NULL on walk deletion**: When a walk is deleted, the chat persists but walk_id becomes NULL
4. **RESTRICT on participant removal**: Cannot remove last owner without transferring ownership

### Migration Data Mapping

#### Current Schema → New Schema

```
Current chats table:
┌──────────────────────────────────────────┐
│ id | requester_id | walker_id | ...      │
├──────────────────────────────────────────┤
│ 1  | user_a       | user_b    | ...      │
│ 2  | user_c       | user_d    | ...      │
└──────────────────────────────────────────┘

New chats table:
┌────────────────────────────────────────────┐
│ id | type    | walk_id | ...              │
├────────────────────────────────────────────┤
│ 1  | direct  | NULL    | ...              │
│ 2  | direct  | NULL    | ...              │
└────────────────────────────────────────────┘

New chat_participants table:
┌──────────────────────────────────────────────┐
│ id | chat_id | user_id | role   | ...       │
├──────────────────────────────────────────────┤
│ 1  | 1       | user_a  | member | ...       │
│ 2  | 1       | user_b  | member | ...       │
│ 3  | 2       | user_c  | member | ...       │
│ 4  | 2       | user_d  | member | ...       │
└──────────────────────────────────────────────┘
```

**Mapping Rules**:
1. All existing chats become type='direct'
2. walk_id is set to NULL for all existing chats
3. For each chat, create two chat_participants records (requester and walker)
4. Both participants get role='member' (no owner for direct chats)
5. joined_at is set to chat.created_at for both participants



### Migration Strategy

The migration from the current 1-on-1 chat system to the new group chat system must be performed carefully to avoid data loss and maintain backward compatibility.

#### Phase 1: Schema Extension (Additive Changes)

```sql
-- Step 1: Create chat_participants table
CREATE TABLE public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

CREATE INDEX chat_participants_chat_id_idx ON public.chat_participants(chat_id);
CREATE INDEX chat_participants_user_id_idx ON public.chat_participants(user_id);

-- Step 2: Add new columns to chats table (nullable initially)
ALTER TABLE public.chats 
  ADD COLUMN type TEXT CHECK (type IN ('group', 'direct')),
  ADD COLUMN walk_id UUID REFERENCES public.walks(id) ON DELETE SET NULL;

CREATE INDEX chats_walk_id_idx ON public.chats(walk_id);
```

#### Phase 2: Data Migration

```sql
-- Step 3: Migrate existing chats to 'direct' type
UPDATE public.chats SET type = 'direct' WHERE type IS NULL;

-- Step 4: Create chat_participants records for existing chats
INSERT INTO public.chat_participants (chat_id, user_id, role, joined_at)
SELECT 
  id AS chat_id,
  requester_id AS user_id,
  'member' AS role,
  created_at AS joined_at
FROM public.chats
WHERE requester_id IS NOT NULL;

INSERT INTO public.chat_participants (chat_id, user_id, role, joined_at)
SELECT 
  id AS chat_id,
  walker_id AS user_id,
  'member' AS role,
  created_at AS joined_at
FROM public.chats
WHERE walker_id IS NOT NULL;

-- Step 5: Make type column NOT NULL after data migration
ALTER TABLE public.chats ALTER COLUMN type SET NOT NULL;
ALTER TABLE public.chats ALTER COLUMN type SET DEFAULT 'direct';
```

#### Phase 3: Install Triggers and RPC Functions

```sql
-- Step 6: Create trigger functions
CREATE OR REPLACE FUNCTION public.create_group_chat_on_walk_insert() ...
CREATE OR REPLACE FUNCTION public.add_participant_on_request_accept() ...
CREATE OR REPLACE FUNCTION public.transfer_ownership_on_creator_leave() ...

-- Step 7: Create triggers
CREATE TRIGGER create_group_chat_on_walk_insert_trigger ...
CREATE TRIGGER add_participant_on_request_accept_trigger ...
CREATE TRIGGER transfer_ownership_on_creator_leave_trigger ...

-- Step 8: Create RPC functions
CREATE OR REPLACE FUNCTION public.get_my_group_chats_optimized() ...
CREATE OR REPLACE FUNCTION public.get_group_chat_details() ...
```

#### Phase 4: Update RLS Policies

```sql
-- Step 9: Drop old policies
DROP POLICY IF EXISTS "Chats are viewable by participants" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Participants can delete chats" ON public.chats;
DROP POLICY IF EXISTS "Messages are viewable by chat participants" ON public.messages;
DROP POLICY IF EXISTS "Chat participants can insert messages" ON public.messages;

-- Step 10: Create new policies
CREATE POLICY "Users can view their chats" ON public.chats ...
CREATE POLICY "System can create chats" ON public.chats ...
CREATE POLICY "Users can view participants of their chats" ON public.chat_participants ...
CREATE POLICY "System can insert participants" ON public.chat_participants ...
CREATE POLICY "Users can leave chats" ON public.chat_participants ...
CREATE POLICY "Owners can remove participants" ON public.chat_participants ...
CREATE POLICY "Users can view messages in their chats" ON public.messages ...
CREATE POLICY "Participants can send messages" ON public.messages ...
```

#### Phase 5: Cleanup (After Verification)

```sql
-- Step 11: Remove old columns (only after verifying everything works)
ALTER TABLE public.chats DROP COLUMN requester_id;
ALTER TABLE public.chats DROP COLUMN walker_id;
ALTER TABLE public.chats DROP COLUMN walk_request_id;

-- Step 12: Drop old indexes
DROP INDEX IF EXISTS chats_requester_id_idx;
DROP INDEX IF EXISTS chats_walker_id_idx;
DROP INDEX IF EXISTS chats_walk_request_id_idx;
```

#### Rollback Strategy

If issues are discovered after migration:

1. **Before Phase 5**: Rollback is straightforward - drop new tables/columns and restore old policies
2. **After Phase 5**: Rollback requires restoring requester_id/walker_id from chat_participants table

```sql
-- Emergency rollback (before Phase 5 cleanup)
-- 1. Restore old RLS policies
-- 2. Drop new triggers
-- 3. Drop chat_participants table
-- 4. Remove type and walk_id columns
```

#### Validation Queries

After each phase, run these queries to verify correctness:

```sql
-- Verify all chats have a type
SELECT COUNT(*) FROM public.chats WHERE type IS NULL;  -- Should be 0

-- Verify all existing chats have exactly 2 participants
SELECT chat_id, COUNT(*) as participant_count
FROM public.chat_participants
GROUP BY chat_id
HAVING COUNT(*) != 2;  -- Should be empty for migrated chats

-- Verify no data loss in messages
SELECT COUNT(*) FROM public.messages;  -- Should match pre-migration count

-- Verify all participants can access their chats
SELECT cp.user_id, COUNT(DISTINCT cp.chat_id) as chat_count
FROM public.chat_participants cp
GROUP BY cp.user_id;  -- Should match expected counts
```



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several redundancies:

**Redundant Properties Eliminated:**
- 8.3 (only participants can send messages) is identical to 3.5 - eliminated
- 11.1 (single RPC call for chat list) is identical to 7.6 - eliminated
- Several integration test requirements (12.3, 12.4, 12.5, 13.5) cannot be tested as properties - marked as integration tests
- 8.5 (verify membership before operations) is a general principle covered by specific properties - eliminated

**Properties Combined:**
- Participant removal (4.2) and voluntary exit (5.2) both test access control after departure - combined into single property
- Message preservation for removed (4.3) and departed (5.3) participants - combined into single property
- Chat persistence properties (6.1, 6.2, 6.3) combined into comprehensive persistence property

### Group Chat Creation Properties

### Property 1: Event creation triggers group chat creation

For any event created in the system, a group chat with type='group' and walk_id pointing to that event must be created automatically.

**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Event creator becomes chat owner

For any event created, the event creator must be added as a chat participant with role='owner' in the associated group chat.

**Validates: Requirements 1.2**

### Property 3: Group chat creation is atomic with event creation

For any event creation attempt, either both the event and its group chat are created successfully, or neither exists (transaction atomicity).

**Validates: Requirements 1.5**

### Participant Management Properties

### Property 4: Accepted requests add participants

For any walk request that changes status to 'accepted', the requester must be added as a chat participant with role='member' to the event's group chat.

**Validates: Requirements 2.1, 2.2**

### Property 5: Participant addition is atomic with request acceptance

For any walk request acceptance, either both the request status update and participant addition succeed, or neither occurs (transaction atomicity).

**Validates: Requirements 2.3**

### Property 6: One group chat per event

For any event, there must be exactly one group chat associated with it, regardless of how many walk requests are accepted (idempotency).

**Validates: Requirements 2.4**

### Property 7: Owner removal transfers ownership

For any group chat where the owner leaves and other participants exist, the earliest joined member must be promoted to owner role.

**Validates: Requirements 5.5**

### Property 8: Departed participants lose access

For any participant removed from or leaving a chat, that user must not be able to view messages or send messages to that chat.

**Validates: Requirements 4.2, 5.2**

### Property 9: Historical messages are preserved

For any participant removed from or leaving a chat, all messages they previously sent must remain in the chat and be visible to remaining participants.

**Validates: Requirements 4.3, 5.3**

### Property 10: Only owners can remove participants

For any participant with role='member', attempting to remove another participant must fail. Only participants with role='owner' can remove others.

**Validates: Requirements 4.4**

### Property 11: Owner cannot abandon chat

For any group chat with multiple participants, the owner cannot remove themselves. The owner must either transfer ownership (by leaving) or wait until they are the last participant.

**Validates: Requirements 4.5**

### Property 12: Any participant can leave

For any participant (owner or member), they must be able to voluntarily leave the chat by deleting their own membership record.

**Validates: Requirements 5.4**

### Messaging Properties

### Property 13: Messages are visible to all participants

For any message sent to a group chat, all current participants of that chat must be able to query and view that message.

**Validates: Requirements 3.1**

### Property 14: Messages include sender profile

For any message query, the returned data must include the sender's profile information (username, display_name, avatar_url).

**Validates: Requirements 3.2**

### Property 15: Messages are chronologically ordered

For any chat, messages must be returned in ascending order by created_at timestamp (oldest first).

**Validates: Requirements 3.3**

### Property 16: All message types are supported

For any message type (text, image, audio), the system must successfully store and retrieve messages of that type.

**Validates: Requirements 3.4**

### Property 17: Only participants can send messages

For any user who is not a participant of a chat, attempting to send a message to that chat must fail with an authorization error.

**Validates: Requirements 3.5, 8.3**

### Property 18: Messages default to unread

For any newly created message, the read field must be false by default.

**Validates: Requirements 13.1**

### Property 19: Mark as read updates all unread messages

For any chat and user, calling markChatAsRead must set read=true for all messages in that chat where sender_id != user_id and read=false.

**Validates: Requirements 13.2**

### Property 20: Unread count excludes sender's messages

For any chat and user, the unread count must only include messages where sender_id != user_id and read=false.

**Validates: Requirements 13.4**

### Access Control Properties

### Property 21: Only participants can view chats

For any user who is not a participant of a chat, attempting to query that chat's details must fail or return no results.

**Validates: Requirements 8.1**

### Property 22: Only participants can view messages

For any user who is not a participant of a chat, attempting to query messages from that chat must fail or return no results.

**Validates: Requirements 8.2**

### Chat Persistence Properties

### Property 23: Chats persist after events end

For any group chat associated with an event, the chat and all its messages must remain accessible after the event's start_time has passed.

**Validates: Requirements 6.1, 6.2**

### Property 24: Chats persist after event deletion

For any group chat associated with an event, when the event is deleted, the chat and all its messages must be preserved (walk_id becomes NULL).

**Validates: Requirements 6.3**

### Property 25: Participants can access ended event chats

For any group chat associated with an ended event, participants must be able to view messages and send new messages.

**Validates: Requirements 6.4, 6.5**

### Chat List Properties

### Property 26: Chat list includes all user's chats

For any user, calling getMyGroupChats must return all chats where that user is a participant.

**Validates: Requirements 7.1**

### Property 27: Chat list includes event details

For any group chat in the chat list, the returned data must include the event's title and image_url.

**Validates: Requirements 7.2**

### Property 28: Chat list includes last message

For any chat in the chat list, the returned data must include the most recent message's content and timestamp.

**Validates: Requirements 7.3**

### Property 29: Chat list includes participant avatars

For any chat in the chat list, the returned data must include avatar_urls for all participants.

**Validates: Requirements 7.4**

### Property 30: Chat list is ordered by recency

For any user's chat list, chats must be ordered by the most recent message timestamp in descending order (most recent first).

**Validates: Requirements 7.5**

### Property 31: Chat list uses single query

For any user with N chats, calling getMyGroupChats must execute exactly 1 database query (via RPC function), not N+1 queries.

**Validates: Requirements 7.6, 11.1, 11.5**

### Property 32: Chat list includes unread count

For any chat in the chat list, the returned data must include the count of unread messages for the requesting user.

**Validates: Requirements 13.3**

### Migration Properties

### Property 33: Existing chats become direct type

For any chat that existed before migration, after migration it must have type='direct' and walk_id=NULL.

**Validates: Requirements 9.4**

### Property 34: Existing chats have two participants

For any chat that existed before migration, after migration it must have exactly two chat_participants records (one for requester, one for walker).

**Validates: Requirements 9.4**

### Property 35: Messages are preserved during migration

For any message that existed before migration, after migration it must exist with identical content, sender_id, chat_id, and timestamps.

**Validates: Requirements 9.7**

### Property 36: No data loss during migration

For any table (chats, messages), the row count after migration must equal or exceed the row count before migration.

**Validates: Requirements 9.8**

### Architecture Properties

### Property 37: Group chats have walk_id, direct chats don't

For any chat with type='group', walk_id must not be NULL. For any chat with type='direct', walk_id must be NULL.

**Validates: Requirements 10.2**

### Property 38: API functions throw descriptive errors

For any API function that fails due to invalid input or authorization, it must throw an error with a descriptive message indicating the failure reason.

**Validates: Requirements 14.8**

