import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrainstormNode {
  id: string;
  label: string;
  level: number;
  parentId: string | null;
  x?: number;
  y?: number;
}

export interface BrainstormEdge {
  from: string;
  to: string;
}

export interface BrainstormData {
  nodes: BrainstormNode[];
  edges: BrainstormEdge[];
  topic: string;
}

// Keywords that trigger brainstorming
const BRAINSTORM_TRIGGERS = {
  direct: ['brainstorm', 'mind map', 'ideas for', 'explore ideas', 'think about', 'أفكار عن', 'عصف ذهني', 'خريطة ذهنية'],
  action: ['analyze', 'break down', 'explore', 'map out', 'diagram', 'visualize ideas', 'حلل', 'استكشف'],
  topics: ['strategy', 'planning', 'concept', 'project', 'business', 'استراتيجية', 'تخطيط', 'مشروع']
};

export const useBrainstorm = () => {
  const [brainstormData, setBrainstormData] = useState<BrainstormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect if message wants brainstorming
  const detectBrainstormIntent = useCallback((message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    
    // Check direct triggers first
    for (const phrase of BRAINSTORM_TRIGGERS.direct) {
      if (lowerMessage.includes(phrase)) return true;
    }
    
    // Check action + topic combinations
    const hasAction = BRAINSTORM_TRIGGERS.action.some(a => lowerMessage.includes(a));
    const hasTopic = BRAINSTORM_TRIGGERS.topics.some(t => lowerMessage.includes(t));
    
    if (hasAction && hasTopic) return true;
    
    return false;
  }, []);

  // Extract topic from message
  const extractTopic = useCallback((message: string): string => {
    // Remove trigger words and clean up
    let topic = message;
    
    const removeWords = [
      'brainstorm', 'mind map', 'ideas for', 'explore ideas', 'think about',
      'analyze', 'break down', 'explore', 'map out', 'diagram', 'visualize',
      'can you', 'please', 'help me', 'i want to', 'let\'s',
      'أفكار عن', 'عصف ذهني', 'خريطة ذهنية', 'حلل', 'استكشف'
    ];
    
    removeWords.forEach(word => {
      topic = topic.replace(new RegExp(word, 'gi'), '');
    });
    
    return topic.trim() || message;
  }, []);

  // Generate brainstorm
  const generateBrainstorm = useCallback(async (message: string, language: string = 'en') => {
    setIsGenerating(true);
    setError(null);
    
    const topic = extractTopic(message);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-brainstorm', {
        body: { topic, language }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Calculate positions for radial layout
      const positionedNodes = calculateRadialPositions(data.nodes);
      
      setBrainstormData({
        nodes: positionedNodes,
        edges: data.edges,
        topic: data.topic
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate brainstorm';
      setError(errorMessage);
      console.error('Brainstorm error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [extractTopic]);

  // Clear brainstorm
  const clearBrainstorm = useCallback(() => {
    setBrainstormData(null);
    setError(null);
  }, []);

  return {
    brainstormData,
    isGenerating,
    error,
    generateBrainstorm,
    clearBrainstorm,
    detectBrainstormIntent
  };
};

// Calculate radial positions for mind map nodes
function calculateRadialPositions(nodes: BrainstormNode[]): BrainstormNode[] {
  const centerX = 400;
  const centerY = 300;
  const levelRadii = [0, 150, 280]; // Distance from center for each level

  // Group nodes by parent
  const nodesByParent: Record<string, BrainstormNode[]> = {};
  nodes.forEach(node => {
    const parentKey = node.parentId || 'root';
    if (!nodesByParent[parentKey]) {
      nodesByParent[parentKey] = [];
    }
    nodesByParent[parentKey].push(node);
  });

  // Position central node
  const positionedNodes: BrainstormNode[] = [];
  const centralNode = nodes.find(n => n.level === 0);
  
  if (centralNode) {
    positionedNodes.push({
      ...centralNode,
      x: centerX,
      y: centerY
    });
  }

  // Position level 1 nodes (main branches) in a circle
  const level1Nodes = nodes.filter(n => n.level === 1);
  const angleStep1 = (2 * Math.PI) / level1Nodes.length;
  
  level1Nodes.forEach((node, index) => {
    const angle = angleStep1 * index - Math.PI / 2; // Start from top
    positionedNodes.push({
      ...node,
      x: centerX + Math.cos(angle) * levelRadii[1],
      y: centerY + Math.sin(angle) * levelRadii[1]
    });
  });

  // Position level 2 nodes (sub-ideas) around their parents
  const level2Nodes = nodes.filter(n => n.level === 2);
  
  // Group by parent
  const childrenByParent: Record<string, BrainstormNode[]> = {};
  level2Nodes.forEach(node => {
    if (node.parentId) {
      if (!childrenByParent[node.parentId]) {
        childrenByParent[node.parentId] = [];
      }
      childrenByParent[node.parentId].push(node);
    }
  });

  // Position children around each parent
  Object.entries(childrenByParent).forEach(([parentId, children]) => {
    const parent = positionedNodes.find(n => n.id === parentId);
    if (!parent || parent.x === undefined || parent.y === undefined) return;

    // Calculate parent's angle from center
    const parentAngle = Math.atan2(parent.y - centerY, parent.x - centerX);
    
    // Spread children in an arc around the parent's direction
    const spreadAngle = Math.PI / 3; // 60 degree spread
    const startAngle = parentAngle - spreadAngle / 2;
    const angleStep = children.length > 1 ? spreadAngle / (children.length - 1) : 0;

    children.forEach((child, index) => {
      const angle = children.length === 1 ? parentAngle : startAngle + angleStep * index;
      const childRadius = 100; // Distance from parent
      
      positionedNodes.push({
        ...child,
        x: parent.x! + Math.cos(angle) * childRadius,
        y: parent.y! + Math.sin(angle) * childRadius
      });
    });
  });

  return positionedNodes;
}
