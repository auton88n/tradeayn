import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Line } from '@react-three/drei';
import * as THREE from 'three';

interface ColumnVisualization3DProps {
  width: number;
  depth: number;
  height: number;
  cover: number;
  columnType: string;
}

// Rectangular tie component using thin box segments
const RectangularTie: React.FC<{ width: number; depth: number; thickness: number }> = ({ width, depth, thickness }) => {
  const halfW = width / 2;
  const halfD = depth / 2;
  
  // Create rectangular tie using thin boxes for each side
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

const ColumnMesh: React.FC<{ width: number; depth: number; height: number; cover: number; columnType: string }> = ({ 
  width, depth, height, cover, columnType 
}) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Proportional scaling - normalize to fit in view
  // Target: width/depth around 1-2 units, height max 4 units
  const maxDimension = Math.max(width, depth);
  const baseScale = 2 / maxDimension; // Scale width/depth to ~2 units max
  
  const w = width * baseScale;
  const d = depth * baseScale;
  
  // Scale height separately to maintain reasonable proportions
  // Limit visual height to 4 units max while preserving aspect ratio info
  const heightRatio = height / maxDimension;
  const maxVisualHeight = 4;
  const h = Math.min(heightRatio * 2, maxVisualHeight);
  
  const c = cover * baseScale;

  // Scale bar radius proportional to column size
  const barRadius = Math.min(w, d) * 0.04;
  const tieThickness = barRadius * 0.6;

  // Calculate reinforcement positions (corner + middle bars)
  const barPositions = [
    // Corner bars
    [-w/2 + c + barRadius, -d/2 + c + barRadius],
    [w/2 - c - barRadius, -d/2 + c + barRadius],
    [-w/2 + c + barRadius, d/2 - c - barRadius],
    [w/2 - c - barRadius, d/2 - c - barRadius],
    // Middle bars on each face
    [0, -d/2 + c + barRadius],
    [0, d/2 - c - barRadius],
    [-w/2 + c + barRadius, 0],
    [w/2 - c - barRadius, 0],
  ];

  // Limit ties to 6-10 for readability
  const numTies = Math.min(Math.max(6, Math.floor(h / 0.4)), 10);
  const tieSpacing = h / (numTies + 1);

  // Inner tie dimensions (inside cover)
  const tieWidth = w - 2 * c;
  const tieDepth = d - 2 * c;

  return (
    <group ref={meshRef} position={[0, -h/2, 0]}>
      {/* Main concrete column */}
      <mesh position={[0, h/2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial 
          color="#8B8B8B" 
          transparent 
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Concrete edges wireframe */}
      <lineSegments position={[0, h/2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial color="#555555" />
      </lineSegments>

      {/* Longitudinal reinforcement bars */}
      {barPositions.map((pos, index) => (
        <mesh key={index} position={[pos[0], h/2, pos[1]]}>
          <cylinderGeometry args={[barRadius, barRadius, h - c * 2, 12]} />
          <meshStandardMaterial color="#2563eb" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Ties or Spiral reinforcement */}
      {columnType === 'tied' ? (
        // Rectangular ties evenly spaced
        Array.from({ length: numTies }).map((_, index) => {
          const yPos = (index + 1) * tieSpacing;
          return (
            <group key={index} position={[0, yPos, 0]}>
              <RectangularTie width={tieWidth} depth={tieDepth} thickness={tieThickness} />
            </group>
          );
        })
      ) : (
        // Spiral reinforcement - show as multiple rings
        Array.from({ length: numTies }).map((_, index) => {
          const yPos = (index + 1) * tieSpacing;
          return (
            <mesh key={index} position={[0, yPos, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[Math.min(tieWidth, tieDepth) / 2, tieThickness / 2, 8, 32]} />
              <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
            </mesh>
          );
        })
      )}

      {/* Dimension annotations */}
      <group position={[0, -0.15, d/2 + 0.12]}>
        <mesh>
          <boxGeometry args={[w, 0.015, 0.015]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>

      <group position={[w/2 + 0.12, -0.15, 0]}>
        <mesh>
          <boxGeometry args={[0.015, 0.015, d]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      </group>

      <group position={[w/2 + 0.15, h/2, d/2 + 0.15]}>
        <mesh>
          <boxGeometry args={[0.015, h, 0.015]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>
    </group>
  );
};

const ColumnVisualization3D: React.FC<ColumnVisualization3DProps> = (props) => {
  return (
    <div className="w-full h-[350px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[4, 3, 4]} />
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.5}
        />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <pointLight position={[0, 5, 0]} intensity={0.5} />
        
        <ColumnMesh {...props} />
        
        {/* Grid helper */}
        <gridHelper args={[10, 20, '#444444', '#333333']} position={[0, -3, 0]} />
      </Canvas>
      
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
          <span className="text-gray-400">Ties/Spiral</span>
        </div>
      </div>
    </div>
  );
};

export default ColumnVisualization3D;
