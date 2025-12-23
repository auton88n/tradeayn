import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check, 
  Download,
  BarChart3,
  FileJson,
  Table2,
  Sparkles
} from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

interface LABDataViewerProps {
  data: Record<string, unknown> | null;
  className?: string;
}

const LABDataViewerComponent = ({ data, className }: LABDataViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const copyData = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      hapticFeedback('success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      hapticFeedback('heavy');
    }
  };

  const downloadData = () => {
    hapticFeedback('light');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Detect data type for appropriate visualization
  const getDataType = (): 'marketing' | 'analysis' | 'report' | 'generic' => {
    const keys = Object.keys(data);
    if (keys.some(k => ['campaign', 'content', 'hashtags', 'caption', 'post'].includes(k.toLowerCase()))) {
      return 'marketing';
    }
    if (keys.some(k => ['metrics', 'statistics', 'data', 'chart'].includes(k.toLowerCase()))) {
      return 'analysis';
    }
    if (keys.some(k => ['summary', 'findings', 'recommendations', 'conclusion'].includes(k.toLowerCase()))) {
      return 'report';
    }
    return 'generic';
  };

  const dataType = getDataType();
  const typeIcon = {
    marketing: <Sparkles className="w-3.5 h-3.5" />,
    analysis: <BarChart3 className="w-3.5 h-3.5" />,
    report: <Table2 className="w-3.5 h-3.5" />,
    generic: <FileJson className="w-3.5 h-3.5" />
  };

  const typeLabel = {
    marketing: 'Marketing Content',
    analysis: 'Data Analysis',
    report: 'Report',
    generic: 'Structured Data'
  };

  return (
    <div className={cn(
      "mt-3 rounded-xl border border-purple-200/50 dark:border-purple-800/30",
      "bg-gradient-to-br from-purple-50/50 to-indigo-50/50",
      "dark:from-purple-950/20 dark:to-indigo-950/20",
      className
    )}>
      {/* Header - Always visible */}
      <button
        onClick={() => {
          hapticFeedback('light');
          setIsExpanded(!isExpanded);
        }}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3",
          "text-left transition-colors",
          "hover:bg-purple-100/50 dark:hover:bg-purple-900/20",
          "rounded-xl"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
            {typeIcon[dataType]}
          </div>
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            {typeLabel[dataType]}
          </span>
          <span className="text-xs text-muted-foreground">
            ({Object.keys(data).length} fields)
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-purple-500" />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={copyData}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                    "bg-white dark:bg-gray-800",
                    "border border-purple-200 dark:border-purple-700",
                    "hover:bg-purple-50 dark:hover:bg-purple-900/30",
                    "text-purple-600 dark:text-purple-400",
                    "transition-all duration-200 active:scale-95"
                  )}
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
                <button
                  onClick={downloadData}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                    "bg-white dark:bg-gray-800",
                    "border border-purple-200 dark:border-purple-700",
                    "hover:bg-purple-50 dark:hover:bg-purple-900/30",
                    "text-purple-600 dark:text-purple-400",
                    "transition-all duration-200 active:scale-95"
                  )}
                >
                  <Download size={12} />
                  <span>Download</span>
                </button>
              </div>

              {/* Data Preview */}
              <div className={cn(
                "rounded-lg p-3 text-xs font-mono",
                "bg-white/80 dark:bg-gray-900/80",
                "border border-purple-100 dark:border-purple-800/50",
                "max-h-64 overflow-auto",
                "[&::-webkit-scrollbar]:w-1.5",
                "[&::-webkit-scrollbar-track]:bg-transparent",
                "[&::-webkit-scrollbar-thumb]:bg-purple-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-purple-600/50",
                "[&::-webkit-scrollbar-thumb]:rounded-full"
              )}>
                <RenderJSON data={data} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Recursive JSON renderer with syntax highlighting
const RenderJSON = ({ data, level = 0 }: { data: unknown; level?: number }) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  if (data === null) {
    return <span className="text-gray-400">null</span>;
  }

  if (typeof data === 'boolean') {
    return <span className="text-amber-600 dark:text-amber-400">{String(data)}</span>;
  }

  if (typeof data === 'number') {
    return <span className="text-blue-600 dark:text-blue-400">{data}</span>;
  }

  if (typeof data === 'string') {
    return <span className="text-green-600 dark:text-green-400">"{data}"</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-gray-500">[]</span>;
    
    return (
      <div className="pl-4">
        <span className="text-gray-500">[</span>
        {data.map((item, index) => (
          <div key={index} className="pl-2">
            <RenderJSON data={item} level={level + 1} />
            {index < data.length - 1 && <span className="text-gray-500">,</span>}
          </div>
        ))}
        <span className="text-gray-500">]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-gray-500">{'{}'}</span>;

    return (
      <div className={level > 0 ? "pl-4" : ""}>
        {level === 0 ? null : <span className="text-gray-500">{'{'}</span>}
        {entries.map(([key, value], index) => {
          const isCollapsible = typeof value === 'object' && value !== null;
          const isCollapsed = collapsed.has(key);

          return (
            <div key={key} className={cn("pl-2", level === 0 && "pl-0")}>
              <span className="text-purple-600 dark:text-purple-400">"{key}"</span>
              <span className="text-gray-500">: </span>
              {isCollapsible && (
                <button
                  onClick={() => {
                    setCollapsed(prev => {
                      const next = new Set(prev);
                      if (next.has(key)) {
                        next.delete(key);
                      } else {
                        next.add(key);
                      }
                      return next;
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-1"
                >
                  {isCollapsed ? <ChevronRight className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
                </button>
              )}
              {isCollapsed ? (
                <span className="text-gray-400 ml-1">
                  {Array.isArray(value) ? `[${(value as unknown[]).length}]` : '{...}'}
                </span>
              ) : (
                <RenderJSON data={value} level={level + 1} />
              )}
              {index < entries.length - 1 && <span className="text-gray-500">,</span>}
            </div>
          );
        })}
        {level > 0 && <span className="text-gray-500">{'}'}</span>}
      </div>
    );
  }

  return <span>{String(data)}</span>;
};

export const LABDataViewer = memo(LABDataViewerComponent);
