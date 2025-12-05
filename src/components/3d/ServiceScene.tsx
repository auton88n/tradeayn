import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { Suspense, ReactNode } from 'react';

interface ServiceSceneProps {
  children: ReactNode;
  cameraPosition?: [number, number, number];
  showShadows?: boolean;
}

const ServiceScene = ({ 
  children, 
  cameraPosition = [0, 0, 5],
  showShadows = true 
}: ServiceSceneProps) => {
  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[400px]">
      <Canvas
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={cameraPosition} fov={40} />
          
          {/* Premium lighting setup */}
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={0.8} 
            castShadow
          />
          <directionalLight 
            position={[-5, 3, 2]} 
            intensity={0.4} 
            color="#e0e7ff"
          />
          <pointLight position={[0, -3, 3]} intensity={0.3} color="#fef3c7" />
          
          {children}
          
          {/* HDR Environment for realistic reflections */}
          <Environment preset="studio" />
          
          {/* Contact shadows for grounding */}
          {showShadows && (
            <ContactShadows 
              position={[0, -2.5, 0]} 
              opacity={0.4} 
              scale={10} 
              blur={2.5}
              far={4}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ServiceScene;
