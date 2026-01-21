import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, MessageCircle, CheckCircle2, XCircle, Brain, Shield, Globe, Heart, Eye } from 'lucide-react';

interface CategoryData {
  passed: number;
  total: number;
  avgScore: number;
  results?: Array<{
    name: string;
    passed: boolean;
    score: number;
    aynResponse: string;
    reason: string;
  }>;
}

interface TranscriptItem {
  category: string;
  name: string;
  userMessage: string;
  aynResponse: string;
  passed: boolean;
  score: number;
  reason: string;
  emotion?: string;
}

interface AIConversationResultsProps {
  summary?: {
    overallScore: number;
    intelligenceRating: string;
    totalTests: number;
    passed: number;
    failed: number;
  };
  byCategory?: Record<string, CategoryData>;
  improvements?: string[];
  sampleTranscripts?: TranscriptItem[];
  isLoading?: boolean;
}

export const AIConversationResults: React.FC<AIConversationResultsProps> = ({
  summary,
  byCategory,
  improvements,
  sampleTranscripts,
  isLoading
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showTranscripts, setShowTranscripts] = useState(false);

  const toggleCategory = (cat: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(cat)) {
      newExpanded.delete(cat);
    } else {
      newExpanded.add(cat);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'branding': <Shield className="h-4 w-4" />,
      'privacy': <Shield className="h-4 w-4" />,
      'personality': <Heart className="h-4 w-4" />,
      'safety': <Shield className="h-4 w-4" />,
      'multilingual': <Globe className="h-4 w-4" />,
      'memory': <Brain className="h-4 w-4" />,
      'emotion': <Eye className="h-4 w-4" />
    };
    return icons[category] || <MessageCircle className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'branding': 'text-purple-500',
      'privacy': 'text-red-500',
      'personality': 'text-pink-500',
      'safety': 'text-orange-500',
      'multilingual': 'text-blue-500',
      'memory': 'text-green-500',
      'emotion': 'text-cyan-500'
    };
    return colors[category] || 'text-primary';
  };

  const getRatingEmoji = (rating: string) => {
    const emojis: Record<string, string> = {
      'genius': '🧠',
      'smart': '💡',
      'average': '📊',
      'needs_training': '📚'
    };
    return emojis[rating] || '🤖';
  };

  const getRatingColor = (rating: string) => {
    const colors: Record<string, string> = {
      'genius': 'text-purple-500',
      'smart': 'text-green-500',
      'average': 'text-yellow-500',
      'needs_training': 'text-red-500'
    };
    return colors[rating] || 'text-primary';
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            <div>
              <span className="text-muted-foreground">Running conversation tests...</span>
              <p className="text-xs text-muted-foreground mt-1">Testing branding, privacy, personality, and more</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          No conversation test results yet. Click "Run AI Conversation" to start.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            AI Conversation Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{summary.overallScore}%</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getRatingColor(summary.intelligenceRating)}`}>
                {getRatingEmoji(summary.intelligenceRating)} {summary.intelligenceRating.replace('_', ' ')}
              </div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{summary.passed}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{summary.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {byCategory && Object.keys(byCategory).length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Test Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(byCategory).map(([category, data]) => {
              const isExpanded = expandedCategories.has(category);
              const isPerfect = data.avgScore >= 100;
              
              return (
                <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                  <CollapsibleTrigger className="w-full">
                    <div className={`p-3 rounded-lg border transition-colors ${
                      isPerfect 
                        ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15' 
                        : 'bg-background/50 border-border/50 hover:bg-background/80'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={getCategoryColor(category)}>
                            {getCategoryIcon(category)}
                          </span>
                          <span className="font-medium capitalize">{category}</span>
                          <Badge variant={isPerfect ? 'default' : 'secondary'} className="text-xs">
                            {data.passed}/{data.total}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-bold">{data.avgScore}%</div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <Progress value={data.avgScore} className="h-1.5 mt-2" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {data.results && data.results.length > 0 && (
                      <div className="mt-2 ml-4 space-y-2">
                        {data.results.map((result, idx) => (
                          <div key={idx} className="p-2 bg-background/30 rounded border border-border/30 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{result.name}</span>
                              {result.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{result.reason}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Sample Transcripts */}
      {sampleTranscripts && sampleTranscripts.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CollapsibleTrigger 
              className="w-full flex items-center justify-between"
              onClick={() => setShowTranscripts(!showTranscripts)}
            >
              <CardTitle className="text-base">Sample Conversations</CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${showTranscripts ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <Collapsible open={showTranscripts}>
            <CollapsibleContent>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {sampleTranscripts.map((transcript, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border ${
                      transcript.passed 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {transcript.category} / {transcript.name}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {transcript.emotion && (
                          <Badge variant="secondary" className="text-xs">
                            {transcript.emotion}
                          </Badge>
                        )}
                        <Badge variant={transcript.passed ? 'default' : 'destructive'} className="text-xs">
                          {transcript.score}%
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <span className="text-blue-500 font-medium">👤</span>
                        <span className="text-muted-foreground">{transcript.userMessage}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-primary font-medium">🤖</span>
                        <span className="text-foreground">{transcript.aynResponse}</span>
                      </div>
                    </div>
                    {!transcript.passed && (
                      <div className="mt-2 text-xs text-red-400">
                        ⚠️ {transcript.reason}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Improvements */}
      {improvements && improvements.length > 0 && (
        <Card className="bg-yellow-500/5 border-yellow-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-yellow-600 flex items-center gap-2">
              💡 Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-500">•</span>
                  <span className="text-muted-foreground">{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIConversationResults;
