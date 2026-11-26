import React from 'react';
import { CA, CaMark, unit, tabFont, fitSize, textWidth, crisp, markSize } from '../ca';
import { GNF_FONT, VT_FONT } from '../fonts';

/**
 * Title plate over footage (Cyber Aware product trailer): shot.title_plate = { text, sub?, from?, to? } (seconds from the shot's start,
 * default the whole shot). A CA-surface plate with a 2 unit ink border near the foot of the frame: the small Cyber Aware mark, the title in
 * GNF, the subline in VT323. Drawn only inside the window, hard on and off; nothing else on the shot moves.
 */
export const CaTitlePlate: React.FC<{ shot: any; w: number; h: number; localSec: number }> = ({ shot, w, h, localSec }) => {
  const tp = shot.title_plate; if (!tp) return null;
  const a = tp.from ?? 0, b = tp.to ?? shot.duration;
  if (localSec < a - 1e-6 || localSec >= b - 1e-6) return null;
  const u = unit(w, h), tf = tabFont(w, h), portrait = h > w;
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
