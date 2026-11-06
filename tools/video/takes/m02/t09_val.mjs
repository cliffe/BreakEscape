// t09_val (m02): the player walks along office_corridor toward Val Okonkwo and she stops them. Targets (scout, m02_npc_security_guard.ink first_encounter):
//   val_2 "Alright. Stop there a sec."  (2.09 s)     val_1 "So. Who are you and who says you're allowed?"  (4.18 s)
// No choice is ever picked (the fight / standoff branches are not touched): the take ends on the choice menu being shown, so cut before it.
// Entry state: head-start in office_corridor (Val patrols x 96..240 and dwells 4 s at each end): new-game.rb m02_ransomed_trust --start-room office_corridor --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t09_val "--start-room office_corridor --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup(): move the player to the west end of the corridor (Val comes from the east). Take: 1 s hold, arrow-key walk east until Val is in interaction range (read live), then interact (no approach click).
// Marks: walk-start, walk-end, interact-val, conversation-open, line-start:/line-end:, val_2-done, val_1-done, targets-done.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
const SPEED = 145;   // px/s measured in m02 corridors/server_room (105 undershoots)
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveTo(48, 117, { timeoutMs: 20000 });
  await sleep(800);
  console.error('SETUP', JSON.stringify((await bridge.getState()).player));
}
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(1000);
  const val = async () => (await bridge.getState()).nearby.find(n => n.id === 'security_guard_patrol');
  mark('walk-start', { val: await val(), player: (await bridge.getState()).player });
  // one long continuous leg towards Val's current position (minus a margin), then short pulses until she is in range
  { const v = await val(); const p = (await bridge.getState()).player;
    const ms = Math.max(0, Math.round((v.x - 70 - p.x) / SPEED * 1000)); mark('leg:right', { ms }); if (ms > 60) await bridge.walk('right', ms); }
  for (let i = 0; i < 40; i++) {
    const v = await val(); const p = (await bridge.getState()).player;
    if (v && (v.inRange || v.x - p.x <= 20)) break;
    await bridge.walk('right', 120);
  }
  mark('walk-end', { val: await val(), player: (await bridge.getState()).player });
  await sleep(250);
  mark('interact-val');
  const r = await bridge.interact('security_guard_patrol', { approach: false, timeoutMs: 15000 });
  mark('interact-result', { ok: r && r.ok, reason: r && r.reason });
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 });
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('conversation-open');
  await runDialogue(page, bridge, mark, vw, {
    steps: [],
    targets: [{ name: 'val_2', re: /Alright\. Stop there a sec/i }, { name: 'val_1', re: /So\. Who are you and who says you're allowed/i }],
    lingerMs: 600,
  });
  mark('choices-visible-after-here');
  await sleep(200);
};
