import React, { useMemo } from 'react';
import * as THREE from 'three';

interface ParkingCar3DProps {
  position: [number, number, number];
  rotation?: number;
  color?: string;
  scale?: number;
}

// Color palette for realistic car colors
const CAR_COLORS = [
  '#1a1a1a', // Black
  '#f5f5f5', // White
  '#374151', // Dark Gray
  '#dc2626', // Red
  '#2563eb', // Blue
  '#059669', // Green
  '#d97706', // Orange
  '#7c3aed', // Purple
  '#0891b2', // Cyan
];

export const ParkingCar3D: React.FC<ParkingCar3DProps> = ({
  position,
  rotation = 0,
  color,
  scale = 1,
}) => {
  const carColor = useMemo(() => {
    if (color) return color;
    return CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
  }, [color]);

  const glassColor = '#1e3a5f';

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Car Body - Main */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.8, 0.4, 4.2]} />
        <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Car Body - Cabin */}
      <mesh position={[0, 0.65, -0.3]} castShadow>
        <boxGeometry args={[1.6, 0.5, 2.2]} />
        <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Windshield - Front */}
      <mesh position={[0, 0.65, 0.85]} rotation={[0.4, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.02, 0.7]} />
        <meshStandardMaterial 
          color={glassColor} 
          metalness={0.1} 
          roughness={0.1} 
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Windshield - Rear */}
      <mesh position={[0, 0.65, -1.45]} rotation={[-0.4, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.02, 0.7]} />
        <meshStandardMaterial 
          color={glassColor} 
          metalness={0.1} 
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Wheels */}
      {[
        [0.85, 0.15, 1.3],
        [-0.85, 0.15, 1.3],
        [0.85, 0.15, -1.3],
        [-0.85, 0.15, -1.3],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          {/* Wheel rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, 0.22, 8]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Headlights */}
      {[0.6, -0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 2.1]} castShadow>
          <boxGeometry args={[0.3, 0.15, 0.05]} />
          <meshStandardMaterial 
            color="#fef3c7" 
            emissive="#fef3c7"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}

      {/* Tail lights */}
      {[0.6, -0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.3, -2.1]} castShadow>
          <boxGeometry args={[0.3, 0.15, 0.05]} />
          <meshStandardMaterial 
            color="#dc2626" 
            emissive="#dc2626"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Shadow underneath */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2, 4.5]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default ParkingCar3D;
