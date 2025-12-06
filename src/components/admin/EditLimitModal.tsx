import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, Infinity } from 'lucide-react';

interface UserData {
  user_id: string;
  user_email?: string;
  company_name?: string;
  current_month_usage: number;
  monthly_limit: number | null;
}

interface EditLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newLimit: number | null) => Promise<void>;
  users: UserData[];
  isBulk?: boolean;
}

export const EditLimitModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  users, 
  isBulk = false 
}: EditLimitModalProps) => {
  const [newLimit, setNewLimit] = useState<string>('');
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Safety guard
  if (!users || users.length === 0) {
    return null;
  }

  const user = users[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isUnlimited && (!newLimit || isNaN(Number(newLimit)) || Number(newLimit) < 0)) {
      return;
    }

    setIsLoading(true);
    try {
      const limitValue = isUnlimited ? null : Number(newLimit);
      await onConfirm(limitValue);
      handleClose();
    } catch (error) {
      console.error('Error updating limit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setNewLimit('');
      setIsUnlimited(false);
    }
  };

  const getUsagePercentage = (usage: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((usage / limit) * 100, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {isBulk ? 'Edit Bulk Limits' : 'Edit User Limit'}
          </DialogTitle>
          <DialogDescription>
            {isBulk 
              ? `Editing limits for ${users.length} users`
              : `Editing limit for ${user.company_name || user.user_email || 'User'}`
            }
          </DialogDescription>
        </DialogHeader>

        {!isBulk && (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Usage</span>
                <Badge variant="outline">
                  {user.current_month_usage} / {user.monthly_limit ?? '∞'}
                </Badge>
              </div>
              {user.monthly_limit && (
                <Progress 
                  value={getUsagePercentage(user.current_month_usage, user.monthly_limit)} 
                  className="h-2"
                />
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="limit">Monthly Limit</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  id="limit"
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  disabled={isUnlimited || isLoading}
                  placeholder="Enter limit"
                  min="0"
                />
              </div>
              <Button
                type="button"
                variant={isUnlimited ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setIsUnlimited(!isUnlimited);
                  if (!isUnlimited) setNewLimit('');
                }}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <Infinity className="w-4 h-4" />
                Unlimited
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={(!isUnlimited && (!newLimit || isNaN(Number(newLimit)) || Number(newLimit) < 0)) || isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Update Limit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
