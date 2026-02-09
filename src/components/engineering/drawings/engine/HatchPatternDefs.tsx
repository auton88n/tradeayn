/**
 * SVG <defs> for architectural wall hatch patterns.
 */
import React from 'react';

export const HatchPatternDefs: React.FC = () => (
  <defs>
    {/* Exterior wall: cross-hatch (two sets of diagonal lines) */}
    <pattern id="hatch-exterior-cross" patternUnits="userSpaceOnUse" width={4} height={4}>
      <rect width={4} height={4} fill="white" />
      <line x1={0} y1={0} x2={4} y2={4} stroke="black" strokeWidth={0.3} />
      <line x1={4} y1={0} x2={0} y2={4} stroke="black" strokeWidth={0.3} />
    </pattern>
    {/* Interior wall: single diagonal hatch */}
    <pattern id="hatch-interior" patternUnits="userSpaceOnUse" width={5} height={5}
      patternTransform="rotate(45)">
      <rect width={5} height={5} fill="white" />
      <line x1={0} y1={0} x2={0} y2={5} stroke="black" strokeWidth={0.2} />
    </pattern>
  </defs>
);
