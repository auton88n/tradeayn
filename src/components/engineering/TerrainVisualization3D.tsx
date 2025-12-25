import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera } from '@react-three/drei';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Layers, Mountain } from 'lucide-react';
import * as THREE from 'three';

interface Point {
  id: string;
  x: number;
  y: number;
  z: number;
  fgl?: number;
  cutFill?: number;
}

interface TerrainVisualization3DProps {
  points: Point[];
  showFGL: boolean;
}

type ViewMode = 'ngl' | 'fgl' | 'cutfill';

const TerrainMesh: React.FC<{ points: Point[]; viewMode: ViewMode; bounds: any }> = ({ 
  points, 
  viewMode,
  bounds 
}) => {
  const meshData = useMemo(() => {
    if (points.length < 3) return null;

    // Normalize coordinates
    const normalizedPoints = points.map(p => ({
      ...p,
      nx: (p.x - bounds.minX) / bounds.rangeX - 0.5,
      ny: (p.y - bounds.minY) / bounds.rangeY - 0.5,
      nz: ((viewMode === 'fgl' && p.fgl !== undefined ? p.fgl : p.z) - bounds.minZ) / bounds.rangeZ,
    }));

    // Create geometry from points
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];

    // Simple point cloud with color gradient
    normalizedPoints.forEach(p => {
      vertices.push(p.nx * 10, p.nz * 3, p.ny * 10);
      
      // Color based on view mode
      let color: THREE.Color;
      if (viewMode === 'cutfill' && p.cutFill !== undefined) {
        if (p.cutFill > 0) {
          // Cut - red gradient
          const intensity = Math.min(1, p.cutFill / 3);
          color = new THREE.Color().setHSL(0, 0.8, 0.5 + intensity * 0.3);
        } else {
          // Fill - blue gradient
          const intensity = Math.min(1, Math.abs(p.cutFill) / 3);
          color = new THREE.Color().setHSL(0.6, 0.8, 0.5 + intensity * 0.3);
        }
      } else {
        // Elevation gradient (green to brown)
        const t = p.nz;
        color = new THREE.Color().setHSL(0.15 - t * 0.1, 0.6, 0.4 + t * 0.2);
      }
      
      colors.push(color.r, color.g, color.b);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    return geometry;
  }, [points, viewMode, bounds]);

  if (!meshData) return null;

  return (
    <points geometry={meshData}>
      <pointsMaterial size={0.15} vertexColors />
    </points>
  );
};

const GridFloor: React.FC = () => (
  <gridHelper args={[20, 20, '#444', '#333']} rotation={[0, 0, 0]} position={[0, -0.5, 0]} />
);

const AxisLabels: React.FC = () => (
  <>
    <Text position={[6, 0, 0]} fontSize={0.4} color="#888">E →</Text>
    <Text position={[0, 0, 6]} fontSize={0.4} color="#888">N →</Text>
    <Text position={[0, 2, 0]} fontSize={0.4} color="#888">↑ Elev</Text>
  </>
);

export const TerrainVisualization3D: React.FC<TerrainVisualization3DProps> = ({ 
  points,
  showFGL 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('ngl');

  const bounds = useMemo(() => {
    if (points.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 1, rangeX: 1, rangeY: 1, rangeZ: 1 };
    
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const zs = points.map(p => p.z);
    const fgls = points.filter(p => p.fgl !== undefined).map(p => p.fgl!);
    
    const allZs = [...zs, ...fgls];
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...allZs);
    const maxZ = Math.max(...allZs);
    
    return {
      minX, maxX, minY, maxY, minZ, maxZ,
      rangeX: maxX - minX || 1,
      rangeY: maxY - minY || 1,
      rangeZ: maxZ - minZ || 1,
    };
  }, [points]);

  const hasFGLData = points.some(p => p.fgl !== undefined);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Mountain className="w-5 h-5 text-primary" />
          3D Terrain View
        </h3>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'ngl' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('ngl')}
          >
            <Layers className="w-4 h-4 mr-1" />
            NGL
          </Button>
          {hasFGLData && (
            <>
              <Button
                variant={viewMode === 'fgl' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('fgl')}
              >
                <Layers className="w-4 h-4 mr-1" />
                FGL
              </Button>
              <Button
                variant={viewMode === 'cutfill' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cutfill')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Cut/Fill
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="h-[400px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden">
        {points.length > 0 ? (
          <Canvas>
            <PerspectiveCamera makeDefault position={[8, 6, 8]} />
            <OrbitControls enableDamping dampingFactor={0.1} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <TerrainMesh points={points} viewMode={viewMode} bounds={bounds} />
            <GridFloor />
            <AxisLabels />
          </Canvas>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Upload survey data to view 3D terrain
          </div>
        )}
      </div>

      {viewMode === 'cutfill' && hasFGLData && (
        <div className="mt-3 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Cut Area</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span>Fill Area</span>
          </div>
        </div>
      )}
    </Card>
  );
};
