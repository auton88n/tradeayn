import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, Palette, Loader2, ImageOff, RefreshCw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useDesignCanvas, TextEffect } from '@/hooks/useDesignCanvas';
import { DesignCanvas } from '@/components/lab/DesignCanvas';
import { DesignToolbar } from '@/components/lab/DesignToolbar';
import { AIDesignVariations, DesignVariation, DesignElement } from '@/components/lab/AIDesignVariations';
import { SEO } from '@/components/SEO';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

interface AIDesignResult {
  design?: DesignVariation;
  variations?: DesignVariation[];
  imageAnalysis?: {
    dominantColors: string[];
    mood: string;
    safeZones: { x: number; y: number }[];
    suggestedFontCategory: string;
  };
}

type DesignStyle = 'minimalist' | 'engaging' | 'promotional' | 'inspirational';
type Platform = 'instagram' | 'linkedin' | 'tiktok' | 'twitter' | 'facebook';
type StyleTransferStyle = 'instagram' | 'cyberpunk' | 'vintage' | 'luxury' | 'neon' | 'minimal';

const DesignLAB: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const externalImageUrl = searchParams.get('image') || undefined;
  const contextParam = searchParams.get('context') || undefined;
  const [isLoadingExternalImage, setIsLoadingExternalImage] = useState(!!externalImageUrl);
  const [externalImageError, setExternalImageError] = useState(false);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
  const [designContext, setDesignContext] = useState(contextParam || '');
  const [designStyle, setDesignStyle] = useState<DesignStyle>('engaging');
  const [designVariations, setDesignVariations] = useState<DesignVariation[]>([]);
  const [showVariations, setShowVariations] = useState(false);
  // AI Magic states
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  // Caption Generator states
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState('');
  
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
          context: designContext || contextParam || 'Create an engaging social media post',
          style: designStyle
        }
      });

      if (error) throw error;

      const result: AIDesignResult = data;
      
      // If we have multiple variations, show the picker
      if (result.variations && result.variations.length > 1) {
        setDesignVariations(result.variations);
        setShowVariations(true);
        toast.success('✨ 4 AI designs generated! Pick your favorite.');
      } else {
        // Apply single design directly
        const design = result.design || result.variations?.[0];
        if (design) {
          applyDesignVariation(design);
          toast.success('✨ AI design generated!');
        }
      }

    } catch (error) {
      console.error('AI design generation failed:', error);
      toast.error('Failed to generate design. Please try again.');
    } finally {
      setIsGeneratingDesign(false);
    }
  }, [canvasState.backgroundImage, designContext, contextParam, designStyle]);

  // Apply a design variation to the canvas
  const applyDesignVariation = useCallback((design: DesignVariation) => {
    clearElements();

    const addElement = (el: DesignElement | undefined) => {
      if (!el) return;
      addTextElementWithPosition(
        el.text,
        el.x,
        el.y,
        el.fontSize,
        el.fontWeight,
        el.color,
        el.shadow ?? true,
        el.fontFamily || 'Montserrat',
        el.letterSpacing || 0,
        el.lineHeight || 1.2,
        el.opacity || 1,
        el.textStroke || null,
        el.gradient || null,
        (el.effect as TextEffect) || 'none'
      );
    };

    addElement(design.headline);
    addElement(design.subtitle);
    addElement(design.cta);
    addElement(design.hashtags);

    selectElement(null);
    setShowVariations(false);
  }, [clearElements, addTextElementWithPosition, selectElement]);

  // AI Magic: Remove Background
  const handleRemoveBackground = useCallback(async () => {
    if (!canvasState.backgroundImage) return;
    
    setIsProcessingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-edit-image', {
        body: { 
          imageUrl: canvasState.backgroundImage,
          action: 'remove-background'
        }
      });

      if (error) throw error;

      if (data?.editedImageUrl) {
        setBackgroundImage(data.editedImageUrl);
        toast.success('Background removed!');
      } else if (data?.guidance) {
        toast.info(data.guidance);
      }
    } catch (error) {
      console.error('Remove background failed:', error);
      toast.error('Failed to remove background');
    } finally {
      setIsProcessingImage(false);
    }
  }, [canvasState.backgroundImage, setBackgroundImage]);

  // AI Magic: Enhance Image
  const handleEnhanceImage = useCallback(async () => {
    if (!canvasState.backgroundImage) return;
    
    setIsProcessingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-edit-image', {
        body: { 
          imageUrl: canvasState.backgroundImage,
          action: 'enhance'
        }
      });

      if (error) throw error;

      if (data?.editedImageUrl) {
        setBackgroundImage(data.editedImageUrl);
        toast.success('Image enhanced!');
      } else if (data?.guidance) {
        toast.info(data.guidance);
      }
    } catch (error) {
      console.error('Enhance image failed:', error);
      toast.error('Failed to enhance image');
    } finally {
      setIsProcessingImage(false);
    }
  }, [canvasState.backgroundImage, setBackgroundImage]);

  // AI Magic: Style Transfer
  const handleStyleTransfer = useCallback(async (style: StyleTransferStyle) => {
    if (!canvasState.backgroundImage) return;
    
    setIsProcessingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-edit-image', {
        body: { 
          imageUrl: canvasState.backgroundImage,
          action: 'style-transfer',
          options: { style }
        }
      });

      if (error) throw error;

      if (data?.editedImageUrl) {
        setBackgroundImage(data.editedImageUrl);
        toast.success(`${style.charAt(0).toUpperCase() + style.slice(1)} style applied!`);
      } else if (data?.guidance) {
        toast.info(data.guidance);
      }
    } catch (error) {
      console.error('Style transfer failed:', error);
      toast.error('Failed to apply style');
    } finally {
      setIsProcessingImage(false);
    }
  }, [canvasState.backgroundImage, setBackgroundImage]);

  // Caption Generator
  const handleGenerateCaption = useCallback(async (platform: Platform) => {
    if (!canvasState.backgroundImage) return;
    
    setIsGeneratingCaption(true);
    setGeneratedCaption('');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-caption-generator', {
        body: { 
          imageUrl: canvasState.backgroundImage,
          context: designContext || 'social media post',
          platform,
          tone: designStyle === 'promotional' ? 'persuasive' : 
                designStyle === 'inspirational' ? 'inspirational' : 
                designStyle === 'minimalist' ? 'concise' : 'engaging'
        }
      });

      if (error) throw error;

      if (data?.caption) {
        setGeneratedCaption(data.caption);
        toast.success('Caption generated!');
      }
    } catch (error) {
      console.error('Caption generation failed:', error);
      toast.error('Failed to generate caption');
    } finally {
      setIsGeneratingCaption(false);
    }
  }, [canvasState.backgroundImage, designContext, designStyle]);

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
          className="flex-shrink-0 border-b border-border bg-background"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between px-4 h-14">
            {/* Left - Logo & Title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="h-8 w-8 rounded-lg hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold hidden sm:inline">Design LAB</span>
              </div>
            </div>
            
            {/* Right - Actions */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyToClipboard}
                className="h-8 gap-1.5 text-xs font-medium hover:bg-muted"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                className="h-8 gap-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Main Content - Toolbar on LEFT, Canvas in center */}
        <div className="flex-1 flex overflow-hidden">
          {/* Hidden input for manual upload */}
          <input
            ref={backgroundUploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleManualUploadChange}
          />
          
          {/* Left Toolbar */}
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
            designContext={designContext}
            onDesignContextChange={setDesignContext}
            designStyle={designStyle}
            onDesignStyleChange={setDesignStyle}
            onGenerateDesign={handleAutoDesign}
            isGeneratingDesign={isGeneratingDesign}
            hasBackgroundImage={!!canvasState.backgroundImage}
            onRemoveBackground={handleRemoveBackground}
            onEnhanceImage={handleEnhanceImage}
            onStyleTransfer={handleStyleTransfer}
            isProcessingImage={isProcessingImage}
            onGenerateCaption={handleGenerateCaption}
            isGeneratingCaption={isGeneratingCaption}
            generatedCaption={generatedCaption}
          />
          
          {/* Canvas Area */}
          {isLoadingExternalImage ? (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Loading image...</p>
              </div>
            </div>
          ) : externalImageError && !canvasState.backgroundImage ? (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center p-6">
                <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                  <ImageOff className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-sm font-medium mb-1">Image Failed to Load</h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                  The image may have expired or is blocked.
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={fetchExternalImage} variant="outline" size="sm" className="gap-1.5 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </Button>
                  <Button onClick={handleManualUpload} size="sm" className="gap-1.5 text-xs">
                    <Upload className="w-3.5 h-3.5" />
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
        </div>
      </div>

      {/* AI Design Variations Modal */}
      {showVariations && (
        <AIDesignVariations
          variations={designVariations}
          backgroundImage={canvasState.backgroundImage}
          isLoading={isGeneratingDesign && designVariations.length === 0}
          onSelectVariation={applyDesignVariation}
          onClose={() => setShowVariations(false)}
        />
      )}
    </>
  );
};

export default DesignLAB;
