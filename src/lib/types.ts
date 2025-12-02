import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Timestamp | number;
}

export interface Chat {
  id: string;
  participantIds: string[];
  messages: Message[];
}
