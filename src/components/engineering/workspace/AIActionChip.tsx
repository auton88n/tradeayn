import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle, Wand2, Calculator, Save, FileDown, GitCompare, RotateCcw, History, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIAction } from '@/hooks/useEngineeringAIAgent';

const actionIcons: Record<string, React.ElementType> = {
  set_input: Wand2,
  set_multiple_inputs: Wand2,
  calculate: Calculator,
  save_design: Save,
  export_file: FileDown,
  compare_designs: GitCompare,
  reset_form: RotateCcw,
  show_history: History,
  switch_calculator: Layers,
};

const actionLabels: Record<string, (args: Record<string, any>) => string> = {
  set_input: (args) => `Set ${args.field} = ${args.value}`,
  set_multiple_inputs: (args) => `Set ${Object.keys(args.inputs || {}).length} fields`,
  calculate: () => 'Calculating...',
  save_design: (args) => `Saving "${args.name}"`,
  export_file: (args) => `Exporting ${args.format?.toUpperCase()}`,
  compare_designs: () => 'Comparing designs',
  reset_form: () => 'Resetting form',
  show_history: () => 'Opening history',
  switch_calculator: (args) => `Switching to ${args.calculator}`,
};

interface AIActionChipProps {
  action: AIAction;
}

export const AIActionChip: React.FC<AIActionChipProps> = ({ action }) => {
  const Icon = actionIcons[action.tool] || Wand2;
  const getLabel = actionLabels[action.tool] || (() => action.tool);

  const statusColors = {
    pending: 'bg-muted text-muted-foreground',
    executing: 'bg-primary/10 text-primary border-primary/30',
    done: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    error: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        statusColors[action.status]
      )}
    >
      {action.status === 'executing' ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : action.status === 'done' ? (
        <Check className="w-3 h-3" />
      ) : action.status === 'error' ? (
        <AlertCircle className="w-3 h-3" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      <span>{getLabel(action.args)}</span>
    </motion.div>
  );
};
