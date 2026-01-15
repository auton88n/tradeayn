import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useParkingSite } from '../context/ParkingSiteContext';
import { parsePointsFromText, roundTo } from '../utils/geometry';
import { Point2D } from '../types/parking.types';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVImportDialog({ open, onOpenChange }: CSVImportDialogProps) {
  const { boundaryPoints, setBoundaryPoints } = useParkingSite();
  const [csvText, setCsvText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [parsedPoints, setParsedPoints] = useState<Point2D[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleTextChange = (text: string) => {
    setCsvText(text);
    setParseError(null);
    
    if (text.trim()) {
      try {
        const points = parsePointsFromText(text);
        if (points.length === 0) {
          setParseError('No valid coordinates found');
          setParsedPoints([]);
        } else {
          setParsedPoints(points);
        }
      } catch (err) {
        setParseError('Failed to parse coordinates');
        setParsedPoints([]);
      }
    } else {
      setParsedPoints([]);
    }
  };

  const handleImport = () => {
    if (parsedPoints.length === 0) return;
    
    if (replaceExisting) {
      setBoundaryPoints(parsedPoints);
    } else {
      setBoundaryPoints([...boundaryPoints, ...parsedPoints]);
    }
    
    onOpenChange(false);
    setCsvText('');
    setParsedPoints([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setCsvText('');
    setParsedPoints([]);
    setParseError(null);
  };

  const sampleData = `# Example formats (comma, tab, or space separated)
0, 0
50, 0
50, 30
25, 40
0, 30`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Boundary Points
          </DialogTitle>
          <DialogDescription>
            Paste coordinates from survey data, CSV, or spreadsheet.
            Supports comma, tab, or space-separated values.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input Area */}
          <div>
            <Label htmlFor="csv-input">Coordinates (X, Y per line)</Label>
            <Textarea
              id="csv-input"
              placeholder={sampleData}
              value={csvText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="h-40 font-mono text-sm mt-2"
            />
          </div>

          {/* Parse Status */}
          {parseError && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {parseError}
            </div>
          )}

          {parsedPoints.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Found {parsedPoints.length} valid points
              </div>
              
              {/* Preview */}
              <ScrollArea className="h-24 border rounded-md p-2">
                <div className="text-xs font-mono space-y-0.5">
                  {parsedPoints.slice(0, 10).map((p, i) => (
                    <div key={p.id} className="text-muted-foreground">
                      {i + 1}. ({roundTo(p.x, 2)}, {roundTo(p.y, 2)})
                    </div>
                  ))}
                  {parsedPoints.length > 10 && (
                    <div className="text-muted-foreground">
                      ... and {parsedPoints.length - 10} more
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Replace/Append Option */}
          {boundaryPoints.length > 0 && (
            <div className="flex items-center justify-between">
              <Label htmlFor="replace-toggle" className="text-sm">
                Replace existing {boundaryPoints.length} points
              </Label>
              <Switch
                id="replace-toggle"
                checked={replaceExisting}
                onCheckedChange={setReplaceExisting}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={parsedPoints.length === 0}
          >
            Import {parsedPoints.length} Points
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
