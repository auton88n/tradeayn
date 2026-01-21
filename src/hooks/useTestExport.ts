import { toast } from 'sonner';

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

export function useTestExport() {
  const copyTestAsMarkdown = (test: TestResult) => {
    const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
    const md = `**${test.name}**
- Status: ${statusIcon} ${test.status.toUpperCase()}
- Duration: ${test.duration_ms || 'N/A'}ms${test.error_message ? `\n- Error: ${test.error_message}` : ''}`;
    
    navigator.clipboard.writeText(md);
    toast.success('Test copied to clipboard');
  };

  const copyAllTests = (tests: TestResult[], categoryName: string) => {
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    
    const md = `# ${categoryName} Test Results

**Summary:** ${passed} passed, ${failed} failed, ${tests.length} total

---

${tests.map(t => {
  const statusIcon = t.status === 'passed' ? '✅' : t.status === 'failed' ? '❌' : '⚠️';
  return `## ${statusIcon} ${t.name}
- **Status:** ${t.status.toUpperCase()}
- **Duration:** ${t.duration_ms || 'N/A'}ms${t.error_message ? `\n- **Error:** ${t.error_message}` : ''}`;
}).join('\n\n---\n\n')}

---
*Generated: ${new Date().toLocaleString()}*`;

    navigator.clipboard.writeText(md);
    toast.success(`${tests.length} tests copied to clipboard`);
  };

  const copyBugReport = (bug: BugReport) => {
    const severityIcon = bug.severity === 'critical' ? '🔴' : bug.severity === 'high' ? '🟠' : bug.severity === 'medium' ? '🟡' : '🔵';
    const text = `${severityIcon} **${bug.endpoint}** [${bug.severity.toUpperCase()}]

**Type:** ${bug.bugType}
**Description:** ${bug.description}
**Suggested Fix:** ${bug.suggestedFix}`;

    navigator.clipboard.writeText(text);
    toast.success('Bug report copied');
  };

  const copyAllBugs = (bugs: BugReport[], categoryName: string = 'AI Bug Hunter') => {
    const critical = bugs.filter(b => b.severity === 'critical').length;
    const high = bugs.filter(b => b.severity === 'high').length;
    
    const md = `# ${categoryName} Results

**Summary:** ${bugs.length} bugs found
- 🔴 Critical: ${critical}
- 🟠 High: ${high}
- 🟡 Medium: ${bugs.filter(b => b.severity === 'medium').length}
- 🔵 Low: ${bugs.filter(b => b.severity === 'low').length}

---

${bugs.map(bug => {
  const severityIcon = bug.severity === 'critical' ? '🔴' : bug.severity === 'high' ? '🟠' : bug.severity === 'medium' ? '🟡' : '🔵';
  return `## ${severityIcon} ${bug.endpoint} [${bug.severity.toUpperCase()}]

**Type:** ${bug.bugType}
**Description:** ${bug.description}
**Suggested Fix:** ${bug.suggestedFix}`;
}).join('\n\n---\n\n')}

---
*Generated: ${new Date().toLocaleString()}*`;

    navigator.clipboard.writeText(md);
    toast.success(`${bugs.length} bugs copied to clipboard`);
  };

  return { copyTestAsMarkdown, copyAllTests, copyBugReport, copyAllBugs };
}
