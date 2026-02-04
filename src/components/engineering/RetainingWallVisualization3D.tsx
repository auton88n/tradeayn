import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Box, Layers } from 'lucide-react';

interface RetainingWallVisualization3DProps {
  wallHeight: number;
  stemThicknessTop: number;
  stemThicknessBottom: number;
  baseWidth: number;
  baseThickness: number;
  toeWidth: number;
  earthPressure?: {
    Pa_total: number;
    applicationHeight: number;
  };
}

// Dimension Label - Uses Billboard to always face camera
const DimensionLabel: React.FC<{
  position: [number, number, number];
  text: string;
}> = ({ position, text }) => (
  <Billboard position={position} follow={true}>
    <Text
      fontSize={0.08}
      color="#22c55e"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.004}
      outlineColor="#000000"
    >
      {text}
    </Text>
  </Billboard>
);

// Earth Pressure Arrow
const PressureArrow: React.FC<{
  startY: number;
  endY: number;
  x: number;
  maxPressure: number;
}> = ({ startY, endY, x, maxPressure }) => {
  const arrowCount = 5;
  const arrows = [];
  
  for (let i = 0; i <= arrowCount; i++) {
    const y = startY + (endY - startY) * (i / arrowCount);
    const pressureRatio = i / arrowCount;
    const length = 0.1 + pressureRatio * 0.4;
    
    arrows.push(
      <group key={i} position={[x + length / 2, y, 0]}>
        <mesh>
          <boxGeometry args={[length, 0.02, 0.02]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[length / 2, 0, 0]}>
          <coneGeometry args={[0.03, 0.06, 8]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>
    );
  }
  
  return <group rotation={[0, 0, -Math.PI / 2]}>{arrows}</group>;
};

// 3D Wall Model
const Wall3D: React.FC<{
  H: number;
  tTop: number;
  tBottom: number;
  B: number;
  D: number;
  toe: number;
  earthPressure?: { Pa_total: number; applicationHeight: number };
}> = ({ H, tTop, tBottom, B, D, toe, earthPressure }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.15;
    }
  });

  // Normalize dimensions
  const maxDim = Math.max(H, B);
  const scale = 1.5 / maxDim;
  const h = H * scale;
  const tt = tTop * scale;
  const tb = tBottom * scale;
  const b = B * scale;
  const d = D * scale;
  const t = toe * scale;
  const heel = b - t - tb;
  
  // Create stem shape (tapered)
  const stemShape = new THREE.Shape();
  stemShape.moveTo(0, 0);
  stemShape.lineTo(tb, 0);
  stemShape.lineTo(tt, h);
  stemShape.lineTo(0, h);
  stemShape.closePath();
  
  const extrudeSettings = { depth: 0.3, bevelEnabled: false };

  return (
    <group ref={groupRef} position={[0, -h / 2 - d / 2, 0]}>
      {/* Base slab */}
      <mesh position={[b / 2 - t - tb / 2, d / 2, 0]}>
        <boxGeometry args={[b, d, 0.5]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      
      {/* Stem */}
      <mesh position={[-tb / 2, d, -0.15]}>
        <extrudeGeometry args={[stemShape, extrudeSettings]} />
        <meshStandardMaterial color="#718096" />
      </mesh>
      
      {/* Backfill representation */}
      <mesh position={[heel / 2, d + h / 2, 0]}>
        <boxGeometry args={[heel, h, 0.45]} />
        <meshStandardMaterial color="#92400e" transparent opacity={0.4} />
      </mesh>
      
      {/* Earth pressure diagram */}
      {earthPressure && (
        <group position={[-tb - 0.1, d, 0]}>
          {/* Triangular pressure distribution */}
          {Array.from({ length: 6 }).map((_, i) => {
            const y = (i / 5) * h;
            const pressureRatio = i / 5;
            const arrowLength = 0.15 + pressureRatio * 0.35;
            return (
              <group key={i} position={[-arrowLength / 2, y, 0]}>
                <mesh>
                  <boxGeometry args={[arrowLength, 0.015, 0.015]} />
                  <meshStandardMaterial color="#ef4444" />
                </mesh>
                <mesh position={[-arrowLength / 2 - 0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <coneGeometry args={[0.02, 0.04, 6]} />
                  <meshStandardMaterial color="#ef4444" />
                </mesh>
              </group>
            );
          })}
          <Text
            position={[-0.35, h / 3, 0.1]}
            fontSize={0.06}
            color="#ef4444"
          >
            Pa
          </Text>
        </group>
      )}
      
      {/* Dimension labels */}
      <DimensionLabel position={[-tb / 2 - 0.15, d + h / 2, 0.3]} text={`H=${(H * 1000).toFixed(0)}mm`} />
      <DimensionLabel position={[b / 2 - t - tb / 2, -0.1, 0.3]} text={`B=${(B * 1000).toFixed(0)}mm`} />
      <DimensionLabel position={[-t - tb - 0.1, d / 2, 0.3]} text={`t=${(D * 1000).toFixed(0)}mm`} />
    </group>
  );
};

// 2D Section View
const Wall2DView: React.FC<{
  H: number;
  tTop: number;
  tBottom: number;
  B: number;
  D: number;
  toe: number;
  earthPressure?: { Pa_total: number; applicationHeight: number };
}> = ({ H, tTop, tBottom, B, D, toe, earthPressure }) => {
  const padding = 40;
  const maxDim = Math.max(H + D, B);
  const scale = (220 - padding * 2) / maxDim;
  
  const h = H * scale;
  const tt = tTop * scale;
  const tb = tBottom * scale;
  const b = B * scale;
  const d = D * scale;
  const t = toe * scale;
  const heel = b - t - tb;
  
  const baseY = 180;
  const offsetX = 60;
  
  // Stem polygon points
  const stemPoints = [
    `${offsetX + t},${baseY - d}`,
    `${offsetX + t + tb},${baseY - d}`,
    `${offsetX + t + tt},${baseY - d - h}`,
    `${offsetX + t},${baseY - d - h}`,
  ].join(' ');
  
  return (
    <svg viewBox="0 0 280 220" className="w-full h-full">
      {/* Backfill */}
      <rect 
        x={offsetX + t + tb} 
        y={baseY - d - h} 
        width={heel} 
        height={h} 
        fill="#92400e" 
        opacity={0.3}
      />
      
      {/* Base slab */}
      <rect 
        x={offsetX} 
        y={baseY - d} 
        width={b} 
        height={d} 
        fill="#64748b" 
        stroke="#374151" 
        strokeWidth="1.5"
      />
      
      {/* Stem */}
      <polygon 
        points={stemPoints} 
        fill="#718096" 
        stroke="#374151" 
        strokeWidth="1.5"
      />
      
      {/* Ground line */}
      <line 
        x1={offsetX - 20} 
        y1={baseY} 
        x2={offsetX + b + 30} 
        y2={baseY} 
        stroke="#16a34a" 
        strokeWidth="2" 
        strokeDasharray="8,4"
      />
      
      {/* Earth pressure diagram */}
      <polygon 
        points={`
          ${offsetX + t - 5},${baseY - d}
          ${offsetX + t - 5 - h * 0.35},${baseY - d}
          ${offsetX + t - 5},${baseY - d - h}
        `}
        fill="#ef4444"
        opacity={0.3}
        stroke="#ef4444"
        strokeWidth="1"
      />
      
      {/* Pressure arrows */}
      {Array.from({ length: 5 }).map((_, i) => {
        const y = baseY - d - (i / 4) * h;
        const arrowLen = 5 + (i / 4) * h * 0.3;
        return (
          <g key={i}>
            <line 
              x1={offsetX + t - 5 - arrowLen} 
              y1={y} 
              x2={offsetX + t - 8} 
              y2={y} 
              stroke="#ef4444" 
              strokeWidth="1.5"
            />
            <polygon 
              points={`${offsetX + t - 5},${y} ${offsetX + t - 10},${y - 3} ${offsetX + t - 10},${y + 3}`}
              fill="#ef4444"
            />
          </g>
        );
      })}
      
      {/* Labels */}
      <text x={offsetX + t - 25} y={baseY - d - h * 0.4} fill="#ef4444" fontSize="10" textAnchor="middle">Pa</text>
      
      {/* Dimensions */}
      <line x1={offsetX} y1={baseY + 10} x2={offsetX + b} y2={baseY + 10} stroke="#e2e8f0" strokeWidth="0.8" />
      <text x={offsetX + b/2} y={baseY + 22} fill="#e2e8f0" fontSize="9" textAnchor="middle">{(B * 1000).toFixed(0)} mm</text>
      
      <line x1={offsetX - 15} y1={baseY - d - h} x2={offsetX - 15} y2={baseY - d} stroke="#e2e8f0" strokeWidth="0.8" />
      <text x={offsetX - 18} y={baseY - d - h/2} fill="#e2e8f0" fontSize="9" textAnchor="middle" transform={`rotate(-90, ${offsetX - 18}, ${baseY - d - h/2})`}>{(H * 1000).toFixed(0)} mm</text>
      
      {/* Toe and Heel labels */}
      <text x={offsetX + t/2} y={baseY - d/2} fill="#e2e8f0" fontSize="8" textAnchor="middle">Toe</text>
      <text x={offsetX + t + tb + heel/2} y={baseY - d - h + 15} fill="#e2e8f0" fontSize="8" textAnchor="middle">Heel</text>
      
      {/* Legend */}
      <rect x="200" y="10" width="70" height="55" fill="#1a1a2e" rx="4" />
      <rect x="205" y="18" width="12" height="8" fill="#718096" />
      <text x="220" y="25" fill="#e2e8f0" fontSize="8">Concrete</text>
      <rect x="205" y="32" width="12" height="8" fill="#92400e" opacity="0.5" />
      <text x="220" y="39" fill="#e2e8f0" fontSize="8">Backfill</text>
      <rect x="205" y="46" width="12" height="8" fill="#ef4444" opacity="0.5" />
      <text x="220" y="53" fill="#e2e8f0" fontSize="8">Pressure</text>
    </svg>
  );
};

const RetainingWallVisualization3D: React.FC<RetainingWallVisualization3DProps> = (props) => {
  const [is3D, setIs3D] = useState(true);
  
  // Convert mm to m for 3D
  const H = props.wallHeight;
  const tTop = props.stemThicknessTop / 1000;
  const tBottom = props.stemThicknessBottom / 1000;
  const B = props.baseWidth / 1000;
  const D = props.baseThickness / 1000;
  const toe = props.toeWidth / 1000;

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
        title={is3D ? "Switch to 2D Section" : "Switch to 3D View"}
      >
        {is3D ? <Layers className="w-4 h-4" /> : <Box className="w-4 h-4" />}
      </button>

      {is3D ? (
        <Canvas>
          <PerspectiveCamera makeDefault position={[2, 1, 2.5]} />
          <OrbitControls enablePan={false} minDistance={1.5} maxDistance={6} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-3, 3, -3]} intensity={0.4} />
          <Wall3D 
            H={H} 
            tTop={tTop} 
            tBottom={tBottom} 
            B={B} 
            D={D} 
            toe={toe}
            earthPressure={props.earthPressure}
          />
        </Canvas>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-xl">
          <Wall2DView 
            H={H} 
            tTop={tTop} 
            tBottom={tBottom} 
            B={B} 
            D={D} 
            toe={toe}
            earthPressure={props.earthPressure}
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
          <div className="w-2 h-2 rounded-full bg-amber-700" />
          <span className="text-muted-foreground">Backfill</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Earth Pressure</span>
        </div>
      </div>
    </div>
  );
};

export default RetainingWallVisualization3D;
