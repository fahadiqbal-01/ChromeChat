'use server';
/**
 * @fileOverview A simple AI chatbot flow.
 *
 * - chatWithChromeBot - A function that handles the chat interaction.
 * - ChatInput - The input type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.string();

const prompt = ai.definePrompt(
  {
    name: 'chatbotPrompt',
    input: { schema: ChatInputSchema },
    output: { schema: ChatOutputSchema },
    prompt: `You are ChromeBot, a helpful and friendly AI assistant integrated into a chat application.

Your responses should be concise, helpful, and conversational.

Here is the conversation history:
{{#each history}}
- {{role}}: {{content}}
{{/each}}
`,
  },
);

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function chatWithChromeBot(input: ChatInput): Promise<string> {
    return chatbotFlow(input);
}
