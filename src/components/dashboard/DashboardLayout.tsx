import React, { Suspense } from 'react';
import { User } from '@supabase/supabase-js';
import { ErrorBoundary } from '../ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load components for better performance
const ChatContainer = React.lazy(() => import('./ChatContainer'));
const AdminContainer = React.lazy(() => import('./AdminContainer'));
const UserInterface = React.lazy(() => import('./UserInterface'));
const MaintenanceContainer = React.lazy(() => import('./MaintenanceContainer'));

interface DashboardLayoutProps {
  user: User;
  isAdmin: boolean;
  activeTab: 'chat' | 'admin';
  hasAccess: boolean;
  hasAcceptedTerms: boolean;
  maintenanceConfig: any;
  onTabChange: (tab: 'chat' | 'admin') => void;
}

const LoadingSkeleton = () => (
  <div className="flex h-screen">
    <div className="w-80 border-r bg-muted/30">
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
    <div className="flex-1 p-6 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  </div>
);

export default function DashboardLayout({
  user,
  isAdmin,
  activeTab,
  hasAccess,
  hasAcceptedTerms,
  maintenanceConfig,
  onTabChange
}: DashboardLayoutProps) {
  // Show maintenance first if enabled
  if (maintenanceConfig.enableMaintenance) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSkeleton />}>
          <MaintenanceContainer 
            user={user}
            maintenanceConfig={maintenanceConfig}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Show terms modal or user interface if not accepted
  if (!hasAcceptedTerms) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSkeleton />}>
          <UserInterface 
            user={user}
            hasAcceptedTerms={hasAcceptedTerms}
            hasAccess={hasAccess}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Main dashboard content
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton />}>
        {activeTab === 'admin' && isAdmin ? (
          <AdminContainer 
            user={user}
            onTabChange={onTabChange}
          />
        ) : (
          <ChatContainer 
            user={user}
            isAdmin={isAdmin}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}