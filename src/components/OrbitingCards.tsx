import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare } from 'lucide-react';

interface Conversation {
  id: string;
  userMessage: string;
  aynResponse: string;
}

export const OrbitingCards = () => {
  const { language } = useLanguage();
  const [isPaused, setIsPaused] = useState(false);
  
  const conversations: Conversation[] = language === 'ar' ? [
    {
      id: '1',
      userMessage: 'كيف أزيد إيراداتي؟',
      aynResponse: 'دعني أحلل بيانات مبيعاتك...'
    },
    {
      id: '2',
      userMessage: 'اكتب بريد تسويقي',
      aynResponse: 'إليك حملة مخصصة...'
    },
    {
      id: '3',
      userMessage: 'أتمتة الفواتير',
      aynResponse: 'تم الربط بأنظمتك...'
    },
    {
      id: '4',
      userMessage: 'حلل هذا العقد',
      aynResponse: 'وجدت 3 بنود رئيسية...'
    },
  ] : [
    {
      id: '1',
      userMessage: 'How can I grow revenue?',
      aynResponse: 'Let me analyze your sales data...'
    },
    {
      id: '2',
      userMessage: 'Draft a marketing email',
      aynResponse: "Here's a personalized campaign..."
    },
    {
      id: '3',
      userMessage: 'Automate my invoicing',
      aynResponse: "I've connected to your systems..."
    },
    {
      id: '4',
      userMessage: 'Analyze this contract',
      aynResponse: 'I found 3 key clauses...'
    },
  ];
  
  const radius = 280; // Distance from center
  const cardCount = conversations.length;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {conversations.map((conv, index) => {
        const angle = (index / cardCount) * 360;
        
        return (
          <motion.div
            key={conv.id}
            className="absolute pointer-events-auto cursor-pointer"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              rotate: isPaused ? angle : [angle, angle + 360],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <motion.div
              style={{
                x: Math.cos((angle * Math.PI) / 180) * radius,
                y: Math.sin((angle * Math.PI) / 180) * radius,
              }}
              animate={{
                rotate: isPaused ? -angle : [0, -360],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
              }}
              whileHover={{
                scale: 1.1,
                zIndex: 10,
              }}
            >
              <motion.div
                className="orbit-card rounded-2xl p-4 w-48 shadow-xl hover:shadow-2xl transition-shadow"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.2,
                  duration: 0.5,
                  ease: [0.32, 0.72, 0, 1]
                }}
              >
                <div className="space-y-2">
                  {/* User message */}
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-muted-foreground">U</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed flex-1">
                      {conv.userMessage}
                    </p>
                  </div>
                  
                  {/* AYN response */}
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3 h-3 text-background" />
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed flex-1">
                      {conv.aynResponse}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};
