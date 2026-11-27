import React from 'react';
import { CA, unit, tabFont, markSize, crisp } from '../ca';
import { VT_FONT } from '../fonts';
import { caCaptionBox } from './CaSeats';
import { CaptionBox } from './Caption';

/**
 * Narrator (voice-over) caption, burned in every aspect: a lower-third plate in CA surface with ink text in VT323, a 2 unit square ink
 * border, no speaker label (the dialogue caption has one and is dark; this is light). Drawn above the join effects, hard on and off at
 * the cue's frames. edit.vo = [{ id, start, end, text, file?, onCard? }], global seconds.
 *
 * Placement follows the shot under the cue:
 *  - gameplay shot with a dialogue line playing: above that line's caption (9:16, 1:1, or 16:9 where the shot burns its own), or above
 *    the game's own subtitle bar (16:9, bottom 22%), never over either;
 *  - CA card shot: stacked above the CYBER AWARE plate in the bottom right, and `onCard: "hide"` suppresses the caption (audio still plays);
 *  - ca_open and ca_close shots: no caption (their own text is the message).
 */
export const voSize = (w: number, h: number) => Math.max(48, Math.round((Math.min(w, h) * 0.056) / 4) * 4);

export const CaVo: React.FC<{ edit: any; tl: any; frame: number; w: number; h: number; aspect: string; fps: number }> = ({ edit, tl, frame, w, h, aspect, fps }) => {
  const t = frame / fps;
  const cue = (edit.vo || []).find((c: any) => t >= c.start - 1e-6 && t < c.end - 1e-6);
  if (!cue || !cue.text) return null;
  // edit-level vo_captions {aspect: false}: no burned announcer text in that aspect (audio still plays; the .srt keeps the cue)
  if (edit.vo_captions?.[aspect] === false) return null;
  // vo_skin "safetynet": the announcer is drawn in the SAFETYNET caption plate at the character captions' position; caption: false hides the burned text
  if (edit.vo_skin === 'safetynet') {
    if (cue.caption === false) return null;
    const sShot = tl.shots.find((s: any) => frame >= s.startFrame && frame < s.endFrame) || tl.shots[tl.shots.length - 1];
    if (sShot?.type === 'card' && cue.onCard === 'hide') return null;
    return <CaptionBox w={w} h={h} text={String(cue.caption ?? cue.text).replace(/\n/g, ' ')} topFrac9x16={edit.caption_top?.['9:16']} />;
  }
  // cue.caption === false (any skin): no burned text for this cue, the audio still plays and the .srt keeps it (the product trailer's title plate carries the line)
  if (cue.caption === false) return null;
  const shot = tl.shots.find((s: any) => frame >= s.startFrame && frame < s.endFrame) || tl.shots[tl.shots.length - 1];
  if (!shot) return null;
  if (shot.type === 'ca_close') return null; // the close's own tagline is the message (ca_open shows the cue at the foot: owner r3, silent viewers need the opening line)
  const onCard = shot.type === 'card';
  if (onCard && cue.onCard === 'hide') return null;
  const u = unit(w, h), size = voSize(w, h), portrait = h > w;
  const gap = 4 * u;
  let bottom = Math.round(h * 0.06);
  if (onCard) {
    const tf = tabFont(w, h), mS = Math.max(16, Math.round((tf * 0.9) / 2) * 2);
    bottom = 12 * u + markSize(mS) + 10 * u + 4 * u + 8 * u; // above the CYBER AWARE plate (padding 5 unit x2 plus border)
  } else if (shot.type === 'gameplay' && shot.dialogue) {
    const local = t - shot.startSec;
    const line = (shot.lines || []).find((l: any) => local >= l.start && local < l.end);
    if (line) {
      if (shot.caption?.[aspect] && shot.seat) bottom = caCaptionBox(w, h, line, shot.caption_skin, !!shot.caption_breaks).occupied + gap * 2;
      else if (w > h) bottom = Math.round(h * 0.23) + gap; // the game's own subtitle bar fills the bottom 22% of the take
      else bottom = Math.round(h * 0.06);
    }
  }
  // shot.voPos: "top" (or per aspect {"16:9": "top"}) lifts the plate to the top, under the seat tab, where the game UI fills the foot (defend panel buttons, call choices)
  const vp = typeof shot.voPos === 'string' ? shot.voPos : shot.voPos?.[aspect];
  const top = vp === 'top' ? 12 * u + Math.round(tabFont(w, h) * 1.8) + gap : null;
  const padX = Math.round(size * 0.5), padY = Math.round(size * 0.22);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, ...(top != null ? { top } : { bottom }), display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ maxWidth: Math.round(w * (portrait ? 0.9 : w === h ? 0.9 : 0.74)), boxSizing: 'border-box', padding: `${padY}px ${padX}px`, background: CA.surface, border: `${2 * u}px solid ${CA.ink}`, fontFamily: VT_FONT, fontSize: size, lineHeight: 1, color: CA.ink, textAlign: 'center', whiteSpace: cue.caption ? 'pre-line' : undefined, ...crisp }}>
        {cue.caption ?? cue.text /* cue.caption: burned text with chosen line breaks (\n) where the spoken text would wrap badly */}
      </div>
    </div>
  );
};
