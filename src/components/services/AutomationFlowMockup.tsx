import { memo } from 'react';
import { Zap, Settings, CheckCircle } from 'lucide-react';

const AutomationFlowMockup = memo(() => {
  return (
    <div className="relative h-[150px] md:h-[200px] flex items-center justify-center" dir="ltr">
      {/* Flow container */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Trigger Node */}
        <div className="flex flex-col items-center gap-1 md:gap-2">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-700/50 flex items-center justify-center shadow-lg relative">
            <Zap className="w-5 h-5 md:w-7 md:h-7 text-amber-500" strokeWidth={1.5} />
          </div>
          <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Trigger</span>
        </div>

        {/* Connecting Line 1 - Static gradient */}
        <div className="relative w-6 md:w-12 h-1">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-violet-300 dark:from-amber-600 dark:to-violet-600 rounded-full" />
          {/* Static indicator dot */}
          <div 
            className="absolute w-1.5 md:w-2 h-1.5 md:h-2 bg-neutral-700 dark:bg-white rounded-full shadow-md top-1/2 -translate-y-1/2"
            style={{ left: '40%' }}
          />
        </div>

        {/* Process Node */}
        <div className="flex flex-col items-center gap-1 md:gap-2">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-violet-100 dark:bg-violet-900/30 border border-violet-200/50 dark:border-violet-700/50 flex items-center justify-center shadow-lg relative">
            <Settings className="w-6 h-6 md:w-8 md:h-8 text-violet-500" strokeWidth={1.5} />
          </div>
          <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Process</span>
        </div>

        {/* Connecting Line 2 - Static gradient */}
        <div className="relative w-6 md:w-12 h-1">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-300 to-emerald-300 dark:from-violet-600 dark:to-emerald-600 rounded-full" />
          {/* Static indicator dot */}
          <div 
            className="absolute w-1.5 md:w-2 h-1.5 md:h-2 bg-neutral-700 dark:bg-white rounded-full shadow-md top-1/2 -translate-y-1/2"
            style={{ left: '60%' }}
          />
        </div>

        {/* Action Node */}
        <div className="flex flex-col items-center gap-1 md:gap-2">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-700/50 flex items-center justify-center shadow-lg">
            <CheckCircle className="w-5 h-5 md:w-7 md:h-7 text-emerald-500" strokeWidth={1.5} />
          </div>
          <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Action</span>
        </div>
      </div>
    </div>
  );
});

AutomationFlowMockup.displayName = 'AutomationFlowMockup';

export default AutomationFlowMockup;
