/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

export interface SparkleEvent {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
}

interface PixieSparklesProps {
  burst: SparkleEvent | null;
  enabled: boolean;
}

export const PixieSparkles: React.FC<PixieSparklesProps> = ({ burst, enabled }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!enabled || !burst) return;

    // Spawn 14 magical pixie particles radiating outward
    const newParticles: Particle[] = [];
    const count = 14;
    const baseColor = burst.color || '#ff60b0';

    for (let i = 0; i < count; i++) {
      const angle = (i * (360 / count) + Math.random() * 20) * (Math.PI / 180);
      const speed = 2.5 + Math.random() * 4.5;
      newParticles.push({
        id: Math.random(),
        x: burst.x,
        y: burst.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 7,
        color: i % 2 === 0 ? baseColor : '#ffffff',
        alpha: 1,
        rotation: Math.random() * 360,
      });
    }

    setParticles((prev) => [...prev.slice(-20), ...newParticles]);
  }, [burst, enabled]);

  // Particle physics loop
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * 0.94,
            vy: p.vy * 0.94 - 0.2, // slight float upward like pixie dust
            alpha: p.alpha - 0.045,
            size: p.size * 0.96,
            rotation: p.rotation + 8,
          }))
          .filter((p) => p.alpha > 0.05 && p.size > 1)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  if (!enabled || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
            opacity: p.alpha,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size}px #ffffff`,
            borderRadius: '2px',
            clipPath:
              'polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)',
          }}
        />
      ))}
    </div>
  );
};
