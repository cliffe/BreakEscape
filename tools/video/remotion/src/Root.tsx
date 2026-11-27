import React from 'react';
import { Composition } from 'remotion';
import { Teaser } from './Teaser';
import { buildTimeline, dims } from './timeline.js';

const fallbackEdit = { id: 'empty', fps: 30, aspects: undefined, shots: [{ id: 'x', type: 'card', duration: 1, text: ['No props'], join: { type: 'cut' }, spoiler: {} }] };

export const Root: React.FC = () => (
  <Composition
    id="Teaser"
    component={Teaser as any}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={900}
    defaultProps={{ edit: fallbackEdit as any, aspect: '16:9', available: {} as Record<string, boolean> }}
    calculateMetadata={({ props }: any) => {
      const tl = buildTimeline(props.edit);
      const [width, height] = dims(props.edit, props.aspect);
      return { durationInFrames: Math.max(1, tl.totalFrames), fps: props.edit.fps, width, height };
    }}
  />
);
