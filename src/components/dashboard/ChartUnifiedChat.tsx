import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUp, Upload, X, Loader2, BarChart3, Brain, Plus, Clock, Sparkles,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MessageFormatter } from '@/components/shared/MessageFormatter';
import type { ChartAnalysisResult } from '@/types/chartAnalyzer.types';
import { useChartCoach } from '@/hooks/useChartCoach';
import { supabase } from '@/integrations/supabase/client';

type CoachAPI = ReturnType<typeof useChartCoach>;

type ChatMessage =
  | { type: 'user-text'; content: string }
  | { type: 'user-image'; imageUrl: string; content?: string }
  | { type: 'ayn-text'; content: string }
  | { type: 'ayn-error'; content: string };

const QUICK_CHIPS = [
  'Analyze this chart for me',
  'What patterns do you see?',
  'Best entry strategies',
  'Risk management rules',
];

const UserTextBubble = memo(({ content }: { content: string }) => (
  <div className="flex justify-end">
    <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-primary/10 text-foreground">
      <p className="text-sm whitespace-pre-wrap">{content}</p>
    </div>
  </div>
));
UserTextBubble.displayName = 'UserTextBubble';

const UserImageBubble = memo(({ imageUrl, content }: { imageUrl: string; content?: string }) => (
  <div className="flex justify-end">
    <div className="max-w-[80%] space-y-2">
      {content && (
        <div className="rounded-2xl px-4 py-2.5 bg-primary/10 text-foreground ml-auto">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      )}
      <img src={imageUrl} alt="Uploaded chart" className="rounded-xl border border-border max-h-64 object-contain ml-auto" />
    </div>
  </div>
));
UserImageBubble.displayName = 'UserImageBubble';

const AynTextBubble = memo(({ content }: { content: string }) => (
  <div className="flex justify-start">
    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 bg-muted">
      <MessageFormatter content={content} className="prose prose-sm dark:prose-invert max-w-prose" />
    </div>
  </div>
));
AynTextBubble.displayName = 'AynTextBubble';

interface ChartUnifiedChatProps {
  messages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  latestResult?: ChartAnalysisResult | null;
  onLatestResultChange?: (result: ChartAnalysisResult | null) => void;
  coach: CoachAPI;
  onToggleSidebar?: () => void;
}

export default function ChartUnifiedChat({
  messages: externalMessages,
  onMessagesChange,
  coach,
  onToggleSidebar,
}: ChartUnifiedChatProps) {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const messages = externalMessages ?? localMessages;
  const setMessages = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    const next = typeof updater === 'function' ? updater(externalMessages ?? localMessages) : updater;
    if (onMessagesChange) onMessagesChange(next);
    else setLocalMessages(next);
  }, [externalMessages, localMessages, onMessagesChange]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  const isBusy = isLoading || coach.isLoading;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages.length, scrollToBottom]);

  // Sync coach session switches
  const prevCoachLenRef = useRef(coach.messages.length);
  const prevSessionIdRef = useRef<string | null>(coach.activeSessionId);

  useEffect(() => {
    if (coach.activeSessionId !== prevSessionIdRef.current) {
      prevSessionIdRef.current = coach.activeSessionId;
      if (coach.messages.length > 0) {
        const converted: ChatMessage[] = coach.messages.map(m =>
          m.role === 'user'
            ? { type: 'user-text' as const, content: m.content }
            : { type: 'ayn-text' as const, content: m.content }
        );
        setMessages(converted);
      } else {
        setMessages([]);
      }
      prevCoachLenRef.current = coach.messages.length;
    }
  }, [coach.activeSessionId]);

  useEffect(() => {
    if (messages.length === 0) coach.newChat();
    prevCoachLenRef.current = coach.messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Append new coach messages (text-only flow)
  useEffect(() => {
    if (coach.messages.length > prevCoachLenRef.current) {
      const newMsgs = coach.messages.slice(prevCoachLenRef.current);
      const assistantOnly = newMsgs
        .filter(m => m.role === 'assistant')
        .map(m => ({ type: 'ayn-text' as const, content: m.content }));
      if (assistantOnly.length > 0) setMessages(prev => [...prev, ...assistantOnly]);
    }
    prevCoachLenRef.current = coach.messages.length;
  }, [coach.messages.length]);

  // File attach
  const attachFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setAttachedFile(file);
    setAttachedPreview(URL.createObjectURL(file));
  }, []);

  const clearAttachment = useCallback(() => {
    if (attachedPreview) URL.revokeObjectURL(attachedPreview);
    setAttachedFile(null);
    setAttachedPreview(null);
  }, [attachedPreview]);

  // Drag & Drop
  const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); dragCounter.current++; setIsDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragOver(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); dragCounter.current = 0; setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) attachFile(file);
  }, [attachFile]);

  // ─── Send ───
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !attachedFile) return;
    if (isBusy) return;

    const file = attachedFile;
    const msgText = text || undefined;
    const previewUrl = attachedPreview;

    // Show user message immediately
    if (file && previewUrl) {
      // Store base64 version for persistent display
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setMessages(prev => [...prev, { type: 'user-image', imageUrl: reader.result as string, content: msgText }]);
      };
    } else {
      setMessages(prev => [...prev, { type: 'user-text', content: text }]);
    }

    clearAttachment();
    setInput('');

    if (file) {
      setIsLoading(true);
      try {
        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Try to upload to Supabase storage for a stable URL
        let imageUrl = base64;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            const { data: uploadData } = await supabase.storage
              .from('generated-files')
              .upload(
                `${session.user.id}/charts/${Date.now()}_${file.name}`,
                await file.arrayBuffer(),
                { contentType: file.type, upsert: false }
              );
            if (uploadData) {
              const { data: urlData } = supabase.storage
                .from('generated-files')
                .getPublicUrl(uploadData.path);
              if (urlData?.publicUrl) imageUrl = urlData.publicUrl;
            }
          }
        } catch {
          // fallback: use base64 directly
        }

        const userPrompt = msgText || 'Please analyze this trading chart. Identify patterns, trend, support/resistance levels, and give me a clear BUY, SELL, or WAIT signal with reasoning.';

        const { data, error } = await supabase.functions.invoke('ayn-unified', {
          body: {
            messages: [{ role: 'user', content: userPrompt }],
            intent: 'trading-coach',
            context: {
              fileContext: { type: file.type || 'image/jpeg', url: imageUrl, name: file.name },
              searchQuery: null,
              scrapeUrl: null,
            },
            stream: false,
          },
        });

        if (error) throw error;
        const reply = data?.content || 'Sorry, I could not analyze that image.';
        setMessages(prev => [...prev, { type: 'ayn-text', content: reply }]);
      } catch (err) {
        console.error('[ChartChat] Image analysis error:', err);
        setMessages(prev => [...prev, { type: 'ayn-error', content: 'Failed to analyze the image. Please try again.' }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Text-only: use coach
      coach.sendMessage(text);
    }
  }, [input, attachedFile, attachedPreview, isBusy, coach, clearAttachment]);

  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleChip = useCallback((text: string) => {
    setMessages(prev => [...prev, { type: 'user-text', content: text }]);
    coach.sendMessage(text);
  }, [coach]);

  const hasMessages = messages.length > 0;

  return (
    <div
      className="flex flex-col h-[calc(100vh-100px)] relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl border-2 border-dashed border-amber-500"
          >
            <div className="text-center">
              <Upload className="h-10 w-10 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold">Drop your chart here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex items-center gap-2 px-1 py-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold">AYN Chart Analyzer</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Drop a chart or ask anything</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Upload a trading chart and I'll analyze it instantly, or ask any trading question
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleChip(chip)}
                  className="text-xs px-3 py-1.5 rounded-full border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((msg, i) => {
              switch (msg.type) {
                case 'user-text': return <UserTextBubble key={i} content={msg.content} />;
                case 'user-image': return <UserImageBubble key={i} imageUrl={msg.imageUrl} content={msg.content} />;
                case 'ayn-text': return <AynTextBubble key={i} content={msg.content} />;
                case 'ayn-error':
                  return (
                    <div key={i} className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-destructive/10 text-destructive text-sm">
                        {msg.content}
                      </div>
                    </div>
                  );
                default: return null;
              }
            })}
            {isBusy && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2.5 bg-muted">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
                    <span>AYN is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-1 pb-2 pt-2">
        <div className={cn(
          'relative rounded-2xl overflow-hidden',
          'bg-background/95 backdrop-blur-xl',
          'border border-border/50 shadow-lg',
          'transition-all duration-200 focus-within:border-amber-500/40'
        )}>
          {/* Image preview chip */}
          <AnimatePresence>
            {attachedPreview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="px-4 pt-3"
              >
                <div className="relative inline-block">
                  <img src={attachedPreview} alt="Attached chart" className="h-20 rounded-lg border border-border object-contain" />
                  <button
                    onClick={clearAttachment}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea row */}
          <div className="flex items-end gap-2 px-4 pt-3 pb-2">
            <div className="flex-1 min-w-0">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={attachedFile ? 'Add a note with your chart (optional)...' : 'Ask about trading or upload a chart...'}
                disabled={isBusy}
                unstyled
                className="resize-none min-h-[44px] max-h-[120px] w-full text-sm bg-transparent placeholder:text-muted-foreground/50 leading-relaxed overflow-y-auto"
                rows={1}
              />
            </div>
            <AnimatePresence mode="wait">
              {isBusy ? (
                <motion.div key="loading" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                  className="shrink-0 mb-1 w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                </motion.div>
              ) : (input.trim() || attachedFile) ? (
                <motion.button key="send" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }} onClick={handleSend}
                  className="shrink-0 mb-1 w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 hover:scale-105 active:scale-95 shadow-md transition-all">
                  <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Toolbar */}
          <div className="grid grid-cols-3 items-center px-2 py-1.5 border-t border-border/30 bg-muted/10">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => { coach.newChat(); setMessages([]); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
              >
                <Plus className="w-3.5 h-3.5" />New
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all disabled:opacity-40"
                title="Upload chart"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-center">
              {coach.sessions.length > 0 && (
                <button
                  onClick={onToggleSidebar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/80 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground active:scale-95 transition-all"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">History</span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{coach.sessions.length}</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-end gap-1.5 text-muted-foreground px-1">
              <Brain className="w-4 h-4 text-foreground" />
              <span className="text-xs font-medium hidden sm:inline">AYN</span>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) attachFile(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
