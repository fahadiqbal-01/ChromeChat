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
    const prompt = `You are ChromeBot, a helpful and friendly AI assistant integrated into a chat application.

Your responses should be concise, helpful, and conversational.

Here is the conversation history:
{{#each history}}
- {{role}}: {{content}}
{{/each}}
`;

    const { output } = await ai.generate({
      prompt: prompt,
      history: input.history.map((m) => ({
        role: m.role,
        content: [{ text: m.content }],
      })),
    });

    return output?.text() || "I'm sorry, I couldn't generate a response.";
  }
);

export async function chatWithChromeBot(input: ChatInput): Promise<ChatOutput> {
  return chatbotFlow(input);
}
