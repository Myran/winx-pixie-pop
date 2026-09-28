/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { EnergyBarConfig } from '../types/game';
import { Zap } from 'lucide-react';

interface EnergyBarProps {
  config: EnergyBarConfig;
  energyRef: React.MutableRefObject<number>;
  lastSwapTimeRef: React.MutableRefObject<number>;
  isDraggingRef?: React.MutableRefObject<boolean>;
  onEnergyDepleted?: () => void;
  isShaking?: boolean;
  isOverdrive?: boolean;
}

export const EnergyBar: React.FC<EnergyBarProps> = ({
  config,
  energyRef,
  lastSwapTimeRef,
  isDraggingRef,
  onEnergyDepleted,
  isShaking = false,
  isOverdrive = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const visualPercentRef = useRef<number>(100);
  const wasDepletedRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(performance.now());
  const onEnergyDepletedRef = useRef(onEnergyDepleted);

  useEffect(() => {
    onEnergyDepletedRef.current = onEnergyDepleted;
  }, [onEnergyDepleted]);

  const {
    enabled = true,
    maxEnergy = 100,
    energyPerSwap = 18,
    dragDrainRate = 10,
    refillRate = 15,
    refillDelay = 350,
    barWidth = 470,
    barHeight = 18,
    barTop = 106,
    barRadius = 9999,
    primaryColor = '#f43f5e',
    secondaryColor = '#a855f7',
    backgroundColor = 'rgba(20, 20, 30, 0.65)',
    borderColor = 'rgba(255, 255, 255, 0.25)',
    borderWidth = 1.5,
    glowEffect = true,
  } = config || {};

  // High-performance, buttery-smooth RAF tweening loop
  useEffect(() => {
    if (!enabled) return;

    let animId: number;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      // Delta time capped at 64ms (avoids huge jump if tab goes to background)
      const dt = Math.min(0.064, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const isDragging = isDraggingRef?.current ?? false;

      // 1. Drain vs Refill logic
      if (isDragging) {
        // Continuous drain while actively holding / dragging a gem
        if (dragDrainRate > 0 && energyRef.current > 0) {
          energyRef.current = Math.max(0, energyRef.current - dragDrainRate * dt);
          if (energyRef.current <= 0) {
            // Energy reached 0 while dragging - drop immediately!
            onEnergyDepletedRef.current?.();
          }
        }
        // Keep refill timer delayed while dragging
        lastSwapTimeRef.current = now;
      } else {
        // Continuous automatic refill after delay only when not dragging
        if (now - lastSwapTimeRef.current >= refillDelay) {
          if (energyRef.current < maxEnergy) {
            energyRef.current = Math.min(maxEnergy, energyRef.current + refillRate * dt);
          }
        }
      }

      // 2. Target percentage from actual game logic energy
      const targetPercent = Math.max(0, Math.min(100, (energyRef.current / maxEnergy) * 100));
      const diff = targetPercent - visualPercentRef.current;

      // 3. Smooth continuous exponential lerp
      if (Math.abs(diff) > 0.005) {
        const lambda = diff < 0 ? 11 : 8.5;
        visualPercentRef.current += diff * (1 - Math.exp(-lambda * dt));
      } else {
        visualPercentRef.current = targetPercent;
      }

      // Ensure that when near full (>= 99.6%), it displays as truly 100% full
      if (visualPercentRef.current >= 99.6) {
        visualPercentRef.current = 100;
      }

      const currentVisual = visualPercentRef.current;

      // 4. Update fill element directly with zero React re-render overhead
      if (fillRef.current) {
        fillRef.current.style.width = `${currentVisual}%`;
      }

      // 5. Update depleted visuals (red alert border and glow)
      const isDepleted = energyRef.current < energyPerSwap;
      if (isDepleted !== wasDepletedRef.current) {
        wasDepletedRef.current = isDepleted;
        if (containerRef.current) {
          containerRef.current.style.borderColor = isDepleted ? '#ef4444' : borderColor;
          containerRef.current.style.boxShadow = isDepleted
            ? '0 0 18px rgba(239, 68, 68, 0.7), 0 2px 8px rgba(0, 0, 0, 0.5)'
            : glowEffect
            ? `0 0 16px ${primaryColor}77, 0 0 24px ${secondaryColor}44, 0 3px 10px rgba(0, 0, 0, 0.4)`
            : '0 2px 8px rgba(0, 0, 0, 0.3)';
        }
        if (fillRef.current) {
          fillRef.current.style.background = isDepleted
            ? 'linear-gradient(90deg, #b91c1c 0%, #ef4444 100%)'
            : `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [
    enabled,
    maxEnergy,
    energyPerSwap,
    dragDrainRate,
    refillRate,
    refillDelay,
    primaryColor,
    secondaryColor,
    borderColor,
    glowEffect,
    energyRef,
    lastSwapTimeRef,
    isDraggingRef,
  ]);

  if (!enabled) return null;

  const glowStyle = isOverdrive
    ? '0 0 24px rgba(6, 182, 212, 0.9), 0 0 35px rgba(59, 130, 246, 0.6), 0 3px 12px rgba(0, 0, 0, 0.5)'
    : glowEffect
    ? `0 0 16px ${primaryColor}77, 0 0 24px ${secondaryColor}44, 0 3px 10px rgba(0, 0, 0, 0.4)`
    : '0 2px 8px rgba(0, 0, 0, 0.3)';

  return (
    <div
      style={{
        position: 'absolute',
        top: `${barTop}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${barWidth}px`,
        zIndex: 38,
        pointerEvents: 'none',
      }}
      className="select-none flex flex-col items-center"
    >
      {/* Overdrive Floating Indicator */}
      {isOverdrive && (
        <div className="mb-1 text-[10px] font-bold tracking-wider uppercase text-cyan-300 flex items-center gap-1 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse">
          <span>⚡ Sirenix Overdrive — Free Swaps Active</span>
        </div>
      )}

      {/* Row containing Energy Icon on the left + the Bar track */}
      <div className="w-full flex items-center gap-2">
        {/* Energy Icon on the left (clean icon without circular background - 25% bigger) */}
        <div
          style={{
            width: `${Math.round((barHeight + 6) * 1.25)}px`,
            height: `${Math.round((barHeight + 6) * 1.25)}px`,
          }}
          className={`shrink-0 flex items-center justify-center transition-all duration-200 ${
            isShaking ? 'animate-energy-shake' : ''
          }`}
          title="Energy"
        >
          <Zap
            style={{
              width: `${Math.round(barHeight * 0.95 * 1.25)}px`,
              height: `${Math.round(barHeight * 0.95 * 1.25)}px`,
            }}
            className={`transition-colors duration-200 ${
              isOverdrive
                ? 'text-cyan-300 fill-cyan-300/80 animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.9)]'
                : 'text-rose-400 fill-rose-400/80 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]'
            }`}
          />
        </div>

        {/* Main Clean Track Container */}
        <div
          ref={containerRef}
          style={{
            height: `${barHeight}px`,
            borderRadius: `${barRadius}px`,
            backgroundColor: backgroundColor,
            border: `${borderWidth}px solid ${isOverdrive ? '#22d3ee' : borderColor}`,
            boxShadow: glowStyle,
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
          }}
          className={`relative flex-1 ${isShaking ? 'animate-energy-shake' : ''} ${
            isOverdrive ? 'animate-pulse' : ''
          }`}
        >
          {/* Subtle background track pattern */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.12) 10px, rgba(255,255,255,0.12) 20px)',
            }}
          />

          {/* Filled Energy Portion: Drains right-to-left */}
          <div
            ref={fillRef}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${visualPercentRef.current}%`,
              borderRadius: `${barRadius}px`,
              background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.6), 0 0 12px ${primaryColor}`,
              willChange: 'width',
            }}
          >
            {/* Glossy highlight over the filled energy */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '45%',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 100%)',
                borderRadius: `${barRadius}px ${barRadius}px 0 0`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
