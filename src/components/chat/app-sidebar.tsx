'use client';

import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarInput,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { LogOut, Search, User as UserIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import type { User, Chat } from '@/lib/types';
import { Logo } from '../logo';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';


interface AppSidebarProps {
  user: User;
  chats: Chat[];
  allUsers: User[];
  onSelectChat: (chatId: string) => void;
  onLogout: () => void;
  selectedChatId?: string;
  friends: User[];
  onAddFriend: (friendId: string) => void;
}

export function AppSidebar({
  user,
  chats,
  allUsers,
  onSelectChat,
  onLogout,
  selectedChatId,
  friends,
  onAddFriend
}: AppSidebarProps) {
  const { state } = useSidebar();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const searchResults = searchTerm.length > 0
  ? allUsers.filter(u => 
      u.id !== user.id && 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) && 
      !friends.some(f => f.id === u.id)
    ) 
  : [];

  const getChatPartner = (chat: Chat) => {
    const partnerId = chat.participantIds.find(id => id !== user.id);
    return allUsers.find(u => u.id === partnerId);
  };
  
  const handleAddClick = (friendId: string) => {
    onAddFriend(friendId);
    setSearchTerm('');
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <SidebarInput 
              placeholder="Search users..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </SidebarGroup>
        
        {searchResults.length > 0 && (
          <SidebarGroup>
            <p className="px-2 text-xs font-semibold text-muted-foreground">Search Results</p>
            <SidebarMenu>
              {searchResults.map((foundUser) => (
                <SidebarMenuItem key={foundUser.id}>
                    <div className="flex w-full items-center justify-between p-2 text-sm">
                        <span>{foundUser.username}</span>
                        <Button size="sm" variant="outline" onClick={() => handleAddClick(foundUser.id)}>Add</Button>
                    </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
           <p className="px-2 text-xs font-semibold text-muted-foreground">Friends</p>
          <SidebarMenu>
            {friends.map((friend) => {
              const chat = chats.find(c => c.participantIds.includes(friend.id));
              if (!chat) return null;
              return (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectChat(chat.id)}
                    isActive={selectedChatId === chat.id}
                    className="justify-start w-full"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {friend.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{friend.username}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <Separator className="my-2" />
        <div
          className={`flex items-center gap-3 p-2 transition-all ${
            state === 'collapsed' ? 'justify-center' : ''
          }`}
        >
          <UserIcon className="h-8 w-8 rounded-full bg-muted p-1.5" />
          {state === 'expanded' && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-semibold">{user.username}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className={`shrink-0 ${
              state === 'collapsed' ? '' : 'ml-auto'
            }`}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
