import { z } from 'zod';

export const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'system']),
  content: z.string(),
});
export type AiMessage = z.infer<typeof MessageSchema>;

export const ChatInputSchema = z.object({
  history: z.array(MessageSchema),
  prompt: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.string();
export type ChatOutput = z.infer<typeof ChatOutputSchema>;
