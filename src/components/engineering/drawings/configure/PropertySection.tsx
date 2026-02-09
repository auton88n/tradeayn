import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Compass, Ruler, Trees, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { InputSection } from '@/components/engineering/ui/InputSection';
import type {
  PropertyData,
  CardinalDirection,
  LotShape,
  SlopeType,
  DrivewayLocation,
  ProximityLevel,
} from './types';

interface PropertySectionProps {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
}

const DIRECTIONS: { value: CardinalDirection; label: string }[] = [
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
];

const LOT_SHAPES: { value: LotShape; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'square', label: 'Square' },
  { value: 'l-shaped', label: 'L-Shaped' },
  { value: 'irregular', label: 'Irregular' },
];

const SLOPES: { value: SlopeType; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'gentle', label: 'Gentle' },
  { value: 'steep', label: 'Steep' },
];

const DRIVEWAY_OPTIONS: { value: DrivewayLocation; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'center', label: 'Center' },
];

const PROXIMITY_OPTIONS: { value: ProximityLevel; label: string }[] = [
  { value: 'close', label: 'Close' },
  { value: 'medium', label: 'Medium' },
  { value: 'far', label: 'Far' },
];

const DEFAULT_SETBACKS = { front: 25, rear: 20, left: 5, right: 5 };

const animationProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.25, ease: 'easeInOut' as const },
};

// Reusable pill button for selections
function Pill<T extends string>({
  value,
  label,
  selected,
  onSelect,
}: {
  value: T;
  label: string;
  selected: boolean;
  onSelect: (v: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border text-muted-foreground hover:border-primary/50'
      )}
    >
      {label}
    </button>
  );
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Pill
          key={o.value}
          value={o.value}
          label={o.label}
          selected={value === o.value}
          onSelect={onChange}
        />
      ))}
    </div>
  );
}

export const PropertySection: React.FC<PropertySectionProps> = ({ data, onChange }) => {
  const update = (patch: Partial<PropertyData>) => onChange({ ...data, ...patch });
  const hasLot = data.has_specific_lot;

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex items-center justify-center gap-2">
        {[
          { val: true, label: 'Yes, I have a property' },
          { val: false, label: 'Not yet — just exploring' },
        ].map((opt) => (
          <button
            key={String(opt.val)}
            type="button"
            onClick={() => update({ has_specific_lot: opt.val })}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium border transition-all',
              hasLot === opt.val
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!hasLot ? (
          <motion.div key="exploring" {...animationProps} className="space-y-5">
            {/* Front direction preference */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Which direction would you like the front of your house to face?
              </Label>
              <p className="text-xs text-muted-foreground">
                This helps AYN plan sunlight in your rooms
              </p>
              <PillGroup
                options={DIRECTIONS}
                value={data.preferred_front_direction}
                onChange={(v) => update({ preferred_front_direction: v })}
              />
            </div>

            {/* View preference */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Is there a direction you'd love views toward?
              </Label>
              <PillGroup
                options={[...DIRECTIONS, { value: 'none' as CardinalDirection | 'none', label: 'No preference' }]}
                value={data.view_direction}
                onChange={(v) => update({ view_direction: v })}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div key="has-lot" {...animationProps} className="space-y-4">
            {/* Lot Dimensions */}
            <InputSection title="Lot Dimensions" icon={Ruler} defaultOpen>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Lot Shape</Label>
                  <PillGroup
                    options={LOT_SHAPES}
                    value={data.lot_shape}
                    onChange={(v) => update({ lot_shape: v })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Width (ft)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 60"
                      value={data.lot_width_ft ?? ''}
                      onChange={(e) =>
                        update({ lot_width_ft: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Depth (ft)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 120"
                      value={data.lot_depth_ft ?? ''}
                      onChange={(e) =>
                        update({ lot_depth_ft: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                </div>
              </div>
            </InputSection>

            {/* Street & Orientation */}
            <InputSection title="Street & Orientation" icon={Compass} defaultOpen>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Which side of your lot faces the street?
                  </Label>
                  <PillGroup
                    options={DIRECTIONS}
                    value={data.street_direction}
                    onChange={(v) => update({ street_direction: v })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Driveway Location</Label>
                  <PillGroup
                    options={DRIVEWAY_OPTIONS}
                    value={data.driveway_location}
                    onChange={(v) => update({ driveway_location: v })}
                  />
                </div>
              </div>
            </InputSection>

            {/* Setbacks */}
            <InputSection title="Setbacks" icon={MapPin} defaultOpen>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={data.use_default_setbacks !== false}
                    onCheckedChange={(checked) => {
                      update({
                        use_default_setbacks: checked,
                        setbacks: checked ? DEFAULT_SETBACKS : (data.setbacks ?? DEFAULT_SETBACKS),
                      });
                    }}
                  />
                  <Label className="text-sm">Use local defaults</Label>
                </div>

                <AnimatePresence>
                  {data.use_default_setbacks === false && (
                    <motion.div {...animationProps} className="grid grid-cols-2 gap-3">
                      {(['front', 'rear', 'left', 'right'] as const).map((side) => (
                        <div key={side}>
                          <Label className="text-sm font-medium mb-1 block capitalize">
                            {side === 'left' ? 'Left Side' : side === 'right' ? 'Right Side' : side} (ft)
                          </Label>
                          <Input
                            type="number"
                            value={data.setbacks?.[side] ?? DEFAULT_SETBACKS[side]}
                            onChange={(e) =>
                              update({
                                setbacks: {
                                  ...(data.setbacks ?? DEFAULT_SETBACKS),
                                  [side]: Number(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </InputSection>

            {/* Lot Features */}
            <InputSection title="Lot Features" icon={Trees} defaultOpen={false}>
              <div className="space-y-4">
                {/* Trees */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={data.trees_to_preserve ?? false}
                    onCheckedChange={(v) => update({ trees_to_preserve: v })}
                  />
                  <Label className="text-sm">Trees to preserve on lot</Label>
                </div>

                {/* Slope */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Slope</Label>
                  <PillGroup
                    options={SLOPES}
                    value={data.slope}
                    onChange={(v) => update({ slope: v })}
                  />
                </div>

                {/* View direction */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Best View Direction</Label>
                  <PillGroup
                    options={[...DIRECTIONS, { value: 'none' as CardinalDirection | 'none', label: 'None' }]}
                    value={data.view_direction}
                    onChange={(v) => update({ view_direction: v })}
                  />
                </div>

                {/* Neighbor proximity */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium block">Neighbor Proximity</Label>
                  {(['left', 'right'] as const).map((side) => (
                    <div key={side} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-10 capitalize">{side}</span>
                      <PillGroup
                        options={PROXIMITY_OPTIONS}
                        value={data.neighbor_proximity?.[side]}
                        onChange={(v) =>
                          update({
                            neighbor_proximity: {
                              left: data.neighbor_proximity?.left ?? 'medium',
                              right: data.neighbor_proximity?.right ?? 'medium',
                              [side]: v,
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </InputSection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PropertySection;
