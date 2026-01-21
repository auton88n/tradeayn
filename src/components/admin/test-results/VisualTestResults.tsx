import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Layout, 
  Paintbrush, 
  Smartphone, 
  Accessibility, 
  FileText, 
  Zap,
  Camera,
  Bot,
  Monitor,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Globe,
  ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  viewport?: string;
  status: 'passed' | 'warning' | 'failed';
  analysisMethod: string;
  screenshotUrl?: string;
  issues: VisualIssue[];
  aiAnalysis?: string;
  metrics: {
    screenshotCaptured?: boolean;
    htmlSize?: number;
    loadTime?: number;
    analysisTime?: number;
    elementsCount?: number;
    imagesCount?: number;
    linksCount?: number;
    formsCount?: number;
    issuesFound?: number;
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
    highIssues?: number;
    avgLoadTime: string;
    healthScore: number;
    overallRating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    screenshotsCaptured?: number;
    analysisMethod?: string;
  };
  results?: PageResult[];
  aiAnalysis?: string;
  isLoading?: boolean;
}

const getIssueTypeIcon = (type: string) => {
  switch (type) {
    case 'layout': return <Layout className="h-3 w-3" />;
    case 'visual': return <ImageIcon className="h-3 w-3" />;
    case 'responsive': return <Smartphone className="h-3 w-3" />;
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
    case 'passed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
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
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set());

  const togglePage = (idx: number) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedPages(newExpanded);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-indigo-500" />
          <p className="text-sm text-muted-foreground">Running visual tests across all pages...</p>
          <p className="text-xs text-muted-foreground mt-1">Capturing screenshots & analyzing with GPT-4 Vision</p>
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
              <Bot className="h-4 w-4 text-indigo-500" />
              AI Visual Analysis
              {summary.analysisMethod && (
                <Badge variant="outline" className="ml-2 text-[10px]">
                  {summary.analysisMethod}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{aiAnalysis}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-500">{summary.passed}</p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{summary.warnings}</p>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-500">{summary.criticalIssues}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{summary.avgLoadTime}</p>
            <p className="text-xs text-muted-foreground">Avg Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Camera className="h-4 w-4 text-indigo-500" />
              <p className="text-2xl font-bold">{summary.screenshotsCaptured || 0}</p>
            </div>
            <p className="text-xs text-muted-foreground">Screenshots</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Page Results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Page-by-Page Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {results.map((page, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  {/* Page Header */}
                  <div 
                    className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => togglePage(idx)}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(page.status)}
                      <span className="font-medium text-sm">{page.name}</span>
                      {page.viewport && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {page.viewport === 'mobile' ? <Smartphone className="h-2.5 w-2.5" /> : <Monitor className="h-2.5 w-2.5" />}
                          <span className="ml-1">{page.viewport}</span>
                        </Badge>
                      )}
                      <code className="text-xs text-muted-foreground bg-muted px-1 rounded">
                        {page.path}
                      </code>
                    </div>
                    <div className="flex items-center gap-3">
                      {page.metrics.screenshotCaptured && (
                        <Badge className="bg-indigo-500/20 text-indigo-500 text-[10px]">
                          <Camera className="h-2.5 w-2.5 mr-1" />
                          AI Vision
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{page.metrics.analysisTime || page.metrics.loadTime || 0}ms</span>
                        {page.issues.length > 0 && (
                          <>
                            <span>•</span>
                            <span className={page.issues.some(i => i.severity === 'critical') ? 'text-red-500' : 'text-yellow-500'}>
                              {page.issues.length} issues
                            </span>
                          </>
                        )}
                      </div>
                      {expandedPages.has(idx) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {expandedPages.has(idx) && (
                    <div className="p-3 border-t">
                      {/* Screenshot Preview */}
                      {page.screenshotUrl && (
                        <div className="mb-3">
                          <a 
                            href={page.screenshotUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block relative group"
                          >
                            <img 
                              src={page.screenshotUrl} 
                              alt={`Screenshot of ${page.name}`}
                              className="w-full max-h-48 object-cover object-top rounded border"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                              <ExternalLink className="h-6 w-6 text-white" />
                            </div>
                          </a>
                        </div>
                      )}
                      
                      {/* Page Metrics */}
                      <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                        {page.metrics.imagesCount !== undefined && (
                          <span>🖼️ {page.metrics.imagesCount} images</span>
                        )}
                        {page.metrics.linksCount !== undefined && (
                          <span>🔗 {page.metrics.linksCount} links</span>
                        )}
                        {page.metrics.formsCount !== undefined && (
                          <span>📝 {page.metrics.formsCount} forms</span>
                        )}
                        {page.metrics.htmlSize !== undefined && (
                          <span>📄 {Math.round(page.metrics.htmlSize / 1024)}KB</span>
                        )}
                      </div>
                      
                      {/* AI Analysis for this page */}
                      {page.aiAnalysis && (
                        <div className="mb-3 p-2 bg-indigo-500/5 rounded border border-indigo-500/20">
                          <p className="text-xs text-muted-foreground">{page.aiAnalysis}</p>
                        </div>
                      )}
                      
                      {/* Issues */}
                      {page.issues.length > 0 && (
                        <div className="space-y-2">
                          {page.issues.map((issue, issueIdx) => (
                            <div 
                              key={issueIdx} 
                              className={`flex items-start gap-2 p-2 rounded border ${getSeverityColor(issue.severity)}`}
                            >
                              <div className="mt-0.5">{getIssueTypeIcon(issue.type)}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                                    {issue.severity}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                                    {issue.type}
                                  </Badge>
                                  {issue.location && (
                                    <span className="text-[10px] text-muted-foreground">
                                      📍 {issue.location}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs mt-1">{issue.description}</p>
                                {issue.element && (
                                  <code className="text-[10px] text-muted-foreground block mt-1">{issue.element}</code>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">💡 {issue.suggestion}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {page.issues.length === 0 && (
                        <p className="text-xs text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          No issues found
                        </p>
                      )}
                    </div>
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
