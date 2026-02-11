import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Activity, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import type { AIEmployee } from './types';

interface EmployeeCardProps {
  employee: AIEmployee;
  activityCount: number;
  lastActive: string | null;
  pendingTasks: number;
  isHealthy: boolean | null;
  onClick: () => void;
  isSelected: boolean;
}

export const EmployeeCard = ({
  employee,
  activityCount,
  lastActive,
  pendingTasks,
  isHealthy,
  onClick,
  isSelected,
}: EmployeeCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        isSelected && 'ring-2 ring-primary shadow-lg'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg shadow-md', employee.gradient)}>
              {employee.emoji}
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">{employee.name}</h3>
              <p className="text-xs text-muted-foreground">{employee.role}</p>
            </div>
          </div>
          {isHealthy !== null && (
            isHealthy ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-destructive" />
            )
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span>{activityCount} actions</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{pendingTasks} pending</span>
          </div>
        </div>

        {lastActive && (
          <p className="text-[10px] text-muted-foreground/70 mt-2">
            Last: {format(new Date(lastActive), 'MMM d, HH:mm')}
          </p>
        )}

        <Badge variant="outline" className="mt-2 text-[10px]">
          → {employee.reportsTo}
        </Badge>
      </CardContent>
    </Card>
  );
};
