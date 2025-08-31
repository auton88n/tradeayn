import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, CheckCircle, XCircle, Clock, Building, Mail, Phone, Shield, Eye, Edit,
  Search, Filter, Download, UserPlus, UserMinus, MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

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
}

export const UserManagement = ({ allUsers, onRefresh }: UserManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const getStatusInfo = (grant: AccessGrantWithProfile) => {
    if (!grant.is_active && !grant.granted_at) {
      return {
        icon: Clock,
        label: t('admin.pending'),
        variant: 'secondary' as const,
        color: 'text-yellow-600'
      };
    }

    if (!grant.is_active) {
      return {
        icon: XCircle,
        label: t('admin.deniedRevoked'),
        variant: 'destructive' as const,
        color: 'text-red-600'
      };
    }

    if (grant.expires_at && new Date(grant.expires_at) < new Date()) {
      return {
        icon: XCircle,
        label: t('admin.expired'),
        variant: 'destructive' as const,
        color: 'text-red-600'
      };
    }

    return {
      icon: CheckCircle,
      label: t('admin.active'),
      variant: 'default' as const,
      color: 'text-green-600'
    };
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
        .update({
          is_active: false,
          notes: 'Access revoked by administrator'
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: t('admin.accessRevoked'),
        description: t('admin.accessRevokedDesc')
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: "Error",
        description: "Failed to revoke user access.",
        variant: "destructive"
      });
    }
  };

  const handleGrantAccess = async (userId: string) => {
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

      toast({
        title: t('admin.accessGranted'),
        description: t('admin.accessGrantedDesc')
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error granting access:', error);
      toast({
        title: "Error",
        description: "Failed to grant user access.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUserLimits = async (userId: string, newLimit: number | null) => {
    try {
      const { error } = await supabase
        .from('access_grants')
        .update({ monthly_limit: newLimit })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: t('admin.limitsUpdated'),
        description: t('admin.limitsUpdatedDesc')
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error updating limits:', error);
      toast({
        title: "Error",
        description: "Failed to update user limits.",
        variant: "destructive"
      });
    }
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

    toast({
      title: t('admin.exportComplete'),
      description: t('admin.exportCompleteDesc')
    });
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header and Controls */}
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : ''}>
          <h2 className="text-2xl font-bold">{t('admin.userManagement')}</h2>
          <p className="text-muted-foreground">{t('admin.userManagementDesc')}</p>
        </div>
        <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Button onClick={exportUserData} variant="outline" size="sm">
            <Download className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t('admin.export')}
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Filter className="w-5 h-5" />
            {t('admin.filtersSearch')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex flex-col sm:flex-row gap-4 ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                <Input
                  placeholder={t('admin.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={language === 'ar' ? 'pr-10 text-right' : 'pl-10'}
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

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Users className="w-5 h-5" />
            {t('admin.usersCount')} ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            {t('admin.managePermissions')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const statusInfo = getStatusInfo(user);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={user.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
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
                        
                        <div className={`space-y-1 ${language === 'ar' ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <h3 className="font-semibold">{user.profiles?.company_name || t('admin.unknownCompany')}</h3>
                            <Badge variant={statusInfo.variant} className={`flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className={`flex items-center gap-4 text-sm text-muted-foreground ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <span className={`flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                              <Mail className="w-3 h-3" />
                              {user.user_email || t('admin.noEmail')}
                            </span>
                            <span className={`flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                              <Phone className="w-3 h-3" />
                              {user.profiles?.contact_person || t('admin.noContact')}
                            </span>
                          </div>
                          <div className={`flex items-center gap-4 text-xs text-muted-foreground ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <span>
                              {t('admin.usage')}: {user.current_month_usage || 0}
                              {user.monthly_limit ? ` / ${user.monthly_limit}` : ` / ${t('admin.unlimited')}`}
                            </span>
                            <span>
                              {t('admin.created')}: {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        {!user.is_active && !user.granted_at && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGrantAccess(user.user_id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <UserPlus className={`w-4 h-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                            {t('admin.approve')}
                          </Button>
                        )}
                        {user.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeAccess(user.user_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserMinus className={`w-4 h-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                            {t('admin.revoke')}
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className={`w-4 h-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                          {t('admin.view')}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredUsers.length === 0 && (
                <div className={`text-center py-8 ${language === 'ar' ? 'text-right' : ''}`}>
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">{t('admin.noUsersFound')}</h3>
                  <p className="text-muted-foreground">{t('admin.adjustCriteria')}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};