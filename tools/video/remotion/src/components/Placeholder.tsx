import React from 'react';
import { PIXEL_FONT } from '../fonts';

/**
 * Generated test pattern standing in for a take that does not exist yet (1920x1080 source space).
 * Hues vary per shot; a moving block shows motion; dialogue shots get a fake portrait and UI bar so the push-in and
 * UI-crop can be judged.
 */
export const Placeholder: React.FC<{ shot: any; localSec: number; sourceSec: number }> = ({ shot, localSec, sourceSec }) => {
  const hue = (shot.index * 47) % 360;
  const x = 200 + ((localSec * 360) % 1500);
  const dialogue = !!shot.dialogue;
  const label = shot.placeholder || shot.id;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden', background: `hsl(${hue} 35% 14%)`, imageRendering: 'pixelated' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(45deg, hsl(${hue} 30% 20%) 25%, transparent 25%, transparent 75%, hsl(${hue} 30% 20%) 75%), linear-gradient(45deg, hsl(${hue} 30% 20%) 25%, transparent 25%, transparent 75%, hsl(${hue} 30% 20%) 75%)`, backgroundSize: '128px 128px', backgroundPosition: '0 0, 64px 64px' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.12) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.12) 2px, transparent 2px)', backgroundSize: '240px 240px' }} />
      {dialogue ? (
        <>
          <div style={{ position: 'absolute', left: 760, top: 80, width: 420, height: 760, background: `hsl(${hue} 20% 55%)` }} />
          <div style={{ position: 'absolute', left: 860, top: 90, width: 220, height: 250, background: `hsl(${hue} 35% 72%)` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 262, background: 'rgba(0,0,0,0.78)' }} />
          <div style={{ position: 'absolute', left: 330, bottom: 190, fontFamily: PIXEL_FONT, fontSize: 24, color: '#6ab0ff' }}>{shot.lines?.[0]?.speaker || 'Speaker'}</div>
          <div style={{ position: 'absolute', left: 330, bottom: 110, width: 1050, fontFamily: PIXEL_FONT, fontSize: 22, lineHeight: 1.6, color: '#fff' }}>{shot.lines?.[0]?.text || '...'}</div>
          <div style={{ position: 'absolute', left: 1400, bottom: 70, width: 190, height: 52, background: '#1c4a22', border: '2px solid #3b9' }} />
        </>
      ) : (
        <div style={{ position: 'absolute', left: x, top: 420, width: 96, height: 96, background: `hsl(${(hue + 150) % 360} 80% 60%)` }} />
      )}
      <div style={{ position: 'absolute', left: 48, top: 40, fontFamily: PIXEL_FONT, fontSize: 30, color: '#ffe36a', textShadow: '3px 3px 0 #000' }}>PLACEHOLDER</div>
      <div style={{ position: 'absolute', left: 48, top: 96, maxWidth: 1500, fontFamily: PIXEL_FONT, fontSize: 28, lineHeight: 1.4, color: '#fff', textShadow: '3px 3px 0 #000' }}>{shot.id}</div>
      <div style={{ position: 'absolute', left: 48, top: 150, maxWidth: 1600, fontFamily: PIXEL_FONT, fontSize: 20, lineHeight: 1.5, color: '#cde', textShadow: '2px 2px 0 #000' }}>{label}</div>
      <div style={{ position: 'absolute', right: 48, top: 40, fontFamily: PIXEL_FONT, fontSize: 28, color: '#9fe', textShadow: '3px 3px 0 #000' }}>src {sourceSec.toFixed(2)}s</div>
    </div>
  );
};
