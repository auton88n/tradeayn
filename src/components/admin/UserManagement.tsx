import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Users, CheckCircle, XCircle, Clock, Building, Mail, 
  Search, Download, Settings, Loader2, UserCheck, UserX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EditLimitModal } from './EditLimitModal';
import { motion } from 'framer-motion';

interface Profile {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_person: string | null;
  created_at: string;
}

interface AccessGrantWithProfile {
  id: string;
  user_id: string;
  is_active: boolean;
  granted_at: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  monthly_limit: number | null;
  current_month_usage: number | null;
  user_email?: string | null;
  profiles: Profile | null;
}

interface UserManagementProps {
  allUsers: AccessGrantWithProfile[];
  onRefresh: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

export const UserManagement = ({ allUsers, onRefresh }: UserManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AccessGrantWithProfile | null>(null);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { toast } = useToast();

  const getStatusInfo = (grant: AccessGrantWithProfile) => {
    if (!grant.is_active && !grant.granted_at) {
      return { icon: Clock, label: 'Pending', variant: 'secondary' as const, color: 'text-amber-600' };
    }
    if (!grant.is_active) {
      return { icon: XCircle, label: 'Revoked', variant: 'destructive' as const, color: 'text-red-600' };
    }
    if (grant.expires_at && new Date(grant.expires_at) < new Date()) {
      return { icon: XCircle, label: 'Expired', variant: 'destructive' as const, color: 'text-red-600' };
    }
    return { icon: CheckCircle, label: 'Active', variant: 'default' as const, color: 'text-emerald-600' };
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const matchesSearch = !searchTerm || 
        user.profiles?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profiles?.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active) ||
        (statusFilter === 'pending' && !user.is_active && !user.granted_at);
      
      return matchesSearch && matchesStatus;
    });
  }, [allUsers, searchTerm, statusFilter]);

  const handleRevokeAccess = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('access_grants')
        .update({ is_active: false, notes: 'Access revoked by administrator' })
        .eq('user_id', userId);

      if (error) throw error;
      toast({ title: "Access Revoked", description: "User access has been revoked." });
      onRefresh();
    } catch (error) {
      toast({ title: "Error", description: "Failed to revoke user access.", variant: "destructive" });
    }
  };

  const handleGrantAccess = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('access_grants')
        .update({ is_active: true, granted_at: new Date().toISOString(), notes: 'Access granted by administrator' })
        .eq('user_id', userId);

      if (error) throw error;
      toast({ title: "Access Granted", description: "User access has been granted." });
      onRefresh();
    } catch (error) {
      toast({ title: "Error", description: "Failed to grant user access.", variant: "destructive" });
    }
  };

  const handleUpdateUserLimits = async (userIds: string[], newLimit: number | null) => {
    try {
      const { error } = await supabase
        .from('access_grants')
        .update({ monthly_limit: newLimit })
        .in('user_id', userIds);

      if (error) throw error;
      toast({ title: "Limits Updated", description: `Updated limits for ${userIds.length} user(s)` });
      onRefresh();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user limits.", variant: "destructive" });
    }
  };

  const handleEditLimit = (user: AccessGrantWithProfile) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  const handleBulkEditLimits = () => {
    setBulkEditModalOpen(true);
  };

  const confirmUpdateLimit = async (newLimit: number | null) => {
    if (editingUser) {
      await handleUpdateUserLimits([editingUser.user_id], newLimit);
    }
  };

  const confirmBulkUpdateLimits = async (newLimit: number | null) => {
    await handleUpdateUserLimits(selectedUsers, newLimit);
    setSelectedUsers([]);
  };

  const getUsagePercentage = (usage: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((usage / limit) * 100, 100);
  };

  const exportUserData = () => {
    const csvContent = [
      ['Email', 'Company', 'Contact Person', 'Status', 'Monthly Limit', 'Current Usage', 'Usage %', 'Created Date'].join(','),
      ...filteredUsers.map(user => [
        user.user_email || 'N/A',
        user.profiles?.company_name || 'N/A',
        user.profiles?.contact_person || 'N/A',
        user.is_active ? 'Active' : 'Inactive',
        user.monthly_limit || 'Unlimited',
        user.current_month_usage || 0,
        user.monthly_limit && user.current_month_usage !== null 
          ? ((user.current_month_usage / user.monthly_limit) * 100).toFixed(1) + '%' 
          : 'N/A',
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ayn-users-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export Complete", description: "User data exported to CSV file." });
  };

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0 || !bulkAction) return;
    
    setBulkActionLoading(true);
    try {
      switch (bulkAction) {
        case 'activate':
          const { error: activateError } = await supabase
            .from('access_grants')
            .update({ is_active: true, granted_at: new Date().toISOString() })
            .in('user_id', selectedUsers);
          if (activateError) throw activateError;
          break;
          
        case 'deactivate':
          const { error: deactivateError } = await supabase
            .from('access_grants')
            .update({ is_active: false })
            .in('user_id', selectedUsers);
          if (deactivateError) throw deactivateError;
          break;
          
        case 'reset_usage':
          const { error: resetError } = await supabase
            .from('access_grants')
            .update({ current_month_usage: 0 })
            .in('user_id', selectedUsers);
          if (resetError) throw resetError;
          break;
          
        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
            setBulkActionLoading(false);
            return;
          }
          await supabase.from('messages').delete().in('user_id', selectedUsers);
          await supabase.from('user_settings').delete().in('user_id', selectedUsers);
          await supabase.from('device_fingerprints').delete().in('user_id', selectedUsers);
          await supabase.from('access_grants').delete().in('user_id', selectedUsers);
          await supabase.from('profiles').delete().in('user_id', selectedUsers);
          break;
      }
      
      toast({ title: 'Success', description: `Bulk action completed for ${selectedUsers.length} users` });
      setSelectedUsers([]);
      setBulkAction('');
      onRefresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to complete bulk action', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-medium">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage user access and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedUsers.length > 0 && (
            <>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-44 bg-background/50 border-border/50">
                  <SelectValue placeholder="Bulk actions..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Activate Selected</SelectItem>
                  <SelectItem value="deactivate">Deactivate Selected</SelectItem>
                  <SelectItem value="reset_usage">Reset Usage</SelectItem>
                  <SelectItem value="delete">Delete Selected</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleBulkAction} disabled={!bulkAction || bulkActionLoading} size="sm">
                {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Apply
              </Button>
              <Button onClick={handleBulkEditLimits} variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Edit Limits ({selectedUsers.length})
              </Button>
            </>
          )}
          <Button onClick={exportUserData} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by company, contact, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-border/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-background/50 border-border/50">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
            <SelectItem value="pending">Pending Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>{filteredUsers.length} users</span>
      </div>

      {/* User List */}
      <div className="rounded-2xl border border-border/50 bg-background overflow-hidden">
        <ScrollArea className="h-[600px]">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-4 space-y-3"
          >
            {filteredUsers.map((user) => {
              const statusInfo = getStatusInfo(user);
              const StatusIcon = statusInfo.icon;
              const usagePercent = getUsagePercentage(user.current_month_usage ?? 0, user.monthly_limit);
              
              return (
                <motion.div 
                  key={user.id}
                  variants={itemVariants}
                  className="group p-5 rounded-xl border border-border/30 bg-background hover:border-border/60 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedUsers.includes(user.user_id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.user_id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.user_id));
                        }
                      }}
                      className="shrink-0"
                    />
                    
                    <div className="w-11 h-11 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-foreground/60" />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium truncate">{user.profiles?.company_name || 'Unknown Company'}</h3>
                        <div className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                          ${user.is_active 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : !user.granted_at 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }
                        `}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {user.user_email || 'No email'}
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{user.profiles?.contact_person || 'No contact'}</span>
                      </div>
                      
                      {/* Usage Bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[200px]">
                          <Progress value={usagePercent} className="h-1.5" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {user.current_month_usage ?? 0} / {user.monthly_limit ?? '∞'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditLimit(user)}
                        className="h-8 px-3 text-xs"
                      >
                        Edit Limit
                      </Button>
                      
                      {user.is_active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevokeAccess(user.user_id)}
                          className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <UserX className="w-3.5 h-3.5 mr-1.5" />
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGrantAccess(user.user_id)}
                          className="h-8 px-3 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                          Grant
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No users found matching your criteria.
              </div>
            )}
          </motion.div>
        </ScrollArea>
      </div>

      {/* Edit Limit Modal - Single User */}
      <EditLimitModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingUser(null);
        }}
        users={editingUser ? [{
          user_id: editingUser.user_id,
          user_email: editingUser.user_email ?? undefined,
          company_name: editingUser.profiles?.company_name ?? undefined,
          current_month_usage: editingUser.current_month_usage ?? 0,
          monthly_limit: editingUser.monthly_limit
        }] : []}
        onConfirm={confirmUpdateLimit}
        isBulk={false}
      />

      {/* Edit Limit Modal - Bulk */}
      <EditLimitModal
        isOpen={bulkEditModalOpen}
        onClose={() => setBulkEditModalOpen(false)}
        users={selectedUsers.map(userId => {
          const user = allUsers.find(u => u.user_id === userId);
          return {
            user_id: userId,
            user_email: user?.user_email ?? undefined,
            company_name: user?.profiles?.company_name ?? undefined,
            current_month_usage: user?.current_month_usage ?? 0,
            monthly_limit: user?.monthly_limit ?? null
          };
        })}
        onConfirm={confirmBulkUpdateLimits}
        isBulk={true}
      />
    </div>
  );
};