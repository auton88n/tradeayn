import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Download, RefreshCw, Sparkles, Brain } from 'lucide-react';

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

const bgOptions: { value: CreativeParams['background_color']; label: string; preview: string }[] = [
  { value: 'white', label: 'Light', preview: 'bg-white border' },
  { value: 'dark', label: 'Dark', preview: 'bg-gray-900' },
  { value: 'blue', label: 'Brand', preview: 'bg-[hsl(199,89%,48%)]' },
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

  // Sync header_text when tweetText changes
  const effectiveHeader = params.header_text || tweetText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[480px]">
          {/* Left: Preview */}
          <div className="bg-muted/30 flex items-center justify-center p-6 border-r">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Creative preview"
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-square rounded-lg bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Brain className="w-10 h-10" />
                <p className="text-sm">Generate a creative to preview</p>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="p-5 space-y-5 overflow-y-auto max-h-[520px]">
            <h3 className="font-semibold text-base">Edit Creative</h3>

            {/* Header Text */}
            <div className="space-y-1.5">
              <Label className="text-xs">Header Text</Label>
              <Input
                value={params.header_text}
                onChange={(e) => setParams({ ...params, header_text: e.target.value })}
                placeholder={tweetText.slice(0, 60)}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">{effectiveHeader.length} characters</p>
            </div>

            {/* Background Color */}
            <div className="space-y-1.5">
              <Label className="text-xs">Background</Label>
              <div className="flex gap-2">
                {bgOptions.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => setParams({ ...params, background_color: bg.value })}
                    className={`w-10 h-10 rounded-lg ${bg.preview} transition-all ${
                      params.background_color === bg.value
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'hover:scale-105'
                    }`}
                    title={bg.label}
                  />
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-1.5">
              <Label className="text-xs">Accent Color</Label>
              <div className="flex gap-2">
                {accentColors.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setParams({ ...params, accent_color: c.hex })}
                    className={`w-8 h-8 rounded-full transition-all`}
                    style={{
                      backgroundColor: c.hex,
                      boxShadow: params.accent_color === c.hex ? `0 0 0 2px var(--background), 0 0 0 4px ${c.hex}` : 'none',
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* CTA Text */}
            <div className="space-y-1.5">
              <Label className="text-xs">Call to Action (optional)</Label>
              <Input
                value={params.cta_text}
                onChange={(e) => setParams({ ...params, cta_text: e.target.value })}
                placeholder="Try AYN free →"
                className="text-sm"
              />
            </div>

            {/* Logo Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Include AYN Logo</Label>
              <Switch
                checked={params.include_logo}
                onCheckedChange={(v) => setParams({ ...params, include_logo: v })}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onGenerate(params)}
                disabled={isGenerating}
                className="flex-1 gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : imageUrl ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {imageUrl ? 'Regenerate' : 'Generate'}
              </Button>
              {imageUrl && (
                <Button variant="outline" size="icon" asChild>
                  <a href={imageUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
