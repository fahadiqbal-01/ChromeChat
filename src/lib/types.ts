export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Should not be sent to client
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  participantIds: string[];
  messages: Message[];
}
