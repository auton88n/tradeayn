import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, X, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { AI_WORKFORCE } from './types';
import { toast } from 'sonner';

interface ApprovalItem {
  id: string;
  message: string;
  context: Record<string, unknown> | null;
  created_at: string;
  admin_id: string;
}

const getEmployee = (ctx: Record<string, unknown> | null) => {
  const empId = (ctx?.employee_id as string) || (ctx?.triggered_by as string) || '';
  return AI_WORKFORCE.find(e => e.triggeredBy === empId || e.id === empId);
};

export const ApprovalQueue = ({ selectedEmployee }: { selectedEmployee: string }) => {
  const [items, setItems] = useState<ApprovalItem[]>([]);

  const fetchApprovals = async () => {
    let query = supabase
      .from('admin_ai_conversations')
      .select('id, message, context, created_at, admin_id')
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(20);

    const { data } = await query;
    if (data) {
      const approvals = (data as ApprovalItem[]).filter(item => {
        const ctx = item.context as Record<string, unknown> | null;
        if (!ctx || ctx.needs_approval !== true) return false;
        if (ctx.approval_status) return false; // already handled
        if (selectedEmployee && selectedEmployee !== 'all') {
          const empId = (ctx.employee_id as string) || (ctx.triggered_by as string) || '';
          return empId === selectedEmployee;
        }
        return true;
      });
      setItems(approvals);
    }
  };

  useEffect(() => {
    fetchApprovals();

    const channel = supabase
      .channel('approval-queue')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_ai_conversations' }, () => {
        fetchApprovals();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedEmployee]);

  const handleAction = async (item: ApprovalItem, action: 'approved' | 'dismissed') => {
    const ctx = item.context as Record<string, unknown> || {};
    await supabase
      .from('admin_ai_conversations')
      .update({ context: { ...ctx, approval_status: action } as unknown as import('@/integrations/supabase/types').Json })
      .eq('id', item.id);

    setItems(prev => prev.filter(i => i.id !== item.id));
    toast.success(action === 'approved' ? 'Approved ✓' : 'Dismissed');
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">Needs Your Attention</h3>
        <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-medium">
          {items.length}
        </span>
      </div>
      {items.map(item => {
        const ctx = item.context as Record<string, unknown> | null;
        const emp = getEmployee(ctx);
        return (
          <Card key={item.id} className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{emp?.emoji || '🤖'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{emp?.name || 'Agent'}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(item.created_at), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">"{item.message}"</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleAction(item, 'approved')}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleAction(item, 'dismissed')}
                    >
                      <X className="w-3 h-3 mr-1" /> Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
