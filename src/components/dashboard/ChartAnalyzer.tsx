import { useCallback, useState } from 'react';
import { Upload, X, Loader2, BarChart3, Search, Brain, CheckCircle2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useChartAnalyzer } from '@/hooks/useChartAnalyzer';
import { useChartHistory } from '@/hooks/useChartHistory';
import ChartAnalyzerResults from './ChartAnalyzerResults';
import ChartHistoryList from './ChartHistoryList';
import ChartHistoryDetail from './ChartHistoryDetail';
import ChartHistoryStats from './ChartHistoryStats';
import ChartCompareView from './ChartCompareView';
import type { ChartHistoryItem } from '@/types/chartAnalyzer.types';

const STEPS = [
  { key: 'uploading', label: 'Uploading chart...', icon: Upload },
  { key: 'analyzing', label: 'Analyzing chart...', icon: BarChart3 },
  { key: 'fetching-news', label: 'Fetching latest news...', icon: Search },
  { key: 'predicting', label: 'Generating prediction...', icon: Brain },
] as const;

export default function ChartAnalyzer() {
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
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold flex items-center justify-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Chart Analyzer
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a trading chart screenshot for AI-powered technical analysis & prediction
        </p>
      </div>

      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="analyze" className="flex-1 gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Analyze
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-1.5">
            <History className="h-3.5 w-3.5" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze">
          <div className="space-y-4 mt-2">
            {/* Upload Zone */}
            {(step === 'idle' || step === 'error') && (
              <Card
                className={`border-2 border-dashed transition-colors cursor-pointer ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Drop chart screenshot here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse (PNG, JPG, WEBP)</p>
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
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
          <div className="mt-2 space-y-3">
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
