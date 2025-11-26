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

      {/* Admin Toggle Button (only for admins) */}
      {auth.isAdmin && (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 right-4 z-50"
          onClick={() => setActiveView(activeView === 'chat' ? 'admin' : 'chat')}
        >
          <Shield className="w-4 h-4 mr-2" />
          {activeView === 'chat' ? 'Admin Panel' : 'Back to Chat'}
        </Button>
      )}

      {/* Main Content - conditionally render based on active view */}
      {activeView === 'admin' && auth.isAdmin ? (
        <div className="min-h-screen p-6 pt-16 bg-background">
          <AdminPanel />
        </div>
      ) : (
        <SidebarProvider>
          <DashboardContainer user={user} />
        </SidebarProvider>
      )}
    </div>
  );
}
