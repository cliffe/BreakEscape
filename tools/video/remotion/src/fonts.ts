import { staticFile, delayRender, continueRender } from 'remotion';
let started = false;
/** Loads Press Start 2P from public/fonts (synced from the game's assets) before any frame is captured. */
export function loadFonts() {
  if (started) return; started = true;
  const h = delayRender('font Press Start 2P');
  const ff = new FontFace('Press Start 2P', `url(${staticFile('fonts/PressStart2P-Regular.woff2')})`);
  ff.load().then((f) => { (document as any).fonts.add(f); continueRender(h); }).catch((e) => { console.error('font load failed', e); continueRender(h); });
}
export const PIXEL_FONT = "'Press Start 2P', monospace";
