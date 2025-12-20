import { AlertTriangle, Clock, X, Bell } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MaintenanceBannerProps {
  isEnabled: boolean;
  message?: string;
  startTime?: string;
  endTime?: string;
  isPreNotice?: boolean;
}

export const MaintenanceBanner = ({ 
  isEnabled, 
  message = "System is currently under maintenance. We apologize for any inconvenience.", 
  startTime, 
  endTime,
  isPreNotice = false
}: MaintenanceBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isEnabled || isDismissed) return null;

  const formatTime = (time: string) => {
    if (!time) return null;
    return new Date(time).toLocaleString();
  };

  // Pre-notice style (yellow/warning)
  if (isPreNotice) {
    return (
      <Alert className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-700 mb-4 relative">
        <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200 font-medium pr-8">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                ⏰ Upcoming Maintenance
              </div>
              <div className="mb-2">{message}</div>
              
              {(startTime || endTime) && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <Clock className="w-4 h-4" />
                  {startTime && endTime ? (
                    <span>
                      {formatTime(startTime)} - {formatTime(endTime)}
                    </span>
                  ) : startTime ? (
                    <span>Starting: {formatTime(startTime)}</span>
                  ) : endTime ? (
                    <span>Expected completion: {formatTime(endTime)}</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </AlertDescription>
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-800"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
        </Button>
      </Alert>
    );
  }

  // Active maintenance style (orange)
  return (
    <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 dark:border-orange-700 mb-4 relative">
      <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="text-orange-800 dark:text-orange-200 font-medium pr-8">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
              🚧 Maintenance Notice
            </div>
            <div className="mb-2">{message}</div>
            
            {(startTime || endTime) && (
              <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                <Clock className="w-4 h-4" />
                {startTime && endTime ? (
                  <span>
                    {formatTime(startTime)} - {formatTime(endTime)}
                  </span>
                ) : startTime ? (
                  <span>Started: {formatTime(startTime)}</span>
                ) : endTime ? (
                  <span>Expected completion: {formatTime(endTime)}</span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </AlertDescription>
      
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-orange-100 dark:hover:bg-orange-800"
        onClick={() => setIsDismissed(true)}
      >
        <X className="h-3 w-3 text-orange-600 dark:text-orange-400" />
      </Button>
    </Alert>
  );
};
