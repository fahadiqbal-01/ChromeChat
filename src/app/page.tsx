'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ChatLayout } from '@/components/chat/chat-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function HomePage() {
  const { user, isUserLoading: loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="h-svh">
      <SidebarProvider defaultOpen={false}>
        <ChatLayout />
      </SidebarProvider>
    </main>
  );
}
