'use client';

import { MoreVertical, Trash2, UserX, Bot } from 'lucide-react';
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

interface ChatHeaderProps {
  partner: User;
  onClearChat: () => void;
  onUnfriend: () => void;
  isBot?: boolean;
}

export function ChatHeader({ partner, onClearChat, onUnfriend, isBot = false }: ChatHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <Avatar className="h-8 w-8">
            <AvatarFallback className={isBot ? 'bg-primary text-primary-foreground' : ''}>
                {isBot ? <Bot className="h-5 w-5" /> : partner.username.charAt(0).toUpperCase()}
            </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold">{partner.username}</h2>
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
          {!isBot && (
            <DropdownMenuItem onClick={onUnfriend} className="text-destructive">
              <UserX className="mr-2 h-4 w-4" />
              <span>Unfriend</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
