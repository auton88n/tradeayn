import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, File, ExternalLink, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    url: string;
    name: string;
    type: string;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const FilePreviewDialog = ({ 
  open, 
  onOpenChange, 
  file, 
  onConfirm, 
  onCancel 
}: FilePreviewDialogProps) => {
  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  const fileSize = file.url.length; // Approximate size from URL

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(file.url);
    toast({
      title: "URL Copied",
      description: "File URL copied to clipboard",
    });
  };

  const getFileIcon = () => {
    if (isImage) return <Image className="h-6 w-6 text-primary" />;
    if (isPDF) return <FileText className="h-6 w-6 text-primary" />;
    return <File className="h-6 w-6 text-primary" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            File Preview
          </DialogTitle>
          <DialogDescription>
            Review the uploaded file before sending to AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Info */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {file.type}
                </p>
              </div>
              <Badge variant="secondary" className="ml-2">
                Uploaded
              </Badge>
            </div>
            
            {/* Signed URL */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 min-w-0 bg-background rounded px-3 py-2 border">
                <p className="text-xs font-mono truncate text-muted-foreground">
                  {file.url}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(file.url, '_blank')}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Visual Preview */}
          {isImage && (
            <div className="rounded-lg border overflow-hidden bg-muted/30">
              <img 
                src={file.url} 
                alt={file.name}
                className="w-full h-auto max-h-[300px] object-contain"
              />
            </div>
          )}

          {isPDF && (
            <div className="rounded-lg border overflow-hidden bg-muted/30 flex items-center justify-center h-[200px]">
              <div className="text-center space-y-2">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  PDF Preview not available
                </p>
              </div>
            </div>
          )}

          {!isImage && !isPDF && (
            <div className="rounded-lg border overflow-hidden bg-muted/30 flex items-center justify-center h-[200px]">
              <div className="text-center space-y-2">
                <File className="h-16 w-16 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Preview not available for this file type
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Send to AI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
