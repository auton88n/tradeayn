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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, Send, Mail, Plus, Bot, Sparkles, Wand2, 
  Filter, Search, RefreshCw, Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Worker {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_person: string | null;
  phone: string | null;
  email?: string;
  is_active: boolean;
  role: string;
}

interface AIEmailForm {
  purpose: string;
  tone: string;
  audience: string;
  subject: string;
  key_points: string[];
  recipients: string[];
}

export const WorkerEmailManagement = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false);
  const [showAIAssistantDialog, setShowAIAssistantDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Email form state
  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: '',
    fromEmail: 'admin@aynn.io'
  });

  // AI Assistant form state
  const [aiForm, setAIForm] = useState<AIEmailForm>({
    purpose: '',
    tone: 'professional',
    audience: 'workers',
    subject: '',
    key_points: [],
    recipients: []
  });

  const [currentKeyPoint, setCurrentKeyPoint] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();

  const fetchWorkers = async () => {
    try {
      // Fetch profiles first  
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      // Fetch access grants
      const { data: accessGrants, error: grantsError } = await supabase
        .from('access_grants')
        .select('*');

      if (grantsError) {
        console.error('Error fetching access grants:', grantsError);
      }

      // Get user emails from auth.users (note: this requires admin privileges)
      let users: any[] = [];
      try {
        const { data: { users: authUsers }, error: usersError } = await supabase.auth.admin.listUsers();
        if (!usersError) {
          users = authUsers || [];
        }
      } catch (error) {
        console.error('Error fetching user emails (admin required):', error);
      }

      // Combine the data
      const workersData: Worker[] = (profiles || []).map(profile => {
        const user = users.find(u => u.id === profile.user_id);
        const userRole = (userRoles || []).find(r => r.user_id === profile.user_id);
        const accessGrant = (accessGrants || []).find(g => g.user_id === profile.user_id);
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          company_name: profile.company_name,
          contact_person: profile.contact_person,
          phone: profile.phone,
          email: user?.email || undefined,
          role: userRole?.role || 'user',
          is_active: accessGrant?.is_active || false
        };
      });

      setWorkers(workersData);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workers list",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const generateAIEmail = async (type: 'generate' | 'improve' | 'template') => {
    if (!aiForm.purpose.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide the purpose of the email",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('ai-email-assistant', {
        body: {
          type,
          context: {
            purpose: aiForm.purpose,
            tone: aiForm.tone,
            audience: aiForm.audience,
            subject: aiForm.subject,
            key_points: aiForm.key_points
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      const aiResult = response.data;
      if (aiResult.success) {
        setEmailForm(prev => ({
          ...prev,
          subject: aiResult.subject || prev.subject,
          content: aiResult.content
        }));
        
        setShowAIAssistantDialog(false);
        setShowBulkEmailDialog(true);
        
        toast({
          title: "AI Email Generated",
          description: "Your email has been generated successfully!",
        });
      } else {
        throw new Error(aiResult.error);
      }
    } catch (error) {
      console.error('Error generating AI email:', error);
      toast({
        title: "Error",
        description: "Failed to generate email with AI",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendBulkEmail = async () => {
    if (!emailForm.subject.trim() || !emailForm.content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide both subject and content",
        variant: "destructive"
      });
      return;
    }

    if (selectedWorkers.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one worker to send the email to",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const selectedWorkerEmails = workers
        .filter(worker => selectedWorkers.includes(worker.user_id))
        .map(worker => worker.email)
        .filter(email => email);

      if (selectedWorkerEmails.length === 0) {
        toast({
          title: "No Email Addresses",
          description: "Selected workers don't have email addresses available",
          variant: "destructive"
        });
        return;
      }

      // Send emails to each selected worker
      const emailPromises = selectedWorkerEmails.map(email => 
        supabase.functions.invoke('send-admin-email', {
          body: {
            to: email,
            subject: emailForm.subject,
            content: emailForm.content,
            fromEmail: emailForm.fromEmail
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast({
          title: "Emails Sent",
          description: `Successfully sent ${successful} emails${failed > 0 ? `, ${failed} failed` : ''}`,
        });
      }

      if (failed > 0 && successful === 0) {
        throw new Error(`Failed to send all ${failed} emails`);
      }

      setShowBulkEmailDialog(false);
      setSelectedWorkers([]);
      setEmailForm({
        subject: '',
        content: '',
        fromEmail: 'admin@aynn.io'
      });
      
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      toast({
        title: "Error",
        description: "Failed to send bulk emails",
        variant: "destructive"
      });
    }
  };

  const addKeyPoint = () => {
    if (currentKeyPoint.trim() && !aiForm.key_points.includes(currentKeyPoint.trim())) {
      setAIForm(prev => ({
        ...prev,
        key_points: [...prev.key_points, currentKeyPoint.trim()]
      }));
      setCurrentKeyPoint('');
    }
  };

  const removeKeyPoint = (index: number) => {
    setAIForm(prev => ({
      ...prev,
      key_points: prev.key_points.filter((_, i) => i !== index)
    }));
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || worker.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && worker.is_active) ||
                         (statusFilter === 'inactive' && !worker.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 animate-spin" />
          <span>Loading workers...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Worker Email Management
          </h2>
          <p className="text-muted-foreground">Send emails to your team members and workers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAIAssistantDialog(true)} variant="outline">
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          <Button 
            onClick={() => setShowBulkEmailDialog(true)}
            disabled={selectedWorkers.length === 0}
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Email ({selectedWorkers.length})
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search workers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchWorkers} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Workers List */}
      <Card>
        <CardHeader>
          <CardTitle>Select Workers ({selectedWorkers.length} selected)</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedWorkers(filteredWorkers.map(w => w.user_id))}
            >
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedWorkers([])}
            >
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredWorkers.map((worker) => (
                <div
                  key={worker.user_id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedWorkers.includes(worker.user_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedWorkers(prev => [...prev, worker.user_id]);
                      } else {
                        setSelectedWorkers(prev => prev.filter(id => id !== worker.user_id));
                      }
                    }}
                  />
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {worker.company_name || 'Unknown Company'}
                      </span>
                      <Badge variant={worker.is_active ? 'default' : 'secondary'}>
                        {worker.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{worker.role}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Contact: {worker.contact_person || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Email: {worker.email || 'No email available'}
                    </div>
                  </div>
                </div>
              ))}
              {filteredWorkers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No workers found matching your criteria
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* AI Assistant Dialog */}
      <Dialog open={showAIAssistantDialog} onOpenChange={setShowAIAssistantDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Email Assistant
            </DialogTitle>
            <DialogDescription>
              Let AI help you create the perfect email for your workers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>What's the purpose of this email?</Label>
              <Textarea
                value={aiForm.purpose}
                onChange={(e) => setAIForm(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="e.g., Announce new policy changes, welcome new team members, share important updates..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tone</Label>
                <Select 
                  value={aiForm.tone} 
                  onValueChange={(value) => setAIForm(prev => ({ ...prev, tone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audience</Label>
                <Select 
                  value={aiForm.audience} 
                  onValueChange={(value) => setAIForm(prev => ({ ...prev, audience: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workers">All Workers</SelectItem>
                    <SelectItem value="admins">Administrators</SelectItem>
                    <SelectItem value="active_users">Active Users</SelectItem>
                    <SelectItem value="new_users">New Users</SelectItem>
                    <SelectItem value="team">Team Members</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Subject Line (Optional)</Label>
              <Input
                value={aiForm.subject}
                onChange={(e) => setAIForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Leave blank to let AI suggest a subject"
              />
            </div>

            <div>
              <Label>Key Points to Include</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={currentKeyPoint}
                  onChange={(e) => setCurrentKeyPoint(e.target.value)}
                  placeholder="Add a key point..."
                  onKeyPress={(e) => e.key === 'Enter' && addKeyPoint()}
                />
                <Button onClick={addKeyPoint} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiForm.key_points.map((point, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => removeKeyPoint(index)}
                  >
                    {point} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAIAssistantDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => generateAIEmail('generate')}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Email Dialog */}
      <Dialog open={showBulkEmailDialog} onOpenChange={setShowBulkEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Bulk Email</DialogTitle>
            <DialogDescription>
              Send email to {selectedWorkers.length} selected workers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>From</Label>
              <Input
                value={emailForm.fromEmail}
                onChange={(e) => setEmailForm(prev => ({ ...prev, fromEmail: e.target.value }))}
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={emailForm.content}
                onChange={(e) => setEmailForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Email content"
                rows={10}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkEmailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={sendBulkEmail}>
                <Send className="w-4 h-4 mr-2" />
                Send to {selectedWorkers.length} Workers
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};