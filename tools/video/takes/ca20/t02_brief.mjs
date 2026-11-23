// t02_brief: the Brief panel on the Tarrowby blue tab, with the five-step strip (Brief, Choices, Where it led, Defend, Debrief). The edit frames the tab, the heading and the strip only;
// the paragraph ("You're on an authorised exercise at Tarrowby Logistics ... Only that last part is scored ...") is out of frame, and this take also hides it with CSS (visibility:hidden)
// so it is out of every format. Start is never pressed. The shot (topic, 6.9 s: v1b + v1c about 5.9 s of VO) runs from the kiosk-open mark (the first frame with the panel up, the room is behind it before that) to kiosk-open + 6.9 s; the take holds 7.5 s after kiosk-open (hold-end = kiosk-open + 7.2 s, frame:brief = kiosk-open + 3.0 s).
// Entry state: fresh game, no flags (Skip tutorial and the first-run Mission Brief popup closed in setup()).
//   BE_SPRITE unset in dry runs; real run: tools/video/takes/run-take.sh ca20 t02_brief "" "--hide-hud --zoom-step 1"
// Marks: kiosk-open (buttons, tabs), brief-boxes, para-box, para-visibility, frame:brief, hold-end, end.
import { sleep, prepare, openKiosk, buttons, hideLong, narrow, tabs, boxOf } from './_ca20.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

export async function run(page, bridge, mark, { narrowed = false } = {}) {
  await hideLong(page, /^You're on an authorised exercise/i);
  await openKiosk(page, bridge, mark); await sleep(900);
  if (narrowed) await narrow(page, '.epr-kiosk-bezel', 560);
  await page.mouse.move(1500, 1000);
  mark('kiosk-open', { b: await buttons(page), tabs: await tabs(page) });
  const boxes = await page.evaluate(() => { const q = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }; return { bezel: q('.epr-kiosk-bezel'), strip: q('[class*=strip]'), h: q('.epr-kiosk-bezel h1, .epr-kiosk-bezel h2, .epr-kiosk-bezel [class*=heading], .epr-kiosk-bezel [class*=title]') }; });
  mark('brief-boxes', boxes);
  mark('para-box', await page.evaluate(() => { const e = [...document.querySelectorAll('body *')].filter(x => /^You're on an authorised exercise/i.test((x.textContent || '').trim()) && ![...x.children].some(c => /^You're on an authorised exercise/i.test((c.textContent || '').trim())))[0]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }));
  const vis = await page.evaluate(() => { const e = [...document.querySelectorAll('body *')].filter(x => /^You're on an authorised exercise/i.test((x.textContent || '').trim()) && ![...x.children].some(c => /^You're on an authorised exercise/i.test((c.textContent || '').trim())))[0]; return e ? getComputedStyle(e).visibility : 'absent'; });
  mark('para-visibility', { vis });
  if (vis !== 'hidden') throw new Error('Brief paragraph not hidden: ' + vis);
  await sleep(3000); mark('frame:brief'); await sleep(4200);
  mark('hold-end'); await sleep(500);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
