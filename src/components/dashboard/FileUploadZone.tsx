import React from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  isDragOver: boolean;
  isDisabled: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: () => void;
}

export const FileUploadZone = ({
  isDragOver,
  isDisabled,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect
}: FileUploadZoneProps) => {
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-8 transition-all duration-300",
        isDragOver 
          ? "border-primary bg-primary/5 scale-105" 
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {/* Icon */}
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
          isDragOver ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {isDragOver ? (
            <Upload className="w-8 h-8" />
          ) : (
            <Paperclip className="w-8 h-8" />
          )}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {isDragOver ? 'Drop your file here' : 'Upload a file'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Drag and drop your file here, or click the button below to browse
          </p>
        </div>

        {/* Supported File Types */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Supported formats:</p>
          <p>Images (JPG, PNG, GIF, WebP)</p>
          <p>Documents (PDF, DOC, DOCX)</p>
          <p>Text files (TXT, JSON)</p>
          <p className="text-xs opacity-75 mt-2">Maximum file size: 10MB</p>
        </div>

        {/* Browse Button */}
        {!isDragOver && (
          <Button
            onClick={onFileSelect}
            disabled={isDisabled}
            variant="outline"
            className="mt-4"
          >
            <Paperclip className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
        )}
      </div>
    </div>
  );
};
