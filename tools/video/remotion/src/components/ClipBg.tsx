import React from 'react';
import { Freeze, OffthreadVideo, staticFile } from 'remotion';

/**
 * A conformed 1920x1080 30 fps Veo clip (tools/video/assets/clips, synced to public/clips) as a full-frame background.
 * Painted art, not pixel art, so it is drawn smooth (no pixelated rendering). After `frames` frames it holds its last frame (freeze).
 * Sound is not taken here: scripts/mix-audio.mjs mixes it from shot.clip.audio.
 */
export const ClipBg: React.FC<{ file: string; frame: number; frames: number; w: number; h: number; crop?: { cx: number; cy?: number; zoom?: number } }> = ({ file, frame, frames, w, h, crop }) => {
  const f = Math.min(frame, Math.max(0, frames - 1));
  if (crop) {
    // explicit crop of the 1920x1080 clip: cover scale times zoom, source point (cx, cy) at the frame centre, clamped to the picture
    const s = Math.max(w / 1920, h / 1080) * (crop.zoom ?? 1);
    const W = 1920 * s, H = 1080 * s;
    const left = Math.min(0, Math.max(w - W, w / 2 - crop.cx * W)), top = Math.min(0, Math.max(h - H, h / 2 - (crop.cy ?? 0.5) * H));
    return (
      <Freeze frame={f}>
        <OffthreadVideo src={staticFile(`clips/${file}`)} muted pauseWhenBuffering={false} style={{ position: 'absolute', left, top, width: W, height: H }} />
      </Freeze>
    );
  }
  return (
    <Freeze frame={f}>
      <OffthreadVideo src={staticFile(`clips/${file}`)} muted pauseWhenBuffering={false} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, objectFit: 'cover' }} />
    </Freeze>
  );
};
