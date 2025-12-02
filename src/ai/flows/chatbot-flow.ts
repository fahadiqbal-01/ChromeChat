'use server';

import {
  ChatInputSchema,
  ChatOutputSchema,
  type ChatInput,
  type ChatOutput,
  AiMessage,
} from './types';
import { z } from 'zod';

const ChatbotFlowInput = ChatInputSchema;
type ChatbotFlowInput = z.infer<typeof ChatbotFlowInput>;

const ChatbotFlowOutput = ChatOutputSchema;
type ChatbotFlowOutput = z.infer<typeof ChatbotFlowOutput>;

async function chatbotFlow(input: ChatbotFlowInput): Promise<ChatbotFlowOutput> {
  const systemPrompt = `You are ChromeBot, a helpful and friendly AI assistant integrated into a chat application. Your responses should be concise, helpful, and conversational.`;

  const messages: AiMessage[] = [
    // OpenRouter doesn't handle system prompts in the same way as OpenAI. 
    // We can prepend it to the user's first message or include it as a user/assistant message pair.
    // For simplicity, we will just use the history and the new prompt.
    ...input.history,
    { role: 'user', content: input.prompt },
  ];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4.1-fast:free', // Use the correct model ID
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const completion = await response.json();
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
