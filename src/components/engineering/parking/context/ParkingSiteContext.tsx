import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Point2D, ParkingSite, Polygon, CanvasMode, GeneratedLayout } from '../types/parking.types';
import { generatePointId } from '../utils/geometry';

interface ParkingSiteContextValue {
  // Site data
  site: ParkingSite;
  
  // Boundary management
  boundaryPoints: Point2D[];
  setBoundaryPoints: (points: Point2D[]) => void;
  addPoint: (x: number, y: number) => void;
  updatePoint: (id: string, x: number, y: number) => void;
  deletePoint: (id: string) => void;
  reorderPoints: (fromIndex: number, toIndex: number) => void;
  clearBoundary: () => void;
  
  // Canvas state
  canvasMode: CanvasMode;
  setCanvasMode: (mode: CanvasMode) => void;
  
  // Parking configuration
  config: ParkingConfig;
  setConfig: (config: Partial<ParkingConfig>) => void;
  
  // Generated layout
  layout: GeneratedLayout | null;
  setLayout: (layout: GeneratedLayout | null) => void;
}

interface ParkingConfig {
  parkingAngle: number;
  spaceWidth: number;
  spaceLength: number;
  aisleWidth: number;
  accessiblePercent: number;
  evPercent: number;
  parkingType: 'surface' | 'structured' | 'underground';
}

const defaultConfig: ParkingConfig = {
  parkingAngle: 90,
  spaceWidth: 2.5,
  spaceLength: 5.0,
  aisleWidth: 6.0,
  accessiblePercent: 2,
  evPercent: 5,
  parkingType: 'surface',
};

const defaultSite: ParkingSite = {
  id: 'new-site',
  name: 'Untitled Site',
  boundary: null,
  obstacles: [],
  entries: [],
  zones: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ParkingSiteContext = createContext<ParkingSiteContextValue | null>(null);

export function ParkingSiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<ParkingSite>(defaultSite);
  const [boundaryPoints, setBoundaryPoints] = useState<Point2D[]>([]);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('view');
  const [config, setConfigState] = useState<ParkingConfig>(defaultConfig);
  const [layout, setLayout] = useState<GeneratedLayout | null>(null);

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: Point2D = {
      id: generatePointId(),
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
    };
    setBoundaryPoints(prev => [...prev, newPoint]);
  }, []);

  const updatePoint = useCallback((id: string, x: number, y: number) => {
    setBoundaryPoints(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }
          : p
      )
    );
  }, []);

  const deletePoint = useCallback((id: string) => {
    setBoundaryPoints(prev => prev.filter(p => p.id !== id));
  }, []);

  const reorderPoints = useCallback((fromIndex: number, toIndex: number) => {
    setBoundaryPoints(prev => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const clearBoundary = useCallback(() => {
    setBoundaryPoints([]);
    setLayout(null);
  }, []);

  const setConfig = useCallback((updates: Partial<ParkingConfig>) => {
    setConfigState(prev => ({ ...prev, ...updates }));
  }, []);

  const value: ParkingSiteContextValue = {
    site,
    boundaryPoints,
    setBoundaryPoints,
    addPoint,
    updatePoint,
    deletePoint,
    reorderPoints,
    clearBoundary,
    canvasMode,
    setCanvasMode,
    config,
    setConfig,
    layout,
    setLayout,
  };

  return (
    <ParkingSiteContext.Provider value={value}>
      {children}
    </ParkingSiteContext.Provider>
  );
}

export function useParkingSite() {
  const context = useContext(ParkingSiteContext);
  if (!context) {
    throw new Error('useParkingSite must be used within ParkingSiteProvider');
  }
  return context;
}
