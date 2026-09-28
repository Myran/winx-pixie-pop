/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StageConfig, GemShape } from '../types/game';
import { getHoneycombLayout, getRandomClusterCenterId } from '../utils/hexMath';
import {
  X,
  RotateCcw,
  Check,
  Layers,
  Smartphone,
  Save,
  Sparkles,
  Zap,
  Gem,
  Skull,
  Shuffle,
  Wand2,
  Clock,
  ExternalLink,
  Copy,
  Link2,
  Image as ImageIcon,
  Coins,
  Sliders,
} from 'lucide-react';
import { normalizeImgurUrl, DEFAULT_SOFT_CURRENCY_ICON, DEFAULT_HARD_CURRENCY_ICON } from '../utils/currency';

interface DebugMenuProps {
  isOpen: boolean;
  onClose: () => void;
  config: StageConfig;
  onChangeConfig: React.Dispatch<React.SetStateAction<StageConfig>>;
  onReset: () => void;
  selectedHexId?: number | null;
  onSaveToSource: () => Promise<{ success: boolean; message: string }>;
  onNewLevel: () => void;
  levelNumber: number;
}

export const DebugMenu: React.FC<DebugMenuProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onReset,
  onSaveToSource,
  onNewLevel,
  levelNumber,
}) => {
  // Tabs: gems, powerups, energy, enemy, stage, window, currencies
  const [activeTab, setActiveTab] = useState<'gems' | 'powerups' | 'energy' | 'enemy' | 'stage' | 'window' | 'currencies'>('gems');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  if (!isOpen) return null;

  const updatePowerupField = <K extends keyof NonNullable<StageConfig['powerups']>>(
    key: K,
    value: NonNullable<StageConfig['powerups']>[K]
  ) => {
    onChangeConfig((prev) => ({
      ...prev,
      powerups: {
        ...(prev.powerups || {
          enabled: true,
          defaultCharges: 3,
          overdriveDuration: 8,
          bottomOffset: 28,
          dockWidth: 540,
          cardHeight: 195,
          cardGap: 14,
          cardRadius: 24,
          iconSize: 64,
          glowIntensity: 70,
        }),
        [key]: value,
      },
    }));
  };

  const updateField = <K extends keyof StageConfig>(key: K, value: StageConfig[K]) => {
    onChangeConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateFields = (fields: Partial<StageConfig>) => {
    onChangeConfig((prev) => ({
      ...prev,
      ...fields,
    }));
  };

  const updateGemField = <K extends keyof StageConfig['gems']>(
    key: K,
    value: StageConfig['gems'][K]
  ) => {
    onChangeConfig((prev) => ({
      ...prev,
      gems: {
        ...prev.gems,
        [key]: value,
      },
    }));
  };

  const updateGemColor = (gemKey: keyof StageConfig['gems']['colors'], color: string) => {
    onChangeConfig((prev) => ({
      ...prev,
      gems: {
        ...prev.gems,
        colors: {
          ...prev.gems.colors,
          [gemKey]: color,
        },
      },
    }));
  };

  const updateCurrencyField = <K extends keyof NonNullable<StageConfig['currencies']>>(
    key: K,
    value: NonNullable<StageConfig['currencies']>[K]
  ) => {
    onChangeConfig((prev) => ({
      ...prev,
      currencies: {
        ...(prev.currencies || {
          softCurrencyIcon: DEFAULT_SOFT_CURRENCY_ICON,
          hardCurrencyIcon: DEFAULT_HARD_CURRENCY_ICON,
          softCurrencyName: 'Pixie Coins',
          hardCurrencyName: 'Magic Crystals',
          startingSoftCurrency: 2450,
          startingHardCurrency: 150,
          softCurrencyLeft: 46,
          hardCurrencyRight: 46,
          topBarYOffset: 0,
          pauseGap: 8,
        }),
        [key]: value,
      },
    }));
  };

  const updateCurrencyFields = (fields: Partial<NonNullable<StageConfig['currencies']>>) => {
    onChangeConfig((prev) => ({
      ...prev,
      currencies: {
        ...(prev.currencies || {
          softCurrencyIcon: DEFAULT_SOFT_CURRENCY_ICON,
          hardCurrencyIcon: DEFAULT_HARD_CURRENCY_ICON,
          softCurrencyName: 'Pixie Coins',
          hardCurrencyName: 'Magic Crystals',
          startingSoftCurrency: 2450,
          startingHardCurrency: 150,
          softCurrencyLeft: 46,
          hardCurrencyRight: 46,
          topBarYOffset: 0,
          pauseGap: 8,
        }),
        ...fields,
      },
    }));
  };

  const updateGemShape = (gemKey: keyof NonNullable<StageConfig['gems']['shapes']>, shape: GemShape) => {
    onChangeConfig((prev) => ({
      ...prev,
      gems: {
        ...prev.gems,
        shapes: {
          ...prev.gems.shapes,
          [gemKey]: shape,
        },
      },
    }));
  };

  const updateGemSize = (gemKey: keyof NonNullable<StageConfig['gems']['shapes']>, size: number) => {
    onChangeConfig((prev) => ({
      ...prev,
      gems: {
        ...prev.gems,
        sizes: {
          ...prev.gems.sizes,
          [gemKey]: size,
        },
      },
    }));
  };

  const updateGemImage = (gemKey: keyof NonNullable<StageConfig['gems']['shapes']>, url: string) => {
    onChangeConfig((prev) => ({
      ...prev,
      gems: {
        ...prev.gems,
        customImages: {
          ...prev.gems.customImages,
          [gemKey]: url.trim() || undefined,
        },
      },
    }));
  };

  const updateAnimFields = (fields: Partial<StageConfig['animation']>) => {
    onChangeConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        ...fields,
      },
    }));
  };

  const updateAnimField = <K extends keyof StageConfig['animation']>(
    key: K,
    value: StageConfig['animation'][K]
  ) => {
    onChangeConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        [key]: value,
      },
    }));
  };

  const updateEnergyField = <K extends keyof StageConfig['energy']>(
    key: K,
    value: StageConfig['energy'][K]
  ) => {
    onChangeConfig((prev) => ({
      ...prev,
      energy: {
        ...prev.energy,
        [key]: value,
      },
    }));
  };

  const updateEnemyGemField = <K extends keyof StageConfig['enemyGem']>(
    key: K,
    value: StageConfig['enemyGem'][K]
  ) => {
    onChangeConfig({
      ...config,
      enemyGem: {
        ...(config.enemyGem || {
          enabled: true,
          name: 'Shadow Core',
          color: '#3b0764',
          accentColor: '#0a0014',
          glowColor: '#581c87',
          smokeIntensity: 65,
          smokeColor: '#2e0249',
          centerHexId: -1,
          pulseSpeed: 2.5,
          baseScale: 1.0,
          maxHits: 25,
          damagePerMatch: 1,
          damageCalculation: 'perAdjacentGem',
          healthBarWidth: 140,
          healthBarHeight: 12,
          showHealthText: true,
          healthBarColor: '#c084fc',
          shakeIntensity: 12,
          shakeDuration: 400,
          defeatDelay: 1500,
          showHealthBar: true,
        }),
        [key]: value,
      },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus({ status: 'idle', message: '' });
    try {
      const result = await onSaveToSource();
      if (result.success) {
        setSaveStatus({ status: 'success', message: 'Source code overwritten!' });
      } else {
        setSaveStatus({ status: 'error', message: result.message });
      }
    } catch {
      setSaveStatus({ status: 'error', message: 'Failed to reach server' });
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveStatus((prev) => (prev.status === 'success' ? { status: 'idle', message: '' } : prev));
      }, 3500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-5 pointer-events-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="pointer-events-auto w-full max-w-sm h-[88vh] max-h-[88vh] flex flex-col bg-[#111113]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-neutral-200 text-xs select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="font-semibold text-neutral-100 tracking-wide">
              Debug Menu
            </span>
            <span className="text-[10px] text-neutral-400 bg-white/10 px-1.5 py-0.5 rounded font-mono">
              Tab
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onReset}
              title="Reset defaults"
              className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="Close (Tab)"
              className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Action Bar: Save Changes (moved to top as requested) */}
        <div className="px-3.5 py-2.5 bg-neutral-900/95 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex-1 min-w-0">
            {saveStatus.status === 'success' ? (
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Source code overwritten!</span>
              </span>
            ) : saveStatus.status === 'error' ? (
              <span className="text-[11px] font-medium text-red-400 truncate block">
                {saveStatus.message}
              </span>
            ) : (
              <span className="text-[11px] text-neutral-400 truncate block">
                Live tweaks active.
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 active:scale-95 text-white font-medium text-[11px] rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer shrink-0"
            title="Save changes to source code"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {/* Top Action Banner: New Level (visible at all times) */}
        <div className="px-3.5 py-2.5 bg-neutral-900/90 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white text-[11px] truncate">
                  Level {levelNumber}
                </span>
                <span className="text-[10px] text-neutral-400 bg-white/10 px-1.5 py-0.5 rounded font-mono shrink-0">
                  {3 * (config.gridRadius || 4) * ((config.gridRadius || 4) + 1) + 1} Hexes
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onNewLevel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 active:scale-95 text-white font-medium text-[11px] rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
            title="Generate new level with random gems"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-200" />
            <span>New Level</span>
          </button>
        </div>

        {/* Tab Navigation - Category text labels removed as requested (Icon-only clean navigation) */}
        <div className="flex items-center justify-around border-b border-white/10 bg-white/[0.01] px-2 py-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('gems')}
            title="Gems & Spawning"
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'gems'
                ? 'bg-pink-600/30 text-pink-400 border border-pink-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Gem className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('powerups')}
            title="Fairy Powerups (6)"
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'powerups'
                ? 'bg-fuchsia-600/30 text-fuchsia-400 border border-fuchsia-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Wand2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('energy')}
            title="Energy Bar"
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'energy'
                ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('enemy')}
            title="Enemy Gem & Battle"
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'enemy'
                ? 'bg-purple-600/30 text-purple-400 border border-purple-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Skull className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('stage')}
            title="Stage & Hexagons"
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'stage'
                ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('window')}
            title="Phone Window & Notch"
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'window'
                ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('currencies')}
            title="Currencies (Soft & Hard)"
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'currencies'
                ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Coins className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* TAB: GEMS & SWAPPING */}
          {activeTab === 'gems' && (
            <div className="space-y-4">
              {/* GEM ASSET SOURCES & IMAGE LINKS (Imgur & Custom Assets) */}
              <div className="p-3 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-pink-950/20 border border-purple-500/40 rounded-xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-white font-semibold text-xs">
                      Gem Asset Sources & Links
                    </span>
                  </div>
                  <span className="text-[10px] text-pink-300/80 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20 font-medium">
                    Live Assets
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      id: 'bloom',
                      name: "Bloom's Gem",
                      tag: 'Dragon Flame Fairy (Blue)',
                      color: '#3E63FF',
                      imgurUrl: 'https://imgur.com/PksiFVh',
                      directUrl: config.gems.customImages?.bloom || '/gems/bloom.png',
                      defaultDirect: '/gems/bloom.png',
                      onUpdate: (url: string) => updateGemImage('bloom', url),
                    },
                    {
                      id: 'stella',
                      name: "Stella's Gem",
                      tag: 'Sun & Light Fairy (Yellow)',
                      color: '#FFB238',
                      imgurUrl: 'https://imgur.com/dYZk9hI',
                      directUrl: config.gems.customImages?.stella || '/gems/stella.png',
                      defaultDirect: '/gems/stella.png',
                      onUpdate: (url: string) => updateGemImage('stella', url),
                    },
                    {
                      id: 'flora',
                      name: "Flora's Gem",
                      tag: 'Nature Fairy (Green/Pink)',
                      color: '#3CD070',
                      imgurUrl: 'https://imgur.com/1IEPC8W',
                      directUrl: config.gems.customImages?.flora || '/gems/flora.png',
                      defaultDirect: '/gems/flora.png',
                      onUpdate: (url: string) => updateGemImage('flora', url),
                    },
                    {
                      id: 'musa',
                      name: "Musa's Gem",
                      tag: 'Music Fairy (Red)',
                      color: '#FF4F5E',
                      imgurUrl: 'https://imgur.com/vb31Tfo',
                      directUrl: config.gems.customImages?.musa || '/gems/musa.png',
                      defaultDirect: '/gems/musa.png',
                      onUpdate: (url: string) => updateGemImage('musa', url),
                    },
                    {
                      id: 'tecna',
                      name: "Tecna's Gem",
                      tag: 'Technology Fairy',
                      color: '#9B59FF',
                      imgurUrl: 'https://imgur.com/VJwWxvy',
                      directUrl: config.gems.customImages?.tecna || '/gems/tecna.png',
                      defaultDirect: '/gems/tecna.png',
                      onUpdate: (url: string) => updateGemImage('tecna', url),
                    },
                    {
                      id: 'aisha',
                      name: "Aisha's Gem",
                      tag: 'Droplet / Water',
                      color: '#2FD9C4',
                      imgurUrl: 'https://imgur.com/IIrisg2',
                      directUrl: config.gems.customImages?.aisha || '/gems/aisha.png',
                      defaultDirect: '/gems/aisha.png',
                      onUpdate: (url: string) => updateGemImage('aisha', url),
                    },
                  ].map((asset) => (
                    <div
                      key={asset.id}
                      className="p-2 bg-black/40 border border-white/10 rounded-lg space-y-1.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Asset Thumbnail Preview */}
                          <div
                            className="w-7 h-7 rounded-md bg-black/60 border border-white/15 flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
                            style={{ boxShadow: `0 0 10px ${asset.color}33` }}
                          >
                            <img
                              src={asset.directUrl}
                              alt={asset.name}
                              className="w-full h-full object-contain filter drop-shadow"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white truncate block text-[11px]">
                              {asset.name}
                            </span>
                            <span className="text-[9px] text-neutral-400 block truncate">
                              {asset.tag}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons: Open in Imgur & Copy Link */}
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={asset.imgurUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="Open Imgur page in new tab"
                          >
                            <ExternalLink className="w-3 h-3 text-pink-300" />
                          </a>
                          <button
                            onClick={() => handleCopy(asset.directUrl, asset.id)}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="Copy Direct Image URL"
                          >
                            {copiedKey === asset.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Direct URL display & input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={asset.directUrl}
                          readOnly={!asset.onUpdate}
                          onChange={(e) => asset.onUpdate?.(e.target.value)}
                          placeholder="Paste image URL..."
                          className="flex-1 px-2 py-0.5 bg-black/60 border border-white/15 rounded text-[10px] text-neutral-300 font-mono focus:border-pink-500 focus:outline-none select-all truncate"
                        />
                        {asset.onUpdate && asset.directUrl !== asset.defaultDirect && (
                          <button
                            onClick={() => asset.onUpdate(asset.defaultDirect)}
                            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] text-neutral-300 transition-colors"
                            title="Reset to default image"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6 Winx Gem Colors & Shapes with individual selection */}
              <div className="space-y-2">
                <span className="text-neutral-300">Winx Gems (6)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(
                    [
                      {
                        key: 'bloom',
                        name: 'Bloom',
                        defaultColor: '#3E63FF',
                        defaultImg: '/gems/bloom.png',
                        imgurUrl: 'https://imgur.com/PksiFVh',
                      },
                      {
                        key: 'stella',
                        name: 'Stella',
                        defaultColor: '#FFB238',
                        defaultImg: '/gems/stella.png',
                        imgurUrl: 'https://imgur.com/dYZk9hI',
                      },
                      {
                        key: 'flora',
                        name: 'Flora',
                        defaultColor: '#FF9AC5',
                        defaultImg: '/gems/flora.png',
                        imgurUrl: 'https://imgur.com/1IEPC8W',
                      },
                      {
                        key: 'musa',
                        name: 'Musa',
                        defaultColor: '#FF4F5E',
                        defaultImg: '/gems/musa.png',
                        imgurUrl: 'https://imgur.com/vb31Tfo',
                      },
                      {
                        key: 'tecna',
                        name: 'Tecna',
                        defaultColor: '#9B59FF',
                        defaultImg: '/gems/tecna.png',
                        imgurUrl: 'https://imgur.com/VJwWxvy',
                      },
                      {
                        key: 'aisha',
                        name: 'Aisha',
                        defaultColor: '#2FD9C4',
                        defaultImg: '/gems/aisha.png',
                        imgurUrl: 'https://imgur.com/IIrisg2',
                      },
                    ] as const
                  ).map((gem) => {
                    const currentColor = config.gems.colors[gem.key] || gem.defaultColor;
                    const currentShape = config.gems.shapes?.[gem.key] || 'diamond';
                    const customImg =
                      (config.gems.customImages?.[gem.key] ? normalizeImgurUrl(config.gems.customImages[gem.key]) : undefined) ||
                      (gem.key === 'bloom'
                        ? '/gems/bloom.png'
                        : gem.key === 'stella'
                        ? '/gems/stella.png'
                        : gem.key === 'flora'
                        ? '/gems/flora.png'
                        : gem.key === 'musa'
                        ? '/gems/musa.png'
                        : gem.key === 'tecna'
                        ? '/gems/tecna.png'
                        : gem.key === 'aisha'
                        ? '/gems/aisha.png'
                        : undefined);

                    return (
                      <div
                        key={gem.key}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-2"
                      >
                        {/* Top: Name, Color code & Color Picker */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {customImg && (
                              <img
                                src={customImg}
                                alt={gem.name}
                                className="w-5 h-5 object-contain filter drop-shadow shrink-0"
                              />
                            )}
                            <div>
                              <span className="font-semibold text-white block text-xs">
                                {gem.name}
                              </span>
                              <span className="font-mono text-[9px] text-neutral-400 uppercase">
                                {currentColor}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                              style={{ backgroundColor: currentColor }}
                            />
                            <input
                              type="color"
                              value={currentColor}
                              onChange={(e) => updateGemColor(gem.key, e.target.value)}
                              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                            />
                          </div>
                        </div>

                        {/* Image Source Link if available */}
                        {'imgurUrl' in gem && gem.imgurUrl && (
                          <div className="flex items-center justify-between px-1.5 py-1 bg-black/40 rounded border border-white/10 text-[10px]">
                            <span className="text-pink-300 font-mono truncate">
                              {gem.imgurUrl.replace('https://', '')}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <a
                                href={gem.imgurUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 rounded hover:bg-white/20 text-neutral-300 hover:text-white"
                                title="Open Imgur image"
                              >
                                <ExternalLink className="w-2.5 h-2.5 text-pink-300" />
                              </a>
                              <button
                                onClick={() => handleCopy(gem.defaultImg!, `card-${gem.key}`)}
                                className="p-0.5 rounded hover:bg-white/20 text-neutral-300 hover:text-white"
                                title="Copy Image URL"
                              >
                                {copiedKey === `card-${gem.key}` ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Shape Selector for this gem */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-400 block font-medium">
                            {customImg ? 'Shape (Fallback / Base)' : 'Shape'}
                          </span>
                          <select
                            value={currentShape}
                            onChange={(e) => updateGemShape(gem.key, e.target.value as GemShape)}
                            className="w-full px-2 py-1 bg-black/60 border border-white/15 rounded-lg text-white text-[11px] font-medium focus:border-pink-500 focus:outline-none cursor-pointer"
                          >
                            <option value="diamond">Diamond (original)</option>
                            <option value="circle">Circle</option>
                            <option value="square">Square (slightly rounded)</option>
                            <option value="hexagon">Hexagon</option>
                            <option value="rounded_square">Rounded square (very rounded)</option>
                            <option value="triangle">Triangle (slightly rounded)</option>
                            <option value="star">Star (slightly rounded)</option>
                            <option value="droplet">Droplet</option>
                          </select>
                        </div>

                        {/* Individual Gem Size Slider */}
                        <div className="space-y-1 pt-1 border-t border-white/10">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-neutral-300 font-medium">Size</span>
                            <span className="font-mono text-pink-300 font-semibold tabular-nums">
                              {config.gems.sizes?.[gem.key] ?? config.gems.size}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="24"
                            max="80"
                            step="1"
                            value={config.gems.sizes?.[gem.key] ?? config.gems.size}
                            onChange={(e) => updateGemSize(gem.key, Number(e.target.value))}
                            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Glow Intensity */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Glow Intensity</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    {config.gems.glowIntensity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={config.gems.glowIntensity}
                  onChange={(e) => updateGemField('glowIntensity', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Facets & Labels toggles */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Crystal Facets</span>
                <button
                  onClick={() => updateGemField('showFacets', !config.gems.showFacets)}
                  className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                    config.gems.showFacets ? 'bg-pink-600' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                      config.gems.showFacets ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Name Badges</span>
                <button
                  onClick={() => updateGemField('showLabel', !config.gems.showLabel)}
                  className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                    config.gems.showLabel ? 'bg-pink-600' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                      config.gems.showLabel ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Swapping Physics & Animation Controls */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                {/* Swap Duration */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Swap Duration</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.animation.duration}ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="700"
                    step="10"
                    value={config.animation.duration}
                    onChange={(e) => updateAnimField('duration', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Easing */}
                <div className="space-y-1.5">
                  <span className="text-neutral-300">Easing</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['spring', 'easeOut', 'easeInOut', 'bounce'] as const).map((eType) => (
                      <button
                        key={eType}
                        onClick={() => updateAnimField('easing', eType)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors ${
                          config.animation.easing === eType
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {eType}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tapped Gem Scale */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Tapped Gem Scale</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {(config.animation.tapScale ?? 1.30).toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="1.75"
                    step="0.05"
                    value={config.animation.tapScale ?? 1.30}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateAnimFields({
                        tapScale: val,
                        dragScale: val,
                      });
                    }}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Touch Lift Offset */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Touch Lift Offset</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.animation.tapLiftOffsetY ?? -55}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-120"
                    max="0"
                    step="5"
                    value={config.animation.tapLiftOffsetY ?? -55}
                    onChange={(e) => updateAnimField('tapLiftOffsetY', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Lift Animation Speed */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Lift Animation Speed</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.animation.tapLiftTransition ?? 180}ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    step="10"
                    value={config.animation.tapLiftTransition ?? 180}
                    onChange={(e) => updateAnimField('tapLiftTransition', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Snap Distance */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Snap Distance</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.animation.snapDistance}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="120"
                    step="1"
                    value={config.animation.snapDistance}
                    onChange={(e) => updateAnimField('snapDistance', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Adjacency Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Adjacency Rule</span>
                  <button
                    onClick={() => updateAnimField('enforceAdjacency', !config.animation.enforceAdjacency)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                      config.animation.enforceAdjacency ? 'bg-indigo-600' : 'bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                        config.animation.enforceAdjacency ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sparkles Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-pink-400" />
                    Sparkles
                  </span>
                  <button
                    onClick={() => updateAnimField('enableSparkles', !config.animation.enableSparkles)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                      config.animation.enableSparkles ? 'bg-pink-600' : 'bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                        config.animation.enableSparkles ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto-Swap on Drag Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Auto-Swap on Drag</span>
                  <button
                    onClick={() => updateAnimField('autoSwapOnDrag', config.animation.autoSwapOnDrag === false ? true : false)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                      config.animation.autoSwapOnDrag !== false ? 'bg-pink-600' : 'bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                        config.animation.autoSwapOnDrag !== false ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* CHAIN REACTION POPPING MECHANIC */}
                <div className="pt-2 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-pink-300 font-medium">Chain Pop on Release</span>
                    <button
                      onClick={() => updateAnimField('enableChainPop', config.animation.enableChainPop === false ? true : false)}
                      className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                        config.animation.enableChainPop !== false ? 'bg-pink-600' : 'bg-neutral-800'
                      }`}
                    >
                      <div
                        className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                          config.animation.enableChainPop !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Chain Pop Timing / Step Delay */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-neutral-300">
                      <span>Chain Reaction Step Delay</span>
                      <span className="font-mono text-neutral-400 tabular-nums">
                        {config.animation.popChainDelay ?? 110}ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="220"
                      step="10"
                      value={config.animation.popChainDelay ?? 110}
                      onChange={(e) => updateAnimField('popChainDelay', Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Minimum Match Count */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-neutral-300">
                      <span>Min Match to Pop</span>
                      <span className="font-mono text-neutral-400 tabular-nums">
                        {config.animation.minMatchCount ?? 2} Gems
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[2, 3, 4].map((count) => (
                        <button
                          key={count}
                          onClick={() => updateAnimField('minMatchCount', count)}
                          className={`py-1 rounded-lg text-[10px] font-medium transition-colors ${
                            (config.animation.minMatchCount ?? 2) === count
                              ? 'bg-pink-600 text-white shadow-sm'
                              : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                          }`}
                        >
                          {count}+ Connected
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Refill after Pop Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">Refill After Pop</span>
                    <button
                      onClick={() => updateAnimField('refillAfterPop', config.animation.refillAfterPop === false ? true : false)}
                      className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                        config.animation.refillAfterPop !== false ? 'bg-pink-600' : 'bg-neutral-800'
                      }`}
                    >
                      <div
                        className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                          config.animation.refillAfterPop !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Pop Sound Chimes Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">Fairy Pop Chimes</span>
                    <button
                      onClick={() => updateAnimField('enablePopSound', config.animation.enablePopSound === false ? true : false)}
                      className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                        config.animation.enablePopSound !== false ? 'bg-pink-600' : 'bg-neutral-800'
                      }`}
                    >
                      <div
                        className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                          config.animation.enablePopSound !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Swap Sound Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">Gem Swap Sound</span>
                    <button
                      onClick={() => updateAnimField('enableSwapSound', config.animation.enableSwapSound === false ? true : false)}
                      className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                        config.animation.enableSwapSound !== false ? 'bg-pink-600' : 'bg-neutral-800'
                      }`}
                    >
                      <div
                        className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                          config.animation.enableSwapSound !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Gem Spawning Delay from Empty Hexes */}
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center text-neutral-300">
                      <span>Spawning Delay</span>
                      <span className="font-mono text-pink-400 tabular-nums">
                        {config.animation.spawnDelay ?? 320}ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="800"
                      step="10"
                      value={config.animation.spawnDelay ?? 320}
                      onChange={(e) => updateAnimField('spawnDelay', Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>

                  {/* Gem Spawning Duration (Bouncy Animation) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-neutral-300">
                      <span>Spawning Duration</span>
                      <span className="font-mono text-pink-400 tabular-nums">
                        {config.animation.spawnDuration ?? 420}ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min="150"
                      max="900"
                      step="10"
                      value={config.animation.spawnDuration ?? 420}
                      onChange={(e) => updateAnimField('spawnDuration', Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: POWERUPS (6 FAIRY POWERS) */}
          {activeTab === 'powerups' && (
            <div className="space-y-4">
              {/* Enable / Disable Powerups Dock */}
              <div className="flex items-center justify-between p-3 bg-fuchsia-950/25 border border-fuchsia-800/40 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-900/50 flex items-center justify-center border border-fuchsia-700/50 text-fuchsia-300">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-white font-medium block text-xs">Fairy Powerups Dock</span>
                  </div>
                </div>
                <button
                  onClick={() => updatePowerupField('enabled', config.powerups?.enabled === false ? true : false)}
                  className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                    config.powerups?.enabled !== false ? 'bg-fuchsia-600' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                      config.powerups?.enabled !== false ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {config.powerups?.enabled !== false && (
                <>
                  {/* Quick Action: Shuffle Level Powerups */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-neutral-300 block">
                      Quick Level & Charges Action
                    </span>
                    <button
                      onClick={onNewLevel}
                      className="w-full py-2 px-3 bg-gradient-to-r from-fuchsia-700 to-pink-700 hover:from-fuchsia-600 hover:to-pink-600 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-fuchsia-200" />
                      <span>Pick 3 Random Powerups (New Level)</span>
                    </button>
                  </div>

                  {/* DOCK POSITION & LAYOUT */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <span className="text-xs font-semibold text-neutral-300 tracking-wide uppercase block">
                      Position & Geometry
                    </span>

                    {/* Bottom Offset */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Bottom Offset</span>
                        <span className="font-mono text-fuchsia-300 tabular-nums text-[11px]">
                          {config.powerups?.bottomOffset ?? 130}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="250"
                        step="1"
                        value={config.powerups?.bottomOffset ?? 130}
                        onChange={(e) => updatePowerupField('bottomOffset', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                      />
                    </div>

                    {/* Dock Width */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Dock Total Width</span>
                        <span className="font-mono text-fuchsia-300 tabular-nums text-[11px]">
                          {config.powerups?.dockWidth ?? 540}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="340"
                        max="580"
                        step="5"
                        value={config.powerups?.dockWidth ?? 540}
                        onChange={(e) => updatePowerupField('dockWidth', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                      />
                    </div>

                    {/* Card Height */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Card Height (2x Taller)</span>
                        <span className="font-mono text-fuchsia-300 tabular-nums text-[11px]">
                          {config.powerups?.cardHeight ?? 195}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="90"
                        max="260"
                        step="5"
                        value={config.powerups?.cardHeight ?? 195}
                        onChange={(e) => updatePowerupField('cardHeight', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                      />
                    </div>

                    {/* Card Gap */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Card Gap Spacing</span>
                        <span className="font-mono text-fuchsia-300 tabular-nums text-[11px]">
                          {config.powerups?.cardGap ?? 14}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="32"
                        step="1"
                        value={config.powerups?.cardGap ?? 14}
                        onChange={(e) => updatePowerupField('cardGap', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                      />
                    </div>

                    {/* Card Radius */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Card Corner Radius</span>
                        <span className="font-mono text-fuchsia-300 tabular-nums text-[11px]">
                          {config.powerups?.cardRadius ?? 24}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="40"
                        step="1"
                        value={config.powerups?.cardRadius ?? 24}
                        onChange={(e) => updatePowerupField('cardRadius', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                      />
                    </div>
                  </div>

                  {/* VISUAL & EMBLEM STYLING */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <span className="text-xs font-semibold text-neutral-300 tracking-wide uppercase block">
                      Emblem & Halo Styling
                    </span>

                    {/* Icon Emblem Size */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Icon Emblem Size</span>
                        <span className="font-mono text-fuchsia-300 tabular-nums text-[11px]">
                          {config.powerups?.iconSize ?? 64}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="36"
                        max="80"
                        step="2"
                        value={config.powerups?.iconSize ?? 64}
                        onChange={(e) => updatePowerupField('iconSize', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                      />
                    </div>

                    {/* Halo Glow Intensity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Glow & Halo Intensity</span>
                        <span className="font-mono text-fuchsia-300 tabular-nums text-[11px]">
                          {config.powerups?.glowIntensity ?? 70}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={config.powerups?.glowIntensity ?? 70}
                        onChange={(e) => updatePowerupField('glowIntensity', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                      />
                    </div>
                  </div>

                  {/* CHARGES & MECHANICS */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <span className="text-xs font-semibold text-neutral-300 tracking-wide uppercase block">
                      Charges & Overdrive
                    </span>

                    {/* Default Starting Charges */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Starting Charges per Power</span>
                        <span className="font-mono text-fuchsia-300 tabular-nums text-[11px]">
                          {config.powerups?.defaultCharges ?? 3} Uses
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={config.powerups?.defaultCharges ?? 3}
                        onChange={(e) => updatePowerupField('defaultCharges', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                      />
                    </div>

                    {/* Digit Tech Overdrive Duration */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Digit Overdrive Duration</span>
                        <span className="font-mono text-fuchsia-300 tabular-nums text-[11px]">
                          {config.powerups?.overdriveDuration ?? 8}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="20"
                        step="1"
                        value={config.powerups?.overdriveDuration ?? 8}
                        onChange={(e) => updatePowerupField('overdriveDuration', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                      />
                    </div>
                  </div>

                  {/* 6 POWERUPS ROSTER SHOWCASE */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
                    <span className="text-xs font-semibold text-neutral-300 block">
                      The 6 Pixie Powers Roster
                    </span>
                    <div className="space-y-2">
                      {[
                        { name: 'Lockette’s Time Portal', palette: 'Light blue / lilac / pink', colors: ['#38bdf8', '#c084fc', '#f472b6'], desc: 'Freezes time for 5 seconds' },
                        { name: 'Amore’s Heart Pop', palette: 'Pink / green', colors: ['#ec4899', '#f472b6', '#22c55e'], desc: 'Showering love charm, clears romance gems & energy heal' },
                        { name: 'Chatta’s Bloom Pop', palette: 'Green / blue', colors: ['#10b981', '#34d399', '#0284c7'], desc: '7-hex floral shockwave, 2 massive hits to boss' },
                        { name: 'Tune’s Harmony Pop', palette: 'Blue / gray / violet', colors: ['#3b82f6', '#94a3b8', '#8b5cf6'], desc: 'Harmonic chord, clears most common gem type' },
                        { name: 'Digit’s Tech Pop', palette: 'Purple / teal', colors: ['#9333ea', '#a855f7', '#14b8a6'], desc: '100% full refill & 8s of unlimited free swaps' },
                        { name: 'Piff’s Dream Pop', palette: 'Pink / cream', colors: ['#f472b6', '#fb7185', '#fef08a'], desc: 'Sweet dream dust, 2 hits to boss & clears sleep hexes' },
                      ].map((p) => (
                        <div key={p.name} className="p-2 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-medium text-white text-[11px] block truncate">{p.name}</span>
                            <span className="text-[9px] text-neutral-400 block truncate">{p.palette} • {p.desc}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {p.colors.map((c) => (
                              <span key={c} className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: ENERGY BAR */}
          {activeTab === 'energy' && (
            <div className="space-y-4">
              {/* Enable / Disable Energy Bar */}
              <div className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <span className="text-white font-medium block">Enable Energy Bar</span>
                </div>
                <button
                  onClick={() => updateEnergyField('enabled', !config.energy?.enabled)}
                  className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                    config.energy?.enabled ? 'bg-amber-500' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                      config.energy?.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Max Energy Capacity */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Max Energy</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    {config.energy?.maxEnergy ?? 100} pts
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="250"
                  step="5"
                  value={config.energy?.maxEnergy ?? 100}
                  onChange={(e) => updateEnergyField('maxEnergy', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Energy Cost Per Swap */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Energy Cost Per Swap</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    -{config.energy?.energyPerSwap ?? 18} pts
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={config.energy?.energyPerSwap ?? 18}
                  onChange={(e) => updateEnergyField('energyPerSwap', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Drag Drain Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Drag Drain Rate</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    -{config.energy?.dragDrainRate ?? 10} pts/sec
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={config.energy?.dragDrainRate ?? 10}
                  onChange={(e) => updateEnergyField('dragDrainRate', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Automatic Refill Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Refill Rate</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    +{config.energy?.refillRate ?? 15} pts/sec
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="60"
                  step="1"
                  value={config.energy?.refillRate ?? 15}
                  onChange={(e) => updateEnergyField('refillRate', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Refill Delay After Swap */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Refill Start Delay</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    {config.energy?.refillDelay ?? 350}ms
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1200"
                  step="25"
                  value={config.energy?.refillDelay ?? 350}
                  onChange={(e) => updateEnergyField('refillDelay', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Bar Geometry & Placement */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider block">
                  Placement & Size
                </span>

                {/* Bar Top Offset */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Top Distance</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.energy?.barTop ?? 96}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="240"
                    step="2"
                    value={config.energy?.barTop ?? 96}
                    onChange={(e) => updateEnergyField('barTop', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Bar Width */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Bar Width</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.energy?.barWidth ?? 380}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="180"
                    max="540"
                    step="5"
                    value={config.energy?.barWidth ?? 380}
                    onChange={(e) => updateEnergyField('barWidth', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Bar Height */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Bar Height</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.energy?.barHeight ?? 18}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="36"
                    step="1"
                    value={config.energy?.barHeight ?? 18}
                    onChange={(e) => updateEnergyField('barHeight', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Bar Corner Radius */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Corner Radius</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.energy?.barRadius >= 9999 ? 'Pill' : `${config.energy?.barRadius}px`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={config.energy?.barRadius >= 9999 ? 20 : (config.energy?.barRadius ?? 9999)}
                      onChange={(e) => updateEnergyField('barRadius', Number(e.target.value))}
                      className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <button
                      onClick={() => updateEnergyField('barRadius', 9999)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        (config.energy?.barRadius ?? 9999) >= 9999
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      Pill
                    </button>
                  </div>
                </div>
              </div>

              {/* Colors & Appearance */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider block">
                  Colors & Theme
                </span>

                {/* Gradient Start / End */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-medium text-white block">Start Color</span>
                      <span className="font-mono text-[9px] text-neutral-400 uppercase">
                        {config.energy?.primaryColor ?? '#f43f5e'}
                      </span>
                    </div>
                    <input
                      type="color"
                      value={config.energy?.primaryColor ?? '#f43f5e'}
                      onChange={(e) => updateEnergyField('primaryColor', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                  </div>

                  <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-medium text-white block">End Color</span>
                      <span className="font-mono text-[9px] text-neutral-400 uppercase">
                        {config.energy?.secondaryColor ?? '#a855f7'}
                      </span>
                    </div>
                    <input
                      type="color"
                      value={config.energy?.secondaryColor ?? '#a855f7'}
                      onChange={(e) => updateEnergyField('secondaryColor', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>

                {/* Track Background Color */}
                <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white block">Track Background</span>
                    <span className="font-mono text-[9px] text-neutral-400">
                      Empty portion color
                    </span>
                  </div>
                  <input
                    type="color"
                    value={config.energy?.backgroundColor?.startsWith('#') ? config.energy.backgroundColor : '#1a1829'}
                    onChange={(e) => updateEnergyField('backgroundColor', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>

                {/* Border Color */}
                <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white block">Border Color</span>
                    <span className="font-mono text-[9px] text-neutral-400">
                      Border frame stroke
                    </span>
                  </div>
                  <input
                    type="color"
                    value={config.energy?.borderColor?.startsWith('#') ? config.energy.borderColor : '#ffffff'}
                    onChange={(e) => updateEnergyField('borderColor', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>

                {/* Border Width */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Border Width</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.energy?.borderWidth ?? 1.5}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={config.energy?.borderWidth ?? 1.5}
                    onChange={(e) => updateEnergyField('borderWidth', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Fairy Glow Effect</span>
                  <button
                    onClick={() => updateEnergyField('glowEffect', !config.energy?.glowEffect)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                      config.energy?.glowEffect !== false ? 'bg-amber-500' : 'bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                        config.energy?.glowEffect !== false ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Countdown Timer Bar Section */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-cyan-950/30 border border-cyan-800/40 rounded-xl">
                  <div>
                    <span className="text-white font-medium block text-xs">Countdown Timer Bar</span>
                  </div>
                  <button
                    onClick={() => {
                      onChangeConfig({
                        ...config,
                        timer: {
                          ...(config.timer || {
                            enabled: true,
                            duration: 60,
                            barWidth: 470,
                            barHeight: 18,
                            barTop: 134,
                            primaryColor: '#06b6d4',
                            secondaryColor: '#3b82f6',
                            glowEffect: true,
                          }),
                          enabled: !(config.timer?.enabled !== false),
                        },
                      });
                    }}
                    className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                      config.timer?.enabled !== false ? 'bg-cyan-500' : 'bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                        config.timer?.enabled !== false ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Timer Duration */}
                <div className="space-y-1.5 p-2.5 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span className="text-xs">Timer Duration</span>
                    <span className="font-mono text-cyan-300 tabular-nums text-xs">
                      {config.timer?.duration ?? 60}s ({Math.round((config.timer?.duration ?? 60) / 60)} min)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="5"
                    value={config.timer?.duration ?? 60}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onChangeConfig({
                        ...config,
                        timer: {
                          ...(config.timer || {
                            enabled: true,
                            duration: 60,
                            barWidth: 470,
                            barHeight: 18,
                            barTop: 134,
                            primaryColor: '#06b6d4',
                            secondaryColor: '#3b82f6',
                            glowEffect: true,
                          }),
                          duration: val,
                        },
                      });
                    }}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Test End-Game Purchase Popup Button */}
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('winx-trigger-time-up'));
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-900/60 to-pink-900/60 hover:from-purple-800/80 hover:to-pink-800/80 border border-purple-500/50 text-purple-100 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <Clock className="w-3.5 h-3.5 text-pink-300" />
                  <span>Preview End-Game Purchase Popup</span>
                </button>
                <p className="text-[10px] text-purple-300/70 text-center leading-tight">
                  Displays random Cloud Tower witch taunt (29 variations). Tap bubble to re-roll!
                </p>
              </div>
            </div>
          )}

          {/* TAB: ENEMY GEM & BATTLE MECHANIC */}
          {activeTab === 'enemy' && (
            <div className="space-y-4">
              {/* Asset Sources (Enemy Gem and End-Game Fairy Companion) matching user reference */}
              <div className="p-3 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-pink-950/20 border border-purple-500/40 rounded-xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between pb-1 border-b border-purple-500/30">
                  <div className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-white font-semibold text-xs">
                      Enemy & Companion Assets
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-medium">
                    Live Assets
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      id: 'enemy-gem',
                      name: 'Enemy Gem (Small & Boss)',
                      tag: 'Dark Corrupted Hex',
                      color: '#a855f7',
                      imgurUrl: 'https://imgur.com/xFN0qeM',
                      directUrl: config.enemyGem?.imageUrl || '/enemy/shadow_core.png',
                      defaultDirect: '/enemy/shadow_core.png',
                      onUpdate: (url: string) => updateEnemyGemField('imageUrl', url.trim() || undefined),
                    },
                    {
                      id: 'end-game-companion',
                      name: 'End-Game Fairy Companion',
                      tag: 'Out-of-Time Popup',
                      color: '#ec4899',
                      imgurUrl: 'https://imgur.com/tTK7L5j',
                      directUrl: config.enemyGem?.companionImageUrl || '/enemy/companion.png',
                      defaultDirect: '/enemy/companion.png',
                      onUpdate: (url: string) => updateEnemyGemField('companionImageUrl', url.trim() || undefined),
                    },
                  ].map((asset) => (
                    <div
                      key={asset.id}
                      className="p-2 bg-black/40 border border-white/10 rounded-lg space-y-1.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Asset Thumbnail Preview */}
                          <div
                            className="w-7 h-7 rounded-md bg-black/60 border border-white/15 flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
                            style={{ boxShadow: `0 0 10px ${asset.color}33` }}
                          >
                            <img
                              src={asset.directUrl}
                              alt={asset.name}
                              className="w-full h-full object-contain filter drop-shadow"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white truncate block text-[11px]">
                              {asset.name}
                            </span>
                            <span className="text-[9px] text-neutral-400 block truncate">
                              {asset.tag}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons: Open in Imgur & Copy Link */}
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={asset.imgurUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="Open Imgur page in new tab"
                          >
                            <ExternalLink className="w-3 h-3 text-purple-300" />
                          </a>
                          <button
                            onClick={() => handleCopy(asset.directUrl, asset.id)}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="Copy Direct Image URL"
                          >
                            {copiedKey === asset.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Direct URL display & input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={asset.directUrl}
                          onChange={(e) => asset.onUpdate?.(e.target.value)}
                          placeholder="Paste image URL..."
                          className="flex-1 px-2 py-0.5 bg-black/60 border border-white/15 rounded text-[10px] text-neutral-300 font-mono focus:border-purple-500 focus:outline-none select-all truncate"
                        />
                        {asset.directUrl !== asset.defaultDirect && (
                          <button
                            onClick={() => asset.onUpdate(asset.defaultDirect)}
                            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] text-neutral-300 transition-colors"
                            title="Reset to default image"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immovable Single-Hex Enemy Gems Count & Size */}
              <div className="p-3 bg-purple-950/30 border border-purple-700/50 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-neutral-300">
                  <div>
                    <span className="text-white font-medium block text-xs">Immovable Enemy Gems</span>
                  </div>
                  <span className="font-mono text-purple-300 font-bold tabular-nums text-xs bg-purple-900/60 px-2 py-0.5 rounded border border-purple-600/40">
                    {config.enemyGem?.immovableCount ?? 3}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={config.enemyGem?.immovableCount ?? 3}
                  onChange={(e) => updateEnemyGemField('immovableCount', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />

                {/* Small Enemy Gems Size Slider */}
                <div className="pt-2 border-t border-purple-800/40 space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300 text-xs">
                    <span>Small Enemy Gem Size</span>
                    <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                      {config.enemyGem?.smallEnemySize ?? config.gems.size ?? 44}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="72"
                    step="1"
                    value={config.enemyGem?.smallEnemySize ?? config.gems.size ?? 44}
                    onChange={(e) => updateEnemyGemField('smallEnemySize', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                </div>

                {/* Small Enemy Gems Rotation Slider */}
                <div className="pt-2 border-t border-purple-800/40 space-y-2">
                  <div className="flex justify-between items-center text-neutral-300 text-xs">
                    <span>Small Enemy Gem Rotation</span>
                    <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                      {config.enemyGem?.smallEnemyRotation ?? 30}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={config.enemyGem?.smallEnemyRotation ?? 30}
                    onChange={(e) => updateEnemyGemField('smallEnemyRotation', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: 'Pointy (30°)', val: 30 },
                      { label: 'Pointy (90°)', val: 90 },
                      { label: 'Flat (0°)', val: 0 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={() => updateEnemyGemField('smallEnemyRotation', btn.val)}
                        className={`py-1 px-1.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                          (config.enemyGem?.smallEnemyRotation ?? 30) === btn.val
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-black/40 text-neutral-300 border-white/10 hover:bg-black/60'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Big Boss Enemy Gem Size Slider */}
                <div className="pt-2 border-t border-purple-800/40 space-y-2">
                  <div className="flex justify-between items-center text-neutral-300 text-xs">
                    <span>Big Enemy Gem Size</span>
                    <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                      {Math.round((config.enemyGem?.baseScale ?? 1.0) * 100)}% ({(config.enemyGem?.baseScale ?? 1.0).toFixed(2)}x)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="2.2"
                    step="0.05"
                    value={config.enemyGem?.baseScale ?? 1.0}
                    onChange={(e) => updateEnemyGemField('baseScale', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '80%', val: 0.8 },
                      { label: '100% (Default)', val: 1.0 },
                      { label: '120%', val: 1.2 },
                      { label: '150%', val: 1.5 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={() => updateEnemyGemField('baseScale', btn.val)}
                        className={`py-1 px-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                          Math.abs((config.enemyGem?.baseScale ?? 1.0) - btn.val) < 0.01
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-black/40 text-neutral-300 border-white/10 hover:bg-black/60'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Big Boss Enemy Gem Rotation Slider */}
                <div className="pt-2 border-t border-purple-800/40 space-y-2">
                  <div className="flex justify-between items-center text-neutral-300 text-xs">
                    <span>Big Enemy Gem Rotation</span>
                    <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                      {config.enemyGem?.bigEnemyRotation ?? 90}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={config.enemyGem?.bigEnemyRotation ?? 90}
                    onChange={(e) => updateEnemyGemField('bigEnemyRotation', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '90° (Default)', val: 90 },
                      { label: '120°', val: 120 },
                      { label: '30°', val: 30 },
                      { label: '0°', val: 0 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={() => updateEnemyGemField('bigEnemyRotation', btn.val)}
                        className={`py-1 px-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                          (config.enemyGem?.bigEnemyRotation ?? 90) === btn.val
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-black/40 text-neutral-300 border-white/10 hover:bg-black/60'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ENEMY HEX BACKGROUND (PURPLE/BLACK) - For Small Enemy Gems and Boss */}
              <div className="p-3 bg-purple-950/40 border border-purple-600/50 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-purple-800/40">
                  <span className="text-xs font-semibold text-purple-200 tracking-wide uppercase">
                    Enemy Hex Background (Purple / Black)
                  </span>
                  <div
                    className="w-4 h-4 rounded border border-purple-400/60 shadow-sm"
                    style={{
                      background: `radial-gradient(circle, ${config.enemyGem?.enemyHexBgStart ?? '#250238'} 0%, ${config.enemyGem?.enemyHexBgMid ?? '#3b0764'} 65%, ${config.enemyGem?.enemyHexBgEnd ?? '#18002a'} 100%)`,
                    }}
                  />
                </div>

                {/* Preset Palettes */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    {
                      name: 'Abyssal Void',
                      start: '#250238',
                      mid: '#3b0764',
                      end: '#18002a',
                      stroke: '#581c87',
                    },
                    {
                      name: 'Pitch Black',
                      start: '#15151e',
                      mid: '#0b0b12',
                      end: '#020204',
                      stroke: '#3f3f46',
                    },
                    {
                      name: 'Amethyst',
                      start: '#3b1154',
                      mid: '#581c87',
                      end: '#230736',
                      stroke: '#9333ea',
                    },
                    {
                      name: 'Night Obsidian',
                      start: '#110521',
                      mid: '#1c0b36',
                      end: '#07010f',
                      stroke: '#381363',
                    },
                    {
                      name: 'Crimson Shadow',
                      start: '#380210',
                      mid: '#5a0820',
                      end: '#1f0009',
                      stroke: '#881337',
                    },
                    {
                      name: 'Dark Emerald',
                      start: '#022c22',
                      mid: '#064e3b',
                      end: '#021812',
                      stroke: '#059669',
                    },
                  ].map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        updateEnemyGemField('enemyHexBgStart', p.start);
                        updateEnemyGemField('enemyHexBgMid', p.mid);
                        updateEnemyGemField('enemyHexBgEnd', p.end);
                        updateEnemyGemField('enemyHexStroke', p.stroke);
                      }}
                      className="py-1 px-1.5 rounded bg-black/40 hover:bg-black/60 border border-purple-500/30 text-[9px] font-mono text-purple-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                        style={{ backgroundColor: p.mid }}
                      />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>

                {/* Individual Color Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-300 block">Center Glow</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.enemyGem?.enemyHexBgStart ?? '#250238'}
                        onChange={(e) => updateEnemyGemField('enemyHexBgStart', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
                      />
                      <span className="font-mono text-neutral-400 uppercase text-[10px]">
                        {config.enemyGem?.enemyHexBgStart ?? '#250238'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-300 block">Mid Shade</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.enemyGem?.enemyHexBgMid ?? '#3b0764'}
                        onChange={(e) => updateEnemyGemField('enemyHexBgMid', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
                      />
                      <span className="font-mono text-neutral-400 uppercase text-[10px]">
                        {config.enemyGem?.enemyHexBgMid ?? '#3b0764'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-300 block">Outer Edge</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.enemyGem?.enemyHexBgEnd ?? '#18002a'}
                        onChange={(e) => updateEnemyGemField('enemyHexBgEnd', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
                      />
                      <span className="font-mono text-neutral-400 uppercase text-[10px]">
                        {config.enemyGem?.enemyHexBgEnd ?? '#18002a'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-300 block">Hex Border</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.enemyGem?.enemyHexStroke ?? '#581c87'}
                        onChange={(e) => updateEnemyGemField('enemyHexStroke', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
                      />
                      <span className="font-mono text-neutral-400 uppercase text-[10px]">
                        {config.enemyGem?.enemyHexStroke ?? '#581c87'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enemy Hex Fill Opacity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300 text-xs">
                    <span>Hex Fill Opacity</span>
                    <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                      {config.enemyGem?.enemyHexOpacity ?? 92}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={config.enemyGem?.enemyHexOpacity ?? 92}
                    onChange={(e) => updateEnemyGemField('enemyHexOpacity', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                </div>

                {/* Enemy Hex Border Opacity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300 text-xs">
                    <span>Hex Line Opacity</span>
                    <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                      {config.enemyGem?.enemyHexStrokeOpacity ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={config.enemyGem?.enemyHexStrokeOpacity ?? 100}
                    onChange={(e) => updateEnemyGemField('enemyHexStrokeOpacity', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                </div>
              </div>

              {/* Enable / Disable Enemy Gem */}
              <div className="flex items-center justify-between p-3 bg-purple-950/25 border border-purple-800/40 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-900/50 flex items-center justify-center border border-purple-700/50 text-purple-300">
                    <Skull className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-white font-medium block text-xs">Evil Enemy Gem</span>
                  </div>
                </div>
                <button
                  onClick={() => updateEnemyGemField('enabled', !config.enemyGem?.enabled)}
                  className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                    config.enemyGem?.enabled ? 'bg-purple-600' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                      config.enemyGem?.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {config.enemyGem?.enabled && (
                <>
                  {/* BATTLE MECHANIC SLIDERS */}
                  <div className="p-3 bg-purple-950/20 border border-purple-700/40 rounded-xl space-y-3.5">
                    <div className="flex items-center gap-2 pb-1 border-b border-purple-800/30">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs font-semibold text-purple-200 tracking-wide uppercase">
                        Adjacent Match Battle Mechanic
                      </span>
                    </div>

                    {/* Hits to Defeat / Max HP */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Max Health / Breaks to Defeat</span>
                        <span className="font-mono text-purple-300 font-bold tabular-nums text-xs">
                          {config.enemyGem?.maxHits ?? 25} HP ({config.enemyGem?.maxHits ?? 25} Breaks)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="60"
                        step="1"
                        value={config.enemyGem?.maxHits ?? 25}
                        onChange={(e) => updateEnemyGemField('maxHits', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex gap-1 pt-0.5">
                        {[5, 10, 15, 25, 35, 50].map((hpVal) => (
                          <button
                            key={hpVal}
                            onClick={() => updateEnemyGemField('maxHits', hpVal)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              (config.enemyGem?.maxHits ?? 25) === hpVal
                                ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                                : 'bg-neutral-800 border-white/10 text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            {hpVal} HP
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Damage Calculation Mode */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Damage Calculation Mode</span>
                        <span className="font-mono text-purple-300 text-[10.5px]">
                          {(config.enemyGem?.damageCalculation || 'perAdjacentGem') === 'perAdjacentGem'
                            ? 'Per Adjacent Broken Gem'
                            : 'Per Match Event'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => updateEnemyGemField('damageCalculation', 'perAdjacentGem')}
                          className={`px-2 py-1.5 rounded-lg text-[10.5px] font-medium border text-left transition-all ${
                            (config.enemyGem?.damageCalculation || 'perAdjacentGem') === 'perAdjacentGem'
                              ? 'bg-purple-900/60 border-purple-400 text-purple-200 shadow-sm'
                              : 'bg-neutral-900/60 border-white/10 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <span className="font-bold block">Per Broken Gem</span>
                          <span className="text-[9.5px] opacity-75">Each gem broken next to boss = 1 break</span>
                        </button>
                        <button
                          onClick={() => updateEnemyGemField('damageCalculation', 'perMatch')}
                          className={`px-2 py-1.5 rounded-lg text-[10.5px] font-medium border text-left transition-all ${
                            config.enemyGem?.damageCalculation === 'perMatch'
                              ? 'bg-purple-900/60 border-purple-400 text-purple-200 shadow-sm'
                              : 'bg-neutral-900/60 border-white/10 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <span className="font-bold block">Per Match Event</span>
                          <span className="text-[9.5px] opacity-75">1 break per match regardless of count</span>
                        </button>
                      </div>
                    </div>

                    {/* Damage per Break / Match */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Damage Multiplier</span>
                        <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                          {config.enemyGem?.damagePerMatch ?? 1}x DMG
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={config.enemyGem?.damagePerMatch ?? 1}
                        onChange={(e) => updateEnemyGemField('damagePerMatch', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    {/* Health Bar Customization */}
                    <div className="pt-2 border-t border-purple-800/30 space-y-3">
                      <span className="text-[11px] font-bold text-purple-300 tracking-wide uppercase block">
                        Health Progress Bar Settings
                      </span>

                      {/* Show Boss Health Bar Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-medium">Show Health Progress Bar</span>
                        <button
                          onClick={() => updateEnemyGemField('showHealthBar', config.enemyGem?.showHealthBar === false ? true : false)}
                          className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                            config.enemyGem?.showHealthBar !== false ? 'bg-purple-600' : 'bg-neutral-800'
                          }`}
                        >
                          <div
                            className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                              config.enemyGem?.showHealthBar !== false ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Show Numeric Text Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-medium">Show Numeric Text (e.g. 25/25)</span>
                        <button
                          onClick={() => updateEnemyGemField('showHealthText', config.enemyGem?.showHealthText === false ? true : false)}
                          className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                            config.enemyGem?.showHealthText !== false ? 'bg-purple-600' : 'bg-neutral-800'
                          }`}
                        >
                          <div
                            className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                              config.enemyGem?.showHealthText !== false ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Health Bar Width */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-neutral-300 text-xs">
                          <span>Health Bar Width</span>
                          <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                            {config.enemyGem?.healthBarWidth ?? 140}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="220"
                          step="5"
                          value={config.enemyGem?.healthBarWidth ?? 140}
                          onChange={(e) => updateEnemyGemField('healthBarWidth', Number(e.target.value))}
                          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Health Bar Height */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-neutral-300 text-xs">
                          <span>Health Bar Height</span>
                          <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                            {config.enemyGem?.healthBarHeight ?? 16}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="6"
                          max="28"
                          step="1"
                          value={config.enemyGem?.healthBarHeight ?? 16}
                          onChange={(e) => updateEnemyGemField('healthBarHeight', Number(e.target.value))}
                          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Health Bar Vertical Offset */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-neutral-300 text-xs">
                          <span>Health Bar Vertical Offset</span>
                          <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                            {config.enemyGem?.healthBarOffsetY ?? 5}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-20"
                          max="30"
                          step="1"
                          value={config.enemyGem?.healthBarOffsetY ?? 5}
                          onChange={(e) => updateEnemyGemField('healthBarOffsetY', Number(e.target.value))}
                          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Health Bar Fill Color */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-neutral-300 text-xs">
                          <span>Health Bar Fill Color</span>
                          <span className="font-mono text-neutral-400 text-[11px]">
                            {config.enemyGem?.healthBarColor || '#c084fc'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={config.enemyGem?.healthBarColor || '#c084fc'}
                            onChange={(e) => updateEnemyGemField('healthBarColor', e.target.value)}
                            className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                          />
                          <div className="flex gap-1 flex-1">
                            {['#c084fc', '#f43f5e', '#ec4899', '#38bdf8', '#eab308'].map((c) => (
                              <button
                                key={c}
                                onClick={() => updateEnemyGemField('healthBarColor', c)}
                                className={`w-5 h-5 rounded-full border ${
                                  (config.enemyGem?.healthBarColor || '#c084fc') === c ? 'border-white scale-110' : 'border-white/20'
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Base Size Scale */}
                    <div className="space-y-1.5 pt-2 border-t border-purple-800/30">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Base Size Scale</span>
                        <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                          {(config.enemyGem?.baseScale ?? 1.0).toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="1.5"
                        step="0.05"
                        value={config.enemyGem?.baseScale ?? 1.0}
                        onChange={(e) => updateEnemyGemField('baseScale', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    {/* Hurt Shake Intensity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Hurt Shake Intensity</span>
                        <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                          {config.enemyGem?.shakeIntensity ?? 12}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="2"
                        value={config.enemyGem?.shakeIntensity ?? 12}
                        onChange={(e) => updateEnemyGemField('shakeIntensity', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    {/* Hurt Shake Duration */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Hurt Animation Duration</span>
                        <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                          {config.enemyGem?.shakeDuration ?? 400}ms
                        </span>
                      </div>
                      <input
                        type="range"
                        min="150"
                        max="800"
                        step="50"
                        value={config.enemyGem?.shakeDuration ?? 400}
                        onChange={(e) => updateEnemyGemField('shakeDuration', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    {/* Defeat Delay Before New Level */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Defeat Delay Before New Level</span>
                        <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                          {((config.enemyGem?.defeatDelay ?? 1500) / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="3500"
                        step="100"
                        value={config.enemyGem?.defeatDelay ?? 1500}
                        onChange={(e) => updateEnemyGemField('defeatDelay', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>

                  {/* VISUAL & AURA SETTINGS */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <span className="text-xs font-semibold text-neutral-300 tracking-wide uppercase block">
                      Aura & Visuals
                    </span>

                    {/* Dark Purple Presets */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Dark Purple Palette</span>
                        <span className="font-mono text-neutral-400 text-[11px]">
                          {config.enemyGem?.color ?? '#3b0764'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.enemyGem?.color ?? '#3b0764'}
                          onChange={(e) => updateEnemyGemField('color', e.target.value)}
                          className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
                        />
                        <div className="grid grid-cols-4 gap-1 flex-1">
                          {[
                            { name: 'Imperial', hex: '#3b0764', bg: '#3b0764' },
                            { name: 'Abyss', hex: '#2e0249', bg: '#2e0249' },
                            { name: 'Royal', hex: '#581c87', bg: '#581c87' },
                            { name: 'Void', hex: '#18002a', bg: '#18002a' },
                          ].map((p) => (
                            <button
                              key={p.hex}
                              onClick={() => {
                                updateEnemyGemField('color', p.hex);
                                updateEnemyGemField('accentColor', p.hex === '#18002a' ? '#07000e' : '#0a0014');
                              }}
                              className={`px-1.5 py-1 rounded text-[10px] font-mono border transition-all ${
                                (config.enemyGem?.color ?? '#3b0764') === p.hex
                                  ? 'border-purple-400 text-white shadow-sm'
                                  : 'border-white/10 text-neutral-400 hover:text-neutral-200'
                              }`}
                              style={{ backgroundColor: p.bg }}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Smoke Particles Intensity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Smoke Particles Intensity</span>
                        <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                          {config.enemyGem?.smokeIntensity ?? 65}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={config.enemyGem?.smokeIntensity ?? 65}
                        onChange={(e) => updateEnemyGemField('smokeIntensity', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    {/* ENEMY GEM ANIMATION (PULSE & ROTATION) */}
                    <div className="pt-2 border-t border-purple-800/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white font-medium block text-xs">Enemy Gems Pulsating</span>
                          <span className="text-[9px] text-neutral-400 block">Pulsate boss and small enemy gems</span>
                        </div>
                        <button
                          onClick={() => updateEnemyGemField('enablePulsate', config.enemyGem?.enablePulsate === false ? true : false)}
                          className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                            config.enemyGem?.enablePulsate !== false ? 'bg-purple-600' : 'bg-neutral-800'
                          }`}
                        >
                          <div
                            className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                              config.enemyGem?.enablePulsate !== false ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Pulse Speed */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-neutral-300 text-xs">
                          <span>Breathing Pulse Speed</span>
                          <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                            {(config.enemyGem?.pulseSpeed ?? 2.5).toFixed(1)}s
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1.0"
                          max="6.0"
                          step="0.2"
                          value={config.enemyGem?.pulseSpeed ?? 2.5}
                          onChange={(e) => updateEnemyGemField('pulseSpeed', Number(e.target.value))}
                          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Pulse Scale */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-neutral-300 text-xs">
                          <span>Pulse Growth Scale</span>
                          <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                            {(config.enemyGem?.pulseScale ?? 1.06).toFixed(2)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1.00"
                          max="1.25"
                          step="0.01"
                          value={config.enemyGem?.pulseScale ?? 1.06}
                          onChange={(e) => updateEnemyGemField('pulseScale', Number(e.target.value))}
                          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Small Enemy Gem Slow Rotation */}
                      <div className="flex items-center justify-between pt-2 border-t border-purple-800/30">
                        <div>
                          <span className="text-white font-medium block text-xs">Small Enemy Slow Rotation</span>
                          <span className="text-[9px] text-neutral-400 block">Slow 360° spin for small enemy gems</span>
                        </div>
                        <button
                          onClick={() => updateEnemyGemField('smallEnemyRotate', config.enemyGem?.smallEnemyRotate === false ? true : false)}
                          className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                            config.enemyGem?.smallEnemyRotate !== false ? 'bg-purple-600' : 'bg-neutral-800'
                          }`}
                        >
                          <div
                            className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                              config.enemyGem?.smallEnemyRotate !== false ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Small Enemy Rotation Speed */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-neutral-300 text-xs">
                          <span>Rotation Duration</span>
                          <span className="font-mono text-purple-300 tabular-nums text-[11px]">
                            {config.enemyGem?.smallEnemyRotateSpeed ?? 16}s / 360°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="45"
                          step="1"
                          value={config.enemyGem?.smallEnemyRotateSpeed ?? 16}
                          onChange={(e) => updateEnemyGemField('smallEnemyRotateSpeed', Number(e.target.value))}
                          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Rotation Direction */}
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300 text-xs">Rotation Direction</span>
                        <div className="flex items-center gap-1">
                          {[
                            { label: 'Clockwise ↻', val: 'clockwise' as const },
                            { label: 'Counter ↺', val: 'counterclockwise' as const },
                          ].map((btn) => (
                            <button
                              key={btn.val}
                              onClick={() => updateEnemyGemField('smallEnemyRotateDirection', btn.val)}
                              className={`py-1 px-2 rounded text-[10px] font-semibold border transition-colors ${
                                (config.enemyGem?.smallEnemyRotateDirection ?? 'clockwise') === btn.val
                                  ? 'bg-purple-600 text-white border-purple-400'
                                  : 'bg-black/40 text-neutral-300 border-white/10 hover:bg-black/60'
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUICK BATTLE TESTING ACTION */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-neutral-300 block">
                      Quick Level & Location Actions
                    </span>
                    <button
                      onClick={onNewLevel}
                      className="w-full py-2 px-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                      <span>Next Level (Randomizes Enemy Location)</span>
                    </button>
                    <button
                      onClick={() => {
                        const hexagons = getHoneycombLayout(config.hexRadius, config.hexGap, config.gridRadius || 4);
                        const newCenterId = getRandomClusterCenterId(hexagons, config.enemyGem?.centerHexId);
                        if (newCenterId !== -1) {
                          updateEnemyGemField('centerHexId', newCenterId);
                        }
                      }}
                      className="w-full py-2 px-3 bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-purple-400" />
                      <span>Randomize Enemy Location Now</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: STAGE & HEXAGONS */}
          {activeTab === 'stage' && (
            <div className="space-y-4">
              {/* Honeycomb Grid Size (Hexagon Count) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Honeycomb Grid</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    Radius {config.gridRadius || 4} ({3 * (config.gridRadius || 4) * ((config.gridRadius || 4) + 1) + 1} Hexes)
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { r: 2, count: 19, label: '19' },
                    { r: 3, count: 37, label: '37' },
                    { r: 4, count: 61, label: '61' },
                    { r: 5, count: 91, label: '91' },
                  ].map((item) => (
                    <button
                      key={item.r}
                      onClick={() => {
                        onChangeConfig((prev) => {
                          let newHexRadius = prev.hexRadius;
                          let newGemSize = prev.gems.size;
                          if (item.r === 4 && prev.hexRadius > 38) {
                            newHexRadius = 36;
                            newGemSize = 36;
                          } else if (item.r === 5 && prev.hexRadius > 30) {
                            newHexRadius = 28;
                            newGemSize = 28;
                          } else if (item.r === 3 && prev.hexRadius < 40) {
                            newHexRadius = 44;
                            newGemSize = 44;
                          }
                          return {
                            ...prev,
                            gridRadius: item.r,
                            hexRadius: newHexRadius,
                            gems: {
                              ...prev.gems,
                              size: newGemSize,
                            },
                          };
                        });
                      }}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-medium transition-colors ${
                        (config.gridRadius || 4) === item.r
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {item.count} Hexes
                    </button>
                  ))}
                </div>
              </div>

              {/* Hexagon Radius */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Hexagon Radius</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    {config.hexRadius}px
                  </span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="90"
                  step="1"
                  value={config.hexRadius}
                  onChange={(e) => updateField('hexRadius', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Hexagon Gap */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Hexagon Gap</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    {config.hexGap}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={config.hexGap}
                  onChange={(e) => updateField('hexGap', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Stage Background Color (as requested: "allow me to set the stage background color") */}
              <div className="space-y-1.5 p-2.5 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Stage Background Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.stageBgColor}
                      onChange={(e) => updateField('stageBgColor', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="font-mono text-neutral-400 uppercase text-[10px]">
                      {config.stageBgColor}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {['#ffffff', '#f8fafc', '#18181b', '#0f172a'].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateField('stageBgColor', c)}
                      className="py-1 px-1.5 rounded bg-neutral-800 text-[9px] font-mono hover:bg-neutral-700 transition-colors"
                    >
                      {c === '#ffffff' ? 'White' : c === '#18181b' ? 'Dark' : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Frost & Glass Blur Effect */}
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-indigo-800/40">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span className="text-xs font-semibold text-indigo-200 tracking-wide uppercase">
                      Background Frost (Glass Blur)
                    </span>
                  </div>
                  <button
                    onClick={() => updateField('backgroundFrost', !config.backgroundFrost)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      config.backgroundFrost ? 'bg-indigo-600' : 'bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                        config.backgroundFrost ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {config.backgroundFrost && (
                  <>
                    {/* Quick Presets */}
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { name: 'Light', blur: 8, opacity: 15 },
                        { name: 'Medium', blur: 16, opacity: 25 },
                        { name: 'Heavy', blur: 26, opacity: 40 },
                        { name: 'Ice Sheet', blur: 36, opacity: 55 },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            updateFields({
                              backgroundFrostBlur: preset.blur,
                              backgroundFrostOpacity: preset.opacity,
                            });
                          }}
                          className={`py-1 px-1 rounded text-[9px] font-medium border transition-colors cursor-pointer ${
                            (config.backgroundFrostBlur ?? 12) === preset.blur
                              ? 'bg-indigo-600 text-white border-indigo-400'
                              : 'bg-black/40 text-neutral-300 border-white/10 hover:bg-black/60'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>

                    {/* Frost Blur Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Frost Blur Amount</span>
                        <span className="font-mono text-indigo-300 tabular-nums text-[11px]">
                          {config.backgroundFrostBlur ?? 12}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        value={config.backgroundFrostBlur ?? 12}
                        onChange={(e) => updateField('backgroundFrostBlur', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                      />
                    </div>

                    {/* Frost Opacity Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Glass Tint Opacity</span>
                        <span className="font-mono text-indigo-300 tabular-nums text-[11px]">
                          {config.backgroundFrostOpacity ?? 20}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="1"
                        value={config.backgroundFrostOpacity ?? 20}
                        onChange={(e) => updateField('backgroundFrostOpacity', Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                      />
                    </div>

                    {/* Frost Tint Color */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-neutral-300 text-xs">
                        <span>Glass Frost Tint Color</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={config.backgroundFrostTint ?? '#ffffff'}
                            onChange={(e) => updateField('backgroundFrostTint', e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                          />
                          <span className="font-mono text-neutral-400 uppercase text-[10px]">
                            {config.backgroundFrostTint ?? '#ffffff'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Stage Position X */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Stage Center X</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    {Math.round(config.stageX)}px
                  </span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="480"
                  step="1"
                  value={config.stageX}
                  onChange={(e) => updateField('stageX', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Stage Position Y */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Stage Center Y</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    {Math.round(config.stageY)}px
                  </span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="1000"
                  step="1"
                  value={config.stageY}
                  onChange={(e) => updateField('stageY', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Stage Rotation */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Stage Rotation</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    {config.rotation}°
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={config.rotation}
                  onChange={(e) => updateField('rotation', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Hexagon Stroke Width */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Stroke Width</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    {config.strokeWidth}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={config.strokeWidth}
                  onChange={(e) => updateField('strokeWidth', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Hexagon Corner Radius */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Hex Corner Radius</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    {config.cornerRadius ?? 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="22"
                  step="1"
                  value={config.cornerRadius ?? 0}
                  onChange={(e) => updateField('cornerRadius', Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Hexagon Colors & Fill */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider block">
                  Hexagon Fill & Border Colors
                </span>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Hexagon Fill Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.fillColor}
                        onChange={(e) => updateField('fillColor', e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <span className="font-mono text-neutral-400 uppercase text-[10px]">
                        {config.fillColor}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Hexagon Fill Opacity</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.fillOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={config.fillOpacity}
                    onChange={(e) => updateField('fillOpacity', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Hexagon Border Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.strokeColor}
                        onChange={(e) => updateField('strokeColor', e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <span className="font-mono text-neutral-400 uppercase text-[10px]">
                        {config.strokeColor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hexagon Border Line Opacity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Hex Line Opacity</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.strokeOpacity ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={config.strokeOpacity ?? 100}
                    onChange={(e) => updateField('strokeOpacity', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: WINDOW & PHONE DEVICE */}
          {activeTab === 'window' && (
            <div className="space-y-4">
              {/* Zoom Mode */}
              <div className="space-y-2">
                <span className="text-neutral-300">Screen Viewport Zoom</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateField('zoomMode', 'fit')}
                    className={`py-1.5 px-3 rounded-lg text-[11px] font-medium transition-colors ${
                      config.zoomMode === 'fit'
                        ? 'bg-white text-black'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    Fit to Screen
                  </button>
                  <button
                    onClick={() => updateField('zoomMode', 'actual')}
                    className={`py-1.5 px-3 rounded-lg text-[11px] font-medium transition-colors ${
                      config.zoomMode === 'actual'
                        ? 'bg-white text-black'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    100% Real Size
                  </button>
                </div>
              </div>

              {/* Scale Zoom */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Scale Zoom</span>
                  <span className="font-mono text-neutral-400 tabular-nums">
                    {Math.round(config.customZoom)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="150"
                  step="1"
                  value={config.customZoom}
                  onChange={(e) => {
                    updateField('customZoom', Number(e.target.value));
                    if (config.zoomMode !== 'custom') updateField('zoomMode', 'custom');
                  }}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Hex Display Overlays */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-neutral-300">Show Hex Numbers (#)</span>
                <button
                  onClick={() => updateField('showCoordinates', !config.showCoordinates)}
                  className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                    config.showCoordinates ? 'bg-indigo-600' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                      config.showCoordinates ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Hover Highlight</span>
                <button
                  onClick={() => updateField('interactiveHover', !config.interactiveHover)}
                  className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                    config.interactiveHover ? 'bg-indigo-600' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                      config.interactiveHover ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Phone Body & Colors */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider block">
                  Phone Body & Colors
                </span>

                {/* Window Background Color */}
                <div className="space-y-1.5 p-2.5 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Window Background</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.windowBg}
                        onChange={(e) => updateField('windowBg', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <span className="font-mono text-neutral-400 uppercase text-[10px]">
                        {config.windowBg}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { label: 'White', color: '#ffffff' },
                      { label: 'Slate', color: '#f8fafc' },
                      { label: 'Dark', color: '#18181b' },
                      { label: 'Onyx', color: '#0f172a' },
                    ].map((p) => (
                      <button
                        key={p.color}
                        onClick={() => updateField('windowBg', p.color)}
                        className="py-1 px-1.5 rounded bg-neutral-800 text-[9px] font-mono hover:bg-neutral-700 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outer Background Color (Black outside the window) */}
                <div className="space-y-1.5 p-2.5 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Outer Background (Outside)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.outerBg}
                        onChange={(e) => updateField('outerBg', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <span className="font-mono text-neutral-400 uppercase text-[10px]">
                        {config.outerBg}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { label: 'Black', color: '#000000' },
                      { label: 'Charcoal', color: '#121214' },
                      { label: 'Dark Gray', color: '#28282a' },
                      { label: 'Slate', color: '#0f172a' },
                    ].map((p) => (
                      <button
                        key={p.color}
                        onClick={() => updateField('outerBg', p.color)}
                        className="py-1 px-1.5 rounded bg-neutral-800 text-[9px] font-mono hover:bg-neutral-700 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Window Corner Radius */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Window Corner Radius</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.windowRadius}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="130"
                    step="1"
                    value={config.windowRadius}
                    onChange={(e) => updateField('windowRadius', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Subtle Window Shadow Blur */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Window Shadow Blur</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.windowShadowBlur}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="2"
                    value={config.windowShadowBlur}
                    onChange={(e) => updateField('windowShadowBlur', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Window Shadow Opacity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Shadow Opacity</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.windowShadowOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={config.windowShadowOpacity}
                    onChange={(e) => updateField('windowShadowOpacity', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Dynamic Island / Top Notch Controls */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider block">
                  Top Notch Island
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Show Top Notch</span>
                  <button
                    onClick={() => updateField('notchVisible', !config.notchVisible)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                      config.notchVisible ? 'bg-indigo-600' : 'bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                        config.notchVisible ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Notch Width</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.notchWidth}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="220"
                    step="1"
                    value={config.notchWidth}
                    onChange={(e) => updateField('notchWidth', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Notch Height</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.notchHeight}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="80"
                    step="1"
                    value={config.notchHeight}
                    onChange={(e) => updateField('notchHeight', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Notch Top Offset</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {config.notchTop}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={config.notchTop}
                    onChange={(e) => updateField('notchTop', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Top Bar HUD Positioning Controls inside Window tab */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider block">
                  Top Bar HUD Margins (Currencies & Pause)
                </span>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Soft Currency Left Position</span>
                    <span className="font-mono text-amber-300 tabular-nums">
                      {config.currencies?.softCurrencyLeft ?? 46}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="140"
                    step="1"
                    value={config.currencies?.softCurrencyLeft ?? 46}
                    onChange={(e) => updateCurrencyField('softCurrencyLeft', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Premium Currency & Pause Right Position</span>
                    <span className="font-mono text-cyan-300 tabular-nums">
                      {config.currencies?.hardCurrencyRight ?? 46}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="140"
                    step="1"
                    value={config.currencies?.hardCurrencyRight ?? 46}
                    onChange={(e) => updateCurrencyField('hardCurrencyRight', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: CURRENCIES (SOFT & HARD) */}
          {activeTab === 'currencies' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Coins className="w-4 h-4" />
                  <span>Game Economy & Currencies</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Configure visual assets for the soft currency (coins) and hard/premium currency (gems). Both are integrated directly into the HUD top bar and the End-Game continue modal.
                </p>
              </div>

              {/* TOP BAR HUD POSITIONING & SPACING (LIVE UI TWEAKS) */}
              <div className="p-3 bg-gradient-to-br from-amber-950/40 via-neutral-900/60 to-neutral-950/70 border border-amber-500/40 rounded-xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-white font-semibold text-xs">
                      Top Bar HUD Layout & Positioning
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono">
                    Live UI Tweaks
                  </span>
                </div>

                {/* Soft Currency Left Position */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Soft Currency (Left Position)</span>
                    <span className="font-mono text-amber-300 font-semibold tabular-nums">
                      {config.currencies?.softCurrencyLeft ?? 46}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="140"
                    step="1"
                    value={config.currencies?.softCurrencyLeft ?? 46}
                    onChange={(e) => updateCurrencyField('softCurrencyLeft', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>Left Edge (10px)</span>
                    <span>Current: {config.currencies?.softCurrencyLeft ?? 46}px (+20px right)</span>
                    <span>Center (140px)</span>
                  </div>
                </div>

                {/* Premium Currency & Pause Right Position */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Premium Currency & Pause (Right Position)</span>
                    <span className="font-mono text-cyan-300 font-semibold tabular-nums">
                      {config.currencies?.hardCurrencyRight ?? 46}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="140"
                    step="1"
                    value={config.currencies?.hardCurrencyRight ?? 46}
                    onChange={(e) => updateCurrencyField('hardCurrencyRight', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>Right Edge (10px)</span>
                    <span>Current: {config.currencies?.hardCurrencyRight ?? 46}px (+20px left)</span>
                    <span>Center (140px)</span>
                  </div>
                </div>

                {/* Top Bar Vertical Offset (Y) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Top Bar Vertical Offset (Y)</span>
                    <span className="font-mono text-neutral-300 tabular-nums">
                      {(config.currencies?.topBarYOffset ?? 0) >= 0 ? `+${config.currencies?.topBarYOffset ?? 0}` : config.currencies?.topBarYOffset ?? 0}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="40"
                    step="1"
                    value={config.currencies?.topBarYOffset ?? 0}
                    onChange={(e) => updateCurrencyField('topBarYOffset', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Pause Button Gap */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Gap between Premium & Pause</span>
                    <span className="font-mono text-neutral-300 tabular-nums">
                      {config.currencies?.pauseGap ?? 8}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="28"
                    step="1"
                    value={config.currencies?.pauseGap ?? 8}
                    onChange={(e) => updateCurrencyField('pauseGap', Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Quick Presets */}
                <div className="pt-1.5 border-t border-white/10 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase">Presets:</span>
                  <button
                    type="button"
                    onClick={() => updateCurrencyFields({ softCurrencyLeft: 46, hardCurrencyRight: 46, topBarYOffset: 0, pauseGap: 8 })}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10.5px] font-medium transition-colors cursor-pointer"
                  >
                    +20px Shift (46px)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrencyFields({ softCurrencyLeft: 26, hardCurrencyRight: 26, topBarYOffset: 0, pauseGap: 8 })}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-[10.5px] font-medium transition-colors cursor-pointer"
                  >
                    Original (26px)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrencyFields({ softCurrencyLeft: 60, hardCurrencyRight: 60, topBarYOffset: 0, pauseGap: 10 })}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-[10.5px] font-medium transition-colors cursor-pointer"
                  >
                    Wide Inset (60px)
                  </button>
                </div>
              </div>

              {/* SOFT CURRENCY SECTION */}
              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                      <img
                        src={normalizeImgurUrl(config.currencies?.softCurrencyIcon) || DEFAULT_SOFT_CURRENCY_ICON}
                        alt="Soft Currency"
                        className="w-5 h-5 object-contain filter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Soft Currency</h4>
                      <p className="text-[10px] text-neutral-400">Standard gameplay currency (Coins)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateCurrencyField('softCurrencyIcon', DEFAULT_SOFT_CURRENCY_ICON)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    title="Reset to default icon"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-300">Name</label>
                  <input
                    type="text"
                    value={config.currencies?.softCurrencyName || 'Pixie Coins'}
                    onChange={(e) => updateCurrencyField('softCurrencyName', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500"
                    placeholder="e.g. Pixie Coins"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-neutral-300">Image Asset URL</label>
                    <button
                      onClick={() => handleCopy(config.currencies?.softCurrencyIcon || DEFAULT_SOFT_CURRENCY_ICON, 'soft-icon')}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'soft-icon' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'soft-icon' ? 'Copied!' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.currencies?.softCurrencyIcon || DEFAULT_SOFT_CURRENCY_ICON}
                    onChange={(e) => updateCurrencyField('softCurrencyIcon', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 font-mono"
                    placeholder="https://..."
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">Live Preview:</span>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-amber-400/40 text-amber-200 text-xs font-bold shadow-inner">
                    <img
                      src={normalizeImgurUrl(config.currencies?.softCurrencyIcon) || DEFAULT_SOFT_CURRENCY_ICON}
                      alt="Soft Currency Preview"
                      className="w-5 h-5 object-contain"
                    />
                    <span>2,450</span>
                  </div>
                </div>
              </div>

              {/* HARD / PREMIUM CURRENCY SECTION */}
              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                      <img
                        src={normalizeImgurUrl(config.currencies?.hardCurrencyIcon) || DEFAULT_HARD_CURRENCY_ICON}
                        alt="Hard Currency"
                        className="w-5 h-5 object-contain filter drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Hard / Premium Currency</h4>
                      <p className="text-[10px] text-neutral-400">Premium revival & store currency (Crystals/Gems)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateCurrencyField('hardCurrencyIcon', DEFAULT_HARD_CURRENCY_ICON)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    title="Reset to default icon"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-300">Name</label>
                  <input
                    type="text"
                    value={config.currencies?.hardCurrencyName || 'Magic Crystals'}
                    onChange={(e) => updateCurrencyField('hardCurrencyName', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500"
                    placeholder="e.g. Magic Crystals"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-neutral-300">Image Asset URL</label>
                    <button
                      onClick={() => handleCopy(config.currencies?.hardCurrencyIcon || DEFAULT_HARD_CURRENCY_ICON, 'hard-icon')}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'hard-icon' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'hard-icon' ? 'Copied!' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.currencies?.hardCurrencyIcon || DEFAULT_HARD_CURRENCY_ICON}
                    onChange={(e) => updateCurrencyField('hardCurrencyIcon', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 font-mono"
                    placeholder="https://..."
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">Live Preview:</span>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-cyan-400/40 text-cyan-200 text-xs font-bold shadow-inner">
                    <img
                      src={normalizeImgurUrl(config.currencies?.hardCurrencyIcon) || DEFAULT_HARD_CURRENCY_ICON}
                      alt="Hard Currency Preview"
                      className="w-5 h-5 object-contain"
                    />
                    <span>150</span>
                  </div>
                </div>
              </div>

              {/* QUICK MODAL & EFFECT PREVIEWS */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('winx-trigger-match-coins'))}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 border border-amber-400/40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-200" />
                  <span>Test 6+ Match Coin Shower (+10 Coins)</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('winx-trigger-stage-cleared'))}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 border border-emerald-400/40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Test 'STAGE CLEARED' Banner</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('winx-trigger-time-up'))}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 border border-purple-500/40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Test Out-of-Time Continue Popup</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
