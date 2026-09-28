/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { TimerBarConfig } from '../types/game';
import { Timer, Snowflake } from 'lucide-react';

interface TimerBarProps {
  config?: TimerBarConfig;
  timeRemainingRef: React.MutableRefObject<number>;
  totalDuration?: number;
  isFrozen?: boolean;
  isPaused?: boolean;
  frozenSecondsRemaining?: number;
  onTimeUp?: () => void;
  barWidth?: number;
  barHeight?: number;
  barTop?: number;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  config,
  timeRemainingRef,
  totalDuration = 60,
  isFrozen = false,
  isPaused = false,
  frozenSecondsRemaining = 0,
  onTimeUp,
  barWidth = 470,
  barHeight = 18,
  barTop = 134,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const visualPercentRef = useRef<number>(100);
  const lastTimeRef = useRef<number>(performance.now());
  const onTimeUpRef = useRef(onTimeUp);
  const hasTriggeredTimeUpRef = useRef(false);
  const isFrozenRef = useRef(isFrozen);
  isFrozenRef.current = isFrozen;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const {
    enabled = true,
    primaryColor = '#06b6d4',
    secondaryColor = '#3b82f6',
    backgroundColor = 'rgba(20, 20, 30, 0.65)',
    borderColor = 'rgba(255, 255, 255, 0.25)',
    borderWidth = 1.5,
    barRadius = 9999,
    glowEffect = true,
  } = config || {};

  // High-performance RAF tweening loop for countdown & frozen time handling
  useEffect(() => {
    if (!enabled) return;

    let animId: number;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.064, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      // When NOT frozen and NOT paused, drain countdown timer
      if (!isFrozenRef.current && !isPausedRef.current) {
        if (timeRemainingRef.current > 0) {
          timeRemainingRef.current = Math.max(0, timeRemainingRef.current - dt);
          if (timeRemainingRef.current <= 0 && !hasTriggeredTimeUpRef.current) {
            hasTriggeredTimeUpRef.current = true;
            onTimeUpRef.current?.();
          }
        }
      }

      // If time is replenished above 0, reset triggered flag
      if (timeRemainingRef.current > 0 && hasTriggeredTimeUpRef.current) {
        hasTriggeredTimeUpRef.current = false;
      }

      const targetPercent = Math.max(
        0,
        Math.min(100, (timeRemainingRef.current / Math.max(1, totalDuration)) * 100)
      );
      const diff = targetPercent - visualPercentRef.current;

      if (Math.abs(diff) > 0.005) {
        const lambda = diff < 0 ? 8 : 10;
        visualPercentRef.current += diff * (1 - Math.exp(-lambda * dt));
      } else {
        visualPercentRef.current = targetPercent;
      }

      // Ensure that when full (>= 99.6%), it displays as truly 100% full without cut-off
      if (visualPercentRef.current >= 99.6) {
        visualPercentRef.current = 100;
      }

      const currentVisual = visualPercentRef.current;

      if (fillRef.current) {
        fillRef.current.style.width = `${currentVisual}%`;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [enabled, isFrozen, isPaused, totalDuration, timeRemainingRef]);

  if (!enabled) return null;

  const isLowTime = timeRemainingRef.current > 0 && timeRemainingRef.current <= 10;

  const glowStyle = isFrozen
    ? '0 0 24px rgba(56, 189, 248, 0.9), 0 0 35px rgba(192, 132, 252, 0.6), 0 3px 12px rgba(0, 0, 0, 0.5)'
    : isLowTime
    ? '0 0 20px rgba(239, 68, 68, 0.8), 0 2px 8px rgba(0, 0, 0, 0.5)'
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
      {/* Frozen Time Floating Badge */}
      {isFrozen && (
        <div className="mb-1 text-[10px] font-bold tracking-wider uppercase text-sky-200 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)] animate-pulse">
          <Snowflake className="w-3 h-3 text-sky-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Lockette’s Time Portal — Time Frozen ({frozenSecondsRemaining}s)</span>
        </div>
      )}

      {/* Row containing Stopwatch Icon on the left + the Bar track */}
      <div className="w-full flex items-center gap-2">
        {/* Stopwatch Icon on the left (clean icon without circular background - 25% bigger) */}
        <div
          style={{
            width: `${Math.round((barHeight + 6) * 1.25)}px`,
            height: `${Math.round((barHeight + 6) * 1.25)}px`,
          }}
          className={`shrink-0 flex items-center justify-center transition-all duration-200 ${
            isLowTime ? 'animate-pulse' : ''
          }`}
          title="Countdown Timer (1 Minute)"
        >
          <Timer
            style={{
              width: `${Math.round(barHeight * 0.95 * 1.25)}px`,
              height: `${Math.round(barHeight * 0.95 * 1.25)}px`,
            }}
            className={`transition-colors duration-200 ${
              isFrozen
                ? 'text-sky-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.9)]'
                : isLowTime
                ? 'text-rose-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]'
                : 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]'
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
            border: `${borderWidth}px solid ${isFrozen ? '#38bdf8' : isLowTime ? '#ef4444' : borderColor}`,
            boxShadow: glowStyle,
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
          }}
          className={`relative flex-1 ${isFrozen ? 'ring-1 ring-sky-300/60' : ''}`}
        >
          {/* Subtle background track pattern */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.12) 10px, rgba(255,255,255,0.12) 20px)',
            }}
          />

          {/* Filled Timer Portion: Drains right-to-left */}
          <div
            ref={fillRef}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${visualPercentRef.current}%`,
              borderRadius: `${barRadius}px`,
              background: isFrozen
                ? 'linear-gradient(90deg, #38bdf8 0%, #c084fc 100%)'
                : isLowTime
                ? 'linear-gradient(90deg, #dc2626 0%, #f97316 100%)'
                : `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.6), 0 0 12px ${
                isFrozen ? '#38bdf8' : primaryColor
              }`,
              willChange: 'width',
            }}
          >
            {/* Glossy highlight over the filled portion */}
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
