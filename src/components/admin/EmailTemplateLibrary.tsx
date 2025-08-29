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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Plus, Edit, Trash2, Copy, Download, Upload, 
  Eye, Search, Filter, Tag, Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  html_content?: string;
  template_type: string;
  category: string;
  is_active: boolean;
  variables: string[];
  preview_image?: string;
  tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_CATEGORIES = [
  { value: 'welcome', label: 'Welcome & Onboarding', icon: '👋' },
  { value: 'notification', label: 'Notifications', icon: '🔔' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'newsletter', label: 'Newsletters', icon: '📧' },
  { value: 'transactional', label: 'Transactional', icon: '💳' },
  { value: 'announcement', label: 'Announcements', icon: '📣' },
  { value: 'reminder', label: 'Reminders', icon: '⏰' },
  { value: 'survey', label: 'Surveys & Feedback', icon: '📋' },
  { value: 'educational', label: 'Educational', icon: '📚' },
  { value: 'seasonal', label: 'Seasonal', icon: '🎄' }
];

const PREDEFINED_TEMPLATES = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to {{company_name}}, {{user_name}}!',
    content: `Dear {{user_name}},

Welcome to {{company_name}}! We're thrilled to have you join our platform.

Here's what you can do next:
• Complete your profile setup
• Explore our features
• Contact our support team if you need help

Best regards,
The {{company_name}} Team`,
    category: 'welcome',
    template_type: 'onboarding',
    variables: ['user_name', 'company_name'],
    tags: ['welcome', 'onboarding', 'new-user']
  },
  {
    name: 'Access Grant Notification',
    subject: 'Your access to {{platform_name}} has been approved',
    content: `Hello {{user_name}},

Great news! Your access request to {{platform_name}} has been approved.

Your account details:
• Email: {{user_email}}
• Access Level: {{access_level}}
• Monthly Limit: {{monthly_limit}} messages

You can now log in and start using the platform.

If you have any questions, please don't hesitate to reach out.

Best regards,
The {{platform_name}} Team`,
    category: 'notification',
    template_type: 'notification',
    variables: ['user_name', 'platform_name', 'user_email', 'access_level', 'monthly_limit'],
    tags: ['access', 'approval', 'notification']
  },
  {
    name: 'Usage Limit Warning',
    subject: 'You\'ve used {{usage_percentage}}% of your monthly limit',
    content: `Hi {{user_name}},

This is a friendly reminder that you've used {{current_usage}} out of {{monthly_limit}} messages this month ({{usage_percentage}}%).

Your usage will reset on {{reset_date}}.

To avoid any interruption to your service, please monitor your usage or contact us to discuss upgrading your plan.

Best regards,
The Support Team`,
    category: 'reminder',
    template_type: 'notification',
    variables: ['user_name', 'usage_percentage', 'current_usage', 'monthly_limit', 'reset_date'],
    tags: ['usage', 'limit', 'warning', 'reminder']
  },
  {
    name: 'Monthly Newsletter',
    subject: '{{month}} Newsletter - What\'s New at {{company_name}}',
    content: `Dear {{user_name}},

Welcome to our {{month}} newsletter! Here's what's been happening:

🚀 NEW FEATURES
• {{new_feature_1}}
• {{new_feature_2}}

📈 IMPROVEMENTS  
• {{improvement_1}}
• {{improvement_2}}

📅 UPCOMING EVENTS
• {{event_1}}
• {{event_2}}

Thank you for being part of our community!

Best regards,
The {{company_name}} Team`,
    category: 'newsletter',
    template_type: 'marketing',
    variables: ['user_name', 'month', 'company_name', 'new_feature_1', 'new_feature_2', 'improvement_1', 'improvement_2', 'event_1', 'event_2'],
    tags: ['newsletter', 'updates', 'monthly', 'marketing']
  }
];

export const EmailTemplateLibrary = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  
  const [templateForm, setTemplateForm] = useState({
    id: '',
    name: '',
    subject: '',
    content: '',
    html_content: '',
    template_type: 'general',
    category: 'notification',
    is_active: true,
    variables: [] as string[],
    tags: [] as string[]
  });

  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = (data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) 
          ? template.variables.map(v => String(v)) 
          : [],
        category: template.template_type, // Map template_type to category for now
        tags: [], // Add empty tags for now
        usage_count: 0, // Add default usage count
        preview_image: undefined
      }));

      setTemplates(transformedData);
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
      await fetchTemplates();
      setIsLoading(false);
    };
    loadData();
  }, []);

  const createPredefinedTemplates = async () => {
    try {
      for (const template of PREDEFINED_TEMPLATES) {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            name: template.name,
            subject: template.subject,
            content: template.content,
            template_type: template.template_type,
            is_active: true,
            variables: template.variables
          });

        if (error && !error.message.includes('duplicate key')) {
          console.error('Error creating template:', error);
        }
      }
      
      toast({
        title: "Success",
        description: "Predefined templates have been added to your library",
      });
      
      await fetchTemplates();
    } catch (error) {
      console.error('Error creating predefined templates:', error);
      toast({
        title: "Error",
        description: "Failed to create predefined templates",
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
      resetTemplateForm();
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

  const duplicateTemplate = async (template: EmailTemplate) => {
    setTemplateForm({
      id: '',
      name: `${template.name} (Copy)`,
      subject: template.subject,
      content: template.content,
      html_content: template.html_content || '',
      template_type: template.template_type,
      category: template.category,
      is_active: true,
      variables: [...template.variables],
      tags: [...template.tags]
    });
    setShowTemplateDialog(true);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      id: '',
      name: '',
      subject: '',
      content: '',
      html_content: '',
      template_type: 'general',
      category: 'notification',
      is_active: true,
      variables: [],
      tags: []
    });
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return [...new Set(matches.map(match => match.replace(/[{}]/g, '')))];
  };

  const updateVariables = () => {
    const subjectVars = extractVariables(templateForm.subject);
    const contentVars = extractVariables(templateForm.content);
    const allVars = [...new Set([...subjectVars, ...contentVars])];
    
    setTemplateForm(prev => ({
      ...prev,
      variables: allVars
    }));
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryInfo = (category: string) => {
    return TEMPLATE_CATEGORIES.find(cat => cat.value === category) || 
           { value: category, label: category, icon: '📧' };
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 animate-spin" />
          <span>Loading template library...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Email Template Library
          </h2>
          <p className="text-muted-foreground">Manage your email templates and create new ones</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createPredefinedTemplates} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            Add Predefined
          </Button>
          <Button onClick={() => setShowTemplateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const categoryInfo = getCategoryInfo(template.category);
          return (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {template.subject}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={template.is_active ? 'default' : 'secondary'} className="text-xs">
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className="text-xs">
                      {categoryInfo.icon} {categoryInfo.label}
                    </Badge>
                    <span className="text-muted-foreground">
                      Used {template.usage_count} times
                    </span>
                  </div>
                  
                  {template.variables.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Variables:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.slice(0, 3).map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTemplateForm({
                          id: template.id,
                          name: template.name,
                          subject: template.subject,
                          content: template.content,
                          html_content: template.html_content || '',
                          template_type: template.template_type,
                          category: template.category,
                          is_active: template.is_active,
                          variables: [...template.variables],
                          tags: [...template.tags]
                        });
                        setShowTemplateDialog(true);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || categoryFilter !== 'all' 
              ? 'Try adjusting your search criteria' 
              : 'Create your first email template to get started'
            }
          </p>
          <Button onClick={() => setShowTemplateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </Card>
      )}

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{templateForm.id ? 'Edit' : 'Create'} Email Template</DialogTitle>
            <DialogDescription>
              {templateForm.id ? 'Update' : 'Create a new'} email template for your campaigns
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Welcome Email"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={templateForm.category} 
                    onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Template Type</Label>
                <Select 
                  value={templateForm.template_type} 
                  onValueChange={(value) => setTemplateForm(prev => ({ ...prev, template_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={templateForm.is_active}
                  onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Active</Label>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label>Email Subject</Label>
                <Input
                  value={templateForm.subject}
                  onChange={(e) => {
                    setTemplateForm(prev => ({ ...prev, subject: e.target.value }));
                    updateVariables();
                  }}
                  placeholder="Welcome to {{company_name}}!"
                />
              </div>

              <div>
                <Label>Email Content</Label>
                <Textarea
                  value={templateForm.content}
                  onChange={(e) => {
                    setTemplateForm(prev => ({ ...prev, content: e.target.value }));
                    updateVariables();
                  }}
                  placeholder="Hello {{name}}, welcome to our platform!"
                  rows={12}
                />
              </div>

              <div>
                <Label>HTML Content (Optional)</Label>
                <Textarea
                  value={templateForm.html_content}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, html_content: e.target.value }))}
                  placeholder="<h1>Hello {{name}}</h1><p>Welcome to our platform!</p>"
                  rows={6}
                />
              </div>
            </TabsContent>

            <TabsContent value="variables" className="space-y-4">
              <div>
                <Label>Template Variables</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Variables are automatically detected from your content. Use variable_name format.
                </p>
                <div className="flex flex-wrap gap-2">
                  {templateForm.variables.map((variable) => (
                    <Badge key={variable} variant="outline">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                  {templateForm.variables.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No variables detected. Add variables like user_name in your content.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setShowTemplateDialog(false);
              resetTemplateForm();
            }}>
              Cancel
            </Button>
            <Button onClick={saveTemplate}>
              {templateForm.id ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template View Dialog */}
      {selectedTemplate && (
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4">
              <DialogTitle>{selectedTemplate.name}</DialogTitle>
              <DialogDescription>
                Template preview and details
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 h-full">
              <div className="space-y-6 pr-4">
                <div className="flex gap-2">
                  <Badge variant={selectedTemplate.is_active ? 'default' : 'secondary'}>
                    {selectedTemplate.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{getCategoryInfo(selectedTemplate.category).label}</Badge>
                </div>
                
                <div>
                  <Label className="text-base font-semibold">Subject</Label>
                  <p className="font-medium mt-1">{selectedTemplate.subject}</p>
                </div>

                <div>
                  <Label className="text-base font-semibold">Content</Label>
                  <div className="border rounded-lg p-4 bg-muted/30 mt-1">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">{selectedTemplate.content}</pre>
                  </div>
                </div>

                {selectedTemplate.variables.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold">Variables</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTemplate.variables.map((variable) => (
                        <Badge key={variable} variant="outline">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};