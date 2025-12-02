'use server';

import { OpenRouter } from '@openrouter/sdk';
import {
  ChatInputSchema,
  ChatOutputSchema,
  type ChatInput,
  type ChatOutput,
  AiMessage,
} from './types';
import { z } from 'zod';

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const ChatbotFlowInput = ChatInputSchema;
type ChatbotFlowInput = z.infer<typeof ChatbotFlowInput>;

const ChatbotFlowOutput = ChatOutputSchema;
type ChatbotFlowOutput = z.infer<typeof ChatbotFlowOutput>;

async function chatbotFlow(input: ChatbotFlowInput): Promise<ChatbotFlowOutput> {
  const systemPrompt = `You are ChromeBot, a helpful and friendly AI assistant integrated into a chat application. Your responses should be concise, helpful, and conversational.`;

  const messages: AiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...input.history,
    { role: 'user', content: input.prompt },
  ];

  try {
    const completion = await openRouter.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const message = completion.choices[0].message?.content;
    
    if (message) {
        return message;
    } else {
        return "I'm sorry, I couldn't generate a response.";
    }

  } catch (error) {
    console.error('Error fetching from OpenRouter:', error);
    return "I'm sorry, there was an error processing your request.";
  }
}

export async function chatWithChromeBot(input: ChatInput): Promise<ChatOutput> {
  return chatbotFlow(input);
}
