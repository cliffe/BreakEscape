// t17_guard (m03): the caught-picking beat. The player starts picking the executive office door in Terry's view; the game opens a one-line
// person-chat (Narrator torch line, then Terry "Picks. Right. We're done talking.", 3.29 s) and Terry turns hostile. Same start as t03_lockpick
// WITHOUT guard_told_safetynet, so the lockpick_used_in_view mapping fires. Never clicks during a voiced line (a click skips the voice).
// Entry state: new-game.rb m03_ghost_in_the_machine --start-room executive_wing_hallway --set briefing_played=true
// Record: BE_SPRITE=vivian_ashby tools/video/takes/run-take.sh m03 t17_guard "--start-room executive_wing_hallway --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: map-hold, interact-door, chat-open, line:<text>, line-start:/line-end: (voice), terry-done, chat-closed, hostile-hold-end.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
const DOOR = 'door:executive_wing_hallway->executive_office';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear(DOOR, { timeoutMs: 20000 }).catch(e => console.error('moveToNear', String(e).slice(0, 200)));
  await sleep(800);
  const s = await bridge.getState();
  console.error('SETUP', JSON.stringify({ p: s.player, terry: s.nearby.filter(n => /terry/i.test(n.id)) }));
}
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  mark('map-hold');
  await sleep(1500);
  mark('interact-door');
  const r = await bridge.interact(DOOR, { timeoutMs: 20000 });
  mark('interact-result', { r: JSON.stringify(r).slice(0, 200) });
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 8000 });
  if (!w || w.ok === false) throw new Error('no catch: person-chat did not open (Terry not looking?) ' + JSON.stringify((await bridge.getState()).activeMinigame).slice(0, 200));
  mark('chat-open');
  let lastSeen = ''; const t0 = Date.now(); let done = false;
  while (Date.now() - t0 < 30000 && !done) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(120); continue; }
    if (d.awaitingChoice) throw new Error('a choice menu appeared');
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    if (last !== lastSeen) { lastSeen = last; mark('line', { text: last.slice(0, 100) }); }
    if (/done talking/i.test(last)) {
      const l = await vw.waitForLine(/done talking/i, 15000);
      if (!l) throw new Error('Terry line never voiced');
      mark('terry-done', { durMs: l.durMs }); done = true; break;
    }
    // the narrator torch line is unvoiced: advance it after a reading pause
    if (d.canContinue && /^Narrator|torch beam/i.test(last)) { await sleep(2200); await bridge.minigame.continue_().catch(() => {}); }
    await sleep(120);
  }
  if (!done) throw new Error('Terry line not reached; last=' + lastSeen);
  await sleep(1200);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(400); }
  mark('chat-closed');
  await sleep(2500);
  await vw.stop();
  const t = (await bridge.getState()).nearby.find(n => /terry/i.test(n.id));
  mark('hostile-hold-end', { terry: t && { hostile: t.state && t.state.hostile, d: Math.round(t.distance) } });
};
