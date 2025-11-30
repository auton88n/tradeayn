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

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const auth = useAuth(user);
  const [activeView, setActiveView] = useState<'chat' | 'admin'>('chat');
  const [maintenanceConfig, setMaintenanceConfig] = useState({
    enableMaintenance: false,
    maintenanceMessage: 'System is currently under maintenance.',
  });

  // Load maintenance config from localStorage
  useEffect(() => {
    const storedConfig = localStorage.getItem('ayn_maintenance_config');
    if (storedConfig) {
      try {
        setMaintenanceConfig(JSON.parse(storedConfig));
      } catch (e) {
        console.error('Error parsing maintenance config:', e);
      }
    }
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Static White Glossy Blur Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Main white glossy overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl" />
        
        {/* Subtle gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10" />
        
        {/* Top gradient glow */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent blur-3xl" />
        
        {/* Bottom gradient glow */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/15 to-transparent blur-3xl" />
        
        {/* Side glows for depth */}
        <div className="absolute top-0 bottom-0 left-0 w-1/4 bg-gradient-to-r from-white/12 to-transparent blur-2xl" />
        <div className="absolute top-0 bottom-0 right-0 w-1/4 bg-gradient-to-l from-white/12 to-transparent blur-2xl" />
        
        {/* Center subtle highlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-white/8 rounded-full blur-[100px]" />
      </div>

      {/* All content with higher z-index */}
      <div className="relative z-10 min-h-screen">
        {/* Maintenance Banner - positioned at top */}
        {maintenanceConfig.enableMaintenance && (
          <MaintenanceBanner
            isEnabled={maintenanceConfig.enableMaintenance}
            message={maintenanceConfig.maintenanceMessage}
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
    </div>
  );
}
