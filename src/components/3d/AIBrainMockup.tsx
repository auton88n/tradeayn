import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import ServiceScene from './ServiceScene';

// Neural connection line
const NeuralConnection = ({ 
  start, 
  end, 
  delay 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  delay: number;
}) => {
  const lineRef = useRef<THREE.Line | null>(null);
  
  const points = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) / 2 + (Math.random() - 0.5) * 0.5,
        (start[1] + end[1]) / 2 + (Math.random() - 0.5) * 0.5,
        (start[2] + end[2]) / 2 + (Math.random() - 0.5) * 0.5
      ),
      new THREE.Vector3(...end)
    );
    return curve.getPoints(20);
  }, [start, end]);

  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.3;
    }
  });

  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: '#00d4ff', transparent: true, opacity: 0.5 });
    const line = new THREE.Line(geometry, material);
    return line;
  }, [points]);

  return <primitive ref={lineRef} object={lineObject} />
};

// Glowing neural node
const NeuralNode = ({ 
  position, 
  size = 0.08, 
  delay = 0 
}: { 
  position: [number, number, number]; 
  size?: number; 
  delay?: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3 + delay) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial 
        color="#00d4ff" 
        emissive="#00d4ff" 
        emissiveIntensity={1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

// Orbiting particle
const OrbitingParticle = ({ 
  radius, 
  speed, 
  offset, 
  axis 
}: { 
  radius: number; 
  speed: number; 
  offset: number;
  axis: 'x' | 'y' | 'z';
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * speed + offset;
      if (axis === 'x') {
        meshRef.current.position.set(Math.cos(t) * radius, Math.sin(t) * radius, 0);
      } else if (axis === 'y') {
        meshRef.current.position.set(Math.cos(t) * radius, 0, Math.sin(t) * radius);
      } else {
        meshRef.current.position.set(0, Math.cos(t) * radius, Math.sin(t) * radius);
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
    </mesh>
  );
};

const BrainModel = () => {
  const brainRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (brainRef.current) {
      brainRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  // Generate random node positions
  const nodes: [number, number, number][] = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 20; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 0.8 + Math.random() * 0.4;
      positions.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ]);
    }
    return positions;
  }, []);

  // Generate connections between nearby nodes
  const connections = useMemo(() => {
    const conns: { start: [number, number, number]; end: [number, number, number] }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.sqrt(
          Math.pow(nodes[i][0] - nodes[j][0], 2) +
          Math.pow(nodes[i][1] - nodes[j][1], 2) +
          Math.pow(nodes[i][2] - nodes[j][2], 2)
        );
        if (dist < 0.8 && conns.length < 30) {
          conns.push({ start: nodes[i], end: nodes[j] });
        }
      }
    }
    return conns;
  }, [nodes]);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <group ref={brainRef}>
        {/* Core brain sphere - icosahedron for geometric look */}
        <mesh>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial 
            color="#0a1628"
            metalness={0.8}
            roughness={0.2}
            transparent
            opacity={0.6}
            wireframe
          />
        </mesh>

        {/* Inner glow */}
        <Sphere args={[0.7, 32, 32]}>
          <meshStandardMaterial 
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.3}
            transparent
            opacity={0.2}
          />
        </Sphere>

        {/* Neural nodes */}
        {nodes.map((pos, i) => (
          <NeuralNode key={i} position={pos} delay={i * 0.3} size={0.06 + Math.random() * 0.04} />
        ))}

        {/* Neural connections */}
        {connections.map((conn, i) => (
          <NeuralConnection key={i} start={conn.start} end={conn.end} delay={i * 0.2} />
        ))}

        {/* Orbiting particles */}
        <OrbitingParticle radius={1.5} speed={0.8} offset={0} axis="x" />
        <OrbitingParticle radius={1.6} speed={0.6} offset={Math.PI / 2} axis="y" />
        <OrbitingParticle radius={1.4} speed={1} offset={Math.PI} axis="z" />
        <OrbitingParticle radius={1.7} speed={0.5} offset={Math.PI * 1.5} axis="x" />
      </group>
    </Float>
  );
};

const AIBrainMockup = () => {
  return (
    <ServiceScene cameraPosition={[0, 0, 5]}>
      <BrainModel />
      {/* Cyan accent lights */}
      <pointLight position={[3, 2, 3]} intensity={1} color="#00d4ff" />
      <pointLight position={[-3, -2, 2]} intensity={0.8} color="#06b6d4" />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#8b5cf6" />
    </ServiceScene>
  );
};

export default AIBrainMockup;
