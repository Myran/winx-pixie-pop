/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StageConfig } from '../types/game';
import { getHoneycombLayout, getHexagonPath, getSevenHexCluster } from '../utils/hexMath';

interface HexagonStageProps {
  config: StageConfig;
  selectedHexId?: number | null;
  hoveredTargetHexId?: number | null;
  onSelectHex?: (id: number | null) => void;
  immovableEnemyHexIds?: Set<number>;
}

export const HexagonStage: React.FC<HexagonStageProps> = ({
  config,
  hoveredTargetHexId,
  immovableEnemyHexIds,
}) => {
  const [hoveredHexId, setHoveredHexId] = useState<number | null>(null);

  const {
    hexRadius: R,
    hexGap: G,
    stageX,
    stageY,
    rotation,
    stageBgColor,
    strokeWidth,
    strokeColor,
    strokeOpacity = 100,
    cornerRadius = 0,
    fillColor,
    fillOpacity,
    showCoordinates,
    interactiveHover,
  } = config;

  const hexagons = useMemo(
    () => getHoneycombLayout(R, G, config.gridRadius || 4),
    [R, G, config.gridRadius]
  );

  const enemyCluster = useMemo(() => {
    if (!config.enemyGem?.enabled) return null;
    return getSevenHexCluster(hexagons, config.enemyGem.centerHexId);
  }, [config.enemyGem?.enabled, config.enemyGem?.centerHexId, hexagons]);

  return (
    <div
      className="absolute inset-0 pointer-events-auto select-none"
      style={{
        backgroundColor: stageBgColor === '#ffffff' ? 'transparent' : (stageBgColor || 'transparent'),
        transition: 'background-color 0.2s ease',
      }}
    >
      <svg
        width={config.windowWidth}
        height={config.windowHeight}
        viewBox={`0 0 ${config.windowWidth} ${config.windowHeight}`}
        className="w-full h-full pointer-events-auto"
        style={{ shapeRendering: 'geometricPrecision' }}
      >
        <defs>
          <filter id="hex-target-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Dark purple/black radial gradient for the enemy hexes (customizable individually) */}
          <radialGradient id="enemy-hex-bg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={config.enemyGem?.enemyHexBgStart || '#250238'} />
            <stop offset="65%" stopColor={config.enemyGem?.enemyHexBgMid || config.enemyGem?.color || '#3b0764'} />
            <stop offset="100%" stopColor={config.enemyGem?.enemyHexBgEnd || config.enemyGem?.accentColor || '#18002a'} />
          </radialGradient>
        </defs>

        <g
          transform={`translate(${stageX}, ${stageY}) rotate(${rotation})`}
          style={{ transformOrigin: '0 0' }}
        >
          {hexagons.map((hex) => {
            const isBossHex = Boolean(config.enemyGem?.enabled && enemyCluster?.hexIds.has(hex.id));
            const isSmallEnemyHex = Boolean(immovableEnemyHexIds?.has(hex.id));
            const isEnemyHex = isBossHex || isSmallEnemyHex;
            const isHovered = interactiveHover && hoveredHexId === hex.id;
            const isDragTarget = hoveredTargetHexId === hex.id;

            let currentFill = fillColor;
            let currentOpacity = fillOpacity / 100;
            let currentStroke = strokeColor;
            let currentStrokeWidth = strokeWidth;
            let currentStrokeOpacity = strokeOpacity / 100;

            if (isEnemyHex) {
              // Occupied by enemy gem (boss 7-hex or small immovable enemy gem): dark purple/black honeycomb tiles
              currentFill = 'url(#enemy-hex-bg)';
              currentOpacity = (config.enemyGem?.enemyHexOpacity ?? 92) / 100;
              currentStroke = config.enemyGem?.enemyHexStroke || config.enemyGem?.glowColor || '#581c87';
              currentStrokeWidth = Math.max(strokeWidth + 0.5, 2.2);
              currentStrokeOpacity = (config.enemyGem?.enemyHexStrokeOpacity ?? 100) / 100;
            }

            if (isDragTarget) {
              currentFill = '#52525a';
              currentOpacity = 1;
              currentStroke = '#ffffff';
              currentStrokeWidth = Math.max(strokeWidth + 1.5, 3.5);
              currentStrokeOpacity = 1;
            } else if (isHovered) {
              currentOpacity = Math.min(1, currentOpacity + 0.15);
              currentStroke = isEnemyHex ? '#c084fc' : '#888888';
              currentStrokeOpacity = 1;
            }

            const pathD = getHexagonPath(hex.offsetX, hex.offsetY, R, cornerRadius);

            return (
              <g
                key={hex.id}
                className="transition-colors duration-150"
                onMouseEnter={() => setHoveredHexId(hex.id)}
                onMouseLeave={() => setHoveredHexId(null)}
              >
                <path
                  d={pathD}
                  fill={currentFill}
                  fillOpacity={currentOpacity}
                  stroke={currentStroke}
                  strokeWidth={currentStrokeWidth}
                  strokeOpacity={currentStrokeOpacity}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter={isDragTarget ? 'url(#hex-target-glow)' : undefined}
                />
                {showCoordinates && (
                  <text
                    x={hex.offsetX}
                    y={hex.offsetY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize={Math.max(9, Math.round(R * 0.22))}
                    fontFamily="monospace"
                    fontWeight="600"
                    pointerEvents="none"
                    opacity={0.8}
                  >
                    #{hex.id}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
