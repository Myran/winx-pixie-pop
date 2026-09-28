/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Hourglass, Heart, Flower2, Music, Cpu, Moon, Plus } from 'lucide-react';
import { PowerupType, PowerupConfig } from '../types/game';

interface PowerupsDockProps {
  activeLevelPowerups: PowerupType[];
  charges: Record<PowerupType, number>;
  activePowerup: PowerupType | null;
  onSelectPowerup: (type: PowerupType) => void;
  onReplenishCharges: () => void;
  isOverdrive: boolean;
  overdriveRemaining: number;
  isTimeFrozen?: boolean;
  frozenTimeRemaining?: number;
  config?: PowerupConfig;
}

export const PowerupsDock: React.FC<PowerupsDockProps> = ({
  activeLevelPowerups,
  charges,
  activePowerup,
  onSelectPowerup,
  onReplenishCharges,
  isOverdrive,
  overdriveRemaining,
  isTimeFrozen = false,
  frozenTimeRemaining = 0,
  config,
}) => {
  if (config?.enabled === false) return null;

  const bottomOffset = config?.bottomOffset ?? 130;
  const dockWidth = config?.dockWidth ?? 540;
  const cardHeight = config?.cardHeight ?? 195;
  const cardGap = config?.cardGap ?? 14;
  const cardRadius = config?.cardRadius ?? 24;
  const iconSize = config?.iconSize ?? 64;
  const glowAlpha = ((config?.glowIntensity ?? 70) / 100).toFixed(2);
  const allPowerupDefinitions: Record<
    PowerupType,
    {
      id: PowerupType;
      nameLine1: string;
      nameLine2: string;
      subtitle: string;
      icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
      paletteLabel: string;
      cardGradient: string;
      cardBorder: string;
      cardGlow: string;
      activeBorderGlow: string;
      iconGradient: string;
      accentTextColor: string;
      description: string;
    }
  > = {
    lockette: {
      id: 'lockette',
      nameLine1: 'Lockette’s',
      nameLine2: 'Time Portal',
      subtitle: isTimeFrozen ? `${frozenTimeRemaining}s Frozen` : 'Time Freeze',
      icon: Hourglass,
      paletteLabel: 'Light blue / lilac / pink',
      cardGradient: 'from-[#38bdf8]/15 via-[#c084fc]/12 to-[#f472b6]/15',
      cardBorder: 'border-[#38bdf8]/35 hover:border-[#c084fc]/80',
      cardGlow: 'hover:shadow-[0_0_28px_rgba(56,189,248,0.35)]',
      activeBorderGlow: 'border-[#38bdf8] ring-2 ring-[#c084fc] shadow-[0_0_32px_rgba(56,189,248,0.65)] animate-pulse',
      iconGradient: 'from-[#38bdf8] via-[#c084fc] to-[#f472b6]',
      accentTextColor: 'text-[#7dd3fc]',
      description: 'Lockette opens a mystical Time Portal, freezing time for 5 seconds!',
    },
    amore: {
      id: 'amore',
      nameLine1: 'Amore’s',
      nameLine2: 'Heart Pop',
      subtitle: 'Love Charm',
      icon: Heart,
      paletteLabel: 'Pink / green',
      cardGradient: 'from-[#ec4899]/15 via-[#f472b6]/10 to-[#22c55e]/15',
      cardBorder: 'border-[#ec4899]/35 hover:border-[#22c55e]/80',
      cardGlow: 'hover:shadow-[0_0_28px_rgba(236,72,153,0.35)]',
      activeBorderGlow: 'border-[#ec4899] ring-2 ring-[#22c55e] shadow-[0_0_32px_rgba(236,72,153,0.65)]',
      iconGradient: 'from-[#ec4899] via-[#f472b6] to-[#22c55e]',
      accentTextColor: 'text-[#f472b6]',
      description: 'Amore showers love charm across the stage, popping romance gems and healing energy!',
    },
    chatta: {
      id: 'chatta',
      nameLine1: 'Chatta’s',
      nameLine2: 'Bloom Pop',
      subtitle: 'Bloom Blast',
      icon: Flower2,
      paletteLabel: 'Green / blue',
      cardGradient: 'from-[#10b981]/15 via-[#34d399]/10 to-[#0284c7]/15',
      cardBorder: 'border-[#10b981]/35 hover:border-[#0284c7]/80',
      cardGlow: 'hover:shadow-[0_0_28px_rgba(16,185,129,0.35)]',
      activeBorderGlow: 'border-[#10b981] ring-2 ring-[#0284c7] shadow-[0_0_32px_rgba(16,185,129,0.65)] animate-pulse',
      iconGradient: 'from-[#10b981] via-[#34d399] to-[#0284c7]',
      accentTextColor: 'text-[#6ee7b7]',
      description: 'Chatta detonates an explosive 7-hex floral shockwave, dealing 2 massive hits to boss!',
    },
    tune: {
      id: 'tune',
      nameLine1: 'Tune’s',
      nameLine2: 'Harmony Pop',
      subtitle: 'Melodic Chord',
      icon: Music,
      paletteLabel: 'Blue / gray / violet',
      cardGradient: 'from-[#3b82f6]/15 via-[#94a3b8]/10 to-[#8b5cf6]/15',
      cardBorder: 'border-[#8b5cf6]/35 hover:border-[#3b82f6]/80',
      cardGlow: 'hover:shadow-[0_0_28px_rgba(139,92,246,0.35)]',
      activeBorderGlow: 'border-[#8b5cf6] ring-2 ring-[#3b82f6] shadow-[0_0_32px_rgba(139,92,246,0.65)]',
      iconGradient: 'from-[#3b82f6] via-[#94a3b8] to-[#8b5cf6]',
      accentTextColor: 'text-[#a78bfa]',
      description: 'Tune sounds a harmonic chord, vaporizing all gems of the most common fairy type on stage!',
    },
    digit: {
      id: 'digit',
      nameLine1: 'Digit’s',
      nameLine2: 'Tech Pop',
      subtitle: isOverdrive ? `${overdriveRemaining}s Overdrive` : 'Matrix Surge',
      icon: Cpu,
      paletteLabel: 'Purple / teal',
      cardGradient: 'from-[#9333ea]/15 via-[#a855f7]/10 to-[#14b8a6]/15',
      cardBorder: 'border-[#14b8a6]/35 hover:border-[#9333ea]/80',
      cardGlow: 'hover:shadow-[0_0_28px_rgba(20,184,166,0.35)]',
      activeBorderGlow: 'border-[#14b8a6] ring-2 ring-[#9333ea] shadow-[0_0_32px_rgba(20,184,166,0.65)] animate-pulse',
      iconGradient: 'from-[#9333ea] via-[#a855f7] to-[#14b8a6]',
      accentTextColor: 'text-[#5eead4]',
      description: 'Digit overclocks the energy matrix: 100% full refill and 8s of unlimited free swaps!',
    },
    piff: {
      id: 'piff',
      nameLine1: 'Piff’s',
      nameLine2: 'Dream Pop',
      subtitle: 'Sweet Slumber',
      icon: Moon,
      paletteLabel: 'Pink / cream',
      cardGradient: 'from-[#f472b6]/15 via-[#fb7185]/10 to-[#fef08a]/15',
      cardBorder: 'border-[#f472b6]/35 hover:border-[#fef08a]/80',
      cardGlow: 'hover:shadow-[0_0_28px_rgba(244,114,182,0.35)]',
      activeBorderGlow: 'border-[#f472b6] ring-2 ring-[#fef08a] shadow-[0_0_32px_rgba(244,114,182,0.65)]',
      iconGradient: 'from-[#f472b6] via-[#fb7185] to-[#fde047]',
      accentTextColor: 'text-[#fef08a]',
      description: 'Piff sprinkles sweet dream dust, dealing 2 hits to boss and clearing sleepy dark hexes!',
    },
  };

  const currentLevelCards = activeLevelPowerups.map((id) => allPowerupDefinitions[id]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: `${bottomOffset}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${dockWidth}px`,
        zIndex: 42,
      }}
      className="flex flex-col items-center select-none pointer-events-auto"
    >
      {/* Targeting Banner for Chatta's Bloom Pop */}
      {activePowerup === 'chatta' && (
        <div className="mb-2 px-4 py-1.5 rounded-full bg-emerald-950/95 border border-emerald-400/70 text-emerald-100 text-xs font-medium tracking-wide flex items-center gap-2 backdrop-blur-md shadow-[0_0_25px_rgba(16,185,129,0.7)] animate-bounce">
          <Flower2 className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
          <span>Tap any hexagon or boss to detonate Chatta’s Bloom Pop!</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectPowerup('chatta');
            }}
            className="ml-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-800/80 hover:bg-emerald-700 text-white cursor-pointer active:scale-95"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 3 Tall Powerup Cards Grid (configurable height, gap, radius) */}
      <div
        className="grid grid-cols-3 w-full"
        style={{ gap: `${cardGap}px` }}
      >
        {currentLevelCards.map((powerup) => {
          const count = charges[powerup.id] ?? 0;
          const isArmed = activePowerup === powerup.id;
          const isDigitOverdrive = powerup.id === 'digit' && isOverdrive;
          const isLocketteFrozen = powerup.id === 'lockette' && isTimeFrozen;
          const Icon = powerup.icon;
          const isAvailable = count > 0 || isDigitOverdrive || isLocketteFrozen;

          return (
            <div
              key={powerup.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPowerup(powerup.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPowerup(powerup.id);
                }
              }}
              title={powerup.description}
              style={{
                height: `${cardHeight}px`,
                borderRadius: `${cardRadius}px`,
                boxShadow: isArmed || isDigitOverdrive || isLocketteFrozen
                  ? `0 0 30px rgba(255,255,255,${glowAlpha})`
                  : undefined,
              }}
              className={`relative group flex flex-col items-center justify-between p-3.5 transition-all duration-200 cursor-pointer overflow-hidden backdrop-blur-md border ${
                isArmed || isDigitOverdrive || isLocketteFrozen
                  ? powerup.activeBorderGlow
                  : `${powerup.cardBorder} ${powerup.cardGlow} bg-neutral-950/65 hover:bg-neutral-950/85`
              } active:scale-95`}
            >
              {/* Colored ambient glow inside card based on signature pixie colors */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${powerup.cardGradient} transition-opacity duration-300 pointer-events-none ${
                  isArmed || isDigitOverdrive || isLocketteFrozen
                    ? 'opacity-80'
                    : 'opacity-40 group-hover:opacity-70'
                }`}
              />

              {/* Top Row: Charges Badge */}
              <div className="relative w-full flex items-center justify-end z-10">
                {isDigitOverdrive ? (
                  <span className="px-2 py-0.5 rounded-full bg-teal-400 text-neutral-950 font-bold text-[10px] tabular-nums tracking-tight animate-pulse shadow-sm">
                    {overdriveRemaining}s
                  </span>
                ) : isLocketteFrozen ? (
                  <span className="px-2 py-0.5 rounded-full bg-sky-400 text-neutral-950 font-bold text-[10px] tabular-nums tracking-tight animate-pulse shadow-sm">
                    {frozenTimeRemaining}s
                  </span>
                ) : count > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums shadow-sm border border-white/20 bg-neutral-900/80 text-white/90">
                    {count}
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReplenishCharges();
                    }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white/90 bg-neutral-800/90 hover:bg-neutral-700 border border-white/20 cursor-pointer flex items-center gap-0.5"
                    title="Tap to refill charges"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>3</span>
                  </button>
                )}
              </div>

              {/* Center: Large Vibrant Glowing Emblem */}
              <div
                style={{
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                }}
                className={`relative z-10 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
                  isAvailable
                    ? `bg-gradient-to-br ${powerup.iconGradient} shadow-[0_4px_20px_rgba(255,255,255,0.25)] group-hover:scale-110`
                    : 'bg-neutral-800/80 text-neutral-500 opacity-60'
                }`}
              >
                <Icon
                  style={{
                    width: `${Math.round(iconSize * 0.5)}px`,
                    height: `${Math.round(iconSize * 0.5)}px`,
                  }}
                  className={`text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] ${
                    isArmed || isDigitOverdrive || isLocketteFrozen ? 'animate-pulse' : ''
                  }`}
                />
              </div>

              {/* Bottom: 2-Line Name & Clean Subtitle Tag */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="font-bold text-[13px] leading-tight text-white drop-shadow-sm group-hover:text-white transition-colors">
                  {powerup.nameLine1}
                </div>
                <div
                  className={`font-semibold text-[11px] leading-tight ${powerup.accentTextColor} transition-colors`}
                >
                  {powerup.nameLine2}
                </div>
                <div className="mt-1 text-[9px] text-neutral-400 group-hover:text-neutral-300 font-medium tracking-wide uppercase">
                  {powerup.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
