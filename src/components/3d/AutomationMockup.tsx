import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import ServiceScene from './ServiceScene';

// Premium gear with proper teeth
const Gear = ({ 
  position, 
  size = 1, 
  teeth = 12, 
  speed = 1, 
  direction = 1,
  color = "#10b981",
  thickness = 0.15
}: { 
  position: [number, number, number]; 
  size?: number;
  teeth?: number;
  speed?: number;
  direction?: number;
  color?: string;
  thickness?: number;
}) => {
  const gearRef = useRef<THREE.Group>(null);
  
  const gearShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = size;
    const innerRadius = size * 0.7;
    const toothWidth = (Math.PI * 2) / (teeth * 3);
    
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const nextAngle = ((i + 1) / teeth) * Math.PI * 2;
      const x1 = Math.cos(angle) * innerRadius;
      const y1 = Math.sin(angle) * innerRadius;
      const toothMidAngle = angle + (nextAngle - angle) / 2;
      const x2 = Math.cos(toothMidAngle - toothWidth) * outerRadius;
      const y2 = Math.sin(toothMidAngle - toothWidth) * outerRadius;
      const x3 = Math.cos(toothMidAngle + toothWidth) * outerRadius;
      const y3 = Math.sin(toothMidAngle + toothWidth) * outerRadius;
      const x4 = Math.cos(nextAngle) * innerRadius;
      const y4 = Math.sin(nextAngle) * innerRadius;
      
      if (i === 0) shape.moveTo(x1, y1);
      shape.lineTo(x2, y2);
      shape.lineTo(x3, y3);
      shape.lineTo(x4, y4);
    }
    shape.closePath();
    
    const hole = new THREE.Path();
    hole.absarc(0, 0, size * 0.25, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    
    return shape;
  }, [size, teeth]);

  const extrudeSettings = useMemo(() => ({
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.02,
    bevelThickness: 0.02
  }), [thickness]);

  useFrame(() => {
    if (gearRef.current) {
      gearRef.current.rotation.z += 0.005 * speed * direction;
    }
  });

  return (
    <group ref={gearRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <extrudeGeometry args={[gearShape, extrudeSettings]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.9}
          roughness={0.15}
          clearcoat={0.5}
          clearcoatRoughness={0.1}
          envMapIntensity={1}
        />
      </mesh>
      <mesh position={[0, 0, thickness / 2]}>
        <cylinderGeometry args={[size * 0.35, size * 0.35, thickness * 1.5, 32]} />
        <meshPhysicalMaterial color="#1a1a1a" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
};

// Glass workflow node
const WorkflowNode = ({ 
  position, 
  delay,
  color = "#10b981"
}: { 
  position: [number, number, number]; 
  delay: number;
  color?: string;
}) => {
  const nodeRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (nodeRef.current) {
      const t = state.clock.elapsedTime + delay;
      nodeRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.1;
      nodeRef.current.rotation.y = t * 0.3;
    }
    if (innerRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2 + delay) * 0.1 + 1;
      innerRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={nodeRef} position={position}>
      <RoundedBox args={[0.35, 0.35, 0.35]} radius={0.05} smoothness={4}>
        <MeshTransmissionMaterial
          backside
          samples={8}
          thickness={0.3}
          chromaticAberration={0.02}
          transmission={0.9}
          roughness={0.1}
          color={color}
        />
      </RoundedBox>
      <mesh ref={innerRef}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
};

// Data flow particle
const DataFlowParticle = ({ 
  start, 
  end, 
  delay,
  color = "#10b981"
}: { 
  start: THREE.Vector3; 
  end: THREE.Vector3;
  delay: number;
  color?: string;
}) => {
  const particleRef = useRef<THREE.Mesh>(null);
  
  const curve = useMemo(() => {
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
    mid.y += 0.3;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [start, end]);

  useFrame((state) => {
    if (particleRef.current) {
      const t = ((state.clock.elapsedTime * 0.4 + delay) % 1);
      const point = curve.getPoint(t);
      particleRef.current.position.copy(point);
      particleRef.current.scale.setScalar(Math.sin(t * Math.PI) * 0.5 + 0.5);
    }
  });

  return (
    <mesh ref={particleRef}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
};

// Connection tube
const ConnectionTube = ({ 
  start, 
  end,
  color = "#10b981"
}: { 
  start: THREE.Vector3; 
  end: THREE.Vector3;
  color?: string;
}) => {
  const tubeGeometry = useMemo(() => {
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
    mid.y += 0.2;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return new THREE.TubeGeometry(curve, 32, 0.015, 8, false);
  }, [start, end]);

  return (
    <mesh geometry={tubeGeometry}>
      <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.5} transparent opacity={0.4} />
    </mesh>
  );
};

// Circuit board
const CircuitBoard = () => {
  const traces = useMemo(() => {
    const paths: Array<{ points: THREE.Vector3[] }> = [];
    for (let i = 0; i < 15; i++) {
      const startX = (Math.random() - 0.5) * 4;
      const startZ = (Math.random() - 0.5) * 4;
      paths.push({
        points: [
          new THREE.Vector3(startX, 0, startZ),
          new THREE.Vector3(startX + (Math.random() - 0.5) * 2, 0, startZ),
          new THREE.Vector3(startX + (Math.random() - 0.5) * 2, 0, startZ + (Math.random() - 0.5) * 2),
        ]
      });
    }
    return paths;
  }, []);

  return (
    <group position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <planeGeometry args={[5, 5]} />
        <meshPhysicalMaterial color="#0a2818" metalness={0.3} roughness={0.8} transparent opacity={0.6} />
      </mesh>
      {traces.map((trace, i) => {
        const curve = new THREE.CatmullRomCurve3(trace.points);
        const geometry = new THREE.TubeGeometry(curve, 20, 0.02, 4, false);
        return (
          <mesh key={i} geometry={geometry}>
            <meshPhysicalMaterial color="#10b981" metalness={0.8} roughness={0.3} emissive="#10b981" emissiveIntensity={0.2} />
          </mesh>
        );
      })}
    </group>
  );
};

const AutomationModel = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  const nodePositions = useMemo(() => [
    new THREE.Vector3(-1.2, 0.5, 0),
    new THREE.Vector3(0, 1, 0.5),
    new THREE.Vector3(1.2, 0.5, 0),
    new THREE.Vector3(0.6, -0.3, 0.3),
    new THREE.Vector3(-0.6, -0.3, -0.3),
  ], []);

  const connections = useMemo(() => [
    { start: nodePositions[0], end: nodePositions[1] },
    { start: nodePositions[1], end: nodePositions[2] },
    { start: nodePositions[1], end: nodePositions[3] },
    { start: nodePositions[0], end: nodePositions[4] },
    { start: nodePositions[4], end: nodePositions[3] },
  ], [nodePositions]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={groupRef}>
        <Gear position={[-0.8, -0.5, 0]} size={0.8} teeth={16} speed={1} direction={1} color="#10b981" thickness={0.12} />
        <Gear position={[0.65, -0.5, 0.1]} size={0.55} teeth={11} speed={1.45} direction={-1} color="#059669" thickness={0.12} />
        <Gear position={[0, 0.2, -0.3]} size={0.4} teeth={8} speed={2} direction={1} color="#34d399" thickness={0.1} />

        {nodePositions.map((pos, i) => (
          <WorkflowNode key={i} position={[pos.x, pos.y, pos.z]} delay={i * 0.5} color={i % 2 === 0 ? "#10b981" : "#06b6d4"} />
        ))}

        {connections.map((conn, i) => (
          <ConnectionTube key={i} start={conn.start} end={conn.end} color="#10b981" />
        ))}

        {connections.map((conn, i) => (
          <DataFlowParticle key={i} start={conn.start} end={conn.end} delay={i * 0.4} color="#34d399" />
        ))}

        <CircuitBoard />
      </group>
    </Float>
  );
};

const AutomationMockup = () => {
  return (
    <ServiceScene cameraPosition={[0, 1, 5]}>
      <AutomationModel />
      <pointLight position={[3, 2, 3]} intensity={2} color="#10b981" />
      <pointLight position={[-3, -1, 2]} intensity={1.5} color="#059669" />
      <pointLight position={[0, 3, 2]} intensity={0.8} color="#06b6d4" />
      <spotLight position={[0, 5, 3]} intensity={0.6} color="#ffffff" angle={0.5} />
    </ServiceScene>
  );
};

export default AutomationMockup;
