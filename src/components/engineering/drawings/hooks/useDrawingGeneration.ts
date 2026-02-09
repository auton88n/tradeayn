import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
        setLayout(data.layout);
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
        setLayout(data.layout);
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
