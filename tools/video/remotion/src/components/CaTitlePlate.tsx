import React from 'react';
import { CA, CaMark, unit, tabFont, fitSize, textWidth, crisp, markSize, isStacked } from '../ca';
import { GNF_FONT, VT_FONT, PIXEL_FONT } from '../fonts';
import { stackedTitleLines } from '../timeline.js';

/**
 * Title plate over footage (Cyber Aware product trailer): shot.title_plate = { text, sub?, from?, to? } (seconds from the shot's start,
 * default the whole shot). A CA-surface plate with a 2 unit ink border near the foot of the frame: the small Cyber Aware mark, the title in
 * GNF, the subline in VT323. Drawn only inside the window, hard on and off; nothing else on the shot moves.
 * style "card": a full-frame attacker|defender split (stacked on 9:16 and 1:1) with the grid, a centred surface card with the title in GNF (about 128 px at 1080, two lines when stacked), no mark, the subline in VT323.
 * style "tag": a small yellow Press Start 2P tag at the top right (text's own \n breaks), for placeholder footage. No style: the foot plate above, unchanged.
 */
export const CaTitlePlate: React.FC<{ shot: any; w: number; h: number; localSec: number }> = ({ shot, w, h, localSec }) => {
  const tp = shot.title_plate; if (!tp) return null;
  const a = tp.from ?? 0, b = tp.to ?? shot.duration;
  if (localSec < a - 1e-6 || localSec >= b - 1e-6) return null;
  const u = unit(w, h), tf = tabFont(w, h), portrait = h > w;
  if (tp.style === 'tag') {
    const lines = String(tp.text).split('\n'), size = Math.max(8, Math.round((tf * 0.8) / 8) * 8);
    return (
      <div style={{ position: 'absolute', right: 6 * u, top: 6 * u, boxSizing: 'border-box', background: '#f2c94c', border: `${2 * u}px solid ${CA.ink}`, color: CA.ink, fontFamily: PIXEL_FONT, fontSize: size, lineHeight: 1.4, padding: `${Math.round(size * 0.6)}px ${Math.round(size * 0.8)}px`, whiteSpace: 'nowrap', textAlign: 'right', pointerEvents: 'none', ...crisp }}>
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    );
  }
  if (tp.style === 'card') {
    const stacked = isStacked(w, h), lines = stackedTitleLines(tp.text, stacked);
    const grid = `repeating-linear-gradient(0deg, transparent 0, transparent ${7 * u}px, rgba(0,0,0,0.12) ${7 * u}px, rgba(0,0,0,0.12) ${8 * u}px), repeating-linear-gradient(90deg, transparent 0, transparent ${7 * u}px, rgba(0,0,0,0.12) ${7 * u}px, rgba(0,0,0,0.12) ${8 * u}px)`;
    const want = Math.round((128 * Math.min(w, h)) / 1080 / 8) * 8;
    const sizes = [want, ...[0.85, 0.7, 0.55, 0.45].map((k) => Math.max(24, Math.round((want * k) / 8) * 8))];
    const tS = fitSize(lines, GNF_FONT, sizes, w * 0.9 - 24 * u);
    const sS = Math.max(32, Math.round((Math.min(w, h) * 0.06) / 16) * 16);
    const cW = Math.min(w * 0.9, Math.max(...lines.map((l: string) => textWidth(l, GNF_FONT, tS)), tp.sub ? textWidth(tp.sub, VT_FONT, sS) : 0) + 24 * u);
    const half: React.CSSProperties = { position: 'absolute', backgroundImage: grid, boxSizing: 'border-box' };
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ ...half, background: CA.attack, backgroundImage: grid, ...(stacked ? { left: 0, top: 0, width: w, height: h / 2 } : { left: 0, top: 0, width: w / 2, height: h }) }} />
        <div style={{ ...half, background: CA.defend, backgroundImage: grid, ...(stacked ? { left: 0, top: h / 2, width: w, height: h / 2 } : { left: w / 2, top: 0, width: w / 2, height: h }) }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: cW, boxSizing: 'border-box', background: CA.surface, border: `${2 * u}px solid ${CA.ink}`, padding: `${8 * u}px ${8 * u}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 * u, ...crisp }}>
            {lines.map((l: string, i: number) => <div key={i} style={{ fontFamily: GNF_FONT, fontSize: tS, lineHeight: 1.1, color: CA.ink, whiteSpace: 'nowrap' }}>{l}</div>)}
            {tp.sub ? <div style={{ fontFamily: VT_FONT, fontSize: sS, lineHeight: 0.9, color: CA.ink, whiteSpace: 'nowrap' }}>{tp.sub}</div> : null}
          </div>
        </div>
        <div style={{ position: 'absolute', inset: 0, border: `${2 * u}px solid ${CA.ink}`, boxSizing: 'border-box' }} />
      </div>
    );
  }
  const maxW = Math.round(w * (portrait ? 0.9 : w === h ? 0.86 : 0.58));
  const inner = maxW - 24 * u;
  const tSize = fitSize([tp.text], GNF_FONT, [64, 48, 32], inner);
  const sSize = Math.max(32, Math.round((Math.min(w, h) * 0.045) / 16) * 16);
  const mS = Math.max(16, Math.round((tf * 0.9) / 2) * 2);
  const cardW = Math.min(maxW, Math.max(textWidth(tp.text, GNF_FONT, tSize), tp.sub ? textWidth(tp.sub, VT_FONT, sSize) : 0, 0) + 24 * u);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: Math.round(h * 0.06), display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ width: cardW, boxSizing: 'border-box', background: CA.surface, border: `${2 * u}px solid ${CA.ink}`, padding: `${6 * u}px ${8 * u}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 * u, ...crisp }}>
        <CaMark s={mS} u={u} font={Math.max(8, Math.round((tf * 0.67) / 8) * 8)} />
        <div style={{ fontFamily: GNF_FONT, fontSize: tSize, lineHeight: 1.1, color: CA.ink, whiteSpace: 'nowrap' }}>{tp.text}</div>
        {tp.sub ? <div style={{ fontFamily: VT_FONT, fontSize: sSize, lineHeight: 0.9, color: CA.ink, whiteSpace: 'nowrap' }}>{tp.sub}</div> : null}
      </div>
    </div>
  );
};
export const titlePlateHeightHint = (w: number, h: number) => markSize(Math.max(16, Math.round((tabFont(w, h) * 0.9) / 2) * 2));
