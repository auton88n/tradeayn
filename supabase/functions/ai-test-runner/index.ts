import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  name: string;
  category: string;
  status: 'passed' | 'failed' | 'skipped';
  duration_ms: number;
  error_message: string | null;
  details: Record<string, unknown> | null;
  ai_analysis?: string;
}

interface AITestPlan {
  goal: string;
  steps: string[];
  expectedOutcomes: string[];
  endpoints: string[];
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') || '';

// AI generates a test plan for the feature
async function generateTestPlan(feature: string): Promise<AITestPlan> {
  if (!LOVABLE_API_KEY) {
    // Fallback to predefined plans if no AI key
    return getDefaultTestPlan(feature);
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a QA test engineer. Generate a test plan for the given feature.
            Return ONLY valid JSON with this structure:
            {
              "goal": "What we're testing",
              "steps": ["Step 1", "Step 2"],
              "expectedOutcomes": ["Expected result 1", "Expected result 2"],
              "endpoints": ["endpoint-1", "endpoint-2"]
            }
            
            Available endpoints to test:
            - calculate-beam (POST: beam structural calculations)
            - calculate-column (POST: column structural calculations)
            - calculate-foundation (POST: foundation calculations)
            - calculate-slab (POST: slab calculations)
            - calculate-retaining-wall (POST: retaining wall calculations)
            - support-bot (POST: AI chat support)
            - ayn-unified (POST: main AI chat)
            - engineering-ai-chat (POST: engineering AI)
            `
          },
          {
            role: 'user',
            content: `Generate a test plan for: ${feature}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_test_plan',
              description: 'Create a structured test plan',
              parameters: {
                type: 'object',
                properties: {
                  goal: { type: 'string' },
                  steps: { type: 'array', items: { type: 'string' } },
                  expectedOutcomes: { type: 'array', items: { type: 'string' } },
                  endpoints: { type: 'array', items: { type: 'string' } }
                },
                required: ['goal', 'steps', 'expectedOutcomes', 'endpoints']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_test_plan' } }
      }),
    });

    if (!response.ok) {
      console.log('AI request failed, using default plan');
      return getDefaultTestPlan(feature);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      return JSON.parse(toolCall.function.arguments);
    }
    
    return getDefaultTestPlan(feature);
  } catch (error) {
    console.error('AI test plan generation failed:', error);
    return getDefaultTestPlan(feature);
  }
}

function getDefaultTestPlan(feature: string): AITestPlan {
  const plans: Record<string, AITestPlan> = {
    calculators: {
      goal: 'Verify all engineering calculators work correctly',
      steps: [
        'Test beam calculator with valid inputs',
        'Test beam calculator with edge cases',
        'Test column calculator with valid inputs',
        'Test foundation calculator with valid inputs',
        'Test slab calculator with valid inputs',
        'Test retaining wall calculator with valid inputs'
      ],
      expectedOutcomes: [
        'All calculators return valid results',
        'Edge cases are handled gracefully',
        'Error messages are informative'
      ],
      endpoints: ['calculate-beam', 'calculate-column', 'calculate-foundation', 'calculate-slab', 'calculate-retaining-wall']
    },
    security: {
      goal: 'Verify security measures are in place',
      steps: [
        'Test XSS prevention in support bot',
        'Test SQL injection prevention',
        'Test unauthorized access to admin endpoints',
        'Test rate limiting'
      ],
      expectedOutcomes: [
        'XSS payloads are sanitized',
        'SQL injection attempts fail safely',
        'Admin endpoints require authentication'
      ],
      endpoints: ['support-bot', 'admin-ai-assistant']
    },
    ai: {
      goal: 'Verify AI chat functionality works',
      steps: [
        'Test support bot with valid question',
        'Test engineering AI chat',
        'Test response streaming'
      ],
      expectedOutcomes: [
        'AI responds with relevant content',
        'Responses are formatted correctly',
        'No timeouts under normal load'
      ],
      endpoints: ['support-bot', 'engineering-ai-chat']
    },
    database: {
      goal: 'Verify database operations work correctly',
      steps: [
        'Test reading from all core tables',
        'Test CRUD operations on test_results',
        'Verify RLS policies'
      ],
      expectedOutcomes: [
        'All reads complete successfully',
        'CRUD operations work correctly',
        'Unauthorized access is blocked'
      ],
      endpoints: []
    }
  };

  return plans[feature] || {
    goal: `Test ${feature} functionality`,
    steps: ['Run basic functionality test'],
    expectedOutcomes: ['Feature works as expected'],
    endpoints: []
  };
}

// Execute a single endpoint test
async function testEndpoint(endpoint: string, testInput: Record<string, unknown>): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testInput),
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok) {
      return {
        name: `API: ${endpoint}`,
        category: 'api',
        status: 'failed',
        duration_ms: duration,
        error_message: `HTTP ${response.status}: ${JSON.stringify(data)}`,
        details: { input: testInput, response: data }
      };
    }

    if (data.error) {
      return {
        name: `API: ${endpoint}`,
        category: 'api',
        status: 'failed',
        duration_ms: duration,
        error_message: data.error,
        details: { input: testInput, response: data }
      };
    }

    return {
      name: `API: ${endpoint}`,
      category: 'api',
      status: 'passed',
      duration_ms: duration,
      error_message: null,
      details: { input: testInput, hasResponse: !!data }
    };
  } catch (error) {
    return {
      name: `API: ${endpoint}`,
      category: 'api',
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : String(error),
      details: { input: testInput }
    };
  }
}

// Get appropriate test inputs for each endpoint
function getTestInputs(endpoint: string): Record<string, unknown>[] {
  const inputs: Record<string, Record<string, unknown>[]> = {
    'calculate-beam': [
      { span: 6, deadLoad: 10, liveLoad: 15, beamWidth: 300, concreteGrade: 30, steelGrade: 420 },
      { span: 12, deadLoad: 20, liveLoad: 25, beamWidth: 400, concreteGrade: 40, steelGrade: 500 },
      { span: 3, deadLoad: 5, liveLoad: 8, beamWidth: 200, concreteGrade: 25, steelGrade: 420 }
    ],
    'calculate-column': [
      { height: 3, axialLoad: 500, momentX: 50, momentY: 30, columnWidth: 400, columnDepth: 400, concreteGrade: 30, steelGrade: 420 },
      { height: 5, axialLoad: 1000, momentX: 100, momentY: 80, columnWidth: 500, columnDepth: 500, concreteGrade: 40, steelGrade: 500 }
    ],
    'calculate-foundation': [
      { columnLoad: 800, soilBearingCapacity: 150, foundationDepth: 1.5, concreteGrade: 30, steelGrade: 420 },
      { columnLoad: 1500, soilBearingCapacity: 200, foundationDepth: 2.0, concreteGrade: 35, steelGrade: 500 }
    ],
    'calculate-slab': [
      { spanX: 5, spanY: 4, deadLoad: 5, liveLoad: 3, slabThickness: 150, concreteGrade: 30, steelGrade: 420 },
      { spanX: 8, spanY: 6, deadLoad: 8, liveLoad: 5, slabThickness: 200, concreteGrade: 35, steelGrade: 500 }
    ],
    'calculate-retaining-wall': [
      { wallHeight: 3, soilDensity: 18, frictionAngle: 30, surchargeLoad: 10, concreteGrade: 30, steelGrade: 420 },
      { wallHeight: 5, soilDensity: 20, frictionAngle: 35, surchargeLoad: 15, concreteGrade: 35, steelGrade: 500 }
    ],
    'support-bot': [
      { message: 'How do I use the beam calculator?' },
      { message: 'What are the safety factors for foundations?' }
    ],
    'engineering-ai-chat': [
      { calculatorType: 'beam', question: 'What span can I use for a residential building?', currentInputs: {}, stream: false }
    ]
  };

  return inputs[endpoint] || [{}];
}

// AI analyzes the test results
async function analyzeResults(results: TestResult[]): Promise<string> {
  if (!LOVABLE_API_KEY) {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    return `${passed}/${results.length} tests passed. ${failed > 0 ? `Issues: ${results.filter(r => r.status === 'failed').map(r => r.name).join(', ')}` : 'All systems healthy.'}`;
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a QA analyst. Analyze test results and provide a brief summary (2-3 sentences) with key insights and recommendations.'
          },
          {
            role: 'user',
            content: `Analyze these test results:\n${JSON.stringify(results, null, 2)}`
          }
        ]
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Analysis complete.';
    }
  } catch (error) {
    console.error('AI analysis failed:', error);
  }

  const passed = results.filter(r => r.status === 'passed').length;
  return `${passed}/${results.length} tests passed.`;
}

// Run tests for a specific feature
async function runFeatureTests(feature: string): Promise<{ results: TestResult[]; plan: AITestPlan; analysis: string }> {
  const plan = await generateTestPlan(feature);
  const results: TestResult[] = [];

  // Test each endpoint in the plan
  for (const endpoint of plan.endpoints) {
    const testInputs = getTestInputs(endpoint);
    
    for (let i = 0; i < testInputs.length; i++) {
      const result = await testEndpoint(endpoint, testInputs[i]);
      result.name = `${result.name} - Case ${i + 1}`;
      results.push(result);
    }
  }

  // Run database tests if needed
  if (feature === 'database' || feature === 'all') {
    const dbResults = await runDatabaseTests();
    results.push(...dbResults);
  }

  // Get AI analysis
  const analysis = await analyzeResults(results);

  return { results, plan, analysis };
}

// Database tests
async function runDatabaseTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const tables = ['test_runs', 'test_results', 'profiles', 'messages'];
  
  for (const table of tables) {
    const startTime = Date.now();
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results.push({
          name: `DB: Read ${table}`,
          category: 'database',
          status: 'failed',
          duration_ms: Date.now() - startTime,
          error_message: error.message,
          details: null
        });
      } else {
        results.push({
          name: `DB: Read ${table}`,
          category: 'database',
          status: 'passed',
          duration_ms: Date.now() - startTime,
          error_message: null,
          details: { count }
        });
      }
    } catch (e) {
      results.push({
        name: `DB: Read ${table}`,
        category: 'database',
        status: 'failed',
        duration_ms: Date.now() - startTime,
        error_message: e instanceof Error ? e.message : String(e),
        details: null
      });
    }
  }

  return results;
}

// Security tests
async function runSecurityTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // XSS test
  const xssStart = Date.now();
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/support-bot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '<script>alert("xss")</script>' }),
    });
    const data = await response.json();
    const containsRawScript = JSON.stringify(data).includes('<script>') && !JSON.stringify(data).includes('&lt;script&gt;');
    
    results.push({
      name: 'Security: XSS Prevention',
      category: 'security',
      status: containsRawScript ? 'failed' : 'passed',
      duration_ms: Date.now() - xssStart,
      error_message: containsRawScript ? 'XSS payload not sanitized' : null,
      details: { sanitized: !containsRawScript }
    });
  } catch (e) {
    results.push({
      name: 'Security: XSS Prevention',
      category: 'security',
      status: 'failed',
      duration_ms: Date.now() - xssStart,
      error_message: e instanceof Error ? e.message : String(e),
      details: null
    });
  }

  // Auth test
  const authStart = Date.now();
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-ai-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test' }),
    });

    results.push({
      name: 'Security: Admin Auth Required',
      category: 'security',
      status: response.status === 401 || response.status === 403 ? 'passed' : 'failed',
      duration_ms: Date.now() - authStart,
      error_message: response.status === 401 || response.status === 403 ? null : `Expected 401/403, got ${response.status}`,
      details: { status: response.status }
    });
  } catch (e) {
    results.push({
      name: 'Security: Admin Auth Required',
      category: 'security',
      status: 'failed',
      duration_ms: Date.now() - authStart,
      error_message: e instanceof Error ? e.message : String(e),
      details: null
    });
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feature = 'all', includeAI = true } = await req.json().catch(() => ({}));
    const startTime = Date.now();

    let allResults: TestResult[] = [];
    let plans: AITestPlan[] = [];
    let analysis = '';

    if (feature === 'all') {
      // Run all feature tests
      for (const f of ['calculators', 'security', 'database']) {
        const { results, plan, analysis: a } = await runFeatureTests(f);
        allResults = [...allResults, ...results];
        plans.push(plan);
        analysis += `\n${f}: ${a}`;
      }
    } else {
      const { results, plan, analysis: a } = await runFeatureTests(feature);
      allResults = results;
      plans.push(plan);
      analysis = a;
    }

    const passed = allResults.filter(r => r.status === 'passed').length;
    const failed = allResults.filter(r => r.status === 'failed').length;

    // Store results in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const runId = crypto.randomUUID();

    await supabase.from('test_runs').insert({
      id: runId,
      run_name: `AI Test Runner: ${feature}`,
      total_tests: allResults.length,
      passed_tests: passed,
      failed_tests: failed,
      skipped_tests: 0,
      duration_ms: Date.now() - startTime,
      environment: 'production',
    });

    for (const result of allResults) {
      await supabase.from('test_results').insert({
        run_id: runId,
        test_suite: result.category,
        test_name: result.name,
        status: result.status,
        duration_ms: result.duration_ms,
        error_message: result.error_message,
        browser: 'AI Test Runner',
      });
    }

    return new Response(JSON.stringify({
      success: true,
      feature,
      summary: {
        total: allResults.length,
        passed,
        failed,
        passRate: allResults.length > 0 ? Math.round((passed / allResults.length) * 100) : 0,
        totalDuration: Date.now() - startTime,
      },
      plans,
      analysis: analysis.trim(),
      results: allResults,
      runId,
      executedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
