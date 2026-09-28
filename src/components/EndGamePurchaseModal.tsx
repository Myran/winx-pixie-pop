/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Clock, Zap, Sparkles, Video } from 'lucide-react';
import { playPurchaseSuccessSound } from '../utils/audio';
import { normalizeImgurUrl, DEFAULT_HARD_CURRENCY_ICON } from '../utils/currency';
import { WINX_PALETTE, WINX_TOKENS } from '../styles/designTokens';

export const END_GAME_TAUNT_SENTENCES: string[] = [
  'Try again, fairy.',
  'Oh, that was adorable.',
  'We expected more sparkle.',
  'Even your panic was slow.',
  'A little more magic, please.',
  'You almost had it. Almost.',
  'The board beat you nicely.',
  'Not your finest spell.',
  'We’ve seen stronger pebbles.',
  'Back to fairy school.',
  'Dark Magic win again. Surprise, surprise.',
  'That was almost clever.',
  'Cute try. Really.',
  'You need more sparkle.',
  'Oops. Not your level, huh?',
  'So close. So not close.',
  'Better luck next spell.',
  'Was that your best shot?',
  'We’ve seen better magic.',
  'Cloud Tower called. They want better witches.',
  'Even the Dragon Flame blinked at that one.',
  'You just got out-spelled, fairies.',
  'Dark Magic’s still ahead. Obviously.',
  'That was a real Cloud Tower moment.',
  'Cloud Tower must be laughing. Or crying...',
  'Oh, the Trix send their pity.',
  'Another win Trix for the Trix?',
  'Jawn!',
  'Oh, were we done?',
  'But things were just about to get interesting.',
];

const getRandomSentence = (excludeCurrent?: string): string => {
  const choices = excludeCurrent
    ? END_GAME_TAUNT_SENTENCES.filter((s) => s !== excludeCurrent)
    : END_GAME_TAUNT_SENTENCES;
  const idx = Math.floor(Math.random() * choices.length);
  return choices[idx] || END_GAME_TAUNT_SENTENCES[0];
};

interface EndGamePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (secondsToAdd: number) => void;
  onRestartLevel?: () => void;
  soundEnabled?: boolean;
  characterImageUrl?: string;
  softCurrencyIcon?: string;
  hardCurrencyIcon?: string;
  playerGems?: number;
  playerCoins?: number;
  onSpendGems?: (amount: number) => boolean;
}

export const EndGamePurchaseModal: React.FC<EndGamePurchaseModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  soundEnabled = true,
  characterImageUrl: propCharacterImageUrl,
  hardCurrencyIcon: propHardIcon,
  playerGems: propPlayerGems,
  onSpendGems,
}) => {
  const [localGems, setLocalGems] = useState(150);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(3);
  const [imgError, setImgError] = useState(false);
  const [speechSentence, setSpeechSentence] = useState<string>(() => getRandomSentence());
  const adIntervalRef = React.useRef<number | null>(null);
  const purchaseTimeoutRef = React.useRef<number | null>(null);

  const hardCurrencyIcon = normalizeImgurUrl(propHardIcon) || DEFAULT_HARD_CURRENCY_ICON;
  const currentGems = propPlayerGems !== undefined ? propPlayerGems : localGems;

  useEffect(() => {
    if (isOpen) {
      setSpeechSentence(getRandomSentence());
      setIsPurchasing(false);
      setIsWatchingAd(false);
      setAdCountdown(3);
    }
    return () => {
      if (adIntervalRef.current !== null) {
        clearInterval(adIntervalRef.current);
        adIntervalRef.current = null;
      }
      if (purchaseTimeoutRef.current !== null) {
        clearTimeout(purchaseTimeoutRef.current);
        purchaseTimeoutRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultImageUrl = 'enemy/companion.png';
  const characterImageUrl = imgError
    ? 'enemy/companion.png'
    : (propCharacterImageUrl ? (normalizeImgurUrl(propCharacterImageUrl) || propCharacterImageUrl) : defaultImageUrl);

  const handlePurchaseWithGems = () => {
    if (isPurchasing || isWatchingAd) return;
    if (currentGems < 100) {
      return;
    }
    setIsPurchasing(true);
    playPurchaseSuccessSound(soundEnabled);

    if (onSpendGems) {
      onSpendGems(100);
    } else {
      setLocalGems((prev) => Math.max(0, prev - 100));
    }

    if (purchaseTimeoutRef.current !== null) clearTimeout(purchaseTimeoutRef.current);
    purchaseTimeoutRef.current = window.setTimeout(() => {
      onContinue(30); // Award +30 seconds
      setIsPurchasing(false);
    }, 450);
  };

  const handleWatchAd = () => {
    if (isPurchasing || isWatchingAd) return;
    setIsWatchingAd(true);
    setAdCountdown(3);

    if (adIntervalRef.current !== null) clearInterval(adIntervalRef.current);
    adIntervalRef.current = window.setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          if (adIntervalRef.current !== null) {
            clearInterval(adIntervalRef.current);
            adIntervalRef.current = null;
          }
          playPurchaseSuccessSound(soundEnabled);
          setTimeout(() => {
            onContinue(15); // Award +15 seconds
            setIsWatchingAd(false);
          }, 300);
          return 0;
        }
        return prev - 1;
      });
    }, 850);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-3 select-none pointer-events-auto"
      style={{
        backgroundColor: WINX_TOKENS.surface.overlay,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Horizontally optimized modal container */}
      <div
        className="relative w-full max-w-[560px] rounded-[28px] pt-4 px-5 pb-0 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(255,178,56,0.3)] border-2 z-10 overflow-hidden"
        style={{
          background: WINX_TOKENS.surface.cardBg,
          borderColor: WINX_PALETTE.stella,
        }}
      >
        {/* Ambient background glow accents */}
        <div
          className="absolute -top-24 -left-24 w-52 h-52 rounded-full pointer-events-none blur-3xl opacity-30"
          style={{ backgroundColor: WINX_PALETTE.tecna }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-52 h-52 rounded-full pointer-events-none blur-3xl opacity-25"
          style={{ backgroundColor: WINX_PALETTE.bloom }}
        />

        {/* Top Header Row: "KEEP GOING!" aligned horizontally with the close 'X' button */}
        <div className="relative z-20 w-full flex items-start justify-between gap-3 mb-2">
          {/* Header & Subtitle */}
          <div className="flex-1">
            <h3
              className="text-2xl sm:text-3xl font-black tracking-wide uppercase text-transparent bg-clip-text drop-shadow-[0_2px_12px_rgba(255,178,56,0.65)] leading-tight"
              style={{
                backgroundImage: `linear-gradient(135deg, #FFFFFF 0%, ${WINX_PALETTE.stella} 50%, ${WINX_PALETTE.flora} 100%)`,
              }}
            >
              KEEP GOING!
            </h3>
            <p
              className="text-xs font-semibold leading-relaxed mt-0.5"
              style={{ color: WINX_PALETTE.softPink }}
            >
              Don't lose your level progress & fairy score streak!
            </p>
          </div>

          {/* Close 'X' Button - Styled identically to the Pause button */}
          <button
            onClick={onClose}
            className="w-9 h-9 shrink-0 rounded-full bg-[#0B1528]/85 hover:bg-[#152542] border border-white/20 hover:border-[#2FD9C4]/60 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition-all shadow-[0_2px_14px_rgba(0,0,0,0.4)] cursor-pointer active:scale-90"
            aria-label="Close"
            title="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2-Column Horizontal Layout for Character + Action Card */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-4">
          {/* LEFT COLUMN: Character & Speech Bubble - anchored so bottom directly meets the yellow outline */}
          <div className="flex flex-col items-center shrink-0 w-[160px] sm:w-[195px] relative self-end">
            {/* Taunt Speech Bubble */}
            <div
              onClick={() => setSpeechSentence((prev) => getRandomSentence(prev))}
              title="Click to roll another line!"
              className="relative mb-1.5 px-3 py-1.5 rounded-2xl text-center text-xs font-bold leading-snug cursor-pointer transition-all duration-200 select-none group border shadow-md"
              style={{
                backgroundColor: 'rgba(17, 13, 38, 0.95)',
                borderColor: `${WINX_PALETTE.flora}90`,
                color: WINX_PALETTE.white,
                boxShadow: `0 4px 16px rgba(155, 89, 255, 0.4), 0 0 10px rgba(255, 154, 197, 0.25)`,
                animation: 'speechFloat 3s ease-in-out infinite',
              }}
            >
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {speechSentence}
              </span>
              {/* Bubble Arrow */}
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-r border-b"
                style={{
                  backgroundColor: 'rgba(17, 13, 38, 0.95)',
                  borderColor: `${WINX_PALETTE.flora}90`,
                }}
              />
            </div>

            {/* Witch Character Art - Enlarged and touching the bottom outline exactly */}
            <div className="relative w-[150px] sm:w-[185px] flex items-end justify-center filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]">
              <img
                src={characterImageUrl}
                alt="Darcy"
                onError={() => setImgError(true)}
                className="w-full h-auto object-contain filter drop-shadow-[0_0_14px_rgba(155,89,255,0.45)] select-none block"
                draggable={false}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Offer Card and Action Buttons */}
          <div className="flex-1 w-full flex flex-col items-center sm:items-start text-center sm:text-left pb-4">
            {/* Time Offer Card */}
            <div
              className="w-full p-3 rounded-2xl border backdrop-blur-md mb-2.5 flex flex-col gap-2.5 shadow-inner"
              style={{
                backgroundColor: WINX_TOKENS.surface.innerCardBg,
                borderColor: `${WINX_PALETTE.tecna}50`,
              }}
            >
              {/* Highlight row with clock & seconds */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-md shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${WINX_PALETTE.stella} 0%, #FFE082 100%)`,
                    borderColor: WINX_PALETTE.white,
                    boxShadow: '0 0 14px rgba(255, 178, 56, 0.6)',
                  }}
                >
                  <Clock className="w-5 h-5 text-neutral-950 stroke-[2.5]" />
                </div>
                <div className="flex flex-col text-left">
                  <span
                    className="text-xl sm:text-2xl font-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    style={{ color: WINX_PALETTE.stella }}
                  >
                    +30 SECONDS
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: WINX_PALETTE.softPink }}
                  >
                    Full Board Continuity
                  </span>
                </div>
              </div>

              {/* Horizontal Perks List */}
              <div className="w-full pt-2 border-t border-white/10 grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/40 border border-white/5">
                  <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: WINX_PALETTE.musa, fill: WINX_PALETTE.musa }} />
                  <span style={{ color: WINX_PALETTE.white }}>100% Energy Refill</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/40 border border-white/5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: WINX_PALETTE.aisha }} />
                  <span style={{ color: WINX_PALETTE.white }}>+3 Pixie Charges</span>
                </div>
              </div>
            </div>

            {/* Primary Continue Button (Aisha Cyan 3D Button) */}
            <button
              onClick={handlePurchaseWithGems}
              disabled={isPurchasing || isWatchingAd}
              className="w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider text-black shadow-lg cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-1 flex items-center justify-center gap-2 mb-2 relative overflow-hidden group"
              style={{
                background: `linear-gradient(180deg, #A7F3D0 0%, ${WINX_PALETTE.aisha} 55%, #14B8A6 100%)`,
                boxShadow: `0 4px 0 #0f766e, 0 10px 20px rgba(47, 217, 196, 0.45)`,
                border: '1.5px solid rgba(255, 255, 255, 0.7)',
              }}
            >
              {/* Shine reflection animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              {isPurchasing ? (
                <span className="flex items-center gap-2 text-neutral-950 font-bold">
                  <Sparkles className="w-4 h-4 animate-spin text-neutral-950" />
                  Reviving Fairy Magic...
                </span>
              ) : (
                <>
                  <span className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    Continue
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full bg-black/40 border border-white/30 text-white text-xs flex items-center gap-1.5 shadow-inner"
                  >
                    <img
                      src={hardCurrencyIcon}
                      alt="Crystals"
                      className="w-3.5 h-3.5 object-contain filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                    />
                    100
                  </span>
                </>
              )}
            </button>

            {/* Free Ad Alternative Button */}
            <button
              onClick={handleWatchAd}
              disabled={isPurchasing || isWatchingAd}
              className="w-full py-2 px-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 hover:border-white/40"
              style={{
                backgroundColor: 'rgba(26, 16, 60, 0.65)',
                borderColor: `${WINX_PALETTE.tecna}60`,
                color: WINX_PALETTE.softPink,
              }}
            >
              <Video className="w-3.5 h-3.5" style={{ color: WINX_PALETTE.bloom }} />
              {isWatchingAd ? (
                <span style={{ color: WINX_PALETTE.aisha }} className="animate-pulse">
                  Playing sponsor ad... ({adCountdown}s)
                </span>
              ) : (
                <span>Watch Video for +15s (FREE)</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes speechFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3.5px);
          }
        }
      `}</style>
    </div>
  );
};
