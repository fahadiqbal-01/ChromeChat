'use server';

import { ai } from '@/ai/genkit';
import {
  ChatInputSchema,
  ChatOutputSchema,
  type ChatInput,
  type ChatOutput,
} from './types';

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const systemPrompt = `You are ChromeBot, a helpful and friendly AI assistant integrated into a chat application. Your responses should be concise, helpful, and conversational.`;

    const { output } = await ai.generate({
      model: 'googleai/gemini-pro',
      messages: [
        { role: 'system', content: [{ text: systemPrompt }] },
        ...input.history.map((m) => ({
          role: m.role,
          content: [{ text: m.content }],
        })),
        { role: 'user', content: [{ text: input.prompt }] },
      ],
    });

    const message =
      output?.content?.map((c) => c.text).join(' ') ||
      "I'm sorry, I couldn't generate a response.";
    
    return message;
  }
);

export async function chatWithChromeBot(input: ChatInput): Promise<ChatOutput> {
  return chatbotFlow(input);
}
