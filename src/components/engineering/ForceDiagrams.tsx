import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ForceDiagramsProps {
  span: number; // in meters
  load: number; // distributed load in kN/m
  className?: string;
}

export const ForceDiagrams = ({ span, load, className }: ForceDiagramsProps) => {
  // Calculate diagram values
  const diagrams = useMemo(() => {
    const numPoints = 50;
    const dx = span / numPoints;
    
    // For simply supported beam with UDL:
    // Reactions: R = wL/2
    // Shear: V(x) = R - wx = wL/2 - wx = w(L/2 - x)
    // Moment: M(x) = Rx - wx²/2 = wx(L-x)/2
    
    const R = (load * span) / 2; // Reaction force
    const maxMoment = (load * span * span) / 8; // Maximum moment at midspan
    const maxShear = R; // Maximum shear at supports
    
    const shearPoints: { x: number; y: number }[] = [];
    const momentPoints: { x: number; y: number }[] = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const x = i * dx;
      
      // Shear force
      const shear = load * (span / 2 - x);
      shearPoints.push({ x: x / span, y: shear / maxShear });
      
      // Bending moment
      const moment = (load * x * (span - x)) / 2;
      momentPoints.push({ x: x / span, y: moment / maxMoment });
    }
    
    return {
      shearPoints,
      momentPoints,
      maxMoment,
      maxShear,
      R
    };
  }, [span, load]);

  // Convert points to SVG path
  const createPath = (points: { x: number; y: number }[], height: number, invert: boolean = false) => {
    if (points.length === 0) return '';
    
    const width = 280;
    const baseY = invert ? 10 : height - 10;
    
    let path = `M ${points[0].x * width + 30} ${baseY}`;
    
    points.forEach(point => {
      const y = invert 
        ? baseY + point.y * (height - 20) 
        : baseY - point.y * (height - 20);
      path += ` L ${point.x * width + 30} ${y}`;
    });
    
    path += ` L ${points[points.length - 1].x * width + 30} ${baseY}`;
    path += ' Z';
    
    return path;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Shear Force Diagram */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
          <span>Shear Force Diagram (SFD)</span>
          <span className="text-xs text-muted-foreground font-normal">
            V<sub>max</sub> = ±{diagrams.maxShear.toFixed(1)} kN
          </span>
        </h4>
        <svg viewBox="0 0 340 120" className="w-full h-32">
          {/* Grid */}
          <defs>
            <pattern id="shearGrid" width="28" height="20" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="30" y="10" width="280" height="100" fill="url(#shearGrid)" />
          
          {/* Baseline (zero line) */}
          <line x1="30" y1="60" x2="310" y2="60" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="4,2" />
          
          {/* Shear diagram - positive area */}
          <path
            d={`M 30 60 L 30 ${60 - 40} L 170 60 L 30 60 Z`}
            fill="hsl(var(--chart-1))"
            fillOpacity="0.3"
            stroke="hsl(var(--chart-1))"
            strokeWidth="2"
          />
          
          {/* Shear diagram - negative area */}
          <path
            d={`M 170 60 L 310 ${60 + 40} L 310 60 L 170 60 Z`}
            fill="hsl(var(--destructive))"
            fillOpacity="0.3"
            stroke="hsl(var(--destructive))"
            strokeWidth="2"
          />
          
          {/* Support markers */}
          <polygon points="30,112 25,120 35,120" fill="hsl(var(--foreground))" />
          <polygon points="310,112 305,120 315,120" fill="hsl(var(--foreground))" />
          
          {/* Labels */}
          <text x="20" y="25" fontSize="10" fill="hsl(var(--chart-1))" textAnchor="end">+{diagrams.maxShear.toFixed(0)}</text>
          <text x="320" y="100" fontSize="10" fill="hsl(var(--destructive))" textAnchor="start">-{diagrams.maxShear.toFixed(0)}</text>
          <text x="170" y="75" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">0</text>
          
          {/* Span label */}
          <text x="170" y="118" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">L = {span}m</text>
        </svg>
      </div>

      {/* Bending Moment Diagram */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
          <span>Bending Moment Diagram (BMD)</span>
          <span className="text-xs text-muted-foreground font-normal">
            M<sub>max</sub> = {diagrams.maxMoment.toFixed(1)} kN·m
          </span>
        </h4>
        <svg viewBox="0 0 340 120" className="w-full h-32">
          {/* Grid */}
          <defs>
            <pattern id="momentGrid" width="28" height="20" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="30" y="10" width="280" height="100" fill="url(#momentGrid)" />
          
          {/* Baseline */}
          <line x1="30" y1="15" x2="310" y2="15" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="4,2" />
          
          {/* Parabolic moment curve */}
          <path
            d={`M 30 15 Q 170 95 310 15`}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
          />
          
          {/* Filled area */}
          <path
            d={`M 30 15 Q 170 95 310 15 L 310 15 L 30 15 Z`}
            fill="hsl(var(--primary))"
            fillOpacity="0.2"
          />
          
          {/* Max moment indicator */}
          <line x1="170" y1="15" x2="170" y2="85" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="3,3" />
          <circle cx="170" cy="85" r="4" fill="hsl(var(--primary))" />
          
          {/* Support markers */}
          <polygon points="30,107 25,115 35,115" fill="hsl(var(--foreground))" />
          <polygon points="310,107 305,115 315,115" fill="hsl(var(--foreground))" />
          
          {/* Labels */}
          <text x="170" y="100" fontSize="10" fill="hsl(var(--primary))" textAnchor="middle" fontWeight="600">
            {diagrams.maxMoment.toFixed(1)} kN·m
          </text>
          <text x="30" y="12" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">0</text>
          <text x="310" y="12" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">0</text>
          
          {/* Span label */}
          <text x="170" y="113" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">L = {span}m</text>
        </svg>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Reaction Force</p>
          <p className="font-mono font-semibold text-sm">{diagrams.R.toFixed(1)} kN</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Max Shear</p>
          <p className="font-mono font-semibold text-sm">{diagrams.maxShear.toFixed(1)} kN</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Max Moment</p>
          <p className="font-mono font-semibold text-sm">{diagrams.maxMoment.toFixed(1)} kN·m</p>
        </div>
      </div>
    </div>
  );
};
