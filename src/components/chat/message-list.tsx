'use client';

import { useEffect, useRef } from 'react';
import type { Message, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Bot } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isBotTyping?: boolean;
  botUser: User;
}

export function MessageList({ messages, currentUserId, isBotTyping, botUser }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]);

  const toDate = (timestamp: Timestamp | number | Date): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-4">
        {messages.map((message) => {
          const isCurrentUser = message.senderId === currentUserId;
          const isBot = message.senderId === botUser.id;
          return (
            <div
              key={message.id}
              className={cn('flex items-end gap-2', {
                'justify-end': isCurrentUser,
                'justify-start': !isCurrentUser,
              })}
            >
              {!isCurrentUser && (
                <Avatar className="h-6 w-6">
                    <AvatarFallback className={cn(isBot && 'bg-primary text-primary-foreground')}>
                        {isBot ? <Bot className="h-4 w-4"/> : 'U'}
                    </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-xs rounded-lg px-3 py-2 md:max-w-md',
                  {
                    'bg-primary text-primary-foreground': isCurrentUser,
                    'bg-muted': !isCurrentUser,
                  }
                )}
              >
                <p className="text-sm">{message.text}</p>
                {message.timestamp && (
                  <p className={cn("text-xs mt-1", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                    {format(toDate(message.timestamp), 'p')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {isBotTyping && (
            <div className="flex items-end gap-2 justify-start">
                 <Avatar className="h-6 w-6">
                    <AvatarFallback className='bg-primary text-primary-foreground'>
                        <Bot className="h-4 w-4"/>
                    </AvatarFallback>
                </Avatar>
                <div className="max-w-xs rounded-lg px-3 py-2 md:max-w-md bg-muted">
                    <Skeleton className="w-4 h-4" />
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
