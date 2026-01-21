import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  Globe,
  Zap,
  Accessibility,
  Layout,
  Image,
  FileText
} from 'lucide-react';

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
  analysisMethod: string;
  issues: VisualIssue[];
  metrics: {
    htmlSize: number;
    loadTime: number;
    elementsCount: number;
    imagesCount: number;
    linksCount: number;
    formsCount: number;
  };
}

interface VisualTestResultsProps {
  summary?: {
    totalPages: number;
    passed: number;
    warnings: number;
    failed: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    avgLoadTime: string;
    healthScore: number;
    overallRating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  };
  results?: PageResult[];
  aiAnalysis?: string;
  isLoading?: boolean;
}

const getIssueTypeIcon = (type: string) => {
  switch (type) {
    case 'layout': return <Layout className="h-3 w-3" />;
    case 'visual': return <Image className="h-3 w-3" />;
    case 'responsive': return <Globe className="h-3 w-3" />;
    case 'accessibility': return <Accessibility className="h-3 w-3" />;
    case 'content': return <FileText className="h-3 w-3" />;
    case 'performance': return <Zap className="h-3 w-3" />;
    default: return <AlertTriangle className="h-3 w-3" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-500/20 text-red-500 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    case 'low': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <Eye className="h-4 w-4 text-muted-foreground" />;
  }
};

export const VisualTestResults: React.FC<VisualTestResultsProps> = ({
  summary,
  results,
  aiAnalysis,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-indigo-500" />
          <p className="text-sm text-muted-foreground">Running visual tests across all pages...</p>
          <p className="text-xs text-muted-foreground mt-1">This may take a minute</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary || !results) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No visual test data yet</p>
          <p className="text-xs mt-1">Run the Visual Test to analyze all pages</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Analysis Card */}
      {aiAnalysis && (
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-500" />
              AI Visual Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{aiAnalysis}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-500">{summary.passed}</p>
            <p className="text-xs text-muted-foreground">Pages Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{summary.warnings}</p>
            <p className="text-xs text-muted-foreground">With Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-500">{summary.criticalIssues}</p>
            <p className="text-xs text-muted-foreground">Critical Issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{summary.avgLoadTime}</p>
            <p className="text-xs text-muted-foreground">Avg Load Time</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Page Results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Page-by-Page Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {results.map((page, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(page.status)}
                      <span className="font-medium text-sm">{page.name}</span>
                      <code className="text-xs text-muted-foreground bg-muted px-1 rounded">
                        {page.path}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{page.metrics.loadTime}ms</span>
                      <span>•</span>
                      <span>{Math.round(page.metrics.htmlSize / 1024)}KB</span>
                    </div>
                  </div>
                  
                  {/* Page Metrics */}
                  <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                    <span>🖼️ {page.metrics.imagesCount} images</span>
                    <span>🔗 {page.metrics.linksCount} links</span>
                    <span>📝 {page.metrics.formsCount} forms</span>
                  </div>
                  
                  {/* Issues */}
                  {page.issues.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {page.issues.map((issue, issueIdx) => (
                        <div 
                          key={issueIdx} 
                          className={`flex items-start gap-2 p-2 rounded border ${getSeverityColor(issue.severity)}`}
                        >
                          <div className="mt-0.5">{getIssueTypeIcon(issue.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] h-4 px-1">
                                {issue.severity}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] h-4 px-1">
                                {issue.type}
                              </Badge>
                            </div>
                            <p className="text-xs mt-1">{issue.description}</p>
                            {issue.element && (
                              <code className="text-[10px] text-muted-foreground">{issue.element}</code>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">💡 {issue.suggestion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {page.issues.length === 0 && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      No issues found
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualTestResults;
