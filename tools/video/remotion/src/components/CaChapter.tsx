import React from 'react';
import { CA, CaTab, CaMark, unit, snapTo, isStacked, tabFont, fitSize, textWidth, crisp } from '../ca';
import { GNF_FONT, VT_FONT } from '../fonts';

const GRID = (u: number, tint: string) => `repeating-linear-gradient(0deg, transparent 0, transparent ${7 * u}px, ${tint} ${7 * u}px, ${tint} ${8 * u}px), repeating-linear-gradient(90deg, transparent 0, transparent ${7 * u}px, ${tint} ${7 * u}px, ${tint} ${8 * u}px)`;

/**
 * Chapter card (card shot with style "ca" and chapter "attack" | "defend"): a full-frame seat colour (#8c3b2e or #2f5f8a) with
 * the same grid texture as ca-open. shot.text[0] is the big GNF heading, shot.body the bullet lines (up to three, VT323, each
 * revealed in turn after the heading), the seat tab (ATTACKER or DEFENDER) sits top-left and the small teal CYBER AWARE mark
 * bottom-right on a surface plate. 2 unit borders, square corners. Large enough to read on 9:16 and 1:1 (VT323 from 48 px up).
 * Card text never names a tell, a verdict or the right answer (lint checks the banned words; the rest is editorial).
 */
export const CaChapter: React.FC<{ shot: any; w: number; h: number; frame: number }> = ({ shot, w, h, frame }) => {
  const u = unit(w, h), stacked = isStacked(w, h), tf = tabFont(w, h);
  const attack = shot.chapter === 'attack';
  const ground = attack ? CA.attack : CA.defend;
  const heading: string = (shot.text?.[0] && (typeof shot.text[0] === 'string' ? shot.text[0] : shot.text[0].text)) || '';
  const bullets: string[] = (shot.body || []).slice(0, 3);
  const m = Math.round(Math.min(w, h) * 0.07);
  const inner = w - 2 * m - (stacked ? 0 : 0);
  // heading: one line while it still reads big, else two balanced lines
  const sizes = stacked ? [112, 96, 80, 64] : [160, 144, 128, 112, 96];
  let hLines = [heading];
  if (textWidth(heading, GNF_FONT, sizes[Math.min(2, sizes.length - 1)]) > inner) {
    const words = heading.split(' '); let best = [heading], bd = 1e9;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '); const d = Math.abs(textWidth(a, GNF_FONT, 96) - textWidth(b, GNF_FONT, 96)); if (d < bd) { bd = d; best = [a, b]; } }
    hLines = best;
  }
  const hSize = fitSize(hLines, GNF_FONT, sizes, inner);
  // bullets wrap inside the column, so the size is chosen for two lines at most
  const bSizes = stacked ? [64, 56, 48] : [80, 72, 64, 56];
  const sq = Math.round(Math.min(w, h) * 0.032 / 2) * 2;
  const colW = inner - sq - 3 * sq;
  const bSize = bSizes.find((s) => bullets.every((b) => textWidth(b, VT_FONT, s) <= colW * 2 * 0.92)) || bSizes[bSizes.length - 1];
  const fps = 30;
  const revealAt = (i: number) => 14 + Math.round(i * 0.7 * fps * (bullets.length > 2 ? 0.8 : 1)); // bullets one after another
  const tabDrop = Math.round((1 - Math.min(1, Math.max(0, (frame - 2) / 4))) * -tf * 3);
  const mS = Math.max(16, Math.round(tf * 0.9 / 2) * 2);
  const markFont = Math.max(8, Math.round(tf * 0.5 / 8) * 8);
  const tabLabel = attack ? 'ATTACKER' : 'DEFENDER';
  const grid = GRID(u, 'rgba(0,0,0,0.12)');
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: ground, backgroundImage: grid }}>
      <div style={{ position: 'absolute', inset: 0, border: `${2 * u}px solid ${CA.ink}`, boxSizing: 'border-box' }} />
      <div style={{ position: 'absolute', inset: 6 * u, border: `${2 * u}px solid rgba(255,255,255,0.35)`, boxSizing: 'border-box' }} />
      <CaTab label={tabLabel} bg={ground} size={tf} u={u} style={{ left: 12 * u, top: 12 * u + tabDrop, border: `${2 * u}px solid #fff` }} />
      <div style={{ position: 'absolute', left: m, right: m, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', ...crisp }}>
        {hLines.map((l, i) => <div key={i} style={{ fontFamily: GNF_FONT, fontSize: hSize, lineHeight: 1.15, color: '#fff', whiteSpace: 'nowrap' }}>{l}</div>)}
        <div style={{ height: snapTo(hSize * 0.55, 4 * u) }} />
        {bullets.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: sq, marginBottom: Math.round(bSize * 0.3), opacity: frame >= revealAt(i) ? 1 : 0, width: inner }}>
            <div style={{ flex: 'none', width: sq, height: sq, marginTop: Math.round((bSize * 0.9 - sq) / 2), boxSizing: 'border-box', background: '#fff', border: `${2 * u}px solid ${CA.ink}` }} />
            <div style={{ fontFamily: VT_FONT, fontSize: bSize, lineHeight: 0.95, color: '#fff', maxWidth: colW }}>{b}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', right: 12 * u, bottom: 12 * u, background: CA.surface, border: `${2 * u}px solid ${CA.ink}`, padding: `${5 * u}px ${8 * u}px`, boxSizing: 'border-box' }}>
        <CaMark s={mS} u={u} font={markFont} />
      </div>
    </div>
  );
};
