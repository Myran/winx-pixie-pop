/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HexInfo, EnemyGemConfig } from '../types/game';
import { getHexagonPoints } from '../utils/hexMath';
import { normalizeImgurUrl } from '../utils/currency';

interface EnemyGemItemProps {
  centerHex: HexInfo;
  hexRadius: number;
  config: EnemyGemConfig;
  currentHp: number;
  maxHp: number;
  isHurt?: boolean;
  isDefeated?: boolean;
  isDeflecting?: boolean;
  onEnemyClick?: () => void;
}

export const EnemyGemItem: React.FC<EnemyGemItemProps> = ({
  centerHex,
  hexRadius,
  config,
  currentHp,
  maxHp,
  isHurt = false,
  isDefeated = false,
  isDeflecting = false,
  onEnemyClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const {
    color = '#3b0764',
    accentColor = '#0a0014',
    glowColor = '#581c87',
    pulseSpeed = 2.5,
    enablePulsate = true,
    pulseScale = 1.06,
    baseScale = 1.0,
    shakeIntensity = 12,
    showHealthBar = true,
    name = 'Shadow Core',
  } = config;

  // Calculate current shrink factor:
  // When at full HP (4/4) -> ratio is 1.0
  // When damaged: e.g. 3/4 -> 0.78, 2/4 -> 0.58, 1/4 -> 0.38, 0 -> 0 (defeated)
  const hpRatio = Math.max(0, Math.min(1, currentHp / Math.max(1, maxHp)));
  const shrinkScale = isDefeated
    ? 0
    : hpRatio > 0
    ? (0.28 + hpRatio * 0.72) * baseScale
    : 0;

  const [enemyImgUrl, setEnemyImgUrl] = useState(
    normalizeImgurUrl(config.imageUrl) || '/enemy/shadow_core.png'
  );
  useEffect(() => {
    if (config.imageUrl) {
      setEnemyImgUrl(normalizeImgurUrl(config.imageUrl) || '/enemy/shadow_core.png');
    }
  }, [config.imageUrl]);
  const rotation = config.bigEnemyRotation ?? 90;
  const healthBarOffsetY = config.healthBarOffsetY ?? 5;

  // Outer gem radius (spans the 7 hexes when full size)
  const outerRadius = hexRadius * 2.15;
  const innerTableRadius = outerRadius * 0.62;
  const coreEyeRadius = hexRadius * 0.34;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEnemyClick?.();
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${centerHex.offsetX}px`,
        top: `${centerHex.offsetY}px`,
        pointerEvents: isDefeated ? 'none' : 'auto',
        cursor: 'pointer',
        zIndex: 26,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${name} (${currentHp}/${maxHp} HP) - Make adjacent matches to damage!`}
    >
      {/* Visual Container with Scale, 90deg Rotation & Hurt Shake Transitions */}
      <div
        style={{
          transform: `scale(${shrinkScale}) rotate(${rotation}deg)`,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1)',
          transformOrigin: '0 0',
        }}
        className={isHurt ? 'animate-enemy-hurt' : ''}
      >
        <div
          style={{
            transformOrigin: '0 0',
            animation:
              enablePulsate && !isDefeated && !isHurt
                ? `enemyBossBreathe ${pulseSpeed}s ease-in-out infinite`
                : undefined,
          }}
        >
          <svg
          style={{
            position: 'absolute',
            left: '-220px',
            top: '-220px',
            width: '440px',
            height: '440px',
            overflow: 'visible',
            pointerEvents: 'none',
            filter: isHurt
              ? 'brightness(2.2) drop-shadow(0 0 24px #e879f9) drop-shadow(0 0 35px #a855f7)'
              : undefined,
          }}
          viewBox="-220 -220 440 440"
        >
          <defs>
            {/* Dark Purple Ambient Aura Glow */}
            <filter id="single-enemy-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.42   0 0 0 0 0.08   0 0 0 0 0.68   0 0 0 1.2 0"
                result="coloredBlur"
              />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Faceted Outer Bevel Radial Gradient */}
            <radialGradient id="single-enemy-outer-crystal" cx="42%" cy="36%" r="68%">
              <stop offset="0%" stopColor="#7e22ce" />
              <stop offset="28%" stopColor={color} />
              <stop offset="70%" stopColor="#24033b" />
              <stop offset="100%" stopColor={accentColor} />
            </radialGradient>

            {/* Inner Dark Table Face Gradient */}
            <radialGradient id="single-enemy-inner-table" cx="46%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#4c056d" />
              <stop offset="40%" stopColor="#250238" />
              <stop offset="85%" stopColor="#10001a" />
              <stop offset="100%" stopColor="#05000a" />
            </radialGradient>

            {/* Menacing Corrupted Core Heart Gradient */}
            <radialGradient id="single-enemy-heart" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="20%" stopColor="#c084fc" />
              <stop offset="55%" stopColor="#7e22ce" />
              <stop offset="85%" stopColor={color} />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>

            {/* Specular Crystal Glint Gradient */}
            <linearGradient id="single-enemy-specular" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#e9d5ff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Deflection Shield Ping Gradient */}
            <radialGradient id="single-enemy-shield" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e879f9" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3b0764" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. THE 1 GRAND MONOLITHIC ENEMY GEM (Using requested image) */}
          <g id="single-enemy-monolithic-gem">
            {/* Enemy Gem Image replacing basic polygon shape */}
            <image
              href={enemyImgUrl}
              x={-outerRadius}
              y={-outerRadius}
              width={outerRadius * 2}
              height={outerRadius * 2}
              preserveAspectRatio="xMidYMid meet"
              filter="url(#single-enemy-glow)"
              onError={() => setEnemyImgUrl('/enemy/shadow_core.png')}
            />

            {/* Deflection / hover outer aura rim */}
            {(isDeflecting || isHovered) && (
              <polygon
                points={getHexagonPoints(0, 0, outerRadius)}
                fill="none"
                stroke={isDeflecting ? '#f5d0fe' : '#c084fc'}
                strokeWidth={isHovered ? 4 : 3}
                filter="url(#single-enemy-glow)"
                className="transition-colors duration-200"
              />
            )}

            {/* 4. Elegant Glass Specular Reflection Sheen */}
            <polygon
              points={`
                ${-outerRadius * 0.45},${-outerRadius * 0.68}
                ${outerRadius * 0.18},${-outerRadius * 0.72}
                ${-outerRadius * 0.08},${-outerRadius * 0.12}
                ${-outerRadius * 0.58},${-outerRadius * 0.18}
              `}
              fill="url(#single-enemy-specular)"
            />
          </g>

          {/* 5. Deflection Shield Flare Shockwave */}
          {isDeflecting && (
            <circle
              cx="0"
              cy="0"
              r={outerRadius * 1.25}
              fill="url(#single-enemy-shield)"
              className="animate-ping"
              style={{ animationDuration: '0.35s' }}
            />
          )}
        </svg>
        </div>
      </div>

      {/* 6. Sleek Dark-Fantasy Boss Continuous Health Progress Bar */}
      {showHealthBar && !isDefeated && currentHp > 0 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `${-outerRadius * 0.866 * shrinkScale - 16 + healthBarOffsetY}px`,
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
          className="flex flex-col items-center gap-1 transition-all duration-300 z-30"
        >
          {/* Continuous Health Progress Bar */}
          <div
            style={{
              width: `${config.healthBarWidth ?? 140}px`,
              height: `${config.healthBarHeight ?? 16}px`,
            }}
            className="relative flex items-center rounded-full bg-black/90 border border-purple-500/50 shadow-[0_2px_12px_rgba(0,0,0,0.85),0_0_12px_rgba(168,85,247,0.35)] backdrop-blur-md p-[2px] overflow-hidden"
          >
            {/* Progress Fill */}
            <div
              style={{
                width: `${Math.max(0, Math.min(100, (currentHp / Math.max(1, maxHp)) * 100))}%`,
                background: `linear-gradient(90deg, #7e22ce 0%, ${config.healthBarColor || '#c084fc'} 55%, #f472b6 100%)`,
                boxShadow: '0 0 10px rgba(192, 132, 252, 0.85)',
              }}
              className="h-full rounded-full transition-all duration-300 relative overflow-hidden"
            >
              {/* Glossy Top Sheen Reflection */}
              <div className="absolute inset-x-0 top-0 h-[45%] bg-white/30 rounded-t-full pointer-events-none" />
            </div>

            {/* Numeric HP Counter Overlay */}
            {config.showHealthText !== false && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[9.5px] font-black tracking-wider text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tabular-nums">
                  {currentHp} / {maxHp}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hurt shake & Breathing pulse animation styles */}
      <style>{`
        @keyframes enemyBossBreathe {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 10px rgba(147, 51, 234, 0.45));
          }
          50% {
            transform: scale(${pulseScale});
            filter: drop-shadow(0 0 24px rgba(192, 132, 252, 0.85)) drop-shadow(0 0 38px rgba(147, 51, 234, 0.65));
          }
        }
        @keyframes enemyHurtShake {
          0% { transform: scale(${shrinkScale}) rotate(${rotation}deg) translate(0, 0); }
          20% { transform: scale(${shrinkScale}) rotate(${rotation}deg) translate(-${shakeIntensity}px, ${shakeIntensity * 0.6}px); }
          40% { transform: scale(${shrinkScale}) rotate(${rotation}deg) translate(${shakeIntensity}px, -${shakeIntensity * 0.6}px); }
          60% { transform: scale(${shrinkScale}) rotate(${rotation}deg) translate(-${shakeIntensity * 0.6}px, -${shakeIntensity * 0.4}px); }
          80% { transform: scale(${shrinkScale}) rotate(${rotation}deg) translate(${shakeIntensity * 0.4}px, ${shakeIntensity * 0.3}px); }
          100% { transform: scale(${shrinkScale}) rotate(${rotation}deg) translate(0, 0); }
        }
        .animate-enemy-hurt {
          animation: enemyHurtShake ${config.shakeDuration || 400}ms ease-in-out;
        }
      `}</style>
    </div>
  );
};
