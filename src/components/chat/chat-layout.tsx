'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  orderBy,
  limit,
} from 'firebase/firestore';
import { SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { ChatView } from './chat-view';
import { useAuth } from '@/hooks/use-auth';
import type { Chat, User } from '@/lib/types';
import {
  useCollection,
  useMemoFirebase,
  useFirestore,
  useUser,
} from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { chatWithChromeBot } from '@/ai/flows/chatbot-flow';
import type { AiMessage } from '@/ai/flows/types';

export function ChatLayout() {
  const { user } = useUser();
  const { logout } = useAuth();
  const firestore = useFirestore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { setOpenMobile, isMobile } = useSidebar();
  const [isAiChatActive, setAiChatActive] = useState(false);
  const [isAiLoading, setAiLoading] = useState(false);

  const handleLogoClick = () => {
    setSelectedChatId(null);
    setAiChatActive(false);
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

  const aiChatMessagesQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, 'users', user.uid, 'ai-chat-messages'),
            orderBy('timestamp', 'asc')
          )
        : null,
    [firestore, user]
  );

  const { data: allUsers } = useCollection<User>(usersQuery);
  const { data: chats } = useCollection<Chat>(chatsQuery);
  const { data: aiChatHistory } = useCollection<AiMessage>(aiChatMessagesQuery);

  const selectedChat = useMemo(() => {
    if (isAiChatActive || !selectedChatId) return null;
    return chats?.find((c) => c.id === selectedChatId) || null;
  }, [selectedChatId, chats, isAiChatActive]);

  const handleSelectChat = async (chatId: string) => {
    setAiChatActive(false);
    setSelectedChatId(chatId);
    if (isMobile) {
      setOpenMobile(false);
    }

    if (user && firestore) {
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

  const handleSelectAiChat = () => {
    setAiChatActive(true);
    setSelectedChatId(null);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (isAiChatActive) {
      handleSendAiMessage(text);
      return;
    }
    if (!selectedChatId || !user || !firestore) return;
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

  const handleSendAiMessage = async (prompt: string) => {
    if (!prompt || !user || !firestore) return;

    setAiLoading(true);
    const newUserMessage: AiMessage = { role: 'user', content: prompt };
    
    // The history from the hook, which is definitely available.
    const currentHistory = aiChatHistory || [];
    
    // Immediately construct the full history for the API call.
    // This includes the old history AND the new user message.
    const historyForApi = [...currentHistory, newUserMessage].map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add the user's message to Firestore *after* preparing the API call payload
    const aiMessagesCollection = collection(firestore, 'users', user.uid, 'ai-chat-messages');
    await addDoc(aiMessagesCollection, { ...newUserMessage, timestamp: serverTimestamp() });

    try {
      // Send the complete, correct history to the AI.
      const response = await chatWithChromeBot({
        history: historyForApi,
      });
  
      const botMessage: AiMessage = { role: 'model', content: response };
      await addDoc(aiMessagesCollection, { ...botMessage, timestamp: serverTimestamp() });
    } catch (error) {
      console.error('Error chatting with bot:', error);
      const errorMessage: AiMessage = {
        role: 'model',
        content: 'Sorry, I ran into an error. Please try again.',
      };
      await addDoc(aiMessagesCollection, { ...errorMessage, timestamp: serverTimestamp() });
    } finally {
      setAiLoading(false);
    }
  };

  const handleClearChat = async (chatId: string) => {
    if (!firestore || !user) return;
    
    if (isAiChatActive && chatId === 'chromebot') {
      const aiMessagesQuery = query(collection(firestore, 'users', user.uid, 'ai-chat-messages'));
      const messagesSnapshot = await getDocs(aiMessagesQuery);
      if (messagesSnapshot.empty) return;
      
      const batch = writeBatch(firestore);
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return;
    }

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
    setAiChatActive(false);

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
        onSelectAiChat={handleSelectAiChat}
        isAiChatSelected={isAiChatActive}
      />
      <SidebarInset className="flex-1 flex flex-col">
        <ChatView
          currentUser={currentUser}
          chat={selectedChat}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onUnfriend={handleUnfriend}
          allUsers={allUsers}
          isAiChatActive={isAiChatActive}
          aiChatHistory={aiChatHistory || []}
          isAiLoading={isAiLoading}
        />
      </SidebarInset>
    </div>
  );
}
