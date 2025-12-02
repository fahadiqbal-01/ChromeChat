import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

export const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'system']),
  content: z.string(),
  timestamp: z.any().optional(),
});
export type AiMessage = z.infer<typeof MessageSchema> & { timestamp?: Timestamp };

export const ChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model', 'system']),
    content: z.string(),
  })),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.string();
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export const AcceptFriendRequestInputSchema = z.object({
  requesterId: z.string().describe('The ID of the user who sent the request.'),
  recipientId: z.string().describe('The ID of the user who is accepting the request.'),
  friendRequestId: z.string().describe('The ID of the friend request document.'),
});
export type AcceptFriendRequestInput = z.infer<
  typeof AcceptFriendRequestInputSchema
>;

export const AcceptFriendRequestOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful.'),
  chatId: z.string().optional().describe('The ID of the newly created chat.'),
});
export type AcceptFriendRequestOutput = z.infer<
  typeof AcceptFriendRequestOutputSchema
>;
