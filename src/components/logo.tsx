import { MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <MessagesSquare className="h-16 w-16 md:h-8 md:w-8" />
      <h1 className="text-5xl font-bold tracking-tight md:text-2xl">
        <span className="text-primary">Chrome</span>
        <span className="text-foreground">Chat</span>
      </h1>
    </div>
  );
}
