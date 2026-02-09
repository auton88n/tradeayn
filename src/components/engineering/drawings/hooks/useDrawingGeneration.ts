import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateLayout, errorsToRefinementInstruction } from '../engine/layoutValidator';
import type { FloorPlanLayout } from '../engine/FloorPlanRenderer';

interface GenerationParams {
  style_preset: string;
  custom_description: string;
  num_bedrooms: number;
  num_bathrooms: number;
  target_sqft: number;
  num_storeys: number;
  has_garage: boolean;
  garage_type: string;
  location_country: string;
  location_state_province: string;
  exterior_materials: string[];
}

interface RefinementMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MAX_AUTO_RETRIES = 1;

export function useDrawingGeneration() {
  const [layout, setLayout] = useState<FloorPlanLayout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<RefinementMessage[]>([]);

  const generate = useCallback(async (params: GenerationParams) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-floor-plan-layout', {
        body: params,
      });

      if (fnError) throw fnError;

      if (data?.layout) {
        // Run validation
        const validation = validateLayout(data.layout);

        // Log warnings
        if (validation.warnings.length > 0) {
          console.warn('[LayoutValidator] Warnings:', validation.warnings.map(w => w.message));
        }

        // If blocking errors, attempt one auto-retry
        if (validation.errors.length > 0) {
          console.error('[LayoutValidator] Errors found, attempting auto-fix:', validation.errors.map(e => e.message));

          const refinementInstruction = errorsToRefinementInstruction(validation.errors);

          const { data: retryData, error: retryError } = await supabase.functions.invoke('generate-floor-plan-layout', {
            body: {
              previous_layout: data.layout,
              refinement_instruction: refinementInstruction,
            },
          });

          if (!retryError && retryData?.layout) {
            const retryValidation = validateLayout(retryData.layout);
            if (retryValidation.warnings.length > 0) {
              console.warn('[LayoutValidator] Retry warnings:', retryValidation.warnings.map(w => w.message));
            }
            // Use retry result regardless (it should be better)
            setLayout(retryValidation.snappedLayout);
            setConversationHistory([{
              role: 'assistant',
              content: `Generated a ${params.style_preset.replace(/_/g, ' ')} floor plan: ${params.num_bedrooms} bed, ${params.num_bathrooms} bath, ~${params.target_sqft} sq ft. (Auto-corrected ${validation.errors.length} issue${validation.errors.length > 1 ? 's' : ''})`,
              timestamp: new Date(),
            }]);
            toast.success('Floor plan generated (with auto-corrections)');
            return;
          }
        }

        // Use snapped layout (either no errors, or retry failed — use original snapped)
        setLayout(validation.snappedLayout);
        setConversationHistory([{
          role: 'assistant',
          content: `Generated a ${params.style_preset.replace(/_/g, ' ')} floor plan: ${params.num_bedrooms} bed, ${params.num_bathrooms} bath, ~${params.target_sqft} sq ft.`,
          timestamp: new Date(),
        }]);
        toast.success('Floor plan generated successfully');
      } else {
        throw new Error('No layout data returned');
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to generate floor plan';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const refine = useCallback(async (instruction: string) => {
    if (!layout) return;

    setIsGenerating(true);
    setError(null);

    const newMessage: RefinementMessage = {
      role: 'user',
      content: instruction,
      timestamp: new Date(),
    };
    setConversationHistory(prev => [...prev, newMessage]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-floor-plan-layout', {
        body: {
          previous_layout: layout,
          refinement_instruction: instruction,
        },
      });

      if (fnError) throw fnError;

      if (data?.layout) {
        const validation = validateLayout(data.layout);

        if (validation.warnings.length > 0) {
          console.warn('[LayoutValidator] Refinement warnings:', validation.warnings.map(w => w.message));
        }

        setLayout(validation.snappedLayout);
        setConversationHistory(prev => [...prev, {
          role: 'assistant',
          content: `Layout updated: "${instruction}"`,
          timestamp: new Date(),
        }]);
        toast.success('Layout updated');
      } else {
        throw new Error('No layout data returned');
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to refine layout';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [layout]);

  const reset = useCallback(() => {
    setLayout(null);
    setConversationHistory([]);
    setError(null);
  }, []);

  return {
    layout,
    isGenerating,
    error,
    conversationHistory,
    generate,
    refine,
    reset,
  };
}
