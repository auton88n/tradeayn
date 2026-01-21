import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, CheckCircle, XCircle, AlertTriangle, Play, Loader2 } from 'lucide-react';
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

const EngineeringBenchmark: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [summary, setSummary] = useState<{ overallAccuracy: number; overallGrade: string } | null>(null);

  const runValidation = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('engineering-ai-validator', {
        body: { calculators: ['beam', 'column', 'foundation', 'slab', 'retaining-wall'] }
      });
      
      if (error) throw error;
      
      setResults(data.results || []);
      setSummary(data.summary);
      toast.success(`Validation complete: ${data.summary?.overallGrade} grade`);
    } catch (err) {
      toast.error('Validation failed');
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-500';
    if (grade.startsWith('B')) return 'text-blue-500';
    if (grade.startsWith('C')) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Engineering Accuracy Benchmark
        </CardTitle>
        <Button onClick={runValidation} disabled={isRunning} size="sm">
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          {isRunning ? 'Validating...' : 'Run Validation'}
        </Button>
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
