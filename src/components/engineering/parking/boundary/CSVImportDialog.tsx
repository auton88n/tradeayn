import React, { useState, useRef } from 'react';
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
import { toast } from 'sonner';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VALID_EXTENSIONS = ['.csv', '.txt', '.xyz', '.pts'];

export function CSVImportDialog({ open, onOpenChange }: CSVImportDialogProps) {
  const { boundaryPoints, setBoundaryPoints } = useParkingSite();
  const [csvText, setCsvText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [parsedPoints, setParsedPoints] = useState<Point2D[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (file: File) => {
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!VALID_EXTENSIONS.includes(ext)) {
      toast.error('Unsupported file type', {
        description: 'Use CSV, TXT, XYZ, or PTS files.'
      });
      return;
    }
    
    try {
      const text = await file.text();
      setFileName(file.name);
      handleTextChange(text);
      toast.success('File loaded', {
        description: `${file.name} ready for import`
      });
    } catch (err) {
      toast.error('Failed to read file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
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
    setFileName(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setCsvText('');
    setParsedPoints([]);
    setParseError(null);
    setFileName(null);
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
            Upload a file or paste coordinates from survey data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            {fileName ? (
              <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                {fileName}
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Drop a file here or{' '}
                  <span className="text-primary font-medium">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports CSV, TXT, XYZ, PTS
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.xyz,.pts"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            or paste coordinates
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Input Area */}
          <div>
            <Label htmlFor="csv-input">Coordinates (X, Y per line)</Label>
            <Textarea
              id="csv-input"
              placeholder={sampleData}
              value={csvText}
              onChange={(e) => {
                setFileName(null);
                handleTextChange(e.target.value);
              }}
              className="h-32 font-mono text-sm mt-2"
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
