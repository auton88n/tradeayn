import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FileDown } from 'lucide-react';

interface Building3DShowcaseProps {
  variant?: 'structural' | 'blueprint';
  showStressIndicators?: boolean;
  showLoadArrows?: boolean;
  showExportButtons?: boolean;
  className?: string;
}

// Animated window with pulsing glow
const Window: React.FC<{ 
  position: [number, number, number]; 
  wireframe?: boolean;
  index: number;
}> = ({ position, wireframe, index }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && !wireframe) {
      const intensity = Math.sin(state.clock.elapsedTime * 2 + index * 0.5) * 0.3 + 0.5;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.18, 0.25, 0.02]} />
      <meshStandardMaterial 
        color={wireframe ? "#06b6d4" : "#22d3ee"}
        emissive={wireframe ? "#000000" : "#22d3ee"}
        emissiveIntensity={wireframe ? 0 : 0.5}
        transparent
        opacity={wireframe ? 0.6 : 0.9}
        wireframe={wireframe}
      />
    </mesh>
  );
};

// Single floor with windows
const Floor: React.FC<{ 
  y: number; 
  wireframe?: boolean;
  floorIndex: number;
}> = ({ y, wireframe, floorIndex }) => {
  const windowPositions = [-0.7, -0.25, 0.25, 0.7];
  
  return (
    <group position={[0, y, 0]}>
      {/* Floor slab */}
      <mesh>
        <boxGeometry args={[2.2, 0.45, 1.4]} />
        <meshStandardMaterial 
          color={wireframe ? "#0891b2" : "#1f2937"}
          wireframe={wireframe}
          transparent={wireframe}
          opacity={wireframe ? 0.4 : 1}
        />
      </mesh>
      
      {/* Windows on front */}
      {windowPositions.map((x, i) => (
        <Window 
          key={`front-${i}`} 
          position={[x, 0, 0.71]} 
          wireframe={wireframe}
          index={floorIndex * 4 + i}
        />
      ))}
      
      {/* Windows on back */}
      {windowPositions.map((x, i) => (
        <Window 
          key={`back-${i}`} 
          position={[x, 0, -0.71]} 
          wireframe={wireframe}
          index={floorIndex * 4 + i + 10}
        />
      ))}
    </group>
  );
};

// Animated load arrow
const LoadArrow: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Arrow shaft */}
      <mesh>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>
      {/* Arrow head */}
      <mesh position={[0, -0.25, 0]}>
        <coneGeometry args={[0.08, 0.15, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};

// Stress indicator (green pulsing dot)
const StressIndicator: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial 
        color="#22c55e" 
        emissive="#22c55e" 
        emissiveIntensity={0.8}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

// Main rotating building
const RotatingBuilding: React.FC<{ 
  wireframe?: boolean;
  showLoadArrows?: boolean;
  showStressIndicators?: boolean;
}> = ({ wireframe, showLoadArrows, showStressIndicators }) => {
  const buildingRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (buildingRef.current) {
      buildingRef.current.rotation.y += 0.004;
    }
  });

  const floors = [0, 0.5, 1, 1.5, 2];

  return (
    <group ref={buildingRef}>
      {/* Foundation */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[2.6, 0.2, 1.8]} />
        <meshStandardMaterial 
          color={wireframe ? "#0e7490" : "#374151"} 
          wireframe={wireframe}
          transparent={wireframe}
          opacity={wireframe ? 0.5 : 1}
        />
      </mesh>
      
      {/* Floors */}
      {floors.map((y, i) => (
        <Floor key={i} y={y} wireframe={wireframe} floorIndex={i} />
      ))}
      
      {/* Roof */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[2.4, 0.12, 1.6]} />
        <meshStandardMaterial 
          color={wireframe ? "#06b6d4" : "#0891b2"} 
          wireframe={wireframe}
          emissive={wireframe ? "#06b6d4" : "#000000"}
          emissiveIntensity={wireframe ? 0.3 : 0}
        />
      </mesh>

      {/* Load arrows on roof */}
      {showLoadArrows && (
        <>
          <LoadArrow position={[-0.6, 3, 0]} />
          <LoadArrow position={[0, 3, 0]} />
          <LoadArrow position={[0.6, 3, 0]} />
        </>
      )}

      {/* Stress indicators */}
      {showStressIndicators && (
        <>
          <StressIndicator position={[1.2, 0, 0.8]} />
          <StressIndicator position={[-1.2, 1, 0.8]} />
          <StressIndicator position={[1.2, 2, -0.8]} />
        </>
      )}

      {/* Dimension labels for structural view */}
      {!wireframe && (
        <>
          <Text
            position={[1.5, 1.2, 0]}
            fontSize={0.15}
            color="#22d3ee"
            anchorX="left"
          >
            h = 12.5m
          </Text>
          <Text
            position={[0, -0.7, 1.2]}
            fontSize={0.12}
            color="#a1a1aa"
            anchorX="center"
          >
            Base: 8.0m × 5.0m
          </Text>
        </>
      )}
    </group>
  );
};

// Scene component
const Scene: React.FC<{
  variant: 'structural' | 'blueprint';
  showLoadArrows?: boolean;
  showStressIndicators?: boolean;
}> = ({ variant, showLoadArrows, showStressIndicators }) => {
  const isBlueprint = variant === 'blueprint';

  return (
    <>
      <PerspectiveCamera makeDefault position={[4, 2.5, 4]} fov={45} />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 6}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-3, 3, -3]} color="#22d3ee" intensity={isBlueprint ? 1 : 0.5} />
      <pointLight position={[3, 1, 3]} color="#0891b2" intensity={0.3} />
      
      {/* Grid floor */}
      <gridHelper 
        args={[8, 8, '#06b6d4', '#164e63']} 
        position={[0, -0.5, 0]} 
      />
      
      {/* Building */}
      <RotatingBuilding 
        wireframe={isBlueprint}
        showLoadArrows={showLoadArrows && !isBlueprint}
        showStressIndicators={showStressIndicators && !isBlueprint}
      />
    </>
  );
};

// Export buttons overlay
const ExportButtonsOverlay: React.FC = () => (
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
    <div className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-cyan-400 text-sm font-mono flex items-center gap-1.5">
      <FileDown className="w-3.5 h-3.5" />
      .DXF
    </div>
    <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400 text-sm font-mono flex items-center gap-1.5">
      <FileDown className="w-3.5 h-3.5" />
      .PDF
    </div>
  </div>
);

const Building3DShowcase: React.FC<Building3DShowcaseProps> = ({
  variant = 'structural',
  showStressIndicators = false,
  showLoadArrows = false,
  showExportButtons = false,
  className = ''
}) => {
  return (
    <div 
      className={`relative rounded-3xl overflow-hidden ${className}`}
      style={{ 
        aspectRatio: className.includes('aspect-') ? undefined : '4/3',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        border: '1px solid rgba(63, 63, 70, 0.5)'
      }}
    >
      <Canvas>
        <Scene 
          variant={variant}
          showLoadArrows={showLoadArrows}
          showStressIndicators={showStressIndicators}
        />
      </Canvas>
      
      {showExportButtons && <ExportButtonsOverlay />}
      
      {/* Corner accent */}
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
    </div>
  );
};

export default Building3DShowcase;
