import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Download, FileText } from "lucide-react";

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  previewUrl: string | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  open,
  onOpenChange,
  file,
  previewUrl
}) => {
  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isPDF = file.type.includes('pdf');

  const handleDownload = () => {
    if (!previewUrl) return;
    
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isImage ? (
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <img src={previewUrl || ''} alt="" className="w-4 h-4 object-cover rounded" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium truncate max-w-[400px]">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="ml-4 p-2 rounded-lg hover:bg-muted transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto mt-4">
          {isImage && previewUrl ? (
            <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
              <img
                src={previewUrl}
                alt={file.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          ) : isPDF ? (
            <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg min-h-[300px]">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                PDF preview not available. Click download to view the file.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg min-h-[300px]">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                Preview not available for this file type.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
