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
  runTransaction,
  addDoc,
  increment,
  updateDoc,
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
  setDocumentNonBlocking,
  FirestorePermissionError,
  errorEmitter,
} from '@/firebase';

export function ChatLayout() {
  const { user } = useUser();
  const { logout } = useAuth();
  const firestore = useFirestore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLogoClick = () => {
    setSelectedChatId(null);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

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

  const handleSelectChat = async (chatId: string) => {
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
        console.error("Could not mark messages as read.", e);
      }
    }
  };

  const handleSendMessage = (text: string) => {
    if (!selectedChatId || !user || !firestore || !selectedChat) return;

    const partnerId = selectedChat.participantIds.find(id => id !== user.uid);
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
    }).catch(e => {
        const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: `chats/${selectedChatId}/messages`,
            requestResourceData: { text },
        });
        errorEmitter.emit('permission-error', contextualError);
    });
    
    // Increment unread count for the receiver
    const chatDocRef = doc(firestore, 'chats', selectedChatId);
    const unreadCountKey = `unreadCount.${partnerId}`;
    updateDoc(chatDocRef, {
      [unreadCountKey]: increment(1)
    }).catch(e => console.error("Could not update unread count", e));
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
    } catch (e: any) {
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
      // First, delete all messages in the subcollection
      await handleClearChat(chatIdToDelete);

      // Then, delete the chat document itself
      const chatDocRef = doc(firestore, 'chats', chatIdToDelete);
      await deleteDoc(chatDocRef);

      // If the deleted chat was the selected one, clear the view
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
            const newChatData: Partial<Chat> = {
                id: newChatId,
                participantIds: sortedIds,
                unreadCount: {
                  [user.uid]: 0,
                  [friend.id]: 0,
                }
            };
            setDocumentNonBlocking(chatDocRef, newChatData, { merge: false });
            setSelectedChatId(newChatId);
        }
    } catch (e) {
      const contextualError = new FirestorePermissionError({
        operation: 'get',
        path: `chats/${newChatId}`,
      });
      errorEmitter.emit('permission-error', contextualError);
      console.error('Error checking or creating chat document: ', e);
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
        />
      </SidebarInset>
    </div>
  );
}
