import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUp, 
  Play, 
  FileDown, 
  FileText,
  GitCompare, 
  History, 
  RotateCcw,
  Loader2,
  Save,
  Brain,
  X,
  ChevronUp,
  Sparkles,
  Command,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEngineeringAIAgent, type ChatMessage } from '@/hooks/useEngineeringAIAgent';
import { AIActionChip } from './AIActionChip';
import ReactMarkdown from 'react-markdown';

interface EngineeringBottomChatProps {
  onCalculate: () => void;
  onExportDXF?: () => void;
  onExportPDF?: () => void;
  onCompare: () => void;
  onHistory: () => void;
  onReset?: () => void;
  onSave?: () => void;
  isCalculating: boolean;
  hasResults: boolean;
  canCompare: boolean;
  calculatorType: string | null;
  currentInputs: Record<string, any>;
  currentOutputs: Record<string, any> | null;
  onSetInput?: (field: string, value: any) => void;
  onSetMultipleInputs?: (inputs: Record<string, any>) => void;
  onSwitchCalculator?: (type: string) => void;
}

const placeholders = [
  "Design a beam for 6m span with 20kN/m load...",
  "Optimize this for cost efficiency...",
  "Check Saudi Building Code compliance...",
  "Compare 300mm vs 400mm width...",
  "What's the required reinforcement?",
];

const quickCommands = [
  { label: '/calc', desc: 'Run calculation' },
  { label: '/save', desc: 'Save design' },
  { label: '/export', desc: 'Export file' },
  { label: '/reset', desc: 'Reset form' },
];

export const EngineeringBottomChat: React.FC<EngineeringBottomChatProps> = ({
  onCalculate,
  onExportDXF,
  onExportPDF,
  onCompare,
  onHistory,
  onReset,
  onSave,
  isCalculating,
  hasResults,
  canCompare,
  calculatorType,
  currentInputs,
  currentOutputs,
  onSetInput,
  onSetMultipleInputs,
  onSwitchCalculator,
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [showQuickCommands, setShowQuickCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI Agent hook
  const {
    messages,
    isLoading,
    currentAction,
    sendMessage,
    executeQuickCommand,
    clearConversation,
  } = useEngineeringAIAgent({
    calculatorType,
    currentInputs,
    currentOutputs,
    onSetInput: onSetInput || (() => {}),
    onSetMultipleInputs: onSetMultipleInputs || (() => {}),
    onCalculate,
    onSwitchCalculator: onSwitchCalculator || (() => {}),
    onReset: onReset || (() => {}),
    onShowHistory: onHistory,
    onSaveDesign: onSave ? async (name) => { onSave(); } : undefined,
    onExportFile: onExportPDF || onExportDXF ? (format) => {
      if (format === 'pdf' && onExportPDF) onExportPDF();
      else if (format === 'dxf' && onExportDXF) onExportDXF();
    } : undefined,
  });

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
        setShowPlaceholder(true);
      }, 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Auto-expand when there are messages
  useEffect(() => {
    if (messages.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [messages.length]);

  // Check for quick commands
  useEffect(() => {
    setShowQuickCommands(input.startsWith('/'));
  }, [input]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // Check for quick command
    if (input.startsWith('/')) {
      const handled = executeQuickCommand(input.trim().toLowerCase());
      if (handled) {
        setInput('');
        return;
      }
    }

    await sendMessage(input);
    setInput('');
    setIsExpanded(true);
  }, [input, isLoading, sendMessage, executeQuickCommand]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickCommandClick = (command: string) => {
    setInput(command + ' ');
    textareaRef.current?.focus();
  };

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl"
      >
        {/* AI Action Status Bar */}
        <AnimatePresence>
          {currentAction && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-border/30 bg-primary/5"
            >
              <div className="container mx-auto px-4 py-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-primary font-medium">{currentAction}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expandable Messages Area */}
        <AnimatePresence>
          {isExpanded && messages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-b border-border/30"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="font-medium">AI Engineering Assistant</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Can modify your design
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={clearConversation}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsExpanded(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="max-h-[250px]">
                <div className="p-4 space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col gap-2",
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5",
                          msg.role === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                      
                      {/* Action chips for assistant messages */}
                      {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 max-w-[85%]">
                          {msg.actions.map((action, j) => (
                            <AIActionChip key={j} action={action} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl px-4 py-2.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Commands Dropdown */}
        <AnimatePresence>
          {showQuickCommands && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 p-2"
            >
              <div className="container mx-auto max-w-2xl">
                <div className="bg-popover border border-border rounded-xl shadow-xl p-2 flex flex-wrap gap-2">
                  {quickCommands.map((cmd) => (
                    <button
                      key={cmd.label}
                      onClick={() => handleQuickCommandClick(cmd.label)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent text-sm transition-colors"
                    >
                      <Command className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-primary">{cmd.label}</span>
                      <span className="text-muted-foreground">{cmd.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container mx-auto px-4 py-3">
          {/* Chat Input Row */}
          <div className="flex items-end gap-3 mb-3">
            {/* Toggle messages button */}
            {messages.length > 0 && !isExpanded && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-10 w-10"
                    onClick={() => setIsExpanded(true)}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show AI conversation</TooltipContent>
              </Tooltip>
            )}

            {/* AI Indicator */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">AI</span>
            </div>

            {/* Input Area */}
            <div className="flex-1 relative">
              <div
                className={cn(
                  "relative rounded-2xl overflow-hidden",
                  "bg-muted/50 border border-border/50",
                  "transition-all duration-200",
                  "focus-within:border-primary/50 focus-within:bg-muted/70 focus-within:shadow-lg focus-within:shadow-primary/5"
                )}
              >
                <div className="flex items-end gap-2 px-4 py-2.5">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder=""
                      disabled={isLoading}
                      className={cn(
                        "resize-none border-0 bg-transparent p-0 min-h-[40px] max-h-[100px]",
                        "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                        "text-sm placeholder:text-muted-foreground/60"
                      )}
                      rows={1}
                    />
                    
                    {/* Animated placeholder */}
                    {!input && (
                      <div 
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 left-0 pointer-events-none text-muted-foreground/50 text-sm",
                          "transition-opacity duration-200",
                          showPlaceholder ? "opacity-100" : "opacity-0"
                        )}
                      >
                        {placeholders[currentPlaceholder]}
                      </div>
                    )}
                  </div>

                  {/* Send Button */}
                  <AnimatePresence>
                    {input.trim() && (
                      <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-xl",
                          "flex items-center justify-center",
                          "bg-primary text-primary-foreground",
                          "transition-all duration-200",
                          "hover:scale-105 hover:shadow-lg hover:shadow-primary/25",
                          "active:scale-95",
                          "disabled:opacity-50"
                        )}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Actions - Primary */}
            <div className="flex items-center gap-2">
              <Button
                onClick={onCalculate}
                disabled={isCalculating || !calculatorType}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                size="default"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Calculating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="hidden sm:inline">Calculate</span>
                  </>
                )}
              </Button>

              {onReset && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onReset}
                      disabled={isCalculating}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset Form</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Center Actions - Export & Utils */}
            <div className="flex items-center gap-1">
              {hasResults && (
                <>
                  {onExportDXF && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onExportDXF}
                          className="gap-1.5 h-8"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span className="hidden md:inline text-xs">DXF</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export CAD Drawing</TooltipContent>
                    </Tooltip>
                  )}

                  {onExportPDF && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onExportPDF}
                          className="gap-1.5 h-8"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden md:inline text-xs">PDF</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export Report</TooltipContent>
                    </Tooltip>
                  )}

                  {onSave && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onSave}
                          className="gap-1.5 h-8"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span className="hidden md:inline text-xs">Save</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save to Portfolio</TooltipContent>
                    </Tooltip>
                  )}

                  <Separator orientation="vertical" className="h-5 mx-1 hidden sm:block" />
                </>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCompare}
                    disabled={!canCompare}
                    className="gap-1.5 h-8"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-xs">Compare</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {canCompare ? 'Compare Calculations' : 'Need 2+ calculations'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onHistory}
                    className="gap-1.5 h-8"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-xs">History</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View History</TooltipContent>
              </Tooltip>
            </div>

            {/* Right - Status */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                hasResults
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  hasResults ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"
                )} />
                <span className="hidden sm:inline">{hasResults ? 'Results Ready' : 'Ready'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};
