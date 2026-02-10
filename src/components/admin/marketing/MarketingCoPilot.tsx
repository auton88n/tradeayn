import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, Globe, Loader2, Calendar, Hash } from 'lucide-react';
import { AynEyeIcon } from './AynEyeIcon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BrandKitState } from './CompactBrandBar';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
  type?: string;
  plan?: PlanItem[];
  thread?: ThreadItem[];
}

interface PlanItem {
  day?: string;
  content?: string;
  content_type?: string;
  target_audience?: string;
  time?: string;
}

interface ThreadItem {
  content?: string;
  order?: number;
}

interface MarketingCoPilotProps {
  brandKit?: BrandKitState | null;
  activeView?: string;
  onBrandKitUpdate?: (colors: { name: string; hex: string }[]) => void;
  onCampaignGenerated?: (plan: unknown[]) => void;
  onThreadGenerated?: (thread: unknown[]) => void;
}

const QUICK_ACTIONS = [
  { label: 'Plan my week', icon: Calendar, emoji: '📅' },
  { label: 'Create a thread', icon: Hash, emoji: '🧵' },
  { label: 'Generate a tweet', icon: Sparkles, emoji: '✍️' },
  { label: 'Scan a brand', icon: Globe, emoji: '🔍' },
];

// Inline campaign plan card
const CampaignPlanCard = ({ plan }: { plan: PlanItem[] }) => (
  <div className="mt-2 rounded-lg border border-border/30 bg-background/50 overflow-hidden">
    <div className="px-2.5 py-1.5 bg-muted/30 border-b border-border/20 flex items-center gap-1.5">
      <Calendar className="w-3 h-3 text-primary" />
      <span className="text-[10px] font-semibold">7-Day Plan</span>
      <Badge variant="secondary" className="text-[8px] h-3 px-1 ml-auto">{plan.length} tweets</Badge>
    </div>
    <div className="divide-y divide-border/10 max-h-[200px] overflow-y-auto">
      {plan.map((item, i) => (
        <div key={i} className="px-2.5 py-1.5 flex items-start gap-2">
          <span className="text-[9px] font-mono text-primary shrink-0 mt-0.5">{item.day || `D${i + 1}`}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] leading-snug line-clamp-2">{item.content || 'Pending'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {item.content_type && <Badge variant="secondary" className="text-[7px] h-3 px-1">{item.content_type}</Badge>}
              {item.time && <span className="text-[8px] text-muted-foreground">{item.time}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Inline thread preview card
const ThreadPreviewCard = ({ thread }: { thread: ThreadItem[] }) => (
  <div className="mt-2 rounded-lg border border-border/30 bg-background/50 overflow-hidden">
    <div className="px-2.5 py-1.5 bg-muted/30 border-b border-border/20 flex items-center gap-1.5">
      <Hash className="w-3 h-3 text-primary" />
      <span className="text-[10px] font-semibold">Thread Preview</span>
      <Badge variant="secondary" className="text-[8px] h-3 px-1 ml-auto">{thread.length} tweets</Badge>
    </div>
    <div className="p-2 space-y-1">
      {thread.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <span className="text-[7px] font-bold text-primary">{i + 1}</span>
            </div>
            {i < thread.length - 1 && <div className="w-0.5 h-3 bg-primary/20 mt-0.5" />}
          </div>
          <p className="text-[10px] leading-snug flex-1 min-w-0">{item.content || 'Pending'}</p>
        </div>
      ))}
    </div>
  </div>
);

export const MarketingCoPilot = ({ brandKit, activeView, onBrandKitUpdate, onCampaignGenerated, onThreadGenerated }: MarketingCoPilotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "what's the play today? i've got your recent performance data loaded. want to plan the week, build a thread, or create something specific?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleBrandScan = useCallback(async (url: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('twitter-brand-scan', { body: { url } });
      if (error) throw error;
      if (data?.brand_dna?.colors && onBrandKitUpdate) {
        const mapped = data.brand_dna.colors.slice(0, 5).map((c: { name?: string; hex?: string; role?: string }, i: number) => ({
          name: c.name || c.role || `Color ${i + 1}`,
          hex: c.hex || '#000000',
        }));
        onBrandKitUpdate(mapped);
        toast.success('Brand Kit updated from scan');
      }
      return data.brand_dna;
    } catch { toast.error('Failed to scan website'); return null; }
  }, [onBrandKitUpdate]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setShowUrlInput(false);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('twitter-creative-chat', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          brand_kit: brandKit || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); setIsLoading(false); return; }

      // Handle scan URL
      if (data.type === 'scan_url' && data.scan_url) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        const brandDNA = await handleBrandScan(data.scan_url);
        if (brandDNA) {
          const followUp: ChatMessage = { role: 'user', content: `[BRAND_DNA_RESULT] ${JSON.stringify(brandDNA)}. Suggest visuals based on this.` };
          const updatedMsgs = [...newMessages, { role: 'assistant' as const, content: data.message }, followUp];
          setMessages(prev => [...prev, followUp]);
          const { data: followData } = await supabase.functions.invoke('twitter-creative-chat', {
            body: { messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })), brand_kit: brandKit || undefined },
          });
          if (followData) setMessages(prev => [...prev, { role: 'assistant', content: followData.message || 'got the DNA. what should we build?', image_url: followData.image_url }]);
        }
        setIsLoading(false);
        return;
      }

      // Handle campaign plan
      if (data.type === 'campaign_plan' && data.plan) {
        onCampaignGenerated?.(data.plan);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || `here's your 7-day plan. ${data.plan.length} tweets ready to review.`,
          type: 'campaign_plan',
          plan: data.plan,
        }]);
        setIsLoading(false);
        return;
      }

      // Handle thread
      if (data.type === 'thread' && data.thread) {
        onThreadGenerated?.(data.thread);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || `thread ready. ${data.thread.length} tweets structured.`,
          type: 'thread',
          thread: data.thread,
        }]);
        setIsLoading(false);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message || 'hmm, something went off. try again?', image_url: data.image_url }]);
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Failed to get response');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [messages, isLoading, brandKit, handleBrandScan, onCampaignGenerated, onThreadGenerated]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center shadow-sm">
            <AynEyeIcon size={15} className="text-background" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight">AYN Co-Pilot</h3>
            <p className="text-[10px] text-muted-foreground">Strategy · Creative · Analytics</p>
          </div>
          <div className="ml-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Online" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed break-words ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted/40 text-foreground rounded-bl-md border border-border/20'
              }`}>
                <span className="whitespace-pre-wrap">{msg.content}</span>
                {msg.image_url && (
                  <div className="mt-2 text-[11px] opacity-70 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> image generated ✓
                  </div>
                )}
                {/* Structured campaign plan inline */}
                {msg.type === 'campaign_plan' && msg.plan && <CampaignPlanCard plan={msg.plan} />}
                {/* Structured thread inline */}
                {msg.type === 'thread' && msg.thread && <ThreadPreviewCard thread={msg.thread} />}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted/40 rounded-2xl rounded-bl-md px-3.5 py-2.5 border border-border/20 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span className="text-[11px] text-muted-foreground">ayn is strategizing...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="shrink-0 px-3 py-2 border-t border-border/50">
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_ACTIONS.map(({ label, icon: Icon, emoji }) => (
            <button
              key={label}
              onClick={() => label === 'Scan a brand' ? setShowUrlInput(true) : sendMessage(label.toLowerCase())}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-2 rounded-lg bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 text-left"
            >
              <span className="text-sm">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* URL input */}
      {showUrlInput && (
        <div className="shrink-0 px-3 py-2 border-t border-border/50">
          <div className="flex gap-1.5">
            <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && urlInput.trim() && (sendMessage(`scan ${urlInput.trim()} and analyze their brand`), setUrlInput(''), setShowUrlInput(false))} placeholder="https://..." className="text-xs h-8" autoFocus />
            <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { if (urlInput.trim()) { sendMessage(`scan ${urlInput.trim()} and analyze their brand`); setUrlInput(''); setShowUrlInput(false); } }}>
              <Globe className="w-3 h-3" /> Scan
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-border/50">
        <div className="flex gap-1.5">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            placeholder="Ask AYN anything..."
            disabled={isLoading}
            className="text-xs h-9"
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
