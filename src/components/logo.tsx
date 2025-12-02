import { MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <MessagesSquare className="h-12 w-12 text-primary md:h-6 md:w-6" />
      <h1 className="text-4xl font-bold tracking-tight md:text-xl">
        <span className="text-primary">Chrome</span>
        <span className="text-foreground">Chat</span>
      </h1>
    </div>
  );
}
