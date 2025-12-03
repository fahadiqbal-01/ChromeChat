
'use client';

import type { FriendRequest, User } from '@/lib/types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Check, X } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem } from '../ui/sidebar';


interface FriendRequestListProps {
  requests: FriendRequest[];
  allUsers: User[];
  onAccept: (request: FriendRequest) => void;
  onReject: (request: FriendRequest) => void;
}

export function FriendRequestList({
  requests,
  allUsers,
  onAccept,
  onReject,
}: FriendRequestListProps) {

  const handleAccept = (request: FriendRequest) => {
    onAccept(request);
  }

  const handleReject = (request: FriendRequest) => {
    onReject(request);
  }

  return (
    <SidebarMenu>
      {requests.map((request) => {
        const requester = allUsers.find((u) => u.id === request.requesterId);
        if (!requester) return null;

        return (
          <SidebarMenuItem key={request.id}>
            <div className="flex w-full items-center justify-between p-2 text-sm">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                        {requester.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{requester.username}</span>
                </div>
                <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleAccept(request)}>
                        <Check className="h-4 w-4 text-green-500"/>
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleReject(request)}>
                        <X className="h-4 w-4 text-red-500"/>
                    </Button>
                </div>
            </div>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
