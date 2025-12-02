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
import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';

interface ChatViewProps {
  currentUser: User;
  chat: ChatType | null;
  onSendMessage: (text: string) => void;
  onClearChat: (chatId: string) => void;
  onUnfriend: (friendId: string) => void;
  allUsers: User[];
  isBotTyping?: boolean;
}


export function ChatView({ 
    currentUser, 
    chat, 
    onSendMessage, 
    onClearChat, 
    onUnfriend, 
    allUsers,
    isBotTyping,
}: ChatViewProps) {
  const firestore = useFirestore();

  const messagesQuery = useMemoFirebase(
    () =>
      firestore && chat && chat.id !== 'chromebot'
        ? query(
            collection(firestore, 'chats', chat.id, 'messages'),
            orderBy('timestamp', 'asc')
          )
        : null,
    [firestore, chat]
  );
  
  const { data: messagesFromDb } = useCollection<Message>(messagesQuery);
  const messages = chat?.id === 'chromebot' ? chat.messages : messagesFromDb;
  
  if (!chat) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
        <div className="absolute left-4 top-4">
          <SidebarTrigger />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
            <Logo className="mb-4" />
            <h2 className="text-2xl font-bold tracking-tight">Welcome to ChromeChat</h2>
            <p className="text-muted-foreground">Select a friend to start a conversation, or talk to our AI assistant!</p>
        </div>
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
      {chat.id === 'chromebot' ? (
        <header className="flex h-16 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-3">
            <SidebarTrigger className="md:hidden" />
            <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-5 w-5" />
                </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-semibold">{partner.username}</h2>
            </div>
        </header>
      ) : (
        <ChatHeader 
          partner={partner}
          onClearChat={() => onClearChat(chat.id)}
          onUnfriend={() => onUnfriend(partner.id)}
        />
      )}
      <MessageList 
        messages={messages || []} 
        currentUserId={currentUser.id}
        partner={partner}
      />
      {isBotTyping && (
         <div className="flex items-center gap-2 p-4">
            <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-3 rounded-full animation-delay-200" />
                <Skeleton className="h-3 w-3 rounded-full animation-delay-400" />
            </div>
         </div>
      )}
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
