import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Search, 
  Download, 
  MoreVertical,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Filter,
  CheckSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { EditLimitModal } from './EditLimitModal';

interface Profile {
  company_name: string | null;
  contact_person: string | null;
  avatar_url: string | null;
}

interface AccessGrantWithProfile {
  id: string;
  user_id: string;
  is_active: boolean;
  granted_at: string | null;
  expires_at: string | null;
  current_month_usage: number | null;
  monthly_limit: number | null;
  created_at: string;
  profiles: Profile | null;
  user_email?: string;
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
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2 }
  }
};

export const UserManagement = ({ allUsers, onRefresh }: UserManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'revoked'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<AccessGrantWithProfile | null>(null);
  const [bulkEditUsers, setBulkEditUsers] = useState<AccessGrantWithProfile[]>([]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const matchesSearch = 
        (user.profiles?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.profiles?.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.user_email?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'pending' && !user.is_active && !user.granted_at) ||
        (statusFilter === 'revoked' && !user.is_active && user.granted_at);
      
      return (matchesSearch || !searchQuery) && matchesStatus;
    });
  }, [allUsers, searchQuery, statusFilter]);

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleActivate = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('access_grants')
        .update({ is_active: true, granted_at: new Date().toISOString() })
        .eq('user_id', userId);
      
      if (error) throw error;
      toast.success('User activated');
      onRefresh();
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('access_grants')
        .update({ is_active: false })
        .eq('user_id', userId);
      
      if (error) throw error;
      toast.success('User deactivated');
      onRefresh();
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const handleUpdateLimit = async (newLimit: number | null) => {
    if (!editingUser) return;
    
    try {
      const { error } = await supabase
        .from('access_grants')
        .update({ monthly_limit: newLimit })
        .eq('user_id', editingUser.user_id);
      
      if (error) throw error;
      toast.success('Limit updated');
      setEditingUser(null);
      onRefresh();
    } catch (error) {
      toast.error('Failed to update limit');
    }
  };

  const handleBulkUpdateLimit = async (newLimit: number | null) => {
    if (bulkEditUsers.length === 0) return;
    
    try {
      const userIds = bulkEditUsers.map(u => u.user_id);
      const { error } = await supabase
        .from('access_grants')
        .update({ monthly_limit: newLimit })
        .in('user_id', userIds);
      
      if (error) throw error;
      toast.success(`Updated ${bulkEditUsers.length} users`);
      setBulkEditUsers([]);
      setSelectedUsers(new Set());
      onRefresh();
    } catch (error) {
      toast.error('Failed to update limits');
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.size === 0) return;
    
    try {
      const userIds = Array.from(selectedUsers);
      
      if (action === 'activate') {
        await supabase
          .from('access_grants')
          .update({ is_active: true, granted_at: new Date().toISOString() })
          .in('user_id', userIds);
      } else if (action === 'deactivate') {
        await supabase
          .from('access_grants')
          .update({ is_active: false })
          .in('user_id', userIds);
      } else if (action === 'delete') {
        await supabase
          .from('access_grants')
          .delete()
          .in('user_id', userIds);
      }
      
      toast.success(`${action === 'delete' ? 'Deleted' : action === 'activate' ? 'Activated' : 'Deactivated'} ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      onRefresh();
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };

  const exportUsers = () => {
    const csv = [
      ['Company', 'Contact', 'Status', 'Usage', 'Limit', 'Created'],
      ...filteredUsers.map(u => [
        u.profiles?.company_name || '',
        u.profiles?.contact_person || '',
        u.is_active ? 'Active' : 'Pending',
        u.current_month_usage || 0,
        u.monthly_limit || 'Unlimited',
        format(new Date(u.created_at), 'yyyy-MM-dd'),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getUsagePercent = (usage: number | null, limit: number | null) => {
    if (!limit || !usage) return 0;
    return Math.min((usage / limit) * 100, 100);
  };

  return (
    <>
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>{filteredUsers.length} users</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedUsers.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      {selectedUsers.size} selected
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Activate All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                      <UserX className="w-4 h-4 mr-2" />
                      Deactivate All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const users = allUsers.filter(u => selectedUsers.has(u.user_id));
                      setBulkEditUsers(users);
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Limits
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="outline" size="sm" onClick={exportUsers}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('revoked')}>Revoked</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User List */}
          <ScrollArea className="h-[400px]">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No users found
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    variants={itemVariants}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      selectedUsers.has(user.user_id) 
                        ? 'bg-primary/5 border-primary/20' 
                        : 'bg-card hover:bg-muted/50 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.user_id)}
                        onChange={() => toggleUserSelection(user.user_id)}
                        className="w-4 h-4 rounded border-muted-foreground/30"
                      />
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(user.profiles?.company_name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.profiles?.company_name || user.profiles?.contact_person || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Usage */}
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{user.current_month_usage ?? 0}</span>
                          <span className="text-muted-foreground">
                            {user.monthly_limit || '∞'}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercent(user.current_month_usage, user.monthly_limit)} 
                          className="h-1.5"
                        />
                      </div>

                      {/* Status */}
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Pending'}
                      </Badge>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Limit
                          </DropdownMenuItem>
                          {user.is_active ? (
                            <DropdownMenuItem onClick={() => handleDeactivate(user.user_id)}>
                              <UserX className="w-4 h-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleActivate(user.user_id)}>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Limit Modal - Single User */}
      {editingUser && (
        <EditLimitModal
          isOpen={true}
          onClose={() => setEditingUser(null)}
          onConfirm={handleUpdateLimit}
          users={[{
            user_id: editingUser.user_id,
            company_name: editingUser.profiles?.company_name ?? undefined,
            current_month_usage: editingUser.current_month_usage ?? 0,
            monthly_limit: editingUser.monthly_limit,
          }]}
        />
      )}

      {/* Edit Limit Modal - Bulk */}
      {bulkEditUsers.length > 0 && (
        <EditLimitModal
          isOpen={true}
          onClose={() => setBulkEditUsers([])}
          onConfirm={handleBulkUpdateLimit}
          users={bulkEditUsers.map(u => ({
            user_id: u.user_id,
            company_name: u.profiles?.company_name ?? undefined,
            current_month_usage: u.current_month_usage ?? 0,
            monthly_limit: u.monthly_limit,
          }))}
          isBulk
        />
      )}
    </>
  );
};
