import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { ParkingCar3D } from './parking/components/ParkingCar3D';

interface ParkingSpace {
  id: string;
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  type: 'standard' | 'accessible' | 'compact' | 'ev';
  row: number;
  col: number;
}

interface ParkingLayout {
  spaces: ParkingSpace[];
  aisles: { x: number; y: number; width: number; height: number; direction: 'horizontal' | 'vertical' }[];
  entries: { x: number; y: number; width: number }[];
  exits: { x: number; y: number; width: number }[];
  totalSpaces: number;
  accessibleSpaces: number;
  evSpaces: number;
  compactSpaces: number;
}

interface ParkingVisualization3DProps {
  layout: ParkingLayout;
  siteLength: number;
  siteWidth: number;
  parkingType: string;
  floors: number;
}

// Space type colors with premium gradient feel
const SPACE_COLORS = {
  standard: '#3b82f6',
  accessible: '#0ea5e9',
  ev: '#22c55e',
  compact: '#f59e0b',
};

// Asphalt ground with realistic texture
const AsphaltGround: React.FC<{ length: number; width: number }> = ({ length, width }) => {
  return (
    <group>
      {/* Main asphalt surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2, 0, width / 2]} receiveShadow>
        <planeGeometry args={[length, width]} />
        <meshStandardMaterial 
          color="#2d2d2d" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Subtle surface variation overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2, 0.001, width / 2]} receiveShadow>
        <planeGeometry args={[length, width]} />
        <meshStandardMaterial 
          color="#3a3a3a" 
          roughness={1}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Perimeter curb */}
      <mesh position={[length / 2, 0.1, -0.15]} castShadow>
        <boxGeometry args={[length + 0.6, 0.2, 0.3]} />
        <meshStandardMaterial color="#6b7280" roughness={0.7} />
      </mesh>
      <mesh position={[length / 2, 0.1, width + 0.15]} castShadow>
        <boxGeometry args={[length + 0.6, 0.2, 0.3]} />
        <meshStandardMaterial color="#6b7280" roughness={0.7} />
      </mesh>
      <mesh position={[-0.15, 0.1, width / 2]} castShadow>
        <boxGeometry args={[0.3, 0.2, width]} />
        <meshStandardMaterial color="#6b7280" roughness={0.7} />
      </mesh>
      <mesh position={[length + 0.15, 0.1, width / 2]} castShadow>
        <boxGeometry args={[0.3, 0.2, width]} />
        <meshStandardMaterial color="#6b7280" roughness={0.7} />
      </mesh>
    </group>
  );
};

// Premium parking space with painted lines
const ParkingSpace3D: React.FC<{ 
  space: ParkingSpace; 
  showCar: boolean;
}> = ({ space, showCar }) => {
  const color = SPACE_COLORS[space.type];
  const lineThickness = 0.08;
  
  return (
    <group 
      position={[space.x + space.width / 2, 0.01, space.y + space.length / 2]}
      rotation={[0, ((space.angle - 90) * Math.PI) / 180, 0]}
    >
      {/* Painted line markings - sides */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-space.width / 2, 0, 0]}>
        <planeGeometry args={[lineThickness, space.length]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[space.width / 2, 0, 0]}>
        <planeGeometry args={[lineThickness, space.length]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Back line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -space.length / 2 + lineThickness / 2]}>
        <planeGeometry args={[space.width, lineThickness]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Space type indicator - colored fill for special spaces */}
      {space.type !== 'standard' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <planeGeometry args={[space.width - 0.3, space.length - 0.3]} />
          <meshStandardMaterial 
            color={color} 
            transparent 
            opacity={0.25} 
          />
        </mesh>
      )}

      {/* Accessible symbol */}
      {space.type === 'accessible' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.5]}>
          <circleGeometry args={[0.5, 32]} />
          <meshStandardMaterial color="#0ea5e9" />
        </mesh>
      )}

      {/* EV charging symbol */}
      {space.type === 'ev' && (
        <group position={[0, 0.02, 0.5]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.4, 32]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
          {/* Lightning bolt approximation */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <circleGeometry args={[0.2, 6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      )}

      {/* Parked car (random occupancy ~60%) */}
      {showCar && (
        <ParkingCar3D 
          position={[0, 0, 0.3]} 
          rotation={0}
          scale={0.45}
        />
      )}
    </group>
  );
};

// Drive aisle with arrows
const Aisle3D: React.FC<{ 
  aisle: { x: number; y: number; width: number; height: number; direction: 'horizontal' | 'vertical' };
}> = ({ aisle }) => {
  return (
    <group position={[aisle.x + aisle.width / 2, 0.005, aisle.y + aisle.height / 2]}>
      {/* Slightly lighter surface for aisles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[aisle.width, aisle.height]} />
        <meshStandardMaterial color="#3d3d3d" />
      </mesh>

      {/* Direction arrows */}
      {aisle.direction === 'horizontal' && (
        <>
          {/* Arrow pointing right */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-aisle.width / 4, 0.01, 0]}>
            <planeGeometry args={[2, 0.15]} />
            <meshStandardMaterial color="white" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[-aisle.width / 4 + 1, 0.01, 0.35]}>
            <planeGeometry args={[0.8, 0.15]} />
            <meshStandardMaterial color="white" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[-aisle.width / 4 + 1, 0.01, -0.35]}>
            <planeGeometry args={[0.8, 0.15]} />
            <meshStandardMaterial color="white" transparent opacity={0.5} />
          </mesh>

          {/* Arrow pointing left */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[aisle.width / 4, 0.01, 0]}>
            <planeGeometry args={[2, 0.15]} />
            <meshStandardMaterial color="white" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[aisle.width / 4 - 1, 0.01, 0.35]}>
            <planeGeometry args={[0.8, 0.15]} />
            <meshStandardMaterial color="white" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[aisle.width / 4 - 1, 0.01, -0.35]}>
            <planeGeometry args={[0.8, 0.15]} />
            <meshStandardMaterial color="white" transparent opacity={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
};

// Animated entry/exit gate
const ParkingGate: React.FC<{ 
  position: [number, number, number]; 
  type: 'entry' | 'exit';
  width: number;
}> = ({ position, type, width }) => {
  const gateRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Mesh>(null);
  
  const color = type === 'entry' ? '#22c55e' : '#ef4444';
  const textColor = type === 'entry' ? '#15803d' : '#b91c1c';

  // Subtle arm animation
  useFrame((state) => {
    if (armRef.current) {
      armRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 + 0.1;
    }
  });
  
  return (
    <group ref={gateRef} position={position}>
      {/* Gate booth */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1.5, 2.4, 1.5]} />
        <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Booth window */}
      <mesh position={[type === 'entry' ? 0.76 : -0.76, 1.5, 0]} castShadow>
        <boxGeometry args={[0.02, 0.8, 1]} />
        <meshStandardMaterial 
          color="#1e3a5f" 
          transparent 
          opacity={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Gate arm mount */}
      <mesh position={[type === 'entry' ? 0.9 : -0.9, 2.2, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Animated gate arm */}
      <mesh 
        ref={armRef}
        position={[type === 'entry' ? 3 : -3, 2.2, 0]} 
        castShadow
      >
        <boxGeometry args={[4, 0.15, 0.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Stripes on arm */}
      {[-1.5, -0.5, 0.5, 1.5].map((offset, i) => (
        <mesh 
          key={i}
          position={[type === 'entry' ? 3 + offset : -3 - offset, 2.21, 0.11]}
        >
          <boxGeometry args={[0.3, 0.15, 0.01]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}

      {/* Sign */}
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[2, 0.6, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

// Simple tree for landscaping
const Tree3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const scale = 0.8 + Math.random() * 0.4;
  
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#5d4037" roughness={0.9} />
      </mesh>

      {/* Foliage layers */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[1.5, 2, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[1.2, 1.5, 8]} />
        <meshStandardMaterial color="#3d7a37" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.3, 0]} castShadow>
        <coneGeometry args={[0.8, 1.2, 8]} />
        <meshStandardMaterial color="#4d9a47" roughness={0.8} />
      </mesh>
    </group>
  );
};

// Light pole for realism
const LightPole: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 6, 8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Light arm */}
      <mesh position={[0.8, 5.8, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.5, 6]} />
        <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Light fixture */}
      <mesh position={[1.4, 5.5, 0]} castShadow>
        <boxGeometry args={[0.6, 0.15, 0.4]} />
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Light glow */}
      <mesh position={[1.4, 5.4, 0]}>
        <planeGeometry args={[0.5, 0.3]} />
        <meshStandardMaterial 
          color="#fef3c7" 
          emissive="#fef3c7"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
};

// Parking floor for multi-level structures
const ParkingFloor: React.FC<{ 
  length: number; 
  width: number; 
  height: number;
  isTop?: boolean;
}> = ({ length, width, height, isTop = false }) => {
  return (
    <group position={[length / 2, height, width / 2]}>
      {/* Floor slab */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[length, 0.25, width]} />
        <meshStandardMaterial color="#6b7280" roughness={0.7} />
      </mesh>

      {/* Support columns */}
      {!isTop && Array.from({ length: Math.ceil(length / 12) }).map((_, xi) =>
        Array.from({ length: Math.ceil(width / 12) }).map((_, zi) => (
          <mesh
            key={`col-${xi}-${zi}`}
            position={[
              -length / 2 + 6 + xi * 12,
              1.5,
              -width / 2 + 6 + zi * 12,
            ]}
            castShadow
          >
            <cylinderGeometry args={[0.35, 0.35, 3, 12]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.5} metalness={0.3} />
          </mesh>
        ))
      )}
    </group>
  );
};

const Scene: React.FC<ParkingVisualization3DProps> = ({
  layout,
  siteLength,
  siteWidth,
  parkingType,
  floors,
}) => {
  const floorHeight = 3;

  // Determine which spaces have cars (roughly 60% occupancy)
  const carsInSpaces = useMemo(() => {
    const carMap = new Map<string, boolean>();
    layout.spaces.forEach((space) => {
      carMap.set(space.id, Math.random() > 0.4);
    });
    return carMap;
  }, [layout.spaces]);

  // Generate tree positions around perimeter
  const treePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    // Along top edge
    for (let x = 5; x < siteLength - 5; x += 15) {
      positions.push([x, 0, -3]);
    }
    // Along bottom edge
    for (let x = 8; x < siteLength - 5; x += 15) {
      positions.push([x, 0, siteWidth + 3]);
    }
    return positions;
  }, [siteLength, siteWidth]);

  // Light pole positions
  const lightPolePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let x = 10; x < siteLength - 5; x += 25) {
      positions.push([x, 0, -2]);
      positions.push([x, 0, siteWidth + 2]);
    }
    return positions;
  }, [siteLength, siteWidth]);

  return (
    <>
      {/* Improved lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[siteLength * 0.8, 30, siteWidth * 0.3]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-siteLength}
        shadow-camera-right={siteLength}
        shadow-camera-top={siteWidth}
        shadow-camera-bottom={-siteWidth}
      />
      <directionalLight
        position={[-20, 15, -20]}
        intensity={0.3}
        color="#87ceeb"
      />

      {/* Sky color background */}
      <color attach="background" args={['#87ceeb']} />
      <fog attach="fog" args={['#87ceeb', 50, 200]} />

      {/* Ground plane extending beyond site */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[siteLength / 2, -0.1, siteWidth / 2]} receiveShadow>
        <planeGeometry args={[siteLength + 50, siteWidth + 50]} />
        <meshStandardMaterial color="#4a5d4a" />
      </mesh>

      {/* Asphalt surface */}
      <AsphaltGround length={siteLength} width={siteWidth} />

      {/* Multi-floor structure */}
      {parkingType !== 'surface' && (
        <>
          {Array.from({ length: floors }).map((_, i) => (
            <ParkingFloor
              key={`floor-${i}`}
              length={siteLength}
              width={siteWidth}
              height={(i + 1) * floorHeight}
              isTop={i === floors - 1}
            />
          ))}
        </>
      )}

      {/* Drive aisles */}
      {layout.aisles.map((aisle, i) => (
        <Aisle3D key={`aisle-${i}`} aisle={aisle} />
      ))}

      {/* Parking spaces with cars */}
      {layout.spaces.map((space) => (
        <ParkingSpace3D 
          key={space.id} 
          space={space} 
          showCar={carsInSpaces.get(space.id) || false}
        />
      ))}

      {/* Entry/Exit gates */}
      {layout.entries.map((entry, i) => (
        <ParkingGate
          key={`entry-${i}`}
          position={[entry.x - 2, 0, entry.y + entry.width / 2]}
          type="entry"
          width={entry.width}
        />
      ))}
      {layout.exits.map((exit, i) => (
        <ParkingGate
          key={`exit-${i}`}
          position={[exit.x + exit.width + 2, 0, exit.y + exit.width / 2]}
          type="exit"
          width={exit.width}
        />
      ))}

      {/* Landscaping - trees */}
      {treePositions.map((pos, i) => (
        <Tree3D key={`tree-${i}`} position={pos} />
      ))}

      {/* Light poles */}
      {lightPolePositions.map((pos, i) => (
        <LightPole key={`light-${i}`} position={pos} />
      ))}

      {/* Contact shadows for extra realism */}
      <ContactShadows
        position={[siteLength / 2, 0, siteWidth / 2]}
        opacity={0.4}
        scale={Math.max(siteLength, siteWidth) * 1.5}
        blur={2}
        far={10}
      />
    </>
  );
};

export const ParkingVisualization3D: React.FC<ParkingVisualization3DProps> = (props) => {
  const { siteLength, siteWidth } = props;
  const maxDim = Math.max(siteLength, siteWidth);

  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[siteLength * 0.7, maxDim * 0.5, siteWidth * 1.2]}
          fov={45}
        />
        <OrbitControls
          target={[siteLength / 2, 0, siteWidth / 2]}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={0.1}
          minDistance={15}
          maxDistance={maxDim * 2.5}
          enableDamping
          dampingFactor={0.05}
        />
        <Scene {...props} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default ParkingVisualization3D;
