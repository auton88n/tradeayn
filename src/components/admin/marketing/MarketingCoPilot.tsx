import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, Globe, Loader2 } from 'lucide-react';
import { AynEyeIcon } from './AynEyeIcon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BrandKitState } from './CompactBrandBar';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
  type?: string;
  plan?: unknown[];
  thread?: unknown[];
}

interface MarketingCoPilotProps {
  brandKit?: BrandKitState | null;
  activeView?: string;
  onBrandKitUpdate?: (colors: { name: string; hex: string }[]) => void;
  onCampaignGenerated?: (plan: unknown[]) => void;
  onThreadGenerated?: (thread: unknown[]) => void;
}

const QUICK_ACTIONS = [
  { label: 'Plan my week', icon: '📅' },
  { label: 'Create a thread', icon: '🧵' },
  { label: 'Generate a tweet', icon: '✍️' },
  { label: 'Scan a brand', icon: '🔍' },
];

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
        setMessages(prev => [...prev, { role: 'assistant', content: data.message || `here's your 7-day plan. ${data.plan.length} tweets ready to review.`, type: 'campaign_plan', plan: data.plan }]);
        setIsLoading(false);
        return;
      }

      // Handle thread
      if (data.type === 'thread' && data.thread) {
        onThreadGenerated?.(data.thread);
        setMessages(prev => [...prev, { role: 'assistant', content: data.message || `thread ready. ${data.thread.length} tweets structured.`, type: 'thread', thread: data.thread }]);
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
      <div className="shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-foreground flex items-center justify-center">
            <AynEyeIcon size={14} className="text-background" />
          </div>
          <div>
            <h3 className="text-xs font-bold">AYN Co-Pilot</h3>
            <p className="text-[10px] text-muted-foreground">Strategy · Creative · Analytics</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3 space-y-2.5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed break-words ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted/50 text-foreground rounded-bl-sm border border-border/30'
              }`}>
                <span className="whitespace-pre-wrap">{msg.content}</span>
                {msg.image_url && (
                  <div className="mt-1.5 text-[10px] opacity-70 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> image generated ✓
                  </div>
                )}
                {msg.type === 'campaign_plan' && (
                  <div className="mt-1.5 text-[10px] opacity-70">📅 campaign plan generated — check Pipeline view</div>
                )}
                {msg.type === 'thread' && (
                  <div className="mt-1.5 text-[10px] opacity-70">🧵 thread ready — check Pipeline view</div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-3 py-2 border border-border/30 flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-[10px] text-muted-foreground">thinking</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="shrink-0 px-3 py-2 border-t border-border">
        <div className="flex flex-wrap gap-1">
          {QUICK_ACTIONS.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => label === 'Scan a brand' ? setShowUrlInput(true) : sendMessage(label.toLowerCase())}
              disabled={isLoading}
              className="text-[10px] px-2 py-1 rounded-full bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* URL input */}
      {showUrlInput && (
        <div className="shrink-0 px-3 py-2 border-t border-border">
          <div className="flex gap-1.5">
            <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && urlInput.trim() && (sendMessage(`scan ${urlInput.trim()} and analyze their brand`), setUrlInput(''), setShowUrlInput(false))} placeholder="https://..." className="text-xs h-7" autoFocus />
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { if (urlInput.trim()) { sendMessage(`scan ${urlInput.trim()} and analyze their brand`); setUrlInput(''); setShowUrlInput(false); } }}>
              <Globe className="w-3 h-3" /> Scan
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-border">
        <div className="flex gap-1.5">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            placeholder="Ask AYN anything..."
            disabled={isLoading}
            className="text-xs h-8"
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
