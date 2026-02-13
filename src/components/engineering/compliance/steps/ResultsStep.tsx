import React from 'react';
import { ComplianceResultCard } from '../ComplianceResultCard';
import { ComplianceSummaryBadge } from '../ComplianceSummaryBadge';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { ComplianceResult } from '../utils/complianceEngine';

interface Props {
  results: ComplianceResult[];
  passed: number;
  failed: number;
  warnings: number;
  codeSystem: string;
  onStartNew: () => void;
}

// Group results by category
const CATEGORY_LABELS: Record<string, string> = {
  room_size: 'Room Sizes',
  ceiling_height: 'Ceiling Heights',
  lighting_ventilation: 'Light & Ventilation',
  egress: 'Egress Windows',
  stairs: 'Stairs',
  handrails: 'Handrails',
  guards: 'Guards',
  hallways_doors: 'Doors & Hallways',
  fire_separation: 'Fire Separation',
  alarms: 'Smoke & CO Alarms',
  bathroom: 'Bathroom',
  foundation: 'Foundation',
  structural_loads: 'Structural Loads',
  energy: 'Energy Efficiency',
  radon: 'Radon',
  accessibility: 'Accessibility',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
};

export const ResultsStep: React.FC<Props> = ({ results, passed, failed, warnings, codeSystem, onStartNew }) => {
  const total = passed + failed + warnings;
  
  // Group by category
  const grouped = results.reduce<Record<string, ComplianceResult[]>>((acc, r) => {
    const cat = r.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compliance Results</h3>
          <p className="text-sm text-muted-foreground">{codeSystem === 'IRC_2024' ? 'IRC 2024' : 'NBC 2025'} Compliance Report</p>
        </div>
        <Button onClick={onStartNew} variant="outline" size="sm" className="gap-1">
          <RotateCcw className="w-4 h-4" /> Start New
        </Button>
      </div>

      <ComplianceSummaryBadge passed={passed} failed={failed} warnings={warnings} total={total} />

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            {CATEGORY_LABELS[category] || category}
          </h4>
          {items.map((r, i) => <ComplianceResultCard key={`${category}-${r.requirement_name || i}`} result={r} />)}
        </div>
      ))}

      <div className="p-4 rounded-xl border border-border/50 bg-muted/30 text-xs text-muted-foreground space-y-1">
        <p>This report is based on the {codeSystem === 'IRC_2024' ? 'IRC 2024' : 'NBC 2025'}.</p>
        <p>Verify with your local authority — some jurisdictions may enforce amendments.</p>
        <p className="font-medium">A licensed professional must review and stamp calculations before permit submission.</p>
      </div>
    </div>
  );
};
