// t03_revelation_call (m03): flag-4 payoff on the phone. Agent HaX on the distcc transaction log the drop-site printed:
// invoice ZDS-2024-0847, the ProFTPD backdoor sold to Ghost, the "Target Selection Consultation", Sable's sign-off.
// The player opens the phone, picks Agent HaX, asks "You wanted to talk about the distcc logs.", reads the call, answers
// "They charged extra to hit a hospital. That's intent, on an invoice." and "We take the whole network down", and holds
// on HaX's sign-off. A text phone chat (the hub topic is not a voiced call in m03, and HaX has no m03 audio): no voice.
// Replayable only until it is heard: the end of the call sets revelation_heard, which retires the hub topic. Game 82
// still had it at the time of recording. It does not finish the mission (it queues HaX's "Sterling's your last move" text).
// Entry state: LIVE game 82 (playtest03, m03, set 921, all flags in, revelation_heard false); no new game.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/82 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m03 t03_revelation_call "" ""      (no --hide-hud: the phone opens from the inventory tray)
// Marks: phone-open, contact-picked, choices-shown, choice:<text>, reply-settled, linger-end.
import { sleep, clearScreen, awaitChoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const g = await page.evaluate(() => { const v = (window.gameState && window.gameState.globalVariables) || {}; return { distcc: v.flag_distcc_submitted, heard: v.revelation_heard }; });
  console.error('GLOBALS', JSON.stringify(g));
  if (g.distcc !== true || g.heard === true) throw new Error('the revelation topic is not on offer: ' + JSON.stringify(g));
  await sleep(500);
}

export default async (page, bridge, mark) => {
  await sleep(1200);
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open');
  await sleep(1700);
  const c = await bridge.minigame.clickText('Agent HaX');
  mark('contact-picked', { ok: c && c.ok });
  for (const re of [/^You wanted to talk about the distcc logs/i, /^They charged extra to hit a hospital/i, /^We take the whole network down/i]) {
    const d = await awaitChoice(bridge, 60000);
    if (!d) throw new Error('no choices for ' + re);
    mark('choices-shown', { choices: d.choices.map(x => x.text) });
    await sleep(2000);
    const ch = await bridge.minigame.choose(re);
    if (!ch || !ch.ok) throw new Error('choose failed ' + re + ' ' + JSON.stringify(ch).slice(0, 300));
    mark('choice:' + ch.chose, { number: ch.number });
  }
  const d2 = await awaitChoice(bridge, 60000);
  mark('reply-settled', { choices: d2 && d2.choices.map(x => x.text) });
  await sleep(3500);
  mark('linger-end');
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed', { heard: await page.evaluate(() => window.gameState && window.gameState.globalVariables && window.gameState.globalVariables.revelation_heard) });
  await sleep(800);
};
