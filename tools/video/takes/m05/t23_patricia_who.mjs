// t23_patricia_who (m05): DAY. Patricia, second visit: first chat [Skip the pleasantries...] > [Where should I start?] (closes the chat), reopen, hub [I think I know who it is.] > share_findings, target "Go on, then. Who?". STOPS before share_findings_who's menu (any pick commits the naming: never pick).
// Record: MISSION=m05 run.sh <avatar> t23_patricia_who "--imports=none --start-room patricia_office --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: first-chat-done, second-interact, hub-shown, choice:..., who-line-start/end, menu-visible (time the menu appears), targets-done.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
const ID = 'patricia_morgan';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const n = await page.evaluate((id) => { const x = window.npcManager.getNPC(id); return { x: x._sprite.x, y: x._sprite.y }; }, ID);
  await bridge.moveTo(n.x + 30, n.y + 45, { timeoutMs: 20000 });
  await sleep(800);
}
async function open(bridge, mark) {
  let r = await bridge.interact(ID, { timeoutMs: 15000 });
  let w = await bridge.waitForMinigame('person-chat', { timeoutMs: 2500 });
  if (!w || w.ok === false) { r = await bridge.interact(ID, { timeoutMs: 15000 }); w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 }); }
  if (!w || w.ok === false) throw new Error('chat did not open');
}
async function pick(bridge, re, mark, ms = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const d = (await bridge.getState()).dialogue;
    if (d && d.awaitingChoice && d.choices.some(c => re.test(c.text))) { await sleep(500); const ch = await bridge.minigame.choose(re); if (!ch || !ch.ok) throw new Error('choose failed ' + re); mark('choice:' + ch.chose); return; }
    await sleep(150);
  }
  throw new Error('menu with ' + re + ' never showed');
}
export default async (page, bridge, mark) => {
  await sleep(800);
  await open(bridge, mark);
  mark('conversation-open');
  await pick(bridge, /Skip the pleasantries/i, mark);
  await pick(bridge, /Where should I start/i, mark, 60000);
  for (let i = 0; i < 60 && (await bridge.getState()).activeMinigame; i++) await sleep(250);
  mark('first-chat-done');
  await sleep(1200);
  mark('second-interact');
  await open(bridge, mark);
  mark('conversation-open-2');
  await pick(bridge, /I think I know who it is/i, mark, 30000);
  const vw = await watchVoice(page, mark);
  const l = await vw.waitForLine(/Go on, then\. Who/i, 20000);
  mark('who-line', { durMs: l && l.durMs });
  const t0 = Date.now();
  while (Date.now() - t0 < 4000) { const d = (await bridge.getState()).dialogue; if (d && d.awaitingChoice) { mark('menu-visible'); break; } await sleep(60); }
  await vw.stop();
  mark('targets-done');
  // The take ends here: no name is ever picked. Close the chat without choosing.
  await sleep(300);
};
