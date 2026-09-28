/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { playCoinFlySound, playCoinCollectSound } from '../utils/audio';
import { normalizeImgurUrl, DEFAULT_SOFT_CURRENCY_ICON } from '../utils/currency';

export interface CoinFlightBurst {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  coinCount?: number; // default 10
  softCurrencyIcon?: string;
  matchCount?: number;
}

interface ActiveCoinParticle {
  id: string;
  burstId: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  controlX: number;
  controlY: number;
  startTime: number;
  duration: number;
  currentX: number;
  currentY: number;
  scale: number;
  rotation: number;
  opacity: number;
  index: number;
}

interface FloatingTextItem {
  id: number;
  x: number;
  y: number;
  text: string;
  createdAt: number;
}

interface CoinFlightLayerProps {
  bursts: CoinFlightBurst[];
  onCoinCollected: (amount: number) => void;
  onBurstFinished: (burstId: number) => void;
  soundEnabled?: boolean;
}

export const CoinFlightLayer: React.FC<CoinFlightLayerProps> = ({
  bursts,
  onCoinCollected,
  onBurstFinished,
  soundEnabled = true,
}) => {
  const [renderedParticles, setRenderedParticles] = useState<ActiveCoinParticle[]>([]);
  const [renderedTexts, setRenderedTexts] = useState<FloatingTextItem[]>([]);

  const particlesRef = useRef<ActiveCoinParticle[]>([]);
  const floatingTextsRef = useRef<FloatingTextItem[]>([]);
  const processedBurstIdsRef = useRef<Set<number>>(new Set());
  const completedBurstIdsRef = useRef<Set<number>>(new Set());
  const burstsRef = useRef<CoinFlightBurst[]>(bursts);
  const animFrameIdRef = useRef<number | null>(null);

  // Keep latest callbacks in refs to avoid restarting animation loops
  const onCoinCollectedRef = useRef(onCoinCollected);
  const onBurstFinishedRef = useRef(onBurstFinished);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    onCoinCollectedRef.current = onCoinCollected;
    onBurstFinishedRef.current = onBurstFinished;
    soundEnabledRef.current = soundEnabled;
    burstsRef.current = bursts;
  }, [onCoinCollected, onBurstFinished, soundEnabled, bursts]);

  // Handle incoming bursts
  useEffect(() => {
    bursts.forEach((burst) => {
      if (processedBurstIdsRef.current.has(burst.id)) return;
      processedBurstIdsRef.current.add(burst.id);

      playCoinFlySound(soundEnabledRef.current);

      const numCoins = burst.coinCount ?? 10;
      const now = performance.now();
      const newParticles: ActiveCoinParticle[] = [];

      for (let i = 0; i < numCoins; i++) {
        // Initial radial burst spread around the gem
        const angle = (i / numCoins) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const spreadDist = 20 + Math.random() * 28;
        const burstX = burst.startX + Math.cos(angle) * spreadDist;
        const burstY = burst.startY + Math.sin(angle) * spreadDist;

        // Quadratic bezier control point for a graceful upward sweeping arc
        const midX = (burstX + burst.targetX) / 2 + (Math.random() - 0.5) * 60;
        const midY = Math.min(burstY, burst.targetY) - 50 - Math.random() * 60;

        newParticles.push({
          id: `${burst.id}-${i}-${Math.random()}`,
          burstId: burst.id,
          startX: burstX,
          startY: burstY,
          targetX: burst.targetX,
          targetY: burst.targetY,
          controlX: midX,
          controlY: midY,
          startTime: now + i * 42, // Staggered release
          duration: 600 + Math.random() * 70,
          currentX: burstX,
          currentY: burstY,
          scale: 0.2,
          rotation: Math.random() * 360,
          opacity: 0,
          index: i,
        });
      }

      // Add floating +10 reward text badge
      floatingTextsRef.current.push({
        id: burst.id,
        x: burst.startX,
        y: burst.startY - 25,
        text: `+${numCoins} COINS!`,
        createdAt: now,
      });

      particlesRef.current.push(...newParticles);
    });

    // Start animation loop if not running
    if (animFrameIdRef.current === null && (particlesRef.current.length > 0 || floatingTextsRef.current.length > 0)) {
      const tick = () => {
        const now = performance.now();
        let coinsArrivedCount = 0;
        let soundToPlayIdx: number | null = null;
        const completedBurstsToNotify: number[] = [];

        const remainingParticles: ActiveCoinParticle[] = [];

        particlesRef.current.forEach((p) => {
          if (now < p.startTime) {
            remainingParticles.push(p);
            return;
          }

          const elapsed = now - p.startTime;
          const progress = Math.min(1, elapsed / p.duration);

          if (progress >= 1) {
            // Coin arrived at the top coins badge!
            coinsArrivedCount += 1;
            soundToPlayIdx = p.index;
          } else {
            // Ease-in ease-out curve for natural flight acceleration
            const easeProgress =
              progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // Quadratic Bezier interpolation: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
            const t = easeProgress;
            const oneMinusT = 1 - t;
            const curX =
              oneMinusT * oneMinusT * p.startX +
              2 * oneMinusT * t * p.controlX +
              t * t * p.targetX;
            const curY =
              oneMinusT * oneMinusT * p.startY +
              2 * oneMinusT * t * p.controlY +
              t * t * p.targetY;

            // Grow on spawn, then slightly shrink as it enters the coin slot
            const scale =
              progress < 0.15
                ? 0.2 + (progress / 0.15) * 0.95
                : progress > 0.8
                ? 1.15 - ((progress - 0.8) / 0.2) * 0.35
                : 1.15;

            remainingParticles.push({
              ...p,
              currentX: curX,
              currentY: curY,
              scale,
              rotation: p.rotation + 8,
              opacity: progress < 0.05 ? progress / 0.05 : 1,
            });
          }
        });

        particlesRef.current = remainingParticles;

    // Check if any bursts are fully finished
        burstsRef.current.forEach((burst) => {
          const hasRemaining = remainingParticles.some((p) => p.burstId === burst.id);
          if (
            !hasRemaining &&
            processedBurstIdsRef.current.has(burst.id) &&
            !completedBurstIdsRef.current.has(burst.id)
          ) {
            completedBurstIdsRef.current.add(burst.id);
            completedBurstsToNotify.push(burst.id);
          }
        });

        // Periodic cleanup of historical burst ID tracking to prevent unbounded set growth
        if (processedBurstIdsRef.current.size > 150) {
          const activeIds = new Set(burstsRef.current.map((b) => b.id));
          processedBurstIdsRef.current.forEach((id) => {
            if (!activeIds.has(id)) processedBurstIdsRef.current.delete(id);
          });
          completedBurstIdsRef.current.forEach((id) => {
            if (!activeIds.has(id)) completedBurstIdsRef.current.delete(id);
          });
        }

        // Update floating texts
        floatingTextsRef.current = floatingTextsRef.current.filter((t) => now - t.createdAt < 1200);

        // Update local component state for rendering
        setRenderedParticles([...remainingParticles]);
        setRenderedTexts([...floatingTextsRef.current]);

        // Play collection chime
        if (soundToPlayIdx !== null) {
          playCoinCollectSound(soundEnabledRef.current, soundToPlayIdx);
        }

        // Notify parent component OUTSIDE any React state reducer
        if (coinsArrivedCount > 0) {
          onCoinCollectedRef.current(coinsArrivedCount);
        }

        completedBurstsToNotify.forEach((id) => {
          onBurstFinishedRef.current(id);
        });

        // Continue or stop animation
        if (remainingParticles.length > 0 || floatingTextsRef.current.length > 0) {
          animFrameIdRef.current = requestAnimationFrame(tick);
        } else {
          animFrameIdRef.current = null;
        }
      };

      animFrameIdRef.current = requestAnimationFrame(tick);
    }
  }, [bursts]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, []);

  const defaultIcon =
    (bursts.length > 0 && bursts[0].softCurrencyIcon
      ? normalizeImgurUrl(bursts[0].softCurrencyIcon)
      : '') || DEFAULT_SOFT_CURRENCY_ICON;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-50 overflow-hidden">
      {/* Floating "+10 Coins" text labels */}
      {renderedTexts.map((item) => {
        const age = (performance.now() - item.createdAt) / 1200;
        const translateY = -40 * age;
        const opacity = age < 0.8 ? 1 : 1 - (age - 0.8) / 0.2;
        const scale = age < 0.15 ? 0.6 + (age / 0.15) * 0.5 : 1.1;

        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: `${item.x}px`,
              top: `${item.y}px`,
              transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
              opacity,
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/80 border border-amber-400/80 shadow-[0_0_18px_rgba(251,191,36,0.8)] text-amber-300 font-black text-xs tracking-wider"
          >
            <span>{item.text}</span>
          </div>
        );
      })}

      {/* Animated Flying Coins */}
      {renderedParticles.map((p) => {
        if (p.opacity <= 0) return null;

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.currentX}px`,
              top: `${p.currentY}px`,
              transform: `translate(-50%, -50%) scale(${p.scale}) rotate(${p.rotation}deg)`,
              opacity: p.opacity,
            }}
            className="w-6 h-6 flex items-center justify-center filter drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
          >
            <img
              src={defaultIcon}
              alt="Coin"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
};
