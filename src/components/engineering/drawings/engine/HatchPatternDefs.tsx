/**
 * SVG <defs> for architectural wall hatch patterns.
 */
import React from 'react';

export const HatchPatternDefs: React.FC = () => (
  <defs>
    {/* Exterior wall: cross-hatch (two sets of diagonal lines) */}
    <pattern id="hatch-exterior-cross" patternUnits="userSpaceOnUse" width={2.5} height={2.5}>
      <rect width={2.5} height={2.5} fill="white" />
      <line x1={0} y1={0} x2={2.5} y2={2.5} stroke="black" strokeWidth={0.5} />
      <line x1={2.5} y1={0} x2={0} y2={2.5} stroke="black" strokeWidth={0.5} />
    </pattern>
    {/* Interior wall: single diagonal hatch */}
    <pattern id="hatch-interior" patternUnits="userSpaceOnUse" width={3} height={3}
      patternTransform="rotate(45)">
      <rect width={3} height={3} fill="white" />
      <line x1={0} y1={0} x2={0} y2={3} stroke="black" strokeWidth={0.4} />
    </pattern>
  </defs>
);
