/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Known mapping from Imgur IDs to local bundled assets.
 * Imgur blocks/geo-restricts several European and global regions, returning
 * "Content not viewable in your region". Mapping them to local assets guarantees
 * 100% availability worldwide.
 */
export const KNOWN_IMGUR_MAP: Record<string, string> = {
  'pmbYkdQ': '/currencies/coin.png',
  'KQIldQr': '/currencies/crystal.png',
  'PksiFVh': '/gems/bloom.png',
  'dYZk9hI': '/gems/stella.png',
  '1IEPC8W': '/gems/flora.png',
  'vb31Tfo': '/gems/musa.png',
  'VJwWxvy': '/gems/tecna.png',
  'IIrisg2': '/gems/aisha.png',
  'xFN0qeM': '/enemy/shadow_core.png',
  'tTK7L5j': '/enemy/companion.png',
};

/**
 * Normalizes URLs so they reliably load as direct image assets.
 * Automatically resolves Imgur links to local first-party bundled assets
 * to prevent "Content not viewable in your region" errors.
 */
export function normalizeImgurUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Check known Imgur assets and substitute local path
  for (const [id, localPath] of Object.entries(KNOWN_IMGUR_MAP)) {
    if (trimmed.includes(id)) {
      return localPath;
    }
  }

  if (trimmed.includes('imgur.com/') && !trimmed.includes('i.imgur.com/')) {
    const id = trimmed.split('imgur.com/')[1]?.split(/[?#]/)[0]?.replace('/', '');
    if (id && KNOWN_IMGUR_MAP[id]) return KNOWN_IMGUR_MAP[id];
    if (id) return `https://i.imgur.com/${id}.png`;
  }
  return trimmed;
}

export const DEFAULT_SOFT_CURRENCY_ICON = '/currencies/coin.png';
export const DEFAULT_HARD_CURRENCY_ICON = '/currencies/crystal.png';
