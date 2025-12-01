import { User } from '@supabase/supabase-js';
import { DashboardContainer } from './dashboard/DashboardContainer';
import { TermsModal } from './TermsModal';
import { MaintenanceBanner } from './MaintenanceBanner';
import { AdminPanel } from './AdminPanel';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const auth = useAuth(user);
  const [activeView, setActiveView] = useState<'chat' | 'admin'>('chat');
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
          .eq('key', 'maintenance_config')
          .maybeSingle();

        if (error) {
          console.error('Error loading maintenance config:', error);
          return;
        }

        if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
          const config = data.value as Record<string, any>;
          setMaintenanceConfig({
            enableMaintenance: config.enableMaintenance || false,
            maintenanceMessage: config.maintenanceMessage || 'System is currently under maintenance.',
            maintenanceStartTime: config.maintenanceStartTime || '',
            maintenanceEndTime: config.maintenanceEndTime || '',
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
          filter: 'key=eq.maintenance_config'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'value' in payload.new) {
            const value = payload.new.value;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              const config = value as Record<string, any>;
              setMaintenanceConfig({
                enableMaintenance: config.enableMaintenance || false,
                maintenanceMessage: config.maintenanceMessage || 'System is currently under maintenance.',
                maintenanceStartTime: config.maintenanceStartTime || '',
                maintenanceEndTime: config.maintenanceEndTime || '',
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

      {/* Terms Modal - shows when terms not accepted */}
      <TermsModal
        open={!auth.hasAcceptedTerms}
        onAccept={auth.acceptTerms}
      />

      {/* Main Content - conditionally render based on active view */}
      {activeView === 'admin' && auth.isAdmin ? (
        <div className="min-h-screen p-6 pt-16 bg-background">
          <AdminPanel />
        </div>
      ) : (
        <SidebarProvider>
          <DashboardContainer 
            user={user}
            isAdmin={auth.isAdmin}
            onAdminPanelClick={() => setActiveView('admin')}
          />
        </SidebarProvider>
      )}
    </div>
  );
}
