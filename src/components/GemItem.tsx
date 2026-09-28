/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GemConfig, GemShape } from '../types/game';
import { Sparkles, Star, CircleDot } from 'lucide-react';
import { getHexagonPath } from '../utils/hexMath';
import { normalizeImgurUrl } from '../utils/currency';

interface GemItemProps {
  id: string;
  name: string;
  type?: string;
  color: string;
  accentColor: string;
  isDragging: boolean;
  isSelected?: boolean;
  config: GemConfig;
  dragScale: number;
  tapScale?: number;
  isImmovableEnemy?: boolean;
  smallEnemySize?: number;
  smallEnemyRotation?: number;
  enemyImageUrl?: string;
  enableEnemyPulsate?: boolean;
  enemyPulseSpeed?: number;
  enemyPulseScale?: number;
  smallEnemyRotate?: boolean;
  smallEnemyRotateSpeed?: number;
  smallEnemyRotateDirection?: 'clockwise' | 'counterclockwise';
}

const ENEMY_GEM_IMAGE_PRIMARY = 'enemy/shadow_core.png';
const ENEMY_GEM_IMAGE_FALLBACK = 'enemy/shadow_core.png';

const AISHA_GEM_IMAGE_PRIMARY = 'gems/aisha.png';
const AISHA_GEM_IMAGE_FALLBACK = 'gems/aisha.png';

const BLOOM_GEM_IMAGE_PRIMARY = 'gems/bloom.png';
const BLOOM_GEM_IMAGE_FALLBACK = 'gems/bloom.png';

const STELLA_GEM_IMAGE_PRIMARY = 'gems/stella.png';
const STELLA_GEM_IMAGE_FALLBACK = 'gems/stella.png';

const FLORA_GEM_IMAGE_PRIMARY = 'gems/flora.png';
const FLORA_GEM_IMAGE_FALLBACK = 'gems/flora.png';

const TECNA_GEM_IMAGE_PRIMARY = 'gems/tecna.png';
const TECNA_GEM_IMAGE_FALLBACK = 'gems/tecna.png';

const MUSA_GEM_IMAGE_PRIMARY = 'gems/musa.png';
const MUSA_GEM_IMAGE_FALLBACK = 'gems/musa.png';

/**
 * Generic Custom Fairy Gem Component.
 * Supports Tecna, Aisha, and any custom image URL provided via config or debug menu.
 */
const CustomFairyGem: React.FC<{
  size: number;
  color: string;
  isDragging: boolean;
  src: string;
  fallbackSrc?: string;
  alt: string;
  rotation?: number;
}> = ({ size, color, isDragging, src, fallbackSrc, alt, rotation = 0 }) => {
  const resolvedSrc = normalizeImgurUrl(src) || src;
  const resolvedFallback = fallbackSrc ? (normalizeImgurUrl(fallbackSrc) || fallbackSrc) : undefined;
  const [imgSrc, setImgSrc] = React.useState(resolvedSrc);

  React.useEffect(() => {
    setImgSrc(normalizeImgurUrl(src) || src);
  }, [src]);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      className="relative flex items-center justify-center pointer-events-none"
    >
      <div
        style={{
          width: '94%',
          height: '94%',
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
          filter: isDragging
            ? `drop-shadow(0 0 16px ${color}) drop-shadow(0 8px 18px rgba(0,0,0,0.7))`
            : `drop-shadow(0 0 10px ${color}aa) drop-shadow(0 4px 10px rgba(0,0,0,0.5))`,
        }}
        className="relative flex items-center justify-center transition-transform duration-200"
      >
        <img
          src={imgSrc}
          alt={alt}
          onError={() => {
            if (resolvedFallback && imgSrc !== resolvedFallback) {
              setImgSrc(resolvedFallback);
            }
          }}
          className="w-full h-full object-contain filter hover:brightness-110 select-none"
          draggable={false}
        />
      </div>
    </div>
  );
};

/**
 * Aisha Droplet Gem Component.
 * Uses the requested image (https://imgur.com/IIrisg2) with fluid teal ambient glow and drag shadows.
 */
const AishaDropletGem: React.FC<{
  size: number;
  color: string;
  isDragging: boolean;
}> = ({ size, color, isDragging }) => (
  <CustomFairyGem
    size={size}
    color={color}
    isDragging={isDragging}
    src={AISHA_GEM_IMAGE_PRIMARY}
    fallbackSrc={AISHA_GEM_IMAGE_FALLBACK}
    alt="Aisha Droplet Gem"
  />
);

/**
 * Enemy Gem Item for Immovable Enemy Gems.
 * Uses the requested image (https://imgur.com/xFN0qeM) rotated so pointy sides point up and down.
 */
const HexagonalEnemyGem: React.FC<{
  size: number;
  isDragging: boolean;
  rotation?: number;
  src?: string;
  enablePulsate?: boolean;
  pulseSpeed?: number;
  pulseScale?: number;
  enableRotate?: boolean;
  rotateSpeed?: number;
  rotateDirection?: 'clockwise' | 'counterclockwise';
}> = ({
  size,
  isDragging,
  rotation = 30,
  src = ENEMY_GEM_IMAGE_PRIMARY,
  enablePulsate = true,
  pulseSpeed = 2.5,
  pulseScale = 1.06,
  enableRotate = true,
  rotateSpeed = 16,
  rotateDirection = 'clockwise',
}) => {
  const [imgSrc, setImgSrc] = React.useState(src);

  React.useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const spinAnimation =
    enableRotate && rotateSpeed > 0
      ? rotateDirection === 'counterclockwise'
        ? `smallEnemySpinCCW ${rotateSpeed}s linear infinite`
        : `smallEnemySpinCW ${rotateSpeed}s linear infinite`
      : undefined;

  const breatheAnimation = enablePulsate
    ? `smallEnemyBreathe ${pulseSpeed}s ease-in-out infinite`
    : undefined;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      className="relative flex items-center justify-center pointer-events-none"
    >
      {/* Outer container for breathing pulsation */}
      <div
        style={{
          width: '100%',
          height: '100%',
          animation: breatheAnimation,
          transformOrigin: '50% 50%',
        }}
        className="relative flex items-center justify-center"
      >
        {/* Inner container for continuous slow rotation */}
        <div
          style={{
            width: '94%',
            height: '94%',
            transform: `rotate(${rotation}deg)`,
            animation: spinAnimation,
            transformOrigin: '50% 50%',
            filter: isDragging
              ? 'drop-shadow(0 0 16px #e879f9) drop-shadow(0 8px 18px rgba(0,0,0,0.85))'
              : 'drop-shadow(0 0 10px rgba(192,132,252,0.8)) drop-shadow(0 5px 12px rgba(0,0,0,0.7))',
          }}
          className="relative flex items-center justify-center"
        >
          <img
            src={imgSrc}
            alt="Enemy Gem"
            onError={() => setImgSrc(ENEMY_GEM_IMAGE_FALLBACK)}
            className="w-full h-full object-contain filter hover:brightness-110 select-none"
            draggable={false}
          />
          {/* Subtle dark aura pulse */}
          <div className="absolute inset-0 rounded-full pointer-events-none bg-purple-600/15 blur-sm animate-pulse" />
        </div>
      </div>

      <style>{`
        @keyframes smallEnemyBreathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(${pulseScale});
          }
        }
        @keyframes smallEnemySpinCW {
          0% {
            transform: rotate(${rotation}deg);
          }
          100% {
            transform: rotate(${rotation + 360}deg);
          }
        }
        @keyframes smallEnemySpinCCW {
          0% {
            transform: rotate(${rotation}deg);
          }
          100% {
            transform: rotate(${rotation - 360}deg);
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Procedural Crystal Gem SVG for all 8 shapes:
 * - diamond (generously rounded squircle diamond, zero pointy tips)
 * - circle (smooth 3D spherical gem)
 * - square (generously rounded pillowy squircle, rx=24)
 * - hexagon (14px filleted corners, zero pointy vertices)
 * - rounded_square (extra-rounded cushion squircle, rx=29)
 * - triangle (curved dome vertices, zero pointy corners)
 * - star (marshmallow puffy star with rounded tips and valleys)
 * - droplet (rounded top apex arch and round bulbous base)
 *
 * ALL inner shapes in the middle have been removed.
 * ALL shapes have generous corner roundness with nothing pointy.
 */
const FacetedCrystalGem: React.FC<{
  shape: GemShape;
  color: string;
  accentColor: string;
  showFacets: boolean;
  isDragging: boolean;
}> = ({ shape, color, accentColor, showFacets, isDragging }) => {
  const gradId = React.useId();

  // Helper rendering for each shape geometry with rounded corners & NO inner shape in the middle
  const renderShapePaths = () => {
    switch (shape) {
      case 'circle': {
        return (
          <>
            <circle
              cx="0"
              cy="0"
              r="44"
              fill={`url(#${gradId}-body)`}
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeOpacity="0.92"
            />
            {/* Top glass gloss sheen */}
            <path
              d="M -34 -14 A 44 44 0 0 1 34 -14 Q 0 -6 -34 -14 Z"
              fill="rgba(255, 255, 255, 0.42)"
            />
            {/* Bottom depth crescent */}
            <path
              d="M -32 20 A 44 44 0 0 0 32 20 Q 0 14 -32 20 Z"
              fill="rgba(0, 0, 0, 0.28)"
            />
            {/* Specular highlights */}
            <ellipse
              cx="-12"
              cy="-14"
              rx="12"
              ry="6.5"
              transform="rotate(-25, -12, -14)"
              fill="rgba(255, 255, 255, 0.75)"
            />
            <circle cx="-15" cy="-16" r="3.2" fill="#ffffff" opacity="0.9" />
          </>
        );
      }

      case 'square': {
        // Generously rounded square (smooth pillowy squircle, rx=24) - NO sharp/pointy corners, NO inner shape
        return (
          <>
            <rect
              x="-40"
              y="-40"
              width="80"
              height="80"
              rx="24"
              ry="24"
              fill={`url(#${gradId}-body)`}
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeOpacity="0.92"
              strokeLinejoin="round"
            />
            {/* Top glass gloss reflection curve */}
            <path
              d="M -30 -38 Q 0 -36 30 -38 Q 36 -28 32 -18 Q 0 -14 -32 -18 Q -36 -28 -30 -38 Z"
              fill="rgba(255, 255, 255, 0.38)"
            />
            {/* Specular corner highlight */}
            <ellipse
              cx="-16"
              cy="-18"
              rx="12"
              ry="6"
              transform="rotate(-25, -16, -18)"
              fill="rgba(255, 255, 255, 0.7)"
            />
            <circle cx="-20" cy="-20" r="3" fill="#ffffff" opacity="0.9" />
            {/* Soft bottom rim shade */}
            <path
              d="M -30 38 Q 0 36 30 38 Q 34 32 28 26 Q 0 28 -28 26 Q -34 32 -30 38 Z"
              fill="rgba(0, 0, 0, 0.22)"
            />
          </>
        );
      }

      case 'rounded_square': {
        // Ultra-rounded cushion squircle (rx=29) - NO sharp corners, NO inner shape
        return (
          <>
            <rect
              x="-41"
              y="-41"
              width="82"
              height="82"
              rx="29"
              ry="29"
              fill={`url(#${gradId}-body)`}
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeOpacity="0.92"
              strokeLinejoin="round"
            />
            {/* Gloss sheen */}
            <path
              d="M -28 -39 Q 0 -37 28 -39 Q 34 -28 30 -18 Q 0 -14 -30 -18 Q -34 -28 -28 -39 Z"
              fill="rgba(255, 255, 255, 0.4)"
            />
            <ellipse
              cx="-15"
              cy="-17"
              rx="12"
              ry="6.5"
              transform="rotate(-20, -15, -17)"
              fill="rgba(255, 255, 255, 0.72)"
            />
            <circle cx="-18" cy="-19" r="3" fill="#ffffff" opacity="0.9" />
            <path
              d="M -28 39 Q 0 37 28 39 Q 32 30 26 24 Q 0 26 -26 24 Q -32 30 -28 39 Z"
              fill="rgba(0, 0, 0, 0.22)"
            />
          </>
        );
      }

      case 'hexagon': {
        // Pointy-topped hexagon with generous 14px filleted corners - completely round vertices, NO inner shape
        const hexPath = getHexagonPath(0, 0, 43, 14);
        return (
          <>
            <path
              d={hexPath}
              fill={`url(#${gradId}-body)`}
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeOpacity="0.92"
              strokeLinejoin="round"
            />
            {/* Top glass gloss sheen */}
            <path
              d="M -22 -32 Q 0 -36 22 -32 Q 30 -18 24 -12 Q 0 -16 -24 -12 Q -30 -18 -22 -32 Z"
              fill="rgba(255, 255, 255, 0.4)"
            />
            {/* Specular gleam */}
            <ellipse
              cx="-12"
              cy="-16"
              rx="11"
              ry="6"
              transform="rotate(-25, -12, -16)"
              fill="rgba(255, 255, 255, 0.72)"
            />
            <circle cx="-15" cy="-18" r="3" fill="#ffffff" opacity="0.9" />
            {/* Bottom depth */}
            <path
              d="M -20 34 Q 0 38 20 34 Q 24 26 18 22 Q 0 24 -18 22 Q -24 26 -20 34 Z"
              fill="rgba(0, 0, 0, 0.25)"
            />
          </>
        );
      }

      case 'triangle': {
        // Equilateral-style rounded triangle with soft curved domes on all 3 vertices - NO pointy corners, NO inner shape
        const triPath =
          'M -12 -28 C -6 -42 6 -42 12 -28 L 32 16 C 40 30 30 38 18 38 L -18 38 C -30 38 -40 30 -32 16 Z';
        return (
          <>
            <path
              d={triPath}
              fill={`url(#${gradId}-body)`}
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeOpacity="0.92"
              strokeLinejoin="round"
            />
            {/* Top apex gloss reflection */}
            <path
              d="M -8 -26 C -3 -36 3 -36 8 -26 L 16 -8 Q 0 -12 -16 -8 Z"
              fill="rgba(255, 255, 255, 0.45)"
            />
            <ellipse
              cx="-6"
              cy="-16"
              rx="9"
              ry="5"
              transform="rotate(-25, -6, -16)"
              fill="rgba(255, 255, 255, 0.7)"
            />
            <circle cx="-7" cy="-18" r="2.8" fill="#ffffff" opacity="0.9" />
            {/* Bottom shade */}
            <path
              d="M -22 36 L 22 36 C 26 36 28 32 24 28 Q 0 28 -24 28 C -28 32 -26 36 -22 36 Z"
              fill="rgba(0, 0, 0, 0.22)"
            />
          </>
        );
      }

      case 'star': {
        // Puffy marshmallow rounded star with smooth rounded tips & valleys - NO pointy tips, NO inner shape
        const starPath =
          'M 0 -41 C 5 -41, 11 -25, 17 -22 C 23 -19, 37 -21, 40 -15 C 43 -9, 32 4, 30 11 C 28 18, 34 32, 28 36 C 22 40, 11 29, 0 29 C -11 29, -22 40, -28 36 C -34 32, -28 18, -30 11 C -32 4, -43 -9, -40 -15 C -37 -21, -23 -19, -17 -22 C -11 -25, -5 -41, 0 -41 Z';
        return (
          <>
            <path
              d={starPath}
              fill={`url(#${gradId}-body)`}
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeOpacity="0.92"
              strokeLinejoin="round"
            />
            {/* Top-left rounded arm highlight */}
            <path
              d="M 0 -38 C 4 -38, 9 -25, 14 -22 Q 0 -12 -14 -22 C -9 -25, -4 -38, 0 -38 Z"
              fill="rgba(255, 255, 255, 0.45)"
            />
            <ellipse
              cx="-8"
              cy="-14"
              rx="9"
              ry="5"
              transform="rotate(-20, -8, -14)"
              fill="rgba(255, 255, 255, 0.72)"
            />
            <circle cx="-10" cy="-16" r="2.8" fill="#ffffff" opacity="0.9" />
          </>
        );
      }

      case 'droplet': {
        // Water droplet gem using Aisha's image: https://imgur.com/IIrisg2
        return (
          <image
            href={AISHA_GEM_IMAGE_PRIMARY}
            x="-46"
            y="-46"
            width="92"
            height="92"
            preserveAspectRatio="xMidYMid meet"
          />
        );
      }

      case 'diamond':
      default: {
        // Rotated rounded squircle diamond (rx=25) - 4 soft pillowy rounded corners, NO sharp points, NO inner shape
        return (
          <g transform="rotate(45)">
            <rect
              x="-33"
              y="-33"
              width="66"
              height="66"
              rx="25"
              ry="25"
              fill={`url(#${gradId}-body)`}
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeOpacity="0.92"
              strokeLinejoin="round"
            />
            {/* Upper-left glossy shine crescent */}
            <ellipse
              cx="-8"
              cy="-12"
              rx="13"
              ry="6.5"
              transform="rotate(-30, -8, -12)"
              fill="rgba(255, 255, 255, 0.7)"
            />
            <circle cx="-13" cy="-14" r="3" fill="#ffffff" opacity="0.9" />
            {/* Bottom depth shading */}
            <path
              d="M -20 22 Q 0 26 20 22 Q 22 28 14 30 Q 0 32 -14 30 Q -22 28 -20 22 Z"
              fill="rgba(0, 0, 0, 0.25)"
            />
          </g>
        );
      }
    }
  };

  return (
    <svg
      viewBox="-50 -50 100 100"
      style={{
        width: '92%',
        height: '92%',
        overflow: 'visible',
        filter: isDragging
          ? `drop-shadow(0 0 16px ${color}) drop-shadow(0 8px 16px rgba(0,0,0,0.65))`
          : `drop-shadow(0 0 8px ${color}88) drop-shadow(0 4px 10px rgba(0,0,0,0.45))`,
      }}
    >
      <defs>
        <radialGradient id={`${gradId}-body`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor={accentColor} />
          <stop offset="70%" stopColor={color} />
          <stop offset="100%" stopColor="#0a0518" />
        </radialGradient>
      </defs>

      {renderShapePaths()}
    </svg>
  );
};

export const GemItem: React.FC<GemItemProps> = ({
  name,
  type,
  color,
  accentColor,
  isDragging,
  isSelected = false,
  config,
  dragScale,
  tapScale = 1.30,
  isImmovableEnemy = false,
  smallEnemySize,
  smallEnemyRotation,
  enemyImageUrl,
  enableEnemyPulsate = true,
  enemyPulseSpeed = 2.5,
  enemyPulseScale = 1.06,
  smallEnemyRotate = true,
  smallEnemyRotateSpeed = 16,
  smallEnemyRotateDirection = 'clockwise',
}) => {
  const { size: defaultSize, theme, glowIntensity, showLabel, showFacets, shapes, sizes } = config;
  const individualSize = type && sizes && sizes[type as keyof typeof sizes] !== undefined ? sizes[type as keyof typeof sizes] : defaultSize;
  const size = isImmovableEnemy ? (smallEnemySize ?? defaultSize) : (individualSize ?? defaultSize);
  const currentScale = isDragging || isSelected ? (tapScale || dragScale) : 1;
  const glowAlpha = (glowIntensity / 100).toFixed(2);

  // Shape resolution for each of the 6 gems individually
  const resolvedShape: GemShape =
    (type && shapes && shapes[type as keyof typeof shapes]) || 'diamond';

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `scale(${currentScale})`,
        transition: isDragging
          ? 'transform 0.08s ease-out'
          : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      className={`relative flex items-center justify-center select-none ${
        isImmovableEnemy ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
      }`}
      title={
        isImmovableEnemy
          ? 'Enemy Gem (Cannot be moved — make an adjacent match to destroy!)'
          : `${name} Gem`
      }
    >
      {/* Outer ambient glow halo */}
      <div
        style={{
          position: 'absolute',
          inset: isImmovableEnemy ? '-10px' : isSelected ? '-14px' : '-8px',
          borderRadius: '50%',
          background: isImmovableEnemy
            ? 'radial-gradient(circle, #9333ea 0%, rgba(59,7,100,0.6) 45%, transparent 70%)'
            : isSelected
            ? `radial-gradient(circle, #ffffff 0%, ${color} 45%, transparent 75%)`
            : `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: isDragging || isSelected ? Math.min(1, Number(glowAlpha) * 1.45) : glowAlpha,
          filter: `blur(${Math.max(5, size * 0.18)}px)`,
          transition: 'all 0.2s ease',
          pointerEvents: 'none',
        }}
        className={isImmovableEnemy || isSelected ? 'animate-pulse' : ''}
      />

      {/* Selected Fairy Ring Indicator */}
      {isSelected && !isImmovableEnemy && (
        <div
          style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: `2px dashed rgba(255, 255, 255, 0.9)`,
            boxShadow: `0 0 14px ${color}, inset 0 0 10px ${color}`,
            pointerEvents: 'none',
          }}
          className="animate-spin"
          style-duration="8s"
        />
      )}

      {/* IMMOVABLE ENEMY GEM: Always pointy-topped with pointy sides pointing up and down */}
      {isImmovableEnemy ? (
        <HexagonalEnemyGem
          size={size}
          isDragging={isDragging}
          rotation={smallEnemyRotation ?? 30}
          src={enemyImageUrl || ENEMY_GEM_IMAGE_PRIMARY}
          enablePulsate={enableEnemyPulsate}
          pulseSpeed={enemyPulseSpeed}
          pulseScale={enemyPulseScale}
          enableRotate={smallEnemyRotate}
          rotateSpeed={smallEnemyRotateSpeed}
          rotateDirection={smallEnemyRotateDirection}
        />
      ) : type === 'bloom' || (type && config.customImages?.bloom && type === 'bloom') ? (
        <CustomFairyGem
          size={size}
          color={color}
          isDragging={isDragging}
          src={config.customImages?.bloom || BLOOM_GEM_IMAGE_PRIMARY}
          fallbackSrc={BLOOM_GEM_IMAGE_FALLBACK}
          alt="Bloom Gem"
        />
      ) : type === 'stella' || (type && config.customImages?.stella && type === 'stella') ? (
        <CustomFairyGem
          size={size}
          color={color}
          isDragging={isDragging}
          src={config.customImages?.stella || STELLA_GEM_IMAGE_PRIMARY}
          fallbackSrc={STELLA_GEM_IMAGE_FALLBACK}
          alt="Stella Gem"
        />
      ) : type === 'flora' || (type && config.customImages?.flora && type === 'flora') ? (
        <CustomFairyGem
          size={size}
          color={color}
          isDragging={isDragging}
          src={config.customImages?.flora || FLORA_GEM_IMAGE_PRIMARY}
          fallbackSrc={FLORA_GEM_IMAGE_FALLBACK}
          alt="Flora Gem"
        />
      ) : type === 'musa' || (type && config.customImages?.musa && type === 'musa') ? (
        <CustomFairyGem
          size={size}
          color={color}
          isDragging={isDragging}
          src={config.customImages?.musa || MUSA_GEM_IMAGE_PRIMARY}
          fallbackSrc={MUSA_GEM_IMAGE_FALLBACK}
          alt="Musa Gem"
        />
      ) : type === 'tecna' || (type && config.customImages?.tecna && type === 'tecna') ? (
        <CustomFairyGem
          size={size}
          color={color}
          isDragging={isDragging}
          src={config.customImages?.tecna || TECNA_GEM_IMAGE_PRIMARY}
          fallbackSrc={TECNA_GEM_IMAGE_FALLBACK}
          alt="Tecna Gem"
        />
      ) : type === 'aisha' || resolvedShape === 'droplet' ? (
        <CustomFairyGem
          size={size}
          color={color}
          isDragging={isDragging}
          src={config.customImages?.aisha || AISHA_GEM_IMAGE_PRIMARY}
          fallbackSrc={AISHA_GEM_IMAGE_FALLBACK}
          alt="Aisha Droplet Gem"
        />
      ) : (type && config.customImages?.[type as keyof typeof config.customImages]) ? (
        <CustomFairyGem
          size={size}
          color={color}
          isDragging={isDragging}
          src={config.customImages[type as keyof typeof config.customImages]!}
          alt={`${name} Gem`}
        />
      ) : (
        <>
          {/* THEME: Crystal Fairy Gem (Default) with Individual Shapes */}
          {theme === 'gem' && (
            <FacetedCrystalGem
              shape={resolvedShape}
              color={color}
              accentColor={accentColor}
              showFacets={showFacets}
              isDragging={isDragging}
            />
          )}

          {/* THEME: Pixie Orb */}
          {theme === 'pixie' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${accentColor} 28%, ${color} 75%, #150020 100%)`,
                boxShadow: isDragging
                  ? `0 14px 28px rgba(0,0,0,0.5), 0 0 24px ${color}`
                  : `0 8px 18px rgba(0,0,0,0.35), 0 0 16px ${color}99`,
                border: '2px solid rgba(255, 255, 255, 0.75)',
              }}
              className="relative flex items-center justify-center overflow-hidden"
            >
              <div
                style={{
                  position: 'absolute',
                  top: '8%',
                  left: '14%',
                  width: '42%',
                  height: '26%',
                  borderRadius: '50%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.05) 100%)',
                  transform: 'rotate(-25deg)',
                }}
              />
              <Sparkles className="w-5 h-5 text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] pointer-events-none" />
            </div>
          )}

          {/* THEME: Winx Star */}
          {theme === 'star' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `radial-gradient(circle at 40% 35%, #ffffff 0%, ${color} 65%, #101010 100%)`,
                boxShadow: `0 8px 20px rgba(0,0,0,0.4), 0 0 18px ${color}`,
                border: '2.5px solid #ffffff',
              }}
              className="flex items-center justify-center"
            >
              <Star className="w-6 h-6 text-white fill-white/85 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </div>
          )}

          {/* THEME: Minimal */}
          {theme === 'minimal' && (
            <div
              style={{
                width: '90%',
                height: '90%',
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 6px 16px rgba(0,0,0,0.4), 0 0 14px ${color}`,
                border: '3px solid #ffffff',
              }}
              className="flex items-center justify-center"
            >
              <CircleDot className="w-5 h-5 text-white" />
            </div>
          )}
        </>
      )}

      {/* Optional Gem Name label */}
      {showLabel && (
        <span
          style={{
            position: 'absolute',
            bottom: '-16px',
            fontSize: '9px',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 700,
            color: isImmovableEnemy ? '#f0abfc' : '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            padding: '1px 6px',
            borderRadius: '9999px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
          }}
        >
          {isImmovableEnemy ? 'Enemy Gem' : name}
        </span>
      )}
    </div>
  );
};
