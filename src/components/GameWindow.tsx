/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { StageConfig, PowerupType } from '../types/game';
import { HexagonStage } from './HexagonStage';
import { GemLayer, GemLayerHandle } from './GemLayer';
import { EnergyBar } from './EnergyBar';
import { TimerBar } from './TimerBar';
import { PowerupsDock } from './PowerupsDock';
import { EndGamePurchaseModal } from './EndGamePurchaseModal';
import { SoftCurrencyBadge, HardCurrencyBadge } from './CurrencyDisplay';
import { StageClearedBanner } from './StageClearedBanner';
import { CoinFlightLayer, CoinFlightBurst } from './CoinFlightLayer';
import { playDepletedSound, playEnergySurgeSound, playTimeUpSound, playPurchaseSuccessSound } from '../utils/audio';

interface GameWindowProps {
  config: StageConfig;
  selectedHexId?: number | null;
  onSelectHex?: (id: number | null) => void;
  viewportScale: number;
  levelKey?: number;
  onNewLevel?: () => void;
}

const ALL_POWERUP_TYPES: PowerupType[] = ['lockette', 'amore', 'chatta', 'tune', 'digit', 'piff'];

function pickRandomThreePowerups(): PowerupType[] {
  const shuffled = [...ALL_POWERUP_TYPES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

export const GameWindow: React.FC<GameWindowProps> = ({
  config,
  viewportScale,
  levelKey = 0,
  onNewLevel,
}) => {
  const [hoveredTargetHexId, setHoveredTargetHexId] = useState<number | null>(null);
  const [immovableEnemyHexIds, setImmovableEnemyHexIds] = useState<Set<number>>(new Set());
  const gemLayerRef = useRef<GemLayerHandle>(null);

  // 3 random powerups selected for the current level (3 out of 6)
  const [activeLevelPowerups, setActiveLevelPowerups] = useState<PowerupType[]>(() =>
    pickRandomThreePowerups()
  );

  // Powerups State: charges for each of the 6 pixie powerups
  const [powerupCharges, setPowerupCharges] = useState<Record<PowerupType, number>>({
    lockette: config.powerups?.defaultCharges ?? 3,
    amore: config.powerups?.defaultCharges ?? 3,
    chatta: config.powerups?.defaultCharges ?? 3,
    tune: config.powerups?.defaultCharges ?? 3,
    digit: config.powerups?.defaultCharges ?? 3,
    piff: config.powerups?.defaultCharges ?? 3,
  });

  const [activePowerup, setActivePowerup] = useState<PowerupType | null>(null);

  // Overdrive state for Digit's Tech Pop (free swaps for 8s)
  const [isOverdrive, setIsOverdrive] = useState(false);
  const [overdriveRemaining, setOverdriveRemaining] = useState(0);
  const overdriveIntervalRef = useRef<number | null>(null);

  // Timer state management (default 1 minute = 60s)
  const timerDuration =
    (config.timer?.duration ?? 60) + (levelKey === 1 ? config.timer?.firstLevelBonus ?? 0 : 0);
  const timeRemainingRef = useRef<number>(timerDuration);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const [frozenTimeRemaining, setFrozenTimeRemaining] = useState(0);
  const freezeTimerIntervalRef = useRef<number | null>(null);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Player soft & hard/premium currency state
  const [playerCoins, setPlayerCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('winx_player_coins');
      return saved !== null ? parseInt(saved, 10) : (config.currencies?.startingSoftCurrency ?? 2450);
    } catch {
      return config.currencies?.startingSoftCurrency ?? 2450;
    }
  });

  const [playerGems, setPlayerGems] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('winx_player_gems');
      return saved !== null ? parseInt(saved, 10) : (config.currencies?.startingHardCurrency ?? 150);
    } catch {
      return config.currencies?.startingHardCurrency ?? 150;
    }
  });

  // Save currency changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('winx_player_coins', playerCoins.toString());
    } catch {
      // ignore
    }
  }, [playerCoins]);

  useEffect(() => {
    try {
      localStorage.setItem('winx_player_gems', playerGems.toString());
    } catch {
      // ignore
    }
  }, [playerGems]);

  const handleSpendGems = useCallback((amount: number): boolean => {
    if (playerGems >= amount) {
      setPlayerGems((prev) => Math.max(0, prev - amount));
      return true;
    }
    return false;
  }, [playerGems]);

  // Stage Cleared victory callout banner state
  const [showStageCleared, setShowStageCleared] = useState(false);

  // Active coin flight bursts (for 6+ gem matches)
  const [coinBursts, setCoinBursts] = useState<CoinFlightBurst[]>([]);

  const softCurrencyLeft = config.currencies?.softCurrencyLeft ?? 46;
  const hardCurrencyRight = config.currencies?.hardCurrencyRight ?? 46;
  const topBarYOffset = config.currencies?.topBarYOffset ?? 0;
  const pauseGap = config.currencies?.pauseGap ?? 8;

  const topBarY = Math.round(
    (config.notchTop ?? 22) +
      Math.max(0, ((config.notchHeight ?? 55) - 36) / 2) +
      topBarYOffset
  );
  const coinTargetX = softCurrencyLeft + 20;
  const coinTargetY = topBarY + 18;

  const handleAwardMatchCoins = useCallback(
    (amount: number, coords: { x: number; y: number; matchCount: number }) => {
      const newBurst: CoinFlightBurst = {
        id: Date.now() + Math.random(),
        startX: coords.x,
        startY: coords.y,
        targetX: coinTargetX,
        targetY: coinTargetY,
        coinCount: amount,
        softCurrencyIcon: config.currencies?.softCurrencyIcon,
        matchCount: coords.matchCount,
      };
      setCoinBursts((prev) => [...prev, newBurst]);
    },
    [coinTargetX, coinTargetY, config.currencies?.softCurrencyIcon]
  );

  const handleCoinCollected = useCallback((amount: number) => {
    setPlayerCoins((prev) => prev + amount);
  }, []);

  const handleBurstFinished = useCallback((burstId: number) => {
    setCoinBursts((prev) => prev.filter((b) => b.id !== burstId));
  }, []);

  const handleStageClearedTrigger = useCallback(() => {
    setShowStageCleared(true);
  }, []);

  const handleStageClearedComplete = useCallback(() => {
    setShowStageCleared(false);
    if (onNewLevel) {
      onNewLevel();
    }
  }, [onNewLevel]);

  // Listen for custom trigger events for quick testing
  useEffect(() => {
    const handleTriggerStageCleared = () => {
      setShowStageCleared(true);
    };
    const handleTriggerTestCoinBurst = () => {
      handleAwardMatchCoins(10, {
        x: config.stageX ?? 300,
        y: config.stageY ?? 600,
        matchCount: 6,
      });
    };
    window.addEventListener('winx-trigger-stage-cleared', handleTriggerStageCleared);
    window.addEventListener('winx-trigger-match-coins', handleTriggerTestCoinBurst);
    return () => {
      window.removeEventListener('winx-trigger-stage-cleared', handleTriggerStageCleared);
      window.removeEventListener('winx-trigger-match-coins', handleTriggerTestCoinBurst);
    };
  }, [handleAwardMatchCoins, config.stageX, config.stageY]);

  // Energy state management via high-performance ref for silky smooth 60/120fps tweening
  const maxEnergy = config.energy?.maxEnergy ?? 100;
  const energyRef = useRef<number>(maxEnergy);
  const lastSwapTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const onEnergyDepletedRef = useRef<(() => void) | null>(null);

  // Shake effect state
  const [isShaking, setIsShaking] = useState(false);
  const shakeTimeoutRef = useRef<number | null>(null);

  // Camera Shake effect state (triggers when enemy gem takes damage or powerups blast)
  const [isCameraShaking, setIsCameraShaking] = useState(false);
  const cameraShakeTimeoutRef = useRef<number | null>(null);

  const triggerCameraShake = useCallback(() => {
    setIsCameraShaking(true);
    if (cameraShakeTimeoutRef.current) clearTimeout(cameraShakeTimeoutRef.current);
    cameraShakeTimeoutRef.current = window.setTimeout(() => {
      setIsCameraShaking(false);
    }, 380);
  }, []);

  const triggerShake = useCallback(() => {
    if (!config.energy?.shakeOnDepleted) return;
    setIsShaking(true);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = window.setTimeout(() => {
      setIsShaking(false);
    }, 450);
  }, [config.energy?.shakeOnDepleted]);

  // Activate Sirenix Overdrive countdown
  const activateOverdrive = useCallback((durationSeconds: number = 8) => {
    setIsOverdrive(true);
    setOverdriveRemaining(durationSeconds);

    if (overdriveIntervalRef.current) clearInterval(overdriveIntervalRef.current);

    overdriveIntervalRef.current = window.setInterval(() => {
      setOverdriveRemaining((prev) => {
        if (prev <= 1) {
          if (overdriveIntervalRef.current) clearInterval(overdriveIntervalRef.current);
          setIsOverdrive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Activate Lockette's Time Freeze countdown (freezes time for 5 seconds)
  const freezeTimer = useCallback((durationSeconds: number = 5) => {
    setIsTimeFrozen(true);
    setFrozenTimeRemaining(durationSeconds);

    if (freezeTimerIntervalRef.current) clearInterval(freezeTimerIntervalRef.current);

    freezeTimerIntervalRef.current = window.setInterval(() => {
      setFrozenTimeRemaining((prev) => {
        if (prev <= 1) {
          if (freezeTimerIntervalRef.current) clearInterval(freezeTimerIntervalRef.current);
          setIsTimeFrozen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Reset or fill energy & randomize 3 powerups when level changes
  useEffect(() => {
    energyRef.current = maxEnergy;
    timeRemainingRef.current = timerDuration;
    setIsTimeFrozen(false);
    setFrozenTimeRemaining(0);
    setShowEndGameModal(false);
    setIsPaused(false);
    isDraggingRef.current = false;
    setActiveLevelPowerups(pickRandomThreePowerups());
    setPowerupCharges({
      lockette: config.powerups?.defaultCharges ?? 3,
      amore: config.powerups?.defaultCharges ?? 3,
      chatta: config.powerups?.defaultCharges ?? 3,
      tune: config.powerups?.defaultCharges ?? 3,
      digit: config.powerups?.defaultCharges ?? 3,
      piff: config.powerups?.defaultCharges ?? 3,
    });
    setActivePowerup(null);
  }, [levelKey, maxEnergy, config.powerups, timerDuration]);

  // Listen for external trigger (e.g. from debug menu) to preview End Game modal
  useEffect(() => {
    const handleTrigger = () => {
      timeRemainingRef.current = 0;
      setShowEndGameModal(true);
      playTimeUpSound(config.animation?.enableSwapSound !== false);
    };
    window.addEventListener('winx-trigger-time-up', handleTrigger);
    return () => window.removeEventListener('winx-trigger-time-up', handleTrigger);
  }, [config.animation?.enableSwapSound]);

  // Clean up shake & overdrive timeouts on unmount
  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      if (cameraShakeTimeoutRef.current) clearTimeout(cameraShakeTimeoutRef.current);
      if (overdriveIntervalRef.current) clearInterval(overdriveIntervalRef.current);
      if (freezeTimerIntervalRef.current) clearInterval(freezeTimerIntervalRef.current);
    };
  }, []);

  // Handle attempt to swap: returns { allowed, ranOut }
  const handleAttemptSwap = useCallback((): { allowed: boolean; ranOut: boolean } => {
    if (isOverdrive) {
      // Overdrive enables unlimited free swaps with no cost!
      return { allowed: true, ranOut: false };
    }

    if (!config.energy?.enabled) {
      return { allowed: true, ranOut: false };
    }

    const cost = config.energy.energyPerSwap ?? 18;
    if (energyRef.current < cost || energyRef.current <= 0) {
      // Swapping blocked due to depleted energy
      playDepletedSound(config.animation?.enableSwapSound !== false);
      triggerShake();
      return { allowed: false, ranOut: true };
    }

    // Deduct energy immediately
    energyRef.current = Math.max(0, energyRef.current - cost);
    lastSwapTimeRef.current = performance.now();

    const ranOut = energyRef.current < cost || energyRef.current <= 0;
    if (ranOut) {
      triggerShake();
    }

    return { allowed: true, ranOut };
  }, [isOverdrive, config.energy, config.animation?.enableSwapSound, triggerShake]);

  // Check if player can start a new drag
  const canStartDrag = useCallback((): boolean => {
    if (showEndGameModal || isPaused) return false;
    if (isOverdrive) return true;
    if (!config.energy?.enabled) return true;
    const cost = config.energy.energyPerSwap ?? 18;
    if (energyRef.current < cost || energyRef.current <= 0) {
      playDepletedSound(config.animation?.enableSwapSound !== false);
      triggerShake();
      return false;
    }
    return true;
  }, [showEndGameModal, isPaused, isOverdrive, config.energy, config.animation?.enableSwapSound, triggerShake]);

  // Triggered when energy reaches 0 while actively dragging
  const handleEnergyDepleted = useCallback(() => {
    if (!isOverdrive) {
      triggerShake();
      onEnergyDepletedRef.current?.();
    }
  }, [isOverdrive, triggerShake]);

  // Powerup click / trigger handler for the 6 pixie powers
  const handleSelectPowerup = useCallback(
    (type: PowerupType) => {
      const currentCharges = powerupCharges[type] ?? 0;
      if (currentCharges <= 0 && !(type === 'digit' && isOverdrive)) return;

      if (type === 'chatta') {
        // Toggle targeting mode for Chatta's Bloom Pop
        setActivePowerup((prev) => (prev === 'chatta' ? null : 'chatta'));
      } else if (type === 'lockette') {
        // Lockette's Time Portal: freezes time for 5 seconds!
        setActivePowerup(null);
        freezeTimer(5);
        gemLayerRef.current?.executeLocketteTimePortal();
        setPowerupCharges((prev) => ({
          ...prev,
          lockette: Math.max(0, prev.lockette - 1),
        }));
      } else if (type === 'amore') {
        // Amore's Heart Pop: love charm pop + 60 energy restoration
        setActivePowerup(null);
        gemLayerRef.current?.executeAmoreHeart();
        energyRef.current = Math.min(maxEnergy, energyRef.current + 60);
        lastSwapTimeRef.current = performance.now();
        setPowerupCharges((prev) => ({
          ...prev,
          amore: Math.max(0, prev.amore - 1),
        }));
      } else if (type === 'tune') {
        // Tune's Harmony Pop: melodic resonance clear
        setActivePowerup(null);
        gemLayerRef.current?.executeTuneHarmony();
        setPowerupCharges((prev) => ({
          ...prev,
          tune: Math.max(0, prev.tune - 1),
        }));
      } else if (type === 'digit') {
        // Digit's Tech Pop: full energy refill + 8s unlimited free swaps
        setActivePowerup(null);
        playEnergySurgeSound(config.animation?.enablePopSound !== false);
        triggerCameraShake();
        energyRef.current = maxEnergy;
        lastSwapTimeRef.current = performance.now();
        activateOverdrive(config.powerups?.overdriveDuration ?? 8);
        setPowerupCharges((prev) => ({
          ...prev,
          digit: Math.max(0, prev.digit - 1),
        }));
      } else if (type === 'piff') {
        // Piff's Dream Pop: sweet slumber boss hit + full energy refill
        setActivePowerup(null);
        gemLayerRef.current?.executePiffSlumber();
        energyRef.current = maxEnergy;
        lastSwapTimeRef.current = performance.now();
        setPowerupCharges((prev) => ({
          ...prev,
          piff: Math.max(0, prev.piff - 1),
        }));
      }
    },
    [
      powerupCharges,
      isOverdrive,
      config.animation?.enablePopSound,
      config.powerups,
      maxEnergy,
      triggerCameraShake,
      activateOverdrive,
    ]
  );

  const handlePowerupUsed = useCallback((type: PowerupType) => {
    setPowerupCharges((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1),
    }));
    setActivePowerup(null);
  }, []);

  const handleReplenishCharges = useCallback(() => {
    setPowerupCharges({
      lockette: 3,
      amore: 3,
      chatta: 3,
      tune: 3,
      digit: 3,
      piff: 3,
    });
  }, []);

  const handleContinuePurchase = useCallback(
    (secondsToAdd: number) => {
      timeRemainingRef.current = secondsToAdd;
      energyRef.current = maxEnergy;
      lastSwapTimeRef.current = performance.now();
      handleReplenishCharges();
      setShowEndGameModal(false);
    },
    [maxEnergy, handleReplenishCharges]
  );

  const handleRestartFromModal = useCallback(() => {
    setShowEndGameModal(false);
    if (onNewLevel) {
      onNewLevel();
    } else {
      timeRemainingRef.current = timerDuration;
      energyRef.current = maxEnergy;
      handleReplenishCharges();
    }
  }, [onNewLevel, timerDuration, maxEnergy, handleReplenishCharges]);

  // Keyboard shortcut listener for whichever 3 powerup cards are currently displayed
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '1' && activeLevelPowerups[0]) {
        handleSelectPowerup(activeLevelPowerups[0]);
      } else if (e.key === '2' && activeLevelPowerups[1]) {
        handleSelectPowerup(activeLevelPowerups[1]);
      } else if (e.key === '3' && activeLevelPowerups[2]) {
        handleSelectPowerup(activeLevelPowerups[2]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeLevelPowerups, handleSelectPowerup]);

  // Subtle shadow styling for window
  const shadowAlpha = (config.windowShadowOpacity / 100).toFixed(2);
  const shadowStyle = {
    boxShadow: `0 25px 70px -15px rgba(255, 255, 255, ${Number(shadowAlpha) * 0.4}), 0 0 ${config.windowShadowBlur}px rgba(255, 255, 255, ${Number(shadowAlpha) * 0.25}), 0 15px 45px rgba(0, 0, 0, 0.7)`,
  };

  return (
    <div
      style={{
        width: `${config.windowWidth}px`,
        height: `${config.windowHeight}px`,
        borderRadius: `${config.windowRadius}px`,
        backgroundColor: config.windowBg,
        ...shadowStyle,
      }}
      className={`relative shrink-0 overflow-hidden transition-[box-shadow,border-radius] duration-200 select-none ${
        isCameraShaking ? 'animate-camera-shake' : ''
      }`}
    >
      {/* Background Image: backmost layer, not interactive */}
      <img
        src={config.backgroundImage || 'background01.jpeg'}
        alt="Alfea College Campus Background"
        aria-hidden="true"
        draggable={false}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          pointerEvents: 'none',
          userSelect: 'none',
          filter: config.backgroundFrost ? `blur(${config.backgroundFrostBlur ?? 12}px)` : undefined,
          transform: config.backgroundFrost && (config.backgroundFrostBlur ?? 12) > 0 ? 'scale(1.06)' : undefined,
          transition: 'filter 0.25s ease, transform 0.25s ease',
        }}
      />

      {/* Frosted Glass Tint & Backdrop Blur Layer */}
      {config.backgroundFrost && (
        <div
          className="absolute inset-0 pointer-events-none select-none z-0 transition-all duration-200"
          style={{
            backdropFilter: `blur(${config.backgroundFrostBlur ?? 12}px) saturate(130%)`,
            WebkitBackdropFilter: `blur(${config.backgroundFrostBlur ?? 12}px) saturate(130%)`,
            backgroundColor: config.backgroundFrostTint
              ? `${config.backgroundFrostTint}${Math.round(
                  Math.min(255, Math.max(0, ((config.backgroundFrostOpacity ?? 20) / 100) * 255))
                )
                  .toString(16)
                  .padStart(2, '0')}`
              : `rgba(255, 255, 255, ${(config.backgroundFrostOpacity ?? 20) / 100})`,
          }}
        />
      )}
      {/* Top Black Notch: 140px wide, 55px tall, 22px from top, corner radius 50px */}
      {config.notchVisible && (
        <div
          style={{
            position: 'absolute',
            top: `${config.notchTop}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${config.notchWidth}px`,
            height: `${config.notchHeight}px`,
            borderRadius: `${config.notchRadius}px`,
            backgroundColor: config.notchColor,
            zIndex: 40,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Top Bar HUD Panels: Left of Island (Soft Currency), Right of Island (Premium Currency + Pause) */}
      {(() => {
        return (
          <>
            {/* Panel 1: Soft Currency (Pixie Coins) - Left of Dynamic Island */}
            <div
              style={{
                position: 'absolute',
                top: `${topBarY}px`,
                left: `${softCurrencyLeft}px`,
                zIndex: 60,
              }}
            >
              <SoftCurrencyBadge
                coins={playerCoins}
                icon={config.currencies?.softCurrencyIcon}
                name={config.currencies?.softCurrencyName}
                onAdd={(amount) => setPlayerCoins((prev) => prev + amount)}
                soundEnabled={config.animation?.enableSwapSound !== false}
              />
            </div>

            {/* Panels 2 & 3: Premium Currency (Magic Crystals) & Pause Button - Right of Dynamic Island */}
            <div
              style={{
                position: 'absolute',
                top: `${topBarY}px`,
                right: `${hardCurrencyRight}px`,
                zIndex: 60,
                gap: `${pauseGap}px`,
              }}
              className="flex items-center"
            >
              <HardCurrencyBadge
                gems={playerGems}
                icon={config.currencies?.hardCurrencyIcon}
                name={config.currencies?.hardCurrencyName}
                onAdd={(amount) => setPlayerGems((prev) => prev + amount)}
                soundEnabled={config.animation?.enableSwapSound !== false}
              />

              <button
                onClick={() => setIsPaused((prev) => !prev)}
                className="w-9 h-9 rounded-full bg-[#0B1528]/85 hover:bg-[#152542] active:scale-90 border border-white/20 hover:border-[#2FD9C4]/60 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition-all shadow-[0_2px_14px_rgba(0,0,0,0.4)] cursor-pointer group"
                title={isPaused ? 'Resume Game' : 'Pause Game'}
                aria-label="Pause Game"
              >
                {isPaused ? (
                  <Play className="w-4 h-4 fill-white text-white translate-x-0.5 group-hover:scale-110 transition-transform" />
                ) : (
                  <Pause className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
                )}
              </button>
            </div>
          </>
        );
      })()}

      {/* Energy Bar placed on top of screen */}
      {config.energy && config.energy.enabled && (
        <EnergyBar
          config={config.energy}
          energyRef={energyRef}
          lastSwapTimeRef={lastSwapTimeRef}
          isDraggingRef={isDraggingRef}
          onEnergyDepleted={handleEnergyDepleted}
          isShaking={isShaking}
          isOverdrive={isOverdrive}
        />
      )}

      {/* Timer Bar placed exactly below the Energy Bar */}
      {config.timer && config.timer.enabled !== false && (
        <TimerBar
          config={config.timer}
          timeRemainingRef={timeRemainingRef}
          totalDuration={timerDuration}
          isFrozen={isTimeFrozen}
          isPaused={isPaused}
          frozenSecondsRemaining={frozenTimeRemaining}
          barWidth={config.timer.barWidth ?? config.energy?.barWidth ?? 470}
          barHeight={config.timer.barHeight ?? config.energy?.barHeight ?? 18}
          barTop={
            config.timer.barTop ??
            (config.energy?.barTop ?? 106) + (config.energy?.barHeight ?? 18) + 10
          }
          onTimeUp={() => {
            setShowEndGameModal(true);
            playTimeUpSound(config.animation?.enableSwapSound !== false);
          }}
        />
      )}

      {/* Classic Mobile Match-3 End-Game Purchase Modal */}
      <EndGamePurchaseModal
        isOpen={showEndGameModal}
        onClose={() => setShowEndGameModal(false)}
        onContinue={handleContinuePurchase}
        onRestartLevel={handleRestartFromModal}
        soundEnabled={config.animation?.enableSwapSound !== false}
        characterImageUrl={config.enemyGem?.companionImageUrl || 'https://i.imgur.com/tTK7L5j.png'}
        softCurrencyIcon={config.currencies?.softCurrencyIcon}
        hardCurrencyIcon={config.currencies?.hardCurrencyIcon}
        playerCoins={playerCoins}
        playerGems={playerGems}
        onSpendGems={handleSpendGems}
      />

      {/* Game Pause Modal Overlay */}
      {isPaused && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          onClick={() => setIsPaused(false)}
        >
          <div
            className="bg-gradient-to-b from-neutral-900/95 via-purple-950/90 to-neutral-900/95 border border-purple-500/30 rounded-3xl p-7 max-w-xs w-full text-center shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
              <Pause className="w-6 h-6 fill-purple-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-wide">Game Paused</h3>
              <p className="text-xs text-neutral-400 mt-1">Take a breath, fairy warrior!</p>
            </div>
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume</span>
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  onNewLevel?.();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/90 text-xs font-medium flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Level</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hexagon Honeycomb Stage with Stage Background Color */}
      <HexagonStage
        config={config}
        hoveredTargetHexId={hoveredTargetHexId}
        immovableEnemyHexIds={immovableEnemyHexIds}
      />

      {/* Gems & Drag Swapping Layer */}
      <GemLayer
        ref={gemLayerRef}
        config={config}
        onHoverTargetHex={setHoveredTargetHexId}
        viewportScale={viewportScale}
        levelKey={levelKey}
        onNewLevel={onNewLevel}
        onStageCleared={handleStageClearedTrigger}
        onAwardMatchCoins={handleAwardMatchCoins}
        onCameraShake={triggerCameraShake}
        onAttemptSwap={handleAttemptSwap}
        canStartDrag={canStartDrag}
        onDragStateChange={(dragging) => {
          isDraggingRef.current = dragging;
        }}
        onEnergyDepletedRef={onEnergyDepletedRef}
        activePowerup={activePowerup}
        onPowerupUsed={handlePowerupUsed}
        onImmovableHexIdsChange={setImmovableEnemyHexIds}
      />

      {/* 6+ Gem Match Coin Flying Particle Shower */}
      <CoinFlightLayer
        bursts={coinBursts}
        onCoinCollected={handleCoinCollected}
        onBurstFinished={handleBurstFinished}
        soundEnabled={config.animation?.enableSwapSound !== false}
      />

      {/* Stage Cleared Callout Banner */}
      <StageClearedBanner
        isOpen={showStageCleared}
        levelNumber={(levelKey ?? 0) + 1}
        onComplete={handleStageClearedComplete}
        soundEnabled={config.animation?.enableSwapSound !== false}
      />

      {/* 3 Fairy Powerups Dock at the Bottom of the Screen (3 of 6 random per level) */}
      <PowerupsDock
        activeLevelPowerups={activeLevelPowerups}
        charges={powerupCharges}
        activePowerup={activePowerup}
        onSelectPowerup={handleSelectPowerup}
        onReplenishCharges={handleReplenishCharges}
        isOverdrive={isOverdrive}
        overdriveRemaining={overdriveRemaining}
        isTimeFrozen={isTimeFrozen}
        frozenTimeRemaining={frozenTimeRemaining}
        config={config.powerups}
      />

      {/* Dynamic Camera Shake CSS keyframes */}
      <style>{`
        @keyframes cameraShakeAnim {
          0% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(-4.5px, 3px) rotate(-0.45deg); }
          35% { transform: translate(4px, -3.5px) rotate(0.4deg); }
          55% { transform: translate(-3px, -2px) rotate(-0.25deg); }
          75% { transform: translate(2px, 2px) rotate(0.2deg); }
          90% { transform: translate(-1px, 0.5px) rotate(-0.08deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .animate-camera-shake {
          animation: cameraShakeAnim 0.38s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
};

