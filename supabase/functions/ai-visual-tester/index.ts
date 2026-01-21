import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SCREENSHOTONE_API_KEY = Deno.env.get('SCREENSHOTONE_API_KEY') || '';

// Pages to test with different viewports
const PAGES_TO_TEST = [
  { path: '/', name: 'Landing Page', description: 'Main marketing page with hero, features, and CTA' },
  { path: '/engineering', name: 'Engineering Portal', description: 'Engineering tools and calculators dashboard' },
  { path: '/support', name: 'Support Center', description: 'FAQ, ticket system, and help resources' },
  { path: '/services/ai-agents', name: 'AI Agents Service', description: 'Service page for AI agent offerings' },
  { path: '/services/automation', name: 'Automation Service', description: 'Business automation services page' },
  { path: '/services/civil-engineering', name: 'Civil Engineering', description: 'Civil engineering consultation services' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'mobile', width: 390, height: 844 },
];

interface VisualIssue {
  type: 'layout' | 'visual' | 'responsive' | 'accessibility' | 'content' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  element?: string;
  suggestion: string;
  location?: string;
}

interface PageResult {
  path: string;
  name: string;
  viewport: string;
  status: 'passed' | 'warning' | 'failed';
  analysisMethod: 'screenshot_ai' | 'html_fallback';
  screenshotUrl?: string;
  issues: VisualIssue[];
  aiAnalysis?: string;
  metrics: {
    screenshotCaptured: boolean;
    analysisTime: number;
    issuesFound: number;
  };
}

// Capture screenshot using screenshotone.com API
async function captureScreenshot(
  siteUrl: string, 
  path: string, 
  viewport: { name: string; width: number; height: number }
): Promise<string | null> {
  if (!SCREENSHOTONE_API_KEY) {
    console.log('SCREENSHOTONE_API_KEY not configured, skipping screenshot');
    return null;
  }

  try {
    const fullUrl = `${siteUrl}${path}`;
    const params = new URLSearchParams({
      access_key: SCREENSHOTONE_API_KEY,
      url: fullUrl,
      viewport_width: viewport.width.toString(),
      viewport_height: viewport.height.toString(),
      device_scale_factor: '1',
      format: 'jpg',
      image_quality: '80',
      block_ads: 'true',
      block_cookie_banners: 'true',
      block_trackers: 'true',
      delay: '2', // Wait 2 seconds for page to load
      timeout: '30',
      full_page: 'false',
    });

    const screenshotUrl = `https://api.screenshotone.com/take?${params.toString()}`;
    
    // Verify the screenshot is accessible
    const testResponse = await fetch(screenshotUrl, { method: 'HEAD' });
    if (testResponse.ok) {
      console.log(`Screenshot captured for ${path} (${viewport.name})`);
      return screenshotUrl;
    } else {
      console.error(`Screenshot failed for ${path}: ${testResponse.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Screenshot error for ${path}:`, error);
    return null;
  }
}

// Analyze screenshot using GPT-4 Vision
async function analyzeScreenshotWithVision(
  screenshotUrl: string,
  pageName: string,
  pageDescription: string,
  viewport: string
): Promise<{ issues: VisualIssue[]; analysis: string }> {
  if (!OPENAI_API_KEY) {
    return { issues: [], analysis: 'OpenAI API key not configured' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert UI/UX designer and QA engineer analyzing website screenshots for visual issues.

Your job is to identify:
1. **Layout Issues**: Overlapping elements, cut-off text, misaligned components, broken grids
2. **Visual Bugs**: Broken images, incorrect colors, missing icons, rendering glitches
3. **Responsive Problems**: Elements too small/large for viewport, horizontal scrolling, touch target sizes
4. **Accessibility Issues**: Low contrast text, tiny fonts, missing visual hierarchy
5. **Content Issues**: Placeholder text, lorem ipsum, broken links visible, error states

For each issue found, provide:
- Type (layout/visual/responsive/accessibility/content)
- Severity (critical/high/medium/low)
- Description of the issue
- Specific element affected
- Suggestion for fixing

Respond in JSON format:
{
  "overallScore": 0-100,
  "summary": "Brief summary of findings",
  "issues": [
    {
      "type": "layout|visual|responsive|accessibility|content",
      "severity": "critical|high|medium|low",
      "description": "What the issue is",
      "element": "Which element is affected",
      "suggestion": "How to fix it",
      "location": "Where on the page (top/middle/bottom, left/center/right)"
    }
  ]
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this screenshot of the "${pageName}" page (${pageDescription}).
Viewport: ${viewport}

Look for any visual issues, layout problems, or accessibility concerns. Be thorough but focus on real issues that would impact user experience.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: screenshotUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GPT-4 Vision error:', errorText);
      return { issues: [], analysis: `Vision API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse JSON response
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                       content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      const parsed = JSON.parse(jsonStr);
      
      return {
        issues: parsed.issues || [],
        analysis: parsed.summary || 'Analysis complete'
      };
    } catch {
      console.log('Could not parse JSON, using raw response');
      return { issues: [], analysis: content };
    }
  } catch (error) {
    console.error('Vision analysis error:', error);
    return { issues: [], analysis: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Fallback HTML analysis when screenshots aren't available
async function analyzePageHTML(
  path: string, 
  name: string, 
  description: string, 
  siteUrl: string,
  viewport: string
): Promise<PageResult> {
  const startTime = Date.now();
  const issues: VisualIssue[] = [];
  
  try {
    const fullUrl = `${siteUrl}${path}`;
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': viewport === 'mobile' 
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    
    const loadTime = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        path, name, viewport,
        status: 'failed',
        analysisMethod: 'html_fallback',
        issues: [{
          type: 'content',
          severity: 'critical',
          description: `Page returned HTTP ${response.status}`,
          suggestion: 'Check if the page exists and is accessible'
        }],
        metrics: { screenshotCaptured: false, analysisTime: loadTime, issuesFound: 1 }
      };
    }
    
    const html = await response.text();
    
    // Basic HTML checks
    if (!html.includes('<title>') || html.includes('<title></title>')) {
      issues.push({
        type: 'content', severity: 'high',
        description: 'Missing or empty page title',
        element: '<title>',
        suggestion: 'Add a descriptive title for SEO and accessibility'
      });
    }
    
    const imgWithoutAlt = (html.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;
    if (imgWithoutAlt > 0) {
      issues.push({
        type: 'accessibility', severity: 'high',
        description: `${imgWithoutAlt} images missing alt text`,
        element: '<img>',
        suggestion: 'Add descriptive alt attributes for screen readers'
      });
    }
    
    if (!html.includes('viewport')) {
      issues.push({
        type: 'responsive', severity: 'critical',
        description: 'Missing viewport meta tag',
        element: '<meta name="viewport">',
        suggestion: 'Add viewport meta for mobile responsiveness'
      });
    }
    
    if (html.includes('undefined') || html.includes('[object Object]')) {
      issues.push({
        type: 'visual', severity: 'high',
        description: 'Rendering issues detected (undefined or [object Object] in content)',
        suggestion: 'Check React component props and state handling'
      });
    }
    
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    
    let status: 'passed' | 'warning' | 'failed' = 'passed';
    if (criticalCount > 0) status = 'failed';
    else if (highCount > 0 || issues.length > 2) status = 'warning';
    
    return {
      path, name, viewport,
      status,
      analysisMethod: 'html_fallback',
      issues,
      aiAnalysis: 'HTML inspection only - screenshot analysis unavailable',
      metrics: { 
        screenshotCaptured: false, 
        analysisTime: Date.now() - startTime, 
        issuesFound: issues.length 
      }
    };
  } catch (error) {
    return {
      path, name, viewport,
      status: 'failed',
      analysisMethod: 'html_fallback',
      issues: [{
        type: 'content', severity: 'critical',
        description: `Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check if the site is accessible'
      }],
      metrics: { screenshotCaptured: false, analysisTime: Date.now() - startTime, issuesFound: 1 }
    };
  }
}

// Main analysis function for a single page
async function analyzePageVisually(
  page: { path: string; name: string; description: string },
  viewport: { name: string; width: number; height: number },
  siteUrl: string
): Promise<PageResult> {
  const startTime = Date.now();
  
  // Try to capture screenshot
  const screenshotUrl = await captureScreenshot(siteUrl, page.path, viewport);
  
  if (screenshotUrl) {
    // Analyze with GPT-4 Vision
    const { issues, analysis } = await analyzeScreenshotWithVision(
      screenshotUrl,
      page.name,
      page.description,
      viewport.name
    );
    
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    
    let status: 'passed' | 'warning' | 'failed' = 'passed';
    if (criticalCount > 0) status = 'failed';
    else if (highCount > 0 || issues.length > 3) status = 'warning';
    
    return {
      path: page.path,
      name: page.name,
      viewport: viewport.name,
      status,
      analysisMethod: 'screenshot_ai',
      screenshotUrl,
      issues,
      aiAnalysis: analysis,
      metrics: {
        screenshotCaptured: true,
        analysisTime: Date.now() - startTime,
        issuesFound: issues.length
      }
    };
  } else {
    // Fallback to HTML analysis
    return analyzePageHTML(page.path, page.name, page.description, siteUrl, viewport.name);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { pages: customPages, siteUrl: customSiteUrl, viewports: customViewports } = await req.json().catch(() => ({}));
    
    const siteUrl = customSiteUrl || 'https://ayn-insight-forge.lovable.app';
    const pagesToTest = customPages || PAGES_TO_TEST;
    const viewportsToTest = customViewports || VIEWPORTS;
    
    console.log(`Starting visual tests for ${pagesToTest.length} pages across ${viewportsToTest.length} viewports on ${siteUrl}`);
    console.log(`Screenshot API configured: ${!!SCREENSHOTONE_API_KEY}`);
    
    const results: PageResult[] = [];
    
    // Process pages sequentially to avoid rate limits
    for (const page of pagesToTest) {
      for (const viewport of viewportsToTest) {
        console.log(`Testing: ${page.name} (${viewport.name})`);
        const result = await analyzePageVisually(page, viewport, siteUrl);
        results.push(result);
        
        // Small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Calculate summary metrics
    const passedCount = results.filter(r => r.status === 'passed').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const criticalIssues = results.flatMap(r => r.issues.filter(i => i.severity === 'critical'));
    const highIssues = results.flatMap(r => r.issues.filter(i => i.severity === 'high'));
    
    const avgAnalysisTime = results.reduce((sum, r) => sum + r.metrics.analysisTime, 0) / results.length;
    const screenshotsCaptured = results.filter(r => r.metrics.screenshotCaptured).length;
    
    // Calculate health score
    let healthScore = 100;
    healthScore -= criticalIssues.length * 15;
    healthScore -= highIssues.length * 5;
    healthScore -= warningCount * 3;
    healthScore -= failedCount * 10;
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    let overallRating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    if (healthScore >= 90) overallRating = 'excellent';
    else if (healthScore >= 70) overallRating = 'good';
    else if (healthScore >= 50) overallRating = 'needs_improvement';
    else overallRating = 'poor';
    
    // Generate AI summary if we have results
    let aiSummary = '';
    if (OPENAI_API_KEY && results.length > 0) {
      try {
        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a UX expert. Provide a brief (max 100 words) actionable summary of visual test results.'
              },
              {
                role: 'user',
                content: `Summarize these visual test results:\n\nPages tested: ${results.length}\nPassed: ${passedCount}, Warnings: ${warningCount}, Failed: ${failedCount}\nTotal issues: ${totalIssues} (${criticalIssues.length} critical, ${highIssues.length} high)\n\nTop issues:\n${criticalIssues.concat(highIssues).slice(0, 5).map(i => `- ${i.description}`).join('\n')}`
              }
            ],
            max_tokens: 200,
            temperature: 0.3,
          }),
        });
        
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          aiSummary = summaryData.choices[0]?.message?.content || '';
        }
      } catch (e) {
        console.error('Summary generation failed:', e);
      }
    }
    
    // Save results to database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const runId = crypto.randomUUID();
    
    await supabase.from('stress_test_metrics').insert({
      run_id: runId,
      test_name: 'visual_test_ai',
      success_count: passedCount,
      failure_count: failedCount,
      avg_response_time_ms: avgAnalysisTime,
      error_rate: failedCount / results.length,
    });
    
    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalPages: results.length,
        passed: passedCount,
        warnings: warningCount,
        failed: failedCount,
        totalIssues,
        criticalIssues: criticalIssues.length,
        highIssues: highIssues.length,
        avgLoadTime: `${avgAnalysisTime.toFixed(0)}ms`,
        healthScore,
        overallRating,
        screenshotsCaptured,
        analysisMethod: screenshotsCaptured > 0 ? 'GPT-4 Vision + Screenshots' : 'HTML Inspection Fallback',
      },
      results,
      aiAnalysis: aiSummary || 'AI summary not available',
      testedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Visual tester error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
