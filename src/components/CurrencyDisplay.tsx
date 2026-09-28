/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { normalizeImgurUrl, DEFAULT_SOFT_CURRENCY_ICON, DEFAULT_HARD_CURRENCY_ICON } from '../utils/currency';
import { playPurchaseSuccessSound } from '../utils/audio';
import { WINX_PALETTE, WINX_TOKENS } from '../styles/designTokens';

interface SoftCurrencyBadgeProps {
  coins: number;
  icon?: string;
  name?: string;
  onAdd?: (amount: number) => void;
  soundEnabled?: boolean;
  className?: string;
}

export const SoftCurrencyBadge: React.FC<SoftCurrencyBadgeProps> = ({
  coins,
  icon: propIcon,
  name = 'Pixie Coins',
  onAdd,
  soundEnabled = true,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const [pop, setPop] = useState(false);
  const prevCoinsRef = useRef(coins);

  const iconUrl = imgError
    ? DEFAULT_SOFT_CURRENCY_ICON
    : normalizeImgurUrl(propIcon) || DEFAULT_SOFT_CURRENCY_ICON;

  // Trigger bounce pop whenever coins balance changes
  useEffect(() => {
    if (coins !== prevCoinsRef.current) {
      prevCoinsRef.current = coins;
      setPop(true);
      const t = setTimeout(() => setPop(false), 260);
      return () => clearTimeout(t);
    }
  }, [coins]);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPurchaseSuccessSound(soundEnabled);
    setPop(true);
    setTimeout(() => setPop(false), 300);
    onAdd?.(100);
  };

  return (
    <div
      className={`group relative flex items-center gap-1.5 h-9 pl-2 pr-1.5 rounded-full backdrop-blur-md border shadow-[0_2px_14px_rgba(255,178,56,0.22)] transition-all duration-200 select-none cursor-pointer ${
        pop ? 'scale-105 shadow-[0_0_18px_rgba(255,178,56,0.65)]' : 'active:scale-98'
      } ${className}`}
      style={{
        backgroundColor: WINX_TOKENS.surface.badgeBg,
        borderColor: `${WINX_PALETTE.stella}80`,
      }}
      onClick={handleAdd}
      title={`${name}: ${coins.toLocaleString()} (Click + to add 100)`}
    >
      {/* Coin Icon */}
      <div className="relative w-5 h-5 shrink-0 flex items-center justify-center">
        <img
          src={iconUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain filter drop-shadow-[0_1px_5px_rgba(255,178,56,0.85)] group-hover:scale-110 transition-transform duration-200"
          draggable={false}
        />
      </div>

      {/* Numeric Amount */}
      <span className="text-[12.5px] font-black text-white tracking-tight tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] px-0.5">
        {coins.toLocaleString()}
      </span>

      {/* Quick Add Button */}
      <button
        type="button"
        onClick={handleAdd}
        className="w-5 h-5 rounded-full text-neutral-950 font-black text-[11px] flex items-center justify-center shadow-md cursor-pointer active:scale-85 transition-transform"
        style={{
          background: `linear-gradient(135deg, ${WINX_PALETTE.stella} 0%, #FFE082 100%)`,
        }}
        aria-label={`Add ${name}`}
      >
        +
      </button>
    </div>
  );
};

interface HardCurrencyBadgeProps {
  gems: number;
  icon?: string;
  name?: string;
  onAdd?: (amount: number) => void;
  soundEnabled?: boolean;
  className?: string;
}

export const HardCurrencyBadge: React.FC<HardCurrencyBadgeProps> = ({
  gems,
  icon: propIcon,
  name = 'Magic Crystals',
  onAdd,
  soundEnabled = true,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const [pop, setPop] = useState(false);

  const iconUrl = imgError
    ? DEFAULT_HARD_CURRENCY_ICON
    : normalizeImgurUrl(propIcon) || DEFAULT_HARD_CURRENCY_ICON;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPurchaseSuccessSound(soundEnabled);
    setPop(true);
    setTimeout(() => setPop(false), 300);
    onAdd?.(20);
  };

  return (
    <div
      className={`group relative flex items-center gap-1.5 h-9 pl-2 pr-1.5 rounded-full backdrop-blur-md border shadow-[0_2px_14px_rgba(47,217,196,0.22)] transition-all duration-200 select-none cursor-pointer ${
        pop ? 'scale-105 shadow-[0_0_18px_rgba(47,217,196,0.65)]' : 'active:scale-98'
      } ${className}`}
      style={{
        backgroundColor: WINX_TOKENS.surface.badgeBg,
        borderColor: `${WINX_PALETTE.aisha}80`,
      }}
      onClick={handleAdd}
      title={`${name}: ${gems.toLocaleString()} (Click + to add 20)`}
    >
      {/* Gem Icon */}
      <div className="relative w-5 h-5 shrink-0 flex items-center justify-center">
        <img
          src={iconUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain filter drop-shadow-[0_1px_6px_rgba(47,217,196,0.9)] group-hover:scale-110 transition-transform duration-200"
          draggable={false}
        />
      </div>

      {/* Numeric Amount */}
      <span className="text-[12.5px] font-black text-white tracking-tight tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] px-0.5">
        {gems.toLocaleString()}
      </span>

      {/* Quick Add Button */}
      <button
        type="button"
        onClick={handleAdd}
        className="w-5 h-5 rounded-full text-neutral-950 font-black text-[11px] flex items-center justify-center shadow-md cursor-pointer active:scale-85 transition-transform"
        style={{
          background: `linear-gradient(135deg, ${WINX_PALETTE.aisha} 0%, #A7F3D0 100%)`,
        }}
        aria-label={`Add ${name}`}
      >
        +
      </button>
    </div>
  );
};

interface CurrencyDisplayProps {
  coins: number;
  gems: number;
  softCurrencyIcon?: string;
  hardCurrencyIcon?: string;
  softCurrencyName?: string;
  hardCurrencyName?: string;
  onAddCoins?: (amount: number) => void;
  onAddGems?: (amount: number) => void;
  soundEnabled?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  coins,
  gems,
  softCurrencyIcon,
  hardCurrencyIcon,
  softCurrencyName,
  hardCurrencyName,
  onAddCoins,
  onAddGems,
  soundEnabled,
}) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <SoftCurrencyBadge
        coins={coins}
        icon={softCurrencyIcon}
        name={softCurrencyName}
        onAdd={onAddCoins}
        soundEnabled={soundEnabled}
      />
      <HardCurrencyBadge
        gems={gems}
        icon={hardCurrencyIcon}
        name={hardCurrencyName}
        onAdd={onAddGems}
        soundEnabled={soundEnabled}
      />
    </div>
  );
};
