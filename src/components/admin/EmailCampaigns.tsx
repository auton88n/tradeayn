import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, Send, Calendar, Plus, Edit, Trash2, Eye, Target, 
  Clock, CheckCircle, AlertCircle, Play, Pause, Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  html_content?: string;
  campaign_type: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  scheduled_at?: string;
  recipient_count: number;
  sent_count: number;
  created_at: string;
  updated_at: string;
}

interface RecipientGroup {
  id: string;
  name: string;
  description: string;
  recipient_count: number;
  criteria: any;
}

export const EmailCampaigns = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [recipientGroups, setRecipientGroups] = useState<RecipientGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  
  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    id: '',
    name: '',
    subject: '',
    content: '',
    html_content: '',
    campaign_type: 'marketing',
    scheduled_at: '',
    recipient_group_ids: [] as string[]
  });

  // Recipient group form state
  const [groupForm, setGroupForm] = useState({
    id: '',
    name: '',
    description: '',
    criteria: {
      user_role: 'all',
      is_active: true,
      company_filter: ''
    }
  });

  const { toast } = useToast();

  const fetchCampaigns = async () => {
    try {
      // Mock data for now - in real implementation, this would come from a campaigns table
      const mockCampaigns: EmailCampaign[] = [
        {
          id: '1',
          name: 'Welcome Series - New Users',
          subject: 'Welcome to AYN Platform',
          content: 'Welcome to our platform! We\'re excited to have you on board.',
          campaign_type: 'onboarding',
          status: 'completed',
          recipient_count: 25,
          sent_count: 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Monthly Newsletter',
          subject: 'AYN Platform Updates - December',
          content: 'Check out our latest features and improvements.',
          campaign_type: 'newsletter',
          status: 'draft',
          recipient_count: 150,
          sent_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch email campaigns",
        variant: "destructive"
      });
    }
  };

  const fetchRecipientGroups = async () => {
    try {
      // Mock data for now - in real implementation, this would come from recipient_groups table
      const mockGroups: RecipientGroup[] = [
        {
          id: '1',
          name: 'All Active Users',
          description: 'Users with active access grants',
          recipient_count: 45,
          criteria: { user_role: 'all', is_active: true }
        },
        {
          id: '2',
          name: 'Admin Users',
          description: 'Users with admin privileges',
          recipient_count: 3,
          criteria: { user_role: 'admin', is_active: true }
        },
        {
          id: '3',
          name: 'Pending Users',
          description: 'Users awaiting approval',
          recipient_count: 12,
          criteria: { user_role: 'user', is_active: false }
        }
      ];
      setRecipientGroups(mockGroups);
    } catch (error) {
      console.error('Error fetching recipient groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch recipient groups",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCampaigns(), fetchRecipientGroups()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: 'secondary' as const, icon: Edit },
      scheduled: { variant: 'default' as const, icon: Clock },
      sending: { variant: 'default' as const, icon: Play, className: 'animate-pulse' },
      completed: { variant: 'default' as const, icon: CheckCircle, className: 'bg-green-600' },
      paused: { variant: 'destructive' as const, icon: Pause }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    const Icon = config.icon;
    const className = ('className' in config ? config.className : '') as string;
    
      return (
        <Badge variant={config.variant} className={className}>
          <Icon className="w-3 h-3 mr-1" />
          {status}
        </Badge>
      );
  };

  const getCampaignTypeBadge = (type: string) => {
    const colors = {
      marketing: 'bg-purple-600',
      newsletter: 'bg-blue-600',
      onboarding: 'bg-green-600',
      notification: 'bg-orange-600',
      announcement: 'bg-red-600'
    } as const;
    
    return <Badge className={colors[type as keyof typeof colors] || 'bg-gray-600'}>{type}</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 animate-spin" />
          <span>Loading email campaigns...</span>
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
            Email Campaigns
          </h2>
          <p className="text-muted-foreground">Create and manage bulk email campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowGroupDialog(true)} variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Recipient Groups
          </Button>
          <Button onClick={() => setShowCampaignDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {campaigns.reduce((sum, c) => sum + c.recipient_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {campaigns.reduce((sum, c) => sum + c.sent_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Email Campaigns</CardTitle>
          <CardDescription>Manage your email marketing and communication campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                      {getCampaignTypeBadge(campaign.campaign_type)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{campaign.subject}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Recipients: {campaign.recipient_count}</span>
                      <span>Sent: {campaign.sent_count}</span>
                      <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCampaign(campaign)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
            <DialogDescription>
              Set up a new bulk email campaign for your users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Monthly Newsletter"
                />
              </div>
              <div>
                <Label>Campaign Type</Label>
                <Select 
                  value={campaignForm.campaign_type} 
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, campaign_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Email Subject</Label>
              <Input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Your monthly update from AYN"
              />
            </div>

            <div>
              <Label>Email Content</Label>
              <Textarea
                value={campaignForm.content}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your email content here..."
                rows={8}
              />
            </div>

            <div>
              <Label>Recipient Groups</Label>
              <div className="space-y-2 mt-2">
                {recipientGroups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={group.id}
                      checked={campaignForm.recipient_group_ids.includes(group.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCampaignForm(prev => ({
                            ...prev,
                            recipient_group_ids: [...prev.recipient_group_ids, group.id]
                          }));
                        } else {
                          setCampaignForm(prev => ({
                            ...prev,
                            recipient_group_ids: prev.recipient_group_ids.filter(id => id !== group.id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={group.id} className="flex-1">
                      {group.name} ({group.recipient_count} recipients)
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Schedule (Optional)</Label>
              <Input
                type="datetime-local"
                value={campaignForm.scheduled_at}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                Cancel
              </Button>
              <Button variant="outline">
                Save Draft
              </Button>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                {campaignForm.scheduled_at ? 'Schedule' : 'Send'} Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign View Dialog */}
      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCampaign.name}</DialogTitle>
              <DialogDescription>
                Campaign details and statistics
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                {getStatusBadge(selectedCampaign.status)}
                {getCampaignTypeBadge(selectedCampaign.campaign_type)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Recipients</Label>
                  <p className="text-2xl font-bold">{selectedCampaign.recipient_count}</p>
                </div>
                <div>
                  <Label>Sent</Label>
                  <p className="text-2xl font-bold text-green-600">{selectedCampaign.sent_count}</p>
                </div>
              </div>

              <div>
                <Label>Subject</Label>
                <p className="font-medium">{selectedCampaign.subject}</p>
              </div>

              <div>
                <Label>Content</Label>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <pre className="whitespace-pre-wrap text-sm">{selectedCampaign.content}</pre>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};