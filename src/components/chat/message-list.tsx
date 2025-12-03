
'use client';

import { useEffect, useRef } from 'react';
import type { Message, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { TypingIndicator } from './typing-indicator';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  partner: User;
  isPartnerTyping: boolean;
}

export function MessageList({ messages, currentUserId, partner, isPartnerTyping }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPartnerTyping]);

  const toDate = (timestamp: Timestamp | number | Date): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-2">
      <div className="flex flex-col gap-4">
        {messages.map((message) => {
          const isCurrentUser = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={cn('flex items-end gap-2', {
                'justify-end': isCurrentUser,
                'justify-start': !isCurrentUser,
              })}
            >
              {!isCurrentUser && (
                <Avatar className="h-9 w-9 self-end md:h-6 md:w-6">
                    <AvatarFallback>
                        {partner.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-lg px-3 py-2 md:max-w-[60%]',
                  {
                    'bg-primary text-primary-foreground': isCurrentUser,
                    'bg-muted': !isCurrentUser,
                  }
                )}
              >
                <p className="text-base md:text-sm">{message.text}</p>
                {message.timestamp && (
                  <p className={cn("text-sm mt-1 md:text-xs", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                    {format(toDate(message.timestamp), 'p')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {isPartnerTyping && (
           <div className="flex items-end gap-2 justify-start">
             <Avatar className="h-9 w-9 md:h-6 md:w-6">
                <AvatarFallback>
                    {partner.username.charAt(0).toUpperCase()}
                </AvatarFallback>
             </Avatar>
             <div className="bg-muted rounded-lg px-3 py-2">
                <TypingIndicator />
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
