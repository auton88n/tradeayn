import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, ShieldOff, Loader2, Smartphone, Trash2 } from 'lucide-react';
import { EnrollMFA } from '@/components/auth/EnrollMFA';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface MFAFactor {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: string;
  created_at: string;
}

export const MFASettings = () => {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(false);
  const [factorToRemove, setFactorToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const allFactors = [...data.totp].filter(f => f.status === 'verified');
      setFactors(allFactors as MFAFactor[]);
    } catch (error) {
      console.error('Error loading MFA factors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!factorToRemove) return;

    setIsRemoving(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorToRemove
      });

      if (error) throw error;

      toast({
        title: 'MFA Removed',
        description: 'Two-factor authentication has been disabled.'
      });

      setFactors(factors.filter(f => f.id !== factorToRemove));
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove MFA',
        variant: 'destructive'
      });
    } finally {
      setIsRemoving(false);
      setShowUnenrollConfirm(false);
      setFactorToRemove(null);
    }
  };

  const confirmRemove = (factorId: string) => {
    setFactorToRemove(factorId);
    setShowUnenrollConfirm(true);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account by requiring a verification code in addition to your password.
            </p>
          </div>
        </div>

        {factors.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Two-factor authentication is enabled</span>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Enrolled Devices</h4>
              {factors.map((factor) => (
                <div 
                  key={factor.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {factor.friendly_name || 'Authenticator App'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(factor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => confirmRemove(factor.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <ShieldOff className="h-4 w-4" />
              <span>Two-factor authentication is not enabled</span>
            </div>

            <Button onClick={() => setShowEnroll(true)}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Enable Two-Factor Authentication
            </Button>
          </div>
        )}
      </Card>

      {/* Enroll MFA Dialog */}
      <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
        <DialogContent className="sm:max-w-md p-0">
          <EnrollMFA
            onEnrolled={() => {
              setShowEnroll(false);
              loadFactors();
            }}
            onCancel={() => setShowEnroll(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Unenroll Confirmation Dialog */}
      <AlertDialog open={showUnenrollConfirm} onOpenChange={setShowUnenrollConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable two-factor authentication for your account. Your account will be less secure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnenroll}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove MFA'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
