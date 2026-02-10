import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ChevronDown, Pencil, Check, X, Upload } from 'lucide-react';
import { AynEyeIcon } from './AynEyeIcon';
import { Button } from '@/components/ui/button';
import browserImageCompression from 'browser-image-compression';

const STORAGE_KEY = 'ayn-brand-kit';
const LOGO_STORAGE_KEY = 'ayn-brand-kit-logo';

export interface BrandKitState {
  colors: { name: string; hex: string }[];
  fonts: { name: string; usage: string; sample: string }[];
  tagline: string;
  traits: string[];
  logoUrl?: string;
}

const defaultBrandKit: BrandKitState = {
  colors: [
    { name: 'Primary Blue', hex: '#0EA5E9' },
    { name: 'Foreground', hex: '#000000' },
    { name: 'Background', hex: '#FFFFFF' },
    { name: 'Muted', hex: '#6B7280' },
    { name: 'Success', hex: '#10B981' },
  ],
  fonts: [
    { name: 'Inter', usage: 'Primary UI', sample: 'The quick brown fox' },
    { name: 'JetBrains Mono', usage: 'Code & Data', sample: 'const ayn = true;' },
    { name: 'Playfair Display', usage: 'Display & Accent', sample: 'Engineering Excellence' },
  ],
  tagline: 'i see, i understand, i help',
  traits: ['Perceptive', 'Friendly', 'Intelligent'],
};

function loadBrandKit(): BrandKitState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const logo = localStorage.getItem(LOGO_STORAGE_KEY);
    if (stored) {
      const kit = JSON.parse(stored);
      if (logo) kit.logoUrl = logo;
      return kit;
    }
  } catch {}
  return defaultBrandKit;
}

function saveBrandKit(kit: BrandKitState) {
  const { logoUrl, ...rest } = kit;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  if (logoUrl) {
    localStorage.setItem(LOGO_STORAGE_KEY, logoUrl);
  } else {
    localStorage.removeItem(LOGO_STORAGE_KEY);
  }
}

interface BrandKitProps {
  onBrandKitChange?: (kit: BrandKitState) => void;
  externalColors?: { name: string; hex: string }[] | null;
}

export const BrandKit = ({ onBrandKitChange, externalColors }: BrandKitProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [brandKit, setBrandKit] = useState<BrandKitState>(loadBrandKit);
  const [editDraft, setEditDraft] = useState<BrandKitState>(brandKit);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalColors && externalColors.length > 0) {
      setBrandKit(prev => {
        const updated = { ...prev, colors: externalColors };
        saveBrandKit(updated);
        return updated;
      });
    }
  }, [externalColors]);

  useEffect(() => {
    onBrandKitChange?.(brandKit);
  }, [brandKit, onBrandKitChange]);

  const startEdit = () => {
    setEditDraft({ ...brandKit, colors: brandKit.colors.map(c => ({ ...c })), fonts: brandKit.fonts.map(f => ({ ...f })), traits: [...brandKit.traits] });
    setIsEditing(true);
  };

  const saveEdit = () => {
    setBrandKit(editDraft);
    saveBrandKit(editDraft);
    setIsEditing(false);
  };

  const cancelEdit = () => setIsEditing(false);

  const updateColor = (index: number, hex: string) => {
    setEditDraft(prev => {
      const colors = [...prev.colors];
      colors[index] = { ...colors[index], hex };
      return { ...prev, colors };
    });
  };

  const updateColorName = (index: number, name: string) => {
    setEditDraft(prev => {
      const colors = [...prev.colors];
      colors[index] = { ...colors[index], name };
      return { ...prev, colors };
    });
  };

  const updateTrait = (index: number, value: string) => {
    setEditDraft(prev => {
      const traits = [...prev.traits];
      traits[index] = value;
      return { ...prev, traits };
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, applyDirectly?: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await browserImageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 256,
        useWebWorker: true,
      });
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (applyDirectly) {
          // Direct update (from header click)
          setBrandKit(prev => {
            const updated = { ...prev, logoUrl: dataUrl };
            saveBrandKit(updated);
            return updated;
          });
        } else {
          // Update draft (in edit mode)
          setEditDraft(prev => ({ ...prev, logoUrl: dataUrl }));
        }
      };
      reader.readAsDataURL(compressed);
    } catch {
      // Fallback without compression
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (applyDirectly) {
          setBrandKit(prev => {
            const updated = { ...prev, logoUrl: dataUrl };
            saveBrandKit(updated);
            return updated;
          });
        } else {
          setEditDraft(prev => ({ ...prev, logoUrl: dataUrl }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setEditDraft(prev => ({ ...prev, logoUrl: undefined }));
  };

  const kit = isEditing ? editDraft : brandKit;

  const LogoDisplay = ({ size, className }: { size: number; className?: string }) => {
    if (kit.logoUrl) {
      return <img src={kit.logoUrl} alt="Brand logo" className={`object-contain ${className || ''}`} style={{ width: size, height: size }} />;
    }
    return <AynEyeIcon size={size} className={className} />;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden border-t-2 border-t-primary">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center relative shadow-lg overflow-hidden">
                <LogoDisplay size={28} className="text-background" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base tracking-tight">AYN Brand Kit</h3>
                <p className="text-xs text-muted-foreground">"{kit.tagline}"</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-5 space-y-5">
            {/* Edit toggle */}
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
                  <Button size="sm" onClick={saveEdit}><Check className="w-3.5 h-3.5 mr-1" /> Save</Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={startEdit}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
              )}
            </div>

            {/* Logo & Identity */}
            <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/30">
              <div className="relative group/logo">
                <div className="w-20 h-20 rounded-2xl bg-foreground flex items-center justify-center shadow-xl overflow-hidden">
                  <LogoDisplay size={44} className="text-background" />
                </div>
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Upload className="w-5 h-5 text-white" />
                  </button>
                )}
                {!isEditing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); headerFileInputRef.current?.click(); }}
                    className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Upload className="w-5 h-5 text-white" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoUpload(e, false)}
                />
                <input
                  ref={headerFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoUpload(e, true)}
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">AYN</h2>
                {isEditing ? (
                  <>
                    <Input
                      value={editDraft.tagline}
                      onChange={(e) => setEditDraft(prev => ({ ...prev, tagline: e.target.value }))}
                      className="text-sm h-8 w-64"
                      placeholder="Brand tagline..."
                    />
                    {editDraft.logoUrl && (
                      <Button size="sm" variant="ghost" className="text-xs h-6 text-destructive" onClick={removeLogo}>
                        <X className="w-3 h-3 mr-1" /> Remove logo
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic leading-relaxed">"{kit.tagline}"</p>
                )}
                <div className="flex gap-2">
                  {kit.traits.map((v, i) => (
                    isEditing ? (
                      <Input
                        key={i}
                        value={editDraft.traits[i]}
                        onChange={(e) => updateTrait(i, e.target.value)}
                        className="text-[10px] h-6 w-24 px-2"
                      />
                    ) : (
                      <span key={v} className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                        {v}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Brand Colors</h4>
              <div className="flex gap-4 flex-wrap">
                {kit.colors.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    {isEditing ? (
                      <>
                        <input
                          type="color"
                          value={editDraft.colors[i]?.hex || '#000000'}
                          onChange={(e) => updateColor(i, e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-border p-0 bg-transparent"
                        />
                        <Input
                          value={editDraft.colors[i]?.name || ''}
                          onChange={(e) => updateColorName(i, e.target.value)}
                          className="text-[10px] h-5 w-20 px-1 text-center"
                        />
                        <Input
                          value={editDraft.colors[i]?.hex || ''}
                          onChange={(e) => updateColor(i, e.target.value)}
                          className="text-[9px] h-5 w-20 px-1 font-mono text-center"
                        />
                      </>
                    ) : (
                      <>
                        <div
                          className="w-10 h-10 rounded-xl shadow-sm border"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                        <span className="text-[10px] font-medium text-muted-foreground">{c.name}</span>
                        <span className="text-[9px] text-muted-foreground/60 font-mono">{c.hex}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fonts */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Typography</h4>
              <div className="space-y-3">
                {kit.fonts.map((f) => (
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
