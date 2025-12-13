import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  AlertTriangle, 
  Users, 
  Shield,
  Save,
  Loader2,
  KeyRound
} from 'lucide-react';

interface SystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
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

export const SystemSettings = ({ systemConfig, onUpdateConfig }: SystemSettingsProps) => {
  const [localConfig, setLocalConfig] = useState(systemConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // PIN change state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  const handleChange = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig(localConfig);
      setHasChanges(false);
      toast.success('Settings saved');
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
      // Verify current PIN first
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-admin-pin', {
        body: { pin: currentPin }
      });

      if (verifyError || !verifyData?.success) {
        toast.error('Current PIN is incorrect');
        return;
      }

      // Hash the new PIN (same algorithm as edge function)
      const salt = 'ayn_admin_salt_2024';
      let hash = 0;
      const str = newPin + salt;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const newHash = Math.abs(hash).toString(16);

      // Update PIN in database
      const { error: updateError } = await supabase
        .from('system_config')
        .upsert({ 
          key: 'admin_pin', 
          value: { hash: newHash, salt },
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      toast.success('Admin PIN updated successfully');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (error) {
      console.error('Error changing PIN:', error);
      toast.error('Failed to update PIN');
    } finally {
      setIsChangingPin(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Maintenance Mode */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Maintenance Mode
            </CardTitle>
            <CardDescription>
              Enable to show maintenance message to all users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-mode">Enable Maintenance Mode</Label>
              <Switch
                id="maintenance-mode"
                checked={localConfig.maintenanceMode}
                onCheckedChange={(checked) => handleChange('maintenanceMode', checked)}
              />
            </div>
            
            {localConfig.maintenanceMode && (
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
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* User Settings */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Default User Settings
            </CardTitle>
            <CardDescription>
              Settings applied to new users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Settings */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure authentication and session security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Admin PIN Settings */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-500" />
              Admin Panel PIN
            </CardTitle>
            <CardDescription>
              Change the PIN required to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-pin">Current PIN</Label>
                <Input
                  id="current-pin"
                  type="password"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  maxLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-pin">New PIN (4-6 digits)</Label>
                <Input
                  id="new-pin"
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  maxLength={6}
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
                />
              </div>
            </div>
            
            <Button 
              onClick={handleChangePin} 
              disabled={isChangingPin || !currentPin || !newPin || !confirmPin}
              variant="outline"
            >
              {isChangingPin ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              Change PIN
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Default PIN is 1234. Please change it immediately for security.
            </p>
          </CardContent>
        </Card>
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
