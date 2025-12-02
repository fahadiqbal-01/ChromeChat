'use client';

import React, { useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { ChatView } from './chat-view';
import { useAuth as useFirebaseAuthHook } from '@/hooks/use-auth';
import type { Chat, User } from '@/lib/types';
import {
  useCollection,
  useMemoFirebase,
  useFirestore,
  useUser,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';

export function ChatLayout() {
  const { user } = useUser();
  const { logout } = useFirebaseAuthHook();
  const firestore = useFirestore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { setOpenMobile } = useSidebar();

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

  const { isMobile } = useSidebar();

  const handleSendMessage = (text: string) => {
    if (!selectedChatId || !user || !firestore) return;

    const messagesCol = collection(
      firestore,
      'chats',
      selectedChatId,
      'messages'
    );
    addDocumentNonBlocking(messagesCol, {
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
    // getDocs is a one-time read, which is fine to await.
    // The permission error might happen here or in the subsequent deletes.
    const messagesSnapshot = await getDocs(messagesQuery).catch((e) => {
      // If reading the collection fails, emit a contextual error.
      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path: `chats/${chatId}/messages`,
      });
      errorEmitter.emit('permission-error', contextualError);
      throw e; // re-throw to stop execution
    });

    if (messagesSnapshot.empty) return;

    // Use non-blocking deletes for each message
    messagesSnapshot.docs.forEach((messageDoc) => {
      deleteDocumentNonBlocking(messageDoc.ref);
    });
  };

  const handleUnfriend = async (friendId: string) => {
    if (!user || !firestore) return;

    const sortedIds = [user.uid, friendId].sort();
    const chatIdToDelete = sortedIds.join('-');

    // First, try to delete all messages in the subcollection
    try {
      await handleClearChat(chatIdToDelete);
    } catch (e) {
      // Error is already emitted by handleClearChat, so just log and exit
      console.error('Could not clear chat during unfriend operation.', e);
      return;
    }


    // Then, delete the chat document itself using a non-blocking call
    const chatDocRef = doc(firestore, 'chats', chatIdToDelete);
    deleteDocumentNonBlocking(chatDocRef);

    // Finally, reset the UI
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
      await setDoc(chatDocRef, {
        participantIds: sortedIds,
        createdAt: serverTimestamp(),
      });
      setSelectedChatId(newChatId);
    }
    setOpenMobile(false);
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
