
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
  getDoc,
  addDoc,
  increment,
  updateDoc,
  deleteDoc,
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
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { usePresence } from '@/hooks/use-presence';

export function ChatLayout() {
  const { user } = useUser();
  const { logout } = useAuth();
  const firestore = useFirestore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { setOpenMobile, isMobile } = useSidebar();
  
  usePresence(user?.uid);

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
    return chats?.find((c) => c.id === selectedChatId) || null;
  }, [selectedChatId, chats]);

  const handleSelectChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setOpenMobile(false);
    }
  
    if (user && firestore) {
      const chatDocRef = doc(firestore, 'chats', chatId);
      const unreadCountKey = `unreadCount.${user.uid}`;
      // Use non-blocking update to correctly handle permission errors
      updateDocumentNonBlocking(chatDocRef, {
        [unreadCountKey]: 0,
      });
    }
  };


  const handleSendMessage = async (text: string) => {
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

    addDocumentNonBlocking(messagesCol, {
      chatId: selectedChatId,
      senderId: user.uid,
      text,
      timestamp: serverTimestamp(),
      read: false,
    });

    const chatDocRef = doc(firestore, 'chats', selectedChatId);
    const unreadCountKey = `unreadCount.${partnerId}`;
    
    updateDocumentNonBlocking(chatDocRef, {
      [unreadCountKey]: increment(1),
    });
  };

  const handleClearChat = async (chatId: string) => {
    if (!firestore || !user) return;
    
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
            },
          };
          setDocumentNonBlocking(chatDocRef, newChatData);
          setSelectedChatId(newChatId);
        }
    } catch(e) {
        console.log(e);
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
  
  const existingUsers = allUsers || [];
  const chatsWithPartners = (chats || []).map(chat => {
    const partnerId = chat.participantIds.find(id => id !== currentUser.id);
    const partner = existingUsers.find(u => u.id === partnerId);
    return {
      ...chat,
      partner,
    };
  }).filter(chat => chat.partner);

  return (
    <div className="flex h-screen w-full">
      <AppSidebar
        user={currentUser}
        chats={chatsWithPartners}
        allUsers={existingUsers}
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
          allUsers={existingUsers}
        />
      </SidebarInset>
    </div>
  );
}
