import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Palette, 
  Type, 
  Image as ImageIcon,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

export interface BrandKitData {
  type: 'brand_kit' | 'brand';
  name?: string;
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    palette?: Array<{
      name: string;
      hex: string;
      usage?: string;
    }>;
  };
  fonts?: {
    heading?: {
      name: string;
      weight?: string;
      style?: string;
    };
    body?: {
      name: string;
      weight?: string;
      style?: string;
    };
    accent?: {
      name: string;
      weight?: string;
      style?: string;
    };
  };
  logo?: {
    primary?: string;
    light?: string;
    dark?: string;
    icon?: string;
  };
  voice?: {
    tone?: string[];
    personality?: string;
    doList?: string[];
    dontList?: string[];
  };
}

interface BrandKitDisplayProps {
  data: BrandKitData;
  className?: string;
}

const ColorSwatch = ({ 
  name, 
  hex, 
  usage 
}: { 
  name: string; 
  hex: string; 
  usage?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copyHex = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      hapticFeedback('success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      hapticFeedback('heavy');
    }
  };

  // Calculate if text should be light or dark based on background
  const isLight = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={copyHex}
      className={cn(
        "group relative rounded-xl overflow-hidden",
        "border border-gray-200/50 dark:border-gray-700/50",
        "shadow-sm hover:shadow-md transition-shadow"
      )}
    >
      <div 
        className="h-20 w-full flex items-center justify-center"
        style={{ backgroundColor: hex }}
      >
        <span className={cn(
          "text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity",
          isLight(hex) ? "text-gray-800" : "text-white"
        )}>
          {copied ? (
            <Check className="w-5 h-5" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </span>
      </div>
      <div className="p-3 bg-white dark:bg-gray-800">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground font-mono uppercase">{hex}</p>
        {usage && (
          <p className="text-[10px] text-muted-foreground mt-1">{usage}</p>
        )}
      </div>
    </motion.button>
  );
};

const FontPreview = ({ 
  label,
  font 
}: { 
  label: string;
  font: { name: string; weight?: string; style?: string };
}) => (
  <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50">
    <p className="text-xs text-muted-foreground mb-2">{label}</p>
    <p 
      className="text-2xl text-foreground"
      style={{ 
        fontFamily: font.name,
        fontWeight: font.weight || 'normal',
        fontStyle: font.style || 'normal',
      }}
    >
      Aa Bb Cc 123
    </p>
    <p className="text-sm text-muted-foreground mt-2">
      {font.name}
      {font.weight && ` • ${font.weight}`}
      {font.style && ` • ${font.style}`}
    </p>
  </div>
);

const BrandKitDisplayComponent = ({ data, className }: BrandKitDisplayProps) => {
  // Build color palette from various formats
  const colorPalette = data.colors.palette || [
    data.colors.primary && { name: 'Primary', hex: data.colors.primary, usage: 'Main brand color' },
    data.colors.secondary && { name: 'Secondary', hex: data.colors.secondary, usage: 'Supporting color' },
    data.colors.accent && { name: 'Accent', hex: data.colors.accent, usage: 'Highlights & CTAs' },
    data.colors.background && { name: 'Background', hex: data.colors.background, usage: 'Page backgrounds' },
    data.colors.text && { name: 'Text', hex: data.colors.text, usage: 'Body text' },
  ].filter(Boolean) as Array<{ name: string; hex: string; usage?: string }>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20",
        "border border-purple-200/50 dark:border-purple-800/30",
        "shadow-xl",
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {data.name || 'Brand Kit'}
            </h3>
            <p className="text-sm text-muted-foreground">Visual Identity Guidelines</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Color Palette */}
        {colorPalette.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-purple-500" />
              <h4 className="text-sm font-semibold text-foreground">Color Palette</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {colorPalette.map((color, idx) => (
                <ColorSwatch 
                  key={color.name + idx} 
                  name={color.name} 
                  hex={color.hex}
                  usage={color.usage}
                />
              ))}
            </div>
          </div>
        )}

        {/* Typography */}
        {data.fonts && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-purple-500" />
              <h4 className="text-sm font-semibold text-foreground">Typography</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.fonts.heading && (
                <FontPreview label="Headings" font={data.fonts.heading} />
              )}
              {data.fonts.body && (
                <FontPreview label="Body Text" font={data.fonts.body} />
              )}
              {data.fonts.accent && (
                <FontPreview label="Accents" font={data.fonts.accent} />
              )}
            </div>
          </div>
        )}

        {/* Logo Variations */}
        {data.logo && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-purple-500" />
              <h4 className="text-sm font-semibold text-foreground">Logo Variations</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.logo.primary && (
                <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center">
                  <img src={data.logo.primary} alt="Primary Logo" className="max-h-16 object-contain" />
                </div>
              )}
              {data.logo.light && (
                <div className="p-6 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center">
                  <img src={data.logo.light} alt="Light Logo" className="max-h-16 object-contain" />
                </div>
              )}
              {data.logo.dark && (
                <div className="p-6 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                  <img src={data.logo.dark} alt="Dark Logo" className="max-h-16 object-contain" />
                </div>
              )}
              {data.logo.icon && (
                <div className="p-6 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center">
                  <img src={data.logo.icon} alt="Icon" className="max-h-12 object-contain" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Brand Voice */}
        {data.voice && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h4 className="text-sm font-semibold text-foreground">Brand Voice</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tone */}
              {data.voice.tone && data.voice.tone.length > 0 && (
                <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-xs text-muted-foreground mb-2">Tone</p>
                  <div className="flex flex-wrap gap-2">
                    {data.voice.tone.map((t, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Personality */}
              {data.voice.personality && (
                <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-xs text-muted-foreground mb-2">Personality</p>
                  <p className="text-sm text-foreground">{data.voice.personality}</p>
                </div>
              )}

              {/* Do's */}
              {data.voice.doList && data.voice.doList.length > 0 && (
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/30">
                  <p className="text-xs text-green-700 dark:text-green-400 mb-2 font-medium">✓ Do</p>
                  <ul className="space-y-1">
                    {data.voice.doList.map((item, i) => (
                      <li key={i} className="text-sm text-green-800 dark:text-green-300">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Don'ts */}
              {data.voice.dontList && data.voice.dontList.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30">
                  <p className="text-xs text-red-700 dark:text-red-400 mb-2 font-medium">✗ Don't</p>
                  <ul className="space-y-1">
                    {data.voice.dontList.map((item, i) => (
                      <li key={i} className="text-sm text-red-800 dark:text-red-300">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const BrandKitDisplay = memo(BrandKitDisplayComponent);
