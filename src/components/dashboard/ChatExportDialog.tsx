import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Loader2, Download, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface ChatSession {
  sessionId: string;
  title: string;
  messageCount: number;
  lastActivity: Date;
}

interface ChatExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const ChatExportDialog = ({
  isOpen,
  onClose,
  user
}: ChatExportDialogProps) => {
  const [exportFormat, setExportFormat] = useState<'txt' | 'json'>('txt');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadChatSessions();
    }
  }, [isOpen]);

  const loadChatSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('session_id, content, sender, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by session
      const sessionGroups: { [key: string]: any[] } = {};
      data?.forEach(msg => {
        if (!sessionGroups[msg.session_id]) {
          sessionGroups[msg.session_id] = [];
        }
        sessionGroups[msg.session_id].push(msg);
      });

      const sessions: ChatSession[] = Object.entries(sessionGroups).map(([sessionId, messages]) => {
        const firstUserMessage = messages.find(msg => msg.sender === 'user');
        return {
          sessionId,
          title: firstUserMessage ? 
            (firstUserMessage.content.length > 50 ? firstUserMessage.content.substring(0, 50) + '...' : firstUserMessage.content) :
            'Chat Session',
          messageCount: messages.length,
          lastActivity: new Date(Math.max(...messages.map(msg => new Date(msg.created_at).getTime())))
        };
      }).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

      setChatSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: 'Error loading chats',
        description: 'Failed to load chat sessions.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (selectedSessions.size === 0) {
      toast({
        title: 'No chats selected',
        description: 'Please select at least one chat session.',
        variant: 'destructive'
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simulate progress for better UX
      setExportProgress(20);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .in('session_id', Array.from(selectedSessions))
        .order('created_at', { ascending: true });

      setExportProgress(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: 'No messages found',
          description: 'No messages found for the selected sessions.',
          variant: 'destructive'
        });
        setExportProgress(0);
        return;
      }

      setExportProgress(70);

      let content: string;
      let filename: string;

      if (exportFormat === 'txt') {
        content = data?.map(msg => 
          `[${new Date(msg.created_at).toLocaleString()}] ${msg.sender === 'user' ? 'You' : 'AYN'}: ${msg.content}`
        ).join('\n\n') || '';
        filename = `ayn-chats-export-${new Date().toISOString().split('T')[0]}.txt`;
      } else {
        content = JSON.stringify(data, null, 2);
        filename = `ayn-chats-export-${new Date().toISOString().split('T')[0]}.json`;
      }

      setExportProgress(90);

      const blob = new Blob([content], { type: exportFormat === 'txt' ? 'text/plain' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);

      toast({
        title: 'Export successful',
        description: `Exported ${selectedSessions.size} chat session(s)`,
      });

      setTimeout(() => {
        onClose();
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export chat messages.',
        variant: 'destructive'
      });
      setExportProgress(0);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Chat Sessions
          </DialogTitle>
          <DialogDescription>
            Select chat sessions to export.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as 'txt' | 'json')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="txt" id="txt" />
              <Label htmlFor="txt">Text (.txt)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json">JSON (.json)</Label>
            </div>
          </RadioGroup>

          <ScrollArea className="h-[300px] border rounded-md p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chatSessions.map((session) => (
                  <div key={session.sessionId} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedSessions.has(session.sessionId)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedSessions);
                        if (checked) {
                          newSelected.add(session.sessionId);
                        } else {
                          newSelected.delete(session.sessionId);
                        }
                        setSelectedSessions(newSelected);
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{session.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {session.messageCount} messages • {session.lastActivity.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {isExporting && exportProgress > 0 && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span>Exporting...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>Cancel</Button>
            <Button onClick={handleExport} disabled={isExporting || selectedSessions.size === 0}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export ({selectedSessions.size})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};