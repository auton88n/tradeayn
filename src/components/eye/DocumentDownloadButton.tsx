import { useState } from 'react';
import { FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openDocumentUrl } from '@/lib/documentUrlUtils';
import { hapticFeedback } from '@/lib/haptics';
import { toast } from '@/hooks/use-toast';

interface DocumentDownloadButtonProps {
  url: string;
  name: string;
  type: 'pdf' | 'excel' | string;
  className?: string;
}

export const DocumentDownloadButton = ({ url, name, type, className }: DocumentDownloadButtonProps) => {
  const [downloading, setDownloading] = useState(false);
  const isPdf = type === 'pdf' || type === 'application/pdf' || name?.endsWith('.pdf');
  const isExcel = type === 'excel' || type?.includes('spreadsheet') || name?.endsWith('.xlsx') || name?.endsWith('.xls');
  
  const Icon = isExcel ? FileSpreadsheet : FileText;
  const label = isPdf ? 'PDF' : isExcel ? 'Excel' : 'Document';
  
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    hapticFeedback('success');
    try {
      await openDocumentUrl(url, name);
    } catch {
      toast({ title: 'Download failed', description: 'Could not download the file. Please try again.', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-xl",
        "bg-muted/50 hover:bg-muted border border-border",
        "transition-all duration-200 group",
        className
      )}
    >
      {/* Document icon */}
      <div className={cn(
        "flex-shrink-0 p-2.5 rounded-lg",
        isPdf ? "bg-red-500/10 text-red-600 dark:text-red-400" : 
        isExcel ? "bg-green-500/10 text-green-600 dark:text-green-400" :
        "bg-primary/10 text-primary"
      )}>
        <Icon size={20} />
      </div>
      
      {/* File info */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-foreground truncate">
          {name || `Document.${isPdf ? 'pdf' : isExcel ? 'xlsx' : 'file'}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {label} • Ready to download
        </p>
      </div>
      
      {/* Download button */}
      <div className={cn(
        "flex-shrink-0 p-2 rounded-lg",
        "bg-primary text-primary-foreground",
        "group-hover:scale-105 transition-transform",
        downloading && "animate-pulse"
      )}>
        {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      </div>
    </button>
  );
};
