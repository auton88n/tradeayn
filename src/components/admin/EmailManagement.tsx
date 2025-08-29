import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Mail, Send, Inbox, FileText, Plus, Edit, Trash2, Eye, Search, 
  Filter, RefreshCw, Download, Upload, Settings, User, Bot, Sparkles, Wand2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Email {
  id: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  content: string;
  html_content?: string;
  email_type: string;
  status: string;
  sent_at?: string;
  received_at?: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
  metadata?: any;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  html_content?: string;
  template_type: string;
  is_active: boolean;
  variables: any;
  created_at: string;
}

export const EmailManagement = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAIAssistantDialog, setShowAIAssistantDialog] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Compose form state
  const [composeForm, setComposeForm] = useState({
    to: '',
    subject: '',
    content: '',
    htmlContent: '',
        fromEmail: 'admin@aynn.io',
    templateId: '',
    templateVariables: {} as Record<string, string>
  });

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    id: '',
    name: '',
    subject: '',
    content: '',
    html_content: '',
    template_type: 'general',
    is_active: true,
    variables: [] as string[]
  });

  // AI Assistant form state
  const [aiForm, setAIForm] = useState({
    purpose: '',
    tone: 'professional',
    audience: 'users',
    subject: '',
    key_points: [] as string[],
    improve_content: ''
  });
  
  const [currentKeyPoint, setCurrentKeyPoint] = useState('');

  const { toast } = useToast();

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: "Error",
        description: "Failed to fetch emails",
        variant: "destructive"
      });
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : []
      })));
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEmails(), fetchTemplates()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const sendEmail = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('send-admin-email', {
        body: composeForm,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: "Email sent successfully!",
      });

      setShowComposeDialog(false);
      setComposeForm({
        to: '',
        subject: '',
        content: '',
        htmlContent: '',
        fromEmail: 'admin@aynn.io',
        templateId: '',
        templateVariables: {}
      });
      
      await fetchEmails();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive"
      });
    }
  };

  const saveTemplate = async () => {
    try {
      if (templateForm.id) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: templateForm.name,
            subject: templateForm.subject,
            content: templateForm.content,
            html_content: templateForm.html_content,
            template_type: templateForm.template_type,
            is_active: templateForm.is_active,
            variables: templateForm.variables
          })
          .eq('id', templateForm.id);

        if (error) throw error;
        toast({ title: "Success", description: "Template updated successfully!" });
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            name: templateForm.name,
            subject: templateForm.subject,
            content: templateForm.content,
            html_content: templateForm.html_content,
            template_type: templateForm.template_type,
            is_active: templateForm.is_active,
            variables: templateForm.variables
          });

        if (error) throw error;
        toast({ title: "Success", description: "Template created successfully!" });
      }

      setShowTemplateDialog(false);
      setTemplateForm({
        id: '',
        name: '',
        subject: '',
        content: '',
        html_content: '',
        template_type: 'general',
        is_active: true,
        variables: []
      });
      
      await fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Success", description: "Template deleted successfully!" });
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const applyTemplate = (template: EmailTemplate) => {
    const templateVariables = Array.isArray(template.variables) ? template.variables : [];
    setComposeForm(prev => ({
      ...prev,
      subject: template.subject,
      content: template.content,
      htmlContent: template.html_content || '',
      templateId: template.id,
      templateVariables: templateVariables.reduce((acc, variable) => {
        acc[variable] = '';
        return acc;
      }, {} as Record<string, string>)
    }));
  };

  const generateAIEmail = async (type: 'generate' | 'improve' | 'template') => {
    setIsGeneratingAI(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      let requestBody: any = { type };

      if (type === 'generate') {
        if (!aiForm.purpose.trim()) {
          toast({
            title: "Missing Information",
            description: "Please provide the purpose of the email",
            variant: "destructive"
          });
          return;
        }
        requestBody.context = {
          purpose: aiForm.purpose,
          tone: aiForm.tone,
          audience: aiForm.audience,
          subject: aiForm.subject,
          key_points: aiForm.key_points
        };
      } else if (type === 'improve') {
        if (!aiForm.improve_content.trim()) {
          toast({
            title: "Missing Content",
            description: "Please provide content to improve",
            variant: "destructive"
          });
          return;
        }
        requestBody.content = aiForm.improve_content;
        requestBody.context = {
          tone: aiForm.tone,
          audience: aiForm.audience
        };
      }

      const response = await supabase.functions.invoke('ai-email-assistant', {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      const aiResult = response.data;
      if (aiResult.success) {
        if (type === 'generate' || type === 'improve') {
          setComposeForm(prev => ({
            ...prev,
            subject: aiResult.subject || prev.subject,
            content: aiResult.content
          }));
          setShowAIAssistantDialog(false);
          setShowComposeDialog(true);
        } else if (type === 'template') {
          setTemplateForm(prev => ({
            ...prev,
            subject: aiResult.subject || prev.subject,
            content: aiResult.content,
            variables: aiResult.variables || []
          }));
          setShowAIAssistantDialog(false);
          setShowTemplateDialog(true);
        }
        
        toast({
          title: "AI Content Generated",
          description: `Your email ${type === 'improve' ? 'has been improved' : 'has been generated'} successfully!`,
        });
      } else {
        throw new Error(aiResult.error);
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI content",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
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

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.sender_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.recipient_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || email.status === statusFilter;
    const matchesType = typeFilter === 'all' || email.email_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'default',
      draft: 'secondary',
      failed: 'destructive',
      received: 'default'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      outbound: 'bg-blue-600',
      inbound: 'bg-green-600',
      draft: 'bg-gray-600'
    } as const;
    
    return <Badge className={colors[type as keyof typeof colors] || 'bg-gray-600'}>{type}</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 animate-spin" />
          <span>Loading email management...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Management
          </h2>
          <p className="text-muted-foreground">Send, receive, and manage admin emails</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTemplateDialog(true)} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setShowAIAssistantDialog(true)} variant="outline">
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          <Button onClick={() => setShowComposeDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      <Tabs defaultValue="emails" className="space-y-4">
        <TabsList>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="emails">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchEmails} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Email List */}
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{email.subject}</span>
                          {getStatusBadge(email.status)}
                          {getTypeBadge(email.email_type)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          From: {email.sender_email} → To: {email.recipient_email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(email.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredEmails.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No emails found matching your criteria
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Email Templates
                <Button onClick={() => setShowTemplateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{template.name}</span>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{template.template_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                      {template.variables && template.variables.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Variables: {Array.isArray(template.variables) ? template.variables.join(', ') : 'None'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => applyTemplate(template)}
                      >
                        Use
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setTemplateForm({
                            id: template.id,
                            name: template.name,
                            subject: template.subject,
                            content: template.content,
                            html_content: template.html_content || '',
                            template_type: template.template_type,
                            is_active: template.is_active,
                            variables: Array.isArray(template.variables) ? template.variables : []
                          });
                          setShowTemplateDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{emails.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {emails.filter(e => e.status === 'sent').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {emails.filter(e => e.status === 'failed').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Compose Email Dialog */}
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>
              Send a new email from the admin center
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  value={composeForm.fromEmail}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  value={composeForm.to}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="recipient@example.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={composeForm.subject}
                onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={composeForm.content}
                onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Email content"
                rows={8}
              />
            </div>
            {composeForm.templateId && Object.keys(composeForm.templateVariables).length > 0 && (
              <div>
                <Label>Template Variables</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.keys(composeForm.templateVariables).map((variable) => (
                    <div key={variable}>
                      <Label className="text-xs">{variable}</Label>
                      <Input
                        value={composeForm.templateVariables[variable]}
                        onChange={(e) => setComposeForm(prev => ({
                          ...prev,
                          templateVariables: {
                            ...prev.templateVariables,
                            [variable]: e.target.value
                          }
                        }))}
                        placeholder={`Enter ${variable}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Select onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  if (template) applyTemplate(template);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Use template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.is_active).map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={sendEmail}>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{templateForm.id ? 'Edit' : 'Create'} Email Template</DialogTitle>
            <DialogDescription>
              {templateForm.id ? 'Update' : 'Create a new'} email template for reuse
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Welcome Email"
                />
              </div>
              <div>
                <Label htmlFor="templateType">Template Type</Label>
                <Select value={templateForm.template_type} onValueChange={(value) => setTemplateForm(prev => ({ ...prev, template_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="templateSubject">Subject</Label>
              <Input
                id="templateSubject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Welcome to {{company_name}}!"
              />
            </div>
            <div>
              <Label htmlFor="templateContent">Content</Label>
              <Textarea
                id="templateContent"
                value={templateForm.content}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Hello {{name}}, welcome to our platform!"
                rows={6}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="templateActive"
                checked={templateForm.is_active}
                onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="templateActive">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveTemplate}>
                {templateForm.id ? 'Update' : 'Create'} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email View Dialog */}
      {selectedEmail && (
        <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedEmail.subject}</DialogTitle>
              <DialogDescription>
                From: {selectedEmail.sender_email} • To: {selectedEmail.recipient_email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                {getStatusBadge(selectedEmail.status)}
                {getTypeBadge(selectedEmail.email_type)}
                <Badge variant="outline">
                  {new Date(selectedEmail.created_at).toLocaleString()}
                </Badge>
              </div>
              <div className="border rounded-lg p-4 bg-muted/30">
                <pre className="whitespace-pre-wrap text-sm">{selectedEmail.content}</pre>
              </div>
              {selectedEmail.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">Error: {selectedEmail.error_message}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Assistant Dialog */}
      <Dialog open={showAIAssistantDialog} onOpenChange={setShowAIAssistantDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Email Assistant
            </DialogTitle>
            <DialogDescription>
              Let AI help you create, improve, or generate email templates
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* AI Action Tabs */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setAIForm(prev => ({ ...prev, purpose: '', key_points: [] }));
                }}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate New
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setAIForm(prev => ({ ...prev, improve_content: composeForm.content }));
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Improve Existing
              </Button>
            </div>

            {/* Generate New Email Form */}
            {!aiForm.improve_content && (
              <div className="space-y-4">
                <div>
                  <Label>What's the purpose of this email?</Label>
                  <Textarea
                    value={aiForm.purpose}
                    onChange={(e) => setAIForm(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="e.g., Welcome new users, announce updates, send notifications..."
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
                        <SelectItem value="users">Users</SelectItem>
                        <SelectItem value="admins">Administrators</SelectItem>
                        <SelectItem value="new_users">New Users</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
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
              </div>
            )}

            {/* Improve Existing Email Form */}
            {aiForm.improve_content && (
              <div className="space-y-4">
                <div>
                  <Label>Content to Improve</Label>
                  <Textarea
                    value={aiForm.improve_content}
                    onChange={(e) => setAIForm(prev => ({ ...prev, improve_content: e.target.value }))}
                    placeholder="Paste your email content here to improve it..."
                    rows={8}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Desired Tone</Label>
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
                    <Label>Target Audience</Label>
                    <Select 
                      value={aiForm.audience} 
                      onValueChange={(value) => setAIForm(prev => ({ ...prev, audience: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="users">Users</SelectItem>
                        <SelectItem value="admins">Administrators</SelectItem>
                        <SelectItem value="new_users">New Users</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                        <SelectItem value="team">Team Members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowAIAssistantDialog(false);
                setAIForm(prev => ({ ...prev, improve_content: '', purpose: '', key_points: [] }));
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => generateAIEmail(aiForm.improve_content ? 'improve' : 'generate')}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    {aiForm.improve_content ? 'Improve Email' : 'Generate Email'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};