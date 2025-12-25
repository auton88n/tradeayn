import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Download, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';
import { useMarketingContent } from '@/contexts/MarketingContentContext';
import { Button } from '@/components/ui/button';

const MarketingStudio = () => {
  const navigate = useNavigate();
  const { marketingData } = useMarketingContent();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!marketingData) {
      navigate('/');
    }
  }, [marketingData, navigate]);

  if (!marketingData) return null;

  const copyData = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(marketingData, null, 2));
      hapticFeedback('success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      hapticFeedback('heavy');
    }
  };

  const downloadData = () => {
    hapticFeedback('light');
    const blob = new Blob([JSON.stringify(marketingData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-content-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Marketing Data</h1>
                  <p className="text-xs text-muted-foreground">{Object.keys(marketingData).length} fields</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyData} className="gap-2">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadData} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={cn(
            "max-w-4xl mx-auto rounded-xl p-6 font-mono text-sm",
            "bg-card border border-border",
            "overflow-auto max-h-[70vh]"
          )}>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(marketingData, null, 2)}
            </pre>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default MarketingStudio;
