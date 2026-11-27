// Test 10 and the credits lines: punch one extra through the real player-combat path on a fresh game,
// record hostility, HaX's attacked text, m01_staff_alarmed, the cooler going off, the leash when the player
// leaves the main office, then punch to KO and read the KO global and the credits that would show.
//   node tools/playtest/m01-ol-attack.mjs <gameId> <fatima_begum|graham_whitfield> [port] [shotDir]
import { open, ev, dismiss } from './m01-ol-lib.mjs';
const [gid, who, port = '3094', shotDir = 'tmp'] = process.argv.slice(2);
const other = who === 'fatima_begum' ? 'graham_whitfield' : 'fatima_begum';
const koG = who === 'fatima_begum' ? 'fatima_ko' : 'graham_ko';
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const snap = () => ev(h, ([who, other, koG]) => {
  const g = window.gameState.globalVariables || {}, hs = window.npcHostileSystem;
  const sp = i => window.npcBehaviorManager.getBehavior(i)?.sprite;
  const cool = window.npcNeedsSystem.world?.getObject?.('office_cooler');
  const msgs = (window.npcManager.timedMessages || []).filter(m => /Stand down|not part of this|accountant/.test(m.text || '')).map(m => ({ t: (m.text || '').slice(0, 60), delivered: !!m.delivered }));
  const d = i => ({ x: Math.round(sp(i).x), y: Math.round(sp(i).y), hostile: hs.isNPCHostile(i), ko: hs.isNPCKO(i), mode: window.__test.needs.state(i)?.mode ?? null });
  return { room: window.currentPlayerRoom, player: { x: Math.round(window.player.x), y: Math.round(window.player.y) }, [who]: d(who), [other]: d(other),
    globals: { [koG]: g[koG], alarmed: g.m01_staff_alarmed }, coolerOff: cool ? window.npcNeedsSystem._isOff(cool) : 'no-object', haxTexts: msgs };
}, [who, other, koG]);
await h.t(9000);
log('start', await snap());
// approach and punch until hostile
const punch = () => ev(h, i => { const s = window.npcBehaviorManager.getBehavior(i).sprite; window.playerCombat.attack({ x: s.x, y: s.y }); return true; }, who);
const near = () => ev(h, i => window.__test.moveToNear(i, { timeoutMs: 15000 }), who).catch(() => {});
await near();
let hostileAfter = null;
for (let i = 0; i < 12; i++) { await punch(); await h.t(500); const s = await snap(); if (s[who].hostile) { hostileAfter = i + 1; break; } await near(); }
log('first hostile after punches', hostileAfter);
await h.t(3000);
const afterHit = await snap(); log('after hit +3s', afterHit);
await h.page.screenshot({ path: `${shotDir}/attack-${who}.png` });
// leash: leave the main office by the east door, sample the hostile every 2 s
const x1 = await ev(h, async () => await window.__test.enterRoom('hallway_east')); await h.t(1500);
const leash = [];
for (let i = 0; i < 5; i++) { await h.t(2000); const s = await snap(); leash.push({ room: s.room, npc: s[who] }); }
log('player in hallway_east, hostile samples', leash);
const x2 = await ev(h, async () => await window.__test.enterRoom('main_office_area')); await h.t(2500);
log('back in main office', await snap());
// punch to KO
await near();
let ko = null;
for (let i = 0; i < 60; i++) { await punch(); await h.t(450); const s = await snap(); if (s[who].ko) { ko = i + 1; break; } if (i % 3 === 2) await near(); }
log('KO after punches', ko);
await h.t(2500);
const kod = await snap(); log('after KO', kod);
await h.page.screenshot({ path: `${shotDir}/ko-${who}.png` });
// credits lines the ending would show (filtered by the engine's own evaluator on the real globals + the ending gate)
const credits = await ev(h, () => { try { const g = { ...(window.gameState.globalVariables || {}), start_debrief_cutscene: true, ready_for_debrief: true };
  const o = window.endingReplayOptions(window.gameScenario, g); return o ? o.credits.map(c => typeof c === 'string' ? c : c.text).filter(t => /FATIMA|GRAHAM|KEVIN|MAYA/.test(t)) : 'null-options'; } catch (e) { return 'err ' + e.message; } });
log('credits personnel lines', credits);
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
