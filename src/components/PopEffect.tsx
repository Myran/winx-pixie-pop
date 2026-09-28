/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

export interface PopEvent {
  id: number;
  x: number;
  y: number;
  color: string;
  count?: number; // total gems popped in this chain
  isLastInChain?: boolean;
}

interface ShockwaveRing {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  maxSize: number;
  opacity: number;
}

interface PopParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
}

interface FloatingBadge {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
  offsetY: number;
}

interface PopEffectProps {
  popEvents: PopEvent[];
  enabled: boolean;
}

export const PopEffect: React.FC<PopEffectProps> = ({ popEvents, enabled }) => {
  const [rings, setRings] = useState<ShockwaveRing[]>([]);
  const [particles, setParticles] = useState<PopParticle[]>([]);
  const [badges, setBadges] = useState<FloatingBadge[]>([]);

  // Spawn effects when new popEvents arrive
  useEffect(() => {
    if (!enabled || popEvents.length === 0) return;

    // Process the newest event
    const newest = popEvents[popEvents.length - 1];
    if (!newest) return;

    // 1. Shockwave ring
    const newRing: ShockwaveRing = {
      id: newest.id + Math.random(),
      x: newest.x,
      y: newest.y,
      color: newest.color,
      size: 16,
      maxSize: 64,
      opacity: 0.9,
    };

    // 2. High-energy sparkle burst
    const newParticles: PopParticle[] = [];
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i * (360 / particleCount) + Math.random() * 20) * (Math.PI / 180);
      const speed = 2.5 + Math.random() * 4.0;
      newParticles.push({
        id: Math.random(),
        x: newest.x,
        y: newest.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        color: i % 2 === 0 ? newest.color : '#ffffff',
        opacity: 1,
        rotation: Math.random() * 360,
      });
    }

    setRings((prev) => [...prev.slice(-15), newRing]);
    setParticles((prev) => [...prev.slice(-30), ...newParticles]);

    // 3. Floating score badge if marked as last in chain
    if (newest.isLastInChain && newest.count && newest.count > 1) {
      const newBadge: FloatingBadge = {
        id: newest.id,
        x: newest.x,
        y: newest.y - 12,
        text: `+${newest.count} POP!`,
        color: newest.color,
        opacity: 1,
        offsetY: 0,
      };
      setBadges((prev) => [...prev.slice(-4), newBadge]);
    }
  }, [popEvents, enabled]);

  // Animation frame loop
  useEffect(() => {
    if (rings.length === 0 && particles.length === 0 && badges.length === 0) return;

    const interval = setInterval(() => {
      // Update rings
      setRings((prev) =>
        prev
          .map((r) => ({
            ...r,
            size: r.size + (r.maxSize - r.size) * 0.25 + 1.5,
            opacity: r.opacity - 0.055,
          }))
          .filter((r) => r.opacity > 0.05 && r.size < r.maxSize)
      );

      // Update particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * 0.93,
            vy: p.vy * 0.93 - 0.15,
            opacity: p.opacity - 0.05,
            size: p.size * 0.96,
            rotation: p.rotation + 10,
          }))
          .filter((p) => p.opacity > 0.05 && p.size > 1)
      );

      // Update badges
      setBadges((prev) =>
        prev
          .map((b) => ({
            ...b,
            offsetY: b.offsetY - 1.2,
            opacity: b.opacity - 0.035,
          }))
          .filter((b) => b.opacity > 0.05)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [rings.length, particles.length, badges.length]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {/* Expanding Shockwave Rings */}
      {rings.map((r) => (
        <div
          key={r.id}
          style={{
            position: 'absolute',
            left: `${r.x}px`,
            top: `${r.y}px`,
            width: `${r.size * 2}px`,
            height: `${r.size * 2}px`,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: `2px solid ${r.color}`,
            boxShadow: `0 0 14px ${r.color}, inset 0 0 8px ${r.color}`,
            opacity: r.opacity,
          }}
        />
      ))}

      {/* Bursting Sparkling Stars */}
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
            opacity: p.opacity,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2.5}px ${p.color}, 0 0 ${p.size}px #ffffff`,
            borderRadius: '2px',
            clipPath:
              'polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)',
          }}
        />
      ))}

      {/* Floating Match Badge */}
      {badges.map((b) => (
        <div
          key={b.id}
          style={{
            position: 'absolute',
            left: `${b.x}px`,
            top: `${b.y + b.offsetY}px`,
            transform: 'translate(-50%, -50%)',
            opacity: b.opacity,
            color: '#ffffff',
            backgroundColor: 'rgba(15, 15, 25, 0.85)',
            border: `1.5px solid ${b.color}`,
            boxShadow: `0 0 16px ${b.color}99, 0 4px 10px rgba(0,0,0,0.5)`,
            borderRadius: '9999px',
            padding: '2px 10px',
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          {b.text}
        </div>
      ))}
    </div>
  );
};
