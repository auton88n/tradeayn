import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import ServiceScene from './ServiceScene';

// Heart shape geometry
const createHeartShape = () => {
  const shape = new THREE.Shape();
  const x = 0, y = 0;
  shape.moveTo(x, y + 0.35);
  shape.bezierCurveTo(x, y + 0.35, x - 0.05, y, x - 0.25, y);
  shape.bezierCurveTo(x - 0.55, y, x - 0.55, y + 0.35, x - 0.55, y + 0.35);
  shape.bezierCurveTo(x - 0.55, y + 0.55, x - 0.35, y + 0.77, x, y + 1);
  shape.bezierCurveTo(x + 0.35, y + 0.77, x + 0.55, y + 0.55, x + 0.55, y + 0.35);
  shape.bezierCurveTo(x + 0.55, y + 0.35, x + 0.55, y, x + 0.25, y);
  shape.bezierCurveTo(x + 0.05, y, x, y + 0.35, x, y + 0.35);
  return shape;
};

// Floating heart component
const FloatingHeart = ({ 
  position, 
  delay, 
  scale = 0.15,
  color = "#ec4899"
}: { 
  position: [number, number, number]; 
  delay: number;
  scale?: number;
  color?: string;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const heartShape = useMemo(() => createHeartShape(), []);
  const extrudeSettings = useMemo(() => ({
    depth: 0.15,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.02,
    bevelThickness: 0.02
  }), []);
  
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime + delay;
      meshRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.3;
      meshRef.current.rotation.y = Math.sin(t * 0.8) * 0.3;
      meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      scale={scale}
      rotation={[0, 0, Math.PI]}
    >
      <extrudeGeometry args={[heartShape, extrudeSettings]} />
      <meshPhysicalMaterial 
        color={color}
        metalness={0.1}
        roughness={0.2}
        clearcoat={1}
        clearcoatRoughness={0.1}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
};

// Notification badge
const NotificationBadge = ({ 
  position, 
  count,
  delay 
}: { 
  position: [number, number, number]; 
  count: number;
  delay: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime + delay;
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.15;
      groupRef.current.rotation.z = Math.sin(t) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <capsuleGeometry args={[0.12, 0.15, 8, 16]} />
        <meshPhysicalMaterial 
          color="#f43f5e"
          metalness={0}
          roughness={0.3}
          clearcoat={0.8}
          emissive="#f43f5e"
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
};

// Star icon for likes/favorites
const StarIcon = ({ 
  position, 
  delay,
  color = "#fbbf24"
}: { 
  position: [number, number, number]; 
  delay: number;
  color?: string;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.3;
    const innerRadius = 0.12;
    const spikes = 5;
    
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();
    return shape;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime + delay;
      meshRef.current.position.y = position[1] + Math.sin(t * 1.8) * 0.2;
      meshRef.current.rotation.z = t * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={0.4}>
      <extrudeGeometry args={[starShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }]} />
      <meshPhysicalMaterial 
        color={color}
        metalness={0.3}
        roughness={0.2}
        clearcoat={1}
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

const PhoneModel = () => {
  const phoneRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (phoneRef.current) {
      phoneRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15 - 0.1;
      phoneRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
    // Animate screen gradient
    if (screenRef.current && screenRef.current.material instanceof THREE.ShaderMaterial) {
      screenRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // Animated gradient shader for screen
  const screenMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#ec4899') },
        uColor2: { value: new THREE.Color('#8b5cf6') },
        uColor3: { value: new THREE.Color('#06b6d4') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        varying vec2 vUv;
        
        void main() {
          float t = sin(uTime * 0.5) * 0.5 + 0.5;
          vec3 color1 = mix(uColor1, uColor2, vUv.y + sin(uTime * 0.3) * 0.3);
          vec3 color2 = mix(uColor2, uColor3, vUv.x + cos(uTime * 0.4) * 0.3);
          vec3 finalColor = mix(color1, color2, t);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, []);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <group ref={phoneRef}>
        {/* Phone frame - titanium style */}
        <RoundedBox args={[1.5, 3, 0.15]} radius={0.15} smoothness={8}>
          <meshPhysicalMaterial 
            color="#2a2a2a"
            metalness={0.95}
            roughness={0.15}
            clearcoat={0.8}
            clearcoatRoughness={0.1}
            reflectivity={1}
          />
        </RoundedBox>
        
        {/* Glass back */}
        <RoundedBox args={[1.4, 2.9, 0.01]} radius={0.12} smoothness={4} position={[0, 0, -0.08]}>
          <MeshTransmissionMaterial
            backside
            samples={8}
            thickness={0.2}
            chromaticAberration={0.02}
            anisotropy={0.3}
            distortion={0.1}
            distortionScale={0.2}
            temporalDistortion={0.1}
            transmission={0.95}
            roughness={0.05}
            color="#1a1a2e"
          />
        </RoundedBox>
        
        {/* Screen bezel */}
        <RoundedBox args={[1.35, 2.75, 0.02]} radius={0.1} smoothness={4} position={[0, 0, 0.075]}>
          <meshStandardMaterial color="#0a0a0a" />
        </RoundedBox>
        
        {/* Screen with animated gradient */}
        <mesh ref={screenRef} position={[0, 0, 0.085]}>
          <planeGeometry args={[1.25, 2.6]} />
          <primitive object={screenMaterial} attach="material" />
        </mesh>

        {/* Camera module */}
        <group position={[-0.35, 1.1, -0.09]}>
          <mesh>
            <cylinderGeometry args={[0.12, 0.12, 0.03, 32]} />
            <meshPhysicalMaterial 
              color="#1a1a1a"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[0, 0, -0.015]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 32]} />
            <meshPhysicalMaterial 
              color="#0066ff"
              metalness={0.5}
              roughness={0.3}
              emissive="#0066ff"
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>

        {/* Dynamic island / notch */}
        <mesh position={[0, 1.2, 0.086]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.04, 0.2, 8, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Floating social elements */}
        <FloatingHeart position={[1.4, 0.8, 0.3]} delay={0} scale={0.12} color="#ec4899" />
        <FloatingHeart position={[-1.3, -0.5, 0.4]} delay={1.5} scale={0.1} color="#f43f5e" />
        <FloatingHeart position={[1.2, -0.9, 0.2]} delay={2.5} scale={0.08} color="#ec4899" />
        
        <StarIcon position={[-1.4, 0.5, 0.3]} delay={0.5} color="#fbbf24" />
        <StarIcon position={[1.5, -0.2, 0.5]} delay={2} color="#f59e0b" />
        
        <NotificationBadge position={[1.6, 1.2, 0.4]} count={99} delay={1} />
        <NotificationBadge position={[-1.5, -1, 0.3]} count={12} delay={2.2} />
      </group>
    </Float>
  );
};

const PhoneMockup = () => {
  return (
    <ServiceScene cameraPosition={[0, 0, 6]}>
      <PhoneModel />
      {/* Rose gold accent lighting */}
      <pointLight position={[3, 2, 3]} intensity={2} color="#fda4af" />
      <pointLight position={[-3, -1, 2]} intensity={1} color="#ec4899" />
      <spotLight position={[0, 5, 3]} intensity={0.5} color="#ffffff" angle={0.5} />
    </ServiceScene>
  );
};

export default PhoneMockup;
