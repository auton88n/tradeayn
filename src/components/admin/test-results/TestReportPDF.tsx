import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration_ms?: number;
  error_message?: string | null;
}

interface BugReport {
  endpoint: string;
  bugType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestedFix: string;
}

interface TestReportPDFProps {
  categoryName: string;
  tests?: TestResult[];
  bugs?: BugReport[];
  grade?: string;
  passRate?: number;
  lastRun?: Date;
}

export function TestReportPDF({ 
  categoryName, 
  tests = [], 
  bugs = [],
  grade,
  passRate,
  lastRun 
}: TestReportPDFProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const passed = tests.filter(t => t.status === 'passed').length;
      const failed = tests.filter(t => t.status === 'failed').length;
      const critical = bugs.filter(b => b.severity === 'critical').length;
      const high = bugs.filter(b => b.severity === 'high').length;

      const reportHtml = `
        <div style="font-family: Arial, sans-serif; padding: 30px; color: #1a1a1a;">
          <div style="border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="margin: 0; color: #1a1a1a; font-size: 28px;">${categoryName} Test Report</h1>
            <p style="margin: 10px 0 0 0; color: #666;">Generated: ${new Date().toLocaleString()}</p>
            ${lastRun ? `<p style="margin: 5px 0 0 0; color: #666;">Last Run: ${lastRun.toLocaleString()}</p>` : ''}
          </div>

          <div style="display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap;">
            ${tests.length > 0 ? `
              <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 15px 25px; border-radius: 8px;">
                <p style="margin: 0; color: #166534; font-size: 12px;">PASSED</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #166534;">${passed}</p>
              </div>
              <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 15px 25px; border-radius: 8px;">
                <p style="margin: 0; color: #991b1b; font-size: 12px;">FAILED</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #991b1b;">${failed}</p>
              </div>
              <div style="background: #f5f3ff; border: 1px solid #c4b5fd; padding: 15px 25px; border-radius: 8px;">
                <p style="margin: 0; color: #5b21b6; font-size: 12px;">TOTAL</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #5b21b6;">${tests.length}</p>
              </div>
              ${passRate !== undefined ? `
                <div style="background: #eff6ff; border: 1px solid #93c5fd; padding: 15px 25px; border-radius: 8px;">
                  <p style="margin: 0; color: #1e40af; font-size: 12px;">PASS RATE</p>
                  <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1e40af;">${passRate.toFixed(0)}%</p>
                </div>
              ` : ''}
              ${grade ? `
                <div style="background: #fefce8; border: 1px solid #fde047; padding: 15px 25px; border-radius: 8px;">
                  <p style="margin: 0; color: #854d0e; font-size: 12px;">GRADE</p>
                  <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #854d0e;">${grade}</p>
                </div>
              ` : ''}
            ` : ''}
            ${bugs.length > 0 ? `
              <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 15px 25px; border-radius: 8px;">
                <p style="margin: 0; color: #991b1b; font-size: 12px;">CRITICAL</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #991b1b;">${critical}</p>
              </div>
              <div style="background: #fff7ed; border: 1px solid #fdba74; padding: 15px 25px; border-radius: 8px;">
                <p style="margin: 0; color: #9a3412; font-size: 12px;">HIGH</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #9a3412;">${high}</p>
              </div>
              <div style="background: #f5f3ff; border: 1px solid #c4b5fd; padding: 15px 25px; border-radius: 8px;">
                <p style="margin: 0; color: #5b21b6; font-size: 12px;">TOTAL BUGS</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #5b21b6;">${bugs.length}</p>
              </div>
            ` : ''}
          </div>

          ${tests.length > 0 ? `
            <h2 style="color: #1a1a1a; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Test Results</h2>
            ${tests.map(t => `
              <div style="margin: 15px 0; padding: 15px; background: ${t.status === 'passed' ? '#f0fdf4' : t.status === 'failed' ? '#fef2f2' : '#fefce8'}; border-radius: 8px; border-left: 4px solid ${t.status === 'passed' ? '#22c55e' : t.status === 'failed' ? '#ef4444' : '#eab308'};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="color: #1a1a1a;">${t.name}</strong>
                  <span style="background: ${t.status === 'passed' ? '#22c55e' : t.status === 'failed' ? '#ef4444' : '#eab308'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">${t.status.toUpperCase()}</span>
                </div>
                ${t.duration_ms ? `<p style="margin: 8px 0 0 0; color: #666; font-size: 13px;">Duration: ${t.duration_ms}ms</p>` : ''}
                ${t.error_message ? `<p style="margin: 8px 0 0 0; color: #dc2626; font-size: 13px;">Error: ${t.error_message}</p>` : ''}
              </div>
            `).join('')}
          ` : ''}

          ${bugs.length > 0 ? `
            <h2 style="color: #1a1a1a; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-top: 30px;">Bug Reports</h2>
            ${bugs.map(b => {
              const severityColors: Record<string, { bg: string; border: string; text: string }> = {
                critical: { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' },
                high: { bg: '#fff7ed', border: '#f97316', text: '#ea580c' },
                medium: { bg: '#fefce8', border: '#eab308', text: '#ca8a04' },
                low: { bg: '#eff6ff', border: '#3b82f6', text: '#2563eb' }
              };
              const colors = severityColors[b.severity] || severityColors.low;
              return `
                <div style="margin: 15px 0; padding: 15px; background: ${colors.bg}; border-radius: 8px; border-left: 4px solid ${colors.border};">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong style="color: #1a1a1a;">${b.endpoint}</strong>
                    <span style="background: ${colors.border}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">${b.severity.toUpperCase()}</span>
                  </div>
                  <p style="margin: 0; color: #666; font-size: 13px;"><strong>Type:</strong> ${b.bugType}</p>
                  <p style="margin: 8px 0 0 0; color: #1a1a1a; font-size: 13px;"><strong>Description:</strong> ${b.description}</p>
                  <p style="margin: 8px 0 0 0; color: ${colors.text}; font-size: 13px;"><strong>Suggested Fix:</strong> ${b.suggestedFix}</p>
                </div>
              `;
            }).join('')}
          ` : ''}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; text-align: center;">
            <p>AYN Platform - Test Results Report</p>
          </div>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: `${categoryName.replace(/\s+/g, '-')}-Report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(reportHtml).save();
      toast.success('PDF report downloaded');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={generatePDF}
      disabled={isGenerating || (tests.length === 0 && bugs.length === 0)}
      className="h-7 px-2"
    >
      {isGenerating ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <FileDown className="h-3 w-3" />
      )}
      <span className="ml-1 hidden sm:inline">PDF</span>
    </Button>
  );
}

export default TestReportPDF;
