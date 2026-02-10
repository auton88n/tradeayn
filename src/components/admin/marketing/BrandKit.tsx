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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <Brain className="w-5 h-5 text-background" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm">AYN Brand Kit</h3>
                <p className="text-xs text-muted-foreground">Logo · Fonts · Colors · Identity</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-5">
            {/* Logo & Tagline */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center relative">
                <Brain className="w-8 h-8 text-background" />
                <Sparkles className="w-3 h-3 text-primary absolute -top-1 -right-1" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">AYN</h2>
                <p className="text-sm text-muted-foreground italic">"i see, i understand, i help"</p>
                <div className="flex gap-2 mt-1.5">
                  {['Perceptive', 'Friendly', 'Intelligent'].map((v) => (
                    <span key={v} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Brand Colors</h4>
              <div className="flex gap-3">
                {brandColors.map((c) => (
                  <div key={c.name} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full ${c.css}`} title={c.name} />
                    <span className="text-[9px] text-muted-foreground">{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fonts */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Typography</h4>
              <div className="space-y-2">
                {brandFonts.map((f) => (
                  <div key={f.name} className="flex items-baseline gap-3">
                    <span className="text-[10px] text-muted-foreground w-20 shrink-0">{f.usage}</span>
                    <span
                      className="text-sm"
                      style={{ fontFamily: f.name }}
                    >
                      {f.sample}
                    </span>
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
