'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toDate = (timestamp: Timestamp | number | Date): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-4">
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={cn('flex items-end gap-2', {
                'justify-end': isCurrentUser,
                'justify-start': !isCurrentUser,
              })}
            >
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
      </div>
    </div>
  );
}
