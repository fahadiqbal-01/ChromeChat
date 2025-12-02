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
