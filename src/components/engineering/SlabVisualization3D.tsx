import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Box, Layers } from 'lucide-react';

interface SlabVisualization3DProps {
  length: number;
  width: number;
  thickness: number;
  topBarSpacing: number;
  bottomBarSpacing: number;
  slabType: string;
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
    fontSize={0.15}
    color="#22c55e"
    anchorX="center"
    anchorY="middle"
    outlineWidth={0.008}
    outlineColor="#000000"
  >
    {text}
  </Text>
);

// Reinforcement Mesh Component
const ReinforcementMesh: React.FC<{
  length: number;
  width: number;
  spacing: number;
  yPosition: number;
  color: string;
}> = ({ length, width, spacing, yPosition, color }) => {
  const barsX = Math.floor(width / spacing) + 1;
  const barsY = Math.floor(length / spacing) + 1;
  
  return (
    <group position={[0, yPosition, 0]}>
      {/* Bars along X direction */}
      {Array.from({ length: barsX }).map((_, i) => {
        const z = -width / 2 + i * spacing;
        return (
          <mesh key={`x-${i}`} position={[0, 0, z]}>
            <cylinderGeometry args={[0.008, 0.008, length, 8]} />
            <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
      
      {/* Bars along Z direction */}
      {Array.from({ length: barsY }).map((_, i) => {
        const x = -length / 2 + i * spacing;
        return (
          <mesh key={`z-${i}`} position={[x, 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, width, 8]} />
            <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
};

// 3D Slab with Mesh
const Slab3D: React.FC<{
  length: number;
  width: number;
  thickness: number;
  topBarSpacing: number;
  bottomBarSpacing: number;
}> = ({ length, width, thickness, topBarSpacing, bottomBarSpacing }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  // Normalize dimensions for visualization
  const maxDim = Math.max(length, width);
  const scale = 2 / maxDim;
  const l = length * scale;
  const w = width * scale;
  const t = Math.max(thickness * scale, 0.08);
  const cover = 0.03;

  // Convert spacing to scaled units
  const topSpacing = topBarSpacing * scale;
  const bottomSpacing = bottomBarSpacing * scale;

  return (
    <group ref={groupRef}>
      {/* Concrete Slab */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[l, t, w]} />
        <meshStandardMaterial 
          color="#718096" 
          transparent 
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Top Reinforcement Mesh */}
      <ReinforcementMesh
        length={l - cover * 2}
        width={w - cover * 2}
        spacing={topSpacing}
        yPosition={t / 2 - cover}
        color="#3b82f6"
      />
      
      {/* Bottom Reinforcement Mesh */}
      <ReinforcementMesh
        length={l - cover * 2}
        width={w - cover * 2}
        spacing={bottomSpacing}
        yPosition={-t / 2 + cover}
        color="#22c55e"
      />
      
      {/* Dimension Labels */}
      <DimensionLabel 
        position={[0, -t / 2 - 0.15, w / 2 + 0.1]} 
        text={`${length.toFixed(0)} mm`}
      />
      <DimensionLabel 
        position={[l / 2 + 0.15, -t / 2 - 0.15, 0]} 
        text={`${width.toFixed(0)} mm`}
        rotation={[0, Math.PI / 2, 0]}
      />
      <DimensionLabel 
        position={[l / 2 + 0.15, 0, w / 2 + 0.1]} 
        text={`t=${thickness.toFixed(0)} mm`}
      />
    </group>
  );
};

// 2D Plan View
const Slab2DView: React.FC<{
  length: number;
  width: number;
  topBarSpacing: number;
  bottomBarSpacing: number;
  slabType: string;
}> = ({ length, width, topBarSpacing, bottomBarSpacing, slabType }) => {
  const padding = 30;
  const maxDim = Math.max(length, width);
  const scale = (200 - padding * 2) / maxDim;
  
  const l = length * scale;
  const w = width * scale;
  
  const offsetX = (240 - l) / 2;
  const offsetY = (200 - w) / 2;
  
  const topBarsX = Math.floor(w / topBarSpacing);
  const topBarsY = Math.floor(l / topBarSpacing);
  const bottomBarsX = Math.floor(w / bottomBarSpacing);
  const bottomBarsY = Math.floor(l / bottomBarSpacing);

  return (
    <svg viewBox="0 0 240 200" className="w-full h-full">
      {/* Slab outline */}
      <rect 
        x={offsetX} y={offsetY} 
        width={l} height={w} 
        fill="#4a5568" 
        stroke="#2d3748" 
        strokeWidth="2" 
      />
      
      {/* Bottom reinforcement (shown as solid lines) */}
      {Array.from({ length: bottomBarsX + 1 }).map((_, i) => {
        const y = offsetY + 8 + (i * (w - 16) / bottomBarsX);
        if (i > bottomBarsX) return null;
        return (
          <line
            key={`bottom-x-${i}`}
            x1={offsetX + 8}
            y1={y}
            x2={offsetX + l - 8}
            y2={y}
            stroke="#22c55e"
            strokeWidth="1.5"
          />
        );
      })}
      
      {Array.from({ length: bottomBarsY + 1 }).map((_, i) => {
        const x = offsetX + 8 + (i * (l - 16) / bottomBarsY);
        if (i > bottomBarsY) return null;
        return (
          <line
            key={`bottom-y-${i}`}
            x1={x}
            y1={offsetY + 8}
            x2={x}
            y2={offsetY + w - 8}
            stroke="#22c55e"
            strokeWidth="1.5"
          />
        );
      })}
      
      {/* Top reinforcement (shown as dashed lines) - only for two-way slabs */}
      {slabType === 'two_way' && (
        <>
          {Array.from({ length: topBarsX + 1 }).map((_, i) => {
            const y = offsetY + 12 + (i * (w - 24) / topBarsX);
            if (i > topBarsX) return null;
            return (
              <line
                key={`top-x-${i}`}
                x1={offsetX + 12}
                y1={y}
                x2={offsetX + l - 12}
                y2={y}
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="4,2"
              />
            );
          })}
          
          {Array.from({ length: topBarsY + 1 }).map((_, i) => {
            const x = offsetX + 12 + (i * (l - 24) / topBarsY);
            if (i > topBarsY) return null;
            return (
              <line
                key={`top-y-${i}`}
                x1={x}
                y1={offsetY + 12}
                x2={x}
                y2={offsetY + w - 12}
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="4,2"
              />
            );
          })}
        </>
      )}
      
      {/* Dimensions */}
      <line x1={offsetX} y1={offsetY + w + 12} x2={offsetX + l} y2={offsetY + w + 12} stroke="#e2e8f0" strokeWidth="0.8" />
      <text x={offsetX + l/2} y={offsetY + w + 24} fill="#e2e8f0" fontSize="10" textAnchor="middle">{length} mm</text>
      
      <line x1={offsetX - 12} y1={offsetY} x2={offsetX - 12} y2={offsetY + w} stroke="#e2e8f0" strokeWidth="0.8" />
      <text x={offsetX - 16} y={offsetY + w/2} fill="#e2e8f0" fontSize="10" textAnchor="middle" transform={`rotate(-90, ${offsetX - 16}, ${offsetY + w/2})`}>{width} mm</text>
      
      {/* Legend */}
      <rect x="175" y="10" width="60" height="45" fill="#1a1a2e" rx="4" />
      <line x1="180" y1="22" x2="195" y2="22" stroke="#22c55e" strokeWidth="2" />
      <text x="200" y="26" fill="#e2e8f0" fontSize="8">Bottom</text>
      <line x1="180" y1="38" x2="195" y2="38" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3,1" />
      <text x="200" y="42" fill="#e2e8f0" fontSize="8">Top</text>
    </svg>
  );
};

const SlabVisualization3D: React.FC<SlabVisualization3DProps> = (props) => {
  const [is3D, setIs3D] = useState(true);

  return (
    <div className="relative w-full h-full">
      {/* Toggle Button */}
      <button
        onClick={() => setIs3D(!is3D)}
        className={cn(
          "absolute top-2 right-2 z-10 p-2 rounded-lg",
          "bg-background/80 backdrop-blur-sm border border-border",
          "hover:bg-accent transition-colors"
        )}
        title={is3D ? "Switch to 2D Plan View" : "Switch to 3D View"}
      >
        {is3D ? <Layers className="w-4 h-4" /> : <Box className="w-4 h-4" />}
      </button>

      {is3D ? (
        <Canvas>
          <PerspectiveCamera makeDefault position={[2, 1.5, 2]} />
          <OrbitControls enablePan={false} minDistance={2} maxDistance={8} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, 3, -5]} intensity={0.4} />
          <Slab3D 
            length={props.length}
            width={props.width}
            thickness={props.thickness}
            topBarSpacing={props.topBarSpacing}
            bottomBarSpacing={props.bottomBarSpacing}
          />
        </Canvas>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-xl p-4">
          <Slab2DView
            length={props.length}
            width={props.width}
            topBarSpacing={props.topBarSpacing}
            bottomBarSpacing={props.bottomBarSpacing}
            slabType={props.slabType}
          />
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 text-xs space-y-1 bg-background/80 backdrop-blur-sm p-2 rounded-lg border border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-muted-foreground">Concrete</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Bottom Mesh</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Top Mesh</span>
        </div>
      </div>
      
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {props.length}×{props.width}×{props.thickness} mm
      </div>
    </div>
  );
};

export default SlabVisualization3D;
