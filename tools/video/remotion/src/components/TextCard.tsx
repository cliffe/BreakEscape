import React from 'react';
import { PIXEL_FONT } from '../fonts';
import { CardStage } from './CardStage';
import { cardLines } from '../timeline.js';

export const fitCardText = (lines: any[], w: number, h: number) => {
  const maxChars = Math.max(...lines.filter((l) => !l.scale).map((l) => l.text.length), 4);
  const size = Math.min(h * 0.145, (w * (h > w ? 0.86 : w === h ? 0.76 : 0.62)) / maxChars);
  return Math.round(size / 2) * 2;
};

/** The card text itself (also used inside the logo morph). */
export const CardText: React.FC<{ lines: any[]; size: number; color?: string }> = ({ lines, size, color = '#fff' }) => (
  <div style={{ textAlign: 'center', fontFamily: PIXEL_FONT, color, lineHeight: 1.28, whiteSpace: 'nowrap', textRendering: 'optimizeSpeed' as any, WebkitFontSmoothing: 'none' as any }}>
    {lines.map((l, i) => (
      <div key={i} style={{ fontSize: Math.round(size * (l.scale ?? 1)), marginTop: l.gap ? Math.round(size * l.gap) : 0, color: l.color || color }}>{l.text}</div>
    ))}
  </div>
);

export const textBlockHeight = (lines: any[], size: number) =>
  Math.round(lines.reduce((a, l) => a + size * (l.scale ?? 1) * 1.28 + (l.gap ? size * l.gap : 0), 0));

export const TextCard: React.FC<{ shot: any; w: number; h: number }> = ({ shot, w, h }) => {
  const lines = cardLines(shot);
  const size = fitCardText(lines, w, h);
  const bh = textBlockHeight(lines, size);
  return (
    <CardStage w={w} h={h} blockH={bh} id={`tc-${shot.id}`}>
      <CardText lines={lines} size={size} />
    </CardStage>
  );
};
