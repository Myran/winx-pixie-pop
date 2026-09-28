/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { StageConfig, GemData, HexInfo, PowerupType } from '../types/game';
import { getHoneycombLayout, areHexagonsAdjacent, findNearestHexagon, getSevenHexCluster } from '../utils/hexMath';
import { GemItem } from './GemItem';
import { EnemyGemItem } from './EnemyGemItem';
import { EnemySmokeParticles, SmokeBurstItem, SmokeBurstTrigger } from './EnemySmokeParticles';
import { SwapEffect, SwapPulseEvent } from './SwapEffect';
import { PixieSparkles, SparkleEvent } from './PixieSparkles';
import { PopEffect, PopEvent } from './PopEffect';
import {
  playPopChime,
  playSwapSound,
  playEnemyPulseSound,
  playEnemyDeflectSound,
  playEnemyHitSound,
  playEnemyDefeatSound,
  playDragonFlameSound,
  playPrismRaySound,
  playPortalWhooshSound,
  playHeartCharmSound,
  playDreamLullabySound,
  playTimeFreezeSound,
  playImmovableBreakSound,
  playGemTapDrrrSound,
} from '../utils/audio';

export interface SwapAttemptResult {
  allowed: boolean;
  ranOut: boolean;
}

export interface GemLayerHandle {
  executeChattaBloom: (targetHexId?: number) => void;
  executeLocketteTimePortal: () => void;
  executeLockettePortal?: (targetHexId?: number) => void;
  executeAmoreHeart: () => void;
  executeTuneHarmony: () => void;
  executePiffSlumber: () => void;
}

export interface GemLayerProps {
  config: StageConfig;
  onHoverTargetHex?: (hexId: number | null) => void;
  viewportScale: number;
  levelKey?: number;
  onNewLevel?: () => void;
  onStageCleared?: () => void;
  onAwardMatchCoins?: (amount: number, coords: { x: number; y: number; matchCount: number }) => void;
  onCameraShake?: () => void;
  onAttemptSwap?: () => SwapAttemptResult;
  canStartDrag?: () => boolean;
  onDragStateChange?: (isDragging: boolean) => void;
  onEnergyDepletedRef?: React.MutableRefObject<(() => void) | null>;
  activePowerup?: PowerupType | null;
  onPowerupUsed?: (type: PowerupType) => void;
  onImmovableHexIdsChange?: (hexIds: Set<number>) => void;
}

export const WINX_GEM_TYPES = [
  { type: 'bloom' as const, name: 'Bloom' as const, colorKey: 'bloom' as const, accentColor: '#90b0ff' },
  { type: 'stella' as const, name: 'Stella' as const, colorKey: 'stella' as const, accentColor: '#ffe885' },
  { type: 'flora' as const, name: 'Flora' as const, colorKey: 'flora' as const, accentColor: '#ffd1e6' },
  { type: 'musa' as const, name: 'Musa' as const, colorKey: 'musa' as const, accentColor: '#ff9ea7' },
  { type: 'tecna' as const, name: 'Tecna' as const, colorKey: 'tecna' as const, accentColor: '#d4b0ff' },
  { type: 'aisha' as const, name: 'Aisha' as const, colorKey: 'aisha' as const, accentColor: '#8efff1' },
];

function generateRandomGems(
  hexagons: HexInfo[],
  colors: StageConfig['gems']['colors'],
  excludedHexIds: Set<number> = new Set(),
  seed: number = Date.now(),
  immovableEnemyCount: number = 3
): GemData[] {
  const eligibleHexes = hexagons.filter((hex) => !excludedHexIds.has(hex.id));

  // Select scattered hexagons for the new type of immovable enemy gems
  const immovableHexIds = new Set<number>();
  if (immovableEnemyCount > 0 && eligibleHexes.length > immovableEnemyCount + 4) {
    const candidateHexes = [...eligibleHexes];
    for (let i = candidateHexes.length - 1; i > 0; i--) {
      const pseudoRand = Math.abs(Math.sin((seed || 42) * 997 + i * 37));
      const j = Math.floor((pseudoRand % 1) * (i + 1));
      [candidateHexes[i], candidateHexes[j]] = [candidateHexes[j], candidateHexes[i]];
    }
    for (let i = 0; i < Math.min(immovableEnemyCount, candidateHexes.length); i++) {
      immovableHexIds.add(candidateHexes[i].id);
    }
  }

  return eligibleHexes.map((hex, idx) => {
    if (immovableHexIds.has(hex.id)) {
      return {
        id: `immovable-enemy-${hex.id}-${seed}-${idx}`,
        type: 'enemy',
        name: 'Shadow Gem',
        color: '#581c87',
        accentColor: '#f0abfc',
        hexId: hex.id,
        isEnemy: true,
        isImmovableEnemy: true,
      };
    }
    const randomType = WINX_GEM_TYPES[Math.floor(Math.random() * WINX_GEM_TYPES.length)];
    return {
      id: `gem-${hex.id}-${seed}-${idx}`,
      type: randomType.type,
      name: randomType.name,
      color: colors[randomType.colorKey],
      accentColor: randomType.accentColor,
      hexId: hex.id,
    };
  });
}

export const GemLayer = forwardRef<GemLayerHandle, GemLayerProps>(
  (
    {
      config,
      onHoverTargetHex,
      viewportScale,
      levelKey = 0,
      onNewLevel,
      onStageCleared,
      onAwardMatchCoins,
      onCameraShake,
      onAttemptSwap,
      canStartDrag,
      onDragStateChange,
      onEnergyDepletedRef,
      activePowerup,
      onPowerupUsed,
      onImmovableHexIdsChange,
    },
    ref
  ) => {
    const {
      hexRadius,
      hexGap,
      stageX,
      stageY,
      rotation,
      gems: gemConfig,
      animation: animConfig,
    } = config;

    const hexLayout = useMemo(
      () => getHoneycombLayout(hexRadius, hexGap, config.gridRadius || 4),
      [hexRadius, hexGap, config.gridRadius]
    );
    const layerRef = useRef<HTMLDivElement>(null);

    // Hovered hexagon for Dragon Flame blast targeting
    const [hoveredBlastHexId, setHoveredBlastHexId] = useState<number | null>(null);

    // 7-Hex Enemy Gem calculation
    const enemyCluster = useMemo(() => {
      if (!config.enemyGem?.enabled) return null;
      return getSevenHexCluster(hexLayout, config.enemyGem.centerHexId);
    }, [config.enemyGem?.enabled, config.enemyGem?.centerHexId, hexLayout]);

  const enemyHexIds = useMemo(() => {
    return enemyCluster ? enemyCluster.hexIds : new Set<number>();
  }, [enemyCluster]);

  const [smokeBurst, setSmokeBurst] = useState<SmokeBurstTrigger>(null);
  const [isEnemyDeflecting, setIsEnemyDeflecting] = useState(false);
  const lastDeflectRef = useRef(0);

  // Enemy Battle Mechanic State: HP, hurt reaction, and defeat progression
  const [enemyHp, setEnemyHp] = useState<number>(() => config.enemyGem?.maxHits ?? 25);
  const enemyHpRef = useRef<number>(config.enemyGem?.maxHits ?? 25);
  const [isEnemyHurt, setIsEnemyHurt] = useState(false);
  const [isEnemyDefeated, setIsEnemyDefeated] = useState(false);
  const isEnemyDefeatedRef = useRef(false);

  // Reset battle health when level changes or maxHits updates
  useEffect(() => {
    const hits = config.enemyGem?.maxHits ?? 25;
    setEnemyHp(hits);
    enemyHpRef.current = hits;
    setIsEnemyHurt(false);
    setIsEnemyDefeated(false);
    isEnemyDefeatedRef.current = false;
  }, [levelKey, config.enemyGem?.maxHits]);

  const triggerEnemyDeflection = useCallback((hex: HexInfo) => {
    const now = performance.now();
    if (now - lastDeflectRef.current < 260) return;
    lastDeflectRef.current = now;

    setIsEnemyDeflecting(true);
    setTimeout(() => setIsEnemyDeflecting(false), 320);

    setSmokeBurst({
      id: Date.now(),
      x: hex.offsetX,
      y: hex.offsetY,
      count: 24,
    });
    playEnemyDeflectSound(animConfig.enableSwapSound !== false);
  }, [animConfig.enableSwapSound]);

  // Active effect states
  const [swapPulseEvent, setSwapPulseEvent] = useState<SwapPulseEvent | null>(null);
  const [sparkleBurst, setSparkleBurst] = useState<SparkleEvent | null>(null);
  const [popEvents, setPopEvents] = useState<PopEvent[]>([]);
  const [poppingGems, setPoppingGems] = useState<Map<string, { stage: 'swell' | 'shrink'; color: string }>>(new Map());
  const [enteringGemIds, setEnteringGemIds] = useState<Set<string>>(new Set());
  const [spawningHexIds, setSpawningHexIds] = useState<Set<number>>(new Set());
  const spawningHexIdsRef = useRef<Set<number>>(new Set());

  const addSpawningHexes = useCallback((hexIds: number[]) => {
    hexIds.forEach((id) => spawningHexIdsRef.current.add(id));
    setSpawningHexIds((prev) => {
      const next = new Set(prev);
      hexIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const removeSpawningHexes = useCallback((hexIds: number[]) => {
    hexIds.forEach((id) => spawningHexIdsRef.current.delete(id));
    setSpawningHexIds((prev) => {
      const next = new Set(prev);
      hexIds.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  // Prevent drag interaction while chain reaction is actively popping
  const isPoppingRef = useRef(false);
  const popTimeoutsRef = useRef<number[]>([]);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      popTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
      if (shakeTimerRef.current !== null) {
        window.clearTimeout(shakeTimerRef.current);
      }
    };
  }, []);

  const immovableCount = config.enemyGem?.immovableCount ?? 3;
  const enemyEnabled = config.enemyGem?.enabled ?? false;

  // Fill hexagons across the stage with random gems (excluding the 7 hexes covered by enemy gem)
  const [gems, setGems] = useState<GemData[]>(() =>
    generateRandomGems(hexLayout, gemConfig.colors, enemyHexIds, 0, immovableCount)
  );

  // Regenerate fresh level gems only when a new level starts, or when grid/enemy layout changes
  const prevLevelRef = useRef(levelKey);
  const prevGridRadiusRef = useRef(config.gridRadius || 4);
  const prevLayoutLengthRef = useRef(hexLayout.length);
  const prevEnemyEnabledRef = useRef(enemyEnabled);
  const prevEnemyCenterIdRef = useRef(enemyCluster?.center.id ?? -1);
  const prevImmovableCountRef = useRef(immovableCount);

  useEffect(() => {
    const currentEnemyCenterId = enemyCluster?.center.id ?? -1;
    const currentGridRadius = config.gridRadius || 4;

    const levelChanged = prevLevelRef.current !== levelKey;
    const layoutChanged =
      prevGridRadiusRef.current !== currentGridRadius ||
      prevLayoutLengthRef.current !== hexLayout.length;
    const enemyChanged =
      prevEnemyEnabledRef.current !== enemyEnabled ||
      prevEnemyCenterIdRef.current !== currentEnemyCenterId;
    const immovableChanged = prevImmovableCountRef.current !== immovableCount;

    if (levelChanged || layoutChanged || enemyChanged || immovableChanged) {
      prevLevelRef.current = levelKey;
      prevGridRadiusRef.current = currentGridRadius;
      prevLayoutLengthRef.current = hexLayout.length;
      prevEnemyEnabledRef.current = enemyEnabled;
      prevEnemyCenterIdRef.current = currentEnemyCenterId;
      prevImmovableCountRef.current = immovableCount;

      // Clean up any ongoing pop sequences from previous level
      popTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
      popTimeoutsRef.current = [];
      setPoppingGems(new Map());
      setEnteringGemIds(new Set());
      setSpawningHexIds(new Set());
      spawningHexIdsRef.current.clear();
      isPoppingRef.current = false;

      const freshGems = generateRandomGems(hexLayout, gemConfig.colors, enemyHexIds, Date.now(), immovableCount);
      setGems(freshGems);
      gemsRef.current = freshGems;

      if (animConfig.enableSparkles) {
        setSparkleBurst({
          id: Date.now(),
          x: stageX,
          y: stageY,
          color: '#ff60b0',
        });
      }
    }
  }, [
    levelKey,
    config.gridRadius,
    hexLayout,
    hexLayout.length,
    enemyEnabled,
    enemyCluster?.center.id,
    enemyHexIds,
    immovableCount,
    gemConfig.colors,
    animConfig.enableSparkles,
    stageX,
    stageY,
  ]);

  // Sync color changes from config
  useEffect(() => {
    setGems((prev) =>
      prev.map((gem) => {
        if (gem.type && gem.type in gemConfig.colors) {
          const color = gemConfig.colors[gem.type as keyof typeof gemConfig.colors];
          return { ...gem, color };
        }
        return gem;
      })
    );
  }, [gemConfig.colors]);

  // Keep parent (and HexagonStage) in sync with which hexagons hold immovable enemy gems
  useEffect(() => {
    const ids = new Set<number>();
    for (const g of gems) {
      if (g.isImmovableEnemy) {
        ids.add(g.hexId);
      }
    }
    onImmovableHexIdsChange?.(ids);
  }, [gems, onImmovableHexIdsChange]);

  // Active dragging and tapped selection state
  const [draggingGemId, setDraggingGemId] = useState<string | null>(null);
  const [selectedGemId, setSelectedGemId] = useState<string | null>(null);
  const [shakingGemId, setShakingGemId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [targetHex, setTargetHex] = useState<HexInfo | null>(null);

  const draggingGemIdRef = useRef<string | null>(null);
  const selectedGemIdRef = useRef<string | null>(null);
  const dragPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDownStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const hasSwappedRef = useRef<boolean>(false);
  const initialHexIdRef = useRef<number | null>(null);
  const shakeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    draggingGemIdRef.current = draggingGemId;
  }, [draggingGemId]);

  useEffect(() => {
    selectedGemIdRef.current = selectedGemId;
  }, [selectedGemId]);

  // Keep a ref to latest gems state for high-frequency drag events
  const gemsRef = useRef(gems);
  useEffect(() => {
    gemsRef.current = gems;
  }, [gems]);

  // Easing curve generator
  const getEasingBezier = (easing: string) => {
    switch (easing) {
      case 'spring':
        return 'cubic-bezier(0.34, 1.56, 0.64, 1)';
      case 'bounce':
        return 'cubic-bezier(0.68, -0.4, 0.27, 1.45)';
      case 'easeInOut':
        return 'cubic-bezier(0.65, 0, 0.35, 1)';
      case 'easeOut':
      default:
        return 'cubic-bezier(0.16, 1, 0.3, 1)';
    }
  };

  // Convert client pointer coordinates to stage-centered coordinates
  const clientToStageCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!layerRef.current) return { x: 0, y: 0 };
      const rect = layerRef.current.getBoundingClientRect();

      const windowX = (clientX - rect.left) / viewportScale;
      const windowY = (clientY - rect.top) / viewportScale;

      const dx = windowX - stageX;
      const dy = windowY - stageY;

      if (rotation !== 0) {
        const rad = (-rotation * Math.PI) / 180;
        const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
        return { x: rx, y: ry };
      }

      return { x: dx, y: dy };
    },
    [viewportScale, stageX, stageY, rotation]
  );

  // Helper to cleanly inflict damage on the dark boss cluster without side effects in state updaters
  const damageBoss = useCallback(
    (amount: number) => {
      if (!config.enemyGem?.enabled || !enemyCluster || isEnemyDefeatedRef.current) return;
      const currentHp = enemyHpRef.current;
      const nextHp = Math.max(0, currentHp - amount);
      enemyHpRef.current = nextHp;
      setEnemyHp(nextHp);

      if (nextHp <= 0) {
        isEnemyDefeatedRef.current = true;
        setIsEnemyDefeated(true);
        playEnemyDefeatSound(animConfig.enableSwapSound !== false);
        const defeatBursts: SmokeBurstItem[] = (enemyCluster?.all || []).map((hex) => ({
          id: Date.now() + Math.random() + hex.id,
          x: hex.offsetX,
          y: hex.offsetY,
          count: 28,
        }));
        if (defeatBursts.length === 0 && enemyCluster) {
          defeatBursts.push({
            id: Date.now(),
            x: enemyCluster.center.offsetX,
            y: enemyCluster.center.offsetY,
            count: 90,
          });
        }
        setSmokeBurst(defeatBursts);
        const delay = config.enemyGem.defeatDelay ?? 1500;
        const tDefeat = window.setTimeout(() => {
          if (onStageCleared) {
            onStageCleared();
          } else {
            onNewLevel?.();
          }
        }, delay);
        popTimeoutsRef.current.push(tDefeat);
      } else {
        setIsEnemyHurt(true);
        const tHurt = window.setTimeout(() => {
          setIsEnemyHurt(false);
        }, config.enemyGem.shakeDuration ?? 400);
        popTimeoutsRef.current.push(tHurt);
        playEnemyHitSound(animConfig.enableSwapSound !== false);
        onCameraShake?.();
        setSmokeBurst({
          id: Date.now(),
          x: enemyCluster.center.offsetX,
          y: enemyCluster.center.offsetY,
          count: 24,
        });
      }
    },
    [config.enemyGem, enemyCluster, animConfig.enableSwapSound, onNewLevel, onStageCleared, onCameraShake]
  );

  // Trigger Satisfying Popping Chain Reaction when a gem is released or dropped
  const triggerPopChainReaction = useCallback(
    (droppedGem: GemData, finalHexId: number, currentGems: GemData[]) => {
      if (animConfig.enableChainPop === false) return;

      const targetType = droppedGem.type;
      if (!targetType) return;

      // Breadth-First Search (BFS) starting from dropped hexagon
      // Finds all contiguous same-type gems touching the dropped gem and each other
      const clusterMap = new Map<number, { hex: HexInfo; gem: GemData; depth: number }>();
      const visited = new Set<number>();
      const queue: { hexId: number; depth: number }[] = [{ hexId: finalHexId, depth: 0 }];
      visited.add(finalHexId);

      while (queue.length > 0) {
        const { hexId, depth } = queue.shift()!;
        const currentHex = hexLayout.find((h) => h.id === hexId);
        const gemAtHex = currentGems.find((g) => g.hexId === hexId);

        if (currentHex && gemAtHex && gemAtHex.type === targetType) {
          clusterMap.set(hexId, { hex: currentHex, gem: gemAtHex, depth });

          // Check all adjacent hexagons in the honeycomb grid
          for (const neighborHex of hexLayout) {
            if (!visited.has(neighborHex.id) && areHexagonsAdjacent(currentHex, neighborHex)) {
              const neighborGem = currentGems.find((g) => g.hexId === neighborHex.id);
              if (neighborGem && neighborGem.type === targetType) {
                visited.add(neighborHex.id);
                queue.push({ hexId: neighborHex.id, depth: depth + 1 });
              }
            }
          }
        }
      }

      const minMatch = animConfig.minMatchCount ?? 2;
      // If the cluster has matching neighbors (e.g. >= 2 gems total of the same type)
      if (clusterMap.size >= minMatch) {
        isPoppingRef.current = true;
        const clusterArray = Array.from(clusterMap.values());
        const maxDepth = Math.max(...clusterArray.map((c) => c.depth));
        const chainStepDelay = animConfig.popChainDelay ?? 110;

        // When matching 6 or more gems, give 10 coins shooting up from the initial gem that made the match
        if (clusterMap.size >= 6) {
          const initialHex = hexLayout.find((h) => h.id === finalHexId);
          const originX = stageX + (initialHex?.offsetX ?? 0);
          const originY = stageY + (initialHex?.offsetY ?? 0);
          onAwardMatchCoins?.(10, {
            x: originX,
            y: originY,
            matchCount: clusterMap.size,
          });
        }

        // BATTLE MECHANIC: Check if this match is adjacent to the evil gem's occupied territory
        if (config.enemyGem?.enabled && enemyCluster && !isEnemyDefeatedRef.current) {
          const adjacentBrokenGems = clusterArray.filter((item) =>
            Array.from(enemyHexIds).some((enemyHexId) => {
              const enemyHex = hexLayout.find((h) => h.id === enemyHexId);
              return enemyHex ? areHexagonsAdjacent(item.hex, enemyHex) : false;
            })
          );

          if (adjacentBrokenGems.length > 0) {
            const mode = config.enemyGem.damageCalculation || 'perAdjacentGem';
            const breaksCount = mode === 'perAdjacentGem' ? adjacentBrokenGems.length : 1;
            const damage = breaksCount * (config.enemyGem.damagePerMatch ?? 1);
            damageBoss(damage);
          }
        }

        // Check for adjacent immovable enemy gems to this match
        // "they're the same as the normal gems but cannot be moved. they only disappear when a match is made next to them."
        const matchHexes = clusterArray.map((c) => c.hex);
        const adjacentEnemyGems: GemData[] = [];
        const adjacentEnemyHexes: HexInfo[] = [];

        currentGems.forEach((g) => {
          if (g.isImmovableEnemy) {
            const gHex = hexLayout.find((h) => h.id === g.hexId);
            if (gHex) {
              const isTouchingMatch = matchHexes.some((mHex) => areHexagonsAdjacent(mHex, gHex));
              if (isTouchingMatch) {
                adjacentEnemyGems.push(g);
                adjacentEnemyHexes.push(gHex);
              }
            }
          }
        });

        // Group matching gems by BFS depth / chain step
        const depthGroups = new Map<number, { hex: HexInfo; gem: GemData }[]>();
        for (const item of clusterArray) {
          const list = depthGroups.get(item.depth) || [];
          list.push({ hex: item.hex, gem: item.gem });
          depthGroups.set(item.depth, list);
        }

        // Schedule cascading timed chain reaction
        for (let d = 0; d <= maxDepth; d++) {
          const itemsAtDepth = depthGroups.get(d) || [];
          if (itemsAtDepth.length === 0) continue;

          const popTime = d * chainStepDelay;
          const shrinkTime = popTime + Math.min(80, chainStepDelay * 0.75);

          // Phase 1: Swell, flash glow, sound chime, and shockwave burst
          const t1 = window.setTimeout(() => {
            playPopChime(d, animConfig.enablePopSound !== false);

            if (d === 0 && adjacentEnemyGems.length > 0) {
              playImmovableBreakSound(animConfig.enableSwapSound !== false);
              const bursts: SmokeBurstItem[] = adjacentEnemyHexes.map((hex) => ({
                id: Date.now() + Math.random() + hex.id,
                x: hex.offsetX,
                y: hex.offsetY,
                count: 34,
              }));
              setSmokeBurst(bursts);
            }

            setPoppingGems((prev) => {
              const next = new Map(prev);
              for (const it of itemsAtDepth) {
                next.set(it.gem.id, { stage: 'swell', color: it.gem.color });
              }
              if (d === 0) {
                for (const eg of adjacentEnemyGems) {
                  next.set(eg.id, { stage: 'swell', color: '#c084fc' });
                }
              }
              return next;
            });

            // Trigger Pop Shockwave & Sparkles for each popping gem
            const newEvents: PopEvent[] = itemsAtDepth.map((it, idx) => ({
              id: Date.now() + Math.random(),
              x: stageX + it.hex.offsetX,
              y: stageY + it.hex.offsetY,
              color: it.gem.color,
              count: clusterMap.size,
              isLastInChain: d === maxDepth && idx === itemsAtDepth.length - 1,
            }));

            if (d === 0) {
              adjacentEnemyHexes.forEach((eHex) => {
                newEvents.push({
                  id: Date.now() + Math.random(),
                  x: stageX + eHex.offsetX,
                  y: stageY + eHex.offsetY,
                  color: '#c084fc',
                  count: clusterMap.size,
                  isLastInChain: false,
                });
              });
            }

            setPopEvents((prev) => [...prev, ...newEvents]);
          }, popTime);

          // Phase 2: Shrink to 0 and pop away
          const t2 = window.setTimeout(() => {
            setPoppingGems((prev) => {
              const next = new Map(prev);
              for (const it of itemsAtDepth) {
                next.set(it.gem.id, { stage: 'shrink', color: it.gem.color });
              }
              if (d === maxDepth) {
                for (const eg of adjacentEnemyGems) {
                  next.set(eg.id, { stage: 'shrink', color: '#c084fc' });
                }
              }
              return next;
            });
          }, shrinkTime);

          popTimeoutsRef.current.push(t1, t2);
        }

        // Final Phase: Clear popped gems from stage, lock empty hexes, then delay before spawning new gems
        const finalDelay = (maxDepth + 1) * chainStepDelay + 140;
        const tFinal = window.setTimeout(() => {
          const poppedHexIds = new Set([
            ...clusterArray.map((c) => c.hex.id),
            ...adjacentEnemyGems.map((g) => g.hexId),
          ]);
          const hexIdList = Array.from(poppedHexIds);

          // Clear popped gems from stage so hexes are visibly empty
          setGems((prev) => prev.filter((g) => !poppedHexIds.has(g.hexId)));
          gemsRef.current = gemsRef.current.filter((g) => !poppedHexIds.has(g.hexId));
          setPoppingGems(new Map());
          isPoppingRef.current = false;

          if (animConfig.refillAfterPop !== false) {
            // Lock emptied hexagons so player cannot enter them with moving gem while waiting and spawning
            addSpawningHexes(hexIdList);

            const spawnDelay = animConfig.spawnDelay ?? 320;
            const spawnDuration = animConfig.spawnDuration ?? 420;

            const tSpawn = window.setTimeout(() => {
              // Generate fresh random gems for all emptied hexagons
              const newGems: GemData[] = hexIdList.map((hexId, idx) => {
                const randomType = WINX_GEM_TYPES[Math.floor(Math.random() * WINX_GEM_TYPES.length)];
                return {
                  id: `gem-${hexId}-${Date.now()}-${idx}`,
                  type: randomType.type,
                  name: randomType.name,
                  color: gemConfig.colors[randomType.colorKey],
                  accentColor: randomType.accentColor,
                  hexId: hexId,
                };
              });

              const newGemIds = new Set(newGems.map((g) => g.id));
              setEnteringGemIds(newGemIds);

              setGems((prev) => {
                const remaining = prev.filter((g) => !poppedHexIds.has(g.hexId));
                return [...remaining, ...newGems];
              });
              gemsRef.current = [
                ...gemsRef.current.filter((g) => !poppedHexIds.has(g.hexId)),
                ...newGems,
              ];

              // Keep hexes locked during bouncy entrance animation
              const tEnter = window.setTimeout(() => {
                setEnteringGemIds(new Set());
                removeSpawningHexes(hexIdList);
              }, spawnDuration);
              popTimeoutsRef.current.push(tEnter);
            }, spawnDelay);

            popTimeoutsRef.current.push(tSpawn);
          }
        }, finalDelay);

        popTimeoutsRef.current.push(tFinal);
      }
    },
    [
      animConfig.enableChainPop,
      animConfig.minMatchCount,
      animConfig.popChainDelay,
      animConfig.enablePopSound,
      animConfig.refillAfterPop,
      hexLayout,
      stageX,
      stageY,
      gemConfig.colors,
      config.enemyGem,
      enemyCluster,
      enemyHexIds,
      damageBoss,
      onAwardMatchCoins,
    ]
  );

  // Helper to pop and respawn gems with custom signature colors
  const popGemListWithColors = useCallback(
    (gemsToPop: GemData[], colors: string[]) => {
      if (gemsToPop.length === 0) return;
      isPoppingRef.current = true;

      // If any enemy gems are destroyed, trigger the purple/black smoke puff effect
      const enemyGemsInPop = gemsToPop.filter((g) => g.isImmovableEnemy);
      if (enemyGemsInPop.length > 0) {
        playImmovableBreakSound(animConfig.enableSwapSound !== false);
        const bursts: SmokeBurstItem[] = enemyGemsInPop.map((eg) => {
          const hex = hexLayout.find((h) => h.id === eg.hexId);
          return {
            id: Date.now() + Math.random() + (hex ? hex.id : 0),
            x: hex ? hex.offsetX : 0,
            y: hex ? hex.offsetY : 0,
            count: 34,
          };
        });
        setSmokeBurst(bursts);
      }

      setPoppingGems((prev) => {
        const next = new Map(prev);
        for (const g of gemsToPop) {
          next.set(g.id, { stage: 'swell', color: colors[0] });
        }
        return next;
      });

      const newEvents: PopEvent[] = gemsToPop.map((g, idx) => {
        const hex = hexLayout.find((h) => h.id === g.hexId);
        return {
          id: Date.now() + Math.random(),
          x: stageX + (hex ? hex.offsetX : 0),
          y: stageY + (hex ? hex.offsetY : 0),
          color: colors[idx % colors.length],
          count: gemsToPop.length,
          isLastInChain: idx === gemsToPop.length - 1,
        };
      });
      setPopEvents((prev) => [...prev, ...newEvents]);

      const t1 = window.setTimeout(() => {
        setPoppingGems((prev) => {
          const next = new Map(prev);
          for (const g of gemsToPop) {
            next.set(g.id, { stage: 'shrink', color: colors[0] });
          }
          return next;
        });
      }, 110);

      const t2 = window.setTimeout(() => {
        const poppedHexIds = new Set(gemsToPop.map((g) => g.hexId));
        const hexIdList = Array.from(poppedHexIds);

        // Clear popped gems from stage so hexes are visibly empty
        setGems((prev) => prev.filter((g) => !poppedHexIds.has(g.hexId)));
        gemsRef.current = gemsRef.current.filter((g) => !poppedHexIds.has(g.hexId));
        setPoppingGems(new Map());
        isPoppingRef.current = false;

        // Lock emptied hexagons so player cannot enter them with moving gem while waiting and spawning
        addSpawningHexes(hexIdList);

        const spawnDelay = animConfig.spawnDelay ?? 320;
        const spawnDuration = animConfig.spawnDuration ?? 420;

        const tSpawn = window.setTimeout(() => {
          const newGems: GemData[] = gemsToPop.map((oldGem, idx) => {
            const randomType = WINX_GEM_TYPES[Math.floor(Math.random() * WINX_GEM_TYPES.length)];
            return {
              id: `gem-${oldGem.hexId}-${Date.now()}-${idx}`,
              type: randomType.type,
              name: randomType.name,
              color: gemConfig.colors[randomType.colorKey],
              accentColor: randomType.accentColor,
              hexId: oldGem.hexId,
            };
          });

          const newGemIds = new Set(newGems.map((g) => g.id));
          setEnteringGemIds(newGemIds);

          setGems((prev) => {
            const remaining = prev.filter((g) => !poppedHexIds.has(g.hexId));
            return [...remaining, ...newGems];
          });
          gemsRef.current = [
            ...gemsRef.current.filter((g) => !poppedHexIds.has(g.hexId)),
            ...newGems,
          ];

          // Keep hexes locked during bouncy entrance animation
          const tEnter = window.setTimeout(() => {
            setEnteringGemIds(new Set());
            removeSpawningHexes(hexIdList);
          }, spawnDuration);
          popTimeoutsRef.current.push(tEnter);
        }, spawnDelay);

        popTimeoutsRef.current.push(tSpawn);
      }, 240);

      popTimeoutsRef.current.push(t1, t2);
    },
    [hexLayout, stageX, stageY, gemConfig.colors, animConfig.spawnDelay, animConfig.spawnDuration, addSpawningHexes, removeSpawningHexes]
  );

  // 1. Chatta’s Bloom Pop (Green / blue) - 7-Hex Bloom Explosion
  const executeChattaBloom = useCallback(
    (targetHexId?: number) => {
      const centerId = targetHexId ?? (enemyCluster ? enemyCluster.center.id : 0);
      const centerHex = hexLayout.find((h) => h.id === centerId);
      if (!centerHex) return;

      const targetHexIds = new Set<number>();
      targetHexIds.add(centerId);
      for (const h of hexLayout) {
        if (areHexagonsAdjacent(centerHex, h)) {
          targetHexIds.add(h.id);
        }
      }

      playDragonFlameSound(animConfig.enablePopSound !== false);
      onCameraShake?.();

      if (config.enemyGem?.enabled && enemyCluster && !isEnemyDefeatedRef.current) {
        const hitsEnemy = Array.from(targetHexIds).some(
          (tid) =>
            enemyHexIds.has(tid) ||
            Array.from(enemyHexIds).some((ehid) => {
              const th = hexLayout.find((h) => h.id === tid);
              const eh = hexLayout.find((h) => h.id === ehid);
              return th && eh ? areHexagonsAdjacent(th, eh) : false;
            })
        );
        if (hitsEnemy) damageBoss(2);
      }

      const gemsToBlast = gemsRef.current.filter(
        (g) => targetHexIds.has(g.hexId) && !enemyHexIds.has(g.hexId)
      );
      popGemListWithColors(gemsToBlast, ['#10b981', '#0284c7', '#22c55e', '#38bdf8']);
    },
    [hexLayout, enemyCluster, enemyHexIds, config.enemyGem?.enabled, animConfig.enablePopSound, onCameraShake, damageBoss, popGemListWithColors]
  );

  // 2. Lockette’s Time Portal (Light blue / lilac / pink) - Freezes time for 5 seconds
  const executeLocketteTimePortal = useCallback(() => {
    playTimeFreezeSound(animConfig.enablePopSound !== false);
    onCameraShake?.();
    if (animConfig.enableSparkles) {
      setSparkleBurst({
        id: Date.now(),
        x: stageX,
        y: stageY,
        color: '#38bdf8',
      });
    }
  }, [animConfig.enablePopSound, animConfig.enableSparkles, onCameraShake, stageX, stageY]);

  // 3. Amore’s Heart Pop (Pink / green) - Sweet Heart Charm
  const executeAmoreHeart = useCallback(() => {
    const currentGems = gemsRef.current.filter((g) => !enemyHexIds.has(g.hexId));
    if (currentGems.length === 0) return;

    playHeartCharmSound(animConfig.enablePopSound !== false);
    onCameraShake?.();

    if (config.enemyGem?.enabled && enemyCluster && !isEnemyDefeatedRef.current) {
      damageBoss(1);
    }

    // Target pink/green gems, or the top 8 romantic gems
    const loveGems = currentGems.filter(
      (g) => g.type === 'bloom' || g.type === 'flora' || g.type === 'tecna'
    );
    const gemsToPop = loveGems.length >= 4 ? loveGems : currentGems.slice(0, 8);
    popGemListWithColors(gemsToPop, ['#ec4899', '#22c55e', '#f472b6', '#4ade80']);
  }, [enemyHexIds, animConfig.enablePopSound, onCameraShake, config.enemyGem?.enabled, enemyCluster, damageBoss, popGemListWithColors]);

  // 4. Tune’s Harmony Pop (Blue / gray / violet) - Harmonic Resonance
  const executeTuneHarmony = useCallback(() => {
    const currentGems = gemsRef.current.filter((g) => !enemyHexIds.has(g.hexId));
    if (currentGems.length === 0) return;

    // Find the most abundant gem color on the stage
    const typeCounts: Record<string, number> = {};
    for (const g of currentGems) {
      if (g.type) typeCounts[g.type] = (typeCounts[g.type] || 0) + 1;
    }

    let dominantType: (typeof WINX_GEM_TYPES)[number]['type'] = WINX_GEM_TYPES[0].type;
    let maxCount = -1;
    for (const [t, c] of Object.entries(typeCounts)) {
      if (c > maxCount) {
        maxCount = c;
        dominantType = t as (typeof WINX_GEM_TYPES)[number]['type'];
      }
    }

    const gemsToClear = currentGems.filter((g) => g.type === dominantType);
    if (gemsToClear.length === 0) return;

    playPrismRaySound(animConfig.enablePopSound !== false);
    onCameraShake?.();

    if (config.enemyGem?.enabled && enemyCluster && !isEnemyDefeatedRef.current) {
      damageBoss(1);
    }

    popGemListWithColors(gemsToClear, ['#3b82f6', '#94a3b8', '#8b5cf6', '#a78bfa']);
  }, [enemyHexIds, animConfig.enablePopSound, onCameraShake, config.enemyGem?.enabled, enemyCluster, damageBoss, popGemListWithColors]);

  // 5. Piff’s Dream Pop (Pink / cream) - Sweet Slumber
  const executePiffSlumber = useCallback(() => {
    const currentGems = gemsRef.current.filter((g) => !enemyHexIds.has(g.hexId));
    playDreamLullabySound(animConfig.enablePopSound !== false);
    onCameraShake?.();

    // Directly put the boss to sleep for 2 damage!
    if (config.enemyGem?.enabled && enemyCluster && !isEnemyDefeatedRef.current) {
      damageBoss(2);
    }

    // Clear nearby surrounding gems in soft cream & pink bursts
    const gemsToClear = currentGems.slice(0, 9);
    popGemListWithColors(gemsToClear, ['#f472b6', '#fef08a', '#fb7185', '#fef3c7']);
  }, [enemyHexIds, animConfig.enablePopSound, onCameraShake, config.enemyGem?.enabled, enemyCluster, damageBoss, popGemListWithColors]);

  useImperativeHandle(ref, () => ({
    executeChattaBloom,
    executeLocketteTimePortal,
    executeLockettePortal: executeLocketteTimePortal,
    executeAmoreHeart,
    executeTuneHarmony,
    executePiffSlumber,
  }));

  // Drops the gem into the hex it is nearest to at that precise moment and halts dragging
  const dropCurrentGemAtNearestHex = useCallback(() => {
    const currentDraggingId = draggingGemIdRef.current;
    if (!currentDraggingId) return;

    const currentGems = gemsRef.current;
    const draggedGem = currentGems.find((g) => g.id === currentDraggingId);
    if (!draggedGem) {
      setDraggingGemId(null);
      draggingGemIdRef.current = null;
      setTargetHex(null);
      onHoverTargetHex?.(null);
      onDragStateChange?.(false);
      return;
    }

    const currentCoords = dragPosRef.current;
    // Find the nearest hexagon to current pointer position at this precise moment
    const nearest = findNearestHexagon(currentCoords.x, currentCoords.y, hexLayout);
    let targetNearestHex = nearest?.hex ?? hexLayout.find((h) => h.id === draggedGem.hexId);
    if (targetNearestHex) {
      const tid = targetNearestHex.id;
      if (
        enemyHexIds.has(tid) ||
        spawningHexIdsRef.current.has(tid) ||
        currentGems.some((g) => g.hexId === tid && g.isImmovableEnemy)
      ) {
        targetNearestHex = hexLayout.find((h) => h.id === draggedGem.hexId);
      }
    }

    let finalHexId = draggedGem.hexId;
    let finalBoardGems = currentGems;

    if (
      targetNearestHex &&
      targetNearestHex.id !== draggedGem.hexId &&
      !enemyHexIds.has(targetNearestHex.id) &&
      !spawningHexIdsRef.current.has(targetNearestHex.id)
    ) {
      const currentHomeHex = hexLayout.find((h) => h.id === draggedGem.hexId);
      const isAdjacent = currentHomeHex ? areHexagonsAdjacent(currentHomeHex, targetNearestHex) : false;

      if (!animConfig.enforceAdjacency || isAdjacent) {
        const destinationHexId = targetNearestHex.id;
        const targetGem = currentGems.find((g) => g.hexId === destinationHexId);

        if (targetGem && !targetGem.isImmovableEnemy) {
          playSwapSound(animConfig.enableSwapSound !== false);

          finalBoardGems = currentGems.map((g) => {
            if (g.id === draggedGem.id) return { ...g, hexId: destinationHexId };
            if (g.id === targetGem.id) return { ...g, hexId: draggedGem.hexId };
            return g;
          });
          setGems(finalBoardGems);
          gemsRef.current = finalBoardGems;

          if (animConfig.swapPulseGlow && currentHomeHex) {
            setSwapPulseEvent({
              id: Date.now(),
              fromX: stageX + currentHomeHex.offsetX,
              fromY: stageY + currentHomeHex.offsetY,
              toX: stageX + targetNearestHex.offsetX,
              toY: stageY + targetNearestHex.offsetY,
              colorFrom: draggedGem.color,
              colorTo: targetGem.color,
            });
          }

          if (animConfig.enableSparkles) {
            setSparkleBurst({
              id: Date.now(),
              x: stageX + targetNearestHex.offsetX,
              y: stageY + targetNearestHex.offsetY,
              color: draggedGem.color,
            });
          }

          finalHexId = destinationHexId;
        } else if (!targetGem) {
          finalBoardGems = currentGems.map((g) =>
            g.id === draggedGem.id ? { ...g, hexId: destinationHexId } : g
          );
          setGems(finalBoardGems);
          gemsRef.current = finalBoardGems;
          finalHexId = destinationHexId;
        }
      }
    }

    // Immediately cancel dragging so user cannot continue dragging it
    setDraggingGemId(null);
    draggingGemIdRef.current = null;
    setTargetHex(null);
    onHoverTargetHex?.(null);
    onDragStateChange?.(false);

    // Trigger chain reaction check on dropped gem
    const releasedGemData = finalBoardGems.find((g) => g.id === draggedGem.id) || draggedGem;
    setTimeout(() => {
      triggerPopChainReaction(releasedGemData, finalHexId, finalBoardGems);
    }, 16);
  }, [
    hexLayout,
    animConfig.enforceAdjacency,
    animConfig.enableSwapSound,
    animConfig.swapPulseGlow,
    animConfig.enableSparkles,
    stageX,
    stageY,
    onHoverTargetHex,
    onDragStateChange,
    triggerPopChainReaction,
  ]);

  // Connect dropCurrentGemAtNearestHex to parent onEnergyDepletedRef
  useEffect(() => {
    if (onEnergyDepletedRef) {
      onEnergyDepletedRef.current = dropCurrentGemAtNearestHex;
    }
    return () => {
      if (onEnergyDepletedRef) {
        onEnergyDepletedRef.current = null;
      }
    };
  }, [onEnergyDepletedRef, dropCurrentGemAtNearestHex]);

  // Start dragging a gem or trigger targeting powerup if active
  const handlePointerDown = (gem: GemData, e: React.PointerEvent) => {
    if (activePowerup === 'chatta') {
      e.preventDefault();
      e.stopPropagation();
      executeChattaBloom(gem.hexId);
      onPowerupUsed?.('chatta');
      setHoveredBlastHexId(null);
      return;
    }

    // Block interaction if trying to drag an immovable enemy gem
    if (gem.isImmovableEnemy) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedGemId(null);
      selectedGemIdRef.current = null;
      playEnemyDeflectSound(animConfig.enableSwapSound !== false);
      onCameraShake?.();
      const hex = hexLayout.find((h) => h.id === gem.hexId);
      if (hex) {
        setSmokeBurst({
          id: Date.now(),
          x: hex.offsetX,
          y: hex.offsetY,
          count: 14,
        });
      }
      setShakingGemId(gem.id);
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = window.setTimeout(() => {
        setShakingGemId(null);
        shakeTimerRef.current = null;
      }, 320);
      playGemTapDrrrSound(animConfig.enableSwapSound !== false);
      return;
    }

    if (isPoppingRef.current) return;
    if (spawningHexIdsRef.current.has(gem.hexId) || enteringGemIds.has(gem.id)) return;
    if (canStartDrag && !canStartDrag()) return;

    e.preventDefault();
    e.stopPropagation();

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const stageCoord = clientToStageCoords(e.clientX, e.clientY);
    pointerDownStartRef.current = { x: stageCoord.x, y: stageCoord.y };
    hasMovedRef.current = false;
    hasSwappedRef.current = false;
    initialHexIdRef.current = gem.hexId;

    setDraggingGemId(gem.id);
    draggingGemIdRef.current = gem.id;
    setDragPos(stageCoord);
    dragPosRef.current = stageCoord;
    setTargetHex(null);
    onDragStateChange?.(true);
  };

  // Dragging movement with automatic live swap without releasing mouse button
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingGemId || isPoppingRef.current) return;
      e.preventDefault();

      const stageCoord = clientToStageCoords(e.clientX, e.clientY);
      setDragPos(stageCoord);
      dragPosRef.current = stageCoord;

      if (pointerDownStartRef.current) {
        const dist = Math.hypot(
          stageCoord.x - pointerDownStartRef.current.x,
          stageCoord.y - pointerDownStartRef.current.y
        );
        if (dist > 5) {
          hasMovedRef.current = true;
          if (selectedGemIdRef.current) {
            setSelectedGemId(null);
            selectedGemIdRef.current = null;
          }
        }
      }

      const currentGems = gemsRef.current;
      const draggedGem = currentGems.find((g) => g.id === draggingGemId);
      if (!draggedGem) return;

      const currentHomeHex = hexLayout.find((h) => h.id === draggedGem.hexId);
      if (!currentHomeHex) return;

      // Find closest hexagon within snap distance
      const nearest = findNearestHexagon(
        stageCoord.x,
        stageCoord.y,
        hexLayout,
        animConfig.snapDistance
      );

      if (nearest) {
        // Block interaction if nearest hex is inside the 7-hex enemy gem territory
        if (enemyHexIds.has(nearest.hex.id)) {
          triggerEnemyDeflection(nearest.hex);
          setTargetHex(null);
          onHoverTargetHex?.(null);
          return;
        }

        // Block interaction if nearest hex contains an immovable enemy gem
        const gemAtNearest = currentGems.find((g) => g.hexId === nearest.hex.id);
        if (gemAtNearest?.isImmovableEnemy) {
          triggerEnemyDeflection(nearest.hex);
          setTargetHex(null);
          onHoverTargetHex?.(null);
          return;
        }

        // Block interaction if nearest hex is currently empty/waiting/spawning new gems
        if (spawningHexIdsRef.current.has(nearest.hex.id)) {
          setTargetHex(null);
          onHoverTargetHex?.(null);
          return;
        }

        const isSelf = nearest.hex.id === draggedGem.hexId;
        const isAdjacent = areHexagonsAdjacent(currentHomeHex, nearest.hex);

        if (!isSelf && (!animConfig.enforceAdjacency || isAdjacent)) {
          const destinationHexId = nearest.hex.id;
          const previousHexId = draggedGem.hexId;
          const targetGem = currentGems.find((g) => g.hexId === destinationHexId);

          if (animConfig.autoSwapOnDrag !== false) {
            // AUTOMATIC LIVE SWAP: check energy first!
            if (targetGem) {
              const swapResult = onAttemptSwap ? onAttemptSwap() : { allowed: true, ranOut: false };
              if (!swapResult.allowed) {
                // Energy depleted! Swap is blocked, and gem is dropped into nearest hex!
                dropCurrentGemAtNearestHex();
                return;
              }

              // Play tactile crystalline swap sound
              playSwapSound(animConfig.enableSwapSound !== false);
              hasSwappedRef.current = true;

              const updatedGems = currentGems.map((g) => {
                if (g.id === draggedGem.id) {
                  return { ...g, hexId: destinationHexId };
                }
                if (g.id === targetGem.id) {
                  return { ...g, hexId: previousHexId };
                }
                return g;
              });
              setGems(updatedGems);
              gemsRef.current = updatedGems;

              // Trigger Swap Pulse Effect
              if (animConfig.swapPulseGlow) {
                setSwapPulseEvent({
                  id: Date.now(),
                  fromX: stageX + currentHomeHex.offsetX,
                  fromY: stageY + currentHomeHex.offsetY,
                  toX: stageX + nearest.hex.offsetX,
                  toY: stageY + nearest.hex.offsetY,
                  colorFrom: draggedGem.color,
                  colorTo: targetGem.color,
                });
              }

              // Trigger Winx Pixie Dust Sparkles Burst
              if (animConfig.enableSparkles) {
                setSparkleBurst({
                  id: Date.now(),
                  x: stageX + nearest.hex.offsetX,
                  y: stageY + nearest.hex.offsetY,
                  color: draggedGem.color,
                });
              }

              // If energy ran out from this swap, drop gem into destination hex and terminate dragging immediately!
              if (swapResult.ranOut) {
                setDraggingGemId(null);
                draggingGemIdRef.current = null;
                setTargetHex(null);
                onHoverTargetHex?.(null);
                onDragStateChange?.(false);

                const releasedGemData = updatedGems.find((g) => g.id === draggedGem.id) || draggedGem;
                setTimeout(() => {
                  triggerPopChainReaction(releasedGemData, destinationHexId, updatedGems);
                }, 16);
                return;
              }
            } else {
              // Dragged into an adjacent empty hexagon: claim new home
              hasSwappedRef.current = true;
              const updatedGems = currentGems.map((g) =>
                g.id === draggedGem.id ? { ...g, hexId: destinationHexId } : g
              );
              setGems(updatedGems);
              gemsRef.current = updatedGems;
            }

            setTargetHex(null);
            onHoverTargetHex?.(null);
          } else {
            // Manual release mode
            setTargetHex(nearest.hex);
            onHoverTargetHex?.(nearest.hex.id);
          }
        } else if (isSelf) {
          setTargetHex(null);
          onHoverTargetHex?.(null);
        }
      } else {
        setTargetHex(null);
        onHoverTargetHex?.(null);
      }
    },
    [
      draggingGemId,
      clientToStageCoords,
      hexLayout,
      animConfig.snapDistance,
      animConfig.enforceAdjacency,
      animConfig.autoSwapOnDrag,
      animConfig.swapPulseGlow,
      animConfig.enableSparkles,
      stageX,
      stageY,
      onHoverTargetHex,
      onAttemptSwap,
      dropCurrentGemAtNearestHex,
      triggerPopChainReaction,
      onDragStateChange,
      enemyHexIds,
      triggerEnemyDeflection,
    ]
  );

  // Drop / release: gem smoothly snaps into its current home hexagon, then triggers chain pop
  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!draggingGemId) return;
      e.preventDefault();

      let finalHexId: number | null = null;
      let finalBoardGems = gemsRef.current;
      const draggedGem = finalBoardGems.find((g) => g.id === draggingGemId);

      // If manual mode was used without autoSwap:
      if (animConfig.autoSwapOnDrag === false && targetHex !== null && !enemyHexIds.has(targetHex.id)) {
        const destinationHexId = targetHex.id;
        if (draggedGem) {
          const otherGem = finalBoardGems.find((g) => g.hexId === destinationHexId);
          const originalHex = hexLayout.find((h) => h.id === draggedGem.hexId);

          if (otherGem) {
            if (otherGem.isImmovableEnemy) {
              setDraggingGemId(null);
              draggingGemIdRef.current = null;
              setTargetHex(null);
              onHoverTargetHex?.(null);
              onDragStateChange?.(false);
              return;
            }

            const swapResult = onAttemptSwap ? onAttemptSwap() : { allowed: true, ranOut: false };
            if (!swapResult.allowed) {
              // Energy depleted! Cancel swap and drop at current hex
              setDraggingGemId(null);
              draggingGemIdRef.current = null;
              setTargetHex(null);
              onHoverTargetHex?.(null);
              onDragStateChange?.(false);
              return;
            }

            playSwapSound(animConfig.enableSwapSound !== false);

            finalBoardGems = finalBoardGems.map((g) => {
              if (g.id === draggedGem.id) return { ...g, hexId: destinationHexId };
              if (g.id === otherGem.id) return { ...g, hexId: draggedGem.hexId };
              return g;
            });
            setGems(finalBoardGems);
            gemsRef.current = finalBoardGems;

            if (animConfig.swapPulseGlow && originalHex) {
              setSwapPulseEvent({
                id: Date.now(),
                fromX: stageX + originalHex.offsetX,
                fromY: stageY + originalHex.offsetY,
                toX: stageX + targetHex.offsetX,
                toY: stageY + targetHex.offsetY,
                colorFrom: draggedGem.color,
                colorTo: otherGem.color,
              });
            }
          } else {
            finalBoardGems = finalBoardGems.map((g) =>
              g.id === draggedGem.id ? { ...g, hexId: destinationHexId } : g
            );
            setGems(finalBoardGems);
            gemsRef.current = finalBoardGems;
          }

          finalHexId = destinationHexId;

          if (animConfig.enableSparkles) {
            setSparkleBurst({
              id: Date.now(),
              x: stageX + targetHex.offsetX,
              y: stageY + targetHex.offsetY,
              color: draggedGem.color,
            });
          }
        }
      } else if (draggedGem) {
        finalHexId = draggedGem.hexId;
      }

      setDraggingGemId(null);
      draggingGemIdRef.current = null;
      setTargetHex(null);
      onHoverTargetHex?.(null);
      onDragStateChange?.(false);

      // Tap handling:
      // Tapping a gem should NOT cause it to pop. Tapping should just shake it with a subtle "drrr" sound.
      if (!hasMovedRef.current && !hasSwappedRef.current && draggedGem) {
        setShakingGemId(draggedGem.id);
        if (shakeTimerRef.current !== null) {
          window.clearTimeout(shakeTimerRef.current);
        }
        shakeTimerRef.current = window.setTimeout(() => {
          setShakingGemId(null);
          shakeTimerRef.current = null;
        }, 320);

        playGemTapDrrrSound(animConfig.enableSwapSound !== false);

        setSelectedGemId(null);
        selectedGemIdRef.current = null;
        return;
      }

      setSelectedGemId(null);
      selectedGemIdRef.current = null;

      // Trigger chain reaction check on dropped gem only if an actual swap occurred
      if (
        draggedGem &&
        finalHexId !== null &&
        (hasSwappedRef.current || finalHexId !== initialHexIdRef.current)
      ) {
        const releasedGemData = finalBoardGems.find((g) => g.id === draggedGem.id) || draggedGem;
        // Run check on next microtask so state coordinates settle cleanly
        setTimeout(() => {
          triggerPopChainReaction(releasedGemData, finalHexId!, finalBoardGems);
        }, 16);
      }
    },
    [
      draggingGemId,
      targetHex,
      animConfig.autoSwapOnDrag,
      animConfig.swapPulseGlow,
      animConfig.enableSparkles,
      animConfig.enableSwapSound,
      hexLayout,
      stageX,
      stageY,
      onHoverTargetHex,
      triggerPopChainReaction,
      onAttemptSwap,
      onDragStateChange,
    ]
  );

  useEffect(() => {
    if (draggingGemId) {
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    }
  }, [draggingGemId, handlePointerMove, handlePointerUp]);

  const isTargetingActive = activePowerup === 'chatta';

  const targetingHexes = useMemo(() => {
    if (!isTargetingActive || hoveredBlastHexId === null) return [];
    const centerHex = hexLayout.find((h) => h.id === hoveredBlastHexId);
    if (!centerHex) return [];
    const list = [centerHex];
    for (const h of hexLayout) {
      if (h.id !== centerHex.id && areHexagonsAdjacent(centerHex, h)) {
        list.push(h);
      }
    }
    return list;
  }, [isTargetingActive, hoveredBlastHexId, hexLayout]);

  return (
    <div
      ref={layerRef}
      onPointerMove={(e) => {
        if (isTargetingActive) {
          const stageCoord = clientToStageCoords(e.clientX, e.clientY);
          const nearest = findNearestHexagon(stageCoord.x, stageCoord.y, hexLayout);
          setHoveredBlastHexId(nearest?.hex.id ?? null);
        }
      }}
      onPointerDown={(e) => {
        if (isTargetingActive) {
          e.preventDefault();
          e.stopPropagation();
          const stageCoord = clientToStageCoords(e.clientX, e.clientY);
          const nearest = findNearestHexagon(stageCoord.x, stageCoord.y, hexLayout);
          const targetId = nearest?.hex.id ?? (enemyCluster ? enemyCluster.center.id : 0);
          if (activePowerup === 'chatta') {
            executeChattaBloom(targetId);
            onPowerupUsed?.('chatta');
          }
          setHoveredBlastHexId(null);
        }
      }}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: isTargetingActive ? 'auto' : 'none',
        cursor: isTargetingActive ? 'crosshair' : 'default',
        zIndex: 20,
      }}
    >
      {/* Separated Swapping Effects (Pulse ripples, target indicator) */}
      <SwapEffect
        swapEvent={swapPulseEvent}
        targetHexCoord={
          targetHex ? { x: stageX + targetHex.offsetX, y: stageY + targetHex.offsetY } : null
        }
        enabled={animConfig.swapPulseGlow}
      />

      {/* Separated Pixie Sparkle Particle Burst */}
      <PixieSparkles burst={sparkleBurst} enabled={animConfig.enableSparkles} />

      {/* Separated Chain Reaction Pop Effect (Shockwaves, Star Sparkles, Score Badges) */}
      <PopEffect popEvents={popEvents} enabled={animConfig.enableChainPop !== false} />

      {/* Ominous Black / Dark Purple Smoke Particles billowing from Enemy Gems & Boss */}
      {(config.enemyGem?.enabled || (config.enemyGem?.immovableCount ?? 0) > 0 || smokeBurst !== null) && (
        <EnemySmokeParticles
          clusterHexes={config.enemyGem?.enabled && enemyCluster ? enemyCluster.all : []}
          stageX={stageX}
          stageY={stageY}
          rotation={rotation}
          enabled={config.enemyGem?.enableSmoke !== false}
          intensity={config.enemyGem?.smokeIntensity ?? 75}
          burstTrigger={smokeBurst}
          baseColor={config.enemyGem?.color || '#3b0764'}
          shrinkRatio={isEnemyDefeated ? 0 : enemyHp / Math.max(1, config.enemyGem?.maxHits ?? 25)}
          isDefeated={isEnemyDefeated}
        />
      )}

      {/* Gems container centered and rotated with stage */}
      <div
        style={{
          position: 'absolute',
          left: `${stageX}px`,
          top: `${stageY}px`,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: '0 0',
          width: 0,
          height: 0,
        }}
      >
        {/* Thematic Targeting Reticle for Chatta (Green/Blue) or Lockette (Light Blue/Lilac/Pink) */}
        {isTargetingActive &&
          targetingHexes.map((hex, idx) => {
            const isChatta = activePowerup === 'chatta';
            const primaryColor = isChatta ? '#10b981' : '#38bdf8';
            const secondaryColor = isChatta ? '#0284c7' : '#c084fc';
            const bgPrimary = isChatta ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)';
            const bgSecondary = isChatta ? 'rgba(2, 132, 199, 0.16)' : 'rgba(192, 132, 252, 0.18)';
            const glow = isChatta
              ? '0 0 25px rgba(16,185,129,0.9), inset 0 0 15px rgba(2,132,199,0.5)'
              : '0 0 25px rgba(56,189,248,0.9), inset 0 0 15px rgba(244,114,182,0.5)';

            return (
              <div
                key={`reticle-hex-${hex.id}`}
                style={{
                  position: 'absolute',
                  left: `${hex.offsetX}px`,
                  top: `${hex.offsetY}px`,
                  transform: 'translate(-50%, -50%)',
                  width: `${hexRadius * 1.85}px`,
                  height: `${hexRadius * 1.85}px`,
                  borderRadius: '9999px',
                  border: idx === 0 ? `2.5px solid ${primaryColor}` : `2px dashed ${secondaryColor}`,
                  backgroundColor: idx === 0 ? bgPrimary : bgSecondary,
                  boxShadow: idx === 0 ? glow : `0 0 12px ${secondaryColor}`,
                  pointerEvents: 'none',
                  zIndex: 38,
                }}
                className="animate-pulse flex items-center justify-center"
              >
                {idx === 0 && (
                  <span className="text-[12px] font-bold text-white tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                    {isChatta ? '🌿' : '🌀'}
                  </span>
                )}
              </div>
            );
          })}

        {/* The 1 Grand Monolithic Dark Purple Enemy Gem */}
        {config.enemyGem?.enabled && enemyCluster && (
          <EnemyGemItem
            centerHex={enemyCluster.center}
            hexRadius={hexRadius}
            config={config.enemyGem}
            currentHp={enemyHp}
            maxHp={config.enemyGem.maxHits ?? 25}
            isHurt={isEnemyHurt}
            isDefeated={isEnemyDefeated}
            isDeflecting={isEnemyDeflecting}
            onEnemyClick={() => {
              if (isEnemyDefeated) return;
              if (activePowerup === 'chatta') {
                executeChattaBloom(enemyCluster.center.id);
                onPowerupUsed?.('chatta');
                setHoveredBlastHexId(null);
                return;
              }
              // Manual click deals 1 damage (tactile test battle action)
              damageBoss(1);
            }}
          />
        )}

        {/* Soft Touch Contact Ring directly beneath the finger on the stage */}
        {draggingGemId && (
          <div
            style={{
              position: 'absolute',
              left: `${dragPos.x}px`,
              top: `${dragPos.y}px`,
              transform: 'translate(-50%, -50%)',
              width: `${hexRadius * 1.3}px`,
              height: `${hexRadius * 1.3}px`,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 50%, transparent 70%)',
              border: '1.5px dashed rgba(255,255,255,0.45)',
              boxShadow: '0 0 16px rgba(255,255,255,0.3)',
              pointerEvents: 'none',
              zIndex: 22,
            }}
            className="animate-pulse"
          />
        )}

        {gems.map((gem) => {
          const isDragging = draggingGemId === gem.id;
          const isSelected = selectedGemId === gem.id;
          const isTappedOrActive = isDragging || isSelected;

          const hex = hexLayout.find((h) => h.id === gem.hexId);
          const currentX = isDragging ? dragPos.x : hex ? hex.offsetX : 0;

          // When tapped, clicked, or dragged, automatically move UP by tapLiftOffsetY (e.g. -55px)
          // so the gem floats cleanly above the finger and remains fully visible!
          const tapLiftY = isTappedOrActive && !gem.isImmovableEnemy ? (animConfig.tapLiftOffsetY ?? -55) : 0;
          const currentY = (isDragging ? dragPos.y : hex ? hex.offsetY : 0) + tapLiftY;

          const poppingState = poppingGems.get(gem.id);
          const isEntering = enteringGemIds.has(gem.id);

          let gemScale = 1;
          let gemOpacity = 1;
          let gemFilter = 'none';

          if (isTappedOrActive && !gem.isImmovableEnemy) {
            gemScale = animConfig.tapScale ?? 1.30;
            gemFilter = `drop-shadow(0 0 18px ${gem.color}) drop-shadow(0 14px 26px rgba(0,0,0,0.65))`;
          }

          if (poppingState) {
            if (poppingState.stage === 'swell') {
              gemScale = 1.38;
              gemFilter = `brightness(1.85) drop-shadow(0 0 22px ${poppingState.color})`;
            } else if (poppingState.stage === 'shrink') {
              gemScale = 0;
              gemOpacity = 0;
            }
          }

          const transitionStyle = isDragging
            ? 'none'
            : poppingState
            ? poppingState.stage === 'swell'
              ? 'transform 80ms ease-out, filter 80ms ease-out'
              : 'transform 110ms cubic-bezier(0.55, 0, 1, 0.45), opacity 90ms ease-in'
            : isEntering
            ? 'none'
            : isSelected
            ? `transform ${animConfig.tapLiftTransition ?? 180}ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 180ms ease-out`
            : `transform ${animConfig.duration}ms ${getEasingBezier(animConfig.easing)}`;

          const spawnAnim = isEntering
            ? `gemSpawnBounce ${animConfig.spawnDuration ?? 420}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`
            : undefined;

          return (
            <div
              key={gem.id}
              onPointerDown={(e) => handlePointerDown(gem, e)}
              style={
                {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: isEntering
                    ? undefined
                    : `translate(${currentX}px, ${currentY}px) translate(-50%, -50%) scale(${gemScale})`,
                  animation: spawnAnim,
                  '--target-x': `${currentX}px`,
                  '--target-y': `${currentY}px`,
                  opacity: isEntering ? undefined : gemOpacity,
                  filter: gemFilter,
                  transition: transitionStyle,
                  pointerEvents: poppingState || isEntering ? 'none' : 'auto',
                  zIndex: isDragging ? 45 : isSelected ? 40 : poppingState ? 30 : 25,
                  touchAction: 'none',
                } as React.CSSProperties
              }
            >
              <div className={shakingGemId === gem.id ? 'animate-gem-drrr-shake' : ''}>
                <GemItem
                  id={gem.id}
                  name={gem.name}
                  type={gem.type}
                  color={gem.color}
                  accentColor={gem.accentColor}
                  isDragging={isDragging}
                  isSelected={isSelected}
                  config={gemConfig}
                  dragScale={1}
                  tapScale={1}
                  isImmovableEnemy={gem.isImmovableEnemy}
                  smallEnemySize={config.enemyGem?.smallEnemySize}
                  smallEnemyRotation={config.enemyGem?.smallEnemyRotation ?? 30}
                  enemyImageUrl={config.enemyGem?.imageUrl}
                  enableEnemyPulsate={config.enemyGem?.enablePulsate ?? true}
                  enemyPulseSpeed={config.enemyGem?.pulseSpeed ?? 2.5}
                  enemyPulseScale={config.enemyGem?.pulseScale ?? 1.06}
                  smallEnemyRotate={config.enemyGem?.smallEnemyRotate ?? true}
                  smallEnemyRotateSpeed={config.enemyGem?.smallEnemyRotateSpeed ?? 16}
                  smallEnemyRotateDirection={config.enemyGem?.smallEnemyRotateDirection ?? 'clockwise'}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Keyframes for bouncy gem spawning and tactile tap shake */}
      <style>{`
        @keyframes gemDrrrShake {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          15% {
            transform: translateX(-5px) rotate(-3.5deg);
          }
          30% {
            transform: translateX(5px) rotate(3.5deg);
          }
          45% {
            transform: translateX(-4px) rotate(-2deg);
          }
          60% {
            transform: translateX(4px) rotate(2deg);
          }
          75% {
            transform: translateX(-2px) rotate(-1deg);
          }
          90% {
            transform: translateX(1.5px) rotate(0.5deg);
          }
        }
        .animate-gem-drrr-shake {
          animation: gemDrrrShake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes gemSpawnBounce {
          0% {
            transform: translate(var(--target-x), var(--target-y)) translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          58% {
            transform: translate(var(--target-x), var(--target-y)) translate(-50%, -50%) scale(1.24);
            opacity: 1;
          }
          80% {
            transform: translate(var(--target-x), var(--target-y)) translate(-50%, -50%) scale(0.92);
            opacity: 1;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
});

GemLayer.displayName = 'GemLayer';

