import React from 'react';
import { OffthreadVideo, staticFile } from 'remotion';
import { Placeholder } from './Placeholder';
import { framingAt, visibleRect, sourceRef } from '../timeline.js';
import { Caption } from './Caption';

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
  const startFrom = Math.round(inSec * fps);
  const sourceSec = inSec + frame / fps;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: sw, height: sh, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${r.scale})`, imageRendering: 'pixelated' }}>
        {has ? (
          <OffthreadVideo src={staticFile(`${ref!.dir}/${ref!.file}`)} startFrom={startFrom} muted pauseWhenBuffering={false} style={{ width: sw, height: sh, imageRendering: 'pixelated' }} />
        ) : (
          <Placeholder shot={shot} localSec={frame / fps} sourceSec={sourceSec} />
        )}
      </div>
      {shot.caption?.[aspect] ? <Caption shot={shot} w={w} h={h} localSec={frame / fps} /> : null}
    </div>
  );
};
