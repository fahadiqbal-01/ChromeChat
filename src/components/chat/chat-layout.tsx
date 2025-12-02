'use client';

import React, { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { ChatView } from './chat-view';
import { useAuth } from '@/hooks/use-auth';
import type { Chat, Message, User } from '@/lib/types';
import { mockChats, mockMessages, mockUsers } from '@/lib/mock-data';

export function ChatLayout() {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [allMessages, setAllMessages] = useState<Message[]>(mockMessages);
  const [allUsers] = useState<User[]>(mockUsers);
  const [friends, setFriends] = useState<User[]>([]);

  useEffect(() => {
    if (user) {
      const userChats = chats.filter(c => c.participantIds.includes(user.id));
      const friendIds = userChats.flatMap(c => c.participantIds).filter(id => id !== user.id);
      const uniqueFriendIds = [...new Set(friendIds)];
      const friendUsers = allUsers.filter(u => uniqueFriendIds.includes(u.id));
      setFriends(friendUsers);
    }
  }, [user, chats, allUsers]);

  const handleSelectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    setSelectedChat(chat || null);
  };
  
  const handleSendMessage = (text: string) => {
    if (!selectedChat || !user) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: selectedChat.id,
      senderId: user.id,
      text,
      timestamp: Date.now(),
    };

    setAllMessages(prev => [...prev, newMessage]);

    setChats(prevChats => prevChats.map(chat => 
        chat.id === selectedChat.id 
        ? { ...chat, messages: [...chat.messages, newMessage] }
        : chat
    ));

    setSelectedChat(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
  };

  const handleClearChat = (chatId: string) => {
    setAllMessages(prev => prev.filter(m => m.chatId !== chatId));
    setChats(prevChats => prevChats.map(chat => 
        chat.id === chatId ? { ...chat, messages: [] } : chat
    ));
    setSelectedChat(prev => (prev && prev.id === chatId) ? { ...prev, messages: [] } : prev);
  };

  const handleUnfriend = (friendId: string) => {
    if (!user) return;
    const newChats = chats.filter(chat => !(chat.participantIds.includes(user.id) && chat.participantIds.includes(friendId)));
    setChats(newChats);
    setFriends(prev => prev.filter(f => f.id !== friendId));
    if (selectedChat?.participantIds.includes(friendId)) {
        setSelectedChat(null);
    }
  };


  if (!user) return null;

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full">
        <AppSidebar
          user={user}
          chats={chats.filter(c => c.participantIds.includes(user.id))}
          allUsers={allUsers}
          onSelectChat={handleSelectChat}
          onLogout={logout}
          selectedChatId={selectedChat?.id}
          friends={friends}
        />
        <SidebarInset className="flex-1 flex flex-col">
          <ChatView
            user={user}
            chat={selectedChat}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onUnfriend={handleUnfriend}
            allUsers={allUsers}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
