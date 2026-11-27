import React from 'react';
import { CA, CaTab, unit, stepped, isStacked, tabFont, fitSize, crisp } from '../ca';
import { GNF_FONT, VT_FONT, PIXEL_FONT } from '../fonts';
import { cardLines } from '../timeline.js';

/**
 * Cyber Aware text card (card shot with style "ca"): a flat ca-surface (or seat-tint) panel, 2 unit ink border and a 2 unit
 * inset rule, no radius, gradient or shadow. A tab sits on the top edge: CYBER AWARE (teal) by default, ATTACKER or DEFENDER
 * when shot.seat is set, or shot.tab. Content, all optional: shot.tool (Press Start 2P tool name), shot.text (GNF lines, up to
 * two of about 22 characters), shot.body (VT323 lines, up to three of about 34).
 */
export const CaCard: React.FC<{ shot: any; w: number; h: number; frame: number }> = ({ shot, w, h, frame }) => {
  const u = unit(w, h), stacked = isStacked(w, h), tf = tabFont(w, h);
  const seat = shot.seat === 'attack' || shot.seat?.seat === 'attack' ? 'attack' : shot.seat === 'defend' || shot.seat?.seat === 'defend' ? 'defend' : null;
  const tabBg = seat === 'attack' ? CA.attack : seat === 'defend' ? CA.defend : CA.mark;
  const tabLabel = shot.tab || (seat === 'attack' ? (shot.seat_labels?.attack ?? 'ATTACKER') : seat === 'defend' ? (shot.seat_labels?.defend ?? 'DEFENDER') : 'CYBER AWARE');
  const ground = seat === 'attack' ? CA.attackTint : seat === 'defend' ? CA.defendTint : CA.surface;
  const text = cardLines(shot).map((l: any) => l.text);
  const body: string[] = shot.body || [];
  const m = Math.round(Math.min(w, h) * 0.05), pw = w - 2 * m, ph = h - 2 * m;
  const inner = pw - 24 * u;
  const tSize = text.length ? fitSize(text, GNF_FONT, stacked ? [96, 80, 64, 48, 32] : [128, 112, 96, 80, 64, 48, 32], inner) : 0;
  const bSize = body.length ? fitSize(body, VT_FONT, stacked ? [64, 48, 32] : [80, 64, 48, 32], inner) : 0;
  const toolSize = Math.max(16, Math.round(tf * 0.8 / 8) * 8);
  const drop = Math.round((1 - stepped((frame - 2) / 4, 3)) * -tf * 3);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: CA.surface }}>
      <div style={{ position: 'absolute', left: m, top: m, width: pw, height: ph, boxSizing: 'border-box', background: ground, border: `${2 * u}px solid ${CA.ink}` }}>
        <div style={{ position: 'absolute', inset: 3 * u, border: `${2 * u}px solid ${CA.line}`, boxSizing: 'border-box' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', ...crisp }}>
          {shot.tool ? <div style={{ fontFamily: PIXEL_FONT, fontSize: toolSize, color: tabBg, marginBottom: Math.round(toolSize * 1.2), lineHeight: 1.2 }}>{shot.tool}</div> : null}
          {text.map((l: string, i: number) => <div key={i} style={{ fontFamily: GNF_FONT, fontSize: tSize, lineHeight: 1.2, color: CA.ink, whiteSpace: 'nowrap' }}>{l}</div>)}
          {body.length ? <div style={{ marginTop: text.length ? Math.round(tSize * 0.5) : 0 }}>{body.map((l, i) => <div key={i} style={{ fontFamily: VT_FONT, fontSize: bSize, lineHeight: 1.1, color: CA.ink, whiteSpace: 'nowrap' }}>{l}</div>)}</div> : null}
        </div>
      </div>
      <CaTab label={tabLabel} bg={tabBg} size={tf} u={u} style={{ left: m + 10 * u, top: m - Math.round(tf * 1.1) - 2 * u + drop }} />
    </div>
  );
};
