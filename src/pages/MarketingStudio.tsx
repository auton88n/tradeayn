import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Download, Eye, LayoutGrid, Sparkles, BarChart3, Table2, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';
import { useMarketingContent } from '@/contexts/MarketingContentContext';
import { Button } from '@/components/ui/button';
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
} from '@/components/lab/templates';

const MarketingStudio = () => {
  const navigate = useNavigate();
  const { marketingData } = useMarketingContent();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'design' | 'data'>('design');

  useEffect(() => {
    if (!marketingData) {
      navigate('/');
    }
  }, [marketingData, navigate]);

  if (!marketingData) return null;

  const templateType = detectTemplateType(marketingData);

  const getTemplateData = () => {
    if (marketingData.data && typeof marketingData.data === 'object' && !Array.isArray(marketingData.data)) {
      const nestedData = marketingData.data as Record<string, unknown>;
      const contentType = marketingData.contentType as string || '';
      
      if ((contentType === 'social' || contentType === 'social_post') && !nestedData.content) {
        return {
          type: 'social_post',
          platform: nestedData.platform || 'instagram',
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
          templateId: marketingData.templateId,
          contentType: marketingData.contentType,
        };
      }
      
      return {
        ...nestedData,
        templateId: marketingData.templateId,
        contentType: marketingData.contentType,
        platform: nestedData.platform || (contentType === 'social' ? 'instagram' : undefined),
      };
    }
    return marketingData;
  };

  const templateData = getTemplateData();

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
        return <GenericFullView data={templateData} />;
    }
  };

  const getDataType = (): 'marketing' | 'analysis' | 'report' | 'generic' => {
    if (templateType) return 'marketing';
    const keys = Object.keys(marketingData);
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
    marketing: <Sparkles className="w-5 h-5" />,
    analysis: <BarChart3 className="w-5 h-5" />,
    report: <Table2 className="w-5 h-5" />,
    generic: <FileJson className="w-5 h-5" />
  };

  const typeLabel = {
    marketing: 'Marketing Content',
    analysis: 'Data Analysis',
    report: 'Report',
    generic: 'Structured Data'
  };

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
                  {typeIcon[dataType]}
                </div>
                <div>
                  <h1 className="text-lg font-semibold">{typeLabel[dataType]}</h1>
                  <p className="text-xs text-muted-foreground">{Object.keys(marketingData).length} fields</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => { hapticFeedback('light'); setViewMode('design'); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all",
                    viewMode === 'design'
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <Eye size={14} />
                  Design
                </button>
                <button
                  onClick={() => { hapticFeedback('light'); setViewMode('data'); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all",
                    viewMode === 'data'
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <LayoutGrid size={14} />
                  Data
                </button>
              </div>
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
          {viewMode === 'design' ? (
            <div className="max-w-4xl mx-auto">
              {renderTemplate()}
            </div>
          ) : (
            <div className={cn(
              "max-w-4xl mx-auto rounded-xl p-6 font-mono text-sm",
              "bg-card border border-border",
              "overflow-auto max-h-[70vh]"
            )}>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(marketingData, null, 2)}
              </pre>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

// Generic full view for unknown template types
const GenericFullView = ({ data }: { data: Record<string, unknown> }) => {
  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
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
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const entries = Object.entries(data).filter(([key]) => 
    !['templateId', 'contentType', 'type'].includes(key)
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-6 border-b border-border bg-muted/30">
        <h2 className="text-xl font-semibold">Data Preview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ask for an "Instagram post" or "marketing report" to see visual templates
        </p>
      </div>
      <div className="p-6 grid gap-4 md:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">{formatKey(key)}</p>
            <p className="text-sm font-medium break-words">{formatValue(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketingStudio;
