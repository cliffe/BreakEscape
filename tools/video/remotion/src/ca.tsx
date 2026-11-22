import React from 'react';
import { PIXEL_FONT, GNF_FONT, VT_FONT } from './fonts';

/** Cyber Aware "Two seats" theme: tokens and shared parts (docs/video/CA_THEME_TWO_SEATS.md). Beside SAFETYNET, changes none of it. */
export const CA = { surface: '#f6f8f7', ink: '#1f2933', line: '#cfd8d4', mark: '#2f6f5e', attack: '#8c3b2e', attackTint: '#f3e4df', defend: '#2f5f8a', defendTint: '#e1eaf2' };
/** One design pixel in output pixels: the spec's "2 px border" is 2 units (4 px at 1080 high or wide). */
export const unit = (w: number, h: number) => Math.max(1, Math.round(Math.min(w, h) / 540));
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** progress 0..1 quantised to n steps (stepped, pixel-style motion) */
export const stepped = (p: number, n: number) => Math.round(clamp01(p) * n) / n;
export const easeOut = (p: number) => 1 - (1 - clamp01(p)) * (1 - clamp01(p));
export const snapTo = (v: number, q: number) => Math.round(v / q) * q;
export const crisp: React.CSSProperties = { WebkitFontSmoothing: 'none' as any, textRendering: 'optimizeSpeed' as any, imageRendering: 'pixelated' };
/** Stacked (seam horizontal) for 9:16 and 1:1, side by side for 16:9. */
export const isStacked = (w: number, h: number) => w <= h;
/** Press Start 2P size for seat labels: a multiple of 8. */
export const tabFont = (w: number, h: number) => Math.max(16, Math.round((Math.min(w, h) * 0.022) / 8) * 8);

let ctx: CanvasRenderingContext2D | null = null;
/** Text width in output px (fonts are loaded before any frame renders, so the canvas sees the real face). */
export function textWidth(text: string, family: string, size: number): number {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * size * 0.6;
  ctx.font = `${size}px ${family}`;
  return ctx.measureText(text).width;
}
/** Biggest size from `sizes` (descending) at which the widest line fits maxW; falls back to the smallest. */
export function fitSize(lines: string[], family: string, sizes: number[], maxW: number): number {
  for (const s of sizes) if (Math.max(...lines.map((l) => textWidth(l, family, s))) <= maxW) return s;
  return sizes[sizes.length - 1];
}
export const COLORS = { PIXEL_FONT, GNF_FONT, VT_FONT };

/** The label tab: seat colour, white Press Start 2P, 2 unit ink border, optional company stripe along its lower edge. */
export const CaTab: React.FC<{ label: string; bg: string; size: number; u: number; stripe?: string | null; style?: React.CSSProperties }> = ({ label, bg, size, u, stripe, style }) => (
  <div style={{ position: 'absolute', boxSizing: 'border-box', background: bg, border: `${2 * u}px solid ${CA.ink}`, color: '#fff', fontFamily: PIXEL_FONT, fontSize: size, lineHeight: 1, padding: `${Math.round(size * 0.5)}px ${Math.round(size * 0.6)}px ${Math.round(size * 0.5) + (stripe ? 3 * u : 0)}px`, whiteSpace: 'nowrap', ...crisp, ...style }}>
    {label}
    {stripe ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3 * u, background: stripe }} /> : null}
  </div>
);

/** Placeholder Cyber Aware mark: an attack and a defend square overlapped at a corner, "CYBER AWARE" in the mark colour. `layout` row (text right) or column (text under). */
export const CaMark: React.FC<{ s: number; u: number; font: number; layout?: 'row' | 'column'; textColor?: string; showText?: boolean }> = ({ s, u, font, layout = 'row', textColor = CA.mark, showText = true }) => {
  const off = Math.round(s * 0.55), gw = s + off;
  const sq = (x: number, y: number, c: string, z: number) => <div style={{ position: 'absolute', left: x, top: y, width: s, height: s, boxSizing: 'border-box', background: c, border: `${2 * u}px solid ${CA.ink}`, zIndex: z }} />;
  const glyph = <div style={{ position: 'relative', width: gw, height: gw, flex: 'none' }}>{sq(0, 0, CA.attack, 1)}{sq(off, off, CA.defend, 2)}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: layout === 'row' ? 'row' : 'column', alignItems: 'center', gap: Math.round(s * 0.5) }}>
      {glyph}
      {showText ? <div style={{ fontFamily: PIXEL_FONT, fontSize: font, color: textColor, whiteSpace: 'nowrap', lineHeight: 1, ...crisp }}>CYBER AWARE</div> : null}
    </div>
  );
};
export const markSize = (s: number) => s + Math.round(s * 0.55);
