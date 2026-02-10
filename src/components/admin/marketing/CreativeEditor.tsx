import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Download, RefreshCw, Sparkles, Brain, Check } from 'lucide-react';

interface CreativeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  tweetText: string;
  isGenerating: boolean;
  onGenerate: (params: CreativeParams) => void;
}

export interface CreativeParams {
  background_color: 'white' | 'dark' | 'blue';
  header_text: string;
  accent_color: string;
  include_logo: boolean;
  cta_text: string;
}

const accentColors = [
  { hex: '#0EA5E9', label: 'Blue' },
  { hex: '#10B981', label: 'Green' },
  { hex: '#F59E0B', label: 'Amber' },
  { hex: '#EF4444', label: 'Red' },
  { hex: '#8B5CF6', label: 'Violet' },
];

const bgOptions: { value: CreativeParams['background_color']; label: string; preview: string; text: string }[] = [
  { value: 'white', label: 'Light', preview: 'bg-background border', text: 'text-foreground' },
  { value: 'dark', label: 'Dark', preview: 'bg-foreground', text: 'text-background' },
  { value: 'blue', label: 'Brand', preview: 'bg-[hsl(199,89%,48%)]', text: 'text-background' },
];

export const CreativeEditor = ({
  open,
  onOpenChange,
  imageUrl,
  tweetText,
  isGenerating,
  onGenerate,
}: CreativeEditorProps) => {
  const [params, setParams] = useState<CreativeParams>({
    background_color: 'white',
    header_text: tweetText,
    accent_color: '#0EA5E9',
    include_logo: true,
    cta_text: '',
  });

  const effectiveHeader = params.header_text || tweetText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 min-h-[540px]">
          {/* Left: Preview (3/5) */}
          <div className="md:col-span-3 bg-muted/20 flex items-center justify-center p-8 border-r">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Creative preview"
                className="w-full max-w-md rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-full max-w-md aspect-square rounded-xl bg-muted/30 border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 text-muted-foreground relative overflow-hidden">
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: 'linear-gradient(hsl(199,89%,48%) 1px, transparent 1px), linear-gradient(90deg, hsl(199,89%,48%) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center shadow-lg">
                    <Brain className="w-8 h-8 text-background" />
                  </div>
                  <p className="text-sm font-medium">Generate your first creative</p>
                  <p className="text-xs text-muted-foreground/60">Configure settings and click Generate</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls (2/5) */}
          <div className="md:col-span-2 flex flex-col">
            <div className="p-5 border-b">
              <h3 className="font-bold text-lg">Edit Creative</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Customize your branded image</p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-5 space-y-6">
                {/* Header Text */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Header Text</Label>
                  <Input
                    value={params.header_text}
                    onChange={(e) => setParams({ ...params, header_text: e.target.value })}
                    placeholder={tweetText.slice(0, 60)}
                    className="text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">{effectiveHeader.length} characters</p>
                </div>

                <Separator />

                {/* Background */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {bgOptions.map((bg) => (
                      <button
                        key={bg.value}
                        onClick={() => setParams({ ...params, background_color: bg.value })}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                          params.background_color === bg.value
                            ? 'ring-2 ring-[hsl(199,89%,48%)] ring-offset-2 ring-offset-background'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className={`w-full aspect-square rounded-lg ${bg.preview} flex items-center justify-center`}>
                          {params.background_color === bg.value && (
                            <Check className={`w-5 h-5 ${bg.text}`} />
                          )}
                        </div>
                        <span className="text-[11px] font-medium">{bg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Accent Color */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accent Color</Label>
                  <div className="flex gap-3">
                    {accentColors.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setParams({ ...params, accent_color: c.hex })}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className="w-10 h-10 rounded-full transition-all"
                          style={{
                            backgroundColor: c.hex,
                            boxShadow: params.accent_color === c.hex
                              ? `0 0 0 3px var(--background), 0 0 0 5px ${c.hex}`
                              : 'none',
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground font-medium">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* CTA Text */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Call to Action</Label>
                  <Input
                    value={params.cta_text}
                    onChange={(e) => setParams({ ...params, cta_text: e.target.value })}
                    placeholder="Try AYN free →"
                    className="text-sm"
                  />
                </div>

                <Separator />

                {/* Logo Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                      <Brain className="w-4 h-4 text-background" />
                    </div>
                    <Label className="text-sm font-medium">AYN Logo</Label>
                  </div>
                  <Switch
                    checked={params.include_logo}
                    onCheckedChange={(v) => setParams({ ...params, include_logo: v })}
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="p-5 border-t space-y-2">
              <Button
                onClick={() => onGenerate(params)}
                disabled={isGenerating}
                className="w-full gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : imageUrl ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {imageUrl ? 'Regenerate Creative' : 'Generate Creative'}
              </Button>
              {imageUrl && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(imageUrl, '_blank')}
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
