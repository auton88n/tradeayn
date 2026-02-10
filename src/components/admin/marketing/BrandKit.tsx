import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, ChevronDown, Sparkles } from 'lucide-react';

const brandColors = [
  { name: 'Primary Blue', hex: '#0EA5E9', css: 'bg-[hsl(199,89%,48%)]' },
  { name: 'Foreground', hex: '#000000', css: 'bg-foreground' },
  { name: 'Background', hex: '#FFFFFF', css: 'bg-background border' },
  { name: 'Muted', hex: '#6B7280', css: 'bg-muted-foreground' },
  { name: 'Success', hex: '#10B981', css: 'bg-[hsl(160,84%,39%)]' },
];

const brandFonts = [
  { name: 'Inter', usage: 'Primary UI', sample: 'The quick brown fox' },
  { name: 'JetBrains Mono', usage: 'Code & Data', sample: 'const ayn = true;' },
  { name: 'Playfair Display', usage: 'Display & Accent', sample: 'Engineering Excellence' },
];

export const BrandKit = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden border-t-2 border-t-[hsl(199,89%,48%)]">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center relative shadow-lg">
                <Brain className="w-6 h-6 text-background" />
                <Sparkles className="w-3.5 h-3.5 text-[hsl(199,89%,48%)] absolute -top-1 -right-1" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base tracking-tight">AYN Brand Kit</h3>
                <p className="text-xs text-muted-foreground">"i see, i understand, i help"</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-5 space-y-5">
            {/* Logo & Identity */}
            <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/30">
              <div className="w-20 h-20 rounded-2xl bg-foreground flex items-center justify-center relative shadow-xl">
                <Brain className="w-10 h-10 text-background" />
                <Sparkles className="w-4 h-4 text-[hsl(199,89%,48%)] absolute -top-1.5 -right-1.5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">AYN</h2>
                <p className="text-sm text-muted-foreground italic leading-relaxed">"i see, i understand, i help"</p>
                <div className="flex gap-2">
                  {['Perceptive', 'Friendly', 'Intelligent'].map((v) => (
                    <span key={v} className="text-[10px] px-2.5 py-1 rounded-full bg-[hsl(199,89%,48%)]/10 text-[hsl(199,89%,48%)] font-semibold">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Brand Colors</h4>
              <div className="flex gap-4">
                {brandColors.map((c) => (
                  <div key={c.name} className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-xl ${c.css} shadow-sm`} title={c.name} />
                    <span className="text-[10px] font-medium text-muted-foreground">{c.name}</span>
                    <span className="text-[9px] text-muted-foreground/60 font-mono">{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fonts */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Typography</h4>
              <div className="space-y-3">
                {brandFonts.map((f) => (
                  <div key={f.name} className="flex items-baseline gap-4 p-2.5 rounded-lg bg-muted/20">
                    <span className="text-[10px] text-muted-foreground w-20 shrink-0 font-medium">{f.usage}</span>
                    <span className="text-sm font-medium" style={{ fontFamily: f.name }}>{f.sample}</span>
                    <span className="text-[10px] text-muted-foreground/50 ml-auto font-mono">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
