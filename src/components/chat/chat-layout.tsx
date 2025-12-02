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
import { mockChats, mockMessages } from '@/lib/mock-data';

export function ChatLayout() {
  const { user, logout, users: allUsers } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [friends, setFriends] = useState<User[]>([]);

  useEffect(() => {
    // Load chats and messages from localStorage on component mount
    if (user) {
      const savedChats = localStorage.getItem(`chromechat-chats-${user.id}`);
      const savedMessages = localStorage.getItem(`chromechat-messages-${user.id}`);
      
      const loadedChats = savedChats ? JSON.parse(savedChats) : mockChats.filter(c => c.participantIds.includes(user.id));
      const loadedMessages = savedMessages ? JSON.parse(savedMessages) : mockMessages;

      setChats(loadedChats);
      setAllMessages(loadedMessages);
    }
  }, [user]);

  useEffect(() => {
    // Save chats and messages to localStorage whenever they change
    if (user) {
      localStorage.setItem(`chromechat-chats-${user.id}`, JSON.stringify(chats));
      localStorage.setItem(`chromechat-messages-${user.id}`, JSON.stringify(allMessages));
    }
  }, [chats, allMessages, user]);

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
    if (chat) {
        const chatMessages = allMessages.filter(m => m.chatId === chatId);
        setSelectedChat({ ...chat, messages: chatMessages });
    }
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

    setSelectedChat(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
  };

  const handleClearChat = (chatId: string) => {
    setAllMessages(prev => prev.filter(m => m.chatId !== chatId));
    if (selectedChat?.id === chatId) {
        setSelectedChat(prev => prev ? { ...prev, messages: [] } : null);
    }
  };

  const handleUnfriend = (friendId: string) => {
    if (!user) return;
    const chatToRemove = chats.find(chat => chat.participantIds.includes(user.id) && chat.participantIds.includes(friendId));
    
    if(chatToRemove) {
        setAllMessages(prev => prev.filter(m => m.chatId !== chatToRemove.id));
    }
    
    const newChats = chats.filter(chat => !(chat.participantIds.includes(user.id) && chat.participantIds.includes(friendId)));
    setChats(newChats);

    if (selectedChat?.participantIds.includes(friendId)) {
        setSelectedChat(null);
    }
  };

  const handleAddFriend = (friendId: string) => {
    if (!user || friends.some(f => f.id === friendId)) return;

    const existingChat = chats.find(c => c.participantIds.includes(user.id) && c.participantIds.includes(friendId));
    if (existingChat) {
        handleSelectChat(existingChat.id);
        return;
    }

    const newChat: Chat = {
        id: `chat-${Date.now()}`,
        participantIds: [user.id, friendId],
        messages: [],
    };

    setChats(prev => [...prev, newChat]);
    setSelectedChat(newChat);
  };


  if (!user) return null;

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full">
        <AppSidebar
          user={user}
          chats={chats}
          allUsers={allUsers}
          onSelectChat={handleSelectChat}
          onLogout={logout}
          selectedChatId={selectedChat?.id}
          friends={friends}
          onAddFriend={handleAddFriend}
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
