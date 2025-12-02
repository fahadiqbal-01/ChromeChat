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

interface ChatViewProps {
  currentUser: User;
  chat: ChatType | null;
  onSendMessage: (text: string) => void;
  onClearChat: (chatId: string) => void;
  onUnfriend: (friendId: string) => void;
  allUsers: User[];
  isBotTyping?: boolean;
}

const chromeBotUser: User = {
    id: 'chromebot',
    username: 'ChromeBot',
    email: 'bot@chromebot.ai'
};

export function ChatView({ 
    currentUser, 
    chat, 
    onSendMessage, 
    onClearChat, 
    onUnfriend, 
    allUsers,
    isBotTyping 
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
  
  const { data: firestoreMessages } = useCollection<Message>(messagesQuery);
  
  const messages = chat?.id === 'chromebot' ? chat.messages : firestoreMessages;

  if (!chat) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
        <div className="absolute left-4 top-4">
          <SidebarTrigger />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
            <Logo className="mb-4" />
            <h2 className="text-2xl font-bold tracking-tight">Welcome to ChromeChat</h2>
            <p className="text-muted-foreground">Select a friend from the sidebar to start a conversation.</p>
        </div>
      </div>
    );
  }

  const partnerId = chat.participantIds.find(id => id !== currentUser.id);
  const partner = chat.id === 'chromebot' 
    ? chromeBotUser 
    : allUsers.find(u => u.id === partnerId);


  if (!partner) {
     return <div className="flex h-full flex-col items-center justify-center gap-4 bg-background"><p>User not found.</p></div>
  }

  return (
    <div className="flex h-screen flex-col bg-card">
      <ChatHeader 
        partner={partner}
        onClearChat={() => onClearChat(chat.id)}
        onUnfriend={() => onUnfriend(partner.id)}
        isBot={chat.id === 'chromebot'}
      />
      <MessageList 
        messages={messages || []} 
        currentUserId={currentUser.id} 
        isBotTyping={isBotTyping}
        botUser={chromeBotUser}
        />
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
