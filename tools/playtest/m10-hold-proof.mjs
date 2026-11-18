// m10 engine-fight-hold live proof (keyless server, headless, fixed steps ON, 20 fps).
//   M10_PORT=3176 node tools/playtest/m10-hold-proof.mjs <gameId> <outDir> [A|B|C]
// A: guard hostile and chasing in the tunnel, breach_open fires: no ring while he chases; ring once after the fight.
// B: as A, then the player walks east into the security office with the guard behind.
// N: control, no fight at all: shows whether an un-fought breach call rings or connects direct.
// D: as A, the guard is ended by a KO (debugKO) instead of standing down.
// C: as A, then the player is KO'd, Respawn is clicked: the call still comes, once.
import { start } from './m10-ol-lib.mjs';
const [gid, out, which = 'A'] = process.argv.slice(2);
const g = await start(gid, { reload: true });
g.page.on('console', (m) => { const x = m.text(); if (/ring offer|📵|held|game_loaded|breach_call|missed|Restored/i.test(x)) console.log('  [console]', x.slice(0, 220)); });
// Resume overlay, then the title card and any popup, as the harness's bootstrap does (resume:"resume").
const boot = async () => {
  for (let i = 0; i < 12; i++) {
    const bl = await g.ev(() => { try { const st = window.__test.getState(); const b = st.blockingUi; return { b: b && b.blocking ? { id: b.id, text: b.text } : null, mg: st.activeMinigame && st.activeMinigame.type }; } catch (e) { return {}; } });
    if (!bl.b && !bl.mg) break;
    if (bl.b && /RESUME SESSION/i.test(bl.b.text || '')) await g.ev(() => window.__test.dismissBlockingUi('Resume')).catch(() => {});
    else if (bl.b) await g.ev(() => window.__test.dismissBlockingUi()).catch(() => {});
    else await g.ev(() => window.__test.minigame && window.__test.minigame.close && window.__test.minigame.close()).catch(() => {});
    await g.t(1200);
  }
  await g.page.waitForFunction(() => window.gameScenario && window.player && window.player.body, null, { timeout: 60000 }).catch(() => {});
  await g.ev(() => window.__test.throttleFps(20));
};
const sh = (n) => g.shot(`${out}/${which}-${n}.png`);
const R = () => g.ev(() => {
  const r = window.phoneRinger, c = r && r.current();
  return { combat: !!window.playerInCombat?.(), cur: c && { knot: c.knot, state: c.state }, q: r && r.queueLength(),
    mg: window.MinigameFramework?.currentMinigame?.constructor?.name || null, room: window.currentPlayerRoom,
    guard: (() => { try { const b = window.npcBehaviorManager.getBehavior('tunnel_guard'); return { st: b.currentState, room: b.roomId, hostile: window.npcHostileSystem.isNPCHostile('tunnel_guard') }; } catch (e) { return String(e); } })(),
    hp: window.playerHealth?.getHP?.() ?? window.playerHealth?.hp ?? null,
    done: window.gameState.globalVariables.breach_call_done, open: window.gameState.globalVariables.breach_open };
});
// Verdict bookkeeping: a call must never be current while a hostile chaser is on the player (M1), and a
// call that was current while the fight was on counts as a start that was pulled back.
const viol = [];
let seenRoom = new Set();
const log = async (tag) => {
  const r = await R();
  console.log(tag, JSON.stringify(r));
  if (r.guard && r.guard.hostile && r.guard.st === 'chase') {
    seenRoom.add(r.room);
    if (r.cur) viol.push(`${tag}: call ${r.cur.knot} ${r.cur.state} while the guard chases (player in ${r.room})`);
  }
};
// A person chat (the guard's) in the way: close only that, never a phone call.
const closeChat = () => g.ev(() => { const m = window.MinigameFramework?.currentMinigame; if (m && m.constructor.name === 'PersonChatMinigame') window.__test.minigame.close(); });
await boot();
await g.t(2500);
await log('start');
await g.ev(() => window.__test.minigame && window.__test.minigame.close && window.__test.minigame.close()).catch(() => {});
await g.t(1500);
await log('chat closed');
if (which !== 'N') await g.ev(() => window.npcHostileSystem.setNPCHostile('tunnel_guard', true));   // N: control, no fight
await closeChat();
await g.t(2500);
await log('guard hostile');
// Precondition: the guard must be chasing before breach_open fires, or the run proves nothing.
if (which !== 'N' && (await R()).guard?.st !== 'chase') {
  console.log(`VERDICT ${which}: INVALID SETUP (the guard is not chasing: ${JSON.stringify((await R()).guard)}); use a fresh game`);
  await g.close(); process.exit(2);
}
await g.ev(() => { const v = window.gameState.globalVariables; v.breach_open = true; window.eventDispatcher.emit('global_variable_changed:breach_open', { name: 'breach_open', value: true }); });
for (let i = 0; i < 5; i++) { await g.t(2000); await closeChat(); await log(`t+${(i + 1) * 2}s`); }
await sh('1-during-chase');
const evs = await g.evs('phone|breach|conversation');
console.log('events while chasing', JSON.stringify(evs.slice(-8)));
if (which === 'B') {
  await closeChat();
  g.ev(() => window.__test.enterRoom('security_office')).then((r) => console.log('enterRoom', JSON.stringify(r).slice(0, 200))).catch((e) => console.log('enterRoom err', String(e).slice(0, 120)));
  for (let i = 0; i < 10; i++) { await g.t(1500); await closeChat(); await g.ev(() => window.playerHealth.heal(30)); await log(`office t${i}`); if (i === 4) await sh('2-office'); }
  console.log('events', JSON.stringify((await g.evs('room_entered|phone|breach')).slice(-6)));
}
if (which === 'C') {
  await g.ev(() => window.playerHealth.damage(1000000, 'guard'));
  await g.t(2500);
  await sh('2-ko');
  await g.ev(() => document.getElementById('game-over-respawn-btn') && document.getElementById('game-over-respawn-btn').click());
  await g.page.waitForNavigation({ timeout: 30000 }).catch(() => {});
  await g.page.waitForFunction(() => window.gameScenario && window.__test && window.player && window.player.body, null, { timeout: 90000 });
  // Observe the reload without closing anything for the first seconds: the title card, the Mission Brief
  // notes and the guard's person chat are the blockers (m2). Each is closed by name only after it has been
  // seen for 4 s, and the held call must not start or overlap any of them (it waits, then rings or connects).
  await g.ev(() => window.__test.throttleFps(20));
  // C_GUARD=1: the guard's own person chat is also pending at the load (spotted on the start tile), as in the
  // first gate runs. Its mapping is fired by the event, as a hostile guard sighting does.
  if (process.env.C_GUARD) await g.ev(() => { window.eventDispatcher.emit('player_spotted:tunnel_guard', { npcId: 'tunnel_guard' }); });
  const OBS = () => g.ev(() => { const st = window.__test.getState(); const r = window.phoneRinger, c = r && r.current();
    return { mg: window.MinigameFramework?.currentMinigame?.constructor?.name || null, mgKnot: window.MinigameFramework?.currentMinigame?.params?.startKnot || null,
      blocking: st.blockingUi && st.blockingUi.blocking ? (st.blockingUi.id || st.blockingUi.text || 'ui') : null,
      cur: c && { knot: c.knot, state: c.state }, q: r && r.queueLength(), done: window.gameState.globalVariables.breach_call_done, hp: window.playerHealth?.getHP?.() ?? null }; });
  const seenSince = {}; const timeline = []; let last = '';
  const t0 = Date.now(); let reached = null;
  for (let i = 0; i < 100 && !reached; i++) {
    const o = await OBS();
    const callUp = (o.cur && (o.cur.state === 'ringing' || o.cur.state === 'connected')) || (o.mg === 'PhoneChatMinigame' && o.mgKnot === 'breach_call');
    const blocker = o.blocking ? `ui:${o.blocking}` : (o.mg && !(o.mg === 'PhoneChatMinigame' && o.mgKnot === 'breach_call') ? o.mg : null);
    const key = JSON.stringify([blocker, o.cur, callUp, o.q]);
    if (key !== last) { timeline.push(`${((Date.now() - t0) / 1000).toFixed(1)}s blocker=${blocker} cur=${JSON.stringify(o.cur)} call=${callUp} q=${o.q} done=${o.done}`); last = key; }
    if (callUp && blocker) viol.push(`overlap: the call is up (${o.cur ? o.cur.state : 'connected direct'}) while ${blocker} is open`);
    if (callUp) { reached = (o.cur && o.cur.state) || 'connected-direct'; await sh('3-call-up'); break; }
    if (blocker) {
      seenSince[blocker] = seenSince[blocker] || Date.now();
      if (Date.now() - seenSince[blocker] > 4000) {
        if (i % 4 === 0) await sh(`3a-blocked-${blocker.replace(/\W+/g, '_')}`);
        await g.ev(() => { const st = window.__test.getState(); if (st.blockingUi && st.blockingUi.blocking) window.__test.dismissBlockingUi(); else window.__test.minigame.close(); }).catch(() => {});
        console.log('  closed blocker', blocker);
        delete seenSince[blocker];
      }
    }
    await g.t(500);
  }
  console.log('RESPAWN TIMELINE\n  ' + timeline.join('\n  '));
  console.log('call reached:', reached);
  if (!reached) viol.push('the held call never came up after the reload');
  else if (reached !== 'ringing') console.log('NOTE: the call connected direct (no ring) — see convention note');
  await g.t(3000);
  await sh('4-after-fight');
  console.log(`VERDICT ${which}: ${viol.length ? 'FAIL' : 'PASS'}`, JSON.stringify(viol));
  console.log('errs', JSON.stringify(g.errs.slice(0, 5)));
  await g.close();
  process.exit(viol.length ? 1 : 0);
}
// End the fight (D: the guard is knocked out through the documented shortcut)
if (which === 'D') await g.ev(() => window.__test.debugKO('tunnel_guard'));
else await g.ev(() => { const h = window.npcHostileSystem; (h.damageNPC ? h.damageNPC('tunnel_guard', 99999) : h.setNPCHostile('tunnel_guard', false)); });
if (which !== 'D') await g.ev(() => window.npcHostileSystem.setNPCHostile('tunnel_guard', false));
for (let i = 0; i < 8; i++) { await g.t(1500); await log(`after fight t+${(i + 1) * 1.5}s`); if ((await R()).cur) break; }
await g.t(2500);
await sh('4-after-fight');
console.log('ring offers/evs', JSON.stringify((await g.ev(() => (window.__ev || []).filter(e => /phone_call|breach/.test(e.ev)))).slice(-10)));
await g.t(8000);
await log('settled');
const final = await R();
const rang = !!final.cur || ((await g.ev(() => (window.__ev || []).filter(e => /phone_call_(answered|started)/.test(e.ev)).length)) > 0);
if (which === 'B' && !seenRoom.has('security_office')) viol.push(`the player never stood in security_office while the guard chased (rooms seen: ${[...seenRoom].join(',')})`);
if (!final.cur) viol.push('no call current after the fight (it should ring once, about 3 s after)');
console.log(`VERDICT ${which}: ${viol.length ? 'FAIL' : 'PASS'}`, JSON.stringify(viol));
console.log('errs', JSON.stringify(g.errs.slice(0, 5)));
await g.close();
