import { useState, useCallback, useRef } from 'react';

// Professional font library - 50+ fonts grouped by category
export const professionalFonts = {
  display: [
    'Bebas Neue', 'Oswald', 'Anton', 'Playfair Display', 'Abril Fatface',
    'Russo One', 'Righteous', 'Alfa Slab One', 'Passion One', 'Bungee'
  ],
  elegant: [
    'Cormorant Garamond', 'Libre Baskerville', 'EB Garamond', 'Crimson Pro', 'Lora',
    'Merriweather', 'Spectral', 'Cardo', 'Old Standard TT', 'Noto Serif'
  ],
  modern: [
    'Montserrat', 'Poppins', 'Raleway', 'Nunito Sans', 'Source Sans 3',
    'Open Sans', 'Lato', 'Rubik', 'Inter', 'DM Sans'
  ],
  bold: [
    'Archivo Black', 'Work Sans', 'Barlow', 'Fjalla One', 'Teko',
    'Kanit', 'Exo 2', 'Titillium Web', 'Saira', 'Orbitron'
  ],
  creative: [
    'Pacifico', 'Lobster', 'Satisfy', 'Dancing Script', 'Great Vibes',
    'Caveat', 'Kaushan Script', 'Sacramento', 'Amatic SC', 'Permanent Marker'
  ],
};

export const allFonts = Object.values(professionalFonts).flat();

export type TextEffect = 'none' | 'neon' | 'outline' | 'shadow3d' | 'glass';

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
  // New professional properties
  letterSpacing: number;
  lineHeight: number;
  opacity: number;
  textStroke: { width: number; color: string } | null;
  gradient: { from: string; to: string; angle: number } | null;
  effect: TextEffect;
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
      fontFamily: 'Montserrat',
      color,
      fontWeight,
      textAlign: 'center',
      shadow: true,
      rotation: 0,
      // New professional defaults
      letterSpacing: 0,
      lineHeight: 1.2,
      opacity: 1,
      textStroke: null,
      gradient: null,
      effect: 'none',
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
        x: Math.min(element.x + 5, 90),
        y: Math.min(element.y + 5, 90),
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

  const clearElements = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      elements: [],
      selectedElementId: null,
    }));
  }, []);

  // Enhanced function with all professional properties
  const addTextElementWithPosition = useCallback((
    text: string,
    x: number,
    y: number,
    fontSize: number = 48,
    fontWeight: 'normal' | 'bold' = 'bold',
    color: string = '#ffffff',
    shadow: boolean = true,
    fontFamily: string = 'Montserrat',
    letterSpacing: number = 0,
    lineHeight: number = 1.2,
    opacity: number = 1,
    textStroke: { width: number; color: string } | null = null,
    gradient: { from: string; to: string; angle: number } | null = null,
    effect: TextEffect = 'none'
  ) => {
    const newElement: TextElement = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      content: text,
      x,
      y,
      fontSize,
      fontFamily,
      color,
      fontWeight,
      textAlign: 'center',
      shadow,
      rotation: 0,
      letterSpacing,
      lineHeight,
      opacity,
      textStroke,
      gradient,
      effect,
    };
    setCanvasState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    return newElement.id;
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
    addTextElementWithPosition,
    addImageElement,
    updateElement,
    deleteElement,
    selectElement,
    moveElement,
    bringToFront,
    sendToBack,
    duplicateElement,
    clearCanvas,
    clearElements,
    getSelectedElement,
    getDimensions,
  };
};
