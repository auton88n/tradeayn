import React from 'react';
import { motion } from 'framer-motion';
import { Car, Accessibility, Zap, TrendingUp, Download, FileText, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ParkingStats {
  totalSpaces: number;
  accessibleSpaces: number;
  evSpaces: number;
  efficiency: number;
}

interface ParkingStatsBarProps {
  stats: ParkingStats;
  viewMode: '2d' | '3d';
  onViewModeChange: (mode: '2d' | '3d') => void;
  onExportDXF?: () => void;
  onExportPDF?: () => void;
  onSave?: () => void;
  className?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-xl",
      "bg-gradient-to-br from-background/80 to-background/40",
      "border border-border/50 backdrop-blur-sm"
    )}
  >
    <div className={cn("p-2 rounded-lg", color)}>
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-xl font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  </motion.div>
);

export const ParkingStatsBar: React.FC<ParkingStatsBarProps> = ({
  stats,
  viewMode,
  onViewModeChange,
  onExportDXF,
  onExportPDF,
  onSave,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-between gap-4 p-3",
        "bg-gradient-to-r from-card/95 via-card to-card/95",
        "border border-border/50 rounded-2xl backdrop-blur-md",
        "shadow-lg shadow-black/5",
        className
      )}
    >
      {/* Stats Cards */}
      <div className="flex items-center gap-3">
        <StatCard
          icon={<Car className="w-4 h-4 text-primary-foreground" />}
          value={stats.totalSpaces}
          label="Total Spaces"
          color="bg-primary"
        />
        <StatCard
          icon={<Accessibility className="w-4 h-4 text-blue-100" />}
          value={stats.accessibleSpaces}
          label="ADA"
          color="bg-blue-500"
        />
        <StatCard
          icon={<Zap className="w-4 h-4 text-green-100" />}
          value={stats.evSpaces}
          label="EV Charging"
          color="bg-green-500"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-amber-100" />}
          value={`${stats.efficiency}%`}
          label="Efficiency"
          color="bg-amber-500"
        />
      </div>

      {/* View Mode & Export */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => onViewModeChange('2d')}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
              viewMode === '2d'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            2D Plan
          </button>
          <button
            onClick={() => onViewModeChange('3d')}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
              viewMode === '3d'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            3D View
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-1 ml-2">
          {onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              className="gap-1.5 text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportDXF}
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            DXF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            className="gap-1.5 text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ParkingStatsBar;
