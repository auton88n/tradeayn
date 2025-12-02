import { useState, useEffect } from 'react';
import { Brain, User } from 'lucide-react';
import { TypewriterText } from './TypewriterText';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ConversationMessage {
  sender: 'user' | 'ayn';
  text: string;
}

interface Conversation {
  id: number;
  messages: ConversationMessage[];
}

export const ConversationExamples = () => {
  const { language } = useLanguage();
  const [activeConversation, setActiveConversation] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const conversations: Conversation[] = language === 'ar' ? [
    {
      id: 1,
      messages: [
        { sender: 'user', text: 'كيف يمكنني زيادة إيراداتي بنسبة 30٪؟' },
        { sender: 'ayn', text: 'دعني أحلل استراتيجيات النمو الخاصة بك. أولاً، لنراجع قنوات المبيعات الحالية وتحسين معدلات التحويل...' }
      ]
    },
    {
      id: 2,
      messages: [
        { sender: 'user', text: 'أحتاج إلى خطة تسويق رقمي لمنتجي الجديد' },
        { sender: 'ayn', text: 'سأقوم بإنشاء استراتيجية شاملة تتضمن: تحليل المنافسين، تحديد الجمهور المستهدف، وقنوات التسويق الأمثل...' }
      ]
    },
    {
      id: 3,
      messages: [
        { sender: 'user', text: 'كيف أتمتة عمليات الفواتير والمحاسبة؟' },
        { sender: 'ayn', text: 'يمكننا إعداد نظام آلي يربط بين برامج المحاسبة ويرسل الفواتير تلقائياً ويتتبع المدفوعات...' }
      ]
    }
  ] : [
    {
      id: 1,
      messages: [
        { sender: 'user', text: 'How can I increase my revenue by 30%?' },
        { sender: 'ayn', text: "Let me analyze your growth strategies. First, we'll review your current sales channels and optimize conversion rates..." }
      ]
    },
    {
      id: 2,
      messages: [
        { sender: 'user', text: 'I need a digital marketing plan for my new product' },
        { sender: 'ayn', text: "I'll create a comprehensive strategy including: competitor analysis, target audience identification, and optimal marketing channels..." }
      ]
    },
    {
      id: 3,
      messages: [
        { sender: 'user', text: 'How do I automate invoicing and accounting?' },
        { sender: 'ayn', text: "We can set up an automated system that connects your accounting software, sends invoices automatically, and tracks payments..." }
      ]
    }
  ];

  useEffect(() => {
    const conversationTimer = setInterval(() => {
      setCurrentMessageIndex(0);
      setActiveConversation((prev) => (prev + 1) % conversations.length);
    }, 12000); // Switch conversation every 12 seconds

    return () => clearInterval(conversationTimer);
  }, [conversations.length]);

  useEffect(() => {
    if (currentMessageIndex < conversations[activeConversation].messages.length - 1) {
      const messageTimer = setTimeout(() => {
        setCurrentMessageIndex((prev) => prev + 1);
      }, 4000); // Show next message after 4 seconds

      return () => clearTimeout(messageTimer);
    }
  }, [currentMessageIndex, activeConversation, conversations]);

  const currentConversation = conversations[activeConversation];

  return (
    <div className="w-full max-w-3xl mx-auto mb-12 opacity-0 animate-[fade-in_0.8s_ease-out_0.6s_forwards]">
      <div className="space-y-4">
        {currentConversation.messages.slice(0, currentMessageIndex + 1).map((message, index) => (
          <div
            key={`${activeConversation}-${index}`}
            className={cn(
              "flex gap-3 items-start opacity-0 animate-[slide-up-fade_0.6s_ease-out_forwards]",
              message.sender === 'ayn' ? 'justify-start' : 'justify-end'
            )}
            style={{ animationDelay: `${index * 0.3}s` }}
          >
            {message.sender === 'ayn' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                <Brain className="w-5 h-5 text-background" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[80%] rounded-2xl p-4 backdrop-blur-xl border transition-all duration-300",
                message.sender === 'ayn'
                  ? 'bg-card/50 border-border hover-glow'
                  : 'bg-foreground/5 border-border/50'
              )}
            >
              <TypewriterText
                key={`${activeConversation}-${index}-text`}
                text={message.text}
                speed={30}
                className={cn(
                  "text-sm leading-relaxed",
                  message.sender === 'ayn' ? 'text-foreground' : 'text-foreground'
                )}
                showCursor={index === currentMessageIndex}
              />
            </div>

            {message.sender === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                <User className="w-5 h-5 text-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Conversation indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {conversations.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setActiveConversation(index);
              setCurrentMessageIndex(0);
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === activeConversation
                ? 'bg-foreground w-8'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            )}
            aria-label={`Conversation ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
