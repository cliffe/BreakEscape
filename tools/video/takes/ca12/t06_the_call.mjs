// t06_the_call: the attacker's pretext call to Delphine (beat 5). Records D3 ("Morning. Can I help you?"), the sample-box
// opener, the buzz-me-through ask and D1, with the influence meter moving and the "Door unlocked: Studio" toast.
// Entry state: fresh game, `run-take.sh ca12_visitor_tailgater t06_the_call "" "--hide-hud --zoom-step 1"`. setup() (off camera, ~20 s)
// does Resume, Skip tutorial, closes the Brief, kiosk Start, Open the browser, Friendface, Catherine Merrin, Pin, close, Prepare the
// call, Recipient, Approach (which teleports to the lobby and opens the call: no walk, no courier sprite).
// Spoiler rules: no tells panel, no tell sentences, no outcome label. The two explanation lines under the Influence meter spell out
// the technique (ol.pretext-tells). A crop above them would also lose the NPC's subtitle (it sits below them), so setup() hides
// the list with injected CSS (visibility:hidden keeps the layout); the mark 'tells-hidden' records the rectangle, and the editor
// may still crop above y=<rect.y> for the meter-only framing. Does not press Done and does not end the call.
// Marks: frame:npc-portrait-up (first frame where Delphine's name and portrait are up; in the call the player's portrait never
// shows), line-start/line-end from the voice watcher (D3, D2, D1), choose:N, meter:<value> on every change, toast-door.
import { sleep, toCall, pressButton } from './_ca12b.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await toCall(page, bridge, () => {}, { stopBeforeApproach: true }); await sleep(300);
  await page.addStyleTag({ content: '.pretext-tells{visibility:hidden !important}' });
}

const STEPS = [/sample box for Catherine/, /buzz me through/];
const state = async (bridge) => (await bridge.getState());

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await pressButton(page, /Approach/);   // D3 starts as the call opens: press it here so the voice watcher hears it (it played in setup, unheard, when setup pressed it)
  mark('call-open');
  const meter = async () => page.evaluate(() => window.MinigameFramework?.currentMinigame?.getTestState?.().se?.bar?.value).catch(() => undefined);
  let last;
  const meterPoll = setInterval(async () => { const v = await meter(); if (v !== undefined && v !== last) { last = v; mark('meter:' + v); } }, 200);
  await sleep(100);
  let t0 = Date.now(), up = false;
  while (Date.now() - t0 < 10000 && !up) { const d = (await state(bridge)).dialogue; if (d && d.speaker && /Delphine/i.test(d.speaker)) { up = true; mark('frame:npc-portrait-up', { speaker: d.speaker }); } else await sleep(100); }
  if (!up) throw new Error('Delphine portrait never up');
  try {
    const lines = [/Can I help you/, /For Catherine/, /buzz you through/];
    for (let k = 0; k < 3; k++) {
      if (!(await vw.waitForLine(lines[k], 25000))) throw new Error('line never voiced: ' + lines[k]);
      if (k === 2) break;
      t0 = Date.now(); let d;
      while (Date.now() - t0 < 15000) { d = (await state(bridge)).dialogue; if (d && d.awaitingChoice && d.choices && d.choices.length) break; await sleep(150); }
      await sleep(1100);                                   // the choices must read on screen
      mark('choose:' + (k + 1));
      await bridge.minigame.choose(STEPS[k]);
      if (k === 0) { await sleep(500); mark('tells-hidden', await page.evaluate(() => { const e = document.querySelector('.pretext-tells'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })); }
    }
    await sleep(600); mark('frame:d1-done+0.6');       // the 'Door unlocked: Studio' toast lands around here (a canvas toast, not DOM text)
    await sleep(1400); mark('frame:d1-done+2');
    mark('frame:end-of-take');
  } finally { clearInterval(meterPoll); await vw.stop(); }
};
