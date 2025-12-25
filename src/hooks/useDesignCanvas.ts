import { useState, useCallback, useRef } from 'react';

export interface TextElement {
  id: string;
  type: 'text';
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  shadow: boolean;
  rotation: number;
}

export interface ImageElement {
  id: string;
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export type CanvasElement = TextElement | ImageElement;

export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9';

export interface CanvasState {
  backgroundImage: string | null;
  backgroundColor: string;
  elements: CanvasElement[];
  aspectRatio: AspectRatio;
  selectedElementId: string | null;
}

const aspectRatioDimensions: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
};

export const useDesignCanvas = () => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    backgroundImage: null,
    backgroundColor: '#1a1a2e',
    elements: [],
    aspectRatio: '1:1',
    selectedElementId: null,
  });
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const setBackgroundImage = useCallback((imageUrl: string | null) => {
    setCanvasState(prev => ({ ...prev, backgroundImage: imageUrl }));
  }, []);

  const setBackgroundColor = useCallback((color: string) => {
    setCanvasState(prev => ({ ...prev, backgroundColor: color }));
  }, []);

  const setAspectRatio = useCallback((ratio: AspectRatio) => {
    setCanvasState(prev => ({ ...prev, aspectRatio: ratio }));
  }, []);

  const addTextElement = useCallback((
    text: string = 'Add your text',
    fontSize: number = 48,
    fontWeight: 'normal' | 'bold' = 'bold',
    color: string = '#ffffff'
  ) => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: text,
      x: 50,
      y: 50,
      fontSize,
      fontFamily: 'Inter',
      color,
      fontWeight,
      textAlign: 'center',
      shadow: true,
      rotation: 0,
    };
    setCanvasState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElementId: newElement.id,
    }));
    return newElement.id;
  }, []);

  const addImageElement = useCallback((src: string, width = 150, height = 150) => {
    const newElement: ImageElement = {
      id: `image-${Date.now()}`,
      type: 'image',
      src,
      x: 50,
      y: 50,
      width,
      height,
      rotation: 0,
      opacity: 1,
    };
    setCanvasState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElementId: newElement.id,
    }));
    return newElement.id;
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setCanvasState(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } as CanvasElement : el
      ),
    }));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setCanvasState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
      selectedElementId: prev.selectedElementId === id ? null : prev.selectedElementId,
    }));
  }, []);

  const selectElement = useCallback((id: string | null) => {
    setCanvasState(prev => ({ ...prev, selectedElementId: id }));
  }, []);

  const moveElement = useCallback((id: string, x: number, y: number) => {
    updateElement(id, { x, y });
  }, [updateElement]);

  const bringToFront = useCallback((id: string) => {
    setCanvasState(prev => {
      const element = prev.elements.find(el => el.id === id);
      if (!element) return prev;
      return {
        ...prev,
        elements: [...prev.elements.filter(el => el.id !== id), element],
      };
    });
  }, []);

  const sendToBack = useCallback((id: string) => {
    setCanvasState(prev => {
      const element = prev.elements.find(el => el.id === id);
      if (!element) return prev;
      return {
        ...prev,
        elements: [element, ...prev.elements.filter(el => el.id !== id)],
      };
    });
  }, []);

  const duplicateElement = useCallback((id: string) => {
    setCanvasState(prev => {
      const element = prev.elements.find(el => el.id === id);
      if (!element) return prev;
      const newElement = {
        ...element,
        id: `${element.type}-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
      };
      return {
        ...prev,
        elements: [...prev.elements, newElement],
        selectedElementId: newElement.id,
      };
    });
  }, []);

  const clearCanvas = useCallback(() => {
    setCanvasState({
      backgroundImage: null,
      backgroundColor: '#1a1a2e',
      elements: [],
      aspectRatio: '1:1',
      selectedElementId: null,
    });
  }, []);

  const getSelectedElement = useCallback(() => {
    return canvasState.elements.find(el => el.id === canvasState.selectedElementId) || null;
  }, [canvasState.elements, canvasState.selectedElementId]);

  const getDimensions = useCallback(() => {
    return aspectRatioDimensions[canvasState.aspectRatio];
  }, [canvasState.aspectRatio]);

  return {
    canvasState,
    canvasRef,
    setBackgroundImage,
    setBackgroundColor,
    setAspectRatio,
    addTextElement,
    addImageElement,
    updateElement,
    deleteElement,
    selectElement,
    moveElement,
    bringToFront,
    sendToBack,
    duplicateElement,
    clearCanvas,
    getSelectedElement,
    getDimensions,
  };
};
