import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Torus, Box } from '@react-three/drei';
import * as THREE from 'three';
import ServiceScene from './ServiceScene';

// Rotating gear component
const Gear = ({ 
  position, 
  size = 1, 
  teeth = 12, 
  speed = 1, 
  direction = 1 
}: { 
  position: [number, number, number]; 
  size?: number; 
  teeth?: number;
  speed?: number;
  direction?: number;
}) => {
  const gearRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (gearRef.current) {
      gearRef.current.rotation.z = state.clock.elapsedTime * speed * direction;
    }
  });

  return (
    <group ref={gearRef} position={position}>
      {/* Main gear body */}
      <Torus args={[size * 0.6, size * 0.15, 8, teeth * 2]}>
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.9} 
          roughness={0.2}
        />
      </Torus>
      
      {/* Center hub */}
      <mesh>
        <cylinderGeometry args={[size * 0.2, size * 0.2, 0.1, 16]} />
        <meshStandardMaterial color="#10b981" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Gear teeth */}
      {Array.from({ length: teeth }).map((_, i) => {
        const angle = (i / teeth) * Math.PI * 2;
        return (
          <mesh 
            key={i} 
            position={[
              Math.cos(angle) * size * 0.75, 
              Math.sin(angle) * size * 0.75, 
              0
            ]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[size * 0.15, size * 0.1, 0.1]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
};

// Workflow node
const WorkflowNode = ({ 
  position, 
  delay = 0,
  size = 0.3
}: { 
  position: [number, number, number]; 
  delay?: number;
  size?: number;
}) => {
  const nodeRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (nodeRef.current) {
      nodeRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.1;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3 + delay) * 0.1;
      nodeRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <mesh ref={nodeRef} position={position}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial 
        color="#10b981" 
        emissive="#10b981" 
        emissiveIntensity={0.5}
        metalness={0.7}
        roughness={0.3}
      />
    </mesh>
  );
};

// Data flow line
const DataFlowLine = ({ 
  start, 
  end, 
  delay 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  delay: number;
}) => {
  const particleRef = useRef<THREE.Mesh>(null);
  
  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  useFrame((state) => {
    if (particleRef.current) {
      const t = ((state.clock.elapsedTime * 0.5 + delay) % 1);
      particleRef.current.position.lerpVectors(
        new THREE.Vector3(...start),
        new THREE.Vector3(...end),
        t
      );
    }
  });

  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: '#10b981', transparent: true, opacity: 0.4 });
    return new THREE.Line(geometry, material);
  }, [points]);

  return (
    <>
      <primitive object={lineObject} />
      {/* Traveling particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1} />
      </mesh>
    </>
  );
};

const AutomationModel = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });

  const nodePositions: [number, number, number][] = [
    [-1.5, 1, 0],
    [1.5, 1, 0],
    [-1.5, -1, 0],
    [1.5, -1, 0],
    [0, 0, 0.5],
  ];

  const connections = [
    { start: nodePositions[0], end: nodePositions[4] },
    { start: nodePositions[1], end: nodePositions[4] },
    { start: nodePositions[4], end: nodePositions[2] },
    { start: nodePositions[4], end: nodePositions[3] },
    { start: nodePositions[0], end: nodePositions[1] },
    { start: nodePositions[2], end: nodePositions[3] },
  ];

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={groupRef}>
        {/* Main gear cluster */}
        <Gear position={[0, 0, -0.5]} size={1.2} teeth={16} speed={0.5} direction={1} />
        <Gear position={[-1.3, 0.8, -0.3]} size={0.7} teeth={10} speed={0.8} direction={-1} />
        <Gear position={[1.3, 0.8, -0.3]} size={0.7} teeth={10} speed={0.8} direction={-1} />
        <Gear position={[0, -1.2, -0.3]} size={0.8} teeth={12} speed={0.65} direction={-1} />

        {/* Workflow nodes */}
        {nodePositions.map((pos, i) => (
          <WorkflowNode key={i} position={pos} delay={i * 0.5} size={0.25} />
        ))}

        {/* Data flow connections */}
        {connections.map((conn, i) => (
          <DataFlowLine 
            key={i} 
            start={conn.start} 
            end={conn.end} 
            delay={i * 0.3} 
          />
        ))}
      </group>
    </Float>
  );
};

const AutomationMockup = () => {
  return (
    <ServiceScene cameraPosition={[0, 0, 5.5]}>
      <AutomationModel />
      {/* Emerald accent lights */}
      <pointLight position={[3, 2, 3]} intensity={1} color="#10b981" />
      <pointLight position={[-3, -2, 2]} intensity={0.8} color="#059669" />
      <pointLight position={[0, 3, -1]} intensity={0.5} color="#34d399" />
    </ServiceScene>
  );
};

export default AutomationMockup;
