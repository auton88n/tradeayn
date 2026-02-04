
  <goal>
    Stop the PDF from cutting the “Design Status” box (and other blocks) between pages. The export should paginate cleanly so each major block stays fully on one page.
  </goal>

  <what-is-happening>
    <summary>
      The current export uses react-to-pdf (html2canvas) which renders one tall “screenshot” of the whole report and then slices it into A4 pages. That slicing can happen through any element (like the green status box), regardless of CSS page-break rules.
    </summary>
    <evidence-from-screenshot>
      The status box is being split exactly at the page slice boundary: the top portion (checkmark) lands on page 1, while the rest of the box lands on page 2.
    </evidence-from-screenshot>
  </what-is-happening>

  <solution-overview>
    <approach>
      Force “real” pagination by restructuring the report HTML into multiple explicit A4-sized <div class="page"> containers (Page 1 and Page 2). This aligns the canvas slicing boundary with the boundary between pages, preventing any single box from being cut in half.
    </approach>
    <why-this-works>
      Instead of one long .page, we’ll return two (or more) fixed-height pages. The generator will capture both pages, and the PDF slicer will cut between them (not through them).
    </why-this-works>
  </solution-overview>

  <implementation-steps>
    <step number="1">
      <title>Update the edge function to output multiple pages</title>
      <files>
        <file>supabase/functions/generate-engineering-pdf/index.ts</file>
      </files>
      <changes>
        <item>
          Change the returned HTML structure from a single:
          <code>
            &lt;div class="page"&gt;...all content...&lt;/div&gt;
          </code>
          into two pages:
          <code>
            &lt;div class="page"&gt;...Header + Title + Sections 1–3...&lt;/div&gt;
            &lt;div class="page"&gt;...Section 4 + Disclaimer + Signatures + Footer...&lt;/div&gt;
          </code>
        </item>
        <item>
          Keep the “Design Status” box together by placing it entirely on Page 2 (so it can’t straddle a page boundary).
        </item>
        <item>
          Add/adjust CSS so each page is a true A4 canvas target:
          <code>
            .page { width: 210mm; height: 297mm; padding: 20mm; background: #fff; }
            .page:not(:last-child) { page-break-after: always; }
          </code>
        </item>
        <item>
          (Optional but recommended) Make each page layout more stable by using flex so the footer can sit at the bottom without weird spacing:
          <code>
            .page { display: flex; flex-direction: column; }
            .page-body { flex: 1; }
          </code>
          Then wrap page content in <code>.page-body</code> and keep the footer at the bottom.
        </item>
      </changes>
    </step>

    <step number="2">
      <title>Update the client export code to include all pages (not just the first)</title>
      <files>
        <file>src/components/engineering/workspace/EngineeringWorkspace.tsx</file>
      </files>
      <changes>
        <item>
          The current code only extracts the first <code>.page</code>:
          <code>doc.querySelector('.page')</code>
        </item>
        <item>
          Update it to extract *all* pages:
          <code>doc.querySelectorAll('.page')</code>
          and concatenate their <code>outerHTML</code> so page 1 + page 2 both render into the temporary container.
        </item>
        <item>
          Keep the existing “include &lt;style&gt; tag” logic so styling remains intact.
        </item>
      </changes>
    </step>

    <step number="3">
      <title>Deploy and verify</title>
      <changes>
        <item>Deploy the updated <code>generate-engineering-pdf</code> edge function.</item>
        <item>Export a PDF from /engineering and confirm the status box is not cut between pages.</item>
      </changes>
    </step>
  </implementation-steps>

  <acceptance-criteria>
    <item>The green “DESIGN ADEQUATE” status box appears fully on a single page (not split).</item>
    <item>The red disclaimer box is not split across pages.</item>
    <item>The PDF downloads directly (no new blank tab) and contains all pages of the report.</item>
    <item>Branding (brain logo) and styling remain correct.</item>
  </acceptance-criteria>

  <edge-cases-and-notes>
    <item>
      If a future calculator generates more rows/content (e.g., large tables), we may need to introduce true dynamic pagination (more than 2 pages). This plan solves the current issue by guaranteeing the last blocks render on a new page.
    </item>
    <item>
      CSS properties like <code>page-break-inside: avoid</code> help for browser printing, but do not reliably stop html2canvas slicing. Explicit multi-page containers are the practical workaround without adding new PDF libraries/services.
    </item>
  </edge-cases-and-notes>

  <next-ideas (optional)>
    <item>Add a “High quality (print)” export option that uses a hidden iframe + browser print engine for perfect pagination (still requires user to save).</item>
    <item>Add page numbers (Page X of Y) and repeat a compact header on page 2+.</item>
    <item>Add a “Report preview” modal before download.</item>
    <item>End-to-end test: run export for Beam/Column/Foundation to confirm multi-page layout remains consistent.</item>
  </next-ideas>
