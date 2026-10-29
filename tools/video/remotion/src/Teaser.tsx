import React, { useEffect } from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { buildTimeline, effectAt } from './timeline.js';
import { loadFonts } from './fonts';
import { TextCard } from './components/TextCard';
import { LogoMorph } from './components/LogoMorph';
import { Gameplay } from './components/Gameplay';
import { GlitchTransition } from './components/GlitchTransition';
import { BlurStreak } from './components/BlurStreak';

export const Teaser: React.FC<{ edit: any; aspect: string; available: Record<string, boolean> }> = ({ edit, aspect, available }) => {
  loadFonts();
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const tl = buildTimeline(edit);
  const source: [number, number] = edit.source_size || [1920, 1080];

  const shots = tl.shots.map((s: any) => (
    <Sequence key={s.id} from={s.startFrame} durationInFrames={s.frames} layout="none">
      <ShotView shot={s} w={w} h={h} aspect={aspect} fps={fps} available={available} source={source} />
    </Sequence>
  ));
  const fx = effectAt(tl, frame);
  let out: React.ReactNode = shots;
  if (fx?.type === 'glitch') out = <GlitchTransition intensity={fx.intensity} frame={frame} w={w} h={h}>{shots}</GlitchTransition>;
  else if (fx?.type === 'blur') out = <BlurStreak intensity={fx.intensity} frame={frame} w={w} h={h} side={fx.side as any}>{shots}</BlurStreak>;
  return <AbsoluteFill style={{ background: '#000' }}>{out}</AbsoluteFill>;
};

const ShotView: React.FC<any> = ({ shot, w, h, aspect, fps, available, source }) => {
  const frame = useCurrentFrame();
  if (shot.type === 'card') {
    if (shot.kind === 'logo' || shot.kind === 'logo_end') return <LogoMorph shot={shot} w={w} h={h} frame={frame} frames={shot.frames} fps={fps} />;
    return <TextCard shot={shot} w={w} h={h} />;
  }
  return <Gameplay shot={shot} w={w} h={h} aspect={aspect} frame={frame} frames={shot.frames} fps={fps} available={available} source={source} />;
};
