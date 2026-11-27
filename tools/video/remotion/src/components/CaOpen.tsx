import React from 'react';
import { CA, CaTab, CaMark, unit, stepped, snapTo, isStacked, tabFont, fitSize, textWidth, crisp, markSize } from '../ca';
import { GNF_FONT, VT_FONT } from '../fonts';

const GRID = (u: number, tint: string) => `repeating-linear-gradient(0deg, transparent 0, transparent ${7 * u}px, ${tint} ${7 * u}px, ${tint} ${8 * u}px), repeating-linear-gradient(90deg, transparent 0, transparent ${7 * u}px, ${tint} ${7 * u}px, ${tint} ${8 * u}px)`;

/**
 * ca-open: the seam draws down the middle of a ca-surface frame (frames 0-12), the attacker half (#8c3b2e) and defender half
 * (#2f5f8a) fill outward from it (6-18), the ATTACKER and DEFENDER tabs drop on (14-22), then the title card sits on the join
 * (from 18): small Cyber Aware mark, the episode title in GNF, the company in VT323 over its stripe.
 * shot.ca = { title, company, stripe, layout: { "<aspect>": { card_w, title_size } } }. Stacked (attacker above) on 9:16 and 1:1.
 */
export const CaOpen: React.FC<{ shot: any; w: number; h: number; aspect: string; frame: number; frames: number }> = ({ shot, w, h, aspect, frame }) => {
  const cfg = shot.ca || {}; const lay = cfg.layout?.[aspect] || {};
  const u = unit(w, h), stacked = isStacked(w, h), block = 8 * u;
  const extent = stacked ? h : w, cross = stacked ? w : h;
  const f = frame;
  const seamLen = snapTo(stepped(f / 12, 8) * cross, block);
  const fill = snapTo(stepped((f - 6) / 12, 8) * (extent / 2), block);
  const tabP = stepped((f - 14) / 8, 3);
  const tf = tabFont(w, h);
  const half = extent / 2;
  const grid = (c: string) => GRID(u, c);
  // seat blocks grow out from the seam
  const atk: React.CSSProperties = stacked ? { left: 0, width: w, top: half - fill, height: fill } : { top: 0, height: h, left: half - fill, width: fill };
  const def: React.CSSProperties = stacked ? { left: 0, width: w, top: half, height: fill } : { top: 0, height: h, left: half, width: fill };
  const seam: React.CSSProperties = stacked ? { left: 0, width: seamLen, top: half - u, height: 2 * u } : { top: 0, height: seamLen, left: half - u, width: 2 * u };
  const tabPos = (side: 'a' | 'd'): React.CSSProperties => {
    const drop = Math.round((1 - tabP) * -tf * 3);
    // stacked: the ATTACKER tab hangs at the top of the frame and the DEFENDER tab sits at the bottom edge, clear of the title card in the middle
    if (stacked) return side === 'a' ? { left: 8 * u, top: 8 * u + drop } : { left: 8 * u, bottom: 8 * u + drop };
    return { left: (side === 'a' ? 8 * u : half + 8 * u), top: 8 * u + drop };
  };

  // title card
  const cardW = Math.round(w * (lay.card_w ?? (stacked ? 0.86 : 0.58)));
  const inner = cardW - 24 * u;
  const title = String(cfg.title || '');
  let lines = [title];
  const oneFits = textWidth(title, GNF_FONT, 64) <= inner && title.length <= 22; // one line only while it still reads big
  if (!oneFits) {
    const words = title.split(' '); let best = [title], bestDiff = 1e9;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '); const d = Math.abs(a.length - b.length); if (d < bestDiff) { bestDiff = d; best = [a, b]; } }
    lines = best;
  }
  const tSize = lay.title_size ?? fitSize(lines, GNF_FONT, [96, 80, 64, 48, 32], inner);
  const cSize = Math.max(32, Math.round((Math.min(w, h) * 0.045) / 16) * 16);
  const mS = Math.max(16, Math.round(tf * 0.9 / 2) * 2); // mark square
  const pad = 8 * u;
  const stripeH = 6 * u;
  const cardH = pad * 2 + markSize(mS) + 8 * u + lines.length * Math.round(tSize * 1.15) + (cfg.company ? 6 * u + Math.round(cSize * 0.9) : 0) + 10 * u + stripeH;
  const cardX = Math.round((w - cardW) / 2), cardY = Math.round((h - cardH) / 2);
  const cp = stepped((f - 18) / 6, 4); // card opens from the seam in four steps
  const cardClip = cp >= 1 ? 'none' : stacked ? `inset(0 ${Math.round((1 - cp) * cardW / 2)}px 0 ${Math.round((1 - cp) * cardW / 2)}px)` : `inset(${Math.round((1 - cp) * cardH / 2)}px 0 ${Math.round((1 - cp) * cardH / 2)}px 0)`;
  const textP = f >= 20;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: CA.surface }}>
      <div style={{ position: 'absolute', ...atk, background: CA.attack, backgroundImage: grid('rgba(0,0,0,0.12)') }} />
      <div style={{ position: 'absolute', ...def, background: CA.defend, backgroundImage: grid('rgba(0,0,0,0.12)') }} />
      <div style={{ position: 'absolute', ...seam, background: CA.line }} />
      {fill >= block ? <CaTab label={shot.seat_labels?.attack ?? 'ATTACKER'} bg={CA.attack} size={tf} u={u} style={tabPos('a')} /> : null}
      {fill >= block ? <CaTab label={shot.seat_labels?.defend ?? 'DEFENDER'} bg={CA.defend} size={tf} u={u} style={tabPos('d')} /> : null}
      {cp > 0 ? (
        <div style={{ position: 'absolute', left: cardX, top: cardY, width: cardW, height: cardH, boxSizing: 'border-box', background: CA.surface, border: `${2 * u}px solid ${CA.ink}`, clipPath: cardClip, WebkitClipPath: cardClip }}>
          <div style={{ position: 'absolute', inset: 3 * u, border: `${2 * u}px solid ${CA.line}`, boxSizing: 'border-box' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: pad + 3 * u, bottom: stripeH + 2 * u, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: textP ? 1 : 0, ...crisp }}>
            <div style={{ marginBottom: 8 * u }}><CaMark s={mS} u={u} font={Math.max(8, Math.round(tf * 0.67 / 8) * 8)} /></div>
            {lines.map((l, i) => <div key={i} style={{ fontFamily: GNF_FONT, fontSize: tSize, lineHeight: 1.15, color: CA.ink, whiteSpace: 'nowrap' }}>{l}</div>)}
            {cfg.company ? <div style={{ fontFamily: VT_FONT, fontSize: cSize, lineHeight: 0.9, marginTop: 6 * u, color: CA.ink, whiteSpace: 'nowrap' }}>{cfg.company}</div> : null}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: stripeH, background: cfg.stripe || CA.line }} />
        </div>
      ) : null}
      {/* frame border: no black open */}
      <div style={{ position: 'absolute', inset: 0, border: `${2 * u}px solid ${CA.ink}`, boxSizing: 'border-box' }} />
    </div>
  );
};
