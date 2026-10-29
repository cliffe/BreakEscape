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
  } else if (fx?.type === 'blur') out = <BlurStreak intensity={fx.intensity} frame={frame} w={w} h={h} side={fx.side as any}>{shots}</BlurStreak>;
  return <AbsoluteFill style={{ background: '#000' }}>{out}</AbsoluteFill>;
};

const ShotView: React.FC<any> = ({ shot, w, h, aspect, fps, available, source }) => {
  const frame = useCurrentFrame();
  if (shot.type === 'title') return <TitleCard shot={shot} w={w} h={h} aspect={aspect} frame={frame} frames={shot.frames} />;
  if (shot.type === 'card') {
    if (shot.kind === 'logo' || shot.kind === 'logo_end') return <EndLogos shot={shot} w={w} h={h} frame={frame} frames={shot.frames} fps={fps} />;
    return <TextCard shot={shot} w={w} h={h} />;
  }
  return <Gameplay shot={shot} w={w} h={h} aspect={aspect} frame={frame} frames={shot.frames} fps={fps} available={available} source={source} />;
};
