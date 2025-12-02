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

export const ChatInputSchema = z.object({
  history: z.array(MessageSchema),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.string();
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


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
        history: input.history.map(m => ({role: m.role, content: [{text: m.content}]})),
    });
    
    return output?.text() || "I'm sorry, I couldn't generate a response.";
  }
);


export async function chatWithChromeBot(input: ChatInput): Promise<ChatOutput> {
    return chatbotFlow(input);
}
