import { User, Session } from '@supabase/supabase-js';
import { DashboardContainer } from './dashboard/DashboardContainer';
import { TermsModal } from './TermsModal';
import { MaintenanceBanner } from './MaintenanceBanner';
import { SessionTimeoutModal } from './SessionTimeoutModal';
import { useAuth } from '@/hooks/useAuth';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useState, useEffect, lazy, Suspense } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { AdminLoader } from '@/components/ui/page-loader';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Lazy load AdminPanel with retry logic for cache/network failures
const lazyRetry = <T extends React.ComponentType<unknown>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): Promise<{ default: T }> => {
  return new Promise((resolve, reject) => {
    const attempt = (retriesLeft: number) => {
      componentImport()
        .then(resolve)
        .catch((error) => {
          if (retriesLeft <= 0) {
            reject(error);
            return;
          }
          // Clear module cache and retry after delay
          setTimeout(() => {
            attempt(retriesLeft - 1);
          }, delay);
        });
    };
    attempt(retries);
  });
};

const AdminPanel = lazy(() => 
  lazyRetry(() => import('./AdminPanel').then(module => ({ default: module.AdminPanel })))
);

// Fallback component for admin panel load failures
const AdminLoadError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
    <div className="text-center space-y-2">
      <h2 className="text-xl font-semibold text-foreground">Failed to load Admin Panel</h2>
      <p className="text-muted-foreground">This may be due to a network issue or cached files.</p>
    </div>
    <Button onClick={onRetry} className="gap-2">
      <RefreshCw className="h-4 w-4" />
      Reload Page
    </Button>
  </div>
);

interface DashboardProps {
  user: User;
  session: Session;
}

export default function Dashboard({ user, session }: DashboardProps) {
  const auth = useAuth(user, session);
  const [activeView, setActiveView] = useState<'chat' | 'admin'>('chat');
  const [adminLoadError, setAdminLoadError] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState({
    enableMaintenance: false,
    maintenanceMessage: 'System is currently under maintenance.',
    maintenanceStartTime: '',
    maintenanceEndTime: '',
  });

  const handleReloadPage = () => {
    window.location.reload();
  };

  // Session timeout with 30-minute inactivity auto-logout
  const sessionTimeout = useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 1,
  });

  // Load maintenance config from database
  useEffect(() => {
    const loadMaintenanceConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('system_config')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle();

        if (error) {
          console.error('Error loading maintenance config:', error);
          return;
        }

        if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
          interface MaintenanceConfig {
            enabled?: boolean;
            message?: string;
            startTime?: string;
            endTime?: string;
          }
          const config = data.value as MaintenanceConfig;
          setMaintenanceConfig({
            enableMaintenance: config.enabled || false,
            maintenanceMessage: config.message || 'System is currently under maintenance.',
            maintenanceStartTime: config.startTime || '',
            maintenanceEndTime: config.endTime || '',
          });
        }
      } catch (error) {
        console.error('Error loading maintenance config:', error);
      }
    };

    loadMaintenanceConfig();

    // Set up realtime subscription to listen for config changes
    const channel = supabase
      .channel('system_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_config',
          filter: 'key=eq.maintenance_mode'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'value' in payload.new) {
            const value = payload.new.value;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              interface MaintenanceConfig {
                enabled?: boolean;
                message?: string;
                startTime?: string;
                endTime?: string;
              }
              const config = value as MaintenanceConfig;
              setMaintenanceConfig({
                enableMaintenance: config.enabled || false,
                maintenanceMessage: config.message || 'System is currently under maintenance.',
                maintenanceStartTime: config.startTime || '',
                maintenanceEndTime: config.endTime || '',
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Maintenance Banner - positioned at top */}
      {maintenanceConfig.enableMaintenance && (
        <MaintenanceBanner
          isEnabled={maintenanceConfig.enableMaintenance}
          message={maintenanceConfig.maintenanceMessage}
          startTime={maintenanceConfig.maintenanceStartTime}
          endTime={maintenanceConfig.maintenanceEndTime}
        />
      )}

      {/* Terms Modal - shows when terms not accepted (only after auth loading completes) */}
      <TermsModal
        open={!auth.isAuthLoading && !auth.hasAcceptedTerms}
        onAccept={auth.acceptTerms}
      />

      {/* Session Timeout Warning Modal */}
      <SessionTimeoutModal
        open={sessionTimeout.showWarning}
        remainingSeconds={sessionTimeout.remainingSeconds}
        onStayLoggedIn={sessionTimeout.handleStayLoggedIn}
        onLogoutNow={sessionTimeout.handleLogoutNow}
      />

      {/* Main Content - conditionally render based on active view */}
      {activeView === 'admin' && auth.isAdmin ? (
        <div className="min-h-screen p-6 pt-16 bg-background">
          {adminLoadError ? (
            <AdminLoadError onRetry={handleReloadPage} />
          ) : (
            <Suspense fallback={<AdminLoader />}>
              <AdminPanel />
            </Suspense>
          )}
        </div>
      ) : (
        <SidebarProvider>
          <DashboardContainer 
            user={user}
            auth={auth}
            isAdmin={auth.isAdmin}
            onAdminPanelClick={() => setActiveView('admin')}
          />
        </SidebarProvider>
      )}
    </div>
  );
}
