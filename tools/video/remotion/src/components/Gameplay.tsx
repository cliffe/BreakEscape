import React from 'react';
import { Freeze, OffthreadVideo, staticFile } from 'remotion';
import { Placeholder } from './Placeholder';
import { framingAt, visibleRect, sourceRef, freezeSec } from '../timeline.js';
import { Caption } from './Caption';
import { CaCaption } from './CaSeats';
import { CaInsets } from './CaInset';

/**
 * A gameplay shot: the 1920x1080 take or clip (or a placeholder pattern) scaled with nearest-neighbour (image-rendering: pixelated),
 * cropped to the aspect by per-shot framing (default centred), with an optional slow push-in (framingAt handles both).
 * Audio is not taken from the video here: render is silent and scripts/mix-audio.mjs builds the mix.
 */
export const Gameplay: React.FC<{ shot: any; w: number; h: number; aspect: string; frame: number; frames: number; fps: number; available: Record<string, boolean>; source: [number, number] }> = ({ shot, w, h, aspect, frame, frames, fps, available, source }) => {
  const t = frames > 1 ? frame / (frames - 1) : 0;
  const fr = framingAt(shot, aspect, t);
  const r = visibleRect(fr, w, h, source);
  const [sw, sh] = source;
  // whole output pixels: keeps integer zooms (2x, 3x) on the pixel grid, so source pixels stay square
  const tx = -Math.round(r.x0 * sw * r.scale), ty = -Math.round(r.y0 * sh * r.scale);
  const ref = sourceRef(shot); // takes/<file> or, for source.type 'clip', clips/<file> (any video file synced into public/)
  const has = ref && available[`${ref.dir}/${ref.file}`];
  const inSec = shot.source?.in ?? 0;
  // freeze / freezeAt: one source frame held for the whole shot (picture only; the mix still plays the take's audio from source.in)
  const fz = freezeSec(shot, fps);
  const startFrom = Math.round((fz ?? inSec) * fps);
  const sourceSec = fz ?? inSec + frame / fps;
  const video = has ? <OffthreadVideo src={staticFile(`${ref!.dir}/${ref!.file}`)} startFrom={startFrom} muted pauseWhenBuffering={false} style={{ width: sw, height: sh, imageRendering: 'pixelated' }} /> : null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: sw, height: sh, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${r.scale})`, imageRendering: 'pixelated' }}>
        {has ? (
          fz != null ? <Freeze frame={0}>{video}</Freeze> : video
        ) : (
          <Placeholder shot={shot} localSec={frame / fps} sourceSec={sourceSec} />
        )}
        <Masks masks={shot.masks} localSec={frame / fps} />
      </div>
      <CaInsets shot={shot} w={w} h={h} aspect={aspect} frame={frame} fps={fps} has={!!has} src={ref ? `${ref.dir}/${ref.file}` : null} startFrom={startFrom} source={source} sourceSec={sourceSec} />
      {shot.caption?.[aspect] ? (shot.seat ? <CaCaption shot={shot} w={w} h={h} localSec={frame / fps} /> : <Caption shot={shot} w={w} h={h} localSec={frame / fps} />) : null}
    </div>
  );
};

/**
 * Mask primitive: flat bars over a rectangle of the take, for a time window. shot.masks = [{ x, y, w, h, from, to, rows, gap, color }]
 * in source pixels (drawn inside the scaled box, so every aspect keeps it), from/to in shot-local seconds (default the whole shot),
 * rows = how many bars the rectangle is cut into (default 1, one solid bar), gap = source px between bars (default 4).
 */
export const Masks: React.FC<{ masks?: any[]; localSec: number }> = ({ masks, localSec }) => {
  if (!masks?.length) return null;
  return <>{masks.flatMap((m, i) => {
    if (localSec < (m.from ?? 0) || localSec >= (m.to ?? Infinity)) return [];
    const rows = Math.max(1, m.rows ?? 1), gap = rows > 1 ? (m.gap ?? 4) : 0, bh = (m.h - gap * (rows - 1)) / rows;
    return Array.from({ length: rows }, (_, r) => <div key={`${i}-${r}`} style={{ position: 'absolute', left: m.x, top: m.y + r * (bh + gap), width: m.w, height: bh, background: m.color || '#1f2933' }} />);
  })}</>;
};
