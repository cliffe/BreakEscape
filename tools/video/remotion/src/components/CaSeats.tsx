import React from 'react';
import { CA, CaTab, unit, tabFont, crisp } from '../ca';
import { CAPTION_FONT } from '../fonts';

export const seatOf = (shot: any): { seat: 'attack' | 'defend' | 'full'; chip?: string; stripe?: string } | null => {
  const s = shot.seat; if (!s) return null;
  return typeof s === 'string' ? { seat: s as any } : s;
};

/**
 * Seat framing over a gameplay shot (shot.seat = { seat: "attack" | "defend" | "full", chip, stripe }). The footage is not
 * scaled or moved: a seat-coloured frame (2 unit ink outside, 3 unit seat colour inside) runs round the edge, an ATTACKER or
 * DEFENDER tab hangs from its top-left corner (optional `stripe` = the company colour along the tab's foot) and an optional
 * `chip` names the tool beside it (PRETEXT CALL). "full" draws nothing but the chip.
 */
export const CaSeats: React.FC<{ shot: any; w: number; h: number; children: React.ReactNode }> = ({ shot, w, h, children }) => {
  const seat = seatOf(shot)!; const u = unit(w, h), tf = tabFont(w, h);
  const col = seat.seat === 'attack' ? CA.attack : CA.defend;
  const band = 5 * u;
  const chipSize = Math.max(8, Math.round(tf * 0.67 / 8) * 8);
  const framed = seat.seat !== 'full';
  const tabH = tf + Math.round(tf * 1) + 4 * u + (seat.stripe ? 3 * u : 0);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {children}
      {framed ? <>
        <div style={{ position: 'absolute', inset: 0, border: `${2 * u}px solid ${CA.ink}`, boxSizing: 'border-box' }} />
        <div style={{ position: 'absolute', inset: 2 * u, border: `${3 * u}px solid ${col}`, boxSizing: 'border-box' }} />
        <CaTab label={seat.seat === 'attack' ? 'ATTACKER' : 'DEFENDER'} bg={col} size={tf} u={u} stripe={seat.stripe} style={{ left: band, top: band }} />
      </> : null}
      {seat.chip ? (
        <div style={{ position: 'absolute', left: framed ? band + Math.round(tf * 9.6) + 3 * u : 3 * u * 2, top: framed ? band : 3 * u * 2, height: framed ? tabH : undefined, boxSizing: 'border-box', background: CA.surface, border: `${2 * u}px solid ${CA.ink}`, color: CA.ink, fontFamily: "'Press Start 2P', monospace", fontSize: chipSize, lineHeight: 1, padding: `${Math.round(chipSize * 0.7)}px ${Math.round(chipSize * 0.8)}px`, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', ...crisp }}>{seat.chip}</div>
      ) : null}
    </div>
  );
};

/** Cyber Aware burned caption (for gameplay shots with a seat): Source Sans 3, white on 80% ink, 2 unit border, lower third. */
export const CaCaption: React.FC<{ shot: any; w: number; h: number; localSec: number }> = ({ shot, w, h, localSec }) => {
  const line = (shot.lines || []).find((l: any) => localSec >= l.start && localSec < l.end);
  if (!line) return null;
  const u = unit(w, h); const portrait = h > w;
  const size = Math.round(Math.min(w, h) * 0.052);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: Math.round(h * (portrait ? 0.7 : 0.8)), display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ maxWidth: Math.round(w * (portrait ? 0.88 : 0.7)), padding: `${Math.round(size * 0.35)}px ${Math.round(size * 0.6)}px`, background: 'rgba(31,41,51,0.8)', border: `${2 * u}px solid ${CA.ink}`, boxSizing: 'border-box', fontFamily: CAPTION_FONT, fontSize: size, lineHeight: 1.25, color: '#fff', textAlign: 'center' }}>
        {line.speaker ? <span style={{ color: CA.line, marginRight: Math.round(size * 0.4) }}>{line.speaker}:</span> : null}{line.text}
      </div>
    </div>
  );
};
