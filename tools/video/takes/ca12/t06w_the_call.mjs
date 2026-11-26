// t06w_the_call: the attacker's pretext call to Delphine, ca12b (r3) cut: the same call as t06 up to the second choice menu, which holds
// 2.2 s, and the pick "leave it at the desk" (the walked-away route). Stops 0.8 s after the pick: no third line is awaited.
// Script: docs/video/scripts/ca12_trailer_script_r3.md 5.1. Needs no new voice lines (D3 and D2 are cached).
// Entry state: fresh game, from the repo root (BE_PORT=<n> for the keyless server):
//   tools/video/takes/run-take.sh ca12_visitor_tailgater t06w_the_call "" "--hide-hud --zoom-step 1"
// setup() (off camera, ~20 s) as t06: Resume, Skip tutorial, Brief, kiosk Start, browser, Friendface, Catherine Merrin, Pin, Prepare the call,
// Recipient. The body presses Approach so D3 plays on camera. Spoiler rules as t06: tells panel hidden by CSS, no outcome label, Done not pressed.
// Marks: call-open, frame:npc-portrait-up, line-start/line-end, frame:menu-up:N and route-option-rect (the "leave it at the desk" option, for the
// inset, only in the last 1.2 s of the talk beat), choose:N, tells-hidden, meter:<value>, frame:end-of-take (choose:2 + 0.8 s).
// Points (script 5.1): talk in = frame:menu-up:2 - 0.35 s, out = choose:2 - 0.02 s.
import { sleep, toCall, pressButton } from './_ca12b.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await toCall(page, bridge, () => {}, { stopBeforeApproach: true }); await sleep(300);
  await page.addStyleTag({ content: '.pretext-tells{visibility:hidden !important}' });
}

const STEPS = [/sample box for Catherine/, /leave it at the desk/];
const state = async (bridge) => (await bridge.getState());

const optionRect = (page, re) => page.evaluate(([src, fl]) => {
  const r = new RegExp(src, fl);
  const els = [...document.querySelectorAll('button, li, div, p, span, a')].filter(e => e.offsetParent && r.test((e.innerText || '').trim()) && ![...e.children].some(c => c.offsetParent && r.test((c.innerText || '').trim())));
  if (!els.length) return null;
  const b = els[0].getBoundingClientRect();
  return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), text: (els[0].innerText || '').trim().slice(0, 80) };
}, [re.source, re.flags]).catch(() => null);

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await pressButton(page, /Approach/);   // D3 starts as the call opens: pressed here so the voice watcher hears it
  mark('call-open');
  const meter = async () => page.evaluate(() => window.MinigameFramework?.currentMinigame?.getTestState?.().se?.bar?.value).catch(() => undefined);
  let last;
  const meterPoll = setInterval(async () => { const v = await meter(); if (v !== undefined && v !== last) { last = v; mark('meter:' + v); } }, 200);
  await sleep(100);
  let t0 = Date.now(), up = false;
  while (Date.now() - t0 < 10000 && !up) { const d = (await state(bridge)).dialogue; if (d && d.speaker && /Delphine/i.test(d.speaker)) { up = true; mark('frame:npc-portrait-up', { speaker: d.speaker }); } else await sleep(100); }
  if (!up) throw new Error('Delphine portrait never up');
  try {
    const lines = [/Can I help you/, /For Catherine/];
    for (let k = 0; k < 2; k++) {
      if (!(await vw.waitForLine(lines[k], 25000))) throw new Error('line never voiced: ' + lines[k]);
      t0 = Date.now(); let d;
      while (Date.now() - t0 < 15000) { d = (await state(bridge)).dialogue; if (d && d.awaitingChoice && d.choices && d.choices.length) break; await sleep(150); }
      if (!(d && d.awaitingChoice)) throw new Error('choice menu ' + (k + 1) + ' never came up');
      mark('frame:menu-up:' + (k + 1), { choices: d.choices.length });
      if (k === 1) mark('route-option-rect', await optionRect(page, STEPS[1]));
      await sleep(2200);                                   // the choices must read on screen
      mark('choose:' + (k + 1));
      await bridge.minigame.choose(STEPS[k]);
      if (k === 0) { await sleep(500); mark('tells-hidden', await page.evaluate(() => { const e = document.querySelector('.pretext-tells'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })); }
    }
    await sleep(800); mark('frame:end-of-take');       // no third line is awaited
  } finally { clearInterval(meterPoll); await vw.stop(); }
};
