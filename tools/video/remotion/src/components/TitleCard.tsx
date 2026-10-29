import React from 'react';
import { staticFile } from 'remotion';
import { GlitchFX } from './GlitchFX';

const BG = '#070409';
const ART_W = 1376, ART_H = 768; // c1_keyhole_hookpick6.png
const KEY_X = 0.31;              // the keyhole's centre across the art (fraction)

/** Integer pixel scale of the 57x25 title SVG per aspect (shot.title.scale overrides): 12x = the social image's proportions on 16:9. */
const DEFAULT_SCALE: Record<string, number> = { '16:9': 12, '9:16': 16, '1:1': 15 };

/**
 * SAFETYNET: Licence to Hack title card. The keyhole capsule art as backdrop, the pixel title SVG (crispEdges, integer scale)
 * laid out as in the social image: title right of the keyhole on 16:9, stacked below it on 9:16 and 1:1.
 * Reveal: the title assembles from horizontal pixel-row strips that come back and settle (about 1 s), with a red/blue split
 * on the strips that are still moving. shot.title = { art, scale: {aspect: n}, reveal_start, reveal_frames }.
 */
export const TitleCard: React.FC<{ shot: any; w: number; h: number; aspect: string; frame: number; frames: number }> = ({ shot, w, h, aspect, frame, frames }) => {
  const cfg = shot.title || {};
  const art = cfg.art || 'brand/c1_keyhole_hookpick6.png';
  const svg = cfg.svg || 'brand/safetynet_licence_to_hack.svg';
  const scale: number = Math.round((cfg.scale && cfg.scale[aspect]) || DEFAULT_SCALE[aspect] || 12);
  const tw = 57 * scale, th = 25 * scale;
  const portrait = h > w, square = w === h;

  // layout (all integers)
  let artBox: { x: number; y: number; w: number; h: number }, tx: number, ty: number;
  if (!portrait && !square) { artBox = { x: 0, y: 0, w, h }; tx = Math.round(w * 0.525); ty = Math.round(h * 0.237); }
  else if (portrait) { artBox = { x: 0, y: 0, w, h: Math.round(h * 0.65) }; tx = Math.round((w - tw) / 2); ty = Math.round(h * 0.675); }
  else { artBox = { x: 0, y: 0, w, h: Math.round(h * 0.7) }; tx = Math.round((w - tw) / 2); ty = Math.round(h * 0.64); }
  const cover = Math.max(artBox.w / ART_W, artBox.h / ART_H) * (1 + 0.05 * (frames > 1 ? frame / (frames - 1) : 0)); // slow push-in, 5%
  const aw = Math.round(ART_W * cover), ah = Math.round(ART_H * cover);
  let ax = Math.round(artBox.w / 2 - KEY_X * aw); ax = Math.min(0, Math.max(artBox.w - aw, ax));
  const ay = Math.round((artBox.h - ah) / 2);

  const rs = cfg.reveal_start ?? 3, rf = cfg.reveal_frames ?? 30;
  const u = Math.max(0, Math.min(1, (frame - rs) / rf));       // 0..1 reveal progress
  const fadeIn = Math.min(1, frame / (cfg.art_fade ?? 8));
  const k = u >= 1 ? 0 : Math.pow(1 - u, 0.8);
  const hide = u >= 1 ? 0 : Math.pow(1 - u, 1.4) * 0.95 + (frame < rs ? 0.05 : 0);
  const step = Math.floor(frame / 2); // strips re-roll every second frame (stepped, like the reference)
  const glitching = frame < rs + rf;
  const bandParams = { seed: step * 13 + 5, k, hide: frame < rs ? 1 : hide, maxShift: Math.round(tw * 0.28), split: 2 * scale / 2, pix: 0, grid: scale, unit: scale / 2, thick: 0.12 };

  const titleImg = <img src={staticFile(svg)} width={tw} height={th} style={{ display: 'block', imageRendering: 'pixelated' }} />;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG }}>
      <div style={{ position: 'absolute', left: artBox.x, top: artBox.y, width: artBox.w, height: artBox.h, overflow: 'hidden', opacity: fadeIn }}>
        <img src={staticFile(art)} style={{ position: 'absolute', left: ax, top: ay, width: aw, height: ah, maxWidth: 'none' }} />
        {/* the art's dark side gets darker still behind the title; stacked layouts fade the art into the page colour */}
        {!portrait && !square ? <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(7,4,9,0) 38%, rgba(7,4,9,0.55) 62%, rgba(7,4,9,0.7) 100%)' }} /> : <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(7,4,9,0) 62%, ${BG} 100%)` }} />}
      </div>
      {/* soft glow behind the title for contrast */}
      <div style={{ position: 'absolute', left: tx - th * 0.5, top: ty - th * 0.45, width: tw + th, height: th * 1.9, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(7,4,9,0.72) 0%, rgba(7,4,9,0.45) 55%, rgba(7,4,9,0) 100%)', opacity: fadeIn }} />
      <div style={{ position: 'absolute', left: tx, top: ty, width: tw, height: th, filter: 'drop-shadow(0 0 22px rgba(208,53,58,0.30))' }}>
        {glitching ? <GlitchFX id="ttl" w={tw} h={th} params={bandParams}>{titleImg}</GlitchFX> : titleImg}
      </div>
    </div>
  );
};
