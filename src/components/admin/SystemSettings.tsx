import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, Shield, AlertTriangle, Save
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemConfig {
  defaultMonthlyLimit: number;
  autoApproveRequests: boolean;
  requireAdminApproval: boolean;
  sessionTimeout: number;
  enableAuditLogging: boolean;
  maxConcurrentSessions: number;
  rateLimitPerMinute: number;
  enableMaintenance: boolean;
  maintenanceMessage: string;
  maintenanceStartTime: string;
  maintenanceEndTime: string;
  notificationEmail: string;
}

interface SystemSettingsProps {
  systemConfig: SystemConfig;
  onUpdateConfig: (newConfig: Partial<SystemConfig>) => void;
  onPerformMaintenance: (action: string) => void;
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
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export const SystemSettings = ({ 
  systemConfig, 
  onUpdateConfig, 
  onPerformMaintenance 
}: SystemSettingsProps) => {
  const [saving, setSaving] = useState(false);

  const handleConfigUpdate = async (updates: Partial<SystemConfig>) => {
    setSaving(true);
    try {
      await onUpdateConfig(updates);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h2 className="text-xl font-serif font-medium">System Configuration</h2>
        <p className="text-sm text-muted-foreground">Configure system-wide settings and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Mode */}
        <motion.div 
          variants={itemVariants}
          className="rounded-2xl border border-border/50 bg-background overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-border/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium">Maintenance Mode</h3>
              <p className="text-sm text-muted-foreground">Control system availability</p>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Enable Maintenance</label>
                <p className="text-xs text-muted-foreground">Show maintenance banner to users</p>
              </div>
              <Switch 
                checked={systemConfig.enableMaintenance}
                onCheckedChange={(checked) => handleConfigUpdate({ enableMaintenance: checked })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Maintenance Message</label>
              <Textarea 
                value={systemConfig.maintenanceMessage}
                onChange={(e) => onUpdateConfig({ maintenanceMessage: e.target.value })}
                placeholder="Enter maintenance message..."
                rows={3}
                className="bg-muted/30 border-border/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input 
                  type="datetime-local" 
                  value={systemConfig.maintenanceStartTime}
                  onChange={(e) => onUpdateConfig({ maintenanceStartTime: e.target.value })}
                  className="bg-muted/30 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input 
                  type="datetime-local" 
                  value={systemConfig.maintenanceEndTime}
                  onChange={(e) => onUpdateConfig({ maintenanceEndTime: e.target.value })}
                  className="bg-muted/30 border-border/50"
                />
              </div>
            </div>

            {systemConfig.enableMaintenance && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Preview</span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {systemConfig.maintenanceMessage || 'Your maintenance message will appear here'}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Default User Settings */}
        <motion.div 
          variants={itemVariants}
          className="rounded-2xl border border-border/50 bg-background overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-border/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center">
              <Settings className="w-5 h-5 text-foreground/60" />
            </div>
            <div>
              <h3 className="font-medium">Default User Settings</h3>
              <p className="text-sm text-muted-foreground">Configure new user defaults</p>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Monthly Limit</label>
              <Input 
                type="number" 
                value={systemConfig.defaultMonthlyLimit}
                onChange={(e) => onUpdateConfig({ defaultMonthlyLimit: parseInt(e.target.value) })}
                className="bg-muted/30 border-border/50"
              />
              <p className="text-xs text-muted-foreground">Messages per month for new users</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Auto-approve Requests</label>
                <p className="text-xs text-muted-foreground">Automatically grant access to new users</p>
              </div>
              <Switch 
                checked={systemConfig.autoApproveRequests}
                onCheckedChange={(checked) => onUpdateConfig({ autoApproveRequests: checked })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Email</label>
              <Input 
                type="email" 
                value={systemConfig.notificationEmail}
                onChange={(e) => onUpdateConfig({ notificationEmail: e.target.value })}
                placeholder="admin@example.com"
                className="bg-muted/30 border-border/50"
              />
              <p className="text-xs text-muted-foreground">Receive alerts about new registrations</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session Timeout (hours)</label>
              <Input 
                type="number" 
                value={systemConfig.sessionTimeout}
                onChange={(e) => onUpdateConfig({ sessionTimeout: parseInt(e.target.value) })}
                className="bg-muted/30 border-border/50"
              />
            </div>
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div 
          variants={itemVariants}
          className="rounded-2xl border border-border/50 bg-background overflow-hidden lg:col-span-2"
        >
          <div className="px-6 py-5 border-b border-border/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center">
              <Shield className="w-5 h-5 text-foreground/60" />
            </div>
            <div>
              <h3 className="font-medium">Security & Access Control</h3>
              <p className="text-sm text-muted-foreground">Configure security policies</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Require Admin Approval</label>
                    <p className="text-xs text-muted-foreground">New users need admin approval</p>
                  </div>
                  <Switch 
                    checked={systemConfig.requireAdminApproval}
                    onCheckedChange={(checked) => onUpdateConfig({ requireAdminApproval: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Enable Audit Logging</label>
                    <p className="text-xs text-muted-foreground">Log all security events</p>
                  </div>
                  <Switch 
                    checked={systemConfig.enableAuditLogging}
                    onCheckedChange={(checked) => onUpdateConfig({ enableAuditLogging: checked })}
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rate Limit (per minute)</label>
                  <Input 
                    type="number" 
                    value={systemConfig.rateLimitPerMinute}
                    onChange={(e) => onUpdateConfig({ rateLimitPerMinute: parseInt(e.target.value) })}
                    className="bg-muted/30 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground">Max API requests per minute</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Concurrent Sessions</label>
                  <Input 
                    type="number" 
                    value={systemConfig.maxConcurrentSessions}
                    onChange={(e) => onUpdateConfig({ maxConcurrentSessions: parseInt(e.target.value) })}
                    className="bg-muted/30 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground">Active sessions per user</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};