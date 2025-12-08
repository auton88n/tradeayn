import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Bot, Ticket, HelpCircle } from 'lucide-react';
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
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
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
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Support Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[600px] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary/5 border-b border-border px-4 py-3">
              <h3 className="font-semibold text-foreground">AYN Support</h3>
              <p className="text-xs text-muted-foreground">How can we help you today?</p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[520px]">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 m-2 rounded-lg">
                <TabsTrigger value="chat" className="flex items-center gap-1.5 text-xs">
                  <Bot className="h-3.5 w-3.5" />
                  AI Chat
                </TabsTrigger>
                <TabsTrigger value="ticket" className="flex items-center gap-1.5 text-xs">
                  <Ticket className="h-3.5 w-3.5" />
                  Ticket
                </TabsTrigger>
                <TabsTrigger value="faq" className="flex items-center gap-1.5 text-xs">
                  <HelpCircle className="h-3.5 w-3.5" />
                  FAQ
                </TabsTrigger>
              </TabsList>

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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportWidget;
