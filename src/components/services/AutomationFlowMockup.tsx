import { memo } from 'react';
import { Zap, Settings, CheckCircle } from 'lucide-react';

const AutomationFlowMockup = memo(() => {
  return (
    <div className="relative h-[200px] flex items-center justify-center" dir="ltr">
      {/* Flow container */}
      <div className="flex items-center gap-4">
        {/* Trigger Node */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-700/50 flex items-center justify-center shadow-lg relative">
            <Zap className="w-7 h-7 text-amber-500" strokeWidth={1.5} />
            {/* Pulse effect */}
            <div className="absolute inset-0 rounded-2xl bg-amber-400/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Trigger</span>
        </div>

        {/* Connecting Line 1 */}
        <div className="relative w-12 h-1">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-violet-300 dark:from-amber-600 dark:to-violet-600 rounded-full" />
          {/* Animated dot */}
          <div 
            className="absolute w-2 h-2 bg-white dark:bg-gray-200 rounded-full shadow-md top-1/2 -translate-y-1/2"
            style={{
              animation: 'flowDot1 1.5s ease-in-out infinite',
            }}
          />
        </div>

        {/* Process Node */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 border border-violet-200/50 dark:border-violet-700/50 flex items-center justify-center shadow-lg relative">
            <Settings className="w-8 h-8 text-violet-500" strokeWidth={1.5} style={{ animation: 'spin 4s linear infinite' }} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Process</span>
        </div>

        {/* Connecting Line 2 */}
        <div className="relative w-12 h-1">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-300 to-emerald-300 dark:from-violet-600 dark:to-emerald-600 rounded-full" />
          {/* Animated dot */}
          <div 
            className="absolute w-2 h-2 bg-white dark:bg-gray-200 rounded-full shadow-md top-1/2 -translate-y-1/2"
            style={{
              animation: 'flowDot2 1.5s ease-in-out infinite',
              animationDelay: '0.75s',
            }}
          />
        </div>

        {/* Action Node */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-700/50 flex items-center justify-center shadow-lg">
            <CheckCircle className="w-7 h-7 text-emerald-500" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Action</span>
        </div>
      </div>

      {/* CSS for flow dot animations */}
      <style>{`
        @keyframes flowDot1 {
          0% { left: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: calc(100% - 8px); opacity: 0; }
        }
        @keyframes flowDot2 {
          0% { left: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: calc(100% - 8px); opacity: 0; }
        }
      `}</style>
    </div>
  );
});

AutomationFlowMockup.displayName = 'AutomationFlowMockup';

export default AutomationFlowMockup;
