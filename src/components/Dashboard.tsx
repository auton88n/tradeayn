import { User, Session } from '@supabase/supabase-js';
import { DashboardContainer } from './dashboard/DashboardContainer';
import { TermsModal } from './TermsModal';
import { MaintenanceBanner } from './MaintenanceBanner';
import { AdminPinGate } from './admin/AdminPinGate';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, lazy, Suspense } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { AdminLoader } from '@/components/ui/page-loader';

// Lazy load AdminPanel (only needed for admins)
const AdminPanel = lazy(() => import('./AdminPanel').then(module => ({ default: module.AdminPanel })));

interface DashboardProps {
  user: User;
  session: Session;
}

export default function Dashboard({ user, session }: DashboardProps) {
  const auth = useAuth(user, session);
  const [activeView, setActiveView] = useState<'chat' | 'admin'>('chat');
  const [showPinGate, setShowPinGate] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState({
    enableMaintenance: false,
    maintenanceMessage: 'System is currently under maintenance.',
    maintenanceStartTime: '',
    maintenanceEndTime: '',
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

  // Handle admin panel access with PIN
  const handleAdminPanelClick = () => {
    if (isAdminUnlocked) {
      setActiveView('admin');
    } else {
      setShowPinGate(true);
    }
  };

  const handlePinSuccess = () => {
    setIsAdminUnlocked(true);
    setShowPinGate(false);
    setActiveView('admin');
  };

  const handlePinCancel = () => {
    setShowPinGate(false);
  };

  return (
    <div dir="ltr" className="relative min-h-screen">
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

      {/* Admin PIN Gate */}
      <AdminPinGate
        open={showPinGate}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />

      {/* Main Content - conditionally render based on active view */}
      {activeView === 'admin' && auth.hasDutyAccess && isAdminUnlocked ? (
        <div className="min-h-screen p-6 pt-16 bg-background">
          <Suspense fallback={<AdminLoader />}>
            <AdminPanel 
              session={session} 
              onBackClick={() => setActiveView('chat')} 
              isAdmin={auth.isAdmin}
              isDuty={auth.isDuty}
            />
          </Suspense>
        </div>
      ) : (
        <SidebarProvider>
          <DashboardContainer 
            user={user}
            session={session}
            auth={auth}
            isAdmin={auth.isAdmin}
            hasDutyAccess={auth.hasDutyAccess}
            onAdminPanelClick={handleAdminPanelClick}
          />
        </SidebarProvider>
      )}
    </div>
  );
}
