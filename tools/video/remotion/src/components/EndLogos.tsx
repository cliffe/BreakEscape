import React from 'react';
import { staticFile } from 'remotion';
import { CardStage } from './CardStage';
import { GlitchFX, makeBands } from './GlitchFX';
import { rng } from '../rand';

/**
 * Closing logos, as the reference trailer's 0-5 s: the real Hacktivity Cyber Security Labs logo assembles out of scrambled
 * horizontal strips, holds, then only the line under the word changes ("Cyber Security Labs" -> "Games") through a coloured
 * glitch; the plum "Hacktivity" word is the same artwork in both logos, so it stays put (aligned on the shared word).
 * Artwork: hacktivity-logo.svg and hacktivity-games-logo.svg from the Hacktivity repo, split by sync-assets.mjs into the word
 * and the two sub-lines (all keep their own full viewBox, so they register exactly). kind 'logo_end' starts on Games.
 * shot.logo = { assemble_frames: 24, morph_at: 0.5, morph_frames: 12 }
 */
const LABS_RATIO = 10.301043 / 41.199425;   // box height / width of hacktivity-logo.svg
const GAMES_RATIO = 54.131779 / 172.44057;  // same for hacktivity-games-logo.svg

export const logoHeight = (W: number) => Math.round(W * GAMES_RATIO);

/**
 * The logo itself (assemble from strips, Labs -> Games morph), W px wide, `frame` counted from the start of the assembly.
 * cfg = { assemble_frames, morph_at_frame (absolute frame in this local clock) , morph_frames }. Also used by CtaShot in front of the curtain.
 */
export const LogoMorph: React.FC<{ W: number; frame: number; A: number; t1: number; M: number; endOnly?: boolean }> = ({ W, frame, A, t1, M, endOnly = false }) => {
  const H = Math.round(W * GAMES_RATIO);
  const hL = Math.round(W * LABS_RATIO);
  const img = (f: string, hh: number) => <img src={staticFile(f)} width={W} height={hh} style={{ position: 'absolute', left: 0, top: 0, display: 'block' }} />;
  const word = img('brand-derived/logo-labs-word.svg', hL);
  const labs = img('brand-derived/logo-labs-sub.svg', hL);
  const games = img('brand-derived/logo-games-sub.svg', H);

  // sub-line layer
  let sub: React.ReactNode = frame >= t1 + M || endOnly ? games : labs;
  if (!endOnly && frame >= t1 && frame < t1 + M) {
    const p = (frame - t1 + 1) / (M + 1);
    const bands = makeBands({ seed: 4242, k: 0, maxShift: 0, split: 0, thick: 0.05 }, W, H);
    const r = rng(777);
    const items = bands.map((b, i) => {
      const thr = r();
      return <div key={i} style={{ position: 'absolute', inset: 0, clipPath: `inset(${b.y}px 0 ${H - b.y - b.h}px 0)` }}>{thr < p ? games : labs}</div>;
    });
    const bump = Math.sin(Math.PI * p);
    sub = (
      <GlitchFX id="lg-sub" w={W} h={H} params={{ seed: frame * 17 + 3, k: Math.min(1, 0.35 + bump), maxShift: Math.round(W * 0.1), split: Math.max(2, Math.round(W * 0.012)), pix: 0.28 * bump, block: Math.max(6, Math.round(W / 70)), thick: 0.08 }}>
        {items}
      </GlitchFX>
    );
  }
  const body = (
    <div style={{ position: 'relative', width: W, height: H }}>
      {word}
      {sub}
    </div>
  );
  let content: React.ReactNode = body;
  if (frame < A) {
    const u = Math.max(0, Math.min(1, (frame + 1) / A));
    content = (
      <div style={{ position: 'relative', width: W, height: H }}>
        <GlitchFX id="lg-asm" w={W} h={H} params={{ seed: Math.floor(frame / 2) * 29 + 11, k: Math.pow(1 - u, 0.7), hide: Math.pow(1 - u, 1.2) * 0.97, maxShift: Math.round(W * 0.35), split: Math.max(2, Math.round(W * 0.01)), thick: 0.05 }}>
          <div style={{ position: 'absolute', inset: 0 }}>{word}{labs}</div>
        </GlitchFX>
      </div>
    );
  }
  return <>{content}</>;
};

export const EndLogos: React.FC<{ shot: any; w: number; h: number; frame: number; frames: number; fps: number }> = ({ shot, w, h, frame, frames }) => {
  const cfg = shot.logo || {};
  const portrait = h > w, square = w === h;
  const W = Math.round(w * (portrait ? 0.8 : square ? 0.7 : 0.5));
  const H = logoHeight(W);
  const endOnly = shot.kind === 'logo_end';
  const A = endOnly ? 0 : (cfg.assemble_frames ?? 24);
  const M = cfg.morph_frames ?? 12;
  const t1 = endOnly ? -1 : Math.round(frames * (cfg.morph_at ?? 0.5));
  return <CardStage w={w} h={h} blockH={H} id="lg-stage"><LogoMorph W={W} frame={frame} A={A} t1={t1} M={M} endOnly={endOnly} /></CardStage>;
};
