import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BeamVisualization3DProps {
  outputs: Record<string, unknown>;
  className?: string;
}

export const BeamVisualization3D = ({ outputs, className }: BeamVisualization3DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const width = (outputs.width || outputs.beamWidth || 300) as number;
  const depth = (outputs.depth || outputs.beamDepth || 500) as number;
  const mainBars = (outputs.numberOfBars || 4) as number;
  const barDia = (outputs.barDiameter || 20) as number;
  const stirrupDia = (outputs.stirrupDia || 8) as number;
  const cover = 40;

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

    // Calculate scale to fit beam in canvas
    const padding = 60;
    const availableWidth = canvasWidth - padding * 2;
    const availableHeight = canvasHeight - padding * 2;
    const scale = Math.min(availableWidth / width, availableHeight / depth) * 0.8;

    const scaledWidth = width * scale;
    const scaledDepth = depth * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledDepth) / 2;

    // 3D effect offset
    const depth3D = 30;

    // Draw back face (3D effect)
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.moveTo(offsetX + depth3D, offsetY - depth3D);
    ctx.lineTo(offsetX + scaledWidth + depth3D, offsetY - depth3D);
    ctx.lineTo(offsetX + scaledWidth + depth3D, offsetY + scaledDepth - depth3D);
    ctx.lineTo(offsetX + depth3D, offsetY + scaledDepth - depth3D);
    ctx.closePath();
    ctx.fill();

    // Draw side face (3D effect)
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.moveTo(offsetX + scaledWidth, offsetY);
    ctx.lineTo(offsetX + scaledWidth + depth3D, offsetY - depth3D);
    ctx.lineTo(offsetX + scaledWidth + depth3D, offsetY + scaledDepth - depth3D);
    ctx.lineTo(offsetX + scaledWidth, offsetY + scaledDepth);
    ctx.closePath();
    ctx.fill();

    // Draw main concrete section (front face)
    ctx.fillStyle = '#718096';
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;
    ctx.fillRect(offsetX, offsetY, scaledWidth, scaledDepth);
    ctx.strokeRect(offsetX, offsetY, scaledWidth, scaledDepth);

    // Draw stirrups
    const scaledCover = cover * scale;
    const scaledStirrupDia = Math.max(stirrupDia * scale * 0.3, 2);
    
    ctx.strokeStyle = '#f6ad55';
    ctx.lineWidth = scaledStirrupDia;
    ctx.strokeRect(
      offsetX + scaledCover,
      offsetY + scaledCover,
      scaledWidth - scaledCover * 2,
      scaledDepth - scaledCover * 2
    );

    // Draw main reinforcement bars (bottom)
    const scaledBarDia = Math.max(barDia * scale * 0.5, 4);
    const barSpacing = (scaledWidth - scaledCover * 2 - scaledBarDia) / (mainBars - 1);
    const bottomY = offsetY + scaledDepth - scaledCover - scaledBarDia / 2;

    ctx.fillStyle = '#3182ce';
    for (let i = 0; i < mainBars; i++) {
      const barX = offsetX + scaledCover + scaledBarDia / 2 + i * barSpacing;
      ctx.beginPath();
      ctx.arc(barX, bottomY, scaledBarDia, 0, Math.PI * 2);
      ctx.fill();
      
      // Bar highlight
      ctx.fillStyle = '#63b3ed';
      ctx.beginPath();
      ctx.arc(barX - scaledBarDia * 0.2, bottomY - scaledBarDia * 0.2, scaledBarDia * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3182ce';
    }

    // Draw top bars (nominal)
    const topY = offsetY + scaledCover + scaledBarDia / 2;
    ctx.fillStyle = '#48bb78';
    for (let i = 0; i < 2; i++) {
      const barX = offsetX + scaledCover + scaledBarDia / 2 + i * (scaledWidth - scaledCover * 2 - scaledBarDia);
      ctx.beginPath();
      ctx.arc(barX, topY, scaledBarDia * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw dimensions
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';

    // Width dimension
    ctx.fillText(`${width} mm`, offsetX + scaledWidth / 2, offsetY + scaledDepth + 25);
    
    // Depth dimension
    ctx.save();
    ctx.translate(offsetX - 25, offsetY + scaledDepth / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${depth} mm`, 0, 0);
    ctx.restore();

    // Legend
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    
    const legendY = 20;
    const legendX = 10;
    
    // Main bars legend
    ctx.fillStyle = '#3182ce';
    ctx.beginPath();
    ctx.arc(legendX + 5, legendY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`Main: ${mainBars}Ø${barDia}`, legendX + 15, legendY + 4);

    // Stirrups legend
    ctx.strokeStyle = '#f6ad55';
    ctx.lineWidth = 2;
    ctx.strokeRect(legendX, legendY + 15, 10, 10);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`Stirrups: Ø${stirrupDia}`, legendX + 15, legendY + 24);

  }, [width, depth, mainBars, barDia, stirrupDia, cover]);

  return (
    <div className={cn("w-full h-full relative", className)}>
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        Cross-Section View
      </div>
    </div>
  );
};
