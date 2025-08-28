import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface AccessGrant {
  id: string;
  is_active: boolean;
  granted_at: string | null;
  expires_at: string | null;
  notes: string | null;
}

interface AccessStatusCardProps {
  user: User;
}

export const AccessStatusCard = ({ user }: AccessStatusCardProps) => {
  const [accessGrant, setAccessGrant] = useState<AccessGrant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAccessStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching access status:', error);
        toast({
          title: "Error",
          description: "Unable to check access status.",
          variant: "destructive"
        });
      } else {
        setAccessGrant(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessStatus();
  }, [user.id]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchAccessStatus();
  };

  const getStatusInfo = () => {
    if (!accessGrant) {
      return {
        icon: Clock,
        label: 'Pending Review',
        description: 'Your access request is being reviewed by our team.',
        variant: 'secondary' as const,
        color: 'text-muted-foreground'
      };
    }

    if (!accessGrant.is_active) {
      return {
        icon: XCircle,
        label: 'Access Denied',
        description: 'Your access request has been reviewed. Please contact support.',
        variant: 'destructive' as const,
        color: 'text-destructive'
      };
    }

    // Check if expired
    if (accessGrant.expires_at && new Date(accessGrant.expires_at) < new Date()) {
      return {
        icon: XCircle,
        label: 'Access Expired',
        description: 'Your access has expired. Please contact support for renewal.',
        variant: 'destructive' as const,
        color: 'text-destructive'
      };
    }

    return {
      icon: CheckCircle,
      label: 'Access Granted',
      description: accessGrant.expires_at 
        ? `Access expires on ${new Date(accessGrant.expires_at).toLocaleDateString()}`
        : 'You have unlimited access to AYN AI Business Consulting.',
      variant: 'default' as const,
      color: 'text-green-600'
    };
  };

  if (isLoading) {
    return (
      <Card className="glass p-6">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Checking access status...</span>
        </div>
      </Card>
    );
  }

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <Card className="glass p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <StatusIcon className={`w-6 h-6 ${status.color} flex-shrink-0 mt-1`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">Access Status</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-muted-foreground">{status.description}</p>
            
            {accessGrant?.notes && (
              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Note from team:</strong> {accessGrant.notes}
                </p>
              </div>
            )}
            
            {accessGrant?.granted_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Access granted on {new Date(accessGrant.granted_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </Card>
  );
};