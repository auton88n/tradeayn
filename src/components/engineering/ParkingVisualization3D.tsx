import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

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

const SPACE_COLORS = {
  standard: '#3b82f6',
  accessible: '#0ea5e9',
  ev: '#22c55e',
  compact: '#f59e0b',
};

const Ground: React.FC<{ length: number; width: number }> = ({ length, width }) => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2, -0.05, width / 2]} receiveShadow>
      <planeGeometry args={[length + 10, width + 10]} />
      <meshStandardMaterial color="#4a5568" />
    </mesh>
  );
};

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
        <boxGeometry args={[length, 0.2, width]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      {/* Columns for structure */}
      {!isTop && (
        <>
          {Array.from({ length: Math.ceil(length / 10) }).map((_, xi) =>
            Array.from({ length: Math.ceil(width / 10) }).map((_, zi) => (
              <mesh
                key={`col-${xi}-${zi}`}
                position={[
                  -length / 2 + 5 + xi * 10,
                  1.5,
                  -width / 2 + 5 + zi * 10,
                ]}
                castShadow
              >
                <cylinderGeometry args={[0.3, 0.3, 3, 8]} />
                <meshStandardMaterial color="#6b7280" />
              </mesh>
            ))
          )}
        </>
      )}
    </group>
  );
};

const ParkingSpace3D: React.FC<{ space: ParkingSpace; floorHeight: number }> = ({ 
  space, 
  floorHeight 
}) => {
  const color = SPACE_COLORS[space.type];
  
  return (
    <group 
      position={[
        space.x + space.width / 2, 
        floorHeight + 0.01, 
        space.y + space.length / 2
      ]}
      rotation={[0, ((space.angle - 90) * Math.PI) / 180, 0]}
    >
      {/* Parking space marking */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[space.width, space.length]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </mesh>

      {/* Space border lines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(space.width, space.length)]} />
        <lineBasicMaterial color="white" linewidth={2} />
      </lineSegments>

      {/* Type indicator */}
      {space.type === 'accessible' && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.4, 32]} />
          <meshStandardMaterial color="white" />
        </mesh>
      )}
      {space.type === 'ev' && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.4, 32]} />
          <meshStandardMaterial color="white" />
        </mesh>
      )}
    </group>
  );
};

const Aisle3D: React.FC<{ 
  aisle: { x: number; y: number; width: number; height: number }; 
  floorHeight: number 
}> = ({ aisle, floorHeight }) => {
  return (
    <mesh 
      position={[
        aisle.x + aisle.width / 2, 
        floorHeight + 0.005, 
        aisle.y + aisle.height / 2
      ]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[aisle.width, aisle.height]} />
      <meshStandardMaterial color="#6b7280" />
    </mesh>
  );
};

const EntryExit: React.FC<{ 
  position: [number, number, number]; 
  type: 'entry' | 'exit'; 
  width: number 
}> = ({ position, type, width }) => {
  const color = type === 'entry' ? '#22c55e' : '#ef4444';
  
  return (
    <group position={position}>
      {/* Gate structure */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[1, 2, width]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Gate arm */}
      <mesh position={[2, 1.5, 0]} castShadow>
        <boxGeometry args={[4, 0.1, 0.1]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
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

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[siteLength, 20, siteWidth]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Ground */}
      <Ground length={siteLength} width={siteWidth} />

      {/* Parking lot surface */}
      <mesh 
        position={[siteLength / 2, 0, siteWidth / 2]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[siteLength, siteWidth]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {/* For structured parking, add floors */}
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

      {/* Aisles */}
      {layout.aisles.map((aisle, i) => (
        <Aisle3D key={`aisle-${i}`} aisle={aisle} floorHeight={0} />
      ))}

      {/* Parking Spaces */}
      {layout.spaces.map((space) => (
        <ParkingSpace3D key={space.id} space={space} floorHeight={0} />
      ))}

      {/* Entry/Exit */}
      {layout.entries.map((entry, i) => (
        <EntryExit
          key={`entry-${i}`}
          position={[entry.x, 0, entry.y + entry.width / 2]}
          type="entry"
          width={entry.width}
        />
      ))}
      {layout.exits.map((exit, i) => (
        <EntryExit
          key={`exit-${i}`}
          position={[exit.x + exit.width, 0, exit.y + exit.width / 2]}
          type="exit"
          width={exit.width}
        />
      ))}

      {/* Site boundary */}
      <lineSegments position={[siteLength / 2, 0.1, siteWidth / 2]}>
        <edgesGeometry args={[new THREE.BoxGeometry(siteLength, 0.1, siteWidth)]} />
        <lineBasicMaterial color="#94a3b8" linewidth={2} />
      </lineSegments>
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
          position={[siteLength * 0.8, maxDim * 0.6, siteWidth * 0.8]}
          fov={50}
        />
        <OrbitControls
          target={[siteLength / 2, 0, siteWidth / 2]}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={10}
          maxDistance={maxDim * 2}
        />
        <Scene {...props} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
