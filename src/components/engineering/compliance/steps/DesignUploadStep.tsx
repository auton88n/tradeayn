import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Upload, FileText, Trash2, Plus, AlertTriangle, RotateCcw,
  CheckCircle2, Loader2, Home, DoorOpen, ArrowUpDown, Wind, ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExtractedInput } from '../hooks/useFloorPlanAnalysis';

interface Props {
  phase: 'idle' | 'uploading' | 'analyzing' | 'extracting' | 'done' | 'error';
  extractedInputs: ExtractedInput[];
  notes: string;
  error: string | null;
  fileName: string;
  onFileSelected: (file: File) => void;
  onUpdateInput: (index: number, updates: Partial<ExtractedInput>) => void;
  onRemoveInput: (index: number) => void;
  onAddInput: (input: ExtractedInput) => void;
  onConfirm: () => void;
  onReUpload: () => void;
  onSwitchToManual: () => void;
  unitSystem: 'imperial' | 'metric';
}

export const DesignUploadStep: React.FC<Props> = ({
  phase, extractedInputs, notes, error, fileName,
  onFileSelected, onUpdateInput, onRemoveInput, onAddInput,
  onConfirm, onReUpload, onSwitchToManual, unitSystem,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelected(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  // Upload zone
  if (phase === 'idle' || phase === 'error') {
    return (
      <div className="space-y-4">
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-12 transition-all duration-300 cursor-pointer",
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
          onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
              isDragOver ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Upload Your Floor Plan</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                Drop your floor plan here — AYN will read it and extract all measurements automatically
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>PDF, PNG, JPG • Max 10MB</p>
            </div>
            <Button variant="outline" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              <FileText className="w-4 h-4 mr-2" /> Browse Files
            </Button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={onSwitchToManual}
          className="text-xs text-muted-foreground hover:text-primary underline block mx-auto transition-colors"
        >
          Don't have drawings? Enter measurements manually →
        </button>
      </div>
    );
  }

  // Analyzing state
  if (phase === 'uploading' || phase === 'analyzing' || phase === 'extracting') {
    const progressValue = phase === 'uploading' ? 20 : phase === 'analyzing' ? 60 : 90;
    const label = phase === 'uploading' ? 'Uploading...' : phase === 'analyzing' ? 'AYN is reading your floor plan...' : 'Extracting data...';

    return (
      <div className="flex flex-col items-center py-16 space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-primary" />
        </motion.div>
        <p className="text-lg font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{fileName}</p>
        <Progress value={progressValue} className="w-64" indicatorClassName="bg-gradient-to-r from-teal-500 to-cyan-500" />
        <div className="flex gap-6 text-xs text-muted-foreground">
          {['Uploading', 'Analyzing', 'Extracting'].map((s, i) => {
            const active = i === (phase === 'uploading' ? 0 : phase === 'analyzing' ? 1 : 2);
            const done = i < (phase === 'uploading' ? 0 : phase === 'analyzing' ? 1 : 2);
            return (
              <span key={s} className={cn(active && "text-primary font-medium", done && "text-primary")}>
                {done ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : null}
                {s}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // Review extracted data
  const grouped = {
    rooms: extractedInputs.filter(i => i.input_type === 'room').map((item, _, arr) => ({ item, idx: extractedInputs.indexOf(item) })),
    windows: extractedInputs.filter(i => i.input_type === 'window').map((item) => ({ item, idx: extractedInputs.indexOf(item) })),
    stairs: extractedInputs.filter(i => i.input_type === 'stair').map((item) => ({ item, idx: extractedInputs.indexOf(item) })),
    doors: extractedInputs.filter(i => i.input_type === 'door' || i.input_type === 'hallway').map((item) => ({ item, idx: extractedInputs.indexOf(item) })),
    alarms: extractedInputs.filter(i => i.input_type === 'alarm').map((item) => ({ item, idx: extractedInputs.indexOf(item) })),
  };

  const areaUnit = unitSystem === 'metric' ? 'm²' : 'sq ft';
  const lenUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const smallUnit = unitSystem === 'metric' ? 'mm' : 'in';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Extracted Data</h3>
          <p className="text-xs text-muted-foreground">Review and edit — yellow items need attention</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onReUpload} className="gap-1 text-xs">
          <RotateCcw className="w-3 h-3" /> Re-upload
        </Button>
      </div>

      {notes && (
        <div className="text-xs p-3 bg-muted/50 rounded-lg text-muted-foreground">
          <strong>AI Notes:</strong> {notes}
        </div>
      )}

      {/* Rooms */}
      <CategorySection icon={Home} title="Rooms" count={grouped.rooms.length}>
        {grouped.rooms.map(({ item, idx }) => (
          <ExtractedCard key={idx} low={item.confidence < 0.7} onRemove={() => onRemoveInput(idx)}>
            <EditableField label="Name" value={item.room_name || ''} onChange={(v) => onUpdateInput(idx, { room_name: v })} />
            <EditableField label={`Area (${areaUnit})`} value={item.room_area} onChange={(v) => onUpdateInput(idx, { room_area: Number(v) })} type="number" />
            <EditableField label={`Min dim (${lenUnit})`} value={item.room_min_dimension} onChange={(v) => onUpdateInput(idx, { room_min_dimension: Number(v) })} type="number" />
            <EditableField label={`Ceiling (${lenUnit})`} value={item.ceiling_height} onChange={(v) => onUpdateInput(idx, { ceiling_height: Number(v) })} type="number" />
          </ExtractedCard>
        ))}
        <AddButton label="Add Room" onClick={() => onAddInput({ input_type: 'room', unit_system: unitSystem, confidence: 1, room_type: 'habitable' })} />
      </CategorySection>

      {/* Windows */}
      <CategorySection icon={Wind} title="Windows" count={grouped.windows.length}>
        {grouped.windows.map(({ item, idx }) => (
          <ExtractedCard key={idx} low={item.confidence < 0.7} onRemove={() => onRemoveInput(idx)}>
            <EditableField label="Room" value={item.room_name || ''} onChange={(v) => onUpdateInput(idx, { room_name: v })} />
            <EditableField label={`Glazing (${areaUnit})`} value={item.window_glazing_area} onChange={(v) => onUpdateInput(idx, { window_glazing_area: Number(v) })} type="number" />
            <EditableField label={`Opening (${areaUnit})`} value={item.window_opening_area} onChange={(v) => onUpdateInput(idx, { window_opening_area: Number(v) })} type="number" />
            <EditableField label={`Sill (${smallUnit})`} value={item.window_sill_height} onChange={(v) => onUpdateInput(idx, { window_sill_height: Number(v) })} type="number" />
          </ExtractedCard>
        ))}
        <AddButton label="Add Window" onClick={() => onAddInput({ input_type: 'window', unit_system: unitSystem, confidence: 1 })} />
      </CategorySection>

      {/* Stairs */}
      <CategorySection icon={ArrowUpDown} title="Stairs" count={grouped.stairs.length}>
        {grouped.stairs.map(({ item, idx }) => (
          <ExtractedCard key={idx} low={item.confidence < 0.7} onRemove={() => onRemoveInput(idx)}>
            <EditableField label={`Width (${smallUnit})`} value={item.stair_width} onChange={(v) => onUpdateInput(idx, { stair_width: Number(v) })} type="number" />
            <EditableField label={`Riser (${smallUnit})`} value={item.stair_riser_height} onChange={(v) => onUpdateInput(idx, { stair_riser_height: Number(v) })} type="number" />
            <EditableField label={`Tread (${smallUnit})`} value={item.stair_tread_depth} onChange={(v) => onUpdateInput(idx, { stair_tread_depth: Number(v) })} type="number" />
            <EditableField label={`Headroom (${lenUnit})`} value={item.stair_headroom} onChange={(v) => onUpdateInput(idx, { stair_headroom: Number(v) })} type="number" />
          </ExtractedCard>
        ))}
        <AddButton label="Add Stair" onClick={() => onAddInput({ input_type: 'stair', unit_system: unitSystem, confidence: 1 })} />
      </CategorySection>

      {/* Doors & Hallways */}
      <CategorySection icon={DoorOpen} title="Doors & Hallways" count={grouped.doors.length}>
        {grouped.doors.map(({ item, idx }) => (
          <ExtractedCard key={idx} low={item.confidence < 0.7} onRemove={() => onRemoveInput(idx)}>
            <EditableField label="Name" value={item.room_name || item.input_type} onChange={(v) => onUpdateInput(idx, { room_name: v })} />
            <EditableField label={`Width (${smallUnit})`} value={item.door_width} onChange={(v) => onUpdateInput(idx, { door_width: Number(v) })} type="number" />
            <EditableField label={`Height (${lenUnit})`} value={item.door_height} onChange={(v) => onUpdateInput(idx, { door_height: Number(v) })} type="number" />
          </ExtractedCard>
        ))}
        <AddButton label="Add Door" onClick={() => onAddInput({ input_type: 'door', unit_system: unitSystem, confidence: 1 })} />
      </CategorySection>

      {/* Fire Safety */}
      <CategorySection icon={ShieldAlert} title="Fire Safety" count={grouped.alarms.length}>
        {grouped.alarms.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No fire safety items detected</p>
        )}
        <AddButton label="Add Alarm" onClick={() => onAddInput({ input_type: 'alarm', unit_system: unitSystem, confidence: 1, room_name: 'Building' })} />
      </CategorySection>

      <Button
        onClick={onConfirm}
        className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        size="lg"
      >
        <CheckCircle2 className="w-4 h-4" /> Confirm & Run Compliance Check
      </Button>
    </div>
  );
};

// --- Sub-components ---

function CategorySection({ icon: Icon, title, count, children }: { icon: any; title: string; count: number; children: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
          <span className="text-xs text-muted-foreground font-normal">({count})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {children}
      </CardContent>
    </Card>
  );
}

function ExtractedCard({ children, low, onRemove }: { children: React.ReactNode; low: boolean; onRemove: () => void }) {
  return (
    <div className={cn(
      "grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded-lg border text-sm",
      low ? "border-yellow-500/50 bg-yellow-500/5" : "border-border/50"
    )}>
      {children}
      <button onClick={onRemove} className="absolute top-1 right-1 text-muted-foreground hover:text-destructive hidden group-hover:block">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function EditableField({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-0.5">
      <label className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</label>
      <Input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="h-7 text-xs px-2"
      />
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-xs text-primary hover:underline">
      <Plus className="w-3 h-3" /> {label}
    </button>
  );
}
