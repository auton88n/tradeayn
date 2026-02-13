import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Calculator, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { AIEngineeringResponse } from '@/lib/engineeringKnowledge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AIResponseCardProps {
  response: AIEngineeringResponse;
  onQuickReply?: (question: string) => void;
}

export const AIResponseCard = ({ response, onQuickReply }: AIResponseCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-3">
      {/* Main Answer */}
      <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
        {response.answer}
      </div>

      {/* Warning */}
      {response.warning && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
        >
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <span className="text-xs text-amber-200">{response.warning}</span>
        </motion.div>
      )}

      {/* Expandable Details */}
      {(response.formula || response.calculation || response.codeReference || response.alternatives) && (
        <div className="border-t border-border/50 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Calculator className="h-3 w-3" />
              {showDetails ? 'Hide Details' : 'Show Calculations & References'}
            </span>
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 mt-2"
            >
              {/* Formula */}
              {response.formula && (
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calculator className="h-3 w-3" />
                    <span className="font-medium">{response.formula.name}</span>
                  </div>
                  <code className="block text-xs bg-background/50 p-2 rounded font-mono text-primary">
                    {response.formula.expression}
                  </code>
                  {response.formula.variables && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(response.formula.variables).map(([key, val]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key} = {val.value} {val.unit}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Calculation Steps */}
              {response.calculation && (
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calculator className="h-3 w-3" />
                    <span className="font-medium">Calculation</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-foreground/80">
                    {response.calculation.steps.map((step, i) => (
                      <li key={`step-${i}-${step.slice(0, 20)}`} className="leading-relaxed">{step}</li>
                    ))}
                  </ol>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Result:</span>
                    <Badge className="bg-primary/20 text-primary">
                      {response.calculation.result} {response.calculation.unit}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Code Reference */}
              {response.codeReference && (
                <div className="bg-blue-500/10 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-blue-400">
                    <BookOpen className="h-3 w-3" />
                    <span className="font-medium">{response.codeReference.standard}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Section {response.codeReference.section}
                  </div>
                  <div className="text-xs text-foreground/80">
                    {response.codeReference.requirement}
                  </div>
                </div>
              )}

              {/* Alternatives */}
              {response.alternatives && response.alternatives.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lightbulb className="h-3 w-3" />
                    <span className="font-medium">Alternatives</span>
                  </div>
                  {response.alternatives.map((alt) => (
                    <div key={alt.description} className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{alt.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {alt.costImpact > 0 ? 'Higher cost' : alt.costImpact < 0 ? 'Lower cost' : 'Similar cost'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-green-400 font-medium">Pros:</span>
                          <ul className="list-disc list-inside text-muted-foreground">
                            {alt.pros.map((pro) => <li key={pro}>{pro}</li>)}
                          </ul>
                        </div>
                        <div>
                          <span className="text-red-400 font-medium">Cons:</span>
                          <ul className="list-disc list-inside text-muted-foreground">
                            {alt.cons.map((con) => <li key={con}>{con}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Quick Replies */}
      {response.quickReplies && response.quickReplies.length > 0 && onQuickReply && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {response.quickReplies.slice(0, 3).map((reply) => (
            <Button
              key={reply}
              variant="outline"
              size="sm"
              onClick={() => onQuickReply(reply)}
              className="text-xs h-7 px-2 bg-muted/30 border-border/50 hover:bg-muted/50"
            >
              {reply}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
