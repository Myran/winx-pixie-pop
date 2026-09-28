/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, Star } from 'lucide-react';
import { playStageClearedSound } from '../utils/audio';
import { WINX_PALETTE, WINX_TOKENS } from '../styles/designTokens';

interface StageClearedBannerProps {
  isOpen: boolean;
  levelNumber: number;
  onComplete: () => void;
  soundEnabled?: boolean;
}

export const StageClearedBanner: React.FC<StageClearedBannerProps> = ({
  isOpen,
  levelNumber,
  onComplete,
  soundEnabled = true,
}) => {
  const [animState, setAnimState] = useState<'enter' | 'active' | 'exit'>('enter');
  const hasCompletedRef = React.useRef(false);
  const timeoutsRef = React.useRef<number[]>([]);

  const safeComplete = React.useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen) return;

    hasCompletedRef.current = false;
    setAnimState('enter');
    playStageClearedSound(soundEnabled);

    // Active state after entrance
    const tActive = window.setTimeout(() => {
      setAnimState('active');
    }, 180);

    // Auto exit transition
    const tExit = window.setTimeout(() => {
      setAnimState('exit');
    }, 2400);

    // Finish and proceed to new level
    const tComplete = window.setTimeout(() => {
      safeComplete();
    }, 2800);

    timeoutsRef.current = [tActive, tExit, tComplete];

    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, [isOpen, safeComplete, soundEnabled]);

  if (!isOpen) return null;

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasCompletedRef.current) return;
    setAnimState('exit');
    const tSkip = window.setTimeout(() => {
      safeComplete();
    }, 150);
    timeoutsRef.current.push(tSkip);
  };

  return (
    <div
      onClick={handleSkip}
      className={`absolute inset-0 z-50 flex items-center justify-center pointer-events-auto select-none cursor-pointer transition-opacity duration-300 ${
        animState === 'exit' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: WINX_TOKENS.surface.overlay,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Rotating radial sunburst rays using Winx Palette colors */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-35 animate-spin"
        style={{
          animationDuration: '16s',
          background: `conic-gradient(from 0deg, ${WINX_PALETTE.stella}40 0deg 20deg, transparent 20deg 40deg, ${WINX_PALETTE.flora}40 40deg 60deg, transparent 60deg 80deg, ${WINX_PALETTE.aisha}40 80deg 100deg, transparent 100deg 120deg, ${WINX_PALETTE.bloom}40 120deg 140deg, transparent 140deg 160deg, ${WINX_PALETTE.stella}40 160deg 180deg, transparent 180deg 200deg, ${WINX_PALETTE.flora}40 200deg 220deg, transparent 220deg 240deg, ${WINX_PALETTE.aisha}40 240deg 260deg, transparent 260deg 280deg, ${WINX_PALETTE.bloom}40 280deg 300deg, transparent 300deg 320deg, ${WINX_PALETTE.tecna}40 320deg 340deg, transparent 340deg 360deg)`,
          filter: 'blur(24px)',
        }}
      />

      {/* Central Banner Container matching EndGamePurchaseModal */}
      <div
        className={`relative flex flex-col items-center justify-center text-center px-8 py-7 rounded-[28px] border-2 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(255,178,56,0.35)] backdrop-blur-xl transform transition-all duration-300 ${
          animState === 'enter'
            ? 'scale-50 opacity-0'
            : animState === 'active'
            ? 'scale-100 opacity-100'
            : 'scale-110 opacity-0'
        }`}
        style={{
          background: WINX_TOKENS.surface.cardBg,
          borderColor: WINX_PALETTE.stella,
          maxWidth: '85%',
        }}
      >
        {/* Top Trophy Star Emblem */}
        <div className="relative -mt-14 mb-2.5">
          <div
            className="w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-lg animate-bounce"
            style={{
              background: `linear-gradient(135deg, ${WINX_PALETTE.stella} 0%, #FFF3B0 50%, #E69D00 100%)`,
              borderColor: WINX_PALETTE.white,
              boxShadow: '0 0 24px rgba(255, 178, 56, 0.85)',
            }}
          >
            <Trophy className="w-8 h-8 text-neutral-950 fill-neutral-950/20 drop-shadow-sm" />
          </div>
          {/* Sparkles around emblem */}
          <Sparkles
            className="absolute -top-1 -right-2 w-6 h-6 animate-pulse"
            style={{ color: WINX_PALETTE.aisha }}
          />
          <Star
            className="absolute -bottom-1 -left-2 w-5 h-5 animate-ping opacity-60"
            style={{ color: WINX_PALETTE.flora, fill: WINX_PALETTE.flora }}
          />
        </div>

        {/* Level Clear Badge matching Currency Badge Token */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-widest shadow-inner mb-2"
          style={{
            backgroundColor: WINX_TOKENS.surface.badgeBg,
            borderColor: `${WINX_PALETTE.stella}80`,
            color: WINX_PALETTE.stella,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: WINX_PALETTE.stella }} />
          <span>Stage {levelNumber} Complete</span>
          <Sparkles className="w-3.5 h-3.5" style={{ color: WINX_PALETTE.stella }} />
        </div>

        {/* Main "STAGE CLEARED" 3D Metallic Header */}
        <h2
          className="text-3xl sm:text-4xl font-black tracking-wider uppercase text-transparent bg-clip-text leading-tight drop-shadow-[0_4px_16px_rgba(255,178,56,0.8)]"
          style={{
            backgroundImage: `linear-gradient(135deg, #FFFFFF 0%, ${WINX_PALETTE.stella} 50%, ${WINX_PALETTE.flora} 100%)`,
          }}
        >
          STAGE CLEARED!
        </h2>

        {/* Subtitle with Star Accents */}
        <div
          className="flex items-center gap-2 mt-2 font-bold text-xs tracking-widest uppercase"
          style={{ color: WINX_PALETTE.flora }}
        >
          <Star className="w-3 h-3" style={{ color: WINX_PALETTE.flora, fill: WINX_PALETTE.flora }} />
          <span>Fairy Victory</span>
          <Star className="w-3 h-3" style={{ color: WINX_PALETTE.flora, fill: WINX_PALETTE.flora }} />
        </div>

        {/* Floating Tap to continue hint */}
        <p
          className="mt-4 text-[10px] tracking-wide uppercase animate-pulse font-semibold"
          style={{ color: `${WINX_PALETTE.softPink}99` }}
        >
          Next stage starting soon... (Tap to skip)
        </p>
      </div>
    </div>
  );
};
