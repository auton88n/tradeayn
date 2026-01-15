import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useParkingSite } from '../context/ParkingSiteContext';
import { CSVImportDialog } from './CSVImportDialog';

export function BoundaryPointsTable() {
  const { boundaryPoints, addPoint, updatePoint, deletePoint, reorderPoints } = useParkingSite();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleAddPoint = () => {
    // Add point at origin or offset from last point
    if (boundaryPoints.length === 0) {
      addPoint(0, 0);
    } else {
      const lastPoint = boundaryPoints[boundaryPoints.length - 1];
      addPoint(lastPoint.x + 10, lastPoint.y);
    }
  };

  const handleXChange = (id: string, value: string) => {
    const x = parseFloat(value);
    if (!isNaN(x)) {
      const point = boundaryPoints.find(p => p.id === id);
      if (point) {
        updatePoint(id, x, point.y);
      }
    }
  };

  const handleYChange = (id: string, value: string) => {
    const y = parseFloat(value);
    if (!isNaN(y)) {
      const point = boundaryPoints.find(p => p.id === id);
      if (point) {
        updatePoint(id, point.x, y);
      }
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      reorderPoints(dragIndex, index);
      setDragIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <div className="bg-card border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Boundary Points</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsImportOpen(true)}
          className="gap-1 text-xs"
        >
          <FileText className="w-3 h-3" />
          Import
        </Button>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[24px_1fr_1fr_32px] gap-2 px-2 pb-2 text-xs text-muted-foreground font-medium border-b">
        <div>#</div>
        <div>X (m)</div>
        <div>Y (m)</div>
        <div></div>
      </div>

      {/* Points List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-1 py-2">
          {boundaryPoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No boundary points</p>
              <p className="text-xs">Add points or import from CSV</p>
            </div>
          ) : (
            boundaryPoints.map((point, index) => (
              <div
                key={point.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`grid grid-cols-[24px_1fr_1fr_32px] gap-2 items-center px-2 py-1 rounded transition-colors ${
                  dragIndex === index ? 'bg-primary/10' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center cursor-grab">
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground ml-1">{index + 1}</span>
                </div>
                
                <Input
                  type="number"
                  step="0.01"
                  value={point.x}
                  onChange={(e) => handleXChange(point.id, e.target.value)}
                  className="h-7 text-xs"
                />
                
                <Input
                  type="number"
                  step="0.01"
                  value={point.y}
                  onChange={(e) => handleYChange(point.id, e.target.value)}
                  className="h-7 text-xs"
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePoint(point.id)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Add Point Button */}
      <div className="pt-3 border-t mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddPoint}
          className="w-full gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Point
        </Button>
      </div>

      <CSVImportDialog 
        open={isImportOpen} 
        onOpenChange={setIsImportOpen}
      />
    </div>
  );
}
