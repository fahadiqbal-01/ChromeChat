'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  getDocs,
  limit,
  writeBatch,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { ChatView } from './chat-view';
import { useAuth as useFirebaseAuthHook } from '@/hooks/use-auth';
import type { Chat, Message, User } from '@/lib/types';
import { useCollection, useMemoFirebase, useFirestore, useUser } from '@/firebase';

export function ChatLayout() {
  const { user } = useUser();
  const { logout } = useFirebaseAuthHook();
  const firestore = useFirestore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { setOpenMobile, isMobile } = useSidebar();

  // Memoize Firestore queries
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
    if (!selectedChatId || !chats) return null;
    return chats.find((c) => c.id === selectedChatId) || null;
  }, [selectedChatId, chats]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedChatId || !user || !firestore) return;

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
    });
  };

  const handleClearChat = async (chatId: string) => {
    if (!firestore) return;
    const messagesQuery = query(
      collection(firestore, 'chats', chatId, 'messages')
    );
    const messagesSnapshot = await getDocs(messagesQuery);

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

    const chatDocRef = doc(firestore, 'chats', chatIdToDelete);
    await deleteDoc(chatDocRef);

    if (selectedChatId === chatIdToDelete) {
      setSelectedChatId(null);
    }
  };

  const handleAddFriendAndStartChat = async (friend: User) => {
    if (!user || !firestore || user.uid === friend.id) return;

    const sortedIds = [user.uid, friend.id].sort();
    const newChatId = sortedIds.join('-');

    const chatDocRef = doc(firestore, 'chats', newChatId);
    const chatSnapshot = await getDocs(
      query(collection(firestore, 'chats'), where('__name__', '==', newChatId), limit(1))
    );

    if (!chatSnapshot.empty) {
      setSelectedChatId(chatSnapshot.docs[0].id);
    } else {
      await setDoc(chatDocRef, {
        participantIds: sortedIds,
        createdAt: serverTimestamp(),
      });
      setSelectedChatId(newChatId);
    }
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (!user || !allUsers) return null;

  const currentUser = {
    id: user.uid,
    email: user.email!,
    username: user.displayName || 'User',
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
      />
      <SidebarInset className="flex-1 flex flex-col">
        <ChatView
          currentUser={currentUser}
          chat={selectedChat}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onUnfriend={handleUnfriend}
          allUsers={allUsers || []}
        />
      </SidebarInset>
    </div>
  );
}
