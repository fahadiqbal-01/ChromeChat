
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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, Search, User as UserIcon, X } from 'lucide-react';
import type { User, Chat, FriendRequest } from '@/lib/types';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FriendRequestList } from './friend-request-list';


interface AppSidebarProps {
  user: User;
  chats: (Chat & { partner?: User })[];
  allUsers: User[];
  onSelectChat: (chatId: string) => void;
  onLogout: () => void;
  selectedChatId?: string | null;
  onAddFriend: (friend: User) => void;
  onLogoClick: () => void;
  friendRequests: FriendRequest[];
  onAcceptRequest: (request: FriendRequest) => void;
  onRejectRequest: (request: FriendRequest) => void;
}

export function AppSidebar({
  user,
  chats,
  allUsers,
  onSelectChat,
  onLogout,
  selectedChatId,
  onAddFriend,
  onLogoClick,
  friendRequests,
  onAcceptRequest,
  onRejectRequest,
}: AppSidebarProps) {
  const { state, setOpenMobile, isMobile, toggleSidebar } = useSidebar();
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();
  
  const friends = React.useMemo(() => {
    if (!user || !user.friendIds) return [];
    return allUsers.filter(u => user.friendIds?.includes(u.id));
  }, [user, allUsers]);

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
    toast({
        title: 'Friend Request Sent',
        description: `Your friend request to ${friend.username} has been sent.`,
    });
  }

  const handleSelectChat = (chat: Chat & { partner?: User }) => {
    if (!chat.partner) {
       toast({
        variant: 'destructive',
        title: 'User Unavailable',
        description: 'This user has deleted their account and can no longer receive messages.',
      });
      return;
    }
    onSelectChat(chat.id);
    if(isMobile) {
        setOpenMobile(false);
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div
          className={`flex items-center gap-3 p-2 transition-all ${
            state === 'collapsed' ? 'flex-col' : ''
          }`}
        >
          <UserIcon className="h-8 w-8 rounded-full bg-muted p-1.5" />
          <div className={`flex-1 overflow-hidden ${state === 'expanded' ? 'flex justify-between items-center' : 'text-center'}`}>
            <p className="truncate font-semibold text-sm">{user.username}</p>
            {state === 'expanded' && (
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
                  <X className="h-6 w-6" />
              </Button>
            )}
          </div>
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

        {friendRequests.length > 0 && (
             <SidebarGroup>
                <p className="px-2 text-xs font-semibold text-muted-foreground mb-2">Friend Requests</p>
                <FriendRequestList
                    requests={friendRequests}
                    allUsers={allUsers}
                    onAccept={onAcceptRequest}
                    onReject={onRejectRequest}
                />
            </SidebarGroup>
        )}

        <SidebarGroup>
           <p className="px-2 text-xs font-semibold text-muted-foreground mb-2">Friends</p>
          <SidebarMenu>
            {chats.map((chat) => {
              const friend = chat.partner;
              const username = friend ? friend.username : 'Deleted User';
              const isFriendActive = friend?.isActive ?? false;

              // This is a temporary fix until we have a better way to handle unread counts
              const unreadCount = chat.unreadCount ? chat.unreadCount[user.id] || 0 : 0;


              return (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    onClick={() => handleSelectChat(chat)}
                    isActive={selectedChatId === chat.id}
                    className="justify-start w-full relative"
                  >
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isFriendActive && (
                        <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border-2 border-sidebar-background"></div>
                      )}
                    </div>
                    <span className="truncate">{username}</span>
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
