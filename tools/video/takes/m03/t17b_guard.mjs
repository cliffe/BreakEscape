// t17b_guard (m03 v3): NIGHT (clone_call_done + act2_infiltration, so the torch is lit), executive_wing_hallway. One action sequence: the map shows Terry's torch sweeping the wing with the player at the executive office door (hold 3 s),
// the player starts picking (interact on the door); the take marks whatever minigame state appears BEFORE the catch (lockpick screen? or person-chat straight away) and keeps it on screen;
// the game then opens Terry's one-line person-chat (Narrator torch line, then Terry "Picks. Right. We're done talking." re-voiced); the full voiced line plays (NEVER click during a voiced line);
// the chat closes, then the player runs straight away for about 3 s while Terry chases, hold 1 s while Terry turns hostile and comes for the player (the action payoff).
// Same start as t03_lockpick WITHOUT guard_told_safetynet, so the lockpick_used_in_view mapping fires.
// Entry state: new-game.rb m03_ghost_in_the_machine --start-room executive_wing_hallway --set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration --set guard_waved_on=true
// guard_waved_on=true is the real global Terry sets once he has waved the player on: the scenario's challengeOnSight (player_spotted:terry_mott) skips it, so he does NOT challenge on sight; the lockpick_used_in_view mapping still fires (only skipped for guard_told_safetynet/guard_bribed/guard_attacking) and on_lockpick_detected sets guard_waved_on false itself.
// Record (no BE_SPRITE for dry runs): tools/video/takes/run-take.sh m03 t17b_guard "--start-room executive_wing_hallway --set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration --set guard_waved_on=true" "--hide-hud --zoom-step 1"
// Marks: map-hold, interact-door, minigame-seen:<name> (before the catch), chat-open, line:<text>, line-start:/line-end: (voice), terry-done, chat-closed, hostile-hold-end (terry state + distance), terry-pos:<n> samples.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
const DOOR = 'door:executive_wing_hallway->executive_office';
const terryOf = async (bridge) => (await bridge.getState()).nearby.find(n => /terry/i.test(n.id));
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
  for (let i = 0; i < 6; i++) { const t = await terryOf(bridge); mark('terry-pos:' + i, { terry: t && { x: Math.round(t.x), y: Math.round(t.y), hostile: t.state && t.state.hostile } }); await sleep(500); }
  // The catch is decided ONCE, when picking starts: Terry must have the player in his torch cone at that instant. He sweeps on the spot, so keep the map shot rolling
  // until his cone covers the player (read-only LOS poll), then interact at once. If the lockpick screen opens anyway, mark it and leave it on screen briefly, then retry.
  const losNow = () => page.evaluate((door) => {
    const nm = window.npcManager, pl = window.player; if (!nm || !pl) return false;
    const c = pl.sprite.getCenter ? pl.sprite.getCenter() : { x: pl.x, y: pl.y };
    return !!nm.shouldInterruptLockpickingWithPersonChat([window.currentPlayerRoom, 'executive_wing_hallway'], c, null);
  }, DOOR).catch(() => false);
  let seen = ''; let chat = false; const tAll = Date.now();
  for (let attempt = 0; attempt < 5 && !chat && Date.now() - tAll < 90000; attempt++) {
    let w0 = Date.now(); while (!(await losNow()) && Date.now() - w0 < 40000) await sleep(80);
    mark('los-ready:' + attempt);
    mark('interact-door');
    const r = await bridge.interact(DOOR, { timeoutMs: 20000 });
    mark('interact-result', { r: JSON.stringify(r).slice(0, 200) });
    const t0 = Date.now();
    while (Date.now() - t0 < (attempt === 4 ? 10000 : 3500) && !chat) {
      const am = (await bridge.getState()).activeMinigame;
      const name = am ? (typeof am === 'string' ? am : (am.name || am.type || am.id || JSON.stringify(am).slice(0, 60))) : '';
      if (name !== seen) { seen = name; mark('minigame-seen:' + (name || 'none')); }
      if (/person-?chat/i.test(name)) chat = true; else await sleep(100);
    }
    if (!chat && seen && !/person-?chat/i.test(seen)) { mark('lockpick-screen-no-catch'); for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(400); } seen = ''; }
  }
  if (!chat) throw new Error('no catch: person-chat did not open (Terry not looking?) last=' + seen);
  mark('chat-open');
  let lastSeen = ''; let tLine = Date.now(); const t1 = Date.now(); let done = false;
  while (Date.now() - t1 < 30000 && !done) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(120); continue; }
    if (d.awaitingChoice) throw new Error('a choice menu appeared');
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    if (last !== lastSeen) { lastSeen = last; tLine = Date.now(); mark('line', { text: last.slice(0, 100) }); }
    if (/done talking/i.test(last)) {
      const l = await vw.waitForLine(/done talking/i, 15000);
      if (!l) throw new Error('Terry line never voiced');
      mark('terry-done', { durMs: l.durMs }); done = true; break;
    }
    // both lines are voiced now (Narrator torch line, then Terry): the game advances on the audio, so NO click (a click skips the voice); fallback only after 14 s of the same line
    if (d.canContinue && Date.now() - tLine > 14000) { await bridge.minigame.continue_().catch(() => {}); tLine = Date.now(); }
    await sleep(120);
  }
  if (!done) throw new Error('Terry line not reached; last=' + lastSeen);
  await sleep(1200);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(400); }
  mark('chat-closed');
  // THE CHASE: Terry is hostile and adjacent (chaseSpeed 100 < the player's 145 px/s). The player runs straight away, key-driven, about 3 s, then a 1 s hold.
  const dir = process.env.CHASE_DIR || 'right'; const ps = [];
  const sample = async (tag) => { const st = await bridge.getState(); const t = st.nearby.find(n => /terry/i.test(n.id)); mark('chase:' + tag, { player: st.player, terry: t && { x: Math.round(t.x), y: Math.round(t.y), hostile: t.state && t.state.hostile, d: Math.round(t.distance) }, hp: st.player.hp }); };
  await sample('start');
  const wk = bridge.walk(dir, Number(process.env.CHASE_MS || 3000));
  for (let i = 0; i < 6; i++) { await sleep(500); await sample('run' + i); }
  await wk.catch(() => {});
  await sleep(1000); await sample('hold-end');
  await vw.stop();
  const t = await terryOf(bridge);
  mark('hostile-hold-end', { terry: t && { hostile: t.state && t.state.hostile, d: Math.round(t.distance) } });
};
