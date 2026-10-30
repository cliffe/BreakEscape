import React from 'react';
import { Freeze, OffthreadVideo, staticFile } from 'remotion';

/**
 * A conformed 1920x1080 30 fps Veo clip (tools/video/assets/clips, synced to public/clips) as a full-frame background.
 * Painted art, not pixel art, so it is drawn smooth (no pixelated rendering). After `frames` frames it holds its last frame (freeze).
 * Sound is not taken here: scripts/mix-audio.mjs mixes it from shot.clip.audio.
 */
export const ClipBg: React.FC<{ file: string; frame: number; frames: number; w: number; h: number }> = ({ file, frame, frames, w, h }) => {
  const f = Math.min(frame, Math.max(0, frames - 1));
  return (
    <Freeze frame={f}>
      <OffthreadVideo src={staticFile(`clips/${file}`)} muted pauseWhenBuffering={false} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, objectFit: 'cover' }} />
    </Freeze>
  );
};
