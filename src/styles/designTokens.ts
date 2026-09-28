/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared Winx Fairies Design Tokens & Palette Reference
 * Primary Palette from user reference:
 * - Neutrals: White (#FFFFFF), Black (#000000), Soft Fairy Pink (#F5B7D9)
 * - Bloom: #3E63FF (Vibrant Celestial Blue)
 * - Stella: #FFB238 (Sun Gold / Amber)
 * - Flora: #FF9AC5 (Blossom Rose Pink)
 * - Musa: #FF4F5E (Ruby Crimson / Coral Red)
 * - Tecna: #9B59FF (Electric Violet / Purple)
 * - Aisha: #2FD9C4 (Sparkling Aquamarine / Cyan)
 */

export const WINX_PALETTE = {
  white: '#FFFFFF',
  black: '#000000',
  softPink: '#F5B7D9',
  bloom: '#3E63FF',
  stella: '#FFB238',
  flora: '#FF9AC5',
  musa: '#FF4F5E',
  tecna: '#9B59FF',
  aisha: '#2FD9C4',
} as const;

export const WINX_TOKENS = {
  // Common Dark Glass & Modal Surfaces
  surface: {
    overlay: 'rgba(8, 11, 26, 0.84)',
    cardBg: 'linear-gradient(180deg, #1d123e 0%, #100d29 40%, #090b1a 100%)',
    innerCardBg: 'rgba(11, 16, 38, 0.72)',
    badgeBg: 'rgba(11, 21, 40, 0.88)',
  },
  // Unified Borders
  borders: {
    gold: 'rgba(255, 178, 56, 0.85)',
    cyan: 'rgba(47, 217, 196, 0.7)',
    violet: 'rgba(155, 89, 255, 0.5)',
    subtle: 'rgba(255, 255, 255, 0.18)',
  },
  // Common Button Styles
  button: {
    // Circle control button style (shared between Pause button and Close 'X' button)
    circleControl:
      'w-9 h-9 rounded-full bg-[#0B1528]/85 hover:bg-[#152542] border border-white/20 hover:border-[#2FD9C4]/60 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition-all shadow-[0_2px_14px_rgba(0,0,0,0.4)] cursor-pointer active:scale-90',
  },
} as const;
