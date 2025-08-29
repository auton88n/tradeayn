import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, Send, Users, Download, Filter, Target, TrendingUp, CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  company_name?: string;
  contact_person?: string;
  is_active: boolean;
  created_at: string;
  current_month_usage: number;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  sent_count: number;
  created_at: string;
  status: 'draft' | 'sent' | 'scheduled';
}

export const MarketingEmails = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [userFilter, setUserFilter] = useState('all');

  // Campaign form
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    content: '',
    target_audience: 'all' // all, active, inactive, high_usage, low_usage
  });

  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      // Optimized query with limits
      const [profilesResult, grantsResult] = await Promise.all([
        supabase.from('profiles').select('*').limit(1000),
        supabase.from('access_grants').select('*').limit(1000)
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (grantsResult.error) throw grantsResult.error;

      // Get auth users (requires admin privileges) - with error handling
      let authUsers: any[] = [];
      try {
        const { data: { users: fetchedUsers }, error } = await supabase.auth.admin.listUsers();
        if (!error && fetchedUsers) {
          authUsers = fetchedUsers;
        }
      } catch (error) {
        console.error('Error fetching auth users:', error);
      }

      // Combine data efficiently
      const combinedUsers: User[] = authUsers.map(authUser => {
        const profile = profilesResult.data?.find(p => p.user_id === authUser.id);
        const grant = grantsResult.data?.find(g => g.user_id === authUser.id);
        
        return {
          id: authUser.id,
          email: authUser.email || '',
          company_name: profile?.company_name,
          contact_person: profile?.contact_person,
          is_active: grant?.is_active || false,
          created_at: authUser.created_at,
          current_month_usage: grant?.current_month_usage || 0
        };
      });

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_emails')
        .select('*')
        .eq('email_type', 'marketing')
        .order('created_at', { ascending: false })
        .limit(100); // Add limit for better performance

      if (error) throw error;

      // Group by campaign (using subject as campaign identifier for now)
      const campaignMap = new Map<string, Campaign>();
      
      data?.forEach(email => {
        const key = email.subject;
        if (campaignMap.has(key)) {
          const existing = campaignMap.get(key)!;
          existing.sent_count += 1;
        } else {
          campaignMap.set(key, {
            id: email.id,
            name: email.subject,
            subject: email.subject,
            content: email.content,
            sent_count: 1,
            created_at: email.created_at,
            status: email.status === 'sent' ? 'sent' : 'draft'
          });
        }
      });

      setCampaigns(Array.from(campaignMap.values()));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUsers(), fetchCampaigns()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const getTargetUsers = () => {
    switch (campaignForm.target_audience) {
      case 'active':
        return users.filter(u => u.is_active);
      case 'inactive':
        return users.filter(u => !u.is_active);
      case 'high_usage':
        return users.filter(u => u.current_month_usage > 50);
      case 'low_usage':
        return users.filter(u => u.current_month_usage <= 10);
      default:
        return users;
    }
  };

  const sendCampaign = async () => {
    if (!campaignForm.subject.trim() || !campaignForm.content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide both subject and content",
        variant: "destructive"
      });
      return;
    }

    const targetUsers = getTargetUsers();
    
    if (targetUsers.length === 0) {
      toast({
        title: "No Recipients",
        description: "No users match the target audience criteria",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Send emails to target users
      const emailPromises = targetUsers.map(user => 
        supabase.functions.invoke('send-admin-email', {
          body: {
            to: user.email,
            subject: campaignForm.subject,
            content: campaignForm.content,
            fromEmail: 'marketing@aynn.io',
            email_type: 'marketing'
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(result => result.status === 'fulfilled').length;

      toast({
        title: "Campaign Sent",
        description: `Successfully sent to ${successful} users`,
      });

      setShowCampaignDialog(false);
      setCampaignForm({ name: '', subject: '', content: '', target_audience: 'all' });
      await fetchCampaigns();
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast({
        title: "Error",
        description: "Failed to send marketing campaign",
        variant: "destructive"
      });
    }
  };

  const exportUserEmails = () => {
    const filteredUsers = userFilter === 'all' ? users : users.filter(u => 
      userFilter === 'active' ? u.is_active : !u.is_active
    );
    
    const csvContent = [
      ['Email', 'Company', 'Contact Person', 'Status', 'Usage', 'Created Date'].join(','),
      ...filteredUsers.map(user => [
        user.email,
        user.company_name || 'N/A',
        user.contact_person || 'N/A',
        user.is_active ? 'Active' : 'Inactive',
        user.current_month_usage,
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketing-emails-${userFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredUsers.length} user emails`
    });
  };

  const filteredUsers = userFilter === 'all' ? users : users.filter(u => 
    userFilter === 'active' ? u.is_active : !u.is_active
  );

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 animate-spin" />
          <span>Loading marketing data...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Marketing Emails
          </h2>
          <p className="text-muted-foreground">Manage marketing campaigns and user email lists</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportUserEmails} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
          <Button onClick={() => setShowCampaignDialog(true)}>
            <Send className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'sent').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.reduce((sum, c) => sum + c.sent_count, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Email List ({filteredUsers.length})
              </CardTitle>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>Email addresses for marketing campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.company_name || 'No company'} • {user.contact_person || 'No contact'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {user.current_month_usage} uses
                      </span>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Campaign History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Campaign History
            </CardTitle>
            <CardDescription>Recent marketing campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{campaign.name}</span>
                      <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Sent to {campaign.sent_count} users
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(campaign.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No campaigns sent yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* New Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Marketing Campaign</DialogTitle>
            <DialogDescription>
              Send targeted emails to your user base
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Campaign name (internal use)"
              />
            </div>

            <div>
              <Label>Target Audience</Label>
              <Select 
                value={campaignForm.target_audience} 
                onValueChange={(value) => setCampaignForm(prev => ({ ...prev, target_audience: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users ({users.length})</SelectItem>
                  <SelectItem value="active">Active Users ({users.filter(u => u.is_active).length})</SelectItem>
                  <SelectItem value="inactive">Inactive Users ({users.filter(u => !u.is_active).length})</SelectItem>
                  <SelectItem value="high_usage">High Usage ({users.filter(u => u.current_month_usage > 50).length})</SelectItem>
                  <SelectItem value="low_usage">Low Usage ({users.filter(u => u.current_month_usage <= 10).length})</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Will send to {getTargetUsers().length} users
              </p>
            </div>

            <div>
              <Label>Subject Line</Label>
              <Input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject line"
              />
            </div>

            <div>
              <Label>Email Content</Label>
              <Textarea
                value={campaignForm.content}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Email content..."
                rows={8}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={sendCampaign}>
                <Send className="w-4 h-4 mr-2" />
                Send Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};