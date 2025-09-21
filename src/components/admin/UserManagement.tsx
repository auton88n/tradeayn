import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Users, CheckCircle, XCircle, Clock, Building, Mail, Phone, Shield, Eye, Edit,
  Search, Filter, Download, UserPlus, UserMinus, MoreVertical, Settings,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { EditLimitModal } from './EditLimitModal';

interface Profile {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_person: string | null;
  phone: string | null;
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
  current_month_usage: number;
  user_email?: string;
  profiles: Profile | null;
}

interface UserManagementProps {
  allUsers: AccessGrantWithProfile[];
  onRefresh: () => void;
  requireAuthentication?: (action: () => void) => void;
}

export const UserManagement = ({ allUsers, onRefresh, requireAuthentication }: UserManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AccessGrantWithProfile | null>(null);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const getStatusInfo = (grant: AccessGrantWithProfile) => {
    if (!grant.is_active && !grant.granted_at) {
      return { icon: Clock, label: t('admin.pending'), variant: 'secondary' as const };
    }
    if (!grant.is_active) {
      return { icon: XCircle, label: t('admin.deniedRevoked'), variant: 'destructive' as const };
    }
    if (grant.expires_at && new Date(grant.expires_at) < new Date()) {
      return { icon: XCircle, label: t('admin.expired'), variant: 'destructive' as const };
    }
    return { icon: CheckCircle, label: t('admin.active'), variant: 'default' as const };
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

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleGrantAccess = async (userId: string) => {
    const action = async () => {
      try {
        const { error } = await supabase
          .from('access_grants')
          .update({
            is_active: true,
            granted_at: new Date().toISOString(),
            notes: 'Access granted by administrator'
          })
          .eq('user_id', userId);
        if (error) throw error;
        toast({ title: t('admin.accessRestored'), description: t('admin.accessRestoredDesc') });
        onRefresh();
      } catch (error) {
        toast({ title: "Error", description: "Failed to grant access.", variant: "destructive" });
      }
    };
    if (requireAuthentication) requireAuthentication(action);
    else await action();
  };

  const handleRevokeAccess = async (userId: string) => {
    const action = async () => {
      try {
        const { error } = await supabase
          .from('access_grants')
          .update({ 
            is_active: false, 
            notes: 'Access revoked by administrator' 
          })
          .eq('user_id', userId);
        if (error) throw error;
        toast({ title: t('admin.accessRevoked'), description: t('admin.accessRevokedDesc') });
        onRefresh();
      } catch (error) {
        toast({ title: "Error", description: "Failed to revoke access.", variant: "destructive" });
      }
    };
    if (requireAuthentication) requireAuthentication(action);
    else await action();
  };

  const handleUpdateUserLimits = async (userIds: string[], newLimit: number | null) => {
    const action = async () => {
      try {
        const { error } = await supabase
          .from('access_grants')
          .update({ monthly_limit: newLimit })
          .in('user_id', userIds);
        if (error) throw error;
        toast({
          title: t('admin.limitsUpdated'),
          description: `${t('admin.limitsUpdatedDesc')} (${userIds.length} users)`
        });
        onRefresh();
      } catch (error) {
        toast({ title: "Error", description: "Failed to update limits.", variant: "destructive" });
      }
    };
    if (requireAuthentication) requireAuthentication(action);
    else await action();
  };

  const handleEditLimit = (user: AccessGrantWithProfile) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  const handleBulkEditLimits = () => {
    setBulkEditModalOpen(true);
  };

  const exportUserData = () => {
    const csvContent = [
      ['Email', 'Company', 'Contact Person', 'Status', 'Monthly Limit', 'Current Usage', 'Created Date'].join(','),
      ...filteredUsers.map(user => [
        user.user_email || 'N/A',
        user.profiles?.company_name || 'N/A',
        user.profiles?.contact_person || 'N/A',
        user.is_active ? 'Active' : 'Inactive',
        user.monthly_limit || 'Unlimited',
        user.current_month_usage || 0,
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.userManagement')}</h2>
          <p className="text-muted-foreground">{t('admin.userManagementDesc')}</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedUsers.length > 0 && (
            <Button onClick={handleBulkEditLimits} variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Edit Limits ({selectedUsers.length})
            </Button>
          )}
          <Button onClick={exportUserData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t('admin.export')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t('admin.filtersSearch')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('admin.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('admin.filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allUsers')}</SelectItem>
                <SelectItem value="active">{t('admin.activeOnly')}</SelectItem>
                <SelectItem value="inactive">{t('admin.inactiveOnly')}</SelectItem>
                <SelectItem value="pending">{t('admin.pendingOnly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('admin.usersCount')} ({filteredUsers.length})
            </CardTitle>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">{currentPage} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {paginatedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                paginatedUsers.map((user) => {
                  const statusInfo = getStatusInfo(user);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={user.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
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
                          />
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{user.profiles?.company_name || 'Unknown Company'}</h3>
                              <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.user_email || 'No email'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.profiles?.contact_person || 'No contact'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLimit(user)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit Limit
                          </Button>
                          {user.is_active ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeAccess(user.user_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserMinus className="w-4 h-4 mr-1" />
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGrantAccess(user.user_id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Grant Access
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <EditLimitModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        users={editingUser ? [{
          user_id: editingUser.user_id,
          user_email: editingUser.user_email,
          company_name: editingUser.profiles?.company_name || undefined,
          current_month_usage: editingUser.current_month_usage,
          monthly_limit: editingUser.monthly_limit
        }] : []}
        onConfirm={async (newLimit: number | null) => {
          if (editingUser) {
            await handleUpdateUserLimits([editingUser.user_id], newLimit);
            setEditModalOpen(false);
            setEditingUser(null);
          }
        }}
        isBulk={false}
      />

      <EditLimitModal
        isOpen={bulkEditModalOpen}
        onClose={() => setBulkEditModalOpen(false)}
        users={selectedUsers.map(userId => {
          const user = allUsers.find(u => u.user_id === userId);
          return user ? {
            user_id: user.user_id,
            user_email: user.user_email,
            company_name: user.profiles?.company_name || undefined,
            current_month_usage: user.current_month_usage,
            monthly_limit: user.monthly_limit
          } : {
            user_id: userId,
            current_month_usage: 0,
            monthly_limit: null
          };
        })}
        onConfirm={async (newLimit: number | null) => {
          await handleUpdateUserLimits(selectedUsers, newLimit);
          setBulkEditModalOpen(false);
          setSelectedUsers([]);
        }}
        isBulk={true}
      />
    </div>
  );
};