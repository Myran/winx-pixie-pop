/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StageConfig } from './types/game';
import { DEFAULT_STAGE_CONFIG } from './config/defaultConfig';
import { GameWindow } from './components/GameWindow';
import { DebugMenu } from './components/DebugMenu';
import { getHoneycombLayout, getRandomClusterCenterId } from './utils/hexMath';
import { normalizeImgurUrl } from './utils/currency';
import { Sliders } from 'lucide-react';

const STORAGE_KEY = 'winx_pixie_pop_config';

export default function App() {
  const [levelNumber, setLevelNumber] = useState<number>(1);

  // Load initial config from saved localStorage or default to source code DEFAULT_STAGE_CONFIG
  const [config, setConfig] = useState<StageConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure gridRadius is at least 4 for the expanded stage requested
        const gridRadius = Math.max(parsed.gridRadius || 4, DEFAULT_STAGE_CONFIG.gridRadius || 4);
        const hexRadius = gridRadius >= 4 && parsed.hexRadius > 38 ? 36 : (parsed.hexRadius || DEFAULT_STAGE_CONFIG.hexRadius);
        const gemSize = gridRadius >= 4 && parsed.gems?.size > 38 ? 36 : (parsed.gems?.size || DEFAULT_STAGE_CONFIG.gems.size);

        // Ensure bottomOffset starts at 130 if it was the old default (28) or old max (120)
        const rawOffset = parsed.powerups?.bottomOffset;
        const bottomOffset =
          rawOffset === 28 || rawOffset === 120 || rawOffset === undefined
            ? 130
            : Math.max(50, Math.min(250, rawOffset));

        const stageBgColor =
          parsed.stageBgColor === '#ffffff' ? 'transparent' : (parsed.stageBgColor || 'transparent');

        return {
          ...DEFAULT_STAGE_CONFIG,
          ...parsed,
          stageBgColor,
          backgroundImage: parsed.backgroundImage || DEFAULT_STAGE_CONFIG.backgroundImage || 'background01.jpeg',
          gridRadius,
          hexRadius,
          gems: {
            ...DEFAULT_STAGE_CONFIG.gems,
            ...(parsed.gems || {}),
            size: gemSize,
            shapes: {
              ...DEFAULT_STAGE_CONFIG.gems.shapes,
              ...(parsed.gems?.shapes || {}),
            },
            sizes: {
              ...DEFAULT_STAGE_CONFIG.gems.sizes,
              ...(parsed.gems?.sizes || {}),
            },
            customImages: {
              ...DEFAULT_STAGE_CONFIG.gems.customImages,
              bloom: normalizeImgurUrl(parsed.gems?.customImages?.bloom) || DEFAULT_STAGE_CONFIG.gems.customImages?.bloom || 'gems/bloom.png',
              stella: normalizeImgurUrl(parsed.gems?.customImages?.stella) || DEFAULT_STAGE_CONFIG.gems.customImages?.stella || 'gems/stella.png',
              flora: normalizeImgurUrl(parsed.gems?.customImages?.flora) || DEFAULT_STAGE_CONFIG.gems.customImages?.flora || 'gems/flora.png',
              musa: normalizeImgurUrl(parsed.gems?.customImages?.musa) || DEFAULT_STAGE_CONFIG.gems.customImages?.musa || 'gems/musa.png',
              tecna: normalizeImgurUrl(parsed.gems?.customImages?.tecna) || DEFAULT_STAGE_CONFIG.gems.customImages?.tecna || 'gems/tecna.png',
              aisha: normalizeImgurUrl(parsed.gems?.customImages?.aisha) || DEFAULT_STAGE_CONFIG.gems.customImages?.aisha || 'gems/aisha.png',
            },
            colors: {
              ...DEFAULT_STAGE_CONFIG.gems.colors,
              ...(parsed.gems?.colors || {}),
              bloom: parsed.gems?.colors?.bloom || DEFAULT_STAGE_CONFIG.gems.colors.bloom,
              stella: parsed.gems?.colors?.stella || DEFAULT_STAGE_CONFIG.gems.colors.stella,
              flora: parsed.gems?.colors?.flora || DEFAULT_STAGE_CONFIG.gems.colors.flora,
              musa: parsed.gems?.colors?.musa || DEFAULT_STAGE_CONFIG.gems.colors.musa,
              tecna: parsed.gems?.colors?.tecna || DEFAULT_STAGE_CONFIG.gems.colors.tecna,
              aisha: parsed.gems?.colors?.aisha || DEFAULT_STAGE_CONFIG.gems.colors.aisha,
            },
          },
          animation: {
            ...DEFAULT_STAGE_CONFIG.animation,
            ...(parsed.animation || {}),
            tapScale: parsed.animation?.tapScale ?? DEFAULT_STAGE_CONFIG.animation.tapScale,
            tapLiftOffsetY: parsed.animation?.tapLiftOffsetY ?? DEFAULT_STAGE_CONFIG.animation.tapLiftOffsetY,
            tapLiftTransition: parsed.animation?.tapLiftTransition ?? DEFAULT_STAGE_CONFIG.animation.tapLiftTransition,
            enableTapSelect: parsed.animation?.enableTapSelect ?? DEFAULT_STAGE_CONFIG.animation.enableTapSelect,
          },
          energy: { ...DEFAULT_STAGE_CONFIG.energy, ...(parsed.energy || {}) },
          timer: { ...DEFAULT_STAGE_CONFIG.timer, ...(parsed.timer || {}) },
          enemyGem: {
            ...DEFAULT_STAGE_CONFIG.enemyGem,
            ...(parsed.enemyGem || {}),
            imageUrl:
              normalizeImgurUrl(parsed.enemyGem?.imageUrl) ||
              DEFAULT_STAGE_CONFIG.enemyGem.imageUrl ||
              'enemy/shadow_core.png',
            companionImageUrl:
              normalizeImgurUrl(parsed.enemyGem?.companionImageUrl) ||
              DEFAULT_STAGE_CONFIG.enemyGem.companionImageUrl ||
              'enemy/companion.png',
            healthBarHeight:
              parsed.enemyGem?.healthBarHeight === 12 || !parsed.enemyGem?.healthBarHeight
                ? 16
                : parsed.enemyGem.healthBarHeight,
            healthBarOffsetY:
              parsed.enemyGem?.healthBarOffsetY ?? DEFAULT_STAGE_CONFIG.enemyGem.healthBarOffsetY ?? 5,
            smallEnemySize: parsed.enemyGem?.smallEnemySize ?? DEFAULT_STAGE_CONFIG.enemyGem.smallEnemySize,
            enablePulsate: parsed.enemyGem?.enablePulsate ?? DEFAULT_STAGE_CONFIG.enemyGem.enablePulsate,
            pulseScale: parsed.enemyGem?.pulseScale ?? DEFAULT_STAGE_CONFIG.enemyGem.pulseScale,
            pulseSpeed: parsed.enemyGem?.pulseSpeed ?? DEFAULT_STAGE_CONFIG.enemyGem.pulseSpeed,
            smallEnemyRotate: parsed.enemyGem?.smallEnemyRotate ?? DEFAULT_STAGE_CONFIG.enemyGem.smallEnemyRotate,
            smallEnemyRotateSpeed: parsed.enemyGem?.smallEnemyRotateSpeed ?? DEFAULT_STAGE_CONFIG.enemyGem.smallEnemyRotateSpeed,
            smallEnemyRotateDirection: parsed.enemyGem?.smallEnemyRotateDirection ?? DEFAULT_STAGE_CONFIG.enemyGem.smallEnemyRotateDirection,
          },
          powerups: {
            ...DEFAULT_STAGE_CONFIG.powerups,
            ...(parsed.powerups || {}),
            bottomOffset,
          },
          currencies: {
            ...DEFAULT_STAGE_CONFIG.currencies,
            ...(parsed.currencies || {}),
            softCurrencyIcon:
              normalizeImgurUrl(parsed.currencies?.softCurrencyIcon) ||
              DEFAULT_STAGE_CONFIG.currencies?.softCurrencyIcon ||
              'currencies/coin.png',
            hardCurrencyIcon:
              normalizeImgurUrl(parsed.currencies?.hardCurrencyIcon) ||
              DEFAULT_STAGE_CONFIG.currencies?.hardCurrencyIcon ||
              'currencies/crystal.png',
            softCurrencyLeft: parsed.currencies?.softCurrencyLeft ?? DEFAULT_STAGE_CONFIG.currencies?.softCurrencyLeft ?? 46,
            hardCurrencyRight: parsed.currencies?.hardCurrencyRight ?? DEFAULT_STAGE_CONFIG.currencies?.hardCurrencyRight ?? 46,
            topBarYOffset: parsed.currencies?.topBarYOffset ?? DEFAULT_STAGE_CONFIG.currencies?.topBarYOffset ?? 0,
            pauseGap: parsed.currencies?.pauseGap ?? DEFAULT_STAGE_CONFIG.currencies?.pauseGap ?? 8,
          },
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_STAGE_CONFIG;
  });

  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  });

  const handleNewLevel = () => {
    setLevelNumber((prev) => prev + 1);
    if (config.enemyGem?.enabled) {
      const hexagons = getHoneycombLayout(config.hexRadius, config.hexGap, config.gridRadius || 4);
      const newCenterId = getRandomClusterCenterId(hexagons, config.enemyGem?.centerHexId);
      if (newCenterId !== -1) {
        setConfig((prev) => ({
          ...prev,
          enemyGem: {
            ...prev.enemyGem,
            centerHexId: newCenterId,
          },
        }));
      }
    }
  };

  // Track window resize to auto-fit viewport
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for 'Tab' key to toggle debug menu
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setIsDebugOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      setIsDebugOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleReset = () => {
    setConfig(DEFAULT_STAGE_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Save changes directly to source code via backend API + localStorage
  const handleSaveToSource = async (): Promise<{ success: boolean; message: string }> => {
    // 1. Immediately cache in localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Could not cache to localStorage', e);
    }

    // 2. Send to backend server to overwrite src/config/defaultConfig.ts directly
    try {
      const response = await fetch('/api/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.error || 'Server returned an error',
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Saved to source code!',
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      // Even if network route fails in static preview, local state is persisted
      return {
        success: true,
        message: `Saved locally (${errorMsg})`,
      };
    }
  };

  // Calculate scaling factor to display the full 603x1311 window cleanly on any screen
  const calculateScale = (): number => {
    if (config.zoomMode === 'actual') return 1;
    if (config.zoomMode === 'custom') return config.customZoom / 100;

    // 'fit' mode: calculate scale with safety padding
    const paddingX = 40;
    const paddingY = 40;
    const availableW = Math.max(300, viewportSize.width - paddingX);
    const availableH = Math.max(400, viewportSize.height - paddingY);

    const scaleX = availableW / config.windowWidth;
    const scaleY = availableH / config.windowHeight;
    const fitScale = Math.min(scaleX, scaleY, 1);

    return Number(fitScale.toFixed(4));
  };

  const scale = calculateScale();

  return (
    <div
      style={{ backgroundColor: config.outerBg }}
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center select-none"
    >
      {/* Outer ambient blurred Alfea background */}
      <div
        className="absolute inset-0 pointer-events-none select-none opacity-20 filter blur-3xl scale-110 overflow-hidden"
        style={{
          backgroundImage: `url(${config.backgroundImage || 'background01.jpeg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Scaled Game Window Container */}
      <div
        className="flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: `${config.windowWidth}px`,
          height: `${config.windowHeight}px`,
        }}
      >
        <GameWindow
          config={config}
          viewportScale={scale}
          levelKey={levelNumber}
          onNewLevel={handleNewLevel}
        />
      </div>

      {/* Floating subtle debug button outside the game window */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsDebugOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-xs font-mono backdrop-blur transition-all shadow-lg active:scale-95 cursor-pointer"
          title="Toggle Debug Menu (Tab)"
        >
          <Sliders className="w-3.5 h-3.5 text-neutral-400" />
          <span>Debug</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-white/10 rounded font-sans text-neutral-400">
            Tab
          </kbd>
        </button>
      </div>

      {/* Live Minimalistic Debug Menu */}
      <DebugMenu
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        onReset={handleReset}
        onSaveToSource={handleSaveToSource}
        onNewLevel={handleNewLevel}
        levelNumber={levelNumber}
      />
    </div>
  );
}
