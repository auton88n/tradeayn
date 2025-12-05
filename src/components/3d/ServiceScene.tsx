import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import { Suspense, ReactNode } from 'react';

interface ServiceSceneProps {
  children: ReactNode;
  cameraPosition?: [number, number, number];
}

const ServiceScene = ({ children, cameraPosition = [0, 0, 5] }: ServiceSceneProps) => {
  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[400px]">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={cameraPosition} fov={45} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} />
          <pointLight position={[-5, -5, 5]} intensity={0.3} color="#8b5cf6" />
          {children}
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ServiceScene;
