import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  username: string;
  email: string;
  isActive?: boolean;
  lastSeen?: Timestamp;
  friendRequestIds?: string[];
  friendIds?: string[];
  activeChatId?: string;
}

export interface FriendRequest {
    id: string;
    requesterId: string;
    recipientId: string;
    status: 'pending' | 'accepted' | 'rejected';
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface Chat {
  id:string;
  participantIds: string[];
  messages: Message[];
  unreadCount?: { [key: string]: number };
}

    