import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, CheckCircle, XCircle, AlertTriangle, Play, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ValidationResult {
  calculator: string;
  overallAccuracy: number;
  grade: string;
  standardsCompliance: { ACI_318: boolean; EUROCODE_2: boolean; SBC_304: boolean };
  issues: string[];
  suggestions: string[];
}

interface StoredResults {
  results: ValidationResult[];
  summary: { overallAccuracy: number; overallGrade: string };
  timestamp: number;
}

const STORAGE_KEY = 'engineering_benchmark_results';

const EngineeringBenchmark: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [summary, setSummary] = useState<{ overallAccuracy: number; overallGrade: string } | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  // Load persisted results on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: StoredResults = JSON.parse(stored);
        setResults(parsed.results);
        setSummary(parsed.summary);
        setLastRun(new Date(parsed.timestamp));
      } catch (e) {
        console.error('Failed to parse stored results:', e);
      }
    }
  }, []);

  const runValidation = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('engineering-ai-validator', {
        body: { calculators: ['beam', 'column', 'foundation', 'slab', 'retaining-wall'] }
      });
      
      if (error) throw error;
      
      const newResults = data.results || [];
      const newSummary = data.summary;
      const now = new Date();
      
      setResults(newResults);
      setSummary(newSummary);
      setLastRun(now);
      
      // Persist to localStorage
      const toStore: StoredResults = {
        results: newResults,
        summary: newSummary,
        timestamp: now.getTime()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      
      toast.success(`Validation complete: ${newSummary?.overallGrade} grade`);
    } catch (err) {
      toast.error('Validation failed');
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };
  
  const formatTimeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-500';
    if (grade.startsWith('B')) return 'text-blue-500';
    if (grade.startsWith('C')) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Engineering Accuracy Benchmark
        </CardTitle>
        <div className="flex items-center gap-2">
          {lastRun && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(lastRun)}
            </span>
          )}
          <Button onClick={runValidation} disabled={isRunning} size="sm">
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isRunning ? 'Validating...' : 'Run Validation'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Overall Accuracy</p>
              <p className="text-2xl font-bold">{summary.overallAccuracy}%</p>
            </div>
            <div className={`text-4xl font-bold ${getGradeColor(summary.overallGrade)}`}>
              {summary.overallGrade}
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {results.map((result) => (
            <div key={result.calculator} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{result.calculator.replace('-', ' ')}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${getGradeColor(result.grade)}`}>{result.grade}</span>
                  <span className="text-sm text-muted-foreground">{result.overallAccuracy}%</span>
                </div>
              </div>
              <Progress value={result.overallAccuracy} className="h-2 mb-2" />
              <div className="flex gap-2 flex-wrap">
                {result.standardsCompliance.ACI_318 ? (
                  <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />ACI 318</Badge>
                ) : (
                  <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />ACI 318</Badge>
                )}
                {result.standardsCompliance.EUROCODE_2 && (
                  <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Eurocode 2</Badge>
                )}
              </div>
              {result.issues.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  {result.issues.length} issues found
                </div>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && !isRunning && (
          <p className="text-center text-muted-foreground py-8">Click "Run Validation" to benchmark engineering calculators against ACI 318 and Eurocode 2 standards</p>
        )}
      </CardContent>
    </Card>
  );
};

export default EngineeringBenchmark;
