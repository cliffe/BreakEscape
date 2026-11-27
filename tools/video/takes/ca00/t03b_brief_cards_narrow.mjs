// t03b_brief_cards_narrow: the same run as t03_brief_cards with the panel narrowed by injected CSS (max-width 560 px on .epr-kiosk-bezel) so the paragraph
// text wraps inside a 9:16 or 1:1 window (607 px wide). Same marks and holds; the edit uses this take for the card shots at 9:16 and 1:1.
// Entry state: fresh game, no flags.
//   BE_PORT=<port> tools/video/takes/run-take.sh ca00_first_play t03b_brief_cards_narrow "" "--hide-hud --zoom-step 1"
// Marks: as t03, plus narrow-css (CSS injected, logged before the kiosk opens), panel-width (data: the kiosk bezel's measured width in px, expect 560).
import { sleep, prepare, openKiosk, readCards, hideCss, NARROW_CSS } from './_ca00.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  await hideCss(page, NARROW_CSS); mark('narrow-css');
  await openKiosk(page, bridge, mark);
  const w = await page.evaluate(() => { const p = document.querySelector('.epr-kiosk-bezel'); return p ? Math.round(p.getBoundingClientRect().width) : null; });
  mark('panel-width', { px: w });
  await readCards(page, mark, [7, 9, 7, 7, 2, 7, 7]);
  mark('end');
};
