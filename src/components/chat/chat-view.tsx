'use client';

import type { User, Chat, Message } from '@/lib/types';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { MessageSquare } from 'lucide-react';
import { Logo } from '../logo';

interface ChatViewProps {
  user: User;
  chat: Chat | null;
  onSendMessage: (text: string) => void;
  onClearChat: (chatId: string) => void;
  onUnfriend: (friendId: string) => void;
  allUsers: User[];
}

export function ChatView({ user, chat, onSendMessage, onClearChat, onUnfriend, allUsers }: ChatViewProps) {
  if (!chat) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
        <div className="flex flex-col items-center gap-2 text-center">
            <Logo className="mb-4" />
            <h2 className="text-2xl font-bold tracking-tight">Welcome to ChromeChat</h2>
            <p className="text-muted-foreground">Select a friend from the sidebar to start a conversation.</p>
        </div>
      </div>
    );
  }

  const partnerId = chat.participantIds.find(id => id !== user.id);
  const partner = allUsers.find(u => u.id === partnerId);

  if (!partner) {
     return <div className="flex h-full flex-col items-center justify-center gap-4 bg-background"><p>User not found.</p></div>
  }

  return (
    <div className="flex h-screen flex-col bg-card">
      <ChatHeader 
        partner={partner}
        onClearChat={() => onClearChat(chat.id)}
        onUnfriend={() => onUnfriend(partner.id)}
      />
      <MessageList messages={chat.messages} currentUserId={user.id} />
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
