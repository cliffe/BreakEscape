// t04_flip: the flip. Seeded entry (done brief, mistake): the kiosk opens on the montage page ("Later that afternoon"); its beat cards are display:none and the "Your call" tags hidden so only the heading and
// the strip show, then Continue: the strip ticks to 4 Defend and the defend panel's intro text ("That's where the afternoon went. ... If you didn't start it, don't open it, and tell me.") is hidden with
// visibility:hidden, leaving the tab, heading and strip. The edit uses 0 to 3.0 s of the shot (v6 "Now it's your turn."): marks `open` and `press`.
// Entry state (flip seed):
//   tools/video/takes/run-take.sh ca19_malware_and_updates t04_flip "--set episode_e19_malware_and_updates_state={\"done\":[\"brief\",\"mistake\"]}" "--hide-hud --zoom-step 1"
// Marks: player-sprite, kiosk-open (buttons, tabs), open, press, after-press (buttons, tabs, panel boxes), intro-proof, frame:open, frame:flipped, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, hideLong, hideText, narrow, tabs, sprite } from './_ca19.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const INTRO = /^That's where the afternoon went/i;
export async function run(page, bridge, mark, { narrowed = false } = {}) {
  await hideLong(page, INTRO); await hideText(page, /^Your call/i);
  await page.addStyleTag({ content: 'li.aw-montage-beat{display:none !important}' });
  await sprite(page, mark);
  await openKiosk(page, bridge, mark); await sleep(900);
  if (narrowed) await narrow(page, '.epr-kiosk-bezel', 560);
  await page.mouse.move(1500, 1000);
  if (!(await waitButton(page, /^Continue/, 8000))) throw new Error('Continue never showed; buttons ' + JSON.stringify(await buttons(page)));
  mark('kiosk-open', { b: await buttons(page), tabs: await tabs(page) });
  await sleep(1200); mark('open'); mark('frame:open'); await sleep(1500);
  mark('press'); await pressButton(page, /^Continue/); await sleep(900);
  const boxes = await page.evaluate(() => { const q = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }; return { bezel: q('.epr-kiosk-bezel'), strip: q('[class*=strip]'), h: q('.epr-kiosk-bezel h1, .epr-kiosk-bezel h2, .epr-kiosk-bezel [class*=heading], .epr-kiosk-bezel [class*=title]') }; });
  mark('after-press', { b: await buttons(page), tabs: await tabs(page), boxes });
  const intro = await page.evaluate(() => { const re = /^That's where the afternoon went/i; const e = [...document.querySelectorAll('.epr-kiosk-bezel *')].filter(x => re.test((x.textContent || '').trim()) && ![...x.children].some(c => re.test((c.textContent || '').trim())))[0]; if (!e) return null; const r = e.getBoundingClientRect(); return { box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], visibility: getComputedStyle(e).visibility }; });
  mark('intro-proof', intro);
  if (!intro || intro.visibility !== 'hidden') throw new Error('defend intro not found or not hidden: ' + JSON.stringify(intro));
  await sleep(1500); mark('frame:flipped'); await sleep(2500); mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
