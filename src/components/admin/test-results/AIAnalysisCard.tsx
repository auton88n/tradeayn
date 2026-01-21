import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Sparkles, AlertTriangle, CheckCircle, Loader2, Copy } from 'lucide-react';
import { BugReportCard } from './BugReportCard';
import { TestReportPDF } from './TestReportPDF';
import { useTestExport } from '@/hooks/useTestExport';

interface BugReport {
  endpoint: string;
  bugType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestedFix: string;
}

interface AIAnalysisCardProps {
  analysis: string;
  model: string;
  tokensUsed?: number;
  bugs?: BugReport[];
  isLoading?: boolean;
  lastAnalyzedAt?: Date;
}

export function AIAnalysisCard({ 
  analysis, 
  model, 
  tokensUsed, 
  bugs = [],
  isLoading = false,
  lastAnalyzedAt 
}: AIAnalysisCardProps) {
  const { copyAllBugs } = useTestExport();

  const criticalBugs = bugs.filter(b => b.severity === 'critical').length;
  const highBugs = bugs.filter(b => b.severity === 'high').length;
  const mediumBugs = bugs.filter(b => b.severity === 'medium').length;
  const lowBugs = bugs.filter(b => b.severity === 'low').length;

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-purple-500" />
            AI Bug Hunter Results
          </CardTitle>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-purple-500" />}
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
              <Sparkles className="h-3 w-3 mr-1" />
              {model}
            </Badge>
          </div>
        </div>
        {lastAnalyzedAt && (
          <p className="text-xs text-muted-foreground">
            Last analyzed: {lastAnalyzedAt.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bug Summary */}
        <div className="flex flex-wrap gap-2">
          {criticalBugs > 0 && (
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {criticalBugs} Critical
            </Badge>
          )}
          {highBugs > 0 && (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {highBugs} High
            </Badge>
          )}
          {mediumBugs > 0 && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              {mediumBugs} Medium
            </Badge>
          )}
          {lowBugs > 0 && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              {lowBugs} Low
            </Badge>
          )}
          {bugs.length === 0 && !isLoading && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              No bugs found
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        {bugs.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyAllBugs(bugs, 'AI Bug Hunter')}
              className="h-7 px-2"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy All ({bugs.length})
            </Button>
            <TestReportPDF
              categoryName="AI Bug Hunter"
              bugs={bugs}
              lastRun={lastAnalyzedAt}
            />
          </div>
        )}

        {/* AI Analysis Text */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {isLoading ? 'AI is analyzing endpoints for bugs...' : analysis || 'No analysis available yet. Run Bug Hunter to discover potential issues.'}
          </p>
        </div>

        {/* Bug Details - ALL bugs shown */}
        {bugs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">All Bugs Discovered ({bugs.length}):</h4>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {bugs.map((bug, index) => (
                  <BugReportCard key={index} bug={bug} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Token Usage */}
        {tokensUsed && tokensUsed > 0 && (
          <p className="text-xs text-muted-foreground">
            Tokens used: {tokensUsed.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default AIAnalysisCard;
