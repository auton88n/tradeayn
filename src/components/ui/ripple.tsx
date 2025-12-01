import { useEffect, useState } from 'react';

interface RippleProps {
  x: number;
  y: number;
  size: number;
}

export const useRipple = () => {
  const [ripples, setRipples] = useState<RippleProps[]>([]);

  const createRipple = (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    
    let x: number, y: number;
    
    if ('touches' in event) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    const size = Math.max(rect.width, rect.height);
    const ripple = { x, y, size };

    setRipples((prev) => [...prev, ripple]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 600);
  };

  const RippleContainer = () => (
    <>
      {ripples.map((ripple, index) => (
        <span
          key={index}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </>
  );

  return { createRipple, RippleContainer };
};
