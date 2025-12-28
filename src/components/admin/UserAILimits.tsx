import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  RefreshCw, 
  Search,
  Shield,
  Infinity,
  Edit2,
  Save,
  X
} from 'lucide-react';

interface UserLimit {
  id: string;
  user_id: string;
  daily_messages: number | null;
  daily_engineering: number | null;
  daily_search: number | null;
  daily_files: number | null;
  current_daily_messages: number | null;
  current_daily_engineering: number | null;
  current_daily_search: number | null;
  current_daily_files: number | null;
  is_unlimited: boolean | null;
  monthly_cost_limit_sar: number | null;
  current_month_cost_sar: number | null;
  email?: string;
}

export function UserAILimits() {
  const [limits, setLimits] = useState<UserLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<UserLimit>>({});

  const fetchLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('user_ai_limits')
        .select('*')
        .order('current_daily_messages', { ascending: false });

      if (error) throw error;

      // Get user emails
      const userIds = (data || []).map((l: UserLimit) => l.user_id);
      
      setLimits(data || []);
    } catch (error) {
      console.error('Error fetching limits:', error);
      toast.error('Failed to load user limits');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const startEditing = (user: UserLimit) => {
    setEditingUser(user.user_id);
    setEditValues({
      daily_messages: user.daily_messages,
      daily_engineering: user.daily_engineering,
      daily_search: user.daily_search,
      daily_files: user.daily_files,
      is_unlimited: user.is_unlimited,
      monthly_cost_limit_sar: user.monthly_cost_limit_sar
    });
  };

  const saveEditing = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('user_ai_limits')
        .update({
          ...editValues,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', editingUser);

      if (error) throw error;

      setLimits(prev => prev.map(l => 
        l.user_id === editingUser ? { ...l, ...editValues } : l
      ));
      setEditingUser(null);
      toast.success('Limits updated');
    } catch (error) {
      console.error('Error updating limits:', error);
      toast.error('Failed to update limits');
    }
  };

  const toggleUnlimited = async (userId: string, unlimited: boolean) => {
    try {
      const { error } = await supabase
        .from('user_ai_limits')
        .update({ is_unlimited: unlimited, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      setLimits(prev => prev.map(l => 
        l.user_id === userId ? { ...l, is_unlimited: unlimited } : l
      ));
      toast.success(`User ${unlimited ? 'set to unlimited' : 'limits restored'}`);
    } catch (error) {
      console.error('Error toggling unlimited:', error);
      toast.error('Failed to update');
    }
  };

  const getUsagePercentage = (current: number | null, limit: number | null) => {
    if (!limit || limit === 0) return 0;
    return Math.min(((current || 0) / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const filteredLimits = limits.filter((l: UserLimit) => 
    l.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            User AI Limits
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage per-user daily and monthly AI usage limits
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => { setIsLoading(true); fetchLimits(); }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by user ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{limits.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unlimited Users</p>
                <p className="text-2xl font-bold">{limits.filter(l => l.is_unlimited).length}</p>
              </div>
              <Infinity className="w-8 h-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At Limit Today</p>
                <p className="text-2xl font-bold text-red-500">
                  {limits.filter(l => 
                    !l.is_unlimited && (l.current_daily_messages ?? 0) >= (l.daily_messages ?? 10)
                  ).length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-red-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Limits ({filteredLimits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredLimits.map(user => {
                const isEditing = editingUser === user.user_id;
                const msgPercentage = getUsagePercentage(user.current_daily_messages, user.daily_messages);
                
                return (
                  <div 
                    key={user.user_id}
                    className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-mono text-sm truncate">{user.user_id}</p>
                          {user.is_unlimited && (
                            <Badge variant="default" className="bg-green-500">
                              <Infinity className="w-3 h-3 mr-1" />
                              Unlimited
                            </Badge>
                          )}
                        </div>
                        
                        {isEditing ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                            <div>
                              <label className="text-xs text-muted-foreground">Messages</label>
                              <Input
                                type="number"
                                value={editValues.daily_messages ?? 0}
                                onChange={(e) => setEditValues(prev => ({ ...prev, daily_messages: parseInt(e.target.value) }))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Engineering</label>
                              <Input
                                type="number"
                                value={editValues.daily_engineering ?? 0}
                                onChange={(e) => setEditValues(prev => ({ ...prev, daily_engineering: parseInt(e.target.value) }))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Search</label>
                              <Input
                                type="number"
                                value={editValues.daily_search ?? 0}
                                onChange={(e) => setEditValues(prev => ({ ...prev, daily_search: parseInt(e.target.value) }))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Files</label>
                              <Input
                                type="number"
                                value={editValues.daily_files ?? 0}
                                onChange={(e) => setEditValues(prev => ({ ...prev, daily_files: parseInt(e.target.value) }))}
                                className="h-8"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Messages: </span>
                              <span className={getUsageColor(msgPercentage)}>
                                {user.current_daily_messages}/{user.daily_messages}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Eng: </span>
                              <span>{user.current_daily_engineering}/{user.daily_engineering}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Search: </span>
                              <span>{user.current_daily_search}/{user.daily_search}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Files: </span>
                              <span>{user.current_daily_files}/{user.daily_files}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={saveEditing}>
                              <Save className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                        <>
                            <Switch
                              checked={user.is_unlimited ?? false}
                              onCheckedChange={(checked) => toggleUnlimited(user.user_id, checked)}
                            />
                            <Button size="sm" variant="ghost" onClick={() => startEditing(user)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredLimits.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No users found
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
