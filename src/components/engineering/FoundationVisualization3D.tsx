import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FoundationVisualization3DProps {
  outputs: Record<string, unknown>;
  className?: string;
}

export const FoundationVisualization3D = ({ outputs, className }: FoundationVisualization3DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const foundationLength = ((outputs.length || 2.0) as number) * 1000; // Convert to mm
  const foundationWidth = ((outputs.width || 2.0) as number) * 1000;
  const foundationDepth = (outputs.depth || 400) as number;
  const columnWidth = (outputs.columnWidth || 400) as number;
  const columnDepth = (outputs.columnDepth || 400) as number;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate scale
    const padding = 80;
    const maxDim = Math.max(foundationLength, foundationWidth);
    const scale = (Math.min(canvasWidth, canvasHeight) - padding * 2) / maxDim * 0.7;

    const scaledLength = foundationLength * scale;
    const scaledWidth = foundationWidth * scale;
    const scaledColumnW = columnWidth * scale;
    const scaledColumnD = columnDepth * scale;

    // Isometric projection
    const isoAngle = Math.PI / 6; // 30 degrees
    const cos30 = Math.cos(isoAngle);
    const sin30 = Math.sin(isoAngle);

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2 + 30;

    // Transform function for isometric view
    const toIso = (x: number, y: number, z: number) => {
      return {
        x: centerX + (x - y) * cos30,
        y: centerY + (x + y) * sin30 - z * 0.8,
      };
    };

    // Foundation corners
    const fH = foundationDepth * scale * 0.3; // Foundation height in view
    const fL = scaledLength / 2;
    const fW = scaledWidth / 2;

    // Draw foundation (bottom face)
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    let p = toIso(-fL, -fW, 0);
    ctx.moveTo(p.x, p.y);
    p = toIso(fL, -fW, 0);
    ctx.lineTo(p.x, p.y);
    p = toIso(fL, fW, 0);
    ctx.lineTo(p.x, p.y);
    p = toIso(-fL, fW, 0);
    ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();

    // Foundation top face
    ctx.fillStyle = '#718096';
    ctx.beginPath();
    p = toIso(-fL, -fW, fH);
    ctx.moveTo(p.x, p.y);
    p = toIso(fL, -fW, fH);
    ctx.lineTo(p.x, p.y);
    p = toIso(fL, fW, fH);
    ctx.lineTo(p.x, p.y);
    p = toIso(-fL, fW, fH);
    ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();

    // Foundation front face
    ctx.fillStyle = '#5a6478';
    ctx.beginPath();
    p = toIso(fL, -fW, 0);
    ctx.moveTo(p.x, p.y);
    p = toIso(fL, fW, 0);
    ctx.lineTo(p.x, p.y);
    p = toIso(fL, fW, fH);
    ctx.lineTo(p.x, p.y);
    p = toIso(fL, -fW, fH);
    ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();

    // Foundation right face
    ctx.fillStyle = '#6a7488';
    ctx.beginPath();
    p = toIso(fL, fW, 0);
    ctx.moveTo(p.x, p.y);
    p = toIso(-fL, fW, 0);
    ctx.lineTo(p.x, p.y);
    p = toIso(-fL, fW, fH);
    ctx.lineTo(p.x, p.y);
    p = toIso(fL, fW, fH);
    ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();

    // Draw reinforcement grid pattern on top
    ctx.strokeStyle = '#f6ad55';
    ctx.lineWidth = 1.5;
    const gridSpacing = 30;
    const padding2 = 15;

    // X-direction bars
    for (let i = -fW + padding2; i <= fW - padding2; i += gridSpacing) {
      const start = toIso(-fL + padding2, i, fH + 2);
      const end = toIso(fL - padding2, i, fH + 2);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // Y-direction bars
    for (let i = -fL + padding2; i <= fL - padding2; i += gridSpacing) {
      const start = toIso(i, -fW + padding2, fH + 2);
      const end = toIso(i, fW - padding2, fH + 2);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // Draw column
    const cW = scaledColumnW / 2;
    const cD = scaledColumnD / 2;
    const colHeight = fH + 80;

    // Column front face
    ctx.fillStyle = '#a0aec0';
    ctx.beginPath();
    p = toIso(cW, -cD, fH);
    ctx.moveTo(p.x, p.y);
    p = toIso(cW, cD, fH);
    ctx.lineTo(p.x, p.y);
    p = toIso(cW, cD, colHeight);
    ctx.lineTo(p.x, p.y);
    p = toIso(cW, -cD, colHeight);
    ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();

    // Column right face
    ctx.fillStyle = '#b8c2cc';
    ctx.beginPath();
    p = toIso(cW, cD, fH);
    ctx.moveTo(p.x, p.y);
    p = toIso(-cW, cD, fH);
    ctx.lineTo(p.x, p.y);
    p = toIso(-cW, cD, colHeight);
    ctx.lineTo(p.x, p.y);
    p = toIso(cW, cD, colHeight);
    ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();

    // Column top face
    ctx.fillStyle = '#cbd5e0';
    ctx.beginPath();
    p = toIso(-cW, -cD, colHeight);
    ctx.moveTo(p.x, p.y);
    p = toIso(cW, -cD, colHeight);
    ctx.lineTo(p.x, p.y);
    p = toIso(cW, cD, colHeight);
    ctx.lineTo(p.x, p.y);
    p = toIso(-cW, cD, colHeight);
    ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();

    // Draw dimensions
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';

    // Foundation length dimension
    const dimStart = toIso(-fL, fW + 20, 0);
    const dimEnd = toIso(fL, fW + 20, 0);
    ctx.beginPath();
    ctx.moveTo(dimStart.x, dimStart.y);
    ctx.lineTo(dimEnd.x, dimEnd.y);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    const dimMid = toIso(0, fW + 30, 0);
    ctx.fillText(`${(foundationLength / 1000).toFixed(2)} m`, dimMid.x, dimMid.y + 15);

    // Foundation width dimension
    const dimStart2 = toIso(fL + 20, -fW, 0);
    const dimEnd2 = toIso(fL + 20, fW, 0);
    ctx.beginPath();
    ctx.moveTo(dimStart2.x, dimStart2.y);
    ctx.lineTo(dimEnd2.x, dimEnd2.y);
    ctx.stroke();
    
    const dimMid2 = toIso(fL + 30, 0, 0);
    ctx.fillText(`${(foundationWidth / 1000).toFixed(2)} m`, dimMid2.x + 20, dimMid2.y);

    // Legend
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    
    ctx.fillStyle = '#718096';
    ctx.fillRect(10, 15, 12, 12);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Foundation', 28, 24);

    ctx.fillStyle = '#a0aec0';
    ctx.fillRect(10, 32, 12, 12);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Column', 28, 41);

    ctx.strokeStyle = '#f6ad55';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 55);
    ctx.lineTo(22, 55);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Reinforcement', 28, 58);

  }, [foundationLength, foundationWidth, foundationDepth, columnWidth, columnDepth]);

  return (
    <div className={cn("w-full h-full relative", className)}>
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        Isometric View
      </div>
    </div>
  );
};
