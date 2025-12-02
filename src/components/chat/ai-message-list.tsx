'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import type { AiMessage } from '@/ai/flows/types';
import { Bot } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface AiMessageListProps {
  messages: AiMessage[];
  isLoading: boolean;
}

export function AiMessageList({ messages, isLoading }: AiMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-4">
        {messages.map((message, index) => {
          const isModel = message.role === 'model';
          return (
            <div
              key={index}
              className={cn('flex items-end gap-2', {
                'justify-end': !isModel,
                'justify-start': isModel,
              })}
            >
              {isModel && (
                <Avatar className="h-6 w-6">
                    <AvatarFallback className='bg-primary text-primary-foreground'>
                       <Bot size={16} />
                    </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-xs rounded-lg px-3 py-2 md:max-w-md',
                  {
                    'bg-primary text-primary-foreground': !isModel,
                    'bg-muted': isModel,
                  }
                )}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          );
        })}
        {isLoading && (
             <div className="flex items-end gap-2 justify-start">
                <Avatar className="h-6 w-6">
                    <AvatarFallback className='bg-primary text-primary-foreground'>
                       <Bot size={16} />
                    </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2">
                    <Skeleton className="h-4 w-12" />
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
