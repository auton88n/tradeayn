import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface DocumentGeneratingCardProps {
  documentType?: 'pdf' | 'excel';
  className?: string;
}

const translations = {
  en: {
    generatingPdf: 'Generating your PDF...',
    generatingExcel: 'Creating Excel spreadsheet...',
    almostReady: 'Almost ready...',
    preparingDocument: 'Preparing your document',
  },
  ar: {
    generatingPdf: 'جاري إنشاء ملف PDF...',
    generatingExcel: 'جاري إنشاء جدول Excel...',
    almostReady: 'جاري الانتهاء...',
    preparingDocument: 'جاري تحضير المستند',
  },
  fr: {
    generatingPdf: 'Génération du PDF...',
    generatingExcel: 'Création du tableur Excel...',
    almostReady: 'Presque prêt...',
    preparingDocument: 'Préparation de votre document',
  },
};

export const DocumentGeneratingCard = ({ 
  documentType = 'pdf',
  className 
}: DocumentGeneratingCardProps) => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  const Icon = documentType === 'excel' ? FileSpreadsheet : FileText;
  const message = documentType === 'excel' ? t.generatingExcel : t.generatingPdf;
  const iconColor = documentType === 'excel' ? 'text-green-500' : 'text-blue-500';
  const bgGradient = documentType === 'excel' 
    ? 'from-green-500/10 to-green-600/5' 
    : 'from-blue-500/10 to-blue-600/5';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "w-full max-w-md mx-auto",
        "rounded-2xl border border-border/50",
        "bg-gradient-to-br backdrop-blur-sm",
        bgGradient,
        "p-6 shadow-lg",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated icon */}
        <div className="relative">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center",
              "bg-background/80 shadow-md"
            )}
          >
            <Icon className={cn("w-8 h-8", iconColor)} />
          </motion.div>
          
          {/* Spinning loader overlay */}
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-5 h-5 text-primary" />
          </motion.div>
        </div>

        {/* Text content */}
        <div className="text-center space-y-1">
          <p className="font-medium text-foreground">{message}</p>
          <motion.p 
            className="text-sm text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {t.almostReady}
          </motion.p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              documentType === 'excel' ? 'bg-green-500' : 'bg-blue-500'
            )}
            initial={{ width: '0%' }}
            animate={{ width: ['0%', '70%', '90%', '95%'] }}
            transition={{ 
              duration: 8, 
              times: [0, 0.3, 0.7, 1],
              ease: "easeOut"
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};
