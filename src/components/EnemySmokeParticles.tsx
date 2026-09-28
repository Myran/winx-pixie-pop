/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { HexInfo } from '../types/game';

export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxRadius: number;
  growth: number;
  angle: number;
  spin: number;
  alpha: number;
  maxAlpha: number;
  age: number;
  lifespan: number;
  colorType: 'black' | 'darkPurple' | 'deepViolet' | 'ember';
}

export interface SmokeBurstItem {
  id: number;
  x?: number;
  y?: number;
  count?: number;
}

export type SmokeBurstTrigger = SmokeBurstItem | SmokeBurstItem[] | null;

interface EnemySmokeParticlesProps {
  clusterHexes?: HexInfo[];
  stageX: number;
  stageY: number;
  rotation: number;
  enabled?: boolean;
  intensity?: number; // 0 to 100
  burstTrigger?: SmokeBurstTrigger;
  baseColor?: string; // Dark purple e.g. #3b0764
  shrinkRatio?: number; // Current enemy gem scale (0 to 1)
  isDefeated?: boolean;
}

export const EnemySmokeParticles: React.FC<EnemySmokeParticlesProps> = ({
  clusterHexes = [],
  stageX,
  stageY,
  rotation,
  enabled = true,
  intensity = 75,
  burstTrigger,
  baseColor = '#3b0764',
  shrinkRatio = 1,
  isDefeated = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<SmokeParticle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const clusterRef = useRef<HexInfo[]>(clusterHexes);

  useEffect(() => {
    clusterRef.current = clusterHexes;
  }, [clusterHexes]);

  // Burst effect when triggered (e.g. enemy gem destroyed or boss hurt/defeated)
  useEffect(() => {
    if (!burstTrigger || !enabled) return;

    const triggers = Array.isArray(burstTrigger) ? burstTrigger : [burstTrigger];

    for (const trig of triggers) {
      if (!trig) continue;
      const count = trig.count || 32;
      const originX = trig.x !== undefined ? trig.x : (clusterHexes[0]?.offsetX ?? 0);
      const originY = trig.y !== undefined ? trig.y : (clusterHexes[0]?.offsetY ?? 0);

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 2.8;

        const isEmber = Math.random() < 0.16;
        const isBlack = !isEmber && Math.random() < 0.44;
        const isDarkPurple = !isEmber && !isBlack && Math.random() < 0.7;

        const colorType: 'black' | 'darkPurple' | 'deepViolet' | 'ember' = isEmber
          ? 'ember'
          : isBlack
          ? 'black'
          : isDarkPurple
          ? 'darkPurple'
          : 'deepViolet';

        particlesRef.current.push({
          x: originX + (Math.random() - 0.5) * 16,
          y: originY + (Math.random() - 0.5) * 16,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.35, // Gentle initial radial blast + upward buoyant billow
          radius: isEmber ? 2.5 + Math.random() * 3.5 : 9 + Math.random() * 12,
          maxRadius: isEmber ? 6 : 32 + Math.random() * 24,
          growth: isEmber ? 0.05 : 0.32 + Math.random() * 0.38,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.035,
          alpha: 0,
          maxAlpha: isEmber ? 0.95 : 0.68 + Math.random() * 0.24,
          age: 0,
          lifespan: isEmber ? 38 + Math.random() * 30 : 54 + Math.random() * 36,
          colorType,
        });
      }
    }
  }, [burstTrigger, enabled, clusterHexes]);

  useEffect(() => {
    if (!enabled) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spawnInterval = Math.max(25, 130 - intensity); // Lower interval = more particles
    const maxParticles = Math.min(120, Math.floor(35 + (intensity / 100) * 65));

    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = Math.min(0.064, (time - lastTime) / 1000);
      lastTime = time;

      // Resize canvas to match display size
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const desiredWidth = Math.round(rect.width * dpr);
      const desiredHeight = Math.round(rect.height * dpr);

      if (canvas.width !== desiredWidth || canvas.height !== desiredHeight) {
        canvas.width = desiredWidth;
        canvas.height = desiredHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Transform to stage space
      ctx.translate(stageX, stageY);
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }

      // 1. Spawning regular continuous ambient smoke particles across the boss 7 hexes if active
      const currentCluster = clusterRef.current;
      if (
        !isDefeated &&
        currentCluster.length > 0 &&
        shrinkRatio > 0.05 &&
        time - lastSpawnRef.current >= spawnInterval &&
        particlesRef.current.length < maxParticles
      ) {
        lastSpawnRef.current = time;

        const center = currentCluster[0];
        // Weight spawning: 40% from center hex, 60% distributed among the 6 outer hexes
        const isCenter = Math.random() < 0.4;
        const chosenHex = isCenter
          ? center
          : currentCluster[Math.floor(Math.random() * currentCluster.length)];

        if (chosenHex) {
          const spread = 22 * shrinkRatio;
          // Interpolate toward center based on shrinkRatio
          const targetX = center.offsetX + (chosenHex.offsetX - center.offsetX) * shrinkRatio;
          const targetY = center.offsetY + (chosenHex.offsetY - center.offsetY) * shrinkRatio;
          const px = targetX + (Math.random() - 0.5) * spread * 2;
          const py = targetY + (Math.random() - 0.5) * spread * 2;

          const isEmber = Math.random() < 0.22;
          const isBlack = !isEmber && Math.random() < 0.45;
          const isDarkPurple = !isEmber && !isBlack && Math.random() < 0.7;

          const colorType: 'black' | 'darkPurple' | 'deepViolet' | 'ember' = isEmber
            ? 'ember'
            : isBlack
            ? 'black'
            : isDarkPurple
            ? 'darkPurple'
            : 'deepViolet';

          particlesRef.current.push({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 0.45,
            vy: -(0.6 + Math.random() * 1.1), // Gentle slow upward billow
            radius: isEmber ? 2.5 + Math.random() * 3.5 : 12 + Math.random() * 14,
            maxRadius: isEmber ? 5 : 36 + Math.random() * 26,
            growth: isEmber ? 0.05 : 0.22 + Math.random() * 0.32,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.025,
            alpha: 0,
            maxAlpha: isEmber ? 0.9 : 0.55 + Math.random() * 0.28,
            age: 0,
            lifespan: isEmber ? 45 + Math.random() * 40 : 75 + Math.random() * 60,
            colorType,
          });
        }
      }

      // 2. Update and draw particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.radius = Math.min(p.maxRadius, p.radius + p.growth);

        // Natural turbulent drag + buoyancy
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 - 0.018;

        // Smooth fade-in then fade-out curve
        const progress = p.age / p.lifespan;
        if (progress < 0.18) {
          p.alpha = (progress / 0.18) * p.maxAlpha;
        } else {
          p.alpha = (1 - (progress - 0.18) / 0.82) * p.maxAlpha;
        }

        if (p.age >= p.lifespan || p.alpha <= 0.005) {
          particles.splice(i, 1);
          continue;
        }

        // Render particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (p.colorType === 'ember') {
          // Sharp glowing violet spark / ember
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(192, 132, 252, ${p.alpha})`;
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 8;
          ctx.fill();
        } else {
          // Voluminous radial gradient smoke puff
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);

          if (p.colorType === 'black') {
            // Ominous pitch-black / charcoal smoke
            grad.addColorStop(0, `rgba(5, 1, 10, ${p.alpha * 0.95})`);
            grad.addColorStop(0.35, `rgba(18, 5, 26, ${p.alpha * 0.7})`);
            grad.addColorStop(0.7, `rgba(28, 8, 40, ${p.alpha * 0.3})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          } else if (p.colorType === 'darkPurple') {
            // Deep abyssal purple smoke
            grad.addColorStop(0, `rgba(46, 2, 73, ${p.alpha * 0.9})`);
            grad.addColorStop(0.4, `rgba(59, 7, 100, ${p.alpha * 0.65})`);
            grad.addColorStop(0.75, `rgba(88, 28, 135, ${p.alpha * 0.25})`);
            grad.addColorStop(1, 'rgba(46, 2, 73, 0)');
          } else {
            // Corrupted dark violet / magenta wisp
            grad.addColorStop(0, `rgba(74, 4, 78, ${p.alpha * 0.85})`);
            grad.addColorStop(0.45, `rgba(112, 26, 117, ${p.alpha * 0.55})`);
            grad.addColorStop(0.8, `rgba(88, 28, 135, ${p.alpha * 0.2})`);
            grad.addColorStop(1, 'rgba(74, 4, 78, 0)');
          }

          ctx.beginPath();
          // Slightly distorted oval shape for realistic billow
          ctx.ellipse(0, 0, p.radius, p.radius * 0.86, 0, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [enabled, stageX, stageY, rotation, intensity, baseColor, isDefeated, shrinkRatio]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 28, // Sits directly over the enemy gems, billowing above them
        width: '100%',
        height: '100%',
      }}
    />
  );
};
