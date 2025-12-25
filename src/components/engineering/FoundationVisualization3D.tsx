import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

interface FoundationVisualization3DProps {
  outputs: Record<string, unknown>;
  className?: string;
}

const FoundationMesh: React.FC<{ 
  foundationLength: number;
  foundationWidth: number;
  foundationDepth: number;
  columnWidth: number;
  columnDepth: number;
}> = ({ foundationLength, foundationWidth, foundationDepth, columnWidth, columnDepth }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  // Proportional scaling - normalize to fit in view
  const maxDimension = Math.max(foundationLength, foundationWidth);
  const baseScale = 3 / maxDimension;
  
  const fL = foundationLength * baseScale;
  const fW = foundationWidth * baseScale;
  const fD = Math.min(foundationDepth * baseScale, 0.8); // Limit foundation thickness visually
  
  const cW = columnWidth * baseScale;
  const cD = columnDepth * baseScale;
  const columnHeight = fD * 3; // Column sticks up from foundation

  // Reinforcement grid
  const rebarThickness = 0.03;
  const gridSpacing = Math.min(fL, fW) / 8;
  const cover = 0.1;

  // Generate grid lines
  const xBars: number[] = [];
  const yBars: number[] = [];
  
  for (let x = -fL/2 + cover; x <= fL/2 - cover; x += gridSpacing) {
    xBars.push(x);
  }
  for (let y = -fW/2 + cover; y <= fW/2 - cover; y += gridSpacing) {
    yBars.push(y);
  }

  return (
    <group ref={meshRef} position={[0, -fD/2 - columnHeight/4, 0]}>
      {/* Foundation slab */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[fL, fD, fW]} />
        <meshStandardMaterial 
          color="#8B8B8B" 
          transparent 
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Foundation edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(fL, fD, fW)]} />
        <lineBasicMaterial color="#555555" />
      </lineSegments>

      {/* Bottom reinforcement grid - X direction */}
      {yBars.map((z, index) => (
        <mesh key={`x-bar-${index}`} position={[0, -fD/2 + cover + rebarThickness, z]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[rebarThickness, rebarThickness, fL - cover * 2, 8]} />
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Bottom reinforcement grid - Y direction */}
      {xBars.map((x, index) => (
        <mesh key={`y-bar-${index}`} position={[x, -fD/2 + cover + rebarThickness * 2, 0]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[rebarThickness, rebarThickness, fW - cover * 2, 8]} />
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Top reinforcement grid - X direction */}
      {yBars.filter((_, i) => i % 2 === 0).map((z, index) => (
        <mesh key={`x-bar-top-${index}`} position={[0, fD/2 - cover - rebarThickness, z]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[rebarThickness * 0.8, rebarThickness * 0.8, fL - cover * 2, 8]} />
          <meshStandardMaterial color="#22c55e" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Top reinforcement grid - Y direction */}
      {xBars.filter((_, i) => i % 2 === 0).map((x, index) => (
        <mesh key={`y-bar-top-${index}`} position={[x, fD/2 - cover - rebarThickness * 1.8, 0]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[rebarThickness * 0.8, rebarThickness * 0.8, fW - cover * 2, 8]} />
          <meshStandardMaterial color="#22c55e" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Column */}
      <mesh position={[0, fD/2 + columnHeight/2, 0]}>
        <boxGeometry args={[cW, columnHeight, cD]} />
        <meshStandardMaterial color="#a0aec0" />
      </mesh>

      {/* Column edges */}
      <lineSegments position={[0, fD/2 + columnHeight/2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(cW, columnHeight, cD)]} />
        <lineBasicMaterial color="#666666" />
      </lineSegments>

      {/* Column reinforcement (4 corner bars) */}
      {[
        [-cW/2 + 0.05, -cD/2 + 0.05],
        [cW/2 - 0.05, -cD/2 + 0.05],
        [-cW/2 + 0.05, cD/2 - 0.05],
        [cW/2 - 0.05, cD/2 - 0.05],
      ].map((pos, index) => (
        <mesh key={`col-bar-${index}`} position={[pos[0], fD/2 + columnHeight/2, pos[1]]}>
          <cylinderGeometry args={[0.025, 0.025, columnHeight, 8]} />
          <meshStandardMaterial color="#2563eb" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Dimension indicators */}
      <group position={[0, -fD/2 - 0.15, fW/2 + 0.15]}>
        <mesh>
          <boxGeometry args={[fL, 0.015, 0.015]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>

      <group position={[fL/2 + 0.15, -fD/2 - 0.15, 0]}>
        <mesh>
          <boxGeometry args={[0.015, 0.015, fW]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      </group>
    </group>
  );
};

export const FoundationVisualization3D = ({ outputs, className }: FoundationVisualization3DProps) => {
  const foundationLength = ((outputs.length || 2.0) as number) * 1000; // Convert to mm
  const foundationWidth = ((outputs.width || 2.0) as number) * 1000;
  const foundationDepth = (outputs.depth || 400) as number;
  const columnWidth = (outputs.columnWidth || 400) as number;
  const columnDepth = (outputs.columnDepth || 400) as number;

  return (
    <div className={cn("w-full h-full relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden", className)}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[5, 4, 5]} />
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.4}
        />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <pointLight position={[0, 5, 0]} intensity={0.5} />
        
        <FoundationMesh 
          foundationLength={foundationLength}
          foundationWidth={foundationWidth}
          foundationDepth={foundationDepth}
          columnWidth={columnWidth}
          columnDepth={columnDepth}
        />
        
        <gridHelper args={[12, 24, '#444444', '#333333']} position={[0, -3, 0]} />
      </Canvas>
      
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
          <span className="text-gray-400">Bottom Rebar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-400">Top Rebar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-gray-400">Column Bars</span>
        </div>
      </div>
      
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {(foundationLength/1000).toFixed(1)}×{(foundationWidth/1000).toFixed(1)} m
      </div>
    </div>
  );
};
