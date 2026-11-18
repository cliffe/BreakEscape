// m10 engine-fight-hold live proof (keyless server, headless, fixed steps ON, 20 fps).
//   M10_PORT=3176 node tools/playtest/m10-hold-proof.mjs <gameId> <outDir> [A|B|C]
// A: guard hostile and chasing in the tunnel, breach_open fires: no ring while he chases; ring once after the fight.
// B: as A, then the player walks east into the security office with the guard behind.
// N: control, no fight at all: shows whether an un-fought breach call rings or connects direct.
// D: as A, the guard is ended by a KO (debugKO) instead of standing down.
// K: kite. As A, but the guard is slowed so it cannot land a hit; the chase runs 30 s in the player's room with no hit:
//    the combat hold must stay on the whole time, the call must never ring, and rings once after the fight.
// C: as A, then the player is KO'd, Respawn is clicked: the call still comes, once.
import { start } from './m10-ol-lib.mjs';
const [gid, out, which = 'A'] = process.argv.slice(2);
const g = await start(gid, { reload: true });
g.page.on('console', (m) => { const x = m.text(); if (/dropped: the player is in combat/.test(x)) g.page.evaluate(() => { window.__proofLog = (window.__proofLog || '') + 'dropped: the player is in combat;'; }).catch(() => {}); if (/ring offer|📵|held|game_loaded|breach_call|missed|Restored/i.test(x)) console.log('  [console]', x.slice(0, 220)); });
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
await g.ev(() => window.__test.minigame && window.__test.minigame.close && window.__test.minigame.close()).catch(() => {});
if ((await R()).room !== 'blast_tunnel') {
  // A fresh game starts in forward_post with the blast door locked behind the gate terminal's flag: submit the game's
  // flags there (tools/playtest/m10_full_disclosure-flags-game<id>.xml, written by new-game.rb), then walk through.
  const { readFileSync } = await import('node:fs');
  const flags = [...readFileSync(new URL(`./m10_full_disclosure-flags-game${gid}.xml`, import.meta.url), 'utf8').matchAll(/<flag>([^<]+)<\/flag>/g)].map((m) => m[1]);
  await g.ev(() => window.__test.minigame.close && window.__test.minigame.close()).catch(() => {});
  await g.ev(() => { try { window.MinigameFramework.forceCloseMinigame(); } catch (e) { /* none open */ } });
  await g.ev(() => window.__test.interact('gate_terminal')).catch(() => {});
  await g.page.waitForSelector('#flag-input', { timeout: 15000 }).catch(() => console.log('no flag station'));
  for (const f of flags) {
    await g.page.fill('#flag-input', f).catch(() => {}); await g.page.click('#flag-submit-btn').catch(() => {}); await g.t(1500);
    console.log('flag', f, '->', (await g.ev(() => (document.querySelector('#flag-result')?.textContent || '').replace(/\s+/g, ' ').slice(0, 120)).catch(() => '?')));
  }
  await g.ev(() => { try { window.MinigameFramework.forceCloseMinigame(); } catch (e) { /* none open */ } });
  await g.t(1000);
  await g.page.reload({ waitUntil: 'domcontentloaded' });   // the server holds the flag; the page picks it up on a reload
  await boot();
  // The breach also needs the door scene and the pair back (story beats, played by hand in a real run): set them in the page silently (no event, or the
  // unlock mapping fires breach_open and the call rings before the guard is hostile); the script sets breach_open below. Nothing is written to the game row.
  await g.ev(() => { const v = window.gameState.globalVariables; for (const n of ['door_scene_done', 'pair_back', 'aside_done', 'split_started']) { v[n] = true; } });
  await g.ev(() => { window.__ev = window.__ev || []; });   // the lib's event log hook was lost with the reload
  await g.t(4000);
  for (let k = 0; k < 6 && (await R()).room !== 'blast_tunnel'; k++) {
    await boot();   // resume overlay, title card, popups
    await g.ev(() => { try { window.MinigameFramework.forceCloseMinigame(); } catch (e) { /* none open */ } });
    await g.t(800);
    g.ev(() => window.__test.enterRoom('blast_tunnel')).then((r) => console.log('enterRoom', JSON.stringify(r).slice(0, 140))).catch(() => {});   // resolves late: not awaited, as in mode B
    for (let w = 0; w < 25 && (await R()).room !== 'blast_tunnel'; w++) await g.t(1500);
  }
}
// Walking in unlocks the door, which sets breach_open and lets the call connect before the guard is hostile. Undo that in the
// page only (no row is edited): close the call, clear the breach globals and the fired-handler count, so the script's own
// breach_open below is the first one the player sees. A run that starts clean skips this.
if ((await R()).open) {
  await g.t(4000);   // the unlock's call is offered 1.5 s after breach_open: let it show itself before undoing it
  await g.ev(() => { try { window.MinigameFramework.forceCloseMinigame(); } catch (e) { /* none open */ } });
  await g.ev(() => {
    const v = window.gameState.globalVariables; for (const n of ['breach_open', 'breach_call_done', 'breach_announced', 'inner_door_open']) v[n] = false;
    for (const k of [...window.npcManager.triggeredEvents.keys()]) if (/global_variable_changed:(breach_open|inner_door_open)/.test(k)) window.npcManager.triggeredEvents.delete(k);
  });
  console.log('breach state reset in the page', JSON.stringify(await R()));
}
await g.t(2500);
await log('start');
await g.ev(() => window.__test.minigame && window.__test.minigame.close && window.__test.minigame.close()).catch(() => {});
await g.t(1500);
await log('chat closed');
if (which !== 'N') await g.ev(() => window.npcHostileSystem.setNPCHostile('tunnel_guard', true));   // N: control, no fight
await closeChat();
// The guard may take a few seconds to start the chase (a chat or the title card in the way): wait for it, up to 10 s.
for (let w = 0; w < 10 && which !== 'N' && (await R()).guard?.st !== 'chase'; w++) { await g.t(1000); await closeChat(); }
await g.t(1500);
await log('guard hostile');
// Precondition: the guard must be chasing before breach_open fires, or the run proves nothing.
if (which !== 'N' && (await R()).guard?.st !== 'chase') {
  console.log(`VERDICT ${which}: INVALID SETUP (the guard is not chasing: ${JSON.stringify((await R()).guard)}); use a fresh game`);
  await g.close(); process.exit(2);
}
// A leftover phone chat from the unlock's own call (it opens late) would block every ring: close it, and say so.
if ((await R()).mg === 'PhoneChatMinigame') { console.log('closing a leftover phone chat before breach_open'); await g.ev(() => { try { window.MinigameFramework.forceCloseMinigame(); } catch (e) { /* none */ } }); await g.t(500); }
await g.ev(() => { const v = window.gameState.globalVariables; v.breach_open = true; window.eventDispatcher.emit('global_variable_changed:breach_open', { name: 'breach_open', value: true }); });
for (let i = 0; i < 5; i++) { await g.t(2000); await closeChat(); await log(`t+${(i + 1) * 2}s`); }
await sh('1-during-chase');
const evs = await g.evs('phone|breach|conversation');
console.log('events while chasing', JSON.stringify(evs.slice(-8)));
if (which === 'K') {
  await g.ev(() => { const b = window.npcBehaviorManager.getBehavior('tunnel_guard'); window.__kiteSpeed = b.config.hostile.chaseSpeed; b.config.hostile.chaseSpeed = 5; });
  // Page only: top HP up (the 10 s chase has cost 60) and put 90 px between the two (a bigger jump leaves the room and the guard stops chasing), so the slowed guard has to cross a gap to reach him.
  await g.ev(() => { window.playerHealth.heal(100); const gb = window.npcBehaviorManager.getBehavior('tunnel_guard').sprite, p = window.player; const dx = p.x - gb.x, dy = p.y - gb.y, d = Math.hypot(dx, dy) || 1; p.setPosition(p.x + dx / d * 90, p.y + dy / d * 90); });
  await g.t(500);
  const hp0 = (await R()).hp;
  console.log('kite start', JSON.stringify(await R()));
  let bad = 0;
  for (let i = 0; i < 28; i++) {
    await g.t(1000); await closeChat();
    // Keep the player moving away so the slowed guard never closes the 40 px swing range
    await g.ev(() => { const gb = window.npcBehaviorManager.getBehavior('tunnel_guard').sprite, p = window.player; const dx = p.x - gb.x, dy = p.y - gb.y, d = Math.hypot(dx, dy) || 1; if (d < 70) p.setPosition(p.x + dx / d * 20, p.y + dy / d * 20); });
    const r = await R(); if (i % 4 === 3) console.log(`kite t+${i + 1}s`, JSON.stringify(r));
    if (r.guard && r.guard.st === 'chase' && !r.combat) { bad++; viol.push(`kite t+${i + 1}s: guard chases but playerInCombat is false`); }
    if (r.cur) viol.push(`kite t+${i + 1}s: a call is current mid-chase`);
    if (r.hp < hp0) { viol.push(`INVALID: the guard hit the player at t+${i + 1}s (hp ${hp0} -> ${r.hp})`); break; }
  }
  await sh('2-kite-30s');
  console.log('kite combat-false samples while chasing:', bad);
}
if (which === 'B') {
  await closeChat();
  await g.ev(() => window.playerHealth.heal(100));   // page only: a KO on the way ends the run, and the walk to the office takes longer than the chase so far
  g.ev(() => window.__test.enterRoom('security_office')).then((r) => console.log('enterRoom', JSON.stringify(r).slice(0, 200))).catch((e) => console.log('enterRoom err', String(e).slice(0, 120)));
  for (let i = 0; i < 10; i++) { await g.t(1500); await closeChat(); await g.ev(() => { if (window.playerHealth.getHP() < 50) window.playerHealth.heal(100); }); await log(`office t${i}`); if (i === 4) await sh('2-office'); }
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
// S and G: a slowed guard (chaseSpeed 1) 90 px away in the player's room, so he chases but cannot reach.
//   S: while the chase is on, a scripted conversation, the guard's person chat (player_spotted) and a sight challenge must all be held;
//      after the fight the scripted chat opens, the person chat re-fires on a new sighting, the sight challenge fires if the player is still in the cone.
//   G: the 20 s give-up: playerInCombat falls to false after about 20 s with the guard still chasing and the queued breach call rings
//      and then stays up for 12 s (not pulled back, no hit lands).
if (which === 'S' || which === 'G') {
  await g.ev(() => { const b = window.npcBehaviorManager.getBehavior('tunnel_guard'); b.config.hostile.chaseSpeed = 1; });
  // G moves the player 90 px away (he may leave the room: the guard is then the other-room case); S moves the guard instead, so both stay in blast_tunnel
  if (which === 'G') await g.ev(() => { window.playerHealth.heal(100); const gb = window.npcBehaviorManager.getBehavior('tunnel_guard').sprite, p = window.player; const dx = p.x - gb.x, dy = p.y - gb.y, d = Math.hypot(dx, dy) || 1; p.setPosition(p.x + dx / d * 90, p.y + dy / d * 90); });
  else await g.ev(() => { window.playerHealth.heal(100); const gb = window.npcBehaviorManager.getBehavior('tunnel_guard').sprite, p = window.player; const dx = gb.x - p.x, dy = gb.y - p.y, d = Math.hypot(dx, dy) || 1; gb.setPosition(p.x + (dx / d || 1) * 90, p.y + (dy / d) * 90); });
  await g.t(500);
  await closeChat();
  await g.ev(() => { window.__spotted = []; const ed = window.eventDispatcher, o = ed.emit.bind(ed); ed.emit = (ev, d) => { if (/^player_spotted/.test(ev)) window.__spotted.push(ev); return o(ev, d); }; });
  console.log('slowed start', JSON.stringify(await R()));
}
if (which === 'G') {
  const t0 = Date.now(); let fellAt = null, ringAt = null, pulled = false, seenRing = false;
  for (let i = 0; i < 70; i++) {
    await g.t(1000); await closeChat();
    const r = await R(); const sec = Math.round((Date.now() - t0) / 1000);
    if (i % 3 === 0 || (!r.combat && fellAt === null)) console.log(`G t+${sec}s`, JSON.stringify(r));
    if (!r.combat && fellAt === null) { fellAt = sec; await sh('2-gave-up'); }
    if (r.cur && r.cur.state === 'ringing' && ringAt === null) { ringAt = sec; await sh('3-ringing'); }
    if (r.cur && r.cur.state === 'ringing') seenRing = true;
    if (seenRing && !r.cur && r.q > 0) { pulled = true; viol.push(`G t+${sec}s: the ringing call was pulled back to the queue`); }
    if (ringAt !== null && sec - ringAt >= 12) break;
    if (r.hp < 100) { viol.push(`INVALID: the guard hit the player (hp ${r.hp}) at t+${sec}s`); break; }
  }
  console.log(`G gave up at ${fellAt}s, rang at ${ringAt}s, pulled back: ${pulled}`);
  if (fellAt === null || fellAt < 17 || fellAt > 30) viol.push(`the hold fell at ${fellAt}s, expected about 20 s`);
  if (ringAt === null) viol.push('the call never rang after the give-up');
  await sh('4-after-12s');
  console.log(`VERDICT G: ${viol.length ? 'FAIL' : 'PASS'}`, JSON.stringify(viol));
  await g.close(); process.exit(viol.length ? 1 : 0);
}
if (which === 'S') {
  const ST = () => g.ev(() => ({ mg: window.MinigameFramework?.currentMinigame?.constructor?.name || null, q: window.npcManager._scriptedCallQueue.length, combat: !!window.playerInCombat?.(), spotted: window.__spotted.length }));
  await g.ev(() => { window.npcManager._queueScriptedConversation({ npcId: 'tunnel_guard', label: 'proof-scripted', sceneType: 'person-chat', startDelayMs: 0, params: () => ({ npcId: 'tunnel_guard', startKnot: 'tunnel', scenario: window.gameScenario }) }); });
  await g.t(3000);
  const s1 = await ST(); console.log('S scripted chat during chase', JSON.stringify(s1));
  if (s1.mg === 'PersonChatMinigame') viol.push('the scripted chat opened mid-chase');
  if (!s1.combat) viol.push('S: not in combat at the scripted check');
  if (!s1.q) viol.push('the scripted chat is not held in the queue');
  const log0 = await g.ev(() => 0);
  await g.ev(() => { for (const k of [...window.npcManager.triggeredEvents.keys()]) if (/player_spotted:tunnel_guard/.test(k)) window.npcManager.triggeredEvents.delete(k); });   // the guard's own once-only chat, re-armed in the page
  await g.ev(() => { window.eventDispatcher.emit('player_spotted:tunnel_guard', { npcId: 'tunnel_guard' }); });
  await g.t(3000);
  const s2 = await ST(); console.log('S person chat (player_spotted) during chase', JSON.stringify(s2));
  if (s2.mg === 'PersonChatMinigame') viol.push('the person chat opened mid-chase');
  if (!/dropped: the player is in combat/.test(await g.ev(() => window.__proofLog || ''))) console.log('S note: no drop line seen for the person chat');
  await g.ev(() => { const n = window.npcManager.getNPC('tunnel_guard'); n.los = { enabled: true, range: 400, angle: 360, challengeOnSight: { cooldown: 0, rooms: ['blast_tunnel'] } }; });
  const f1 = await g.ev(() => window.sightChallengeWatcher ? null : 'no watcher global');
  const fired1 = await g.ev(async () => { const m = await import('/break_escape/js/systems/npc-sight-challenge.js'); const a = m.sightChallengeWatcher.update(Date.now(), { force: true }); return a; });
  console.log('S sight challenge during chase fired:', JSON.stringify(fired1), f1 || '');
  if (fired1.length) viol.push('the sight challenge fired mid-chase');
  await sh('2-held-during-chase');
  await g.ev(() => { window.npcHostileSystem.setNPCHostile('tunnel_guard', false); });
  let opened = null;
  for (let i = 0; i < 12 && !opened; i++) { await g.t(1000); const s = await ST(); if (s.mg === 'PersonChatMinigame') opened = s; }
  console.log('S after the fight the scripted chat opened:', JSON.stringify(opened));
  if (!opened) viol.push('the scripted chat never opened after the fight');
  await sh('3-opened-after-fight');
  await g.ev(() => { try { window.MinigameFramework.forceCloseMinigame(); } catch (e) { /* none */ } });
  await g.t(1500);
  const fired2 = await g.ev(async () => { const m = await import('/break_escape/js/systems/npc-sight-challenge.js'); return m.sightChallengeWatcher.update(Date.now() + 1000, { force: true }); });
  console.log('S sight challenge after the fight fired:', JSON.stringify(fired2));
  // The game loop's own watcher fires it as the fight ends (before this forced update, which then finds it already fired): count the events
  const nSpot = await g.ev(() => window.__spotted.length);
  console.log('S player_spotted events in all (1 is the scripted emit during the chase):', nSpot);
  if (nSpot < 2) viol.push('the sight challenge did not fire after the fight');
  console.log(`VERDICT S: ${viol.length ? 'FAIL' : 'PASS'}`, JSON.stringify(viol));
  await g.close(); process.exit(viol.length ? 1 : 0);
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
