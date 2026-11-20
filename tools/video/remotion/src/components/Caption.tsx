import React from 'react';
import { PIXEL_FONT } from '../fonts';

/**
 * Overlay caption for dialogue shots whose crop loses the game's own subtitle bar (shot.caption[aspect] = true).
 * Text comes from shot.lines (times relative to the shot's in point). Press Start 2P, small, bottom third, hard on/off.
 */
export const Caption: React.FC<{ shot: any; w: number; h: number; localSec: number }> = ({ shot, w, h, localSec }) => {
  const line = (shot.lines || []).find((l: any) => localSec >= l.start && localSec < l.end);
  if (!line) return null;
  const size = Math.round(w * 0.034 / 2) * 2; // 36 px at 1080 wide
  const nameSize = Math.round(size * 0.78 / 2) * 2;
  const portrait = h > w;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: Math.round(h * (portrait ? 0.7 : 0.78)), display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ width: Math.round(w * 0.86), padding: `${Math.round(size * 0.6)}px ${Math.round(size * 0.7)}px`, background: 'rgba(8,8,20,0.82)', border: '4px solid #c8b98a', boxSizing: 'border-box', fontFamily: PIXEL_FONT, WebkitFontSmoothing: 'none' as any, textRendering: 'optimizeSpeed' as any }}>
        {line.speaker ? <div style={{ fontSize: nameSize, color: '#e8d8a0', marginBottom: Math.round(size * 0.5) }}>{line.speaker}</div> : null}
        <div style={{ fontSize: size, color: '#fff', lineHeight: 1.6, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{line.text}</div>
      </div>
    </div>
  );
};
