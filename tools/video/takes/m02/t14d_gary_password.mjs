// t14d_gary_password (m02): the password screen of gary_workstation (it_department), three wrong letters typed (d, e, r), never submitted. The screen shows a post-it (login hints): the edit CROPS or pixelates it.
// Gary's one-off cabinet catch is irrelevant here (no picking). Gary stands in the room; no dialogue is opened.
// Entry state: head-start in it_department: new-game.rb m02_ransomed_trust --start-room it_department --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t14d_gary_password "--start-room it_department --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: interact, password-open, typed (the 3 letters on screen), hold-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear('gary_workstation', { timeoutMs: 20000 });
  await sleep(800);
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('interact');
  const r = await bridge.interact('gary_workstation', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('password', { timeoutMs: 8000 });
  mark('password-open');
  await sleep(1400);
  for (const ch of ['d', 'e', 'r']) {
    const t = await bridge.minigame.type(0, ch, { submit: false, clear: false });
    if (t && t.ok === false) mark('type-fail', t);
    await sleep(350);
  }
  mark('typed');
  await sleep(1600);
  mark('hold-end');
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
