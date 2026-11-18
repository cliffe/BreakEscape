// m10 engine-fight-hold live proof (keyless server, headless, fixed steps ON, 20 fps).
//   M10_PORT=3176 node tools/playtest/m10-hold-proof.mjs <gameId> <outDir> [A|B|C]
// A: guard hostile and chasing in the tunnel, breach_open fires: no ring while he chases; ring once after the fight.
// B: as A, then the player walks east into the security office with the guard behind.
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
const log = async (tag) => console.log(tag, JSON.stringify(await R()));
await boot();
await g.t(2500);
await log('start');
await g.ev(() => window.__test.minigame && window.__test.minigame.close && window.__test.minigame.close()).catch(() => {});
await g.t(1500);
await log('chat closed');
await g.ev(() => window.npcHostileSystem.setNPCHostile('tunnel_guard', true));
await g.t(2500);
await log('guard hostile');
await g.ev(() => { const v = window.gameState.globalVariables; v.breach_open = true; window.eventDispatcher.emit('global_variable_changed:breach_open', { name: 'breach_open', value: true }); });
for (let i = 0; i < 5; i++) { await g.t(2000); await log(`t+${(i + 1) * 2}s`); }
await sh('1-during-chase');
const evs = await g.evs('phone|breach|conversation');
console.log('events while chasing', JSON.stringify(evs.slice(-8)));
if (which === 'B') {
  g.ev(() => window.__test.enterRoom('security_office')).then((r) => console.log('enterRoom', JSON.stringify(r).slice(0, 200))).catch((e) => console.log('enterRoom err', String(e).slice(0, 120)));
  for (let i = 0; i < 10; i++) { await g.t(1500); await g.ev(() => window.playerHealth.heal(30)); await log(`office t${i}`); if (i === 4) await sh('2-office'); }
  console.log('events', JSON.stringify((await g.evs('room_entered|phone|breach')).slice(-6)));
}
if (which === 'C') {
  await g.ev(() => window.playerHealth.damage(1000000, 'guard'));
  await g.t(2500);
  await sh('2-ko');
  await g.ev(() => document.getElementById('game-over-respawn-btn') && document.getElementById('game-over-respawn-btn').click());
  await g.page.waitForNavigation({ timeout: 30000 }).catch(() => {});
  await g.page.waitForFunction(() => window.gameScenario && window.__test && window.player && window.player.body, null, { timeout: 90000 });
  await boot();
  console.log('notes open?', await g.ev(() => window.MinigameFramework?.currentMinigame?.constructor?.name));
  // The Mission Brief notes reopen after a reload (intended); a delayed non-ring mapping waits for the player to close them.
  for (let i = 0; i < 8; i++) {
    await g.t(2000);
    await log(`respawn t${i}`);
    if (i === 1) await sh('3a-respawned-notes');
    if (i >= 1 && (await R()).mg === 'NotesMinigame') await g.ev(() => window.__test.minigame.close());
  }
  await sh('3-respawned');
}
// End the fight
await g.ev(() => { const h = window.npcHostileSystem; (h.damageNPC ? h.damageNPC('tunnel_guard', 99999) : h.setNPCHostile('tunnel_guard', false)); });
await g.ev(() => window.npcHostileSystem.setNPCHostile('tunnel_guard', false));
for (let i = 0; i < 8; i++) { await g.t(1500); await log(`after fight t+${(i + 1) * 1.5}s`); if ((await R()).cur) break; }
await g.t(2500);
await sh('4-after-fight');
console.log('ring offers/evs', JSON.stringify((await g.ev(() => (window.__ev || []).filter(e => /phone_call|breach/.test(e.ev)))).slice(-10)));
await g.t(8000);
await log('settled');
console.log('errs', JSON.stringify(g.errs.slice(0, 5)));
await g.close();
