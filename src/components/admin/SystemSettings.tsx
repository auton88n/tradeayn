import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  Users, 
  Shield,
  Save,
  Loader2,
  KeyRound,
  ChevronDown,
  ChevronRight,
  Clock,
  Mail,
  Bell
} from 'lucide-react';

interface SystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceStartTime?: string;
  maintenanceEndTime?: string;
  preMaintenanceNotice?: boolean;
  preMaintenanceMessage?: string;
  defaultMonthlyLimit: number;
  requireApproval: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
}

interface SystemSettingsProps {
  systemConfig: SystemConfig;
  onUpdateConfig: (updates: Partial<SystemConfig>) => Promise<void>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

interface CollapsibleSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection = ({ title, description, icon, children, defaultOpen = false }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription className="text-sm">{description}</CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-6">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export const SystemSettings = ({ systemConfig, onUpdateConfig }: SystemSettingsProps) => {
  const [localConfig, setLocalConfig] = useState(systemConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // PIN change state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pendingPinChange, setPendingPinChange] = useState<{
    id: string;
    created_at: string;
    expires_at: string;
  } | null>(null);

  // Check for pending PIN changes
  useEffect(() => {
    const checkPendingPinChange = async () => {
      const { data } = await supabase
        .from('pending_pin_changes')
        .select('id, created_at, expires_at')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setPendingPinChange(data);
      }
    };
    checkPendingPinChange();
  }, []);

  const handleChange = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // If enabling maintenance mode, send notification emails to all users
      if (localConfig.maintenanceMode && !systemConfig.maintenanceMode) {
        // Trigger maintenance notification
        const { error: notifyError } = await supabase.functions.invoke('admin-notifications', {
          body: {
            type: 'maintenance_announcement',
            message: localConfig.maintenanceMessage,
            startTime: localConfig.maintenanceStartTime,
            endTime: localConfig.maintenanceEndTime
          }
        });
        if (notifyError) {
          console.error('Failed to send maintenance notifications:', notifyError);
          toast.error('Maintenance enabled but failed to notify users');
        } else {
          toast.success('Maintenance enabled, users notified via email');
        }
      }
      
      await onUpdateConfig(localConfig);
      setHasChanges(false);
      if (!localConfig.maintenanceMode || systemConfig.maintenanceMode) {
        toast.success('Settings saved');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePin = async () => {
    if (newPin.length < 4 || newPin.length > 6) {
      toast.error('PIN must be 4-6 digits');
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      toast.error('PIN must contain only numbers');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    setIsChangingPin(true);
    try {
      const { data, error } = await supabase.functions.invoke('set-admin-pin', {
        body: { newPin }
      });

      if (error) {
        console.error('Error from edge function:', error);
        toast.error('Failed to request PIN change');
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Failed to request PIN change');
        return;
      }

      toast.success('PIN change request sent! Check your email to approve.');
      setNewPin('');
      setConfirmPin('');
      
      // Update pending state
      if (data.pending_id) {
        setPendingPinChange({
          id: data.pending_id,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        });
      }
    } catch (error) {
      console.error('Error changing PIN:', error);
      toast.error('Failed to request PIN change');
    } finally {
      setIsChangingPin(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Maintenance Mode */}
      <motion.div variants={itemVariants}>
        <CollapsibleSection
          title="Maintenance Mode"
          description="Block users during maintenance"
          icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <Label htmlFor="maintenance-mode" className="font-medium">Enable Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">Blocks all regular users, admins can still access</p>
              </div>
              <Switch
                id="maintenance-mode"
                checked={localConfig.maintenanceMode}
                onCheckedChange={(checked) => handleChange('maintenanceMode', checked)}
              />
            </div>
            
            {localConfig.maintenanceMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-message">Maintenance Message</Label>
                  <Textarea
                    id="maintenance-message"
                    value={localConfig.maintenanceMessage}
                    onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                    placeholder="Enter message to display during maintenance..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Start Time
                    </Label>
                    <Input
                      id="start-time"
                      type="datetime-local"
                      value={localConfig.maintenanceStartTime || ''}
                      onChange={(e) => handleChange('maintenanceStartTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> End Time
                    </Label>
                    <Input
                      id="end-time"
                      type="datetime-local"
                      value={localConfig.maintenanceEndTime || ''}
                      onChange={(e) => handleChange('maintenanceEndTime', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            
            {/* Pre-Maintenance Notice */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg mb-3">
                <div>
                  <Label htmlFor="pre-notice" className="font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4 text-yellow-600" />
                    Pre-Maintenance Notice
                  </Label>
                  <p className="text-xs text-muted-foreground">Show warning banner before maintenance starts</p>
                </div>
                <Switch
                  id="pre-notice"
                  checked={localConfig.preMaintenanceNotice || false}
                  onCheckedChange={(checked) => handleChange('preMaintenanceNotice', checked)}
                />
              </div>
              
              {localConfig.preMaintenanceNotice && (
                <div className="space-y-2">
                  <Label htmlFor="pre-message">Pre-Maintenance Message</Label>
                  <Textarea
                    id="pre-message"
                    value={localConfig.preMaintenanceMessage || ''}
                    onChange={(e) => handleChange('preMaintenanceMessage', e.target.value)}
                    placeholder="e.g., Scheduled maintenance in 2 hours..."
                    rows={2}
                  />
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Enabling maintenance will send email notifications to all users
            </p>
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* User Settings */}
      <motion.div variants={itemVariants}>
        <CollapsibleSection
          title="Default User Settings"
          description="Settings applied to new users"
          icon={<Users className="w-5 h-5 text-blue-500" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly-limit">Default Monthly Limit</Label>
                <Input
                  id="monthly-limit"
                  type="number"
                  value={localConfig.defaultMonthlyLimit}
                  onChange={(e) => handleChange('defaultMonthlyLimit', Number(e.target.value))}
                  min={0}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <Label htmlFor="require-approval">Require Approval</Label>
                <Switch
                  id="require-approval"
                  checked={localConfig.requireApproval}
                  onCheckedChange={(checked) => handleChange('requireApproval', checked)}
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* Security Settings */}
      <motion.div variants={itemVariants}>
        <CollapsibleSection
          title="Security Settings"
          description="Configure authentication and session security"
          icon={<Shield className="w-5 h-5 text-green-500" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-attempts">Max Login Attempts</Label>
                <Input
                  id="max-attempts"
                  type="number"
                  value={localConfig.maxLoginAttempts}
                  onChange={(e) => handleChange('maxLoginAttempts', Number(e.target.value))}
                  min={1}
                  max={10}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={localConfig.sessionTimeout}
                  onChange={(e) => handleChange('sessionTimeout', Number(e.target.value))}
                  min={5}
                  max={120}
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* Admin PIN Settings */}
      <motion.div variants={itemVariants}>
        <CollapsibleSection
          title="Admin Panel PIN"
          description="Change the PIN with email approval"
          icon={<KeyRound className="w-5 h-5 text-purple-500" />}
        >
          <div className="space-y-4">
            {pendingPinChange && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium">PIN Change Pending Approval</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Check your email to approve. Expires: {new Date(pendingPinChange.expires_at).toLocaleString()}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-pin">New PIN (4-6 digits)</Label>
                <Input
                  id="new-pin"
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  maxLength={6}
                  disabled={!!pendingPinChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirm New PIN</Label>
                <Input
                  id="confirm-pin"
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  maxLength={6}
                  disabled={!!pendingPinChange}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleChangePin} 
              disabled={isChangingPin || !newPin || !confirmPin || !!pendingPinChange}
              variant="outline"
            >
              {isChangingPin ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Request PIN Change
            </Button>
            
            <p className="text-xs text-muted-foreground">
              An approval email will be sent. Click the link in the email to confirm the PIN change.
            </p>
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
