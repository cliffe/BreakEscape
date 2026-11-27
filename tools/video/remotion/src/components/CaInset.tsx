import React from 'react';
import { OffthreadVideo, staticFile } from 'remotion';
import { CA, CaTab, unit, tabFont, stepped, crisp } from '../ca';
import { Placeholder } from './Placeholder';
import { Masks } from './Gameplay';

/**
 * Magnified inset for small game UI (the influence meter). shot.insets = [{ src: {x,y,w,h}, at: { "16:9": {x,y,scale}, ... }, from?, to?, label? }].
 * src is in source pixels of the take; `at` is the top-left in output pixels of that aspect and the integer-friendly scale. The inset is the
 * shot's own frame at the same time (a second video element at the same startFrom), scaled with nearest-neighbour, with the shot's masks
 * drawn in it too (a masked cell stays masked when magnified), a 2 unit ink border and an optional label tab above. No `at` entry for an
 * aspect: nothing drawn there. from/to are shot-local seconds. It scales in over 0.2 s, stepped by frame, from its centre.
 */
export const CaInsets: React.FC<{ shot: any; w: number; h: number; aspect: string; frame: number; fps: number; has: boolean; src: string | null; startFrom: number; source: [number, number]; sourceSec: number }> = ({ shot, w, h, aspect, frame, fps, has, src, startFrom, source, sourceSec }) => {
  const list: any[] = shot.insets || [];
  if (!list.length) return null;
  const u = unit(w, h), tf = tabFont(w, h), tabSize = Math.max(8, Math.round((tf * 0.67) / 8) * 8);
  const local = frame / fps;
  return <>{list.map((ins, i) => {
    const at = ins.at?.[aspect]; if (!at) return null;
    const from = ins.from ?? 0, to = ins.to ?? Infinity;
    if (local < from || local >= to) return null;
    const k = stepped((frame - Math.round(from * fps)) / 6, 4); // 0.2 s at 30 fps, four steps: 0.25, 0.5, 0.75, 1
    if (k <= 0) return null;
    const bw = Math.round(ins.src.w * at.scale), bh = Math.round(ins.src.h * at.scale);
    return (
      <div key={i} style={{ position: 'absolute', left: at.x, top: at.y, width: bw, height: bh, transform: `scale(${k})`, transformOrigin: '50% 50%', ...crisp }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000', imageRendering: 'pixelated' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: source[0], height: source[1], transformOrigin: '0 0', transform: `scale(${at.scale}) translate(${-ins.src.x}px, ${-ins.src.y}px)`, imageRendering: 'pixelated' }}>
            {has && src ? <OffthreadVideo src={staticFile(src)} startFrom={startFrom} muted pauseWhenBuffering={false} style={{ width: source[0], height: source[1], imageRendering: 'pixelated' }} /> : <Placeholder shot={shot} localSec={local} sourceSec={sourceSec} />}
            <Masks masks={shot.masks} localSec={local} />
          </div>
        </div>
        <div style={{ position: 'absolute', inset: 0, border: `${2 * u}px solid ${CA.ink}`, boxSizing: 'border-box' }} />
        {ins.label ? <CaTab label={ins.label} bg={CA.mark} size={tabSize} u={u} style={{ left: 0, bottom: bh - 2 * u, top: undefined }} /> : null}
      </div>
    );
  })}</>;
};
