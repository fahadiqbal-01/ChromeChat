
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, Search, User as UserIcon } from 'lucide-react';
import type { User, Chat } from '@/lib/types';
import { Logo } from '../logo';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


interface AppSidebarProps {
  user: User;
  chats: Chat[];
  allUsers: User[];
  onSelectChat: (chatId: string) => void;
  onSelectDeletedUser: () => void;
  onLogout: () => void;
  selectedChatId?: string | null;
  onAddFriend: (friend: User) => void;
  onLogoClick: () => void;
}

export function AppSidebar({
  user,
  chats,
  allUsers,
  onSelectChat,
  onSelectDeletedUser,
  onLogout,
  selectedChatId,
  onAddFriend,
  onLogoClick,
}: AppSidebarProps) {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const getChatPartner = (chat: Chat) => {
    const partnerId = chat.participantIds.find(id => id !== user.id);
    return allUsers.find(u => u.id === partnerId);
  };

  const chatsWithPartners = React.useMemo(() => {
    if (!chats || !allUsers) return [];
    return chats.map(chat => ({
      ...chat,
      partner: getChatPartner(chat)
    })).filter(chat => chat.partner); // Filter out chats where the partner doesn't exist
  }, [chats, allUsers, user.id]);

  const friends = React.useMemo(() => {
    if (!user || !chatsWithPartners) return [];
    return chatsWithPartners.map(c => c.partner).filter((p): p is User => !!p);
  }, [user, chatsWithPartners]);

  const searchResults = searchTerm.length > 0
  ? allUsers.filter(u => 
      u.id !== user.id && 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) && 
      !friends.some(f => f.id === u.id)
    ) 
  : [];
  
  const handleAddClick = (friend: User) => {
    onAddFriend(friend);
    setSearchTerm('');
  }

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    if(isMobile) {
        setOpenMobile(false);
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-2 pt-4">
            <Button variant="ghost" onClick={onLogoClick} className="w-full justify-start p-0 h-auto hover:bg-transparent">
                <Logo />
            </Button>
        </div>
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
        </div>
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
                        <Button size="sm" variant="outline" onClick={() => handleAddClick(foundUser)}>Add</Button>
                    </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
           <p className="px-2 text-xs font-semibold text-muted-foreground mb-2">Friends</p>
          <SidebarMenu>
            {chatsWithPartners.map((chat) => {
              const friend = chat.partner;
              const unreadCount = chat.unreadCount?.[user.id] || 0;
              
              if (!friend) {
                // This case should no longer happen due to the filter above, but as a fallback, we render nothing.
                return null;
              }

              return (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    onClick={() => handleSelectChat(chat.id)}
                    isActive={selectedChatId === chat.id}
                    className="justify-start w-full relative"
                  >
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {friend.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {friend.isActive && (
                        <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border-2 border-sidebar-background"></div>
                      )}
                    </div>
                    <span className="truncate">{friend.username}</span>
                    {unreadCount > 0 && (
                      <Badge className="absolute right-2 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
          <Button
            variant="ghost"
            onClick={onLogout}
            className={`w-full justify-start gap-2 ${
              state === 'collapsed' ? 'justify-center p-2' : ''
            }`}
          >
            <LogOut className="h-5 w-5" />
            {state === 'expanded' && 'Logout'}
          </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
