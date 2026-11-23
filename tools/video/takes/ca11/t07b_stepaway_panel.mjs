// t07b_stepaway_panel: the step-away panel alone (script: "THE TRAINING ROOM" chip is the edit's own; this take records the game's real strip and heading text as marks). Hold 3.9 s, then STOP:
// "Look up" and "Carry on" are never clicked. Same entry state as t07_printout_beat (defend complete, not caught, kit_quiet true, percent 60), so the printout is NOT yet out.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca11_misdirected_data t07b_stepaway_panel \
//     "--set episode_e11_misdirected_data_state={\"done\":[\"brief\",\"mistake\",\"flip\",\"defend\"]} --set episode_e11_misdirected_data_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true --set episode_e11_misdirected_data_defend_percent=60" \
//     "--hide-hud --zoom-step 1"
// Marks: kiosk-open, kiosk-buttons (both labels), panel-box (bezel x/y/w/h), strip (tab labels), heading (panel headings), body-text (first 160 chars), frame:panel, end.
import { sleep, prepare, openKiosk, waitButton, buttons, narrowPanel } from './_ca11.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_caught === true || g.kit_quiet !== true) throw new Error('entry state wrong: ' + JSON.stringify({ d: g.kit_defend_done, c: g.kit_caught, q: g.kit_quiet }));
}

export async function run(page, bridge, mark, { narrow = false } = {}) {
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('Look up never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(500);
  if (narrow) await narrowPanel(page, '.epr-kiosk-bezel', 560);
  await sleep(300);
  const bt = await buttons(page); mark('kiosk-buttons', { b: bt });
  if (!bt.some(x => /Look up/.test(JSON.stringify(x))) || !bt.some(x => /Carry on/.test(JSON.stringify(x)))) throw new Error('expected Look up and Carry on: ' + JSON.stringify(bt));
  mark('panel-box', await page.evaluate(() => { const c = document.querySelector('.epr-kiosk-bezel'); const r = c && c.getBoundingClientRect(); return r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null; }));
  mark('strip', await page.evaluate(() => [...document.querySelectorAll('.epr-kiosk-bezel [class*=tab], .epr-kiosk-bezel [role=tab], .epr-kiosk-bezel nav *')].filter(e => e.offsetParent && e.children.length === 0).map(e => (e.innerText || '').trim()).filter(Boolean).slice(0, 12)));
  mark('heading', await page.evaluate(() => [...document.querySelectorAll('.epr-kiosk-bezel h1, .epr-kiosk-bezel h2, .epr-kiosk-bezel h3, .epr-kiosk-bezel [class*=title], .epr-kiosk-bezel [class*=heading]')].filter(e => e.offsetParent).map(e => (e.innerText || '').trim()).filter(Boolean).slice(0, 8)));
  mark('body-text', await page.evaluate(() => { const c = document.querySelector('.epr-kiosk-bezel'); return c ? (c.innerText || '').replace(/\s+/g, ' ').slice(0, 220) : null; }));
  mark('frame:panel'); await sleep(3300);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, {});
