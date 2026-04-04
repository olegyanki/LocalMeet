# Система чатів

> Універсальна система чатів: групові (прив'язані до подій), direct (1-на-1), та live (lazy creation).

## Типи чатів

### Group Chat (Regular Event)
- Створюється автоматично при створенні події (тригер `create_group_chat_on_walk_insert`)
- Автор події стає `owner`
- Учасники додаються при прийнятті walk request (тригер `add_participant_on_request_accept`)
- Owner може видаляти учасників
- При виході owner — ownership передається іншому учаснику

### Group Chat (Live Event)
- НЕ створюється при створенні live-прогулянки
- Створюється лазі: або тригером при першому accepted request, або через `getOrCreateChatForWalk()`
- Порожні чати завершених live-подій приховуються зі списку (фільтр в RPC)
- Відображення:
  - Не-owner бачить: "Прогулянка [ім'я автора]"
  - Owner бачить: "Твоя прогулянка · [дата]"
  - Аватарка чату = аватарка автора (не зображення події)

### Direct Chat
- Мігровані зі старої системи 1-на-1 чатів
- Обидва учасники мають роль `member`
- `walk_id = NULL`

## Потік даних

### Список чатів
```
ChatsListScreen
  → useChatsData() хук
    → getMyChats(userId) — RPC get_my_chats_optimized
    → Real-time підписки на: messages, chat_participants, walks (UPDATE)
  → Badge count sync при mount та pull-to-refresh
  → рендерить список ChatWithDetails
```

### Екран чату
```
ChatScreen
  → useChatData(chatId) — деталі чату
  → useChatMessages(chatId) — повідомлення + real-time
  → useSendMessage(chatId) — відправка
  → useImagePicker() — вибір зображень
```

## Ключові файли

| Файл | Опис |
|---|---|
| `src/shared/lib/api/chats.ts` | API: getMyChats, getChatDetails, leaveChat, etc. |
| `src/shared/lib/api/messages.ts` | API: getChatMessages, sendMessage, markAsRead |
| `src/features/chats/hooks/useChatsData.ts` | Хук для списку чатів |
| `src/features/chats/hooks/useChatData.ts` | Хук для одного чату |
| `src/features/chats/hooks/useChatMessages.ts` | Хук для повідомлень + real-time |
| `src/features/chats/screens/ChatsListScreen.tsx` | Екран списку чатів |
| `src/features/chats/screens/ChatScreen.tsx` | Екран чату |
| `src/features/chats/components/ChatHeader.tsx` | Хедер чату |
| `src/features/chats/components/ChatMessage.tsx` | Бабл повідомлення |
| `src/features/chats/components/ChatInput.tsx` | Інпут для повідомлень |

## Нюанси

- `duration` в walks зберігається в **секундах**, не хвилинах
- Unread count рахується тільки для повідомлень від інших (не від себе)
- При видаленні чату — messages і participants видаляються каскадно (ON DELETE CASCADE)
- Walk request скидається на `pending` коли учасник покидає чат (тригер)
- `getOrCreateChatForWalk` — ідемпотентна, безпечно викликати кілька разів
- Чати прив'язані до soft-deleted подій (`deleted = true`) автоматично приховуються з RPC
- `useChatsData` підписується на зміни в `messages`, `chat_participants` та `walks` (UPDATE) для real-time оновлень
- Badge counts синхронізуються при mount екрану чатів та при accept/reject запитів
