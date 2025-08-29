import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Mail, Edit, Eye, Save, AlertCircle, CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthTemplate {
  id: string;
  template_type: string;
  subject: string;
  html_content: string;
  text_content?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const AuthEmailTemplates = () => {
  const [templates, setTemplates] = useState<AuthTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AuthTemplate | null>(null);
  
  // Edit form
  const [editForm, setEditForm] = useState({
    id: '',
    template_type: '',
    subject: '',
    html_content: '',
    text_content: '',
    is_active: true
  });

  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_email_templates')
        .select('*')
        .order('template_type');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching auth templates:', error);
      toast({
        title: "Info",
        description: "Auth email templates not available. This feature requires database setup.",
        variant: "default"
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

  const openEditDialog = (template: AuthTemplate) => {
    setEditForm({
      id: template.id,
      template_type: template.template_type,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      is_active: template.is_active
    });
    setShowEditDialog(true);
  };

  const openPreviewDialog = (template: AuthTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const saveTemplate = async () => {
    try {
      const { error } = await supabase
        .from('auth_email_templates')
        .update({
          subject: editForm.subject,
          html_content: editForm.html_content,
          text_content: editForm.text_content,
          is_active: editForm.is_active
        })
        .eq('id', editForm.id);

      if (error) throw error;

      toast({
        title: "Template Updated",
        description: "Authentication email template has been updated successfully"
      });

      setShowEditDialog(false);
      await fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive"
      });
    }
  };

  const getTemplateTypeLabel = (type: string) => {
    const labels = {
      'signup_confirmation': 'Sign Up Confirmation',
      'password_reset': 'Password Reset',
      'email_change': 'Email Change',
      'invitation': 'Invitation'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 animate-spin" />
          <span>Loading auth email templates...</span>
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
            Authentication Email Templates
          </h2>
          <p className="text-muted-foreground">Customize AYN-branded authentication emails</p>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Authentication Templates Not Available</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Custom authentication email templates require additional database setup. 
              Contact your administrator to enable this feature.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {getTemplateTypeLabel(template.template_type)}
                  </CardTitle>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription>{template.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPreviewDialog(template)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  Last updated: {new Date(template.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Authentication Email Template</DialogTitle>
            <DialogDescription>
              Customize the {getTemplateTypeLabel(editForm.template_type)} email template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Template is active</Label>
            </div>

            <div>
              <Label>Subject</Label>
              <Input
                value={editForm.subject}
                onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>

            <div>
              <Label>HTML Content</Label>
              <Textarea
                value={editForm.html_content}
                onChange={(e) => setEditForm(prev => ({ ...prev, html_content: e.target.value }))}
                placeholder="HTML email content"
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use variables like {'{{ .ConfirmationURL }}'} and {'{{ .Email }}'} in your template
              </p>
            </div>

            <div>
              <Label>Plain Text Content (Optional)</Label>
              <Textarea
                value={editForm.text_content}
                onChange={(e) => setEditForm(prev => ({ ...prev, text_content: e.target.value }))}
                placeholder="Plain text version of the email"
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fallback for email clients that don't support HTML
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveTemplate}>
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Preview: {selectedTemplate ? getTemplateTypeLabel(selectedTemplate.template_type) : ''}
            </DialogTitle>
            <DialogDescription>
              Subject: {selectedTemplate?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/20">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: selectedTemplate?.html_content.replace(/{{ \.ConfirmationURL }}/g, '#confirmation-link')
                    .replace(/{{ \.Email }}/g, 'user@example.com') || '' 
                }}
              />
            </div>
            {selectedTemplate?.text_content && (
              <div>
                <Label className="text-sm font-medium">Plain Text Version:</Label>
                <div className="border rounded-lg p-4 bg-muted/20 mt-2">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {selectedTemplate.text_content.replace(/{{ \.ConfirmationURL }}/g, '#confirmation-link')
                      .replace(/{{ \.Email }}/g, 'user@example.com')}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};