import { AlertTriangle, Clock, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MaintenanceBannerProps {
  isEnabled: boolean;
  message?: string;
  startTime?: string;
  endTime?: string;
}

export const MaintenanceBanner = ({ 
  isEnabled, 
  message = "System is currently under maintenance. We apologize for any inconvenience.", 
  startTime, 
  endTime 
}: MaintenanceBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isEnabled || isDismissed) return null;

  const formatTime = (time: string) => {
    if (!time) return null;
    return new Date(time).toLocaleString();
  };

  return (
    <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 mb-4 relative">
      <AlertTriangle className="h-5 w-5 text-orange-600" />
      <AlertDescription className="text-orange-800 font-medium pr-8">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-orange-900 mb-1">
              🚧 Maintenance Notice
            </div>
            <div className="mb-2">{message}</div>
            
            {(startTime || endTime) && (
              <div className="flex items-center gap-2 text-sm text-orange-700">
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
        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-orange-100"
        onClick={() => setIsDismissed(true)}
      >
        <X className="h-3 w-3 text-orange-600" />
      </Button>
    </Alert>
  );
};