

## Fix PDF Export: Brain Logo and Direct Download

This plan addresses two issues with the PDF export functionality:

1. **Logo shows blue "AYN" box instead of the brain logo**
2. **PDF opens in a new blank tab instead of downloading directly**

---

### Root Cause Analysis

| Issue | Location | Problem |
|-------|----------|---------|
| Wrong logo | `supabase/functions/generate-engineering-pdf/index.ts` lines 354, 419 | Hardcoded CSS box with "AYN" text and blue gradient |
| Opens new tab | `src/components/engineering/workspace/EngineeringWorkspace.tsx` lines 226-236 | Uses `window.open()` + `print()` instead of direct download |

---

### Solution Overview

**Approach 1 (Recommended)**: Use `react-to-pdf` library like `ParkingDesigner.tsx` and `CalculationResults.tsx` already do - this provides direct PDF download

**Approach 2**: Modify the edge function to return actual PDF bytes and use jsPDF with embedded logo

I recommend Approach 1 because:
- The library is already installed and used elsewhere
- Provides true direct download
- No need to embed images in edge functions

---

### Implementation Details

#### 1. Update Edge Function Logo (for print preview)

**File**: `supabase/functions/generate-engineering-pdf/index.ts`

Replace the blue box logo with an SVG brain icon matching the brand:

```css
/* Current (line 354) */
.logo { width: 50px; height: 50px; background: linear-gradient(135deg, #2563eb, #06b6d4); ... }

/* New - Black circle with white brain icon */
.logo { 
  width: 50px; 
  height: 50px; 
  background: #1a1a1a; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}
```

Replace the HTML (line 419):
```html
<!-- Current -->
<div class="logo">AYN</div>

<!-- New - SVG brain icon -->
<div class="logo">
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
    <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
    <path d="M6 18a4 4 0 0 1-1.967-.516"/>
    <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
  </svg>
</div>
```

---

#### 2. Change PDF Export to Direct Download

**File**: `src/components/engineering/workspace/EngineeringWorkspace.tsx`

Replace the current `handleExportPDF` implementation (lines 201-244) with `react-to-pdf` approach:

```typescript
import generatePDF, { Margin } from 'react-to-pdf';

const handleExportPDF = useCallback(async () => {
  if (!selectedCalculator) {
    toast.error('Please select a calculator first');
    return;
  }
  if (!currentOutputs && !calculationResult) {
    toast.error('Please run a calculation first');
    return;
  }

  try {
    toast.loading('Generating PDF report...', { id: 'pdf-export' });
    
    // Create a temporary container with the report HTML
    const tempDiv = document.createElement('div');
    tempDiv.id = 'pdf-report-temp';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    
    // Fetch HTML from edge function
    const { data, error } = await supabase.functions.invoke('generate-engineering-pdf', {
      body: {
        type: selectedCalculator,
        inputs: currentInputs,
        outputs: currentOutputs || calculationResult?.outputs || {},
        buildingCode: selectedBuildingCode,
        projectName: `${selectedCalculator.charAt(0).toUpperCase() + selectedCalculator.slice(1).replace('_', ' ')} Design`,
      }
    });

    if (error) throw error;
    
    // Parse and inject HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.html, 'text/html');
    const pageContent = doc.querySelector('.page');
    if (pageContent) {
      tempDiv.innerHTML = pageContent.outerHTML;
    } else {
      tempDiv.innerHTML = data.html;
    }
    document.body.appendChild(tempDiv);
    
    // Generate and download PDF directly
    await generatePDF(() => tempDiv, {
      filename: `${selectedCalculator}-design-${Date.now().toString(36).toUpperCase()}.pdf`,
      page: {
        margin: Margin.MEDIUM,
        format: 'A4',
        orientation: 'portrait',
      },
      canvas: {
        mimeType: 'image/jpeg',
        qualityRatio: 0.98,
      },
    });
    
    // Cleanup
    document.body.removeChild(tempDiv);
    
    toast.success('PDF report downloaded', { id: 'pdf-export' });
    session?.trackExport?.('pdf');
  } catch (error) {
    console.error('PDF export error:', error);
    toast.error('Failed to generate PDF', { id: 'pdf-export' });
  }
}, [selectedCalculator, currentInputs, currentOutputs, calculationResult, selectedBuildingCode, session]);
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-engineering-pdf/index.ts` | Update CSS logo style and replace "AYN" box with brain SVG icon |
| `src/components/engineering/workspace/EngineeringWorkspace.tsx` | Replace `window.open()` + `print()` with `react-to-pdf` direct download |

---

### Expected Behavior After Fix

| Before | After |
|--------|-------|
| Blue gradient box with "AYN" text | Black circle with white brain icon |
| Opens `about:blank` tab with print dialog | Downloads PDF file directly to device |
| User must manually "Save as PDF" from print | Automatic file download with proper filename |

---

### Technical Notes

1. **react-to-pdf** is already installed (version ^3.0.0) and used in `ParkingDesigner.tsx` and `CalculationResults.tsx`

2. The brain SVG matches the Lucide `Brain` icon used throughout the app

3. The edge function HTML will continue to work for any fallback/print scenarios, but with the correct branding

4. PDF filename will be auto-generated like: `beam-design-A1B2C3.pdf`

