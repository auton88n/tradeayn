import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Brain } from 'lucide-react';
import { BrainstormData } from '@/hooks/useBrainstorm';

interface MindMapCanvasProps {
  data: BrainstormData;
  isGenerating: boolean;
  onClose: () => void;
}

// Color palette for different levels
const LEVEL_COLORS = [
  { bg: 'bg-primary', border: 'border-primary', text: 'text-primary-foreground' },
  { bg: 'bg-blue-500/90', border: 'border-blue-400', text: 'text-white' },
  { bg: 'bg-white/90 dark:bg-gray-800/90', border: 'border-gray-200 dark:border-gray-600', text: 'text-foreground' }
];

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  data,
  isGenerating,
  onClose
}) => {
  // Calculate SVG viewBox based on node positions
  const viewBox = useMemo(() => {
    if (!data.nodes.length) return '0 0 800 600';
    
    const padding = 100;
    const xs = data.nodes.map(n => n.x || 0);
    const ys = data.nodes.map(n => n.y || 0);
    
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;
    
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [data.nodes]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="absolute inset-4 md:inset-8 z-30 rounded-3xl overflow-hidden"
      >
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/40 rounded-3xl shadow-2xl" />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4 border-b border-gray-200/60 dark:border-gray-700/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{data.topic}</h3>
              <p className="text-xs text-muted-foreground">
                {data.nodes.length} ideas • {data.edges.length} connections
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Mind Map Content */}
        <div className="relative z-10 h-[calc(100%-70px)] overflow-auto">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-muted-foreground">Generating ideas...</p>
            </div>
          ) : (
            <svg
              viewBox={viewBox}
              className="w-full h-full"
              style={{ minHeight: '500px' }}
            >
              {/* Render edges (connections) */}
              <g className="edges">
                {data.edges.map((edge, index) => {
                  const fromNode = data.nodes.find(n => n.id === edge.from);
                  const toNode = data.nodes.find(n => n.id === edge.to);
                  
                  if (!fromNode || !toNode) return null;
                  
                  const fromX = fromNode.x || 0;
                  const fromY = fromNode.y || 0;
                  const toX = toNode.x || 0;
                  const toY = toNode.y || 0;
                  
                  // Calculate control points for curved lines
                  const midX = (fromX + toX) / 2;
                  const midY = (fromY + toY) / 2;
                  
                  // Determine color based on target level
                  const strokeColor = toNode.level === 1 
                    ? 'rgb(59, 130, 246)' // blue-500
                    : 'rgb(156, 163, 175)'; // gray-400
                  
                  return (
                    <motion.path
                      key={`${edge.from}-${edge.to}`}
                      d={`M ${fromX} ${fromY} Q ${midX} ${midY - 20} ${toX} ${toY}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={toNode.level === 1 ? 3 : 2}
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.6 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: index * 0.05,
                        ease: [0.32, 0.72, 0, 1]
                      }}
                    />
                  );
                })}
              </g>

              {/* Render nodes */}
              <g className="nodes">
                {data.nodes.map((node, index) => {
                  const colors = LEVEL_COLORS[node.level] || LEVEL_COLORS[2];
                  const nodeX = node.x || 0;
                  const nodeY = node.y || 0;
                  
                  // Different sizes for different levels
                  const width = node.level === 0 ? 160 : node.level === 1 ? 140 : 120;
                  const height = node.level === 0 ? 60 : node.level === 1 ? 50 : 40;
                  const fontSize = node.level === 0 ? 14 : node.level === 1 ? 12 : 11;
                  
                  return (
                    <motion.g
                      key={node.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: 0.2 + index * 0.05,
                        type: 'spring',
                        stiffness: 200
                      }}
                    >
                      {/* Node background with shadow */}
                      <rect
                        x={nodeX - width / 2 + 2}
                        y={nodeY - height / 2 + 2}
                        width={width}
                        height={height}
                        rx={height / 2}
                        fill="rgba(0,0,0,0.1)"
                      />
                      
                      {/* Node */}
                      <rect
                        x={nodeX - width / 2}
                        y={nodeY - height / 2}
                        width={width}
                        height={height}
                        rx={height / 2}
                        fill={node.level === 0 ? 'hsl(var(--primary))' : node.level === 1 ? 'rgb(59, 130, 246)' : 'white'}
                        stroke={node.level === 2 ? 'rgb(229, 231, 235)' : 'none'}
                        strokeWidth={1}
                        className="cursor-pointer transition-all hover:filter hover:brightness-110"
                      />
                      
                      {/* Node text */}
                      <text
                        x={nodeX}
                        y={nodeY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={fontSize}
                        fontWeight={node.level === 0 ? 600 : node.level === 1 ? 500 : 400}
                        fill={node.level === 2 ? 'rgb(55, 65, 81)' : 'white'}
                        className="pointer-events-none select-none"
                      >
                        {/* Truncate long text */}
                        {node.label.length > (width / fontSize * 1.5) 
                          ? node.label.slice(0, Math.floor(width / fontSize * 1.5)) + '...'
                          : node.label
                        }
                      </text>
                    </motion.g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
