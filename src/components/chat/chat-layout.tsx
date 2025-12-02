
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
  increment,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import { SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { ChatView } from './chat-view';
import { useAuth } from '@/hooks/use-auth';
import type { Chat, User, FriendRequest } from '@/lib/types';
import {
  useCollection,
  useMemoFirebase,
  useFirestore,
  useUser,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { usePresence } from '@/hooks/use-presence';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { playFriendRequestSound, playMessageSentSound } from '@/lib/audio';


export function ChatLayout() {
  const { user } = useUser();
  const { logout } = useAuth();
  const firestore = useFirestore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { setOpenMobile, isMobile } = useSidebar();
  const [chatToClear, setChatToClear] = useState<string | null>(null);
  
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
  
  const friendRequestsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, 'users', user.uid, 'friendRequests'),
            where('status', '==', 'pending')
          )
        : null,
    [firestore, user]
  );

  const { data: allUsers } = useCollection<User>(usersQuery);
  const { data: chats } = useCollection<Chat>(chatsQuery);
  const { data: friendRequests } = useCollection<FriendRequest>(friendRequestsQuery);

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
  
      const chatData = chats?.find(c => c.id === chatId);
      // Only reset unread count if it's greater than 0
      if (chatData?.unreadCount && chatData.unreadCount[user.uid] > 0) {
        updateDocumentNonBlocking(chatDocRef, {
          [`unreadCount.${user.uid}`]: 0
        });
      }
  
      // Track the currently open chat for presence
      const userDocRef = doc(firestore, 'users', user.uid);
      updateDocumentNonBlocking(userDocRef, { activeChatId: chatId });
    }
  };


  const handleSendMessage = async (text: string) => {
    if (!selectedChatId || !user || !firestore) return;
    if (!selectedChat) return;

    playMessageSentSound();
  
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
    
    // Check partner's presence to decide whether to increment unread count
    const partnerUserDocRef = doc(firestore, 'users', partnerId);
    try {
      const partnerDoc = await getDoc(partnerUserDocRef);
      const partnerData = partnerDoc.data() as User;

      // Only increment if the partner is not online OR is online but not in this chat
      if (!partnerData?.isActive || partnerData?.activeChatId !== selectedChatId) {
        updateDocumentNonBlocking(chatDocRef, {
          [`unreadCount.${partnerId}`]: increment(1),
        });
      }
    } catch (e) {
      // If we can't get the partner's doc, we can assume they are offline
      // and increment the unread count.
       updateDocumentNonBlocking(chatDocRef, {
          [`unreadCount.${partnerId}`]: increment(1),
        });
    }
  };

  const promptClearChat = (chatId: string) => {
    setChatToClear(chatId);
  };

  const handleClearChat = async () => {
    if (!firestore || !user || !chatToClear) return;
    
    const messagesQuery = query(
      collection(firestore, 'chats', chatToClear, 'messages')
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    if (messagesSnapshot.empty) {
      setChatToClear(null);
      return;
    }

    const batch = writeBatch(firestore);
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    setChatToClear(null);
  };

  const handleAddFriend = async (friend: User) => {
    if (!user || !firestore) return;
    
    playFriendRequestSound();

    const friendRequestRef = collection(firestore, `users/${friend.id}/friendRequests`);
    addDocumentNonBlocking(friendRequestRef, {
      requesterId: user.uid,
      recipientId: friend.id,
      status: 'pending',
    });
  };

 const handleAcceptRequest = async (request: FriendRequest) => {
    if (!user || !firestore) return;

    playFriendRequestSound();

    const batch = writeBatch(firestore);
    const { requesterId, recipientId } = request;

    // 1. Create a new chat document
    const sortedIds = [requesterId, recipientId].sort();
    const newChatId = sortedIds.join('-');
    const chatDocRef = doc(firestore, 'chats', newChatId);
    batch.set(chatDocRef, {
      id: newChatId,
      participantIds: sortedIds,
      unreadCount: {
        [requesterId]: 0,
        [recipientId]: 0,
      },
    });

    // 2. Add the requester to the current user's (recipient's) friend list
    const recipientUserRef = doc(firestore, 'users', recipientId);
    batch.update(recipientUserRef, { friendIds: arrayUnion(requesterId) });

    // This part is removed because the client cannot write to another user's document.
    // The requester will add the recipient to their own friend list in a separate action.
    // const requesterUserRef = doc(firestore, 'users', requesterId);
    // batch.update(requesterUserRef, { friendIds: arrayUnion(recipientId) });

    // 3. Delete the friend request
    const requestDocRef = doc(
      firestore,
      'users',
      recipientId,
      'friendRequests',
      request.id
    );
    batch.delete(requestDocRef);

    batch
      .commit()
      .then(() => {
        setSelectedChatId(newChatId);
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: `users/${user.uid} or chats/${newChatId}`,
          operation: 'write',
          requestResourceData: {
            description:
              'Batch operation to accept friend request failed. Check permissions for creating a chat, updating user profiles (friendIds), and deleting a friend request.',
            chatData: {
                id: newChatId,
                participantIds: sortedIds,
            },
            currentUserUpdate: { friendIds: `arrayUnion(${requesterId})` },
            deletedRequestPath: requestDocRef.path,
          },
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const handleRejectRequest = async (request: FriendRequest) => {
      if (!user || !firestore) return;
      const requestDocRef = doc(firestore, 'users', user.uid, 'friendRequests', request.id);
      deleteDocumentNonBlocking(requestDocRef);
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

  const currentUser = allUsers.find(u => u.id === user.uid) || {
    id: user.uid,
    email: user.email!,
    username: user.displayName || user.email?.split('@')[0] || 'User',
  };
  
  const existingUsers = allUsers || [];
  const chatsWithPartners = (chats || [])
    .map(chat => {
        const partnerId = chat.participantIds.find(id => id !== currentUser.id);
        const partner = existingUsers.find(u => u.id === partnerId);
        return { ...chat, partner };
    })
    // .filter(chat => chat.partner);

  return (
    <div className="flex h-screen w-full">
      <AppSidebar
        user={currentUser}
        chats={chatsWithPartners}
        allUsers={existingUsers}
        onSelectChat={handleSelectChat}
        onLogout={logout}
        selectedChatId={selectedChatId}
        onAddFriend={handleAddFriend}
        onLogoClick={handleLogoClick}
        friendRequests={friendRequests || []}
        onAcceptRequest={handleAcceptRequest}
        onRejectRequest={handleRejectRequest}
      />
      <SidebarInset className="flex-1 flex flex-col">
        <ChatView
          currentUser={currentUser}
          chat={selectedChat}
          onSendMessage={handleSendMessage}
          onClearChat={promptClearChat}
          allUsers={existingUsers}
        />
      </SidebarInset>
       <AlertDialog open={!!chatToClear} onOpenChange={(open) => !open && setChatToClear(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              message history with this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChatToClear(null)}>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearChat}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    
