/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GemData {
  id: string;
  type?: 'bloom' | 'stella' | 'flora' | 'musa' | 'tecna' | 'aisha' | 'enemy';
  name: string;
  color: string;
  accentColor: string;
  hexId: number; // Hexagon ID it currently sits in
  isEnemy?: boolean;
  isImmovableEnemy?: boolean; // Immovable enemy gem: sits on a single hex, cannot be moved, only destroyed by adjacent matches
  occupiedHexIds?: number[]; // For multi-hex gems like the 7-hex enemy gem
}

export interface EnemyGemConfig {
  enabled: boolean;
  name: string;
  color: string; // Dark purple (default #3b0764)
  accentColor: string; // Dark obsidian/black purple (default #18002a)
  glowColor: string; // Luminous dark violet (default #581c87)
  smokeIntensity: number; // 0 to 100 (particle emission rate)
  smokeColor: string; // Smoke tint (default #2e0249)
  enableSmoke?: boolean; // Enable ambient billowing smoke and burst effects (default true)
  centerHexId: number; // Center hex of 7-hex cluster (-1 for auto/stage center)
  pulseSpeed: number; // Breathing pulse speed in seconds
  enablePulsate?: boolean; // Enable rhythmic breathing pulsation for enemy gems (default true)
  pulseScale?: number; // Breathing pulsation scale multiplier (default 1.06)
  smallEnemyRotate?: boolean; // Enable slow rotation for small enemy gems (default true)
  smallEnemyRotateSpeed?: number; // Slow rotation duration in seconds per full 360 turn (default 16)
  smallEnemyRotateDirection?: 'clockwise' | 'counterclockwise'; // Rotation direction (default clockwise)
  baseScale: number; // Size scale multiplier (default 1.0)

  // Battle Mechanic properties
  maxHits: number; // Total hits/breaks required to shrink and defeat (default 25)
  damagePerMatch: number; // Hits/breaks dealt (default 1)
  damageCalculation?: 'perAdjacentGem' | 'perMatch'; // Calculation mode for breaks (default 'perAdjacentGem')
  healthBarWidth?: number; // Health bar width in px (default 140)
  healthBarHeight?: number; // Health bar height in px (default 16)
  healthBarOffsetY?: number; // Health bar vertical offset in px (default 5 for moved down 5px)
  showHealthText?: boolean; // Show numeric HP text (default true)
  healthBarColor?: string; // Health bar fill color (default #c084fc)
  shakeIntensity: number; // Hurt shake intensity in pixels (default 12)
  shakeDuration: number; // Hurt animation duration in ms (default 400)
  defeatDelay: number; // Delay in ms after defeat before new level starts (default 1500)
  showHealthBar: boolean; // Display boss health meter (default true)
  immovableCount?: number; // Number of immovable single-hex enemy gems on stage (default 3)

  // Enemy Hex Background individual customization
  enemyHexBgStart?: string; // Center gradient color (default #250238)
  enemyHexBgMid?: string; // Mid gradient color (default #3b0764)
  enemyHexBgEnd?: string; // Edge gradient color (default #18002a)
  enemyHexStroke?: string; // Border stroke color (default #581c87)
  enemyHexOpacity?: number; // Fill opacity 0 - 100% (default 92)
  enemyHexStrokeOpacity?: number; // Border stroke opacity 0 - 100% (default 100)

  // Small Enemy Gems customization
  smallEnemySize?: number; // Size in px for small immovable enemy gems (default 44)
  smallEnemyRotation?: number; // Rotation angle in degrees for small enemy gems (default 30 for pointy sides up and down)

  // Big Boss Enemy Gem customization
  bigEnemyRotation?: number; // Rotation angle in degrees for the big monolithic boss enemy gem (default 90)
  imageUrl?: string; // Image asset URL for enemy gems
  companionImageUrl?: string; // Image asset URL for end-game companion in out-of-time popup (default https://i.imgur.com/tTK7L5j.png)
}

export type GemShape =
  | 'diamond'
  | 'circle'
  | 'square'
  | 'hexagon'
  | 'rounded_square'
  | 'triangle'
  | 'star'
  | 'droplet';

export interface GemConfig {
  size: number; // Gem diameter in px
  theme: 'gem' | 'pixie' | 'star' | 'minimal';
  glowIntensity: number; // 0 to 100%
  showLabel: boolean; // Show name label
  showFacets: boolean; // Geometric crystal facets
  shapes?: {
    bloom?: GemShape;
    stella?: GemShape;
    flora?: GemShape;
    musa?: GemShape;
    tecna?: GemShape;
    aisha?: GemShape;
  };
  sizes?: {
    bloom?: number;
    stella?: number;
    flora?: number;
    musa?: number;
    tecna?: number;
    aisha?: number;
  };
  colors: {
    bloom: string;
    stella: string;
    flora: string;
    musa: string;
    tecna: string;
    aisha: string;
  };
  customImages?: {
    bloom?: string;
    stella?: string;
    flora?: string;
    musa?: string;
    tecna?: string;
    aisha?: string;
  };
}

export interface AnimationConfig {
  duration: number; // in milliseconds (e.g. 300ms)
  easing: 'spring' | 'easeOut' | 'easeInOut' | 'bounce';
  dragScale: number; // scale factor while dragging
  snapDistance: number; // px threshold from hex center to trigger swap
  enforceAdjacency: boolean; // Only allow swaps between adjacent hexagons
  enableSparkles: boolean; // Winx pixie dust effect on swap / drag
  swapPulseGlow: boolean; // Ripple glow wave when swapped
  autoSwapOnDrag?: boolean; // Instantly swap on drag into adjacent hex without release

  // Touch & Tapped Gem State (Mobile Visibility)
  tapScale?: number; // Size scale multiplier when gem is tapped/dragged (default 1.30)
  tapLiftOffsetY?: number; // Vertical offset in px to move gem up so it is visible above finger (default -55)
  tapLiftTransition?: number; // Transition duration in ms for lift and scale (default 180)
  enableTapSelect?: boolean; // Allow clicking a gem to select (stays grown & lifted) and tapping adjacent to swap (default true)

  // Popping Chain Reaction Mechanic
  enableChainPop?: boolean; // Pop connected same-type gems when released
  minMatchCount?: number; // Minimum connected gems to pop (default 2)
  popChainDelay?: number; // Delay in ms between successive chain reaction steps (default 110ms)
  refillAfterPop?: boolean; // Refill cleared hexagons with fresh gems (default true)
  spawnDelay?: number; // Delay in ms before new gems appear from empty hexes (default 320ms)
  spawnDuration?: number; // Duration in ms for bouncy gem spawning animation (default 420ms)
  enablePopSound?: boolean; // Play musical fairy chimes on pop (default true)
  enableSwapSound?: boolean; // Play crisp swoosh sound when gems swap (default true)
}

export interface EnergyBarConfig {
  enabled: boolean;
  maxEnergy: number; // Max energy capacity (default 100)
  energyPerSwap: number; // Energy consumed per swap (default 18)
  dragDrainRate?: number; // Energy consumed per second while dragging (default 10)
  refillRate: number; // Energy refilled per second (default 15)
  refillDelay: number; // Delay in ms after swapping before refill begins (default 300)
  barWidth: number; // Bar width in px (default 380)
  barHeight: number; // Bar height in px (default 18)
  barTop: number; // Distance from top of screen in px (default 96)
  barRadius: number; // Corner radius in px (default 9999 for pill)
  primaryColor: string; // Gradient start color (default #f43f5e)
  secondaryColor: string; // Gradient end color (default #a855f7)
  backgroundColor: string; // Depleted track background color (default #1e1b2e)
  borderColor: string; // Border stroke color (default rgba(255,255,255,0.25))
  borderWidth: number; // Border stroke width (default 1.5)
  showLabel: boolean; // Show energy percentage text / icon
  glowEffect: boolean; // Magic glowing drop shadow
  shakeOnDepleted: boolean; // Shake effect when trying to swap with 0 energy
}

export interface TimerBarConfig {
  enabled: boolean;
  duration: number; // Duration in seconds (default 60 for 1 minute)
  firstLevelBonus?: number; // Extra seconds on level 1 only (default 0)
  barWidth?: number; // Width in px (defaults to match energy bar)
  barHeight?: number; // Height in px (default 18)
  barTop?: number; // Distance from top of screen in px (default 134, just below energy bar)
  barRadius?: number; // Corner radius (default 9999)
  primaryColor?: string; // Gradient start color (default #06b6d4)
  secondaryColor?: string; // Gradient end color (default #3b82f6)
  backgroundColor?: string; // Track background color
  borderColor?: string; // Border color
  borderWidth?: number; // Border stroke width
  glowEffect?: boolean; // Magic glow
  showTimeText?: boolean; // Display numeric countdown
}

export interface CurrencyConfig {
  softCurrencyIcon: string; // Soft currency icon (default https://i.imgur.com/pmbYkdQ.png)
  hardCurrencyIcon: string; // Hard / premium currency icon (default https://i.imgur.com/KQIldQr.png)
  softCurrencyName?: string; // e.g. 'Pixie Coins'
  hardCurrencyName?: string; // e.g. 'Magic Crystals'
  startingSoftCurrency?: number; // default 2450
  startingHardCurrency?: number; // default 150
  softCurrencyLeft?: number; // Distance from left edge in px (default 46, was 26, moved right 20px)
  hardCurrencyRight?: number; // Distance from right edge in px (default 46, was 26, moved left 20px)
  topBarYOffset?: number; // Top bar vertical offset in px (default 0)
  pauseGap?: number; // Gap between hard currency and pause button in px (default 8)
}

export interface StageConfig {
  // Hexagon geometry
  gridRadius: number; // Honeycomb radius (e.g. 3 for 37 hexagons, 2 for 19)
  hexRadius: number; // Radius R (center to vertex), default ~44
  hexGap: number; // Gap between hexes in px, default 0
  stageX: number; // Stage center X inside window (0 - 603), default 301.5
  stageY: number; // Stage center Y inside window (0 - 1311), default 655.5
  rotation: number; // Global stage rotation in degrees (0 - 360), default 0
  
  // Hexagon Appearance & Stage Background
  stageBgColor: string; // Background behind/around the stage, default #ffffff
  backgroundFrost?: boolean; // Frosted glass / blur effect on background
  backgroundFrostBlur?: number; // Frost blur in px (0 - 40px, default 12)
  backgroundFrostOpacity?: number; // Frosted overlay opacity (0 - 100%, default 20)
  backgroundFrostTint?: string; // Frosted glass tint color (default #ffffff)
  strokeWidth: number; // Hexagon border stroke width, default 2.5
  strokeColor: string; // Hexagon border color, default #1a1a1a
  strokeOpacity?: number; // Hexagon border line opacity 0 - 100%, default 100
  cornerRadius?: number; // Hexagon corner radius in px, default 0 (sharp)
  fillColor: string; // Hexagon fill color, default #383838
  fillOpacity: number; // Hexagon fill opacity 0 - 100%, default 100
  showCoordinates: boolean; // Show coordinate labels / index
  interactiveHover: boolean; // Highlight on hover
  
  // Game Window Specs
  windowWidth: number; // default 603
  windowHeight: number; // default 1311
  windowRadius: number; // default 100
  windowBg: string; // default #ffffff
  outerBg: string; // default #000000
  windowShadowBlur: number; // Subtle shadow blur in px, default 40
  windowShadowOpacity: number; // Subtle shadow opacity 0 - 100%, default 15
  
  // Notch Specs
  notchWidth: number; // default 140
  notchHeight: number; // default 55
  notchTop: number; // default 22
  notchRadius: number; // default 50
  notchColor: string; // default #000000
  notchVisible: boolean; // default true
  
  // Viewport display
  zoomMode: 'fit' | 'actual' | 'custom';
  customZoom: number; // 25 - 200%
  backgroundImage?: string; // Optional background image URL (e.g. /background01.jpeg)

  // Gems & Swapping
  gems: GemConfig;
  animation: AnimationConfig;
  energy: EnergyBarConfig;
  timer?: TimerBarConfig;
  enemyGem: EnemyGemConfig;
  powerups?: PowerupConfig;
  currencies?: CurrencyConfig;
}

export type PowerupType =
  | 'lockette'
  | 'amore'
  | 'chatta'
  | 'tune'
  | 'digit'
  | 'piff';

export interface PowerupConfig {
  enabled: boolean;
  defaultCharges: number;
  overdriveDuration: number; // in seconds, default 8
  bottomOffset: number; // distance from bottom in px (default 28)
  dockWidth: number; // dock width in px (default 540)
  cardHeight: number; // card height in px (default 195)
  cardGap: number; // gap between cards in px (default 14)
  cardRadius: number; // card corner radius in px (default 24)
  iconSize: number; // icon emblem container size in px (default 64)
  glowIntensity: number; // glowing border & halo intensity in % (default 70)
}

export interface HexInfo {
  id: number;
  q: number; // Axial coordinate q
  r: number; // Axial coordinate r
  s: number; // Axial coordinate s (-q - r)
  label: string;
  offsetX: number; // relative px offset from stage center
  offsetY: number;
}
