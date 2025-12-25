import React, { useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useDesignCanvas } from '@/hooks/useDesignCanvas';
import { DesignCanvas } from '@/components/lab/DesignCanvas';
import { DesignToolbar } from '@/components/lab/DesignToolbar';
import { SEO } from '@/components/SEO';
import html2canvas from 'html2canvas';

const DesignLAB: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialImage = searchParams.get('image') || undefined;
  
  const {
    canvasState,
    canvasRef,
    setBackgroundImage,
    setAspectRatio,
    addTextElement,
    addImageElement,
    updateElement,
    deleteElement,
    selectElement,
    bringToFront,
    sendToBack,
    duplicateElement,
    clearCanvas,
    getSelectedElement,
  } = useDesignCanvas(initialImage);

  const selectedElement = getSelectedElement();

  // Handle background image upload
  const handleBackgroundUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBackgroundImage(result);
      toast.success('Background image added');
    };
    reader.readAsDataURL(file);
  }, [setBackgroundImage]);

  // Handle logo/image upload
  const handleLogoUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Create an image to get dimensions
      const img = new Image();
      img.onload = () => {
        const maxSize = 150;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        addImageElement(result, img.width * scale, img.height * scale);
        toast.success('Image added');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }, [addImageElement]);

  // Export canvas as image
  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return;
    
    try {
      // Temporarily hide selection indicators
      selectElement(null);
      
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `design-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Design exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export design');
    }
  }, [canvasRef, selectElement]);

  // Copy to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    if (!canvasRef.current) return;
    
    try {
      selectElement(null);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          toast.success('Copied to clipboard!');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy to clipboard');
    }
  }, [canvasRef, selectElement]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        selectElement(null);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && canvasState.selectedElementId) {
        e.preventDefault();
        deleteElement(canvasState.selectedElementId);
      }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey) && canvasState.selectedElementId) {
        e.preventDefault();
        duplicateElement(canvasState.selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasState.selectedElementId, selectElement, deleteElement, duplicateElement]);

  return (
    <>
      <SEO 
        title="Design LAB - AYN AI"
        description="Create stunning social media posts with AYN's Design LAB"
      />
      
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <motion.header
          className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold">Design LAB</h1>
                  <p className="text-xs text-muted-foreground">Create social media posts</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Copy
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Area */}
          <DesignCanvas
            canvasState={canvasState}
            canvasRef={canvasRef}
            onSelectElement={selectElement}
            onUpdateElement={updateElement}
            onDeleteElement={deleteElement}
          />
          
          {/* Toolbar */}
          <DesignToolbar
            selectedElement={selectedElement}
            aspectRatio={canvasState.aspectRatio}
            onUploadBackground={handleBackgroundUpload}
            onUploadLogo={handleLogoUpload}
            onAddText={() => addTextElement()}
            onUpdateElement={(updates) => {
              if (canvasState.selectedElementId) {
                updateElement(canvasState.selectedElementId, updates);
              }
            }}
            onDeleteElement={() => {
              if (canvasState.selectedElementId) {
                deleteElement(canvasState.selectedElementId);
              }
            }}
            onDuplicateElement={() => {
              if (canvasState.selectedElementId) {
                duplicateElement(canvasState.selectedElementId);
              }
            }}
            onBringToFront={() => {
              if (canvasState.selectedElementId) {
                bringToFront(canvasState.selectedElementId);
              }
            }}
            onSendToBack={() => {
              if (canvasState.selectedElementId) {
                sendToBack(canvasState.selectedElementId);
              }
            }}
            onSetAspectRatio={setAspectRatio}
            onClearCanvas={clearCanvas}
          />
        </div>
      </div>
    </>
  );
};

export default DesignLAB;
