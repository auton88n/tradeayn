import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STYLE_PRESETS = [
  { id: 'modern', label: 'Modern', emoji: '🏢' },
  { id: 'modern_farmhouse', label: 'Modern Farmhouse', emoji: '🏡' },
  { id: 'craftsman', label: 'Craftsman', emoji: '🔨' },
  { id: 'colonial', label: 'Colonial', emoji: '🏛️' },
  { id: 'ranch', label: 'Ranch', emoji: '🌾' },
  { id: 'mid_century', label: 'Mid-Century', emoji: '🪩' },
  { id: 'mediterranean', label: 'Mediterranean', emoji: '🌊' },
  { id: 'coastal', label: 'Coastal', emoji: '🏖️' },
  { id: 'mountain_lodge', label: 'Mountain Lodge', emoji: '⛰️' },
  { id: 'minimalist', label: 'Minimalist', emoji: '◻️' },
  { id: 'traditional', label: 'Traditional', emoji: '🏠' },
  { id: 'custom', label: 'Custom', emoji: '✏️' },
] as const;

const MATERIALS = ['Stone', 'Wood', 'Brick', 'Stucco', 'Metal', 'Glass', 'Concrete', 'Vinyl'];

interface DrawingRequestFormProps {
  onGenerate: (params: any) => void;
  isGenerating: boolean;
}

export const DrawingRequestForm: React.FC<DrawingRequestFormProps> = ({ onGenerate, isGenerating }) => {
  const [style, setStyle] = useState('modern');
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [sqft, setSqft] = useState(1800);
  const [storeys, setStoreys] = useState(1);
  const [garage, setGarage] = useState<'none' | 'attached' | 'detached'>('attached');
  const [country, setCountry] = useState('US');
  const [stateProvince, setStateProvince] = useState('');
  const [materials, setMaterials] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const toggleMaterial = (m: string) => {
    setMaterials(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleSubmit = () => {
    onGenerate({
      style_preset: style,
      custom_description: description,
      num_bedrooms: bedrooms,
      num_bathrooms: bathrooms,
      target_sqft: sqft,
      num_storeys: storeys,
      has_garage: garage !== 'none',
      garage_type: garage,
      location_country: country,
      location_state_province: stateProvince,
      exterior_materials: materials,
    });
  };

  return (
    <div className="space-y-6">
      {/* Style Presets */}
      <div>
        <label className="text-sm font-medium mb-3 block">Architectural Style</label>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {STYLE_PRESETS.map(preset => (
            <motion.button
              key={preset.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStyle(preset.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all text-left",
                style === preset.id
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-base">{preset.emoji}</span>
              <span className="truncate">{preset.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Parameters Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Bedrooms: {bedrooms}</label>
            <Slider
              value={[bedrooms]} onValueChange={([v]) => setBedrooms(v)}
              min={1} max={6} step={1}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Bathrooms: {bathrooms}</label>
            <Slider
              value={[bathrooms]} onValueChange={([v]) => setBathrooms(v)}
              min={1} max={5} step={1}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Target Area: {sqft.toLocaleString()} sq ft</label>
            <Slider
              value={[sqft]} onValueChange={([v]) => setSqft(v)}
              min={800} max={5000} step={100}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Storeys: {storeys}</label>
            <Slider
              value={[storeys]} onValueChange={([v]) => setStoreys(v)}
              min={1} max={3} step={1}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Garage</label>
            <Select value={garage} onValueChange={(v) => setGarage(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Garage</SelectItem>
                <SelectItem value="attached">Attached</SelectItem>
                <SelectItem value="detached">Detached</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">State/Province</label>
              <Input
                value={stateProvince}
                onChange={e => setStateProvince(e.target.value)}
                placeholder="e.g., California"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Materials */}
      <div>
        <label className="text-sm font-medium mb-2 block">Exterior Materials (optional)</label>
        <div className="flex flex-wrap gap-2">
          {MATERIALS.map(m => (
            <button
              key={m}
              onClick={() => toggleMaterial(m)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                materials.includes(m)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Description */}
      <div>
        <label className="text-sm font-medium mb-2 block">Additional Requirements (optional)</label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g., Open concept living/dining, large kitchen island, walk-in closet in master, home office..."
          rows={3}
        />
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleSubmit}
        disabled={isGenerating}
        size="lg"
        className="w-full gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Generate Floor Plan
      </Button>
    </div>
  );
};

export default DrawingRequestForm;
