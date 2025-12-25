import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface ColumnVisualization3DProps {
  width: number;
  depth: number;
  height: number;
  cover: number;
  columnType: string;
}

const ColumnMesh: React.FC<{ width: number; depth: number; height: number; cover: number; columnType: string }> = ({ 
  width, depth, height, cover, columnType 
}) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Normalize dimensions for visualization
  const scale = 0.003;
  const w = width * scale;
  const d = depth * scale;
  const h = height * scale;
  const c = cover * scale;

  // Calculate reinforcement positions
  const barRadius = 0.04;
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

  // Tie/Spiral spacing
  const tieSpacing = 0.3;
  const numTies = Math.floor(h / tieSpacing);

  return (
    <group ref={meshRef} position={[0, -h/2, 0]}>
      {/* Main concrete column */}
      <mesh position={[0, h/2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial 
          color="#8B8B8B" 
          transparent 
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Concrete edges wireframe */}
      <lineSegments position={[0, h/2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial color="#666666" />
      </lineSegments>

      {/* Longitudinal reinforcement bars */}
      {barPositions.map((pos, index) => (
        <mesh key={index} position={[pos[0], h/2, pos[1]]}>
          <cylinderGeometry args={[barRadius, barRadius, h - 0.1, 16]} />
          <meshStandardMaterial color="#2563eb" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Ties or Spiral reinforcement */}
      {columnType === 'tied' ? (
        // Rectangular ties
        Array.from({ length: numTies + 1 }).map((_, index) => {
          const yPos = index * tieSpacing + c;
          return (
            <group key={index} position={[0, yPos, 0]}>
              {/* Tie rectangle */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[Math.min(w, d) / 2 - c, 0.015, 4, 4]} />
                <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
              </mesh>
            </group>
          );
        })
      ) : (
        // Spiral reinforcement
        <mesh position={[0, h/2, 0]}>
          <torusGeometry args={[Math.min(w, d) / 2 - c, 0.015, 8, 32]} />
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </mesh>
      )}

      {/* Dimension annotations */}
      {/* Width indicator */}
      <group position={[0, -0.2, d/2 + 0.15]}>
        <mesh>
          <boxGeometry args={[w, 0.02, 0.02]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>

      {/* Depth indicator */}
      <group position={[w/2 + 0.15, -0.2, 0]}>
        <mesh>
          <boxGeometry args={[0.02, 0.02, d]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      </group>

      {/* Height indicator */}
      <group position={[w/2 + 0.2, h/2, d/2 + 0.2]}>
        <mesh>
          <boxGeometry args={[0.02, h, 0.02]} />
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
