import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ClipboardList, 
  Shield, 
  Gift, 
  UserCog, 
  RefreshCw, 
  Search,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLogEntry {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  target_email: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { icon: typeof Shield; label: string; color: string }> = {
  role_change: { icon: UserCog, label: 'Role Change', color: 'bg-purple-500' },
  credit_gift: { icon: Gift, label: 'Credit Gift', color: 'bg-green-500' },
  user_activation: { icon: Shield, label: 'User Activation', color: 'bg-blue-500' },
  user_deactivation: { icon: Shield, label: 'User Deactivation', color: 'bg-red-500' },
  limit_change: { icon: UserCog, label: 'Limit Change', color: 'bg-orange-500' },
  default: { icon: ClipboardList, label: 'Action', color: 'bg-muted' }
};

export const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [admins, setAdmins] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(50);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Use type assertion since table is newly created
      const client = supabase as any;
      let query = client
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as AuditLogEntry[]) || []);

      // Fetch admin emails
      const adminIds = [...new Set((data || []).map((log: AuditLogEntry) => log.admin_id))] as string[];
      if (adminIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, company_name')
          .in('user_id', adminIds);
        
        const adminMap = new Map<string, string>();
        profiles?.forEach(p => {
          adminMap.set(p.user_id, p.company_name || 'Admin');
        });
        setAdmins(adminMap);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, limit]);

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.target_email?.toLowerCase().includes(search) ||
      log.action_type.toLowerCase().includes(search) ||
      JSON.stringify(log.details).toLowerCase().includes(search) ||
      admins.get(log.admin_id)?.toLowerCase().includes(search)
    );
  });

  const renderDetails = (log: AuditLogEntry) => {
    const details = log.details;
    if (!details || Object.keys(details).length === 0) return null;

    return (
      <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
            <span className="font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const getActionConfig = (actionType: string) => {
    return ACTION_CONFIG[actionType] || ACTION_CONFIG.default;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="w-5 h-5 text-primary" />
            Admin Audit Log
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, action, or admin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="role_change">Role Changes</SelectItem>
              <SelectItem value="credit_gift">Credit Gifts</SelectItem>
              <SelectItem value="user_activation">Activations</SelectItem>
              <SelectItem value="limit_change">Limit Changes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex gap-2 flex-wrap">
          {['role_change', 'credit_gift', 'user_activation'].map(type => {
            const count = logs.filter(l => l.action_type === type).length;
            const config = getActionConfig(type);
            return (
              <Badge 
                key={type} 
                variant="secondary" 
                className="gap-1 cursor-pointer"
                onClick={() => setActionFilter(actionFilter === type ? 'all' : type)}
              >
                <config.icon className="w-3 h-3" />
                {config.label}: {count}
              </Badge>
            );
          })}
        </div>

        {/* Log List */}
        <ScrollArea className="h-[400px] pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <ClipboardList className="w-8 h-8 mb-2 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map(log => {
                const config = getActionConfig(log.action_type);
                const Icon = config.icon;
                const isExpanded = expandedLogs.has(log.id);

                return (
                  <div
                    key={log.id}
                    className="p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className={`p-1.5 rounded ${config.color} text-white shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{config.label}</span>
                            {log.target_email && (
                              <Badge variant="outline" className="text-xs font-normal">
                                <User className="w-3 h-3 mr-1" />
                                {log.target_email}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>by {admins.get(log.admin_id) || 'Admin'}</span>
                            <span>•</span>
                            <Calendar className="w-3 h-3" />
                            <span title={format(new Date(log.created_at), 'PPpp')}>
                              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-6 w-6">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                    {isExpanded && renderDetails(log)}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Helper function to log admin actions manually (for actions not auto-logged by RPC)
export const logAdminAction = async (
  actionType: string,
  targetUserId?: string,
  targetEmail?: string,
  details?: Record<string, unknown>
) => {
  try {
    const client = supabase as any;
    await client.rpc('log_admin_action', {
      p_action_type: actionType,
      p_target_user_id: targetUserId || null,
      p_target_email: targetEmail || null,
      p_details: details || {}
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
};
