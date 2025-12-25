import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Box, Layers } from 'lucide-react';

interface FoundationVisualization3DProps {
  outputs: Record<string, unknown>;
  className?: string;
}

// Dimension Label Component
const DimensionLabel: React.FC<{
  position: [number, number, number];
  text: string;
  rotation?: [number, number, number];
}> = ({ position, text, rotation = [0, 0, 0] }) => (
  <Text
    position={position}
    rotation={rotation}
    fontSize={0.18}
    color="#22c55e"
    anchorX="center"
    anchorY="middle"
    outlineWidth={0.01}
    outlineColor="#000000"
  >
    {text}
  </Text>
);

// 2D Plan View
const Foundation2DView: React.FC<{
  foundationLength: number;
  foundationWidth: number;
  columnWidth: number;
  columnDepth: number;
}> = ({ foundationLength, foundationWidth, columnWidth, columnDepth }) => {
  const padding = 30;
  const maxDim = Math.max(foundationLength, foundationWidth);
  const scale = (200 - padding * 2) / maxDim;
  
  const fL = foundationLength * scale;
  const fW = foundationWidth * scale;
  const cW = columnWidth * scale;
  const cD = columnDepth * scale;
  
  const offsetX = (200 - fL) / 2;
  const offsetY = (200 - fW) / 2;
  
  // Grid spacing
  const gridSpacing = Math.min(fL, fW) / 6;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect x="0" y="0" width="200" height="200" fill="#1a1a2e" />
      
      {/* Foundation outline */}
      <rect 
        x={offsetX} y={offsetY} 
        width={fL} height={fW} 
        fill="#718096" 
        stroke="#2d3748" 
        strokeWidth="2"
      />
      
      {/* Reinforcement grid X-direction */}
      {Array.from({ length: Math.floor(fW / gridSpacing) + 1 }).map((_, i) => (
        <line
          key={`x-${i}`}
          x1={offsetX + 5}
          y1={offsetY + 5 + i * gridSpacing}
          x2={offsetX + fL - 5}
          y2={offsetY + 5 + i * gridSpacing}
          stroke="#f97316"
          strokeWidth="1.5"
        />
      ))}
      
      {/* Reinforcement grid Y-direction */}
      {Array.from({ length: Math.floor(fL / gridSpacing) + 1 }).map((_, i) => (
        <line
          key={`y-${i}`}
          x1={offsetX + 5 + i * gridSpacing}
          y1={offsetY + 5}
          x2={offsetX + 5 + i * gridSpacing}
          y2={offsetY + fW - 5}
          stroke="#f97316"
          strokeWidth="1.5"
        />
      ))}
      
      {/* Column */}
      <rect 
        x={offsetX + (fL - cW) / 2} 
        y={offsetY + (fW - cD) / 2} 
        width={cW} height={cD} 
        fill="#a0aec0" 
        stroke="#666"
        strokeWidth="1"
      />
      
      {/* Dimensions */}
      <line x1={offsetX} y1={offsetY + fW + 12} x2={offsetX + fL} y2={offsetY + fW + 12} stroke="#e2e8f0" strokeWidth="1" />
      <text x={offsetX + fL/2} y={offsetY + fW + 24} fill="#e2e8f0" fontSize="9" textAnchor="middle">{(foundationLength/1000).toFixed(2)} m</text>
      
      <line x1={offsetX - 12} y1={offsetY} x2={offsetX - 12} y2={offsetY + fW} stroke="#e2e8f0" strokeWidth="1" />
      <text x={offsetX - 16} y={offsetY + fW/2} fill="#e2e8f0" fontSize="9" textAnchor="middle" transform={`rotate(-90, ${offsetX - 16}, ${offsetY + fW/2})`}>{(foundationWidth/1000).toFixed(2)} m</text>
    </svg>
  );
};

const FoundationMesh: React.FC<{ 
  foundationLength: number;
  foundationWidth: number;
  foundationDepth: number;
  columnWidth: number;
  columnDepth: number;
  showLabels?: boolean;
}> = ({ foundationLength, foundationWidth, foundationDepth, columnWidth, columnDepth, showLabels = true }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const maxDimension = Math.max(foundationLength, foundationWidth);
  const baseScale = 3 / maxDimension;
  
  const fL = foundationLength * baseScale;
  const fW = foundationWidth * baseScale;
  const fD = Math.min(foundationDepth * baseScale, 0.8);
  
  const cW = columnWidth * baseScale;
  const cD = columnDepth * baseScale;
  const columnHeight = fD * 3;

  const rebarThickness = 0.03;
  const gridSpacing = Math.min(fL, fW) / 8;
  const cover = 0.1;

  const xBars: number[] = [];
  const yBars: number[] = [];
  
  for (let x = -fL/2 + cover; x <= fL/2 - cover; x += gridSpacing) xBars.push(x);
  for (let y = -fW/2 + cover; y <= fW/2 - cover; y += gridSpacing) yBars.push(y);

  return (
    <group ref={meshRef} position={[0, -fD/2 - columnHeight/4, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[fL, fD, fW]} />
        <meshStandardMaterial color="#8B8B8B" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(fL, fD, fW)]} />
        <lineBasicMaterial color="#555555" />
      </lineSegments>

      {yBars.map((z, index) => (
        <mesh key={`x-bar-${index}`} position={[0, -fD/2 + cover + rebarThickness, z]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[rebarThickness, rebarThickness, fL - cover * 2, 8]} />
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {xBars.map((x, index) => (
        <mesh key={`y-bar-${index}`} position={[x, -fD/2 + cover + rebarThickness * 2, 0]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[rebarThickness, rebarThickness, fW - cover * 2, 8]} />
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {yBars.filter((_, i) => i % 2 === 0).map((z, index) => (
        <mesh key={`x-bar-top-${index}`} position={[0, fD/2 - cover - rebarThickness, z]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[rebarThickness * 0.8, rebarThickness * 0.8, fL - cover * 2, 8]} />
          <meshStandardMaterial color="#22c55e" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {xBars.filter((_, i) => i % 2 === 0).map((x, index) => (
        <mesh key={`y-bar-top-${index}`} position={[x, fD/2 - cover - rebarThickness * 1.8, 0]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[rebarThickness * 0.8, rebarThickness * 0.8, fW - cover * 2, 8]} />
          <meshStandardMaterial color="#22c55e" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      <mesh position={[0, fD/2 + columnHeight/2, 0]}>
        <boxGeometry args={[cW, columnHeight, cD]} />
        <meshStandardMaterial color="#a0aec0" />
      </mesh>

      <lineSegments position={[0, fD/2 + columnHeight/2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(cW, columnHeight, cD)]} />
        <lineBasicMaterial color="#666666" />
      </lineSegments>

      {[[-cW/2 + 0.05, -cD/2 + 0.05], [cW/2 - 0.05, -cD/2 + 0.05], [-cW/2 + 0.05, cD/2 - 0.05], [cW/2 - 0.05, cD/2 - 0.05]].map((pos, index) => (
        <mesh key={`col-bar-${index}`} position={[pos[0], fD/2 + columnHeight/2, pos[1]]}>
          <cylinderGeometry args={[0.025, 0.025, columnHeight, 8]} />
          <meshStandardMaterial color="#2563eb" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Dimension Labels */}
      {showLabels && (
        <>
          {/* Length label */}
          <DimensionLabel 
            position={[0, -fD/2 - 0.35, fW/2 + 0.3]} 
            text={`${(foundationLength/1000).toFixed(2)} m`}
          />
          {/* Width label */}
          <DimensionLabel 
            position={[fL/2 + 0.35, -fD/2 - 0.35, 0]} 
            text={`${(foundationWidth/1000).toFixed(2)} m`}
            rotation={[0, -Math.PI/2, 0]}
          />
          {/* Depth label */}
          <DimensionLabel 
            position={[fL/2 + 0.2, 0, fW/2 + 0.2]} 
            text={`${foundationDepth} mm`}
          />
        </>
      )}
    </group>
  );
};

export const FoundationVisualization3D = ({ outputs, className }: FoundationVisualization3DProps) => {
  const [is3D, setIs3D] = useState(true);
  
  const foundationLength = ((outputs.length || 2.0) as number) * 1000;
  const foundationWidth = ((outputs.width || 2.0) as number) * 1000;
  const foundationDepth = (outputs.depth || 400) as number;
  const columnWidth = (outputs.columnWidth || 400) as number;
  const columnDepth = (outputs.columnDepth || 400) as number;

  return (
    <div className={cn("w-full h-full relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden", className)}>
      {/* View Toggle */}
      <div className="absolute top-3 right-3 z-10 flex bg-background/80 rounded-md overflow-hidden border border-border/50">
        <button
          onClick={() => setIs3D(false)}
          className={cn(
            "px-2 py-1.5 flex items-center gap-1 text-xs transition-colors",
            !is3D ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          2D
        </button>
        <button
          onClick={() => setIs3D(true)}
          className={cn(
            "px-2 py-1.5 flex items-center gap-1 text-xs transition-colors",
            is3D ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Box className="w-3.5 h-3.5" />
          3D
        </button>
      </div>

      {is3D ? (
        <Canvas>
          <PerspectiveCamera makeDefault position={[5, 4, 5]} />
          <OrbitControls enableZoom enablePan={false} minDistance={3} maxDistance={15} autoRotate autoRotateSpeed={0.4} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          <pointLight position={[0, 5, 0]} intensity={0.5} />
          <FoundationMesh foundationLength={foundationLength} foundationWidth={foundationWidth} foundationDepth={foundationDepth} columnWidth={columnWidth} columnDepth={columnDepth} />
          <gridHelper args={[12, 24, '#444444', '#333333']} position={[0, -3, 0]} />
        </Canvas>
      ) : (
        <Foundation2DView foundationLength={foundationLength} foundationWidth={foundationWidth} columnWidth={columnWidth} columnDepth={columnDepth} />
      )}
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-gray-400">Foundation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-gray-400">Column</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-gray-400">Reinforcement</span>
        </div>
      </div>
      
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {(foundationLength/1000).toFixed(1)}×{(foundationWidth/1000).toFixed(1)} m
      </div>
    </div>
  );
};
