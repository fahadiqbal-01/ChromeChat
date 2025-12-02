'use client';

import React, { useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  serverTimestamp,
  getDocs,
  doc,
  writeBatch,
  deleteDoc,
  getDoc,
  addDoc,
  increment,
  updateDoc,
} from 'firebase/firestore';
import { SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { ChatView } from './chat-view';
import { useAuth } from '@/hooks/use-auth';
import type { Chat, User, Message as MessageType } from '@/lib/types';
import {
  useCollection,
  useMemoFirebase,
  useFirestore,
  useUser,
} from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { chatWithChromeBot, type ChatInput } from '@/ai/flows/chatbot-flow';
import { Timestamp } from 'firebase/firestore';


interface AiMessage {
  id: string | number;
  role: 'user' | 'model';
  content: string;
  timestamp: Timestamp;
}

export function ChatLayout() {
  const { user } = useUser();
  const { logout } = useAuth();
  const firestore = useFirestore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>('chromebot');
  const [aiChatHistory, setAiChatHistory] = useState<AiMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLogoClick = () => {
    setSelectedChatId(null);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const chatsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, 'chats'),
            where('participantIds', 'array-contains', user.uid)
          )
        : null,
    [firestore, user]
  );

  const { data: allUsers } = useCollection<User>(usersQuery);
  const { data: chats } = useCollection<Chat>(chatsQuery);

  const selectedChat = useMemo(() => {
    if (!selectedChatId || selectedChatId === 'chromebot') return null;
    return chats?.find((c) => c.id === selectedChatId) || null;
  }, [selectedChatId, chats]);

  const handleSelectChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setOpenMobile(false);
    }

    if (user && firestore && chatId !== 'chromebot') {
      const chatDocRef = doc(firestore, 'chats', chatId);
      const unreadCountKey = `unreadCount.${user.uid}`;
      try {
        await updateDoc(chatDocRef, {
          [unreadCountKey]: 0,
        });
      } catch (e) {
        console.error('Could not mark messages as read.', e);
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedChatId || !user || !firestore) return;

    if (selectedChatId === 'chromebot') {
      const userMessage: AiMessage = {
        id: Date.now(),
        role: 'user',
        content: text,
        timestamp: Timestamp.now(),
      };
      const newHistory = [...aiChatHistory, userMessage];
      setAiChatHistory(newHistory);
      setIsBotTyping(true);

      const chatInput: ChatInput = {
        history: newHistory.map(m => ({role: m.role, content: m.content}))
      };

      try {
        const botResponse = await chatWithChromeBot(chatInput);
        const botMessage: AiMessage = {
          id: Date.now() + 1,
          role: 'model',
          content: botResponse,
          timestamp: Timestamp.now(),
        };
        setAiChatHistory(prev => [...prev, botMessage]);
      } catch (error) {
        console.error("Error with chatbot:", error);
        const errorMessage: AiMessage = {
            id: Date.now() + 1,
            role: 'model',
            content: "Sorry, I'm having trouble connecting. Please try again later.",
            timestamp: Timestamp.now(),
        };
        setAiChatHistory(prev => [...prev, errorMessage]);
      } finally {
        setIsBotTyping(false);
      }
      return;
    }

    if (!selectedChat) return;

    const partnerId = selectedChat.participantIds.find((id) => id !== user.uid);
    if (!partnerId) return;

    const messagesCol = collection(
      firestore,
      'chats',
      selectedChatId,
      'messages'
    );

    await addDoc(messagesCol, {
      chatId: selectedChatId,
      senderId: user.uid,
      text,
      timestamp: serverTimestamp(),
      read: false,
    });

    const chatDocRef = doc(firestore, 'chats', selectedChatId);
    const unreadCountKey = `unreadCount.${partnerId}`;
    
    await updateDoc(chatDocRef, {
      [unreadCountKey]: increment(1),
    });
  };

  const handleClearChat = async (chatId: string) => {
    if (chatId === 'chromebot') {
      setAiChatHistory([]);
      return;
    }
    if (!firestore) return;

    const messagesQuery = query(
      collection(firestore, 'chats', chatId, 'messages')
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    if (messagesSnapshot.empty) return;

    const batch = writeBatch(firestore);
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  };

  const handleUnfriend = async (friendId: string) => {
    if (!user || !firestore) return;

    const sortedIds = [user.uid, friendId].sort();
    const chatIdToDelete = sortedIds.join('-');

    await handleClearChat(chatIdToDelete);
    await deleteDoc(doc(firestore, 'chats', chatIdToDelete));

    if (selectedChatId === chatIdToDelete) {
      setSelectedChatId(null);
    }
  };

  const handleAddFriendAndStartChat = async (friend: User) => {
    if (!user || !firestore || user.uid === friend.id) return;

    const sortedIds = [user.uid, friend.id].sort();
    const newChatId = sortedIds.join('-');
    const chatDocRef = doc(firestore, 'chats', newChatId);

    const chatDoc = await getDoc(chatDocRef);

    if (chatDoc.exists()) {
      setSelectedChatId(chatDoc.id);
    } else {
      const newChatData: Partial<Chat> = {
        id: newChatId,
        participantIds: sortedIds,
        unreadCount: {
          [user.uid]: 0,
          [friend.id]: 0,
        },
      };
      setDocumentNonBlocking(chatDocRef, newChatData, { merge: false });
      setSelectedChatId(newChatId);
    }

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (!user || !allUsers) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const currentUser = {
    id: user.uid,
    email: user.email!,
    username: user.displayName || user.email?.split('@')[0] || 'User',
  };

  const botUser = {
      id: 'chromebot',
      username: 'ChromeBot',
      email: 'bot@chromechat.ai'
  }

  const aiChat: Chat | null = {
    id: 'chromebot',
    participantIds: [currentUser.id, botUser.id],
    messages: aiChatHistory.map(m => ({
        id: String(m.id),
        chatId: 'chromebot',
        senderId: m.role === 'user' ? currentUser.id : botUser.id,
        text: m.content,
        timestamp: m.timestamp,
        read: true,
    } as MessageType))
  };

  const currentChat = selectedChatId === 'chromebot' ? aiChat : selectedChat;

  return (
    <div className="flex h-screen w-full">
      <AppSidebar
        user={currentUser}
        chats={chats || []}
        allUsers={allUsers || []}
        onSelectChat={handleSelectChat}
        onLogout={logout}
        selectedChatId={selectedChatId}
        onAddFriend={handleAddFriendAndStartChat}
        onLogoClick={handleLogoClick}
      />
      <SidebarInset className="flex-1 flex flex-col">
        <ChatView
          currentUser={currentUser}
          chat={currentChat}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onUnfriend={handleUnfriend}
          allUsers={[...allUsers, botUser]}
          isBotTyping={isBotTyping}
        />
      </SidebarInset>
    </div>
  );
}
