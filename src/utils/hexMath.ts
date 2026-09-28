/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HexInfo } from '../types/game';

/**
 * Generates a regular hexagonal honeycomb grid (pointy-topped) with axial coordinates.
 * - gridRadius = 2: 19 hexagons
 * - gridRadius = 3: 37 hexagons (4-5-6-7-6-5-4 rows)
 * - gridRadius = 4: 61 hexagons
 *
 * Zero gap formula for pointy-topped hexagons:
 * x = (q + r / 2) * (sqrt(3) * R + gap)
 * y = r * (1.5 * R + (sqrt(3)/2) * gap)
 */
export function getHoneycombLayout(R: number, gap: number = 0, gridRadius: number = 3): HexInfo[] {
  const hexes: HexInfo[] = [];
  let id = 0;

  const hexDist = Math.sqrt(3) * R + gap;
  const dy = (1.5 * R) + (Math.sqrt(3) / 2) * gap;

  // We sort in top-to-bottom, left-to-right order
  for (let r = -gridRadius; r <= gridRadius; r++) {
    const qMin = Math.max(-gridRadius, -r - gridRadius);
    const qMax = Math.min(gridRadius, -r + gridRadius);

    for (let q = qMin; q <= qMax; q++) {
      const s = -q - r;
      // Pointy-topped Cartesian conversion
      const x = (q + r / 2) * hexDist;
      const y = r * dy;

      hexes.push({
        id,
        q,
        r,
        s,
        label: `${q},${r}`,
        offsetX: x,
        offsetY: y,
      });
      id++;
    }
  }

  return hexes;
}

/**
 * Checks if two hexagon IDs are adjacent in the hexagonal coordinate system.
 * Two hexagons are adjacent if their axial distance equals 1.
 */
export function areHexagonsAdjacent(hexA: HexInfo, hexB: HexInfo): boolean {
  if (hexA.id === hexB.id) return false;
  const dq = Math.abs(hexA.q - hexB.q);
  const dr = Math.abs(hexA.r - hexB.r);
  const ds = Math.abs(hexA.s - hexB.s);
  return Math.max(dq, dr, ds) === 1;
}

/**
 * Generates polygon point coordinates string for a pointy-topped hexagon.
 */
export function getHexagonPoints(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = i * 60 - 90;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = cx + r * Math.cos(angleRad);
    const y = cy + r * Math.sin(angleRad);
    points.push(`${x.toFixed(3)},${y.toFixed(3)}`);
  }
  return points.join(' ');
}

/**
 * Generates an SVG path string for a pointy-topped regular hexagon with optional rounded corners.
 * When cornerRadius is 0 (or <= 0), it generates sharp pointy corners.
 * When cornerRadius > 0, it fillets each vertex using quadratic Bézier curves.
 */
export function getHexagonPath(
  cx: number,
  cy: number,
  r: number,
  cornerRadius: number = 0
): string {
  const vertices: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = ((i * 60 - 90) * Math.PI) / 180;
    vertices.push({
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    });
  }

  if (!cornerRadius || cornerRadius <= 0) {
    return (
      `M ${vertices[0].x.toFixed(3)},${vertices[0].y.toFixed(3)} ` +
      vertices
        .slice(1)
        .map((v) => `L ${v.x.toFixed(3)},${v.y.toFixed(3)}`)
        .join(' ') +
      ' Z'
    );
  }

  // Cap maximum corner radius so it doesn't invert (each edge length is r)
  const d = Math.min(cornerRadius, r * 0.48);

  const pathParts: string[] = [];

  for (let i = 0; i < 6; i++) {
    const prev = vertices[(i + 5) % 6];
    const curr = vertices[i];
    const next = vertices[(i + 1) % 6];

    const distPrev = Math.hypot(prev.x - curr.x, prev.y - curr.y) || 1;
    const distNext = Math.hypot(next.x - curr.x, next.y - curr.y) || 1;

    const uPrevX = (prev.x - curr.x) / distPrev;
    const uPrevY = (prev.y - curr.y) / distPrev;
    const uNextX = (next.x - curr.x) / distNext;
    const uNextY = (next.y - curr.y) / distNext;

    const inX = curr.x + uPrevX * d;
    const inY = curr.y + uPrevY * d;
    const outX = curr.x + uNextX * d;
    const outY = curr.y + uNextY * d;

    if (i === 0) {
      pathParts.push(`M ${inX.toFixed(3)},${inY.toFixed(3)}`);
    } else {
      pathParts.push(`L ${inX.toFixed(3)},${inY.toFixed(3)}`);
    }

    pathParts.push(
      `Q ${curr.x.toFixed(3)},${curr.y.toFixed(3)} ${outX.toFixed(3)},${outY.toFixed(3)}`
    );
  }

  pathParts.push('Z');
  return pathParts.join(' ');
}

/**
 * Finds the nearest hexagon to given stage coordinates.
 */
export function findNearestHexagon(
  x: number,
  y: number,
  hexagons: HexInfo[],
  maxSnapDist: number = Infinity
): { hex: HexInfo; distance: number } | null {
  let nearest: HexInfo | null = null;
  let minDist = Infinity;

  for (const hex of hexagons) {
    const dist = Math.hypot(x - hex.offsetX, y - hex.offsetY);
    if (dist < minDist) {
      minDist = dist;
      nearest = hex;
    }
  }

  if (nearest && minDist <= maxSnapDist) {
    return { hex: nearest, distance: minDist };
  }

  return null;
}

/**
 * Returns a 7-hex rosette cluster consisting of a center hexagon and its 6 adjacent neighbors.
 * Returns null if the specified center (or fallback center) doesn't have all 6 neighbors within the grid.
 */
export function getSevenHexCluster(
  hexagons: HexInfo[],
  preferredCenterHexId?: number
): { center: HexInfo; neighbors: HexInfo[]; all: HexInfo[]; hexIds: Set<number> } | null {
  if (hexagons.length < 7) return null;

  let centerHex: HexInfo | undefined;
  if (preferredCenterHexId !== undefined && preferredCenterHexId >= 0) {
    centerHex = hexagons.find((h) => h.id === preferredCenterHexId);
  }

  // Fallback to honeycomb origin (q=0, r=0, s=0)
  if (!centerHex) {
    centerHex = hexagons.find((h) => h.q === 0 && h.r === 0);
  }

  // Fallback to middle element
  if (!centerHex) {
    centerHex = hexagons[Math.floor(hexagons.length / 2)];
  }

  // Check if centerHex has all 6 adjacent neighbors
  let neighbors = hexagons.filter((h) => areHexagonsAdjacent(centerHex!, h));
  if (neighbors.length === 6) {
    // Sort neighbors in clockwise angular order around center for clean visual layout
    neighbors.sort((a, b) => {
      const angleA = Math.atan2(a.offsetY - centerHex!.offsetY, a.offsetX - centerHex!.offsetX);
      const angleB = Math.atan2(b.offsetY - centerHex!.offsetY, b.offsetX - centerHex!.offsetX);
      return angleA - angleB;
    });

    const all = [centerHex, ...neighbors];
    return {
      center: centerHex,
      neighbors,
      all,
      hexIds: new Set(all.map((h) => h.id)),
    };
  }

  // Search across hexagons for any interior hexagon that has all 6 neighbors
  for (const candidate of hexagons) {
    neighbors = hexagons.filter((h) => areHexagonsAdjacent(candidate, h));
    if (neighbors.length === 6) {
      neighbors.sort((a, b) => {
        const angleA = Math.atan2(a.offsetY - candidate.offsetY, a.offsetX - candidate.offsetX);
        const angleB = Math.atan2(b.offsetY - candidate.offsetY, b.offsetX - candidate.offsetX);
        return angleA - angleB;
      });

      const all = [candidate, ...neighbors];
      return {
        center: candidate,
        neighbors,
        all,
        hexIds: new Set(all.map((h) => h.id)),
      };
    }
  }

  return null;
}

/**
 * Returns all hexagon candidates that have all 6 neighbors inside the grid,
 * making them valid centers for a 7-hex cluster.
 */
export function getAllValidClusterCenters(hexagons: HexInfo[]): HexInfo[] {
  return hexagons.filter((candidate) => {
    const neighbors = hexagons.filter((h) => areHexagonsAdjacent(candidate, h));
    return neighbors.length === 6;
  });
}

/**
 * Returns a random valid center hexagon ID for a 7-hex cluster.
 * Avoids picking the previous center ID if other valid options exist.
 */
export function getRandomClusterCenterId(hexagons: HexInfo[], currentCenterId?: number): number {
  const validCenters = getAllValidClusterCenters(hexagons);
  if (validCenters.length === 0) return -1;
  const pool = validCenters.filter((c) => c.id !== currentCenterId);
  const selectedPool = pool.length > 0 ? pool : validCenters;
  const chosen = selectedPool[Math.floor(Math.random() * selectedPool.length)];
  return chosen.id;
}

