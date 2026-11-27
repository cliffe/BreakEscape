// t06_lookup_panel: the step-away panel alone (script t06_lookup_panel 0 to 3.2 s: the edit's own "THE TRAINING ROOM" chip; this take records the game's strip, heading and text as marks).
// Holds 3.9 s, then STOPS: "Look up" and "Carry on" are never clicked, so Niamh does not walk over and nothing is spoken. Same entry state as t07_niamh_ask (defend complete, not caught, kit_quiet true).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t06_lookup_panel \
//     "<STEP_AWAY_FLAGS from _ca16.mjs>" "--hide-hud --zoom-step 1"
// Marks: kiosk-open, kiosk-buttons, panel-box, strip, heading, body-text, frame:panel (mid-hold), end.
import { sleep, prepare, openKiosk, waitButton, buttons, narrow } from './_ca16.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_caught === true || g.kit_quiet !== true) throw new Error('entry state wrong: ' + JSON.stringify({ d: g.kit_defend_done, c: g.kit_caught, q: g.kit_quiet }));
}

export async function run(page, bridge, mark, { narrowed = false } = {}) {
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('Look up never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(500);
  if (narrowed) await narrow(page, '.epr-kiosk-bezel', 560);
  await page.mouse.move(1500, 1000); await sleep(300);
  const bt = await buttons(page); mark('kiosk-buttons', { b: bt });
  if (!bt.some(x => /Look up/.test(x)) || !bt.some(x => /Carry on/.test(x))) throw new Error('expected Look up and Carry on: ' + JSON.stringify(bt));
  mark('panel-box', await page.evaluate(() => { const c = document.querySelector('.epr-kiosk-bezel'); const r = c && c.getBoundingClientRect(); return r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null; }));
  mark('strip', await page.evaluate(() => [...document.querySelectorAll('.aw-step-num, .aw-step-label, .aw-wordmark')].filter(e => e.offsetParent).map(e => (e.innerText || '').trim())));
  mark('heading', await page.evaluate(() => [...document.querySelectorAll('.epr-kiosk-bezel h2, .epr-kiosk-bezel h3')].filter(e => e.offsetParent).map(e => (e.innerText || '').trim())));
  mark('body-text', await page.evaluate(() => { const e = document.querySelector('.epr-kiosk-bezel .epr-text'); const b = e && e.getBoundingClientRect(); return e ? { text: e.innerText.replace(/\s+/g, ' ').slice(0, 260), box: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] } : null; }));
  await sleep(1800); mark('frame:panel'); await sleep(2100);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
