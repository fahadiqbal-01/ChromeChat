'use server';
/**
 * @fileOverview A flow to securely accept a friend request.
 * This flow runs on the server with elevated privileges to perform
 * the necessary Firestore writes atomically.
 */
import { ai } from '@/ai/genkit';
import { admin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  AcceptFriendRequestInputSchema,
  AcceptFriendRequestOutputSchema,
  type AcceptFriendRequestInput,
  type AcceptFriendRequestOutput,
} from './types';

export async function acceptFriendRequest(
  input: AcceptFriendRequestInput
): Promise<AcceptFriendRequestOutput> {
  return acceptFriendRequestFlow(input);
}

const acceptFriendRequestFlow = ai.defineFlow(
  {
    name: 'acceptFriendRequestFlow',
    inputSchema: AcceptFriendRequestInputSchema,
    outputSchema: AcceptFriendRequestOutputSchema,
  },
  async (input) => {
    const db = admin.firestore();
    const batch = db.batch();

    const { requesterId, recipientId, friendRequestId } = input;

    // 1. Create a new chat document
    const sortedIds = [requesterId, recipientId].sort();
    const newChatId = sortedIds.join('-');
    const chatDocRef = db.collection('chats').doc(newChatId);
    const chatData = {
      id: newChatId,
      participantIds: sortedIds,
      unreadCount: {
        [requesterId]: 0,
        [recipientId]: 0,
      },
    };
    batch.set(chatDocRef, chatData);

    // 2. Add each user to the other's friends list
    const recipientUserRef = db.collection('users').doc(recipientId);
    const requesterUserRef = db.collection('users').doc(requesterId);

    batch.update(recipientUserRef, { friendIds: FieldValue.arrayUnion(requesterId) });
    batch.update(requesterUserRef, { friendIds: FieldValue.arrayUnion(recipientId) });

    // 3. Delete the friend request
    const requestDocRef = db.collection('users').doc(recipientId).collection('friendRequests').doc(friendRequestId);
    batch.delete(requestDocRef);

    try {
      await batch.commit();
      return { success: true, chatId: newChatId };
    } catch (error) {
      console.error('Batch commit failed:', error);
      // In a real app, you might want more granular error handling
      return { success: false };
    }
  }
);
