'use client';

import type { User } from '@/lib/types';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Logo } from '../logo';
import { SidebarTrigger } from '../ui/sidebar';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import type { Chat as ChatType, Message } from '@/lib/types';
import type { AiMessage } from '@/ai/flows/types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Bot, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { AiMessageList } from './ai-message-list';

interface ChatViewProps {
  currentUser: User;
  chat: ChatType | null;
  onSendMessage: (text: string) => void;
  onClearChat: (chatId: string) => void;
  onUnfriend: (friendId: string) => void;
  allUsers: User[];
  isAiChatActive: boolean;
  aiChatHistory: AiMessage[];
  isAiLoading: boolean;
}


export function ChatView({ 
    currentUser, 
    chat, 
    onSendMessage, 
    onClearChat, 
    onUnfriend, 
    allUsers,
    isAiChatActive,
    aiChatHistory,
    isAiLoading,
}: ChatViewProps) {
  const firestore = useFirestore();

  const messagesQuery = useMemoFirebase(
    () =>
      firestore && chat && !isAiChatActive
        ? query(
            collection(firestore, 'chats', chat.id, 'messages'),
            orderBy('timestamp', 'asc')
          )
        : null,
    [firestore, chat, isAiChatActive]
  );
  
  const { data: messages } = useCollection<Message>(messagesQuery);
  
  if (!chat && !isAiChatActive) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
        <div className="absolute left-4 top-4">
          <SidebarTrigger />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
            <Logo className="mb-4" />
            <h2 className="text-2xl font-bold tracking-tight">Welcome to ChromeChat</h2>
            <p className="text-muted-foreground">Select a friend or the AI bot to start a conversation.</p>
        </div>
      </div>
    );
  }

  if(isAiChatActive) {
    return (
        <div className="flex h-screen flex-col bg-card">
            <header className="flex h-16 items-center justify-between border-b bg-background px-4">
                <div className="flex items-center gap-3">
                    <SidebarTrigger className="md:hidden" />
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot size={20} />
                        </AvatarFallback>
                    </Avatar>
                    <h2 className="text-lg font-semibold">ChromeBot</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onClearChat('chromebot')} className="text-destructive">
                    <Trash2 className="h-5 w-5" />
                </Button>
            </header>
            <AiMessageList messages={aiChatHistory} isLoading={isAiLoading}/>
            <MessageInput onSendMessage={onSendMessage} />
        </div>
    );
  }

  const partnerId = chat.participantIds.find(id => id !== currentUser.id);
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
      <MessageList 
        messages={messages || []} 
        currentUserId={currentUser.id}
        partner={partner}
      />
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
