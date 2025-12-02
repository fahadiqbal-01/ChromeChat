import { MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <MessagesSquare className="h-10 w-10 text-primary" />
      <h1 className="text-4xl font-bold tracking-tight">
        <span className="text-primary">Chrome</span>
        <span className="text-foreground">Chat</span>
      </h1>
    </div>
  );
}
