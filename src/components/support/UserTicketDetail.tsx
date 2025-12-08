import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, CheckCircle, Brain, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { MessageFormatter } from '@/components/MessageFormatter';

interface UserTicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

interface TicketMessage {
  id: string;
  message: string;
  sender_type: 'user' | 'admin' | 'ai_bot';
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'waiting_reply' | 'resolved' | 'closed';
  priority: string;
  category: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  in_progress: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  waiting_reply: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
  resolved: 'bg-green-500/20 text-green-600 dark:text-green-400',
  closed: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_reply: 'Awaiting Reply',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function UserTicketDetail({ ticketId, onBack }: UserTicketDetailProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTicketData();
  }, [ticketId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchTicketData = async () => {
    try {
      const [ticketRes, messagesRes] = await Promise.all([
        supabase
          .from('support_tickets')
          .select('*')
          .eq('id', ticketId)
          .maybeSingle(),
        supabase
          .from('ticket_messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .eq('is_internal_note', false)
          .order('created_at', { ascending: true }),
      ]);

      if (ticketRes.error) throw ticketRes.error;
      if (messagesRes.error) throw messagesRes.error;

      setTicket(ticketRes.data);
      setMessages(messagesRes.data || []);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          message: newMessage.trim(),
          sender_type: 'user',
          sender_id: user.id,
        });

      if (error) throw error;

      // Update ticket status to open if it was waiting_reply
      if (ticket.status === 'waiting_reply') {
        await supabase
          .from('support_tickets')
          .update({ status: 'open' })
          .eq('id', ticketId);
      }

      setNewMessage('');
      fetchTicketData();
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!ticket) return;

    setClosing(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Ticket closed');
      fetchTicketData();
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast.error('Failed to close ticket');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Badge variant="secondary" className={`text-xs ${statusColors[ticket.status]}`}>
            {statusLabels[ticket.status]}
          </Badge>
        </div>
        <h3 className="font-medium text-sm line-clamp-2">{ticket.subject}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Opened {format(new Date(ticket.created_at), 'MMM d, yyyy • h:mm a')}
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.sender_type === 'user';
            const isAI = msg.sender_type === 'ai_bot';
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isUser 
                      ? 'bg-primary text-primary-foreground' 
                      : isAI 
                        ? 'bg-purple-500/20 text-purple-500' 
                        : 'bg-muted'
                  }`}>
                    {isUser ? (
                      <User className="w-4 h-4" />
                    ) : isAI ? (
                      <Brain className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">A</span>
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    isUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 border border-border/50'
                  }`}>
                    <div className="text-sm">
                      <MessageFormatter content={msg.message} />
                    </div>
                    <p className={`text-[10px] mt-1.5 ${
                      isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border/50 space-y-3">
        {!isClosed ? (
          <>
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your reply..."
                className="min-h-[60px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="flex-1 gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Reply'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCloseTicket}
                disabled={closing}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {closing ? 'Closing...' : 'Close Ticket'}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              This ticket has been {ticket.status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
