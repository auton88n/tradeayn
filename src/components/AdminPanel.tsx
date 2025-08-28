import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building, 
  Mail, 
  Phone,
  Shield,
  Calendar
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_person: string | null;
  phone: string | null;
  created_at: string;
}

interface AccessGrantWithProfile {
  id: string;
  user_id: string;
  is_active: boolean;
  granted_at: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  profiles: {
    id: string;
    user_id: string;
    company_name: string | null;
    contact_person: string | null;
    phone: string | null;
    created_at: string;
  } | null;
}

interface User {
  id: string;
  email: string;
  created_at: string;
}

export const AdminPanel = () => {
  const [accessRequests, setAccessRequests] = useState<AccessGrantWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccessGrantWithProfile | null>(null);
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const { toast } = useToast();

  const fetchAccessRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select(`
          *,
          profiles (
            id,
            user_id,
            company_name,
            contact_person,
            phone,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching access requests:', error);
        toast({
          title: "Error",
          description: "Unable to fetch access requests.",
          variant: "destructive"
        });
      } else {
        setAccessRequests((data as any) || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessRequests();
  }, []);

  const handleGrantAccess = async (requestId: string, userId: string) => {
    try {
      const updateData: any = {
        is_active: true,
        granted_at: new Date().toISOString(),
        notes: notes.trim() || null
      };

      if (expiresAt) {
        updateData.expires_at = new Date(expiresAt).toISOString();
      }

      if (monthlyLimit && parseInt(monthlyLimit) > 0) {
        updateData.monthly_limit = parseInt(monthlyLimit);
      }

      const { error } = await supabase
        .from('access_grants')
        .update(updateData)
        .eq('id', requestId);

      if (error) {
        toast({
          title: "Error",
          description: "Unable to grant access.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Access Granted",
          description: "User access has been successfully granted."
        });
        setSelectedRequest(null);
        setNotes('');
        setExpiresAt('');
        setMonthlyLimit('');
        fetchAccessRequests();
      }
    } catch (error) {
      console.error('Error granting access:', error);
    }
  };

  const handleDenyAccess = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('access_grants')
        .update({
          is_active: false,
          notes: notes.trim() || 'Access denied by administrator'
        })
        .eq('id', requestId);

      if (error) {
        toast({
          title: "Error",  
          description: "Unable to deny access.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Access Denied",
          description: "User access has been denied."
        });
        setSelectedRequest(null);
        setNotes('');
        setMonthlyLimit('');
        fetchAccessRequests();
      }
    } catch (error) {
      console.error('Error denying access:', error);
    }
  };

  const getStatusInfo = (grant: AccessGrantWithProfile) => {
    if (!grant.is_active && !grant.granted_at) {
      return {
        icon: Clock,
        label: 'Pending',
        variant: 'secondary' as const,
        color: 'text-muted-foreground'
      };
    }

    if (!grant.is_active) {
      return {
        icon: XCircle,
        label: 'Denied',
        variant: 'destructive' as const,
        color: 'text-destructive'
      };
    }

    if (grant.expires_at && new Date(grant.expires_at) < new Date()) {
      return {
        icon: XCircle,
        label: 'Expired',
        variant: 'destructive' as const,
        color: 'text-destructive'
      };
    }

    return {
      icon: CheckCircle,
      label: 'Active',
      variant: 'default' as const,
      color: 'text-green-600'
    };
  };

  if (isLoading) {
    return (
      <Card className="glass p-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5" />
          <span>Loading access requests...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Access Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage user access to the AYN platform
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {accessRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No access requests found</p>
            </div>
          ) : (
            accessRequests.map((request) => {
              const status = getStatusInfo(request);
              const StatusIcon = status.icon;
              
              return (
                <Card key={request.id} className="p-4 border border-border/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {request.profiles?.company_name || 'No company specified'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{request.profiles?.contact_person || 'No contact specified'}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {request.profiles?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{request.profiles.phone}</span>
                            </div>
                          )}
                          
                          {request.expires_at && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>Expires: {new Date(request.expires_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {request.notes && (
                        <div className="p-3 bg-muted/50 rounded-md mb-3">
                          <p className="text-sm">{request.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {!request.is_active && !request.granted_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </Card>

      {/* Review Modal */}
      {selectedRequest && (
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-4">
            Review Access Request - {selectedRequest.profiles?.company_name || 'Unknown Company'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Notes (optional)
              </label>
              <Textarea
                placeholder="Add any notes for the user..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Expiration Date (optional)
              </label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="glass"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Monthly Message Limit
              </label>
              <Input
                type="number"
                placeholder="Enter number of messages (e.g., 50, 100, 500)"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="glass"
                min="1"
              />
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <p><strong>Examples:</strong></p>
                <p>• Trial: 10-20 messages/month</p>
                <p>• Starter: 50-100 messages/month</p>
                <p>• Business: 200-500 messages/month</p>
                <p>• Leave empty for unlimited usage</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="default"
                onClick={() => handleGrantAccess(selectedRequest.id, selectedRequest.user_id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Grant Access
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => handleDenyAccess(selectedRequest.id)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Deny Access
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRequest(null);
                  setNotes('');
                  setExpiresAt('');
                  setMonthlyLimit('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};