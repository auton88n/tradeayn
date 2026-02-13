// No external imports needed - uses Deno.serve

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceResult {
  requirement_clause: string;
  requirement_name: string;
  room_name: string;
  user_value: number | null;
  required_value: string;
  unit: string;
  status: 'pass' | 'fail' | 'warning';
  fix_suggestion?: string;
  category?: string;
}

interface CompliancePDFRequest {
  results: ComplianceResult[];
  passed: number;
  failed: number;
  warnings: number;
  codeSystem: string;
  projectName?: string;
}

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { results, passed, failed, warnings, codeSystem, projectName }: CompliancePDFRequest = await req.json();

    const timestamp = new Date().toISOString();
    const reportNumber = `AYN-CC-${Date.now().toString(36).toUpperCase()}`;
    const total = passed + failed + warnings;
    const passRate = Math.round((passed / Math.max(total, 1)) * 100);
    const codeLabel = codeSystem === 'IRC_2024' ? 'IRC 2024' : 'NBC 2025';

    const formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const formattedTime = new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });

    // Group results by category
    const grouped: Record<string, ComplianceResult[]> = {};
    for (const r of results) {
      const cat = r.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(r);
    }

    // Build category sections HTML
    const categorySections = Object.entries(grouped).map(([category, items]) => {
      const catLabel = CATEGORY_LABELS[category] || category;
      const rows = items.map(r => {
        const statusClass = r.status === 'pass' ? 'status-pass' : r.status === 'fail' ? 'status-fail' : 'status-warning';
        const statusLabel = r.status === 'pass' ? '✓ PASS' : r.status === 'fail' ? '✗ FAIL' : '⚠ WARNING';
        const valueStr = r.user_value !== null ? `${r.user_value} ${r.unit || ''}` : 'N/A';
        return `
          <tr>
            <td class="clause-cell">${r.requirement_clause || ''}</td>
            <td>${r.requirement_name || ''}</td>
            <td>${r.room_name || ''}</td>
            <td class="value-cell">${valueStr}</td>
            <td class="value-cell">${r.required_value || ''}</td>
            <td class="${statusClass}">${statusLabel}</td>
          </tr>
          ${r.status === 'fail' && r.fix_suggestion ? `<tr class="fix-row"><td colspan="6">→ ${r.fix_suggestion}</td></tr>` : ''}
        `;
      }).join('');

      return `
        <div class="category-section">
          <h3 class="category-header">${catLabel}</h3>
          <table>
            <thead>
              <tr>
                <th style="width:12%">Clause</th>
                <th style="width:22%">Requirement</th>
                <th style="width:16%">Location</th>
                <th style="width:16%">Actual</th>
                <th style="width:16%">Required</th>
                <th style="width:18%">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }).join('');

    // Count pages needed (rough estimate: ~12 results per page after header page)
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Compliance Report - ${reportNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; line-height: 1.4; color: #1a1a1a; background: #fff; }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 18mm 20mm;
      margin: 0;
      background: #fff;
      box-sizing: border-box;
    }
    .page:not(:last-child) {
      page-break-after: always;
    }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px; }
    .logo-section { display: flex; align-items: center; gap: 12px; }
    .logo { width: 48px; height: 48px; background: #1a1a1a; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .logo svg { width: 26px; height: 26px; }
    .company-name { font-size: 20px; font-weight: 700; color: #1a1a1a; }
    .company-tagline { font-size: 9px; color: #666; letter-spacing: 0.5px; }
    .report-meta { text-align: right; font-size: 9px; color: #666; line-height: 1.6; }
    .report-number { font-weight: 700; color: #1a1a1a; font-size: 10px; }

    /* Title */
    .title-section { margin-bottom: 20px; }
    .title { font-size: 18px; font-weight: 700; color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 14px; }
    .project-info { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .info-box { background: #f8fafc; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #2563eb; }
    .info-label { font-size: 8px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-weight: 600; color: #1a1a1a; font-size: 11px; }

    /* Summary */
    .summary-box { 
      display: flex; align-items: center; gap: 20px; 
      padding: 16px 20px; border-radius: 10px; margin-bottom: 24px;
      border: 2px solid ${failed > 0 ? '#fca5a5' : '#86efac'};
      background: ${failed > 0 ? '#fef2f2' : '#f0fdf4'};
    }
    .score-circle {
      width: 70px; height: 70px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800;
      background: ${failed > 0 ? '#fee2e2' : '#dcfce7'};
      color: ${failed > 0 ? '#dc2626' : '#16a34a'};
      border: 3px solid ${failed > 0 ? '#fca5a5' : '#86efac'};
      flex-shrink: 0;
    }
    .summary-title { font-size: 16px; font-weight: 700; color: #1a1a1a; }
    .summary-stats { display: flex; gap: 16px; margin-top: 4px; font-size: 11px; font-weight: 600; }
    .stat-pass { color: #16a34a; }
    .stat-fail { color: #dc2626; }
    .stat-warn { color: #d97706; }

    /* Category sections */
    .category-section { margin-bottom: 20px; page-break-inside: avoid; }
    .category-header { 
      font-size: 11px; font-weight: 700; color: #374151; 
      text-transform: uppercase; letter-spacing: 0.8px;
      border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 8px; 
    }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 4px; }
    th { background: #f1f5f9; padding: 6px 8px; text-align: left; font-weight: 600; border: 1px solid #e2e8f0; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px; }
    td { padding: 6px 8px; border: 1px solid #e2e8f0; }
    tr:nth-child(even):not(.fix-row) { background: #fafafa; }
    .clause-cell { font-family: 'Consolas', 'Courier New', monospace; font-size: 9px; color: #6b7280; }
    .value-cell { font-family: 'Consolas', monospace; font-weight: 500; }
    .status-pass { color: #16a34a; font-weight: 700; }
    .status-fail { color: #dc2626; font-weight: 700; }
    .status-warning { color: #d97706; font-weight: 700; }
    .fix-row td { background: #fef2f2; color: #dc2626; font-size: 9px; font-style: italic; border-top: none; padding-top: 2px; }

    /* Footer */
    .footer { 
      margin-top: auto; padding-top: 12px; border-top: 1px solid #e5e7eb; 
      font-size: 8px; color: #9ca3af; display: flex; justify-content: space-between; 
    }

    /* Disclaimer */
    .disclaimer { 
      margin-top: 24px; padding: 12px 16px; border-radius: 8px; 
      background: #fffbeb; border: 1px solid #fde68a; font-size: 9px; color: #92400e; line-height: 1.5; 
    }
    .disclaimer strong { color: #78350f; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M12 6v6l4 2"/>
            <circle cx="12" cy="12" r="3" fill="white" stroke="none"/>
          </svg>
        </div>
        <div>
          <div class="company-name">AYN</div>
          <div class="company-tagline">BUILDING CODE COMPLIANCE REPORT</div>
        </div>
      </div>
      <div class="report-meta">
        <div class="report-number">${reportNumber}</div>
        <div>${formattedDate}</div>
        <div>${formattedTime}</div>
      </div>
    </div>

    <!-- Title -->
    <div class="title-section">
      <div class="title">${projectName || 'Building Code Compliance Report'}</div>
      <div class="project-info">
        <div class="info-box">
          <div class="info-label">Code Standard</div>
          <div class="info-value">${codeLabel}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Total Checks</div>
          <div class="info-value">${total}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Pass Rate</div>
          <div class="info-value">${passRate}%</div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="summary-box">
      <div class="score-circle">${passRate}%</div>
      <div>
        <div class="summary-title">${failed === 0 ? 'All Checks Passed' : `${failed} Issue${failed !== 1 ? 's' : ''} Found`}</div>
        <div class="summary-stats">
          <span class="stat-pass">✓ ${passed} passed</span>
          ${failed > 0 ? `<span class="stat-fail">✗ ${failed} failed</span>` : ''}
          ${warnings > 0 ? `<span class="stat-warn">⚠ ${warnings} warnings</span>` : ''}
        </div>
      </div>
    </div>

    <!-- Results -->
    ${categorySections}

    <!-- Disclaimer -->
    <div class="disclaimer">
      <strong>Disclaimer:</strong> This report is generated based on the ${codeLabel} building code standard. 
      Verify all results with your local authority having jurisdiction — some jurisdictions may enforce amendments or additional requirements.
      <strong>A licensed professional must review and stamp calculations before permit submission.</strong>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span>Generated by AYN — Building Code Compliance Engine</span>
      <span>${reportNumber} • ${formattedDate}</span>
    </div>
  </div>
</body>
</html>`;

    return new Response(JSON.stringify({
      html: htmlContent,
      filename: `compliance-report-${reportNumber}.pdf`,
      reportNumber,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Compliance PDF generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
