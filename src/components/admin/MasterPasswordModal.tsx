import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/hooks/useAdminSession";

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  title: string;
  description: string;
  actionType?: 'general' | 'emergency';
}

export function MasterPasswordModal({ 
  isOpen, 
  onClose, 
  onAuthenticated, 
  title, 
  description,
  actionType = 'general'
}: MasterPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { authenticate, getRemainingTime, sessionTimeout } = useAdminSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use secure server-side authentication
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: {
          password: password.trim(),
          actionType
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        // Store secure session token
        authenticate(data.sessionToken, data.expiresAt);
        
        toast({
          title: "Authentication successful",
          description: "You are now authenticated for admin actions.",
        });
        onAuthenticated();
        onClose();
        setPassword('');
      } else {
        setError(data?.message || 'Invalid password');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const remainingTime = getRemainingTime();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">
              {actionType === 'emergency' ? 'Emergency Password' : 'Master Password'}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter admin password"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {remainingTime > 0 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Session expires in {formatTime(remainingTime)}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !password.trim()}>
              {isLoading ? 'Authenticating...' : 'Authenticate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}