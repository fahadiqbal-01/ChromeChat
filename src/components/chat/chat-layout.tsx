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
  Timestamp,
} from 'firebase/firestore';
import { SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { ChatView } from './chat-view';
import { useAuth } from '@/hooks/use-auth';
import type { Chat, User, Message } from '@/lib/types';
import {
  useCollection,
  useMemoFirebase,
  useFirestore,
  useUser,
} from '@/firebase';
import { chatWithChromeBot, type ChatInput } from '@/ai/flows/chatbot-flow';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


export function ChatLayout() {
  const { user } = useUser();
  const { logout } = useAuth();
  const firestore = useFirestore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { setOpenMobile, isMobile } = useSidebar();
  const [chromeBotMessages, setChromeBotMessages] = useState<Message[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);

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
    if (!selectedChatId) return null;
    if (selectedChatId === 'chromebot') {
      return {
        id: 'chromebot',
        participantIds: [user?.uid || '', 'chromebot'],
        messages: chromeBotMessages,
      };
    }
    return chats?.find((c) => c.id === selectedChatId) || null;
  }, [selectedChatId, chats, user, chromeBotMessages]);

  const handleSelectChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setOpenMobile(false);
    }

    if (chatId !== 'chromebot' && user && firestore) {
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
      const newUserMessage: Message = {
        id: `user-${Date.now()}`,
        chatId: 'chromebot',
        senderId: user.uid,
        text,
        timestamp: Timestamp.now(),
        read: true,
      };
      setChromeBotMessages((prev) => [...prev, newUserMessage]);
      setIsBotTyping(true);

      const chatHistoryForBot: ChatInput['history'] = [
        ...chromeBotMessages,
        newUserMessage,
      ].map((msg) => ({
        role: msg.senderId === user.uid ? 'user' : 'model',
        content: msg.text,
      }));

      try {
        const botResponseText = await chatWithChromeBot({
          history: chatHistoryForBot,
        });
        const newBotMessage: Message = {
          id: `bot-${Date.now()}`,
          chatId: 'chromebot',
          senderId: 'chromebot',
          text: botResponseText,
          timestamp: Timestamp.now(),
          read: true,
        };
        setChromeBotMessages((prev) => [...prev, newBotMessage]);
      } catch (error) {
        console.error('Error with ChromeBot:', error);
        const errorBotMessage: Message = {
            id: `bot-error-${Date.now()}`,
            chatId: 'chromebot',
            senderId: 'chromebot',
            text: "Sorry, I'm having a little trouble right now. Please try again later.",
            timestamp: Timestamp.now(),
            read: true,
        };
        setChromeBotMessages((prev) => [...prev, errorBotMessage]);
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

    addDoc(messagesCol, {
      chatId: selectedChatId,
      senderId: user.uid,
      text,
      timestamp: serverTimestamp(),
      read: false,
    });

    const chatDocRef = doc(firestore, 'chats', selectedChatId);
    const unreadCountKey = `unreadCount.${partnerId}`;
    updateDoc(chatDocRef, {
      [unreadCountKey]: increment(1),
    }).catch((e) => console.error('Could not update unread count', e));
  };

  const handleClearChat = async (chatId: string) => {
    if (!firestore) return;
    if (chatId === 'chromebot') {
      setChromeBotMessages([]);
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
      />
      <SidebarInset className="flex-1 flex flex-col">
        <ChatView
          currentUser={currentUser}
          chat={selectedChat}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onUnfriend={handleUnfriend}
          allUsers={allUsers || []}
          isBotTyping={isBotTyping}
        />
      </SidebarInset>
    </div>
  );
}
