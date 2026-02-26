import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Upload, X, Loader2, Brain, Plus, Clock, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MessageFormatter } from '@/components/shared/MessageFormatter';
import { useChartCoach } from '@/hooks/useChartCoach';
import { supabase } from '@/integrations/supabase/client';

type CoachAPI = ReturnType<typeof useChartCoach>;

type Msg =
  | { type: 'user-text'; content: string }
  | { type: 'user-image'; imageUrl: string; content?: string }
  | { type: 'ai'; content: string }
  | { type: 'error'; content: string };

const CHIPS = ['Analyze this chart', 'Best entry strategies', 'Risk management rules', 'Explain position sizing'];

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
      <img src={imageUrl} alt="chart" className="rounded-xl border border-border max-h-64 object-contain ml-auto block" />
    </div>
  </div>
));
UserImageBubble.displayName = 'UserImageBubble';

const AIBubble = memo(({ content }: { content: string }) => (
  <div className="flex justify-start">
    <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-muted">
      <MessageFormatter content={content} className="prose prose-sm dark:prose-invert max-w-prose" />
    </div>
  </div>
));
AIBubble.displayName = 'AIBubble';

interface Props {
  coach: CoachAPI;
  onToggleSidebar?: () => void;
}

export default function ChartUnifiedChat({ coach, onToggleSidebar }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDrag, setIsDrag] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dragCount = useRef(0);

  // Track which coach messages we've already rendered
  const lastCoachLen = useRef(0);
  const lastSessionId = useRef<string | null>(null);

  const isBusy = imageLoading || coach.isLoading;

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length, isBusy]);

  // When coach session changes (sidebar switch) — reload msgs from coach history
  useEffect(() => {
    if (coach.activeSessionId !== lastSessionId.current) {
      lastSessionId.current = coach.activeSessionId;
      lastCoachLen.current = coach.messages.length;
      // Rebuild messages from coach history
      const rebuilt: Msg[] = coach.messages.map(m =>
        m.role === 'user'
          ? { type: 'user-text' as const, content: m.content }
          : { type: 'ai' as const, content: m.content }
      );
      setMsgs(rebuilt);
    }
  }, [coach.activeSessionId, coach.messages]);

  // When coach gets a new assistant reply (text-only flow) — append it
  useEffect(() => {
    if (coach.messages.length > lastCoachLen.current) {
      const newOnes = coach.messages.slice(lastCoachLen.current);
      lastCoachLen.current = coach.messages.length;
      const assistantMsgs = newOnes
        .filter(m => m.role === 'assistant')
        .map(m => ({ type: 'ai' as const, content: m.content }));
      if (assistantMsgs.length > 0) {
        setMsgs(prev => [...prev, ...assistantMsgs]);
      }
    }
  }, [coach.messages]);

  // File attach
  const attachFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }, [preview]);

  const clearFile = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  }, [preview]);

  // Drag
  const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCount.current++; setIsDrag(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); dragCount.current--; if (!dragCount.current) setIsDrag(false); };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); dragCount.current = 0; setIsDrag(false);
    const f = e.dataTransfer.files[0]; if (f) attachFile(f);
  };

  // Send
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !file) return;
    if (isBusy) return;

    const currentFile = file;
    const currentText = text;
    setInput('');
    clearFile();

    if (currentFile) {
      // --- IMAGE FLOW ---
      // 1. Immediately show user bubble with base64 preview
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(currentFile);
      });
      setMsgs(prev => [...prev, { type: 'user-image', imageUrl: base64, content: currentText || undefined }]);
      setImageLoading(true);

      try {
        // 2. Upload to storage
        let imageUrl = base64;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            const buf = await currentFile.arrayBuffer();
            const path = `${session.user.id}/charts/${Date.now()}_${currentFile.name}`;
            const { data: up } = await supabase.storage.from('generated-files').upload(path, buf, { contentType: currentFile.type });
            if (up) {
              const { data: u } = supabase.storage.from('generated-files').getPublicUrl(up.path);
              if (u?.publicUrl) imageUrl = u.publicUrl;
            }
          }
        } catch { /* keep base64 fallback */ }

        // 3. Call ayn-unified with vision
        const prompt = currentText || 'Please analyze this trading chart. Identify the trend, patterns, key support/resistance levels, and give a clear BUY, SELL, or WAIT signal with your reasoning.';
        const { data, error } = await supabase.functions.invoke('ayn-unified', {
          body: {
            messages: [{ role: 'user', content: prompt }],
            intent: 'trading-coach',
            context: { fileContext: { type: currentFile.type, url: imageUrl, name: currentFile.name } },
            stream: false,
          },
        });
        if (error) throw error;
        setMsgs(prev => [...prev, { type: 'ai', content: data?.content || 'Could not analyze the image.' }]);
      } catch {
        setMsgs(prev => [...prev, { type: 'error', content: 'Failed to analyze image. Please try again.' }]);
      } finally {
        setImageLoading(false);
      }

    } else {
      // --- TEXT FLOW ---
      // 1. Immediately show user bubble
      setMsgs(prev => [...prev, { type: 'user-text', content: currentText }]);
      lastCoachLen.current = coach.messages.length; // snapshot before coach adds reply
      // 2. Fire coach (reply will be caught by the useEffect above)
      coach.sendMessage(currentText);
    }
  }, [input, file, isBusy, clearFile, coach]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleChip = (chip: string) => {
    setMsgs(prev => [...prev, { type: 'user-text', content: chip }]);
    lastCoachLen.current = coach.messages.length;
    coach.sendMessage(chip);
  };

  const handleNew = () => {
    coach.newChat();
    setMsgs([]);
    lastCoachLen.current = 0;
    lastSessionId.current = coach.activeSessionId;
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-100px)] relative"
      onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDrag && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl border-2 border-dashed border-amber-500">
            <div className="text-center">
              <Upload className="h-10 w-10 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold">Drop chart here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1">
        {msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Drop a chart or ask anything</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Upload a chart for instant AI analysis, or ask any trading question
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {CHIPS.map(c => (
                <button key={c} onClick={() => handleChip(c)}
                  className="text-xs px-3 py-1.5 rounded-full border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors">
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {msgs.map((m, i) => {
              if (m.type === 'user-text') return <UserTextBubble key={i} content={m.content} />;
              if (m.type === 'user-image') return <UserImageBubble key={i} imageUrl={m.imageUrl} content={m.content} />;
              if (m.type === 'ai') return <AIBubble key={i} content={m.content} />;
              return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-destructive/10 text-destructive text-sm">{m.content}</div>
                </div>
              );
            })}
            {isBusy && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-muted flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
                  AYN is thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-1 pb-2 pt-2">
        <div className={cn(
          'relative rounded-2xl overflow-hidden bg-background/95 backdrop-blur-xl',
          'border border-border/50 shadow-lg transition-all duration-200 focus-within:border-amber-500/40'
        )}>
          {/* Image preview */}
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pt-3">
                <div className="relative inline-block">
                  <img src={preview} alt="preview" className="h-20 rounded-lg border border-border object-contain" />
                  <button onClick={clearFile} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-110 transition-transform">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea row */}
          <div className="flex items-end gap-2 px-4 pt-3 pb-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={file ? 'Add a note (optional)...' : 'Ask about trading or upload a chart...'}
              disabled={isBusy}
              unstyled
              className="flex-1 resize-none min-h-[44px] max-h-[120px] text-sm bg-transparent placeholder:text-muted-foreground/50 leading-relaxed overflow-y-auto"
              rows={1}
            />
            <AnimatePresence mode="wait">
              {isBusy ? (
                <motion.div key="spin" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="shrink-0 mb-1 w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                </motion.div>
              ) : (input.trim() || file) ? (
                <motion.button key="send" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}
                  onClick={handleSend}
                  className="shrink-0 mb-1 w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 hover:scale-105 active:scale-95 shadow-md transition-all">
                  <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Toolbar */}
          <div className="grid grid-cols-3 items-center px-2 py-1.5 border-t border-border/30 bg-muted/10">
            <div className="flex items-center gap-0.5">
              <button onClick={handleNew}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all">
                <Plus className="w-3.5 h-3.5" />New
              </button>
              <button onClick={() => fileRef.current?.click()} disabled={isBusy}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all disabled:opacity-40"
                title="Upload chart">
                <Upload className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-center">
              {coach.sessions.length > 0 && (
                <button onClick={onToggleSidebar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/80 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">History</span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{coach.sessions.length}</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-end gap-1.5 px-1">
              <Brain className="w-4 h-4 text-foreground" />
              <span className="text-xs font-medium hidden sm:inline text-muted-foreground">AYN</span>
            </div>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) attachFile(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}
