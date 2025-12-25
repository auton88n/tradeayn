import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, Palette, Loader2, ImageOff, RefreshCw, Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useDesignCanvas } from '@/hooks/useDesignCanvas';
import { DesignCanvas } from '@/components/lab/DesignCanvas';
import { DesignToolbar } from '@/components/lab/DesignToolbar';
import { SEO } from '@/components/SEO';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

interface DesignElement {
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  x: number;
  y: number;
  shadow?: boolean;
}

interface AIDesignResult {
  headline?: DesignElement;
  subtitle?: DesignElement;
  hashtags?: DesignElement;
  cta?: DesignElement;
}

const DesignLAB: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const externalImageUrl = searchParams.get('image') || undefined;
  const contextParam = searchParams.get('context') || undefined;
  const [isLoadingExternalImage, setIsLoadingExternalImage] = useState(!!externalImageUrl);
  const [externalImageError, setExternalImageError] = useState(false);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
  const backgroundUploadRef = React.useRef<HTMLInputElement>(null);
  
  const {
    canvasState,
    canvasRef,
    setBackgroundImage,
    setAspectRatio,
    addTextElement,
    addTextElementWithPosition,
    addImageElement,
    updateElement,
    deleteElement,
    selectElement,
    bringToFront,
    sendToBack,
    duplicateElement,
    clearCanvas,
    clearElements,
    getSelectedElement,
  } = useDesignCanvas();

  // Fetch and convert external image to base64 to bypass CORS
  const fetchExternalImage = useCallback(async () => {
    if (!externalImageUrl) return;
    
    setIsLoadingExternalImage(true);
    setExternalImageError(false);
    
    try {
      const response = await fetch(externalImageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = () => {
        setBackgroundImage(reader.result as string);
        setIsLoadingExternalImage(false);
        setExternalImageError(false);
        toast.success('Image loaded successfully');
      };
      
      reader.onerror = () => {
        setIsLoadingExternalImage(false);
        setExternalImageError(true);
        toast.error('Failed to process image');
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Failed to load external image:', error);
      setIsLoadingExternalImage(false);
      setExternalImageError(true);
      toast.error('Image could not be loaded. It may have expired or is blocked by CORS.');
    }
  }, [externalImageUrl, setBackgroundImage]);

  useEffect(() => {
    fetchExternalImage();
  }, [fetchExternalImage]);

  // Auto-trigger AI design generation when image loads from external URL with context
  useEffect(() => {
    if (canvasState.backgroundImage && contextParam && !isGeneratingDesign && canvasState.elements.length === 0) {
      handleAutoDesign();
    }
  }, [canvasState.backgroundImage, contextParam]);

  // Generate AI design
  const handleAutoDesign = useCallback(async () => {
    if (!canvasState.backgroundImage) {
      toast.error('Please add a background image first');
      return;
    }

    setIsGeneratingDesign(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-design', {
        body: { 
          imageUrl: canvasState.backgroundImage,
          context: contextParam || 'Create an engaging social media post',
          style: 'engaging'
        }
      });

      if (error) throw error;

      const design: AIDesignResult = data.design;
      
      // Clear existing elements before adding new ones
      clearElements();

      // Add design elements to canvas
      if (design.headline) {
        addTextElementWithPosition(
          design.headline.text,
          design.headline.x,
          design.headline.y,
          design.headline.fontSize,
          design.headline.fontWeight,
          design.headline.color,
          design.headline.shadow ?? true
        );
      }

      if (design.subtitle) {
        addTextElementWithPosition(
          design.subtitle.text,
          design.subtitle.x,
          design.subtitle.y,
          design.subtitle.fontSize,
          design.subtitle.fontWeight,
          design.subtitle.color,
          design.subtitle.shadow ?? true
        );
      }

      if (design.cta) {
        addTextElementWithPosition(
          design.cta.text,
          design.cta.x,
          design.cta.y,
          design.cta.fontSize,
          design.cta.fontWeight,
          design.cta.color,
          design.cta.shadow ?? true
        );
      }

      if (design.hashtags) {
        addTextElementWithPosition(
          design.hashtags.text,
          design.hashtags.x,
          design.hashtags.y,
          design.hashtags.fontSize,
          design.hashtags.fontWeight,
          design.hashtags.color,
          design.hashtags.shadow ?? true
        );
      }

      toast.success('✨ AI design generated!');
      selectElement(null);

    } catch (error) {
      console.error('AI design generation failed:', error);
      toast.error('Failed to generate design. Please try again.');
    } finally {
      setIsGeneratingDesign(false);
    }
  }, [canvasState.backgroundImage, contextParam, clearElements, addTextElementWithPosition, selectElement]);

  // Handle manual background upload from error state
  const handleManualUpload = useCallback(() => {
    backgroundUploadRef.current?.click();
  }, []);

  const handleManualUploadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setBackgroundImage(result);
      setExternalImageError(false);
      toast.success('Background image added');
    };
    reader.readAsDataURL(file);
  }, [setBackgroundImage]);

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
                variant="secondary"
                size="sm"
                onClick={handleAutoDesign}
                disabled={isGeneratingDesign || !canvasState.backgroundImage}
                className="gap-2 bg-gradient-to-r from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 border border-primary/30"
              >
                {isGeneratingDesign ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Designing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Auto-Design
                  </>
                )}
              </Button>
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
          {/* Hidden input for manual upload */}
          <input
            ref={backgroundUploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleManualUploadChange}
          />
          
          {/* Canvas Area */}
          {isLoadingExternalImage ? (
            <div className="flex-1 flex items-center justify-center bg-muted/30">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="text-sm text-muted-foreground">Loading image...</p>
              </div>
            </div>
          ) : externalImageError && !canvasState.backgroundImage ? (
            <div className="flex-1 flex items-center justify-center bg-muted/30">
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <ImageOff className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Image Failed to Load</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  The image may have expired or is blocked by CORS restrictions.
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={fetchExternalImage} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </Button>
                  <Button onClick={handleManualUpload} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Manually
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <DesignCanvas
              canvasState={canvasState}
              canvasRef={canvasRef}
              onSelectElement={selectElement}
              onUpdateElement={updateElement}
              onDeleteElement={deleteElement}
            />
          )}
          
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
