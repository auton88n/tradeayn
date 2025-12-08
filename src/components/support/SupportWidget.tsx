import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Ticket, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AISupportChat from './AISupportChat';
import TicketForm from './TicketForm';
import FAQBrowser from './FAQBrowser';

interface SupportWidgetProps {
  open: boolean;
  onClose: () => void;
}

const SupportWidget: React.FC<SupportWidgetProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState('chat');

  // Reset to chat tab when opened
  useEffect(() => {
    if (open) {
      setActiveTab('chat');
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Premium Support Panel - Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-[400px] max-w-[calc(100vw-32px)] max-h-[80vh] overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12),0_20px_60px_rgba(0,0,0,0.08)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glass panel with accent line */}
            <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-border/50">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              
              {/* Premium Header */}
              <div className="relative px-5 py-4 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground tracking-tight">AYN Support</h3>
                      <p className="text-xs text-muted-foreground">We're here to help</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Premium Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[520px]">
                <div className="px-3 pt-3">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/40 p-1 rounded-xl border border-border/30">
                    <TabsTrigger 
                      value="chat" 
                      className="flex items-center gap-1.5 text-xs rounded-lg text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800 data-[state=active]:shadow-sm transition-all"
                    >
                      <Brain className="h-3.5 w-3.5 shrink-0" />
                      <span>AI Chat</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="ticket" 
                      className="flex items-center gap-1.5 text-xs rounded-lg text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800 data-[state=active]:shadow-sm transition-all"
                    >
                      <Ticket className="h-3.5 w-3.5 shrink-0" />
                      <span>Ticket</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="faq" 
                      className="flex items-center gap-1.5 text-xs rounded-lg text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800 data-[state=active]:shadow-sm transition-all"
                    >
                      <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>FAQ</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="chat" className="h-full m-0 p-0">
                    <AISupportChat onNeedTicket={() => setActiveTab('ticket')} />
                  </TabsContent>
                  <TabsContent value="ticket" className="h-full m-0 p-0">
                    <TicketForm onSuccess={() => setActiveTab('chat')} />
                  </TabsContent>
                  <TabsContent value="faq" className="h-full m-0 p-0">
                    <FAQBrowser />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SupportWidget;
