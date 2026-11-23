import React from 'react';
import { Img, staticFile } from 'remotion';
import { unit, textWidth } from './ca';
import { PIXEL_FONT } from './fonts';

/**
 * "Critical Cases" trailer theme (Incident Simulations: Critical Cases, sis01 / sis02): tokens and shared parts.
 * The look is the Hacktivity course tile (docs/video/recipes/critical-cases-trailer.md): painted three-panel art, an amber
 * "INCIDENT SIMULATIONS" badge, cream (#f1eee7) type. The open card keeps the tile's IBM Plex logo exactly (owner's pick A,
 * the one place the pixel-font rule is waived); the mid and end cards are panel cards (pick C): one painted panel as the
 * ground, framed in the case accent, Press Start 2P. Beside SAFETYNET and Cyber Aware, changes neither.
 */
export const CC = { cream: '#f1eee7', badge: '#e8a24a', ink: '#080c0f', shade: '#050a0e', teal: '#46c4c0', amber: '#e69a46' };
export const CC_ART = { file: 'brand/g_three_case_studies.png', w: 1376, h: 768, panels: 3 };
export const CC_LOGO = { file: 'brand/critical_cases.svg', w: 942.3, h: 617.3, inkX: 251.15, inkW: 441.1, inkY: 191.0, inkH: 243.4 };
export const PLEX_COND = "'IBM Plex Sans Condensed', 'Arial Narrow', sans-serif";
export const PLEX_MONO = "'IBM Plex Mono', monospace";

export type CcCfg = { accent: string; panel: number; case1: string; case2: string; series: [string, string]; cta: string };
const DEFAULT_ACCENT: Record<string, string> = { sis01: CC.teal, sis02: CC.amber };
/** Edit-level `cc` merged under the shot's own `cc` (see Teaser): accent, panel (0 ward, 1 furnace, 2 boardroom), case1/case2, series, cta. */
export function ccCfg(shot: any): CcCfg {
  const c = shot.cc || {};
  return {
    accent: c.accent || DEFAULT_ACCENT[c.case] || CC.teal,
    panel: Math.max(0, Math.min(CC_ART.panels - 1, c.panel ?? (c.case === 'sis02' ? 1 : 0))),
    case1: String(c.case1 || ''), case2: String(c.case2 || ''),
    series: [String(c.series?.[0] || 'Incident Simulations'), String(c.series?.[1] || 'Critical Cases')],
    cta: String(c.cta || 'Play now on Hacktivity.co.uk'),
  };
}

/** Width of `text` with CSS letter-spacing `ls` (em) added, in output px. */
export const spacedWidth = (text: string, family: string, size: number, ls: number) => textWidth(text, family, size) + Math.max(0, text.length - 1) * ls * size;
/** Biggest size from `sizes` (descending) at which the widest line fits maxW with letter-spacing, else the smallest. */
export function fitSpaced(lines: string[], family: string, sizes: number[], maxW: number, ls: number): number {
  for (const s of sizes) if (Math.max(...lines.map((l) => spacedWidth(l, family, s, ls))) <= maxW) return s;
  return sizes[sizes.length - 1];
}

/**
 * The art ground. panel null: the whole three-panel art, centred, covering the frame (the tile's `background-size: cover`).
 * panel n: panel n of the art, scaled until it covers the frame and centred on it (landscape and square sit at 62 % down the panel, as in the mock-up).
 * Painted art is scaled up with the browser's smooth filter: it is not pixel art.
 */
export const CcArt: React.FC<{ w: number; h: number; panel: number | null; brightness: number }> = ({ w, h, panel, brightness }) => {
  const pw = CC_ART.w / CC_ART.panels;
  const sx = panel == null ? CC_ART.w : pw;
  const s = Math.max(w / sx, h / CC_ART.h);
  const iw = CC_ART.w * s, ih = CC_ART.h * s;
  const left = panel == null ? (w - iw) / 2 : -(panel * pw * s) + (w - pw * s) / 2;
  const top = panel == null || h >= ih ? (h - ih) / 2 : -(ih - h) * (w > h ? 0.62 : 0.5);
  return <Img src={staticFile(CC_ART.file)} style={{ position: 'absolute', left, top, width: iw, height: ih, maxWidth: 'none', filter: `brightness(${brightness})` }} />;
};

/** The tile's dark radial shade behind the type (CSS .shade in the mock-up). */
export const CcShade: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, rgba(5,10,14,${strength}) 0, rgba(5,10,14,0) 72%)` }} />
);

/** The tile badge: amber outline, #080c0f at 55 %, a square amber dot, Press Start 2P text (panel cards). It stays tile amber whatever the case accent. */
export const CcBadge: React.FC<{ lines: string[]; size: number; u: number; color?: string; pad?: [number, number] }> = ({ lines, size, u, color = CC.badge, pad }) => {
  const [py, px] = pad || [Math.round(size * 0.9), Math.round(size * 1.2)];
  const dot = Math.round(size * 0.8);
  return (
    <div style={{ boxSizing: 'border-box', border: `${2 * u}px solid ${color}`, background: 'rgba(8,12,15,0.55)', color, fontFamily: PIXEL_FONT, fontSize: size, letterSpacing: '0.06em', lineHeight: 1.5, padding: `${py}px ${px}px`, display: 'flex', alignItems: 'center', gap: Math.round(size * 0.6), whiteSpace: 'nowrap', textAlign: 'left' }}>
      <div style={{ width: dot, height: dot, background: color, flex: 'none' }} />
      <div>{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
    </div>
  );
};

/** Accent frame inset from the card edge (mock-up: inset 2cqw, 2 px accent). */
export const CcFrame: React.FC<{ w: number; h: number; accent: string; u: number }> = ({ w, h, accent, u }) => {
  const inset = Math.round(Math.min(w, h) * (w > h ? 0.037 : 0.045));
  return <div style={{ position: 'absolute', left: inset, top: inset, right: inset, bottom: inset, border: `${3 * u}px solid ${accent}`, boxSizing: 'border-box', pointerEvents: 'none' }} />;
};

export { unit };
