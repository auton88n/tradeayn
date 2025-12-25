import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Box, Layers, Activity, Thermometer } from 'lucide-react';

interface BeamVisualization3DProps {
  outputs: Record<string, unknown>;
  className?: string;
}

// Animated Load Arrow Component
const AnimatedLoadArrow: React.FC<{
  position: [number, number, number];
  scale?: number;
  color?: string;
}> = ({ position, scale = 1, color = '#ef4444' }) => {
  const arrowRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (arrowRef.current) {
      // Pulsing animation
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1;
      arrowRef.current.scale.setScalar(pulse * scale);
      // Slight vertical oscillation
      arrowRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <group ref={arrowRef} position={position}>
      {/* Arrow shaft */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Arrow head */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.05, 0.1, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

// Distributed Load Visualization
const DistributedLoad: React.FC<{
  length: number;
  yPosition: number;
  arrowCount?: number;
}> = ({ length, yPosition, arrowCount = 5 }) => {
  const arrows = useMemo(() => {
    const positions: [number, number, number][] = [];
    const spacing = length / (arrowCount - 1);
    for (let i = 0; i < arrowCount; i++) {
      positions.push([-length / 2 + i * spacing, yPosition, 0]);
    }
    return positions;
  }, [length, arrowCount, yPosition]);

  return (
    <group>
      {arrows.map((pos, i) => (
        <AnimatedLoadArrow key={i} position={pos} scale={0.8} />
      ))}
      {/* Connecting line */}
      <mesh position={[0, yPosition + 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, length, 8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  );
};

// Dimension Label Component
const DimensionLabel: React.FC<{
  position: [number, number, number];
  text: string;
  rotation?: [number, number, number];
}> = ({ position, text, rotation = [0, 0, 0] }) => (
  <Text
    position={position}
    rotation={rotation}
    fontSize={0.15}
    color="#22c55e"
    anchorX="center"
    anchorY="middle"
    outlineWidth={0.01}
    outlineColor="#000000"
  >
    {text}
  </Text>
);

// Deflection Curve Component
const DeflectionCurve: React.FC<{
  beamLength: number;
  maxDeflection: number;
  yOffset: number;
}> = ({ beamLength, maxDeflection, yOffset }) => {
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const segments = 32;
  
  useEffect(() => {
    const initialPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const z = -beamLength / 2 + t * beamLength;
      initialPoints.push(new THREE.Vector3(0, yOffset, z));
    }
    setPoints(initialPoints);
  }, [beamLength, yOffset, segments]);

  useFrame((state) => {
    if (points.length > 0) {
      const time = state.clock.elapsedTime;
      const amplitude = maxDeflection * (0.8 + 0.2 * Math.sin(time * 2));
      
      const newPoints = points.map((point, i) => {
        const t = i / segments;
        const deflection = amplitude * 4 * t * (1 - t);
        return new THREE.Vector3(point.x, yOffset - deflection, point.z);
      });
      setPoints(newPoints);
    }
  });

  if (points.length === 0) return null;

  return (
    <Line
      points={points}
      color="#fbbf24"
      lineWidth={3}
      dashed={false}
    />
  );
};

// Stress Color Gradient Material
const StressGradientMesh: React.FC<{
  width: number;
  depth: number;
  beamLength: number;
  showStress: boolean;
}> = ({ width, depth, beamLength, showStress }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && showStress) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      // Pulsing stress visualization
      const intensity = 0.5 + 0.2 * Math.sin(state.clock.elapsedTime * 2);
      material.emissiveIntensity = intensity;
    }
  });

  if (!showStress) return null;

  return (
    <mesh ref={meshRef} position={[0, -depth / 4, 0]}>
      <boxGeometry args={[width, depth / 2, beamLength * 0.8]} />
      <meshStandardMaterial
        color="#ef4444"
        transparent
        opacity={0.3}
        emissive="#ef4444"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

// 2D Cross-Section View
const Beam2DView: React.FC<{
  width: number;
  depth: number;
  mainBars: number;
  barDia: number;
  stirrupDia: number;
  cover: number;
}> = ({ width, depth, mainBars, barDia, stirrupDia, cover }) => {
  // Scale to fit in viewbox
  const padding = 40;
  const maxDim = Math.max(width, depth);
  const scale = (200 - padding * 2) / maxDim;
  
  const w = width * scale;
  const d = depth * scale;
  const c = cover * scale;
  const barR = Math.max(barDia * scale * 0.4, 4);
  const stirrupT = Math.max(stirrupDia * scale * 0.3, 2);
  
  const offsetX = (200 - w) / 2;
  const offsetY = (200 - d) / 2;
  
  // Main bar positions
  const barSpacing = (w - c * 2 - barR * 2) / (mainBars - 1);
  const bottomY = offsetY + d - c - barR;
  const topY = offsetY + c + barR;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Background */}
      <rect x="0" y="0" width="200" height="200" fill="#1a1a2e" />
      
      {/* Concrete section */}
      <rect 
        x={offsetX} y={offsetY} 
        width={w} height={d} 
        fill="#718096" 
        stroke="#2d3748" 
        strokeWidth="2"
      />
      
      {/* Stirrup */}
      <rect 
        x={offsetX + c} 
        y={offsetY + c} 
        width={w - c * 2} 
        height={d - c * 2}
        fill="none"
        stroke="#f97316"
        strokeWidth={stirrupT}
      />
      
      {/* Main bars (bottom) */}
      {Array.from({ length: mainBars }).map((_, i) => (
        <circle
          key={`main-${i}`}
          cx={offsetX + c + barR + i * barSpacing}
          cy={bottomY}
          r={barR}
          fill="#3182ce"
        />
      ))}
      
      {/* Top bars */}
      <circle cx={offsetX + c + barR} cy={topY} r={barR * 0.7} fill="#48bb78" />
      <circle cx={offsetX + w - c - barR} cy={topY} r={barR * 0.7} fill="#48bb78" />
      
      {/* Dimension lines */}
      <line x1={offsetX} y1={offsetY + d + 15} x2={offsetX + w} y2={offsetY + d + 15} stroke="#e2e8f0" strokeWidth="1" />
      <text x={offsetX + w/2} y={offsetY + d + 28} fill="#e2e8f0" fontSize="10" textAnchor="middle">{width} mm</text>
      
      <line x1={offsetX - 15} y1={offsetY} x2={offsetX - 15} y2={offsetY + d} stroke="#e2e8f0" strokeWidth="1" />
      <text x={offsetX - 20} y={offsetY + d/2} fill="#e2e8f0" fontSize="10" textAnchor="middle" transform={`rotate(-90, ${offsetX - 20}, ${offsetY + d/2})`}>{depth} mm</text>
    </svg>
  );
};

const BeamMesh: React.FC<{ 
  width: number; 
  depth: number; 
  mainBars: number; 
  barDia: number;
  stirrupDia: number;
  cover: number;
  showLabels?: boolean;
  showDeflection?: boolean;
  showStress?: boolean;
}> = ({ width, depth, mainBars, barDia, stirrupDia, cover, showLabels = true, showDeflection = false, showStress = false }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  const maxDimension = Math.max(width, depth);
  const baseScale = 2.5 / maxDimension;
  
  const w = width * baseScale;
  const d = depth * baseScale;
  const c = cover * baseScale;
  const beamLength = Math.max(w, d) * 1.5;
  const barRadius = Math.min(w, d) * 0.035;
  const stirrupThickness = barRadius * 0.5;

  const bottomY = -d/2 + c + barRadius;
  const barSpacing = (w - 2 * c - 2 * barRadius) / (mainBars - 1);
  
  const mainBarPositions: [number, number][] = [];
  for (let i = 0; i < mainBars; i++) {
    mainBarPositions.push([-w/2 + c + barRadius + i * barSpacing, bottomY]);
  }

  const topY = d/2 - c - barRadius;
  const topBarPositions: [number, number][] = [
    [-w/2 + c + barRadius, topY],
    [w/2 - c - barRadius, topY],
  ];

  const stirrupWidth = w - 2 * c;
  const stirrupHeight = d - 2 * c;
  const numStirrups = 8;
  const stirrupSpacing = beamLength / (numStirrups + 1);

  return (
    <group ref={meshRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w, d, beamLength]} />
        <meshStandardMaterial color="#8B8B8B" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w, d, beamLength)]} />
        <lineBasicMaterial color="#555555" />
      </lineSegments>

      {mainBarPositions.map((pos, index) => (
        <mesh key={`main-${index}`} position={[pos[0], pos[1], 0]}>
          <cylinderGeometry args={[barRadius, barRadius, beamLength - c * 2, 12]} />
          <meshStandardMaterial color="#2563eb" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {topBarPositions.map((pos, index) => (
        <mesh key={`top-${index}`} position={[pos[0], pos[1], 0]}>
          <cylinderGeometry args={[barRadius * 0.7, barRadius * 0.7, beamLength - c * 2, 12]} />
          <meshStandardMaterial color="#22c55e" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {Array.from({ length: numStirrups }).map((_, index) => {
        const zPos = -beamLength/2 + (index + 1) * stirrupSpacing;
        const halfW = stirrupWidth / 2;
        const halfH = stirrupHeight / 2;
        
        const segments: Array<{ pos: [number, number, number]; size: [number, number, number] }> = [
          { pos: [0, -halfH, zPos], size: [stirrupWidth + stirrupThickness, stirrupThickness, stirrupThickness] },
          { pos: [0, halfH, zPos], size: [stirrupWidth + stirrupThickness, stirrupThickness, stirrupThickness] },
          { pos: [-halfW, 0, zPos], size: [stirrupThickness, stirrupHeight, stirrupThickness] },
          { pos: [halfW, 0, zPos], size: [stirrupThickness, stirrupHeight, stirrupThickness] },
        ];
        
        return (
          <group key={index}>
            {segments.map((seg, i) => (
              <mesh key={i} position={seg.pos}>
                <boxGeometry args={seg.size} />
                <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Animated Distributed Load */}
      <DistributedLoad length={beamLength * 0.8} yPosition={d/2 + 0.1} arrowCount={7} />

      {/* Deflection Curve */}
      {showDeflection && (
        <DeflectionCurve beamLength={beamLength} maxDeflection={0.15} yOffset={-d/2 - 0.1} />
      )}

      {/* Stress Visualization */}
      {showStress && (
        <StressGradientMesh width={w} depth={d} beamLength={beamLength} showStress={showStress} />
      )}

      {/* Dimension Labels */}
      {showLabels && (
        <>
          {/* Width label */}
          <DimensionLabel 
            position={[0, -d/2 - 0.3, beamLength/2 + 0.2]} 
            text={`${width} mm`}
          />
          {/* Depth label */}
          <DimensionLabel 
            position={[w/2 + 0.35, 0, beamLength/2 + 0.2]} 
            text={`${depth} mm`}
            rotation={[0, 0, -Math.PI/2]}
          />
          {/* Length label */}
          <DimensionLabel 
            position={[w/2 + 0.2, -d/2 - 0.15, 0]} 
            text={`L`}
          />
        </>
      )}
    </group>
  );
};

export const BeamVisualization3D = ({ outputs, className }: BeamVisualization3DProps) => {
  const [is3D, setIs3D] = useState(true);
  const [showDeflection, setShowDeflection] = useState(true);
  const [showStress, setShowStress] = useState(true);
  
  const width = (outputs.width || outputs.beamWidth || 300) as number;
  const depth = (outputs.depth || outputs.beamDepth || 500) as number;
  const mainBars = (outputs.numberOfBars || 4) as number;
  const barDia = (outputs.barDiameter || 20) as number;
  const stirrupDia = (outputs.stirrupDia || 8) as number;
  const cover = 40;

  return (
    <div className={cn("w-full h-full relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden", className)}>
      {/* View Toggle */}
      <div className="absolute top-3 right-3 z-10 flex gap-1">
        <div className="flex bg-background/80 rounded-md overflow-hidden border border-border/50">
          <button
            onClick={() => setIs3D(false)}
            className={cn(
              "px-2 py-1.5 flex items-center gap-1 text-xs transition-colors",
              !is3D ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            2D
          </button>
          <button
            onClick={() => setIs3D(true)}
            className={cn(
              "px-2 py-1.5 flex items-center gap-1 text-xs transition-colors",
              is3D ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Box className="w-3.5 h-3.5" />
            3D
          </button>
        </div>
      </div>

      {/* Analysis Toggles */}
      {is3D && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          <button
            onClick={() => setShowDeflection(!showDeflection)}
            className={cn(
              "px-2 py-1.5 flex items-center gap-1.5 text-xs rounded-md border transition-colors",
              showDeflection 
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400" 
                : "bg-background/80 border-border/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            Deflection
          </button>
          <button
            onClick={() => setShowStress(!showStress)}
            className={cn(
              "px-2 py-1.5 flex items-center gap-1.5 text-xs rounded-md border transition-colors",
              showStress 
                ? "bg-red-500/20 border-red-500/50 text-red-400" 
                : "bg-background/80 border-border/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <Thermometer className="w-3.5 h-3.5" />
            Stress
          </button>
        </div>
      )}

      {is3D ? (
        <Canvas>
          <PerspectiveCamera makeDefault position={[4, 3, 4]} />
          <OrbitControls enableZoom enablePan={false} minDistance={2} maxDistance={12} autoRotate autoRotateSpeed={0.5} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          <pointLight position={[0, 5, 0]} intensity={0.5} />
          <BeamMesh 
            width={width} 
            depth={depth} 
            mainBars={mainBars} 
            barDia={barDia} 
            stirrupDia={stirrupDia} 
            cover={cover}
            showDeflection={showDeflection}
            showStress={showStress}
          />
          <gridHelper args={[10, 20, '#444444', '#333333']} position={[0, -2.5, 0]} />
        </Canvas>
      ) : (
        <Beam2DView width={width} depth={depth} mainBars={mainBars} barDia={barDia} stirrupDia={stirrupDia} cover={cover} />
      )}
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-gray-400">Main: {mainBars}Ø{barDia}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-400">Top Bars</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-gray-400">Stirrups Ø{stirrupDia}</span>
        </div>
        {showDeflection && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-gray-400">Deflection</span>
          </div>
        )}
        {showStress && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-400">Tension Zone</span>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {width}×{depth} mm
      </div>
    </div>
  );
};
