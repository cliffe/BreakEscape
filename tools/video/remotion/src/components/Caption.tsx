import React from 'react';
import { PIXEL_FONT } from '../fonts';

/**
 * Overlay caption for dialogue shots whose crop loses the game's own subtitle bar (shot.caption[aspect] = true).
 * Text comes from shot.lines (times relative to the shot's in point). Press Start 2P, small, bottom third, hard on/off.
 */
export const Caption: React.FC<{ shot: any; w: number; h: number; localSec: number }> = ({ shot, w, h, localSec }) => {
  const line = (shot.lines || []).find((l: any) => localSec >= l.start && localSec < l.end);
  if (!line) return null;
  return <CaptionBox w={w} h={h} speaker={line.speaker} text={line.text} topFrac9x16={shot.caption_top?.['9:16']} />;
};

/**
 * The SAFETYNET caption plate (dark box, gold border, Press Start 2P), shared by the dialogue Caption and the announcer skin of CaVo.
 * topFrac9x16: edit-level caption_top["9:16"], the box's top as a fraction of the height in portrait (absent: 0.70, as before).
 */
export const CaptionBox: React.FC<{ w: number; h: number; speaker?: string; text: string; topFrac9x16?: number }> = ({ w, h, speaker, text, topFrac9x16 }) => {
  const line = { speaker, text };
  const size = Math.round(w * 0.034 / 2) * 2; // 36 px at 1080 wide
  const nameSize = Math.round(size * 0.78 / 2) * 2;
  const portrait = h > w;
  // The box's top sits at `topFrac` of the height; a box too tall to fit above the bottom margin is lifted
  // instead of running off the frame (three-line captions in 1:1 did, 23 Nov). The spacer above the box
  // shrinks first when box + spacer overflow the region.
  const topFrac = portrait ? (topFrac9x16 ?? 0.7) : 0.78;
  const regionTop = Math.round(h * 0.4);
  const bottomMargin = Math.round(h * 0.03);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: regionTop, bottom: bottomMargin, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', pointerEvents: 'none' }}>
      <div data-caption-spacer style={{ flex: `0 1 ${Math.round(h * topFrac) - regionTop}px`, minHeight: 0 }} />
      <div style={{ flexShrink: 0, width: Math.round(w * 0.86), padding: `${Math.round(size * 0.6)}px ${Math.round(size * 0.7)}px`, background: 'rgba(8,8,20,0.82)', border: '4px solid #c8b98a', boxSizing: 'border-box', fontFamily: PIXEL_FONT, WebkitFontSmoothing: 'none' as any, textRendering: 'optimizeSpeed' as any }}>
        {line.speaker ? <div style={{ fontSize: nameSize, color: '#e8d8a0', marginBottom: Math.round(size * 0.5) }}>{line.speaker}</div> : null}
        <div style={{ fontSize: size, color: '#fff', lineHeight: 1.6, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{line.text}</div>
      </div>
    </div>
  );
};
