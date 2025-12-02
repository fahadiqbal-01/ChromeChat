'use client';

import React, { useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
  writeBatch,
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
  FirestorePermissionError,
  errorEmitter,
  setDocumentNonBlocking,
} from '@/firebase';

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
    try {
      const messagesSnapshot = await getDocs(messagesQuery);
      if (messagesSnapshot.empty) return;
      
      const batch = writeBatch(firestore);
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (e) {
      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path: `chats/${chatId}/messages`,
      });
      errorEmitter.emit('permission-error', contextualError);
      throw e; 
    }
  };

  const handleUnfriend = async (friendId: string) => {
    if (!user || !firestore) return;

    const sortedIds = [user.uid, friendId].sort();
    const chatIdToDelete = sortedIds.join('-');

    try {
      await handleClearChat(chatIdToDelete);
      
      const chatDocRef = doc(firestore, 'chats', chatIdToDelete);
      // Use a standard delete for this operation with proper error handling
      await deleteDoc(chatDocRef);
      
      // Finally, reset the UI
      if (selectedChatId === chatIdToDelete) {
        setSelectedChatId(null);
      }
    } catch (e: any) {
      if (e instanceof FirestorePermissionError) {
        errorEmitter.emit('permission-error', e);
      } else {
        const contextualError = new FirestorePermissionError({
          operation: 'delete',
          path: `chats/${chatIdToDelete}`,
        });
        errorEmitter.emit('permission-error', contextualError);
      }
      console.error('Could not unfriend user.', e);
    }
  };

  const handleAddFriendAndStartChat = async (friend: User) => {
    if (!user || !firestore || user.uid === friend.id) return;

    const sortedIds = [user.uid, friend.id].sort();
    const newChatId = sortedIds.join('-');

    const chatDocRef = doc(firestore, 'chats', newChatId);
    try {
      const chatDoc = await getDoc(chatDocRef);
      if (chatDoc.exists()) {
        setSelectedChatId(chatDoc.id);
      } else {
        const newChatData = {
          id: newChatId,
          participantIds: sortedIds,
          createdAt: serverTimestamp(),
        };
        // Use setDocumentNonBlocking for optimistic UI, it has error handling built-in
        setDocumentNonBlocking(chatDocRef, newChatData, { merge: false });
        setSelectedChatId(newChatId);
      }
    } catch (e) {
       const contextualError = new FirestorePermissionError({
        operation: 'get',
        path: `chats/${newChatId}`,
      });
      errorEmitter.emit('permission-error', contextualError);
      console.error("Error checking or creating chat document: ", e);
    }

    if(isMobile) {
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
