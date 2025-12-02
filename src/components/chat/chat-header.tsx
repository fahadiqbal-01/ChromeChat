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
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <Avatar className="h-8 w-8">
            <AvatarFallback>
                {partner.username.charAt(0).toUpperCase()}
            </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">{partner.username}</h2>
          {partner.isActive ? (
            <p className="text-xs text-green-500">Online</p>
          ) : (
            lastSeenDate && (
              <p className="text-xs text-muted-foreground">
                Last seen {formatDistanceToNow(lastSeenDate, { addSuffix: true })}
              </p>
            )
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onClearChat} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Clear Chat</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
