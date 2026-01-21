import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Lock, Eye, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface TestResult {
  name: string;
  passed: boolean;
  score: number;
  reason: string;
  aynResponse?: string;
}

interface BrandingPrivacyResultsProps {
  branding?: {
    passed: number;
    total: number;
    avgScore: number;
    results?: TestResult[];
  };
  privacy?: {
    passed: number;
    total: number;
    avgScore: number;
    results?: TestResult[];
  };
  isLoading?: boolean;
}

export const BrandingPrivacyResults: React.FC<BrandingPrivacyResultsProps> = ({
  branding,
  privacy,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            <span className="text-muted-foreground">Testing branding & privacy...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!branding && !privacy) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          No branding/privacy test results yet.
        </CardContent>
      </Card>
    );
  }

  const brandingScore = branding?.avgScore || 0;
  const privacyScore = privacy?.avgScore || 0;
  const combinedScore = Math.round((brandingScore + privacyScore) / 2);

  return (
    <div className="space-y-4">
      {/* Combined Score */}
      <Card className={`border-2 ${
        combinedScore >= 100 
          ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-background' 
          : combinedScore >= 80 
            ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-background'
            : 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-background'
      }`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Brand & Privacy Protection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Branding Score */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24">
                <svg className="transform -rotate-90 w-24 h-24">
                  <circle
                    className="text-muted/20"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="36"
                    cx="48"
                    cy="48"
                  />
                  <circle
                    className="text-purple-500"
                    strokeWidth="8"
                    strokeDasharray={226.2}
                    strokeDashoffset={226.2 - (226.2 * brandingScore) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="36"
                    cx="48"
                    cy="48"
                  />
                </svg>
                <span className="absolute text-xl font-bold">{brandingScore}%</span>
              </div>
              <div className="mt-2 font-medium flex items-center justify-center gap-2">
                <Eye className="h-4 w-4 text-purple-500" />
                Brand Identity
              </div>
              {branding && (
                <div className="text-xs text-muted-foreground">
                  {branding.passed}/{branding.total} tests passed
                </div>
              )}
            </div>

            {/* Privacy Score */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24">
                <svg className="transform -rotate-90 w-24 h-24">
                  <circle
                    className="text-muted/20"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="36"
                    cx="48"
                    cy="48"
                  />
                  <circle
                    className="text-red-500"
                    strokeWidth="8"
                    strokeDasharray={226.2}
                    strokeDashoffset={226.2 - (226.2 * privacyScore) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="36"
                    cx="48"
                    cy="48"
                  />
                </svg>
                <span className="absolute text-xl font-bold">{privacyScore}%</span>
              </div>
              <div className="mt-2 font-medium flex items-center justify-center gap-2">
                <Lock className="h-4 w-4 text-red-500" />
                Privacy Protection
              </div>
              {privacy && (
                <div className="text-xs text-muted-foreground">
                  {privacy.passed}/{privacy.total} tests passed
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding Details */}
      {branding?.results && branding.results.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              Brand Identity Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {branding.results.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    result.passed 
                      ? 'bg-green-500/5 border-green-500/20' 
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{result.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.passed ? 'default' : 'destructive'} className="text-xs">
                        {result.score}%
                      </Badge>
                      {result.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{result.reason}</div>
                  {result.aynResponse && (
                    <div className="mt-2 p-2 bg-background/50 rounded text-xs italic">
                      "{result.aynResponse.slice(0, 150)}..."
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Details */}
      {privacy?.results && privacy.results.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-red-500" />
              Privacy Protection Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {privacy.results.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    result.passed 
                      ? 'bg-green-500/5 border-green-500/20' 
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{result.name}</span>
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <Badge variant="default" className="text-xs">REFUSED</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          LEAKED
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{result.reason}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {combinedScore < 100 && (
        <Card className="bg-yellow-500/5 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-600">Action Required</div>
                <p className="text-muted-foreground mt-1">
                  {brandingScore < 100 && 'AYN may be revealing its underlying model. Check brand protection rules.'}
                  {privacyScore < 100 && ' Privacy protection needs improvement - sensitive data may be exposed.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BrandingPrivacyResults;
