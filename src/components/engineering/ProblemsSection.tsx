import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ChevronDown,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Problem {
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  impact: string;
  location?: string;
}

interface ProblemsSummary {
  critical: number;
  warnings: number;
  info: number;
}

interface ProblemsSectionProps {
  problems: Problem[];
  problemsSummary: ProblemsSummary;
}

interface GroupedProblem {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  problems: Problem[];
  summary: string;
  valueRange?: { min: number; max: number };
}

export const ProblemsSection: React.FC<ProblemsSectionProps> = ({
  problems,
  problemsSummary
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['critical']));

  // Group problems by type and extract meaningful summaries
  const groupedProblems = useMemo(() => {
    const groups: Record<string, Problem[]> = {};
    
    problems.forEach(problem => {
      const key = problem.type || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(problem);
    });

    // Convert to array and add smart summaries
    const result: GroupedProblem[] = Object.entries(groups).map(([type, probs]) => {
      const severity = probs[0].severity;
      let summary = `${probs.length} ${probs.length === 1 ? 'issue' : 'issues'} detected`;
      let valueRange: { min: number; max: number } | undefined;

      // Extract numeric values for range display (e.g., slope percentages)
      const numericValues: number[] = [];
      probs.forEach(p => {
        const matches = p.message.match(/(\d+\.?\d*)\s*%/g);
        if (matches) {
          matches.forEach(m => {
            const num = parseFloat(m);
            if (!isNaN(num)) numericValues.push(num);
          });
        }
      });

      if (numericValues.length > 1) {
        valueRange = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues)
        };
      }

      // Create smart summaries based on problem type
      if (type.toLowerCase().includes('slope')) {
        if (valueRange) {
          summary = `${probs.length} slopes exceed limit (${valueRange.min.toFixed(1)}% - ${valueRange.max.toFixed(1)}%)`;
        } else {
          summary = `${probs.length} slope ${probs.length === 1 ? 'segment exceeds' : 'segments exceed'} maximum grade`;
        }
      } else if (type.toLowerCase().includes('drainage') || type.toLowerCase().includes('flat')) {
        summary = `${probs.length} ${probs.length === 1 ? 'area has' : 'areas have'} poor drainage (< 0.5% slope)`;
      } else if (type.toLowerCase().includes('balance') || type.toLowerCase().includes('earthwork')) {
        summary = probs[0].message;
      } else if (probs.length === 1) {
        summary = probs[0].message;
      }

      return {
        type,
        severity,
        problems: probs,
        summary,
        valueRange
      };
    });

    // Sort: critical first, then by count
    return result.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.problems.length - a.problems.length;
    });
  }, [problems]);

  const toggleGroup = (type: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedGroups(newExpanded);
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          headerBg: 'bg-red-500/10 hover:bg-red-500/15',
          iconColor: 'text-red-500',
          borderColor: 'border-red-500/30',
          badgeBg: 'bg-red-500'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          headerBg: 'bg-amber-500/10 hover:bg-amber-500/15',
          iconColor: 'text-amber-500',
          borderColor: 'border-amber-500/30',
          badgeBg: 'bg-amber-500'
        };
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          headerBg: 'bg-blue-500/10 hover:bg-blue-500/15',
          iconColor: 'text-blue-500',
          borderColor: 'border-blue-500/30',
          badgeBg: 'bg-blue-500'
        };
    }
  };

  const formatLocation = (location: string) => {
    // Clean up location formatting
    return location
      .replace(/Station/gi, 'Sta.')
      .replace(/(\d+)\+(\d+)/g, '$1+$2')
      .trim();
  };

  if (problems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Problems Identified
            </span>
            <div className="flex gap-2">
              {problemsSummary.critical > 0 && (
                <Badge variant="destructive" className="font-medium">
                  {problemsSummary.critical} Critical
                </Badge>
              )}
              {problemsSummary.warnings > 0 && (
                <Badge className="bg-amber-500 font-medium">
                  {problemsSummary.warnings} Warnings
                </Badge>
              )}
              {problemsSummary.info > 0 && (
                <Badge variant="secondary" className="font-medium">
                  {problemsSummary.info} Info
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {groupedProblems.map((group) => {
            const styles = getSeverityStyles(group.severity);
            const isExpanded = expandedGroups.has(group.type) || group.severity === 'critical';
            const showExpandOption = group.problems.length > 1;

            return (
              <Collapsible
                key={group.type}
                open={isExpanded}
                onOpenChange={() => showExpandOption && toggleGroup(group.type)}
              >
                <div className={`rounded-lg border ${styles.borderColor} overflow-hidden`}>
                  <CollapsibleTrigger 
                    className={`w-full p-4 ${styles.headerBg} transition-colors ${showExpandOption ? 'cursor-pointer' : 'cursor-default'}`}
                    disabled={!showExpandOption}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={styles.iconColor}>
                          {styles.icon}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{group.type}</span>
                            <Badge className={`${styles.badgeBg} text-xs px-1.5 py-0`}>
                              {group.problems.length}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {group.summary}
                          </p>
                        </div>
                      </div>
                      {showExpandOption && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs">
                            {isExpanded ? 'Hide details' : 'Show details'}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <AnimatePresence>
                      {isExpanded && group.problems.length > 1 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-t border-border/50 bg-muted/30"
                        >
                          <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                            {group.problems.map((problem, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 p-2 rounded bg-background/50 text-sm"
                              >
                                <span className={`${styles.iconColor} mt-0.5`}>
                                  <ChevronRight className="h-3 w-3" />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-foreground">{problem.message}</p>
                                  {problem.location && (
                                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      <MapPin className="h-3 w-3" />
                                      {formatLocation(problem.location)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CollapsibleContent>

                  {/* Single item - show impact inline */}
                  {group.problems.length === 1 && (
                    <div className="px-4 pb-3 pt-0">
                      <p className="text-sm text-muted-foreground pl-8">
                        {group.problems[0].impact}
                      </p>
                      {group.problems[0].location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1 pl-8">
                          <MapPin className="h-3 w-3" />
                          {formatLocation(group.problems[0].location)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};
