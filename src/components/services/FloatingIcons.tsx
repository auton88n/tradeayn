import { memo } from 'react';
import { FolderOpen, Link, Mail, BarChart3, Zap, RefreshCw, Settings } from 'lucide-react';

const icons = [
  { Icon: FolderOpen, bg: 'bg-violet-200', iconColor: 'text-violet-600' },
  { Icon: Link, bg: 'bg-sky-200', iconColor: 'text-sky-600' },
  { Icon: BarChart3, bg: 'bg-blue-200', iconColor: 'text-blue-600' },
  { Icon: Zap, bg: 'bg-amber-200', iconColor: 'text-amber-500' },
  { Icon: RefreshCw, bg: 'bg-emerald-200', iconColor: 'text-emerald-600' },
  { Icon: Mail, bg: 'bg-rose-200', iconColor: 'text-rose-500' },
];

const FloatingIcons = memo(() => {
  const radius = 80;

  return (
    <div className="relative h-[200px] flex items-center justify-center" dir="ltr">
      {/* Central Hub - Premium gear icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border border-gray-300/50 dark:border-gray-600/50 flex items-center justify-center shadow-lg z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center shadow-inner">
          <Settings className="w-7 h-7 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
        </div>
      </div>
      
      {/* Positioned icons with pastel backgrounds */}
      {icons.map((item, i) => {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <div
            key={i}
            className={`absolute w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center shadow-md`}
            style={{ 
              left: `calc(50% + ${x}px - 24px)`, 
              top: `calc(50% + ${y}px - 24px)` 
            }}
          >
            <item.Icon className={`w-6 h-6 ${item.iconColor}`} strokeWidth={1.5} />
          </div>
        );
      })}
      
      {/* Connection lines from center to each icon */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
        <g className="text-gray-300 dark:text-gray-600">
          {icons.map((_, i) => {
            const angle = (i * 60 - 90) * (Math.PI / 180);
            const x = 50 + (Math.cos(angle) * radius * 100) / 200;
            const y = 50 + (Math.sin(angle) * radius * 100) / 200;
            
            return (
              <line
                key={i}
                x1="50%"
                y1="50%"
                x2={`${x}%`}
                y2={`${y}%`}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
});

FloatingIcons.displayName = 'FloatingIcons';

export default FloatingIcons;
