import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Ticket, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AISupportChat from './AISupportChat';
import TicketForm from './TicketForm';
import FAQBrowser from './FAQBrowser';

const SupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <>
      {/* Premium Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            h-14 w-14 rounded-full flex items-center justify-center
            bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
            shadow-[0_4px_20px_rgba(0,0,0,0.12),0_8px_40px_rgba(0,0,0,0.08)]
            border border-border/50
            transition-all duration-300
            hover:shadow-[0_8px_30px_rgba(0,0,0,0.16),0_12px_50px_rgba(0,0,0,0.12)]
            hover:scale-105
            group
          `}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-5 w-5 text-foreground" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <Brain className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                {/* Subtle pulse ring */}
                <motion.span
                  className="absolute -inset-1 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Premium Support Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] max-h-[600px] overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12),0_20px_60px_rgba(0,0,0,0.08)]"
          >
            {/* Glass panel with accent line */}
            <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-border/50">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              
              {/* Premium Header */}
              <div className="relative px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground tracking-tight">AYN Support</h3>
                    <p className="text-xs text-muted-foreground">We're here to help</p>
                  </div>
                </div>
              </div>

              {/* Premium Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[520px]">
                <div className="px-3 pt-3">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/40 p-1 rounded-xl border border-border/30">
                    <TabsTrigger 
                      value="chat" 
                      className="flex items-center gap-1.5 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:border-border/50 transition-all"
                    >
                      <Brain className="h-3.5 w-3.5" />
                      AI Chat
                    </TabsTrigger>
                    <TabsTrigger 
                      value="ticket" 
                      className="flex items-center gap-1.5 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:border-border/50 transition-all"
                    >
                      <Ticket className="h-3.5 w-3.5" />
                      Ticket
                    </TabsTrigger>
                    <TabsTrigger 
                      value="faq" 
                      className="flex items-center gap-1.5 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:border-border/50 transition-all"
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
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportWidget;
