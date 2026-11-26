import React from 'react';
import { Img, staticFile } from 'remotion';
import { CA, CaTab, unit, stepped, snapTo, easeOut, isStacked, tabFont, textWidth, fitSize, crisp } from '../ca';
import { GNF_FONT, VT_FONT, PIXEL_FONT } from '../fonts';
import { closeFrames } from '../timeline.js';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const GRID = (u: number) => `repeating-linear-gradient(0deg, transparent 0, transparent ${7 * u}px, rgba(0,0,0,0.12) ${7 * u}px, rgba(0,0,0,0.12) ${8 * u}px), repeating-linear-gradient(90deg, transparent 0, transparent ${7 * u}px, rgba(0,0,0,0.12) ${7 * u}px, rgba(0,0,0,0.12) ${8 * u}px)`;

/**
 * ca-close: two big halves (attacker #8c3b2e, defender #2f5f8a, each half the frame, with their tabs) slide in from the
 * edges and meet at the seam (frames 0-24, a flash on the seam when they touch), hold a beat, then shrink in stepped moves
 * into the two overlapped squares of the Cyber Aware mark (30-52) on the ca-surface frame. Then CYBER AWARE, the episode
 * name, the small Hacktivity line at the foot (from 56) and the tagline (default "Play the attack · Learn to stop it"; the owner dropped "15 minutes, in your browser · No installs", 2026-11-22) (from 64).
 * shot.ca = { name, tagline, hacktivity, cta?, wordmark? } (cta replaces the Hacktivity line with a plate, e.g. "Learn on Hacktivity.co.uk"). Stacked (attacker above) on 9:16 and 1:1.
 */
export const CaClose: React.FC<{ shot: any; w: number; h: number; aspect: string; frame: number; frames: number; fps?: number }> = ({ shot, w, h, aspect, frame, frames, fps = 30 }) => {
  const cfg = shot.ca || {}; const lay = cfg.layout?.[aspect] || {};
  const u = unit(w, h), stacked = isStacked(w, h), q = 4 * u;
  const f = frame, tf = tabFont(w, h);
  const cf = closeFrames(cfg.timing, frames, fps); // default: written for 3 s at 30 fps and stretched; shot.ca.timing (seconds from the close's start) overrides
  const mS = Math.max(48, Math.round((Math.min(w, h) * (stacked ? 0.11 : 0.12)) / 2) * 2); // mark square side
  const off = Math.round(mS * 0.55), gw = mS + off;
  const textFont = Math.max(16, Math.round((w * (stacked ? 0.05 : 0.027)) / 8) * 8);
  const nameSize = Math.max(32, Math.round((Math.min(w, h) * 0.075) / 16) * 16);
  const tagline = cfg.tagline ?? 'Play the attack · Learn to stop it';
  const tagLines = stacked ? tagline.split(' · ') : [tagline]; // stacked: one clause per line so it can be larger on a phone
  const tagSize = fitSize(tagLines, VT_FONT, stacked ? [96, 80, 64, 48] : [96, 80, 64, 48], w * (stacked ? 0.92 : 0.8)); // large enough to read on a phone and on a 16:9 course page
  // wordmark: shot.ca.wordmark (array of parts, D347 "Hacktivity Cyber Aware" is ['HACKTIVITY', 'CYBER AWARE']); one line on 16:9, one part per line when stacked
  const wmParts: string[] = cfg.wordmark ?? ['CYBER AWARE'];
  const wmLines = stacked ? wmParts : [wmParts.join(' ')];
  const wmLead = Math.round(textFont * 1.3);
  // logo (owner, 23 Nov): the Hacktivity Cyber Aware logo SVG replaces a HACKTIVITY wordmark beside the squares; shot.ca.logo: false keeps the text
  // light logo: wordmark in Hacktivity nav purple #503883 (owner pick, 24 Nov; plum read too pale on white)
  // ground (owner mock-up 23 Nov): 'dark' puts the whole card on a dark ground with the dark-ground logo; default light
  const dark = cfg.ground === 'dark';
  const P = dark ? { surface: '#15171c', ink: '#ece8e3', line: '#3a3f48', frame: '#2a2e36' } : { surface: CA.surface, ink: CA.ink, line: CA.line, frame: CA.ink };
  const logo: string | null = cfg.logo === false ? null : (cfg.logo ?? (wmParts.includes('HACKTIVITY') ? (dark ? 'brand/hacktivity-cyber-aware-logo.svg' : 'brand/hacktivity-cyber-aware-logo-light-nav.svg') : null));
  const LOGO_RATIO = 41.199428 / 10.919; // the SVG's viewBox
  const logoH = logo ? Math.round(stacked ? Math.min(gw * 0.9, (w * 0.8) / LOGO_RATIO) : gw * 0.72) : 0;
  const logoW = Math.round(logoH * LOGO_RATIO);
  const wmH = logo ? logoH : textFont + (wmLines.length - 1) * wmLead;
  const cwWord = logo ? logoW : Math.max(...wmLines.map((l) => textWidth(l, PIXEL_FONT, textFont)));
  // mark group position: upper centre, glyph and text in a row on 16:9, text under the glyph when stacked
  const gap = Math.round(mS * 0.2); // glyph-to-word gap: one lock-up
  const rowW = gw + gap + cwWord;
  const groupW = stacked ? Math.max(gw, cwWord) : rowW;
  const gx = Math.round((w - gw - (stacked ? 0 : gap + cwWord)) / 2);
  const gy = Math.round(h * (lay.mark_y ?? (stacked ? 0.3 : 0.27)));
  const sqA = { x: snapTo(gx, q), y: snapTo(gy, q), s: mS }, sqD = { x: snapTo(gx + off, q), y: snapTo(gy + off, q), s: mS };

  // phases
  // one step per frame (n = the phase's frame count): the phases are stretched by `scale`, so a fixed step count (8, 10) gave 4-6 frames per step, 5-7 fps
  const tIn = easeOut(stepped(f / cf.slideEnd, cf.slideEnd));             // halves slide in
  const tShrink = stepped((f - cf.shrinkStart) / cf.shrinkLen, cf.shrinkLen);        // halves shrink into the squares
  const half = stacked ? h / 2 : w / 2;
  const slide = Math.round((1 - tIn) * half);
  const A = stacked ? { x: 0, y: -slide, w, h: h / 2 } : { x: -slide, y: 0, w: w / 2, h };
  const D = stacked ? { x: 0, y: h / 2 + slide, w, h: h / 2 } : { x: w / 2 + slide, y: 0, w: w / 2, h };
  const lerpRect = (r: any, sq: any) => ({ x: lerp(r.x, sq.x, tShrink), y: lerp(r.y, sq.y, tShrink), w: lerp(r.w, sq.s, tShrink), h: lerp(r.h, sq.s, tShrink) });
  const rA = lerpRect(A, sqA), rD = lerpRect(D, sqD);
  const halvesDone = tShrink >= 1;
  const touch = f >= cf.slideEnd && f < cf.flashEnd; // flash on the seam as they meet
  const showTabs = tShrink < 0.35;
  const textIn = f >= cf.text;
  const hackIn = f >= cf.url, tagIn = f >= cf.tag;
  const hackW = Math.round(w * 0.18);
  const hackSize = Math.max(32, Math.round((hackW / 5.2) / 16) * 16);
  const gnfW = textWidth('Hacktivity', GNF_FONT, hackSize);

  const rectStyle = (r: any, c: string): React.CSSProperties => ({ position: 'absolute', left: Math.round(r.x), top: Math.round(r.y), width: Math.round(r.w), height: Math.round(r.h), boxSizing: 'border-box', background: c, border: `${2 * u}px solid ${CA.ink}`, overflow: 'hidden' });
  const textX = gx + gw + gap;
  const tx = stacked ? Math.round((w - cwWord) / 2) : textX;
  const ty = stacked ? gy + gw + Math.round(mS * 0.5) : gy + Math.round((gw - wmH) / 2);
  // episode name: fitted to the frame (ca14 "Social media and oversharing" overflowed 9:16 at the fixed size)
  const nameFit = cfg.name ? fitSize([cfg.name], GNF_FONT, [nameSize, ...[0.85, 0.7, 0.6, 0.5].map((k) => Math.max(24, Math.round((nameSize * k) / 8) * 8))], w * 0.9) : nameSize;
  const belowY = stacked ? ty + wmH + (logo ? Math.round(mS * 0.4) : 6 * u * 2) : gy + gw + Math.round(mS * 0.45);
  void groupW;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: P.surface }}>
      {/* the two halves: moving blocks that become the mark's squares */}
      <div style={{ ...rectStyle(rA, CA.attack), backgroundImage: halvesDone ? 'none' : GRID(u), zIndex: 1 }}>
        {showTabs ? <CaTab label={shot.seat_labels?.attack ?? 'ATTACKER'} bg={CA.attack} size={tf} u={u} style={{ left: 8 * u, top: 8 * u, border: `${2 * u}px solid ${CA.ink}` }} /> : null}
      </div>
      <div style={{ ...rectStyle(rD, CA.defend), backgroundImage: halvesDone ? 'none' : GRID(u), zIndex: 2 }}>
        {showTabs ? <CaTab label={shot.seat_labels?.defend ?? 'DEFENDER'} bg={CA.defend} size={tf} u={u} style={{ left: 8 * u, top: 8 * u }} /> : null}
      </div>
      {touch ? <div style={{ position: 'absolute', zIndex: 3, background: CA.line, ...(stacked ? { left: 0, width: w, top: h / 2 - 2 * u, height: 4 * u } : { top: 0, height: h, left: w / 2 - 2 * u, width: 4 * u }) }} /> : null}
      {textIn && logo ? <Img src={staticFile(logo)} style={{ position: 'absolute', left: tx, top: ty, width: logoW, height: logoH, display: 'block' }} /> : null}
      {textIn && !logo ? <div style={{ position: 'absolute', left: tx, top: ty, fontFamily: PIXEL_FONT, fontSize: textFont, lineHeight: 1, color: CA.mark, whiteSpace: 'nowrap', textAlign: stacked ? 'center' : 'left', width: stacked ? cwWord : undefined, ...crisp }}>{wmLines.map((l, i) => <div key={i} style={{ marginTop: i ? wmLead - textFont : 0 }}>{l}</div>)}</div> : null}
      {textIn && cfg.name ? <div style={{ position: 'absolute', left: 0, right: 0, top: belowY, textAlign: 'center', fontFamily: GNF_FONT, fontSize: nameFit, lineHeight: 1.1, color: P.ink, whiteSpace: 'nowrap', ...crisp }}>{cfg.name}</div> : null}
      {tagIn ? <div style={{ position: 'absolute', left: 0, right: 0, top: belowY + (cfg.name ? Math.round(nameFit * 1.25) : 0) + 4 * u, textAlign: 'center', fontFamily: VT_FONT, fontSize: tagSize, lineHeight: 1, color: P.ink, whiteSpace: 'nowrap', ...crisp }}>{tagLines.map((l, i) => <div key={i}>{l}</div>)}</div> : null}
      {hackIn ? (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18 * u, display: 'flex', flexDirection: 'column', alignItems: 'center', ...crisp }}>
          <div style={{ width: Math.round(w * (stacked ? 0.5 : 0.36)), height: 2 * u, background: P.line, marginBottom: 6 * u }} />
          {cfg.cta
            // call to action (owner r3: "end on a CTA to learn on Hacktivity.co.uk"): a seat-coloured plate in place of the plain Hacktivity line, fitted to the frame
            ? <div style={{ background: CA.defend, border: `${2 * u}px solid ${CA.ink}`, padding: `${4 * u}px ${10 * u}px`, fontFamily: GNF_FONT, fontSize: fitSize([cfg.cta], GNF_FONT, stacked ? [88, 80, 72, 64, 56, 48] : [hackSize, Math.round(hackSize * 0.8 / 8) * 8, Math.round(hackSize * 0.65 / 8) * 8, 24], w * 0.8), lineHeight: 1, color: '#fff', whiteSpace: 'nowrap', textAlign: 'center' }}>{cfg.cta}</div>
            : <div style={{ fontFamily: GNF_FONT, fontSize: hackSize, lineHeight: 1, color: P.ink, width: Math.max(gnfW, hackW), textAlign: 'center' }}>{cfg.hacktivity ?? 'Hacktivity'}</div>}
        </div>
      ) : null}
      <div style={{ position: 'absolute', inset: 0, border: `${2 * u}px solid ${P.frame}`, boxSizing: 'border-box', zIndex: 5 }} />
    </div>
  );
};
