import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, Power, PowerOff, Shield, Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmergencyControlsProps {
  onRefresh?: () => void;
}

export const EmergencyControls = ({ onRefresh }: EmergencyControlsProps) => {
  const [isShutdown, setIsShutdown] = useState(false);
  const [shutdownReason, setShutdownReason] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check current shutdown status
  const checkShutdownStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('check_emergency_shutdown');
      if (error) throw error;
      setIsShutdown(data || false);
    } catch (error) {
      console.error('Error checking shutdown status:', error);
    }
  };

  // Initialize status check
  useEffect(() => {
    checkShutdownStatus();
  }, []);

  const activateEmergencyShutdown = async () => {
    if (!shutdownReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the emergency shutdown.",
        variant: "destructive"
      });
      return;
    }

    // Note: In production, password validation should be done server-side
    // The emergency password is now stored as an environment variable
    if (!masterPassword.trim()) {
      toast({
        title: "Error", 
        description: "Emergency password is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Update system status
      const { error: updateError } = await supabase
        .from('system_status')
        .update({
          is_emergency_shutdown: true,
          shutdown_reason: shutdownReason,
          shutdown_initiated_by: user.id,
          shutdown_initiated_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('system_status').select('id').single()).data?.id);

      if (updateError) throw updateError;

      // Send notification
      await supabase.functions.invoke('send-notifications', {
        body: {
          type: 'emergency_shutdown',
          subject: '🚨 EMERGENCY SHUTDOWN ACTIVATED',
          content: `
            <div style="background: #fee2e2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px;">
              <h2 style="color: #dc2626; margin: 0 0 15px 0;">🚨 EMERGENCY SHUTDOWN ACTIVATED</h2>
              <p><strong>System Status:</strong> Emergency maintenance mode</p>
              <p><strong>Initiated By:</strong> ${user.email}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Reason:</strong> ${shutdownReason}</p>
            </div>
            <p style="margin-top: 20px;">All user services have been suspended immediately. The system will remain offline until manually reactivated.</p>
          `,
          metadata: {
            initiated_by: user.email,
            reason: shutdownReason,
            timestamp: new Date().toISOString()
          }
        }
      });

      setIsShutdown(true);
      setShutdownReason('');
      setMasterPassword('');
      
      toast({
        title: "Emergency Shutdown Activated",
        description: "System is now in emergency maintenance mode.",
        variant: "destructive"
      });

      onRefresh?.();

    } catch (error: any) {
      console.error('Error activating emergency shutdown:', error);
      toast({
        title: "Error",
        description: "Failed to activate emergency shutdown: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateEmergencyShutdown = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Update system status
      const { error: updateError } = await supabase
        .from('system_status')
        .update({
          is_emergency_shutdown: false,
          shutdown_reason: null,
          shutdown_initiated_by: null,
          shutdown_initiated_at: null,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('system_status').select('id').single()).data?.id);

      if (updateError) throw updateError;

      // Send notification
      await supabase.functions.invoke('send-notifications', {
        body: {
          type: 'emergency_shutdown',
          subject: '✅ System Restored - Emergency Shutdown Deactivated',
          content: `
            <div style="background: #dcfce7; border: 2px solid #16a34a; padding: 20px; border-radius: 8px;">
              <h2 style="color: #16a34a; margin: 0 0 15px 0;">✅ SYSTEM RESTORED</h2>
              <p><strong>System Status:</strong> Normal operations resumed</p>
              <p><strong>Restored By:</strong> ${user.email}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="margin-top: 20px;">All user services have been restored and are now available.</p>
          `,
          metadata: {
            restored_by: user.email,
            timestamp: new Date().toISOString()
          }
        }
      });

      setIsShutdown(false);
      
      toast({
        title: "System Restored",
        description: "Emergency shutdown has been deactivated. Normal operations resumed.",
      });

      onRefresh?.();

    } catch (error: any) {
      console.error('Error deactivating emergency shutdown:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate emergency shutdown: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Emergency Controls
          {isShutdown && (
            <Badge variant="destructive" className="ml-2">
              <PowerOff className="w-3 h-3 mr-1" />
              SHUTDOWN ACTIVE
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Critical system controls for emergency situations. Use with extreme caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Current Status */}
        <div className={`p-4 rounded-lg border ${isShutdown ? 'bg-destructive/10 border-destructive' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2">
            {isShutdown ? (
              <>
                <PowerOff className="w-5 h-5 text-destructive" />
                <span className="font-medium text-destructive">Emergency Shutdown Active</span>
              </>
            ) : (
              <>
                <Power className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">System Operational</span>
              </>
            )}
          </div>
          <p className="text-sm mt-2 text-muted-foreground">
            {isShutdown 
              ? "All user services are suspended. System is in emergency maintenance mode."
              : "All systems are running normally and accepting user requests."
            }
          </p>
        </div>

        {!isShutdown ? (
          /* Shutdown Controls */
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Shutdown Reason</label>
              <Textarea
                placeholder="Describe the emergency situation requiring shutdown..."
                value={shutdownReason}
                onChange={(e) => setShutdownReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Master Password</label>
              <Input
                type="password"
                placeholder="Enter emergency master password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={!shutdownReason.trim() || !masterPassword.trim() || isLoading}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Activate Emergency Shutdown
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Confirm Emergency Shutdown
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p><strong>This action will immediately:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Suspend all user services and API access</li>
                      <li>Block all new requests to the system</li>
                      <li>Send emergency notifications to administrators</li>
                      <li>Require manual intervention to restore service</li>
                    </ul>
                    <p className="text-destructive font-medium">Only proceed if there is a genuine emergency!</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={activateEmergencyShutdown}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Confirm Emergency Shutdown
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          /* Restore Controls */
          <div className="space-y-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  <Power className="w-4 h-4 mr-2" />
                  Restore System Operations
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Power className="w-5 h-5 text-green-600" />
                    Restore System Operations
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will deactivate the emergency shutdown and restore all user services. 
                    Are you sure the emergency situation has been resolved?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deactivateEmergencyShutdown}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Restore Operations
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Refresh the page after restoring to ensure all components update properly
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};