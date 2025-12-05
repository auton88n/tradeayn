import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import ServiceScene from './ServiceScene';

// Neural pulse along a tube
const NeuralTube = ({ 
  start, 
  end, 
  delay,
  color = "#06b6d4"
}: { 
  start: THREE.Vector3; 
  end: THREE.Vector3;
  delay: number;
  color?: string;
}) => {
  const pulseRef = useRef<THREE.Mesh>(null);
  
  const curve = useMemo(() => {
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
    mid.z += (Math.random() - 0.5) * 0.5;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [start, end]);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 32, 0.015, 8, false);
  }, [curve]);

  useFrame((state) => {
    if (pulseRef.current) {
      const t = ((state.clock.elapsedTime * 0.5 + delay) % 1);
      const point = curve.getPoint(t);
      pulseRef.current.position.copy(point);
      pulseRef.current.scale.setScalar(0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
    }
  });

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshPhysicalMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.6}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshPhysicalMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
};

// Glowing neural node
const NeuralNode = ({ 
  position, 
  delay,
  size = 0.08,
  color = "#8b5cf6"
}: { 
  position: THREE.Vector3; 
  delay: number;
  size?: number;
  color?: string;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2 + delay) * 0.15 + 1;
      meshRef.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      const glow = Math.sin(state.clock.elapsedTime * 3 + delay) * 0.3 + 0.7;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glow * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh ref={glowRef} scale={2.5}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.5}
          roughness={0.2}
          clearcoat={1}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
};

// Orbiting data particle
const DataParticle = ({ 
  radius, 
  speed, 
  offset,
  axis = 'y',
  color = "#06b6d4"
}: { 
  radius: number; 
  speed: number;
  offset: number;
  axis?: 'x' | 'y' | 'z';
  color?: string;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * speed + offset;
      if (axis === 'y') {
        meshRef.current.position.x = Math.cos(t) * radius;
        meshRef.current.position.z = Math.sin(t) * radius;
        meshRef.current.position.y = Math.sin(t * 2) * 0.3;
      } else if (axis === 'x') {
        meshRef.current.position.y = Math.cos(t) * radius;
        meshRef.current.position.z = Math.sin(t) * radius;
        meshRef.current.position.x = Math.sin(t * 2) * 0.3;
      } else {
        meshRef.current.position.x = Math.cos(t) * radius;
        meshRef.current.position.y = Math.sin(t) * radius;
        meshRef.current.position.z = Math.sin(t * 2) * 0.3;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
};

const BrainModel = () => {
  const brainRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  
  const nodePositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const radius = 0.85 + Math.random() * 0.15;
      positions.push(new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      ));
    }
    return positions;
  }, []);

  const connections = useMemo(() => {
    const conns: Array<{ start: THREE.Vector3; end: THREE.Vector3 }> = [];
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < 1.5) {
          conns.push({ start: nodePositions[i], end: nodePositions[j] });
        }
      }
    }
    return conns;
  }, [nodePositions]);

  useFrame((state) => {
    if (brainRef.current) {
      brainRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
    if (coreRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={brainRef}>
        {/* Glass brain shell */}
        <Sphere args={[1, 64, 64]}>
          <MeshTransmissionMaterial
            backside
            samples={16}
            thickness={0.5}
            chromaticAberration={0.05}
            anisotropy={0.5}
            distortion={0.2}
            distortionScale={0.3}
            temporalDistortion={0.2}
            transmission={0.92}
            roughness={0.05}
            color="#c4b5fd"
            ior={1.5}
          />
        </Sphere>

        {/* Inner geometric core */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.35, 1]} />
          <meshPhysicalMaterial
            color="#8b5cf6"
            metalness={0.8}
            roughness={0.2}
            emissive="#8b5cf6"
            emissiveIntensity={1}
          />
        </mesh>

        {/* Central glow */}
        <mesh scale={0.5}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#c4b5fd" transparent opacity={0.3} />
        </mesh>

        {/* Neural nodes */}
        {nodePositions.map((pos, i) => (
          <NeuralNode 
            key={i} 
            position={pos} 
            delay={i * 0.5}
            size={0.06 + Math.random() * 0.03}
            color={i % 3 === 0 ? "#8b5cf6" : i % 3 === 1 ? "#06b6d4" : "#ec4899"}
          />
        ))}

        {/* Neural connections */}
        {connections.map((conn, i) => (
          <NeuralTube
            key={i}
            start={conn.start}
            end={conn.end}
            delay={i * 0.3}
            color={i % 2 === 0 ? "#06b6d4" : "#8b5cf6"}
          />
        ))}

        {/* Orbiting particles */}
        {[...Array(8)].map((_, i) => (
          <DataParticle
            key={i}
            radius={1.4 + (i % 3) * 0.2}
            speed={0.5 + i * 0.1}
            offset={i * Math.PI / 4}
            axis={i % 3 === 0 ? 'y' : i % 3 === 1 ? 'x' : 'z'}
            color={i % 2 === 0 ? "#06b6d4" : "#a855f7"}
          />
        ))}
      </group>
    </Float>
  );
};

const AIBrainMockup = () => {
  return (
    <ServiceScene cameraPosition={[0, 0, 4.5]}>
      <BrainModel />
      <pointLight position={[3, 2, 3]} intensity={2} color="#06b6d4" />
      <pointLight position={[-3, -1, 2]} intensity={1.5} color="#8b5cf6" />
      <pointLight position={[0, -3, 2]} intensity={0.8} color="#ec4899" />
      <spotLight position={[0, 5, 3]} intensity={0.5} color="#ffffff" angle={0.5} />
    </ServiceScene>
  );
};

export default AIBrainMockup;
