import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Download, RefreshCw, Sparkles, Check } from 'lucide-react';
import { AynEyeIcon } from './AynEyeIcon';

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

const bgOptions: { value: CreativeParams['background_color']; label: string; desc: string; bg: string; text: string }[] = [
  { value: 'white', label: 'Light', desc: 'Clean & minimal', bg: 'bg-background border', text: 'text-foreground' },
  { value: 'dark', label: 'Dark', desc: 'Bold & striking', bg: 'bg-foreground', text: 'text-background' },
  { value: 'blue', label: 'Brand', desc: 'AYN signature', bg: 'bg-[hsl(199,89%,48%)]', text: 'text-background' },
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
      <DialogContent className="max-w-6xl h-[90vh] max-h-[800px] p-0 gap-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 h-full">
          {/* Left: Preview (3/5) */}
          <div className="md:col-span-3 bg-muted/10 flex items-center justify-center p-10 border-r relative">
            {/* Subtle grid */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'linear-gradient(hsl(199,89%,48%) 1px, transparent 1px), linear-gradient(90deg, hsl(199,89%,48%) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />

            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Creative preview"
                className="relative w-full max-w-lg rounded-2xl shadow-2xl ring-1 ring-border/10"
              />
            ) : (
              <div className="relative w-full max-w-lg aspect-square rounded-2xl bg-muted/20 border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-5">
                <div className="w-20 h-20 rounded-3xl bg-foreground flex items-center justify-center shadow-xl">
                  <AynEyeIcon size={40} className="text-background" />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-semibold text-foreground">Generate your first creative</p>
                  <p className="text-xs text-muted-foreground">Configure settings → click Generate</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls (2/5) */}
          <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-6 border-b">
              <h3 className="font-bold text-lg tracking-tight">Edit Creative</h3>
              <p className="text-xs text-muted-foreground mt-1">Customize your branded image</p>
            </div>

            {/* Scrollable Controls */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6 space-y-8">
                {/* Header Text */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Header Text</Label>
                  <Textarea
                    value={params.header_text}
                    onChange={(e) => setParams({ ...params, header_text: e.target.value })}
                    placeholder={tweetText.slice(0, 80)}
                    className="text-sm min-h-[80px] resize-none"
                    rows={3}
                  />
                  <p className="text-[11px] text-muted-foreground">{effectiveHeader.length} characters</p>
                </div>

                {/* Background Theme */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {bgOptions.map((bg) => (
                      <button
                        key={bg.value}
                        onClick={() => setParams({ ...params, background_color: bg.value })}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          params.background_color === bg.value
                            ? 'border-[hsl(199,89%,48%)] shadow-md shadow-[hsl(199,89%,48%)]/10'
                            : 'border-transparent hover:border-border hover:bg-muted/30'
                        }`}
                      >
                        <div className={`w-full aspect-[4/3] rounded-lg ${bg.bg} flex items-center justify-center`}>
                          {params.background_color === bg.value && (
                            <Check className={`w-5 h-5 ${bg.text}`} />
                          )}
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-semibold block">{bg.label}</span>
                          <span className="text-[10px] text-muted-foreground">{bg.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accent Color</Label>
                  <div className="flex gap-4">
                    {accentColors.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setParams({ ...params, accent_color: c.hex })}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div
                          className="w-12 h-12 rounded-full transition-all group-hover:scale-110"
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

                {/* CTA Text */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Call to Action</Label>
                  <Input
                    value={params.cta_text}
                    onChange={(e) => setParams({ ...params, cta_text: e.target.value })}
                    placeholder="Try AYN free →"
                    className="text-sm"
                  />
                </div>

                {/* Logo Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                      <AynEyeIcon size={20} className="text-background" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">AYN Logo</Label>
                      <p className="text-[10px] text-muted-foreground">Show brand watermark</p>
                    </div>
                  </div>
                  <Switch
                    checked={params.include_logo}
                    onCheckedChange={(v) => setParams({ ...params, include_logo: v })}
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Pinned Action Buttons */}
            <div className="shrink-0 p-6 border-t bg-background space-y-3">
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
