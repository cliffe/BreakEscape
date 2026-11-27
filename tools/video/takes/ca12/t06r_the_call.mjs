// t06r_the_call: the attacker's pretext call to Delphine, ca12 (r3) cut: the same call as t06 with a choice menu that holds long enough to
// read and the new D1 ("Go on then. Studio's through the side door on your left."). Script: docs/video/scripts/ca12_trailer_script_r3.md 5.1.
// Entry state: fresh game, from the repo root (BE_PORT=<n> for the keyless server):
//   tools/video/takes/run-take.sh ca12_visitor_tailgater t06r_the_call "" "--hide-hud --zoom-step 1"
// setup() (off camera, ~20 s) does Resume, Skip tutorial, closes the Brief, kiosk Start, Open the browser, Friendface, Catherine Merrin, Pin, close,
// Prepare the call, Recipient. The take body presses Approach so D3 plays on camera. Needs delphine_reception.json compiled with L1 and the
// D1 clip in tts_cache/ca12_visitor_tailgater (f0fc4f17f129f971e99caf47b7fa9458, "Go on then. Studio's through the side door on your left.").
// Spoiler rules as t06: no tells panel (hidden by injected CSS, visibility keeps the layout), no outcome label, Done not pressed.
// Marks: call-open, frame:npc-portrait-up, line-start/line-end (voice watcher), frame:menu-up:N (first poll with choice menu N up) and
// route-option-rect (DOM rect of the option matching STEPS[1], for the inset) with it, choose:N (after a 2.2 s dwell), tells-hidden,
// meter:<value>, frame:d1-subtitle-up (first poll after choose:2 with Delphine speaking /side door/), d1-done marks, frame:end-of-take.
// Points (script 5.1): talk in = frame:menu-up:2 - 0.35 s, out = choose:2 - 0.02 s; lands in = frame:d1-subtitle-up + 0.10 s, out = speech end
// + 0.25 s (speech end from silencedetect -40 dB on the take, not from line-end).
import { sleep, toCall, pressButton } from './_ca12b.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await toCall(page, bridge, () => {}, { stopBeforeApproach: true }); await sleep(300);
  await page.addStyleTag({ content: '.pretext-tells{visibility:hidden !important}' });
}

const STEPS = [/sample box for Catherine/, /buzz me through/];
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
    const lines = [/Can I help you/, /For Catherine/, /side door on your left/];
    for (let k = 0; k < 3; k++) {
      if (!(await vw.waitForLine(lines[k], 25000))) throw new Error('line never voiced: ' + lines[k]);
      if (k === 2) break;
      t0 = Date.now(); let d;
      while (Date.now() - t0 < 15000) { d = (await state(bridge)).dialogue; if (d && d.awaitingChoice && d.choices && d.choices.length) break; await sleep(150); }
      if (!(d && d.awaitingChoice)) throw new Error('choice menu ' + (k + 1) + ' never came up');
      mark('frame:menu-up:' + (k + 1), { choices: d.choices.length });
      if (k === 1) mark('route-option-rect', await optionRect(page, STEPS[1]));
      await sleep(2200);                                   // the choices must read on screen
      mark('choose:' + (k + 1));
      await bridge.minigame.choose(STEPS[k]);
      if (k === 0) { await sleep(500); mark('tells-hidden', await page.evaluate(() => { const e = document.querySelector('.pretext-tells'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })); }
      if (k === 1) {
        t0 = Date.now();
        while (Date.now() - t0 < 25000) {
          const dd = (await state(bridge)).dialogue;
          if (dd && dd.speaker && /Delphine/i.test(dd.speaker) && /side door/i.test(String(dd.text || ''))) { mark('frame:d1-subtitle-up', { text: String(dd.text).slice(-80) }); break; }
          await sleep(50);
        }
      }
    }
    await sleep(600); mark('frame:d1-done+0.6');       // the 'Door unlocked: Studio' toast lands around here (a canvas toast, not DOM text)
    await sleep(1400); mark('frame:d1-done+2');
    mark('frame:end-of-take');
  } finally { clearInterval(meterPoll); await vw.stop(); }
};
