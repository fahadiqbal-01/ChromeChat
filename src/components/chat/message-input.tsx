
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useRef } from 'react';

const formSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onTypingChange: (isTyping: boolean) => void;
}

export function MessageInput({ onSendMessage, onTypingChange }: MessageInputProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { watch, reset } = form;
  const messageValue = watch('message');

  useEffect(() => {
    onTypingChange(messageValue.length > 0);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (messageValue.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false);
      }, 3000); // 3 seconds timeout
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageValue, onTypingChange]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    onSendMessage(values.message);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTypingChange(false);
    reset();
  }

  return (
    <div className="border-t bg-background p-4 md:px-4 md:py-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex items-center gap-2"
        >
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    placeholder="Type a message..."
                    className="resize-none"
                    rows={1}
                    {...field}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" size="icon" disabled={form.formState.isSubmitting || !form.formState.isValid}>
            <SendHorizontal />
            <span className="sr-only">Send Message</span>
          </Button>
        </form>
      </Form>
    </div>
  );
}
