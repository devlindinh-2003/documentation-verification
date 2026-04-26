'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { Header } from '../components/Header';
import '../app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const init = useAuth((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <QueryClientProvider client={queryClient}>
          <Header />
          <main>
            {children}
          </main>
        </QueryClientProvider>
      </body>
    </html>
  );
}
