import React, { useState, useCallback } from 'react';
import { ComplianceResultCard } from '../ComplianceResultCard';
import { ComplianceSummaryBadge } from '../ComplianceSummaryBadge';
import { Button } from '@/components/ui/button';
import { RotateCcw, FileDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  const [exporting, setExporting] = useState(false);
  
  // Group by category
  const grouped = results.reduce<Record<string, ComplianceResult[]>>((acc, r) => {
    const cat = r.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      toast.loading('Generating PDF report...', { id: 'compliance-pdf' });

      const { data, error } = await supabase.functions.invoke('generate-compliance-pdf', {
        body: {
          results,
          passed,
          failed,
          warnings,
          codeSystem,
          projectName: `${codeSystem === 'IRC_2024' ? 'IRC 2024' : 'NBC 2025'} Compliance Report`,
        },
      });

      if (error) throw error;

      // Create temp container for PDF rendering
      const tempDiv = document.createElement('div');
      tempDiv.id = 'compliance-pdf-temp';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm';
      tempDiv.style.background = 'white';

      // Parse and inject HTML with styles
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.html, 'text/html');
      const styleContent = doc.querySelector('style');
      const pageElements = doc.querySelectorAll('.page');

      let htmlContent = '';
      if (styleContent) htmlContent += styleContent.outerHTML;
      if (pageElements.length > 0) {
        pageElements.forEach(page => { htmlContent += page.outerHTML; });
      } else {
        htmlContent += doc.body.innerHTML;
      }

      tempDiv.innerHTML = htmlContent;
      document.body.appendChild(tempDiv);

      const { default: generatePDF, Margin } = await import('react-to-pdf');
      await generatePDF(() => tempDiv, {
        filename: data.filename || `compliance-report-${Date.now().toString(36).toUpperCase()}.pdf`,
        page: { margin: Margin.MEDIUM, format: 'A4', orientation: 'portrait' },
        canvas: { mimeType: 'image/jpeg', qualityRatio: 0.98 },
      });

      document.body.removeChild(tempDiv);
      toast.success('PDF report downloaded', { id: 'compliance-pdf' });
    } catch (err) {
      console.error('Compliance PDF export error:', err);
      toast.error('Failed to generate PDF', { id: 'compliance-pdf' });
    } finally {
      setExporting(false);
    }
  }, [results, passed, failed, warnings, codeSystem]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compliance Results</h3>
          <p className="text-sm text-muted-foreground">{codeSystem === 'IRC_2024' ? 'IRC 2024' : 'NBC 2025'} Compliance Report</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-1" disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {exporting ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button onClick={onStartNew} variant="outline" size="sm" className="gap-1">
            <RotateCcw className="w-4 h-4" /> Start New
          </Button>
        </div>
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
