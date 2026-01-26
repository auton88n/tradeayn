
# Enhanced Admin AI Assistant - Operations Control Center

## Summary

Upgrade the Admin AI Assistant to a powerful system operations control center with real-time metrics, executable actions, and comprehensive system awareness. The AI will have access to **operational and technical data only** - explicitly excluding sensitive business data like subscribers, revenue, and payment information.

---

## Security Boundaries

### AI HAS Access To (Operational Data)
| Data Category | Tables/Sources | Purpose |
|--------------|----------------|---------|
| Test Results | `test_results`, `test_runs`, `stress_test_metrics` | System reliability monitoring |
| LLM Performance | `llm_usage_logs`, `llm_failures`, `llm_models` | AI health and fallback rates |
| Rate Limits | `api_rate_limits` | Blocked users, violations |
| Security Logs | `security_logs`, `threat_detection` | Security events (no emails) |
| Support Tickets | `support_tickets` (status/count only) | Pending issues count |
| Engineering Activity | `engineering_activity` | Calculator usage stats |
| System Health | `webhook_health_metrics`, `system_status` | Uptime and health |
| User Counts | `access_grants` (counts only) | Active/total users (no details) |

### AI DOES NOT Have Access To (Sensitive Data)
| Excluded Data | Reason |
|---------------|--------|
| `user_subscriptions` | Revenue/payment data |
| `credit_gifts` | Financial transactions |
| `profiles` (personal details) | PII protection |
| User emails | Privacy |
| Payment history | Financial data |
| Subscription tiers per user | Business intelligence |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/AdminAIAssistant.tsx` | Add stats panel, action execution, markdown rendering, dynamic suggestions |
| `supabase/functions/admin-ai-assistant/index.ts` | Expanded operational context, updated prompt with boundaries, action handlers |

---

## Implementation Details

### 1. Backend: Expanded Context Queries (Edge Function)

Add operational data queries while explicitly avoiding sensitive tables:

```typescript
// Test results stats (last 24 hours)
const { data: testResults } = await supabase
  .from('test_results')
  .select('status, test_suite, created_at')
  .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

// Calculate test pass rate
const testStats = {
  total: testResults?.length || 0,
  passed: testResults?.filter(t => t.status === 'passed').length || 0,
  failed: testResults?.filter(t => t.status === 'failed').length || 0,
  passRate: testResults?.length > 0 
    ? ((testResults.filter(t => t.status === 'passed').length / testResults.length) * 100).toFixed(1) + '%'
    : '0%',
  bySuite: {} // Group by test_suite
};

// Support tickets (counts only, no personal data)
const { count: openTickets } = await supabase
  .from('support_tickets')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'open');

const { count: pendingTickets } = await supabase
  .from('support_tickets')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pending');

// Security events (high severity, no emails)
const { data: securityEvents } = await supabase
  .from('security_logs')
  .select('action, severity, created_at, details')
  .in('severity', ['high', 'critical'])
  .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  .order('created_at', { ascending: false })
  .limit(10);

// Engineering calculator usage
const { data: engineeringStats } = await supabase
  .from('engineering_activity')
  .select('activity_type, created_at')
  .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

// System health metrics
const { data: healthMetrics } = await supabase
  .from('webhook_health_metrics')
  .select('success_count, failure_count, avg_response_time, created_at')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### 2. Backend: Updated System Prompt with Boundaries

```typescript
const ADMIN_SYSTEM_PROMPT = `You are AYN Admin Assistant, helping admins manage system operations.

SYSTEM ACCESS (What you CAN see):
- Test results and pass rates
- LLM usage, costs, failures, and fallback rates
- Rate limit violations and blocked users
- Security logs and threat detection (action types, not personal data)
- Support ticket counts (open/pending/closed)
- Engineering calculator usage statistics
- System health and uptime metrics
- User counts (total/active only)

SECURITY BOUNDARIES (What you CANNOT access):
- Individual user emails or personal details
- Subscription/payment information
- Revenue data
- User profiles with PII
- Financial transactions

AVAILABLE ACTIONS:
- [ACTION:unblock_user:user_id] - Remove rate limit block from user
- [ACTION:run_tests:suite_name] - Trigger test suite (api, security, calculator, all)
- [ACTION:refresh_stats] - Refresh system metrics
- [ACTION:view_section:section_name] - Navigate to admin section
- [ACTION:clear_failures:hours] - Clear old failure logs

RESPONSE GUIDELINES:
- Use markdown formatting for clarity (tables, lists, code blocks)
- Be proactive: suggest actions when issues are detected
- Keep responses concise but actionable
- Include specific numbers and percentages
- Never attempt to access or discuss revenue/subscription data
- If asked about sensitive data, explain you don't have access`;
```

### 3. Frontend: Stats Panel with Live Metrics

Add a collapsible header showing real-time operational health:

```text
+--------------------------------------------------------------------+
|  AYN Admin Assistant                           [Gemini Flash]      |
+--------------------------------------------------------------------+
|  [Collapsible Stats Panel]                                         |
|  +------------------+  +------------------+  +------------------+  |
|  |  System Health   |  |  Test Pass Rate  |  |  Blocked Users   |  |
|  |      98.2%       |  |      91.8%       |  |        2         |  |
|  +------------------+  +------------------+  +------------------+  |
|  +------------------+  +------------------+  +------------------+  |
|  |  Open Tickets    |  |  LLM Fallbacks   |  |  Calc Usage 24h  |  |
|  |       5          |  |      3.2%        |  |       47         |  |
|  +------------------+  +------------------+  +------------------+  |
+--------------------------------------------------------------------+
```

### 4. Frontend: Functional Action Execution

Replace placeholder with real implementations:

```typescript
const executeAction = async (action: { type: string; params: string }) => {
  try {
    switch (action.type) {
      case 'unblock_user':
        await supabase.rpc('admin_unblock_user', { 
          p_user_id: action.params 
        });
        toast.success('User unblocked successfully');
        break;
        
      case 'run_tests':
        const { data: session } = await supabase.auth.getSession();
        await fetch(`${SUPABASE_URL}/functions/v1/ai-comprehensive-tester`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ suite: action.params })
        });
        toast.success(`Running ${action.params} tests...`);
        break;
        
      case 'refresh_stats':
        await fetchStats();
        toast.success('Stats refreshed');
        break;
        
      case 'view_section':
        // Emit event to navigate within admin panel
        window.dispatchEvent(new CustomEvent('admin-navigate', { 
          detail: action.params 
        }));
        break;
    }
    
    // Refresh stats after action
    fetchStats();
  } catch (error) {
    toast.error(`Action failed: ${error.message}`);
  }
};
```

### 5. Frontend: Dynamic Quick Suggestions

Context-aware suggestions based on system state:

```typescript
const getQuickSuggestions = () => {
  const suggestions = [
    { icon: Activity, text: "Check system health" },
    { icon: TestTube, text: "Show test pass rates" },
  ];
  
  // Add conditional suggestions
  if (stats.blockedUsers > 0) {
    suggestions.push({ 
      icon: UserCheck, 
      text: `Unblock ${stats.blockedUsers} rate-limited users` 
    });
  }
  
  if (stats.openTickets > 0) {
    suggestions.push({ 
      icon: Ticket, 
      text: `${stats.openTickets} open support tickets` 
    });
  }
  
  if (stats.failureRate > 5) {
    suggestions.push({ 
      icon: AlertTriangle, 
      text: "Why is the failure rate high?" 
    });
  }
  
  return suggestions.slice(0, 6); // Max 6 suggestions
};
```

### 6. Frontend: Markdown Rendering for AI Responses

Use react-markdown for proper formatting:

```tsx
import ReactMarkdown from 'react-markdown';

// In ChatMessage component
<div className="prose prose-sm dark:prose-invert max-w-none">
  <ReactMarkdown>
    {message.content}
  </ReactMarkdown>
</div>
```

---

## Stats Panel Component Design

```tsx
interface QuickStats {
  systemHealth: number;      // % uptime
  testPassRate: number;      // % pass rate
  blockedUsers: number;      // count
  openTickets: number;       // count
  llmFallbackRate: number;   // %
  calcUsage24h: number;      // count
}

const StatsPanel = ({ stats, onStatClick }: Props) => (
  <Collapsible defaultOpen>
    <CollapsibleTrigger className="flex items-center gap-2">
      <Activity className="w-4 h-4" />
      <span>Live System Stats</span>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <StatCard 
          label="System Health"
          value={`${stats.systemHealth}%`}
          status={stats.systemHealth > 95 ? 'green' : stats.systemHealth > 80 ? 'yellow' : 'red'}
          onClick={() => onStatClick("Tell me about system health")}
        />
        {/* More stat cards... */}
      </div>
    </CollapsibleContent>
  </Collapsible>
);
```

---

## Response Format Enhancement

The edge function will return enhanced data:

```typescript
return new Response(JSON.stringify({
  content,           // AI response text
  actions,           // Parsed actions from response
  contextData,       // Full context (for debugging)
  quickStats: {      // Pre-calculated stats for UI
    systemHealth: calculateHealthScore(contextData),
    testPassRate: contextData.testStats?.passRate || 0,
    blockedUsers: contextData.rateLimits?.blockedUsers || 0,
    openTickets: contextData.tickets?.open || 0,
    llmFallbackRate: parseFloat(contextData.llmUsage24h?.fallbackRate) || 0,
    calcUsage24h: contextData.engineering?.total || 0
  }
}));
```

---

## UI Improvements

1. **Model Badge**: Change from "GPT-4" to "Gemini Flash" (accurate)
2. **Stats Auto-Refresh**: Poll every 30 seconds
3. **Click-to-Query**: Clicking a stat card asks the AI about it
4. **Loading States**: Show skeleton loaders during stat fetch
5. **Action Confirmation**: Confirm before executing destructive actions

---

## Technical Notes

- Stats refresh interval: 30 seconds via `useEffect` with cleanup
- Action execution includes try/catch with toast feedback
- Markdown rendering uses existing `react-markdown` package
- No access to `user_subscriptions`, `credit_gifts`, or `profiles` tables
- Security logs are sanitized to remove email/PII before sending to AI
- User IDs are shown for actions but never personal details
