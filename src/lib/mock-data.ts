import type { User, Chat, Message } from './types';

// Mock Users
export const mockUsers: User[] = [
  { id: 'user-1', username: 'You', email: 'you@test.com', password: 'password123' },
  { id: 'user-2', username: 'Alice', email: 'alice@test.com', password: 'password123' },
  { id: 'user-3', username: 'Bob', email: 'bob@test.com', password: 'password123' },
  { id: 'user-4', username: 'Charlie', email: 'charlie@test.com', password: 'password123' },
  { id: 'user-5', username: 'David', email: 'david@test.com', password: 'password123' },
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    chatId: 'chat-1',
    senderId: 'user-2',
    text: 'Hey there! How are you?',
    timestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: 'msg-2',
    chatId: 'chat-1',
    senderId: 'user-1',
    text: 'Hey Alice! I am doing great, thanks for asking. How about you?',
    timestamp: Date.now() - 1000 * 60 * 4,
  },
  {
    id: 'msg-3',
    chatId: 'chat-1',
    senderId: 'user-2',
    text: 'I am good too. Just working on the new project.',
    timestamp: Date.now() - 1000 * 60 * 3,
  },
  {
    id: 'msg-4',
    chatId: 'chat-2',
    senderId: 'user-3',
    text: 'Do you have the report?',
    timestamp: Date.now() - 1000 * 60 * 10,
  },
];

// Mock Chats
export const mockChats: Chat[] = [
  {
    id: 'chat-1',
    participantIds: ['user-1', 'user-2'],
    messages: mockMessages.filter((m) => m.chatId === 'chat-1'),
  },
  {
    id: 'chat-2',
    participantIds: ['user-1', 'user-3'],
    messages: mockMessages.filter((m) => m.chatId === 'chat-2'),
  },
];
