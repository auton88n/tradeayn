import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

interface BeamVisualization3DProps {
  outputs: Record<string, unknown>;
  className?: string;
}

const BeamMesh: React.FC<{ 
  width: number; 
  depth: number; 
  mainBars: number; 
  barDia: number;
  stirrupDia: number;
  cover: number;
}> = ({ width, depth, mainBars, barDia, stirrupDia, cover }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Proportional scaling - normalize to fit in view
  const maxDimension = Math.max(width, depth);
  const baseScale = 2.5 / maxDimension;
  
  const w = width * baseScale;
  const d = depth * baseScale;
  const c = cover * baseScale;
  
  // Beam length for 3D effect
  const beamLength = Math.max(w, d) * 1.5;

  // Scale bar sizes proportionally
  const barRadius = Math.min(w, d) * 0.035;
  const stirrupThickness = barRadius * 0.5;

  // Calculate main bar positions (bottom)
  const bottomY = -d/2 + c + barRadius;
  const barSpacing = (w - 2 * c - 2 * barRadius) / (mainBars - 1);
  
  const mainBarPositions: [number, number][] = [];
  for (let i = 0; i < mainBars; i++) {
    const x = -w/2 + c + barRadius + i * barSpacing;
    mainBarPositions.push([x, bottomY]);
  }

  // Top bars (nominal - 2 bars)
  const topY = d/2 - c - barRadius;
  const topBarPositions: [number, number][] = [
    [-w/2 + c + barRadius, topY],
    [w/2 - c - barRadius, topY],
  ];

  // Stirrup dimensions
  const stirrupWidth = w - 2 * c;
  const stirrupHeight = d - 2 * c;
  
  // Number of stirrups along length
  const numStirrups = 8;
  const stirrupSpacing = beamLength / (numStirrups + 1);

  return (
    <group ref={meshRef}>
      {/* Main concrete beam */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w, d, beamLength]} />
        <meshStandardMaterial 
          color="#8B8B8B" 
          transparent 
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Beam edges wireframe */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w, d, beamLength)]} />
        <lineBasicMaterial color="#555555" />
      </lineSegments>

      {/* Main reinforcement bars (bottom - tension) */}
      {mainBarPositions.map((pos, index) => (
        <mesh key={`main-${index}`} position={[pos[0], pos[1], 0]}>
          <cylinderGeometry args={[barRadius, barRadius, beamLength - c * 2, 12]} />
          <meshStandardMaterial color="#2563eb" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Top bars (nominal/compression) */}
      {topBarPositions.map((pos, index) => (
        <mesh key={`top-${index}`} position={[pos[0], pos[1], 0]}>
          <cylinderGeometry args={[barRadius * 0.7, barRadius * 0.7, beamLength - c * 2, 12]} />
          <meshStandardMaterial color="#22c55e" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Stirrups */}
      {Array.from({ length: numStirrups }).map((_, index) => {
        const zPos = -beamLength/2 + (index + 1) * stirrupSpacing;
        const halfW = stirrupWidth / 2;
        const halfH = stirrupHeight / 2;
        
        // Create stirrup as 4 thin boxes
        const segments: Array<{ pos: [number, number, number]; size: [number, number, number] }> = [
          { pos: [0, -halfH, zPos], size: [stirrupWidth + stirrupThickness, stirrupThickness, stirrupThickness] },
          { pos: [0, halfH, zPos], size: [stirrupWidth + stirrupThickness, stirrupThickness, stirrupThickness] },
          { pos: [-halfW, 0, zPos], size: [stirrupThickness, stirrupHeight, stirrupThickness] },
          { pos: [halfW, 0, zPos], size: [stirrupThickness, stirrupHeight, stirrupThickness] },
        ];
        
        return (
          <group key={index}>
            {segments.map((seg, i) => (
              <mesh key={i} position={seg.pos}>
                <boxGeometry args={seg.size} />
                <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Dimension indicators */}
      <group position={[0, -d/2 - 0.15, beamLength/2 + 0.1]}>
        <mesh>
          <boxGeometry args={[w, 0.015, 0.015]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>

      <group position={[w/2 + 0.15, 0, beamLength/2 + 0.1]}>
        <mesh>
          <boxGeometry args={[0.015, d, 0.015]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      </group>
    </group>
  );
};

export const BeamVisualization3D = ({ outputs, className }: BeamVisualization3DProps) => {
  const width = (outputs.width || outputs.beamWidth || 300) as number;
  const depth = (outputs.depth || outputs.beamDepth || 500) as number;
  const mainBars = (outputs.numberOfBars || 4) as number;
  const barDia = (outputs.barDiameter || 20) as number;
  const stirrupDia = (outputs.stirrupDia || 8) as number;
  const cover = 40;

  return (
    <div className={cn("w-full h-full relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden", className)}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[4, 3, 4]} />
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={12}
          autoRotate
          autoRotateSpeed={0.5}
        />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <pointLight position={[0, 5, 0]} intensity={0.5} />
        
        <BeamMesh 
          width={width}
          depth={depth}
          mainBars={mainBars}
          barDia={barDia}
          stirrupDia={stirrupDia}
          cover={cover}
        />
        
        <gridHelper args={[10, 20, '#444444', '#333333']} position={[0, -2.5, 0]} />
      </Canvas>
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-gray-400">Concrete</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-gray-400">Main Bars ({mainBars}Ø{barDia})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-400">Top Bars</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-gray-400">Stirrups (Ø{stirrupDia})</span>
        </div>
      </div>
      
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {width}×{depth} mm
      </div>
    </div>
  );
};
