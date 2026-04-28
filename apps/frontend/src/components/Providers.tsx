'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { Toaster } from './ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const init = useAuth((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
