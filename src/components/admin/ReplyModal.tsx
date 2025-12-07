import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Application {
  id: string;
  full_name: string;
  email: string;
  service_type: string;
}

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onReplySent?: () => void;
}

const SERVICE_NAMES: Record<string, string> = {
  content_creator: 'Premium Content Creator Website',
  ai_agents: 'Custom AI Agent',
  automation: 'Process Automation'
};

export const ReplyModal = ({ isOpen, onClose, application, onReplySent }: ReplyModalProps) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!application || !subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-reply', {
        body: {
          applicationId: application.id,
          recipientEmail: application.email,
          recipientName: application.full_name,
          subject: subject.trim(),
          message: message.trim()
        }
      });

      if (error) throw error;

      toast.success('Reply sent successfully');
      setSubject('');
      setMessage('');
      onReplySent?.();
      onClose();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  // Reset form when modal opens with new application
  const handleClose = () => {
    setSubject('');
    setMessage('');
    onClose();
  };

  // Set default subject when application changes
  if (application && !subject) {
    const serviceName = SERVICE_NAMES[application.service_type] || application.service_type;
    setSubject(`Re: Your ${serviceName} Application`);
  }

  return (
    <AnimatePresence>
      {isOpen && application && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold">Reply to {application.full_name}</h2>
                <p className="text-sm text-muted-foreground">{application.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your reply..."
                  rows={8}
                  className="rounded-xl resize-none"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Your reply will be sent with the AYN branded email template.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
              <Button
                variant="outline"
                onClick={handleClose}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending || !subject.trim() || !message.trim()}
                className="rounded-xl gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
