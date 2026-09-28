/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

export interface SwapPulseEvent {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  colorFrom: string;
  colorTo: string;
}

interface SwapEffectProps {
  swapEvent: SwapPulseEvent | null;
  targetHexCoord: { x: number; y: number } | null;
  enabled: boolean;
}

export const SwapEffect: React.FC<SwapEffectProps> = ({
  swapEvent,
  targetHexCoord,
  enabled,
}) => {
  const [activeRipples, setActiveRipples] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      color: string;
    }>
  >([]);

  useEffect(() => {
    if (!enabled || !swapEvent) return;

    const newRipples = [
      {
        id: Math.random(),
        x: swapEvent.fromX,
        y: swapEvent.fromY,
        color: swapEvent.colorFrom,
      },
      {
        id: Math.random(),
        x: swapEvent.toX,
        y: swapEvent.toY,
        color: swapEvent.colorTo,
      },
    ];

    setActiveRipples((prev) => [...prev.slice(-6), ...newRipples]);

    const timer = setTimeout(() => {
      setActiveRipples((prev) => prev.filter((r) => !newRipples.some((nr) => nr.id === r.id)));
    }, 600);

    return () => clearTimeout(timer);
  }, [swapEvent, enabled]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
      {/* Target Hex Magnetic Snap Halo when dragging an item over a valid hex */}
      {targetHexCoord && (
        <div
          style={{
            position: 'absolute',
            left: `${targetHexCoord.x}px`,
            top: `${targetHexCoord.y}px`,
            transform: 'translate(-50%, -50%)',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            border: '2px dashed rgba(255, 255, 255, 0.85)',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.4), inset 0 0 14px rgba(255, 255, 255, 0.2)',
            animation: 'pulse 1.2s infinite ease-in-out',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Swap Pulse Rings */}
      {activeRipples.map((ripple) => (
        <div
          key={ripple.id}
          style={{
            position: 'absolute',
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            transform: 'translate(-50%, -50%)',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            border: `3px solid ${ripple.color}`,
            boxShadow: `0 0 24px ${ripple.color}, inset 0 0 16px ${ripple.color}`,
            animation: 'swapPulseAnim 0.55s ease-out forwards',
          }}
        />
      ))}

      <style>{`
        @keyframes swapPulseAnim {
          0% {
            transform: translate(-50%, -50%) scale(0.4);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
