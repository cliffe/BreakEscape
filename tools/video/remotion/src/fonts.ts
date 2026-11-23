import { staticFile, delayRender, continueRender } from 'remotion';
let started = false;
/**
 * Loads the fonts from public/fonts (synced by scripts/sync-assets.mjs from the game's own assets) before any frame is captured.
 * Nothing is fetched at render time. Press Start 2P: SAFETYNET and Cyber Aware. GNF, VT323, Source Sans 3: the Cyber Aware theme.
 */
const FACES: [string, string][] = [
  ['Press Start 2P', 'fonts/PressStart2P-Regular.woff2'],
  ['GNF', 'fonts/gnf.woff2'],
  ['VT323', 'fonts/VT323-latin.woff2'],
  ['Source Sans 3', 'fonts/SourceSans3-latin.woff2'],
  ['IBM Plex Sans Condensed', 'fonts/IBMPlexSansCondensed-Bold.ttf'], // Critical Cases theme (cc), OFL, from tools/video/assets/fonts-cc
  ['IBM Plex Mono', 'fonts/IBMPlexMono-SemiBold.ttf'],
];
export function loadFonts() {
  if (started) return; started = true;
  for (const [family, file] of FACES) {
    const h = delayRender(`font ${family}`);
    const ff = new FontFace(family, `url(${staticFile(file)})`, family.startsWith('IBM Plex') ? { weight: family.endsWith('Mono') ? '600' : '700' } : undefined);
    ff.load().then((f) => { (document as any).fonts.add(f); continueRender(h); }).catch((e) => { console.error('font load failed', family, e); continueRender(h); });
  }
}
export const PIXEL_FONT = "'Press Start 2P', monospace";
export const GNF_FONT = "'GNF', 'Press Start 2P', monospace";
export const VT_FONT = "'VT323', monospace";
export const CAPTION_FONT = "'Source Sans 3', sans-serif";
