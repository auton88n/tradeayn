import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Box, Layers } from 'lucide-react';

interface ColumnVisualization3DProps {
  width: number;
  depth: number;
  height: number;
  cover: number;
  columnType: string;
}

// Animated Axial Load Arrow
const AnimatedAxialLoad: React.FC<{
  position: [number, number, number];
  scale?: number;
}> = ({ position, scale = 1 }) => {
  const arrowRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (arrowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.15 + 1;
      arrowRef.current.scale.setScalar(pulse * scale);
      arrowRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.04;
    }
  });

  return (
    <group ref={arrowRef} position={position}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.08, 0.18, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      {/* Load label */}
      <Text
        position={[0.2, 0.3, 0]}
        fontSize={0.08}
        color="#ef4444"
        anchorX="left"
        anchorY="middle"
      >
        P
      </Text>
    </group>
  );
};

// Dimension Label Component - Uses Billboard to always face camera
const DimensionLabel: React.FC<{
  position: [number, number, number];
  text: string;
}> = ({ position, text }) => (
  <Billboard position={position} follow={true}>
    <Text
      fontSize={0.12}
      color="#22c55e"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.008}
      outlineColor="#000000"
    >
      {text}
    </Text>
  </Billboard>
);

// 2D Cross-Section View
const Column2DView: React.FC<{
  width: number;
  depth: number;
  cover: number;
  columnType: string;
}> = ({ width, depth, cover, columnType }) => {
  const padding = 30;
  const maxDim = Math.max(width, depth);
  const scale = (180 - padding * 2) / maxDim;
  
  const w = width * scale;
  const d = depth * scale;
  const c = cover * scale;
  const barR = Math.max(w * 0.035, 4);
  const tieT = barR * 0.5;
  
  const offsetX = (200 - w) / 2;
  const offsetY = (200 - d) / 2;
  
  // Bar positions
  const barPositions = [
    [offsetX + c + barR, offsetY + c + barR],
    [offsetX + w - c - barR, offsetY + c + barR],
    [offsetX + c + barR, offsetY + d - c - barR],
    [offsetX + w - c - barR, offsetY + d - c - barR],
    [offsetX + w/2, offsetY + c + barR],
    [offsetX + w/2, offsetY + d - c - barR],
    [offsetX + c + barR, offsetY + d/2],
    [offsetX + w - c - barR, offsetY + d/2],
  ];

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect x="0" y="0" width="200" height="200" fill="#1a1a2e" />
      
      {/* Concrete section */}
      <rect 
        x={offsetX} y={offsetY} 
        width={w} height={d} 
        fill="#718096" 
        stroke="#2d3748" 
        strokeWidth="2"
      />
      
      {/* Tie/Stirrup */}
      {columnType === 'tied' ? (
        <rect 
          x={offsetX + c} 
          y={offsetY + c} 
          width={w - c * 2} 
          height={d - c * 2}
          fill="none"
          stroke="#f97316"
          strokeWidth={tieT}
        />
      ) : (
        <circle
          cx={offsetX + w/2}
          cy={offsetY + d/2}
          r={Math.min(w, d)/2 - c}
          fill="none"
          stroke="#f97316"
          strokeWidth={tieT}
        />
      )}
      
      {/* Reinforcement bars */}
      {barPositions.map((pos, i) => (
        <circle key={i} cx={pos[0]} cy={pos[1]} r={barR} fill="#3182ce" />
      ))}
      
      {/* Dimensions */}
      <line x1={offsetX} y1={offsetY + d + 15} x2={offsetX + w} y2={offsetY + d + 15} stroke="#e2e8f0" strokeWidth="1" />
      <text x={offsetX + w/2} y={offsetY + d + 28} fill="#e2e8f0" fontSize="10" textAnchor="middle">{width} mm</text>
      
      <line x1={offsetX - 15} y1={offsetY} x2={offsetX - 15} y2={offsetY + d} stroke="#e2e8f0" strokeWidth="1" />
      <text x={offsetX - 20} y={offsetY + d/2} fill="#e2e8f0" fontSize="10" textAnchor="middle" transform={`rotate(-90, ${offsetX - 20}, ${offsetY + d/2})`}>{depth} mm</text>
    </svg>
  );
};

const RectangularTie: React.FC<{ width: number; depth: number; thickness: number }> = ({ width, depth, thickness }) => {
  const halfW = width / 2;
  const halfD = depth / 2;
  
  const segments: Array<{ pos: [number, number, number]; size: [number, number, number] }> = [
    { pos: [0, 0, -halfD], size: [width + thickness, thickness, thickness] },
    { pos: [0, 0, halfD], size: [width + thickness, thickness, thickness] },
    { pos: [-halfW, 0, 0], size: [thickness, thickness, depth] },
    { pos: [halfW, 0, 0], size: [thickness, thickness, depth] },
  ];
  
  return (
    <group>
      {segments.map((segment, i) => (
        <mesh key={i} position={segment.pos}>
          <boxGeometry args={segment.size} />
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};

const ColumnMesh: React.FC<{ 
  width: number; depth: number; height: number; cover: number; columnType: string; showLabels?: boolean;
}> = ({ width, depth, height, cover, columnType, showLabels = true }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  const maxDimension = Math.max(width, depth);
  const baseScale = 2 / maxDimension;
  
  const w = width * baseScale;
  const d = depth * baseScale;
  const heightRatio = height / maxDimension;
  const maxVisualHeight = 4;
  const h = Math.min(heightRatio * 2, maxVisualHeight);
  const c = cover * baseScale;

  const barRadius = Math.min(w, d) * 0.04;
  const tieThickness = barRadius * 0.6;

  const barPositions = [
    [-w/2 + c + barRadius, -d/2 + c + barRadius],
    [w/2 - c - barRadius, -d/2 + c + barRadius],
    [-w/2 + c + barRadius, d/2 - c - barRadius],
    [w/2 - c - barRadius, d/2 - c - barRadius],
    [0, -d/2 + c + barRadius],
    [0, d/2 - c - barRadius],
    [-w/2 + c + barRadius, 0],
    [w/2 - c - barRadius, 0],
  ];

  const numTies = Math.min(Math.max(6, Math.floor(h / 0.4)), 10);
  const tieSpacing = h / (numTies + 1);
  const tieWidth = w - 2 * c;
  const tieDepth = d - 2 * c;

  return (
    <group ref={meshRef} position={[0, -h/2, 0]}>
      <mesh position={[0, h/2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#8B8B8B" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      <lineSegments position={[0, h/2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial color="#555555" />
      </lineSegments>

      {barPositions.map((pos, index) => (
        <mesh key={index} position={[pos[0], h/2, pos[1]]}>
          <cylinderGeometry args={[barRadius, barRadius, h - c * 2, 12]} />
          <meshStandardMaterial color="#2563eb" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {columnType === 'tied' ? (
        Array.from({ length: numTies }).map((_, index) => (
          <group key={index} position={[0, (index + 1) * tieSpacing, 0]}>
            <RectangularTie width={tieWidth} depth={tieDepth} thickness={tieThickness} />
          </group>
        ))
      ) : (
        Array.from({ length: numTies }).map((_, index) => (
          <mesh key={index} position={[0, (index + 1) * tieSpacing, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[Math.min(tieWidth, tieDepth) / 2, tieThickness / 2, 8, 32]} />
            <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
          </mesh>
        ))
      )}

      {/* Animated Axial Load */}
      <AnimatedAxialLoad position={[0, h + 0.3, 0]} scale={1.2} />

      {/* Dimension Labels */}
      {showLabels && (
        <>
          {/* Width label */}
          <DimensionLabel 
            position={[0, -0.25, d/2 + 0.2]} 
            text={`${width} mm`}
          />
          {/* Depth label */}
          <DimensionLabel 
            position={[w/2 + 0.25, -0.25, 0]} 
            text={`${depth} mm`}
          />
          {/* Height label */}
          <DimensionLabel 
            position={[w/2 + 0.25, h/2, d/2 + 0.25]} 
            text={`${height} mm`}
          />
        </>
      )}
    </group>
  );
};

const ColumnVisualization3D: React.FC<ColumnVisualization3DProps> = (props) => {
  const [is3D, setIs3D] = useState(true);

  return (
    <div className="w-full h-[350px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden relative">
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
          <PerspectiveCamera makeDefault position={[4, 3, 4]} />
          <OrbitControls enableZoom enablePan={false} minDistance={2} maxDistance={10} autoRotate autoRotateSpeed={0.5} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          <pointLight position={[0, 5, 0]} intensity={0.5} />
          <ColumnMesh {...props} />
          <gridHelper args={[10, 20, '#444444', '#333333']} position={[0, -3, 0]} />
        </Canvas>
      ) : (
        <Column2DView width={props.width} depth={props.depth} cover={props.cover} columnType={props.columnType} />
      )}
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-gray-400">Concrete</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-gray-400">Main Bars</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-gray-400">{props.columnType === 'tied' ? 'Ties' : 'Spiral'}</span>
        </div>
      </div>
      
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {props.width}×{props.depth} mm
      </div>
    </div>
  );
};

export default ColumnVisualization3D;
