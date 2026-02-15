import { useCallback, useState } from 'react';
import { Upload, X, Loader2, BarChart3, Search, Brain, CheckCircle2, History, TrendingUp, Target, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useChartAnalyzer } from '@/hooks/useChartAnalyzer';
import { useChartHistory } from '@/hooks/useChartHistory';
import ChartAnalyzerResults from './ChartAnalyzerResults';
import ChartHistoryList from './ChartHistoryList';
import ChartHistoryDetail from './ChartHistoryDetail';
import ChartHistoryStats from './ChartHistoryStats';
import ChartCompareView from './ChartCompareView';
import type { ChartHistoryItem } from '@/types/chartAnalyzer.types';
import type { ChartAnalysisResult } from '@/types/chartAnalyzer.types';

const STEPS = [
  { key: 'uploading', label: 'Uploading chart...', icon: Upload },
  { key: 'analyzing', label: 'Analyzing chart...', icon: BarChart3 },
  { key: 'fetching-news', label: 'Fetching latest news...', icon: Search },
  { key: 'predicting', label: 'Generating prediction...', icon: Brain },
] as const;

const FEATURES = [
  { label: 'Pattern Detection', icon: TrendingUp },
  { label: 'Entry/Exit Signals', icon: Target },
  { label: 'Sentiment Analysis', icon: Activity },
];

const ASSETS = ['Stock', 'Crypto', 'Forex', 'Commodity'];
const FORMATS = ['PNG', 'JPG', 'WEBP'];

interface ChartAnalyzerProps {
  onResult?: (result: ChartAnalysisResult) => void;
}

export default function ChartAnalyzer({ onResult }: ChartAnalyzerProps) {
  const { step, result, error, previewUrl, fileInputRef, analyzeChart, reset } = useChartAnalyzer();
  const history = useChartHistory();
  const [isDragOver, setIsDragOver] = useState(false);
  const [compareItems, setCompareItems] = useState<[ChartHistoryItem, ChartHistoryItem] | null>(null);

  const isLoading = ['uploading', 'analyzing', 'fetching-news', 'predicting'].includes(step);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    analyzeChart(file);
  }, [analyzeChart]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyzeComplete = useCallback(() => {
    reset();
    history.refresh();
  }, [reset, history]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
          <BarChart3 className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent">
            Chart Analyzer
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            Upload a trading chart screenshot for AI-powered technical analysis, predictions & trade signals
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {FEATURES.map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/60 rounded-full px-3 py-1.5 border border-border/50">
              <Icon className="h-3 w-3 text-amber-500" />
              {label}
            </div>
          ))}
        </div>

        {/* Asset badges */}
        <div className="flex items-center justify-center gap-1.5">
          {ASSETS.map((asset) => (
            <Badge key={asset} variant="outline" className="text-[10px] px-2 py-0.5 font-medium border-amber-500/30 text-amber-600 dark:text-amber-400">
              {asset}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="w-full bg-muted/50 backdrop-blur-sm rounded-xl p-1">
          <TabsTrigger value="analyze" className="flex-1 gap-1.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md">
            <BarChart3 className="h-3.5 w-3.5" /> Analyze
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-1.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md">
            <History className="h-3.5 w-3.5" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze">
          <div className="space-y-4 mt-3">
            {/* Upload Zone */}
            {(step === 'idle' || step === 'error') && (
              <Card
                className={`border-2 border-dashed transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                  isDragOver
                    ? 'border-amber-500 bg-amber-500/5 scale-[1.01]'
                    : 'border-amber-500/20 hover:border-amber-500/50 hover:bg-muted/30'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Subtle background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none" />

                <CardContent className="flex flex-col items-center justify-center py-14 text-center relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-6 w-6 text-amber-500 animate-pulse" />
                  </div>
                  <p className="text-sm font-semibold">Drop your chart screenshot here</p>
                  <p className="text-xs text-muted-foreground mt-1.5 mb-3">or click to browse your files</p>
                  <div className="flex items-center gap-1.5">
                    {FORMATS.map((fmt) => (
                      <span key={fmt} className="text-[10px] font-medium bg-muted rounded-md px-2 py-0.5 text-muted-foreground border border-border/50">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />

            {/* Preview + Loading Steps */}
            {previewUrl && isLoading && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <img
                    src={previewUrl}
                    alt="Chart preview"
                    className="w-full rounded-lg border border-border max-h-64 object-contain"
                  />
                  <div className="space-y-2">
                    {STEPS.map((s) => {
                      const Icon = s.icon;
                      const isActive = step === s.key;
                      const isDone = STEPS.findIndex(x => x.key === step) > STEPS.findIndex(x => x.key === s.key);
                      return (
                        <div key={s.key} className={`flex items-center gap-2 text-sm transition-opacity ${
                          isActive ? 'opacity-100' : isDone ? 'opacity-50' : 'opacity-30'
                        }`}>
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : isActive ? (
                            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                          <span>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {error && (
              <Card className="border-destructive/50">
                <CardContent className="pt-6 text-center">
                  <p className="text-destructive text-sm mb-3">{error}</p>
                  <Button variant="outline" size="sm" onClick={reset}>Try Again</Button>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {result && step === 'done' && (
              <>
                <ChartAnalyzerResults result={result} />
                <div className="text-center">
                  <Button variant="outline" onClick={handleAnalyzeComplete} className="gap-2">
                    <X className="h-4 w-4" /> Analyze Another Chart
                  </Button>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="mt-3 space-y-3">
            {compareItems ? (
              <ChartCompareView
                items={compareItems}
                onBack={() => setCompareItems(null)}
              />
            ) : history.selectedItem ? (
              <ChartHistoryDetail
                item={history.selectedItem}
                onBack={() => history.setSelectedItem(null)}
                onDelete={history.deleteItem}
              />
            ) : (
              <>
                <ChartHistoryStats items={history.items} />
                <ChartHistoryList
                  items={history.items}
                  loading={history.loading}
                  hasMore={history.hasMore}
                  filter={history.filter}
                  onFilterChange={history.setFilter}
                  onSelect={history.setSelectedItem}
                  onLoadMore={history.loadMore}
                  onCompare={setCompareItems}
                />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
