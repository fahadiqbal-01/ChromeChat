import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm items-center justify-center">
        {children}
      </div>
    </main>
  );
}
