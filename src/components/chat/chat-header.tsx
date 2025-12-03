
'use client';

import { MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

interface ChatHeaderProps {
  partner: User;
  onClearChat: () => void;
}

export function ChatHeader({ partner, onClearChat }: ChatHeaderProps) {
  const toDate = (timestamp?: Timestamp): Date | null => {
    if (!timestamp) return null;
    return timestamp.toDate();
  }
  
  const lastSeenDate = toDate(partner.lastSeen);

  return (
    <header className="flex h-20 md:h-16 items-center justify-between border-b bg-background px-4 pb-4 md:pb-2">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 md:h-8 md:w-8">
            <AvatarFallback>
                {partner.username.charAt(0).toUpperCase()}
            </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h2 className="text-xl md:text-lg font-semibold">{partner.username}</h2>
          {partner.isActive ? (
            <p className="text-sm md:text-xs text-green-500">Online</p>
          ) : (
            lastSeenDate && (
              <p className="text-sm md:text-xs text-muted-foreground">
                Last seen {formatDistanceToNow(lastSeenDate, { addSuffix: true })}
              </p>
            )
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-6 w-6 md:h-5 md:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClearChat} className="text-destructive text-base md:text-sm">
              <Trash2 className="mr-2 h-5 w-5 md:h-4 md:w-4" />
              <span>Clear Chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SidebarTrigger />
      </div>
    </header>
  );
}
