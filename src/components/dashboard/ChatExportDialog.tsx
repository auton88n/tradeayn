import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
}

interface ChatExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  sessionId: string;
}

export const ChatExportDialog = ({
  isOpen,
  onClose,
  messages,
  sessionId
}: ChatExportDialogProps) => {
  const [exportFormat, setExportFormat] = useState('txt');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (messages.length === 0) {
      toast({
        title: 'No messages to export',
        description: 'Start a conversation first to export messages.',
        variant: 'destructive'
      });
      return;
    }

    setIsExporting(true);
    
    try {
      let content = '';
      let mimeType = '';
      let fileExtension = '';

      if (exportFormat === 'txt') {
        content = messages.map(msg => 
          `${msg.sender.toUpperCase()} [${msg.timestamp.toLocaleString()}]: ${msg.content}`
        ).join('\n\n');
        mimeType = 'text/plain';
        fileExtension = 'txt';
      } else if (exportFormat === 'json') {
        content = JSON.stringify(messages, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${sessionId.slice(0, 8)}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `Chat exported as ${fileExtension.toUpperCase()} file`,
      });
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your chat.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Chat
          </DialogTitle>
          <DialogDescription>
            Export your chat conversation in your preferred format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Label className="text-sm font-medium">Export Format</Label>
          <RadioGroup
            value={exportFormat}
            onValueChange={setExportFormat}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="txt" id="txt" />
              <Label htmlFor="txt" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Text File (.txt)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                JSON File (.json)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};