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

// Pages to test - using internal screenshot simulation since edge functions can't run browsers
const PAGES_TO_TEST = [
  { path: '/', name: 'Landing Page', description: 'Main marketing page with hero, features, and CTA' },
  { path: '/engineering', name: 'Engineering Portal', description: 'Engineering tools and calculators dashboard' },
  { path: '/support', name: 'Support Center', description: 'FAQ, ticket system, and help resources' },
  { path: '/services/ai-agents', name: 'AI Agents Service', description: 'Service page for AI agent offerings' },
  { path: '/services/automation', name: 'Automation Service', description: 'Business automation services page' },
  { path: '/services/civil-engineering', name: 'Civil Engineering', description: 'Civil engineering consultation services' },
];

interface VisualIssue {
  type: 'layout' | 'visual' | 'responsive' | 'accessibility' | 'content' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  element?: string;
  suggestion: string;
}

interface PageResult {
  path: string;
  name: string;
  status: 'passed' | 'warning' | 'failed';
  analysisMethod: 'html_inspection' | 'ai_analysis';
  issues: VisualIssue[];
  metrics: {
    htmlSize: number;
    loadTime: number;
    elementsCount: number;
    imagesCount: number;
    linksCount: number;
    formsCount: number;
  };
  aiAnalysis?: string;
}

// Analyze HTML structure for potential issues
async function analyzePageHTML(path: string, name: string, description: string, siteUrl: string): Promise<PageResult> {
  const startTime = Date.now();
  const issues: VisualIssue[] = [];
  
  try {
    const fullUrl = `${siteUrl}${path}`;
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'AYN-Visual-Tester/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    
    const loadTime = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        path,
        name,
        status: 'failed',
        analysisMethod: 'html_inspection',
        issues: [{
          type: 'content',
          severity: 'critical',
          description: `Page returned HTTP ${response.status}`,
          suggestion: 'Check if the page exists and is accessible'
        }],
        metrics: { htmlSize: 0, loadTime, elementsCount: 0, imagesCount: 0, linksCount: 0, formsCount: 0 }
      };
    }
    
    const html = await response.text();
    const htmlSize = html.length;
    
    // Extract metrics from HTML
    const imagesCount = (html.match(/<img/gi) || []).length;
    const linksCount = (html.match(/<a\s/gi) || []).length;
    const formsCount = (html.match(/<form/gi) || []).length;
    const buttonsCount = (html.match(/<button/gi) || []).length;
    const inputsCount = (html.match(/<input/gi) || []).length;
    const elementsCount = imagesCount + linksCount + buttonsCount + inputsCount;
    
    // Performance checks
    if (loadTime > 3000) {
      issues.push({
        type: 'performance',
        severity: 'high',
        description: `Slow page load: ${loadTime}ms`,
        suggestion: 'Optimize assets, enable caching, and reduce bundle size'
      });
    } else if (loadTime > 1500) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        description: `Page load could be faster: ${loadTime}ms`,
        suggestion: 'Consider lazy loading images and code splitting'
      });
    }
    
    // HTML size check
    if (htmlSize > 500000) {
      issues.push({
        type: 'performance',
        severity: 'high',
        description: `Large HTML size: ${Math.round(htmlSize / 1024)}KB`,
        suggestion: 'Reduce inline styles/scripts, use external assets'
      });
    }
    
    // SEO checks
    if (!html.includes('<title>') || html.includes('<title></title>')) {
      issues.push({
        type: 'content',
        severity: 'high',
        description: 'Missing or empty page title',
        element: '<title>',
        suggestion: 'Add a descriptive title for SEO and accessibility'
      });
    }
    
    if (!html.includes('meta name="description"')) {
      issues.push({
        type: 'content',
        severity: 'medium',
        description: 'Missing meta description',
        element: '<meta name="description">',
        suggestion: 'Add meta description for better SEO'
      });
    }
    
    // Accessibility checks
    const imgWithoutAlt = (html.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;
    if (imgWithoutAlt > 0) {
      issues.push({
        type: 'accessibility',
        severity: 'high',
        description: `${imgWithoutAlt} images missing alt text`,
        element: '<img>',
        suggestion: 'Add descriptive alt attributes for screen readers'
      });
    }
    
    if (!html.includes('<h1')) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        description: 'Missing H1 heading',
        element: '<h1>',
        suggestion: 'Add a main H1 heading for page structure'
      });
    }
    
    // Check for viewport meta (mobile responsiveness)
    if (!html.includes('viewport')) {
      issues.push({
        type: 'responsive',
        severity: 'critical',
        description: 'Missing viewport meta tag',
        element: '<meta name="viewport">',
        suggestion: 'Add viewport meta for mobile responsiveness'
      });
    }
    
    // Check for common UI issues
    if (html.includes('undefined') || html.includes('[object Object]')) {
      issues.push({
        type: 'visual',
        severity: 'high',
        description: 'Rendering issues detected (undefined or [object Object] in content)',
        suggestion: 'Check React component props and state handling'
      });
    }
    
    // Determine status
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    
    let status: 'passed' | 'warning' | 'failed' = 'passed';
    if (criticalCount > 0) status = 'failed';
    else if (highCount > 0 || issues.length > 3) status = 'warning';
    
    return {
      path,
      name,
      status,
      analysisMethod: 'html_inspection',
      issues,
      metrics: { htmlSize, loadTime, elementsCount, imagesCount, linksCount, formsCount }
    };
    
  } catch (error) {
    return {
      path,
      name,
      status: 'failed',
      analysisMethod: 'html_inspection',
      issues: [{
        type: 'content',
        severity: 'critical',
        description: `Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check if the site is accessible and CORS is configured'
      }],
      metrics: { htmlSize: 0, loadTime: Date.now() - startTime, elementsCount: 0, imagesCount: 0, linksCount: 0, formsCount: 0 }
    };
  }
}

// Use AI to analyze the overall results and provide recommendations
async function getAIAnalysis(results: PageResult[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    return 'AI analysis unavailable - OpenAI API key not configured';
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a UX/UI expert analyzing website test results. Provide a brief, actionable summary (max 150 words) focusing on the most important issues and quick wins.'
          },
          {
            role: 'user',
            content: `Analyze these visual test results and provide a prioritized summary:\n\n${JSON.stringify(results.map(r => ({
              page: r.name,
              status: r.status,
              issueCount: r.issues.length,
              criticalIssues: r.issues.filter(i => i.severity === 'critical').map(i => i.description),
              metrics: r.metrics
            })), null, 2)}`
          }
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No analysis generated';
  } catch (error) {
    console.error('AI analysis failed:', error);
    return `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { pages: customPages, siteUrl: customSiteUrl } = await req.json().catch(() => ({}));
    
    // Use custom site URL or default to the published URL
    const siteUrl = customSiteUrl || 'https://ayn-insight-forge.lovable.app';
    const pagesToTest = customPages || PAGES_TO_TEST;
    
    console.log(`Starting visual tests for ${pagesToTest.length} pages on ${siteUrl}`);
    
    // Run tests in parallel (limited concurrency)
    const results: PageResult[] = [];
    const batchSize = 3;
    
    for (let i = 0; i < pagesToTest.length; i += batchSize) {
      const batch = pagesToTest.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((page: { path: string; name: string; description?: string }) => 
          analyzePageHTML(page.path, page.name, page.description || '', siteUrl)
        )
      );
      results.push(...batchResults);
    }
    
    // Get AI analysis of overall results
    const aiAnalysis = await getAIAnalysis(results);
    
    // Calculate summary metrics
    const passedCount = results.filter(r => r.status === 'passed').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const criticalIssues = results.flatMap(r => r.issues.filter(i => i.severity === 'critical'));
    const highIssues = results.flatMap(r => r.issues.filter(i => i.severity === 'high'));
    
    const avgLoadTime = results.reduce((sum, r) => sum + r.metrics.loadTime, 0) / results.length;
    
    // Determine overall health score
    let healthScore = 100;
    healthScore -= criticalIssues.length * 15;
    healthScore -= highIssues.length * 5;
    healthScore -= (warningCount * 3);
    healthScore -= (failedCount * 10);
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    let overallRating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    if (healthScore >= 90) overallRating = 'excellent';
    else if (healthScore >= 70) overallRating = 'good';
    else if (healthScore >= 50) overallRating = 'needs_improvement';
    else overallRating = 'poor';
    
    // Save results to database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const runId = crypto.randomUUID();
    
    await supabase.from('stress_test_metrics').insert({
      run_id: runId,
      test_name: 'visual_test',
      success_count: passedCount,
      failure_count: failedCount,
      avg_response_time_ms: avgLoadTime,
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
        avgLoadTime: `${avgLoadTime.toFixed(0)}ms`,
        healthScore,
        overallRating,
      },
      results,
      aiAnalysis,
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
