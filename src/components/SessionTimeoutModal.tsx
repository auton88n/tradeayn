import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';

interface SessionTimeoutModalProps {
  open: boolean;
  remainingSeconds: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export const SessionTimeoutModal = ({
  open,
  remainingSeconds,
  onStayLoggedIn,
  onLogoutNow,
}: SessionTimeoutModalProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="backdrop-blur-xl bg-background/95 border-border/50">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <AlertDialogTitle className="text-xl">
              Session Expiring
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-2">
            Your session will expire soon due to inactivity. Would you like to stay logged in?
          </AlertDialogDescription>
          
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">
                {remainingSeconds}
              </div>
              <div className="text-sm text-muted-foreground">
                seconds remaining
              </div>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={onLogoutNow}
            className="w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out Now
          </Button>
          <Button
            onClick={onStayLoggedIn}
            className="w-full sm:w-auto"
          >
            Stay Logged In
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
