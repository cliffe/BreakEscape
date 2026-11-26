import React, { useEffect } from 'react';
import { AbsoluteFill, Freeze, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { buildTimeline, effectAt } from './timeline.js';
import { loadFonts } from './fonts';
import { TextCard } from './components/TextCard';
import { EndLogos } from './components/EndLogos';
import { TitleCard } from './components/TitleCard';
import { PixelDissolve } from './components/PixelDissolve';
import { Gameplay } from './components/Gameplay';
import { GlitchTransition } from './components/GlitchTransition';
import { BlurStreak } from './components/BlurStreak';
import { CtaShot } from './components/CtaShot';
import { GlitchFX } from './components/GlitchFX';
import { CaOpen } from './components/CaOpen';
import { CaClose } from './components/CaClose';
import { CaCard } from './components/CaCard';
import { CaChapter } from './components/CaChapter';
import { CaSeats, seatOf } from './components/CaSeats';
import { SeamWipe } from './components/SeamWipe';
import { FlipTransition } from './components/FlipTransition';
import { CcOpen } from './components/CcOpen';
import { CcClose } from './components/CcClose';
import { CcCard } from './components/CcCard';
import { CaVo } from './components/CaVo';
import { CaTitlePlate } from './components/CaTitlePlate';

export const Teaser: React.FC<{ edit: any; aspect: string; available: Record<string, boolean> }> = ({ edit, aspect, available }) => {
  loadFonts();
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const tl0 = buildTimeline(edit);
  // edit-level seat_labels {attack, defend} override the ATTACKER / DEFENDER tab text on every Cyber Aware component (absent: unchanged)
  const tlCa = edit.seat_labels ? { ...tl0, shots: tl0.shots.map((s: any) => ({ ...s, seat_labels: edit.seat_labels })) } : tl0;
  // Critical Cases edits: the edit-level cc ({case, accent, panel, case1, case2, ...}) sits under each shot's own cc
  const tl = edit.theme === 'cc' && edit.cc ? { ...tlCa, shots: tlCa.shots.map((s: any) => ({ ...s, cc: { ...edit.cc, ...(s.cc || {}) } })) } : tlCa;
  // edit-level caption_top {"9:16": fraction} lifts the burned dialogue captions in portrait (absent: unchanged)
  if (edit.caption_top) tl.shots = tl.shots.map((s: any) => ({ ...s, caption_top: edit.caption_top }));
  const source: [number, number] = edit.source_size || [1920, 1080];

  const shots = tl.shots.map((s: any) => (
    <Sequence key={s.id} from={s.startFrame} durationInFrames={s.frames} layout="none">
      <ShotView shot={s} w={w} h={h} aspect={aspect} fps={fps} available={available} source={source} />
    </Sequence>
  ));
  const fx = effectAt(tl, frame);
  let out: React.ReactNode = shots;
  if (fx?.type === 'glitch') out = <GlitchTransition intensity={fx.intensity} frame={frame} w={w} h={h}>{shots}</GlitchTransition>;
  else if (fx?.type === 'dissolve') {
    // the outgoing shot, frozen on its last frame, is drawn over the incoming one and breaks into blocks
    const prev = tl.shots[fx.join.index - 1];
    out = (
      <>
        {shots}
        <Sequence from={prev.startFrame} durationInFrames={prev.frames + fx.join.frames} layout="none">
          <PixelDissolve k={fx.k} n={fx.join.frames} w={w} h={h} block={edit.shots[fx.join.index].join?.block ?? edit.effects?.dissolveBlock ?? 24} seed={fx.join.index + 3}>
            <Freeze frame={prev.frames - 1}>
              <ShotView shot={prev} w={w} h={h} aspect={aspect} fps={fps} available={available} source={source} />
            </Freeze>
          </PixelDissolve>
        </Sequence>
      </>
    );
  } else if (fx?.type === 'seam' || fx?.type === 'flip') {
    // Cyber Aware joins: like the dissolve, the outgoing shot (frozen on its last frame) is drawn over the incoming one
    const prev = tl.shots[fx.join.index - 1];
    const frozen = (
      <Freeze frame={prev.frames - 1}>
        <ShotView shot={prev} w={w} h={h} aspect={aspect} fps={fps} available={available} source={source} />
      </Freeze>
    );
    out = (
      <>
        {shots}
        <Sequence from={prev.startFrame} durationInFrames={prev.frames + fx.join.frames} layout="none">
          {fx.type === 'seam' ? <SeamWipe k={fx.k} n={fx.join.frames} w={w} h={h} seed={fx.join.index}>{frozen}</SeamWipe> : <FlipTransition k={fx.k} n={fx.join.frames} w={w} h={h}>{frozen}</FlipTransition>}
        </Sequence>
      </>
    );
  } else if (fx?.type === 'blur') out = <BlurStreak intensity={fx.intensity} frame={frame} w={w} h={h} side={fx.side as any}>{shots}</BlurStreak>;
  return <AbsoluteFill style={{ background: '#000' }}>{out}{edit.vo?.length ? <CaVo edit={edit} tl={tl} frame={frame} w={w} h={h} aspect={aspect} fps={fps} /> : null}</AbsoluteFill>;
};

const ShotView: React.FC<any> = ({ shot, w, h, aspect, fps, available, source }) => {
  const frame = useCurrentFrame();
  if (shot.type === 'title') return <TitleCard shot={shot} w={w} h={h} aspect={aspect} frame={frame} frames={shot.frames} />;
  if (shot.type === 'cta') return <CtaShot shot={shot} w={w} h={h} frame={frame} frames={shot.frames} fps={fps} aspect={aspect} />;
  if (shot.type === 'ca_open') return <CaOpen shot={shot} w={w} h={h} aspect={aspect} frame={frame} frames={shot.frames} />;
  if (shot.type === 'ca_close') return <CaClose shot={shot} w={w} h={h} aspect={aspect} frame={frame} frames={shot.frames} />;
  if (shot.type === 'cc_open') return <CcOpen shot={shot} w={w} h={h} aspect={aspect} frame={frame} frames={shot.frames} />;
  if (shot.type === 'cc_close') return <CcClose shot={shot} w={w} h={h} aspect={aspect} frame={frame} frames={shot.frames} />;
  if (shot.type === 'card' && shot.style === 'cc') return <CcCard shot={shot} w={w} h={h} frame={frame} />;
  if (shot.type === 'card' && shot.style === 'ca' && shot.chapter) return <CaChapter shot={shot} w={w} h={h} frame={frame} />;
  if (shot.type === 'card' && shot.style === 'ca') return <CaCard shot={shot} w={w} h={h} frame={frame} />;
  if (shot.type === 'card') {
    if (shot.kind === 'logo' || shot.kind === 'logo_end') return <EndLogos shot={shot} w={w} h={h} frame={frame} frames={shot.frames} fps={fps} />;
    return <TextCard shot={shot} w={w} h={h} />;
  }
  const gp = <Gameplay shot={shot} w={w} h={h} aspect={aspect} frame={frame} frames={shot.frames} fps={fps} available={available} source={source} />;
  const gt = shot.title_plate ? <>{gp}<CaTitlePlate shot={shot} w={w} h={h} localSec={frame / fps} /></> : gp; // title over footage (product trailer), inside the seat frame
  const g = seatOf(shot) ? <CaSeats shot={shot} w={w} h={h}>{gt}</CaSeats> : gt;
  // shot.hit = { frames: 3, k, ... }: a 2-3 frame glitch on the shot's first frames (an impact on a hard cut), same engine as the joins
  const hit = shot.hit;
  if (hit && frame < (hit.frames ?? 3)) {
    const k = (hit.k ?? 0.7) * (1 - frame / ((hit.frames ?? 3) + 1));
    return <GlitchFX id={`hit-${shot.id}`} w={w} h={h} params={{ seed: frame * 41 + 9, k, maxShift: Math.round(w * (hit.shift ?? 0.07)), split: Math.round(w * 0.006), pix: hit.pix ?? 0.1, block: Math.max(8, Math.round(w / 100)), thick: 0.06 }}>{g}</GlitchFX>;
  }
  return g;
};
