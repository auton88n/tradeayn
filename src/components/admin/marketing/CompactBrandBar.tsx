import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X, Upload, ChevronDown } from 'lucide-react';
import { AynEyeIcon } from './AynEyeIcon';
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
  if (logoUrl) localStorage.setItem(LOGO_STORAGE_KEY, logoUrl);
  else localStorage.removeItem(LOGO_STORAGE_KEY);
}

interface CompactBrandBarProps {
  onBrandKitChange?: (kit: BrandKitState) => void;
  externalColors?: { name: string; hex: string }[] | null;
}

export const CompactBrandBar = ({ onBrandKitChange, externalColors }: CompactBrandBarProps) => {
  const [brandKit, setBrandKit] = useState<BrandKitState>(loadBrandKit);
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<BrandKitState>(brandKit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalColors?.length) {
      setBrandKit(prev => {
        const updated = { ...prev, colors: externalColors };
        saveBrandKit(updated);
        return updated;
      });
    }
  }, [externalColors]);

  useEffect(() => { onBrandKitChange?.(brandKit); }, [brandKit, onBrandKitChange]);

  const startEdit = () => { setEditDraft({ ...brandKit, colors: brandKit.colors.map(c => ({ ...c })), traits: [...brandKit.traits] }); setIsEditing(true); setExpanded(true); };
  const saveEdit = () => { setBrandKit(editDraft); saveBrandKit(editDraft); setIsEditing(false); };
  const cancelEdit = () => setIsEditing(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await browserImageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 256, useWebWorker: true });
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (isEditing) setEditDraft(prev => ({ ...prev, logoUrl: dataUrl }));
        else setBrandKit(prev => { const u = { ...prev, logoUrl: dataUrl }; saveBrandKit(u); return u; });
      };
      reader.readAsDataURL(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setBrandKit(prev => { const u = { ...prev, logoUrl: dataUrl }; saveBrandKit(u); return u; });
      };
      reader.readAsDataURL(file);
    }
  };

  const kit = isEditing ? editDraft : brandKit;
  const Logo = ({ size }: { size: number }) => kit.logoUrl
    ? <img src={kit.logoUrl} alt="Logo" className="object-contain" style={{ width: size, height: size }} />
    : <AynEyeIcon size={size} className="text-background" />;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Compact bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => fileInputRef.current?.click()} className="relative group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center overflow-hidden shadow-md">
            <Logo size={20} />
          </div>
          <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload className="w-3 h-3 text-white" />
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">AYN</p>
          <p className="text-[10px] text-muted-foreground truncate italic">"{kit.tagline}"</p>
        </div>

        <div className="flex items-center gap-1.5">
          {kit.colors.slice(0, 5).map((c, i) => (
            <div key={i} className="w-4 h-4 rounded-full border border-border shadow-sm" style={{ backgroundColor: c.hex }} title={c.name} />
          ))}
        </div>

        <div className="flex items-center gap-1">
          {!isEditing && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={startEdit}>
              <Pencil className="w-3 h-3" />
            </Button>
          )}
          {isEditing && (
            <>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}><X className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}><Check className="w-3 h-3" /></Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setExpanded(!expanded)}>
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
          {isEditing ? (
            <>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tagline</label>
                <Input value={editDraft.tagline} onChange={(e) => setEditDraft(prev => ({ ...prev, tagline: e.target.value }))} className="h-8 text-xs mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Colors</label>
                <div className="flex gap-3 mt-1 flex-wrap">
                  {editDraft.colors.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <input type="color" value={c.hex} onChange={(e) => {
                        const colors = [...editDraft.colors]; colors[i] = { ...colors[i], hex: e.target.value };
                        setEditDraft(prev => ({ ...prev, colors }));
                      }} className="w-8 h-8 rounded-lg cursor-pointer border border-border p-0" />
                      <Input value={c.name} onChange={(e) => {
                        const colors = [...editDraft.colors]; colors[i] = { ...colors[i], name: e.target.value };
                        setEditDraft(prev => ({ ...prev, colors }));
                      }} className="text-[9px] h-5 w-16 px-1 text-center" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Traits</label>
                <div className="flex gap-2 mt-1">
                  {editDraft.traits.map((t, i) => (
                    <Input key={i} value={t} onChange={(e) => {
                      const traits = [...editDraft.traits]; traits[i] = e.target.value;
                      setEditDraft(prev => ({ ...prev, traits }));
                    }} className="text-[10px] h-6 w-24 px-2" />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-4 flex-wrap">
                {kit.colors.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-lg shadow-sm border border-border" style={{ backgroundColor: c.hex }} />
                    <span className="text-[9px] text-muted-foreground">{c.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                {kit.traits.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
                ))}
              </div>
              <div className="space-y-1">
                {kit.fonts.map(f => (
                  <div key={f.name} className="flex items-baseline gap-3 text-[11px]">
                    <span className="text-muted-foreground w-16 shrink-0">{f.usage}</span>
                    <span style={{ fontFamily: f.name }}>{f.sample}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
