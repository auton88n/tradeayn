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
import { useLanguage } from '@/contexts/LanguageContext';
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
  
  const { toast } = useToast();
  const { t, language } = useLanguage();
  
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
        title: t('admin.error'),
        description: t('admin.fetchCampaignsError'),
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
        title: t('admin.error'),
        description: t('admin.fetchGroupsError'),
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
          <Icon className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
          {t(`admin.${status}`)}
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
    
    return <Badge className={colors[type as keyof typeof colors] || 'bg-gray-600'}>{t(`admin.${type}`)}</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Target className="w-5 h-5 animate-spin" />
          <span>{t('admin.loadingCampaigns')}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : ''}>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Target className="w-6 h-6" />
            {t('admin.emailCampaigns')}
          </h2>
          <p className="text-muted-foreground">{t('admin.emailCampaignsDesc')}</p>
        </div>
        <div className={`flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Button onClick={() => setShowGroupDialog(true)} variant="outline" className={language === 'ar' ? 'flex-row-reverse' : ''}>
            <Users className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t('admin.recipientGroups')}
          </Button>
          <Button onClick={() => setShowCampaignDialog(true)} className={language === 'ar' ? 'flex-row-reverse' : ''}>
            <Plus className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t('admin.newCampaign')}
          </Button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.totalCampaigns')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${language === 'ar' ? 'text-right' : ''}`}>{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.activeCampaigns')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-blue-600 ${language === 'ar' ? 'text-right' : ''}`}>
              {campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.totalRecipients')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-green-600 ${language === 'ar' ? 'text-right' : ''}`}>
              {campaigns.reduce((sum, c) => sum + c.recipient_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.emailsSent')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-purple-600 ${language === 'ar' ? 'text-right' : ''}`}>
              {campaigns.reduce((sum, c) => sum + c.sent_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : ''}>{t('admin.emailCampaigns')}</CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>{t('admin.manageCampaigns')}</CardDescription>
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
                    <p className={`text-sm text-muted-foreground mb-1 ${language === 'ar' ? 'text-right' : ''}`}>{campaign.subject}</p>
                    <div className={`flex items-center gap-4 text-xs text-muted-foreground ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
                      <span>{t('admin.recipients')}: {campaign.recipient_count}</span>
                      <span>{t('admin.sent')}: {campaign.sent_count}</span>
                      <span>{t('admin.created')}: {new Date(campaign.created_at).toLocaleDateString()}</span>
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
            <DialogTitle className={language === 'ar' ? 'text-right' : ''}>{t('admin.createEmailCampaign')}</DialogTitle>
            <DialogDescription className={language === 'ar' ? 'text-right' : ''}>
              {t('admin.setupNewCampaign')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={language === 'ar' ? 'text-right' : ''}>{t('admin.campaignName')}</Label>
                <Input
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('admin.monthlyNewsletter')}
                  className={language === 'ar' ? 'text-right' : ''}
                />
              </div>
              <div>
                <Label className={language === 'ar' ? 'text-right' : ''}>{t('admin.campaignType')}</Label>
                <Select 
                  value={campaignForm.campaign_type} 
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, campaign_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">{t('admin.marketing')}</SelectItem>
                    <SelectItem value="newsletter">{t('admin.newsletter')}</SelectItem>
                    <SelectItem value="onboarding">{t('admin.onboarding')}</SelectItem>
                    <SelectItem value="notification">{t('admin.notification')}</SelectItem>
                    <SelectItem value="announcement">{t('admin.announcement')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className={language === 'ar' ? 'text-right' : ''}>{t('admin.emailSubject')}</Label>
              <Input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder={t('admin.monthlyUpdates')}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>

            <div>
              <Label className={language === 'ar' ? 'text-right' : ''}>{t('admin.emailContent')}</Label>
              <Textarea
                value={campaignForm.content}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t('admin.writeEmailContent')}
                rows={8}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>

            <div>
              <Label className={language === 'ar' ? 'text-right' : ''}>{t('admin.recipientGroupsSelect')}</Label>
              <div className="space-y-2 mt-2">
                {recipientGroups.map((group) => (
                  <div key={group.id} className={`flex items-center space-x-2 ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : ''}`}>
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
                    <Label htmlFor={group.id} className={`flex-1 ${language === 'ar' ? 'text-right' : ''}`}>
                      {group.name} ({group.recipient_count} {t('admin.recipients')})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className={language === 'ar' ? 'text-right' : ''}>{t('admin.schedule')}</Label>
              <Input
                type="datetime-local"
                value={campaignForm.scheduled_at}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>

            <div className={`flex gap-2 ${language === 'ar' ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
              <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                {t('admin.cancel')}
              </Button>
              <Button variant="outline">
                {t('admin.saveDraft')}
              </Button>
              <Button className={language === 'ar' ? 'flex-row-reverse' : ''}>
                <Send className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {campaignForm.scheduled_at ? t('admin.scheduleCampaign') : t('admin.sendCampaign')}
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
              <DialogTitle className={language === 'ar' ? 'text-right' : ''}>{selectedCampaign.name}</DialogTitle>
              <DialogDescription className={language === 'ar' ? 'text-right' : ''}>
                {t('admin.campaignDetails')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                {getStatusBadge(selectedCampaign.status)}
                {getCampaignTypeBadge(selectedCampaign.campaign_type)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={language === 'ar' ? 'text-right' : ''}>
                  <Label>{t('admin.recipients')}</Label>
                  <p className="text-2xl font-bold">{selectedCampaign.recipient_count}</p>
                </div>
                <div className={language === 'ar' ? 'text-right' : ''}>
                  <Label>{t('admin.sent')}</Label>
                  <p className="text-2xl font-bold text-green-600">{selectedCampaign.sent_count}</p>
                </div>
              </div>

              <div className={language === 'ar' ? 'text-right' : ''}>
                <Label>{t('admin.subject')}</Label>
                <p className="font-medium">{selectedCampaign.subject}</p>
              </div>

              <div className={language === 'ar' ? 'text-right' : ''}>
                <Label>{t('admin.content')}</Label>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <pre className={`whitespace-pre-wrap text-sm ${language === 'ar' ? 'text-right' : ''}`}>{selectedCampaign.content}</pre>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};