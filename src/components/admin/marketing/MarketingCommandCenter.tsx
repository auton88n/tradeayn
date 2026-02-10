import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Download } from 'lucide-react';
import { CompactBrandBar, type BrandKitState } from './CompactBrandBar';
import { MarketingCoPilot } from './MarketingCoPilot';
import { ContentPipeline } from './ContentPipeline';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { CreativeEditor } from './CreativeEditor';

type View = 'pipeline' | 'analytics';

interface TwitterPost {
  id: string;
  content: string;
  status: string;
  psychological_strategy: string | null;
  target_audience: string | null;
  content_type: string | null;
  quality_score: Record<string, number> | null;
  tweet_id: string | null;
  error_message: string | null;
  posted_at: string | null;
  created_at: string;
  image_url: string | null;
}

export const MarketingCommandCenter = () => {
  const [activeView, setActiveView] = useState<View>('pipeline');
  const [brandKit, setBrandKit] = useState<BrandKitState | null>(null);
  const [scannedColors, setScannedColors] = useState<{ name: string; hex: string }[] | null>(null);
  const [creativeEditorPost, setCreativeEditorPost] = useState<TwitterPost | null>(null);

  const handleBrandKitUpdate = useCallback((colors: { name: string; hex: string }[]) => {
    setScannedColors(colors);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Marketing HQ</h2>
          <p className="text-xs text-muted-foreground">Content pipeline · Creative studio · Analytics</p>
        </div>
      </div>

      {/* Main layout: Sidebar + Content */}
      <div className="flex gap-4 min-h-[70vh]">
        {/* Left sidebar: Brand Kit + Co-Pilot */}
        <div className="w-80 shrink-0 flex flex-col gap-3">
          <CompactBrandBar onBrandKitChange={setBrandKit} externalColors={scannedColors} />
          <div className="flex-1 min-h-0 rounded-xl border border-border bg-card overflow-hidden">
            <MarketingCoPilot
              brandKit={brandKit}
              activeView={activeView}
              onBrandKitUpdate={handleBrandKitUpdate}
            />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* View tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 w-fit">
            {([
              { id: 'pipeline' as View, label: 'Pipeline' },
              { id: 'analytics' as View, label: 'Analytics' },
            ]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* View content */}
          {activeView === 'pipeline' && (
            <ContentPipeline onOpenCreativeEditor={(post) => setCreativeEditorPost(post as TwitterPost)} />
          )}
          {activeView === 'analytics' && <AnalyticsDashboard />}
        </div>
      </div>

      {/* Creative Editor Dialog */}
      {creativeEditorPost && (
        <CreativeEditor
          open={!!creativeEditorPost}
          onOpenChange={(open) => !open && setCreativeEditorPost(null)}
          imageUrl={creativeEditorPost.image_url}
          tweetText={creativeEditorPost.content}
          postId={creativeEditorPost.id}
          onImageGenerated={(url) => {
            setCreativeEditorPost(prev => prev ? { ...prev, image_url: url } : null);
          }}
          brandKit={brandKit}
          onBrandKitUpdate={setScannedColors}
        />
      )}
    </div>
  );
};
