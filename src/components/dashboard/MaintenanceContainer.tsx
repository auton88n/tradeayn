import React from 'react';
import { User } from '@supabase/supabase-js';
import { MaintenanceBanner } from '../MaintenanceBanner';

interface MaintenanceContainerProps {
  user: User;
  maintenanceConfig: {
    enableMaintenance: boolean;
    maintenanceMessage: string;
    maintenanceStartTime?: string;
    maintenanceEndTime?: string;
  };
}

export default function MaintenanceContainer({ user, maintenanceConfig }: MaintenanceContainerProps) {
  return (
    <div className="min-h-screen bg-background">
      <MaintenanceBanner 
        isEnabled={maintenanceConfig.enableMaintenance}
        message={maintenanceConfig.maintenanceMessage}
        startTime={maintenanceConfig.maintenanceStartTime}
        endTime={maintenanceConfig.maintenanceEndTime}
      />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse" />
          </div>
          
          <h1 className="text-2xl font-bold">System Maintenance</h1>
          
          <p className="text-muted-foreground">
            {maintenanceConfig.maintenanceMessage}
          </p>
          
          {maintenanceConfig.maintenanceEndTime && (
            <p className="text-sm text-muted-foreground">
              Expected completion: {new Date(maintenanceConfig.maintenanceEndTime).toLocaleString()}
            </p>
          )}
          
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}