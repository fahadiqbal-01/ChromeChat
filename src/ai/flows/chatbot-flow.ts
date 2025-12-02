'use server';
/**
 * @fileOverview A simple AI chatbot flow.
 *
 * - chatWithChromeBot - A function that handles the chat interaction.
 */

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

    const history = [
      { role: 'system' as const, content: [{ text: systemPrompt }] },
      ...input.history.map((m) => ({
        role: m.role,
        content: [{ text: m.content }],
      })),
    ];

    const { output } = await ai.generate({
      history,
    });

    return output?.text() || "I'm sorry, I couldn't generate a response.";
  }
);

export async function chatWithChromeBot(input: ChatInput): Promise<ChatOutput> {
  return chatbotFlow(input);
}
