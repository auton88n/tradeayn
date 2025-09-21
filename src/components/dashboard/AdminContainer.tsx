import React, { Suspense } from 'react';
import { User } from '@supabase/supabase-js';
import { AdminPanel } from '../AdminPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '../ErrorBoundary';

interface AdminContainerProps {
  user: User;
  onTabChange: (tab: 'chat' | 'admin') => void;
}

const AdminLoadingSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-16 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function AdminContainer({ user, onTabChange }: AdminContainerProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<AdminLoadingSkeleton />}>
        <AdminPanel />
      </Suspense>
    </ErrorBoundary>
  );
}