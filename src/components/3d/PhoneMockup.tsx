import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import ServiceScene from './ServiceScene';

// Social icon component that orbits the phone
const SocialIcon = ({ 
  angle, 
  radius, 
  speed, 
  icon, 
  color 
}: { 
  angle: number; 
  radius: number; 
  speed: number; 
  icon: string; 
  color: string;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * speed + angle;
      meshRef.current.position.x = Math.cos(t) * radius;
      meshRef.current.position.y = Math.sin(t) * radius * 0.6;
      meshRef.current.position.z = Math.sin(t) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
};

// Floating hearts
const FloatingHeart = ({ position, delay }: { position: [number, number, number]; delay: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.3;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime + delay) * 0.2;
    }
  });

  // Simple heart shape using TorusKnotGeometry approximation
  return (
    <mesh ref={meshRef} position={position} scale={0.12}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.6} />
    </mesh>
  );
};

const PhoneModel = () => {
  const phoneRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (phoneRef.current) {
      phoneRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 - 0.2;
      phoneRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={phoneRef}>
        {/* Phone body */}
        <RoundedBox args={[1.4, 2.8, 0.12]} radius={0.12} smoothness={4}>
          <meshStandardMaterial 
            color="#1a1a1a" 
            metalness={0.9} 
            roughness={0.1}
          />
        </RoundedBox>
        
        {/* Phone screen */}
        <RoundedBox args={[1.25, 2.6, 0.01]} radius={0.08} smoothness={4} position={[0, 0, 0.07]}>
          <meshStandardMaterial 
            color="#0f0f0f" 
            metalness={0.5} 
            roughness={0.2}
            emissive="#1e1e2e"
            emissiveIntensity={0.3}
          />
        </RoundedBox>

        {/* Screen glow */}
        <pointLight position={[0, 0, 0.5]} intensity={0.5} color="#f4a5a5" distance={2} />

        {/* Orbiting social icons */}
        <SocialIcon angle={0} radius={1.8} speed={0.8} icon="heart" color="#ec4899" />
        <SocialIcon angle={Math.PI * 0.66} radius={2} speed={0.6} icon="like" color="#8b5cf6" />
        <SocialIcon angle={Math.PI * 1.33} radius={1.6} speed={1} icon="share" color="#06b6d4" />
        
        {/* Floating hearts */}
        <FloatingHeart position={[1.5, 1, 0.5]} delay={0} />
        <FloatingHeart position={[-1.3, 0.5, 0.3]} delay={1} />
        <FloatingHeart position={[1.2, -0.8, 0.4]} delay={2} />
        <FloatingHeart position={[-1.5, -0.3, 0.2]} delay={1.5} />
      </group>
    </Float>
  );
};

const PhoneMockup = () => {
  return (
    <ServiceScene cameraPosition={[0, 0, 6]}>
      <PhoneModel />
      {/* Rose gold accent light */}
      <pointLight position={[3, 3, 3]} intensity={1} color="#f4a5a5" />
      <pointLight position={[-3, -2, 2]} intensity={0.5} color="#ec4899" />
    </ServiceScene>
  );
};

export default PhoneMockup;
