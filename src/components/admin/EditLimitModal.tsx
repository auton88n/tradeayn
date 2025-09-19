import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Users, Infinity } from 'lucide-react';

interface EditLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newLimit: number | null) => Promise<void>;
  users: Array<{
    user_id: string;
    user_email?: string;
    company_name?: string;
    current_month_usage: number;
    monthly_limit: number | null;
  }>;
  isBulk?: boolean;
}

export const EditLimitModal = ({ isOpen, onClose, onConfirm, users, isBulk = false }: EditLimitModalProps) => {
  const [newLimit, setNewLimit] = useState<string>('');
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t, language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isUnlimited && (!newLimit || isNaN(Number(newLimit)) || Number(newLimit) < 0)) {
      return;
    }

    setIsLoading(true);
    try {
      const limitValue = isUnlimited ? null : Number(newLimit);
      await onConfirm(limitValue);
      onClose();
      setNewLimit('');
      setIsUnlimited(false);
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

  const user = users[0]; // For single user editing
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Users className="w-5 h-5" />
            {isBulk ? t('admin.editBulkLimits') : t('admin.editUserLimit')}
          </DialogTitle>
          <DialogDescription className={language === 'ar' ? 'text-right' : ''}>
            {isBulk 
              ? `${t('admin.editingLimitsFor')} ${users.length} ${t('admin.users')}`
              : `${t('admin.editingLimitFor')} ${user?.company_name || user?.user_email}`
            }
          </DialogDescription>
        </DialogHeader>

        {!isBulk && user && (
          <div className="space-y-4 py-4">
            <div className={`p-3 bg-muted/50 rounded-lg ${language === 'ar' ? 'text-right' : ''}`}>
              <div className={`flex items-center justify-between mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm font-medium">{t('admin.currentUsage')}</span>
                <Badge variant="outline">
                  {user.current_month_usage} / {user.monthly_limit || t('admin.unlimited')}
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
            <Label htmlFor="limit" className={language === 'ar' ? 'text-right block' : ''}>
              {t('admin.monthlyLimit')}
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  id="limit"
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  disabled={isUnlimited || isLoading}
                  placeholder={t('admin.enterLimit')}
                  min="0"
                  className={language === 'ar' ? 'text-right' : ''}
                />
              </div>
              <Button
                type="button"
                variant={isUnlimited ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsUnlimited(!isUnlimited);
                  if (!isUnlimited) setNewLimit('');
                }}
                disabled={isLoading}
                className={`flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
              >
                <Infinity className="w-4 h-4" />
                {t('admin.unlimited')}
              </Button>
            </div>
          </div>

          <DialogFooter className={language === 'ar' ? 'flex-row-reverse' : ''}>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={(!isUnlimited && (!newLimit || isNaN(Number(newLimit)) || Number(newLimit) < 0)) || isLoading}
            >
              {isLoading && <Loader2 className={`w-4 h-4 animate-spin ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />}
              {t('admin.updateLimit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};