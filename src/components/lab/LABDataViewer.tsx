import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sparkles,
  LayoutGrid,
  Eye,
  Info,
  Hash,
  Type,
  List,
  ToggleLeft,
  Calendar,
  Maximize2,
  Palette
} from 'lucide-react';
import { useMarketingContent } from '@/contexts/MarketingContentContext';
import { hapticFeedback } from '@/lib/haptics';
import {
  detectTemplateType,
  SocialPostPreview,
  CampaignAnalytics,
  ContentCalendar,
  BrandKitDisplay,
  MarketingReportCard,
  type SocialPostData,
  type CampaignData,
  type ContentCalendarData,
  type BrandKitData,
  type MarketingReportData,
} from './templates';

interface LABDataViewerProps {
  data: Record<string, unknown> | null;
  className?: string;
}

const LABDataViewerComponent = ({ data, className }: LABDataViewerProps) => {
  const navigate = useNavigate();
  const { setMarketingData } = useMarketingContent();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'design' | 'data'>('design');

  if (!data) return null;

  const openInStudio = () => {
    hapticFeedback('light');
    setMarketingData(data);
    navigate('/marketing-studio');
  };

  const templateType = detectTemplateType(data);

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

  // Unwrap nested data for n8n format (contentType + data wrapper)
  const getTemplateData = () => {
    // If data has a nested 'data' field (n8n format), unwrap it
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      const nestedData = data.data as Record<string, unknown>;
      const contentType = data.contentType as string || '';
      
      // For social posts, normalize by wrapping fields in 'content' if missing
      // n8n sends: { headline, body, cta, caption, hashtags, imageUrl, ... } 
      // SocialPostPreview expects: { headline, body, cta, content: { caption, hashtags, imageUrl, ... } }
      if ((contentType === 'social' || contentType === 'social_post') && !nestedData.content) {
        return {
          type: 'social_post',
          platform: nestedData.platform || 'instagram',
          // Pass headline, body, cta for premium visual overlay
          headline: nestedData.headline as string | undefined,
          body: nestedData.body as string | undefined,
          cta: nestedData.cta as string | undefined,
          content: {
            caption: nestedData.caption || nestedData.body,
            hashtags: nestedData.hashtags,
            imageUrl: nestedData.imageUrl,
            imagePrompt: nestedData.imagePrompt,
            callToAction: nestedData.callToAction || nestedData.cta,
            mentions: nestedData.mentions,
          },
          profile: nestedData.profile,
          engagement: nestedData.engagement,
          bestTimeToPost: nestedData.bestTimeToPost,
          templateId: data.templateId,
          contentType: data.contentType,
        };
      }
      
      return {
        ...nestedData,
        // Preserve top-level metadata
        templateId: data.templateId,
        contentType: data.contentType,
        // Ensure platform is set from nested or derive from contentType
        platform: nestedData.platform || (contentType === 'social' ? 'instagram' : undefined),
      };
    }
    return data;
  };

  const templateData = getTemplateData();

  // Render the appropriate marketing template
  const renderTemplate = () => {
    switch (templateType) {
      case 'social_post':
        return <SocialPostPreview data={templateData as unknown as SocialPostData} />;
      case 'campaign':
        return <CampaignAnalytics data={templateData as unknown as CampaignData} />;
      case 'calendar':
      case 'content_calendar':
        return <ContentCalendar data={templateData as unknown as ContentCalendarData} />;
      case 'brand_kit':
      case 'brand':
        return <BrandKitDisplay data={templateData as unknown as BrandKitData} />;
      case 'report':
      case 'marketing_report':
        return <MarketingReportCard data={templateData as unknown as MarketingReportData} />;
      default:
        return <GenericDataCard data={templateData} />;
    }
  };

  // Detect data type for appropriate visualization
  const getDataType = (): 'marketing' | 'analysis' | 'report' | 'generic' => {
    if (templateType) return 'marketing';
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
              <div className="flex gap-2 flex-wrap">
                <div className="flex rounded-lg border border-purple-200 dark:border-purple-700 overflow-hidden">
                  <button
                    onClick={() => { hapticFeedback('light'); setViewMode('design'); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
                      viewMode === 'design'
                        ? "bg-purple-500 text-white"
                        : "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                    )}
                  >
                    <Eye size={12} />
                    Design
                  </button>
                  <button
                    onClick={() => { hapticFeedback('light'); setViewMode('data'); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
                      viewMode === 'data'
                        ? "bg-purple-500 text-white"
                        : "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                    )}
                  >
                    <LayoutGrid size={12} />
                    Data
                  </button>
                </div>
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
                <button
                  onClick={openInStudio}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                    "bg-purple-500 text-white",
                    "hover:bg-purple-600",
                    "transition-all duration-200 active:scale-95"
                  )}
                >
                  <Maximize2 size={12} />
                  <span>Open in Studio</span>
                </button>
                {/* Design This button - shown when imageUrl is present */}
                {(() => {
                  const content = (templateData as Record<string, unknown>).content as Record<string, unknown> | undefined;
                  const imageUrl = content?.imageUrl as string | undefined;
                  if (!imageUrl) return null;
                  return (
                    <button
                      onClick={() => {
                        hapticFeedback('light');
                        navigate(`/design-lab?image=${encodeURIComponent(imageUrl)}`);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                        "bg-gradient-to-r from-pink-500 to-orange-500 text-white",
                        "hover:from-pink-600 hover:to-orange-600",
                        "transition-all duration-200 active:scale-95"
                      )}
                    >
                      <Palette size={12} />
                      <span>Design This</span>
                    </button>
                  );
                })()}
              </div>

              {/* Template or Data View */}
              {viewMode === 'design' ? (
                <div className="rounded-lg overflow-visible">
                  {renderTemplate()}
                </div>
              ) : (
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
              )}
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

// Generic Data Card for unknown template types
const GenericDataCard = ({ data }: { data: Record<string, unknown> }) => {
  const getValueIcon = (value: unknown) => {
    if (typeof value === 'string') return <Type className="w-3.5 h-3.5" />;
    if (typeof value === 'number') return <Hash className="w-3.5 h-3.5" />;
    if (typeof value === 'boolean') return <ToggleLeft className="w-3.5 h-3.5" />;
    if (Array.isArray(value)) return <List className="w-3.5 h-3.5" />;
    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      return <Calendar className="w-3.5 h-3.5" />;
    }
    return <FileJson className="w-3.5 h-3.5" />;
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Empty list';
      if (value.every(v => typeof v === 'string')) return value.join(', ');
      return `${value.length} items`;
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
  };

  // Filter out metadata fields and get displayable entries
  const entries = Object.entries(data).filter(([key]) => 
    !['templateId', 'contentType', 'type'].includes(key)
  );

  return (
    <div className={cn(
      "rounded-xl border border-border/50",
      "bg-gradient-to-br from-background to-muted/30",
      "overflow-hidden"
    )}>
      {/* Header with info message */}
      <div className={cn(
        "px-4 py-3 border-b border-border/50",
        "bg-muted/30"
      )}>
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mt-0.5">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Data Preview
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ask for an "Instagram post" or "marketing report" to see visual templates
            </p>
          </div>
        </div>
      </div>

      {/* Data Fields */}
      <div className="p-4 space-y-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className={cn(
              "flex items-start gap-3 p-2.5 rounded-lg",
              "bg-muted/40 hover:bg-muted/60 transition-colors"
            )}
          >
            <div className="p-1.5 rounded-md bg-background text-muted-foreground shrink-0">
              {getValueIcon(value)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {formatKey(key)}
              </p>
              <p className="text-sm text-foreground mt-0.5 break-words">
                {formatValue(value)}
              </p>
            </div>
          </div>
        ))}
        
        {entries.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No data to display
          </div>
        )}
      </div>
    </div>
  );
};

export const LABDataViewer = memo(LABDataViewerComponent);
