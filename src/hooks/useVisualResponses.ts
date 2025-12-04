import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VisualPanel, CanvasPanelPosition, UseVisualResponsesReturn } from '@/types/dashboard.types';

// Visual intent detection keywords
const VISUAL_TRIGGERS = {
  // Direct phrases that ALWAYS trigger image generation
  direct: ['show me', 'draw me', 'visualize', 'imagine', 'picture of', 'image of', 'أرني', 'ارسم لي', 'تخيل'],
  // Generate keywords
  generate: ['generate', 'create', 'draw', 'make', 'design', 'render', 'paint'],
  // Arabic keywords  
  arabic: ['أرني', 'ارسم', 'اعرض', 'صور', 'تخيل', 'اصنع', 'صمم'],
  // Image type keywords
  imageTypes: ['image', 'picture', 'diagram', 'chart', 'illustration', 'logo', 'photo', 'graphic', 'صورة', 'رسم'],
  // Explicit full phrases
  explicit: ['can you show', 'let me see', 'make an image of', 'create a picture', 'generate an image'],
};

// Available positions for panels - cycle through them
const POSITION_CYCLE: CanvasPanelPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

export const useVisualResponses = (): UseVisualResponsesReturn => {
  const [panels, setPanels] = useState<VisualPanel[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect if a message contains visual generation intent
  const detectVisualIntent = useCallback((message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    
    // Check for DIRECT visual phrases first - these ALWAYS trigger images
    for (const phrase of VISUAL_TRIGGERS.direct) {
      if (lowerMessage.includes(phrase)) return true;
    }
    
    // Check for explicit visual requests
    for (const phrase of VISUAL_TRIGGERS.explicit) {
      if (lowerMessage.includes(phrase)) return true;
    }
    
    // Check for generate keywords + image types
    const hasGenerateKeyword = VISUAL_TRIGGERS.generate.some(kw => lowerMessage.includes(kw));
    const hasImageType = VISUAL_TRIGGERS.imageTypes.some(type => lowerMessage.includes(type));
    
    if (hasGenerateKeyword && hasImageType) return true;
    
    // Check Arabic keywords
    for (const keyword of VISUAL_TRIGGERS.arabic) {
      if (message.includes(keyword)) return true;
    }
    
    return false;
  }, []);

  // Get next available position
  const getNextPosition = useCallback((): CanvasPanelPosition => {
    const usedPositions = new Set(panels.map(p => p.position));
    
    // Find first unused position
    for (const pos of POSITION_CYCLE) {
      if (!usedPositions.has(pos)) return pos;
    }
    
    // All positions used, cycle back to first
    return POSITION_CYCLE[panels.length % POSITION_CYCLE.length];
  }, [panels]);

  // Generate an image using the edge function
  const generateImage = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setError(null);

    // Create placeholder panel immediately for visual feedback
    const newPanelId = `panel-${Date.now()}`;
    const position = getNextPosition();
    
    const placeholderPanel: VisualPanel = {
      id: newPanelId,
      type: 'image',
      content: '', // Empty while generating
      title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
      position,
      createdAt: new Date(),
      prompt,
    };

    setPanels(prev => [...prev, placeholderPanel]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-image', {
        body: { prompt }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to generate image');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.imageUrl) {
        throw new Error('No image returned from generation');
      }

      // Update panel with generated image
      setPanels(prev => prev.map(p => 
        p.id === newPanelId 
          ? { ...p, content: data.imageUrl }
          : p
      ));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Image generation failed';
      setError(errorMessage);
      
      // Remove the placeholder panel on error
      setPanels(prev => prev.filter(p => p.id !== newPanelId));
    } finally {
      setIsGenerating(false);
    }
  }, [getNextPosition]);

  // Close a specific panel
  const closePanel = useCallback((panelId: string) => {
    setPanels(prev => prev.filter(p => p.id !== panelId));
  }, []);

  // Clear all panels
  const clearAllPanels = useCallback(() => {
    setPanels([]);
  }, []);

  return {
    panels,
    isGenerating,
    error,
    generateImage,
    closePanel,
    clearAllPanels,
    detectVisualIntent,
  };
};
