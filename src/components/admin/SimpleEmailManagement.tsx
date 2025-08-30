import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Send, Plus, Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Email {
  id: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  content: string;
  status: string;
  sent_at?: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  company_name?: string;
  contact_person?: string;
}

export const SimpleEmailManagement = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [showEmailSelection, setShowEmailSelection] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: '',
    companyName: '',
    contactPerson: '',
    temporaryPassword: ''
  });

  // Email form
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    content: '',
    type: 'single' // single or bulk
  });

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_emails')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Get users and profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get auth users (requires admin privileges)
      try {
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
        
        if (!authError && authUsers) {
          const combinedUsers = authUsers.map(user => {
            const profile = profiles?.find(p => p.user_id === user.id);
            return {
              id: user.id,
              email: user.email || '',
              company_name: profile?.company_name,
              contact_person: profile?.contact_person
            };
          });
          setUsers(combinedUsers);
        }
      } catch (error) {
        console.error('Error fetching auth users:', error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEmails(), fetchUsers()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const sendEmail = async () => {
    if (!emailForm.subject.trim() || !emailForm.content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide both subject and content",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const recipients = emailForm.type === 'bulk' 
        ? users.map(u => u.email).filter(email => email)
        : [emailForm.to];

      if (recipients.length === 0) {
        toast({
          title: "No Recipients",
          description: "Please specify recipients",
          variant: "destructive"
        });
        return;
      }

      // Send emails
      const emailPromises = recipients.map(email => 
        supabase.functions.invoke('send-admin-email', {
          body: {
            to: email,
            subject: emailForm.subject,
            content: emailForm.content,
            fromEmail: 'admin@aynn.io'
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(result => result.status === 'fulfilled').length;

      toast({
        title: "Emails Sent",
        description: `Successfully sent ${successful} emails`,
      });

      setShowComposeDialog(false);
      setEmailForm({ to: '', subject: '', content: '', type: 'single' });
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

  const createUser = async () => {
    if (!newUser.email.includes('@aynn.io')) {
      toast({
        title: "Invalid Email",
        description: "Email must be from @aynn.io domain",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.temporaryPassword,
        user_metadata: {
          company_name: newUser.companyName,
          full_name: newUser.contactPerson
        },
        email_confirm: true
      });

      if (error) throw error;

      toast({
        title: "User Created",
        description: `Successfully created user ${newUser.email}`,
      });

      setShowCreateUserDialog(false);
      setNewUser({ email: '', companyName: '', contactPerson: '', temporaryPassword: '' });
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const exportUserEmails = () => {
    const emailList = users.map(u => u.email).filter(Boolean).join('\n');
    const blob = new Blob([emailList], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const downloadElement = document.createElement('a');
    downloadElement.href = url;
    downloadElement.download = `ayn-user-emails-${new Date().toISOString().split('T')[0]}.txt`;
    downloadElement.click();
    downloadElement.remove();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "User emails exported successfully"
    });
  };

  const handleDeleteSelectedEmails = async () => {
    if (selectedEmails.size === 0) return;

    try {
      const { error } = await supabase
        .from('admin_emails')
        .delete()
        .in('id', Array.from(selectedEmails));

      if (error) {
        console.error('Error deleting emails:', error);
        toast({
          title: "Error",
          description: "Failed to delete selected emails.",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setEmails(prev => prev.filter(email => !selectedEmails.has(email.id)));
      setSelectedEmails(new Set());
      setShowEmailSelection(false);

      toast({
        title: "Emails Deleted",
        description: `Successfully deleted ${selectedEmails.size} email(s).`,
      });
    } catch (error) {
      console.error('Error deleting emails:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected emails.",
        variant: "destructive"
      });
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const selectAllEmails = () => {
    if (selectedEmails.size === emails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(emails.map(email => email.id)));
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
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
          <p className="text-muted-foreground">Simple email management and user creation</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateUserDialog(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
          <Button onClick={() => setShowComposeDialog(true)}>
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div>
      </div>

      <Tabs defaultValue="emails" className="space-y-4">
        <TabsList>
          <TabsTrigger value="emails">Recent Emails</TabsTrigger>
          <TabsTrigger value="users">User Emails</TabsTrigger>
        </TabsList>

        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Emails ({emails.length})</CardTitle>
                  <CardDescription>Latest sent emails</CardDescription>
                </div>
                {emails.length > 0 && (
                  <div className="flex items-center gap-2">
                    {!showEmailSelection ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEmailSelection(true)}
                      >
                        Select Emails
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllEmails}
                        >
                          {selectedEmails.size === emails.length ? 'Select None' : 'Select All'}
                        </Button>
                        {selectedEmails.size > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSelectedEmails}
                          >
                            Delete ({selectedEmails.size})
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowEmailSelection(false);
                            setSelectedEmails(new Set());
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {emails.map((email) => (
                    <div key={email.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          {showEmailSelection && (
                            <Checkbox
                              checked={selectedEmails.has(email.id)}
                              onCheckedChange={() => toggleEmailSelection(email.id)}
                            />
                          )}
                          <span className="font-medium flex-1">{email.subject}</span>
                        </div>
                        <Badge variant={email.status === 'sent' ? 'default' : 'secondary'}>
                          {email.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        To: {email.recipient_email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(email.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {emails.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No emails sent yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Emails ({users.length})</CardTitle>
                  <CardDescription>All registered user emails for marketing</CardDescription>
                </div>
                <Button onClick={exportUserEmails} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.company_name || 'No company'} • {user.contact_person || 'No contact'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No users registered yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compose Email Dialog */}
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send emails to individual users or all users at once
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={emailForm.type === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEmailForm(prev => ({ ...prev, type: 'single' }))}
                >
                  Single Email
                </Button>
                <Button
                  variant={emailForm.type === 'bulk' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEmailForm(prev => ({ ...prev, type: 'bulk' }))}
                >
                  Bulk Email ({users.length} users)
                </Button>
              </div>
            </div>

            {emailForm.type === 'single' && (
              <div>
                <Label>To</Label>
                <Input
                  type="email"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="recipient@example.com"
                />
              </div>
            )}

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
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={sendEmail}>
                <Send className="w-4 h-4 mr-2" />
                Send Email{emailForm.type === 'bulk' ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create @aynn.io User</DialogTitle>
            <DialogDescription>
              Create a new user account with @aynn.io email domain
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email (must be @aynn.io)</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@aynn.io"
              />
            </div>

            <div>
              <Label>Temporary Password</Label>
              <Input
                type="password"
                value={newUser.temporaryPassword}
                onChange={(e) => setNewUser(prev => ({ ...prev, temporaryPassword: e.target.value }))}
                placeholder="Temporary password"
              />
            </div>

            <div>
              <Label>Company Name</Label>
              <Input
                value={newUser.companyName}
                onChange={(e) => setNewUser(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Company name"
              />
            </div>

            <div>
              <Label>Contact Person</Label>
              <Input
                value={newUser.contactPerson}
                onChange={(e) => setNewUser(prev => ({ ...prev, contactPerson: e.target.value }))}
                placeholder="Contact person name"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createUser}>
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};