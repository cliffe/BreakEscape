// Test 8 (PLAN section 8): Fatima and Graham barks. Order, once-only, Graham's previousRoom condition,
// suppression after a KO or after entropy_reveal_read.
//   node tools/playtest/m01-ol-barks.mjs <gameId> <route|ko-graham|seeded> [port]
// route:      reception -> main office (Fatima only), -> hallway_east -> main office (Graham), then twice more (nothing).
// ko-graham:  reception -> main office, punch Graham to KO (real playerCombat), leave and return from elsewhere: no Graham bark.
// seeded:     for games created with --set fatima_ko / graham_ko / entropy_reveal_read: enter from reception, then from elsewhere: no barks.
import { open, ev, dismiss } from './m01-ol-lib.mjs';
const [gid, mode, port = '3094'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
await ev(h, () => {
  window.__barks = [];
  const bs = window.barkSystem, orig = bs.showBark.bind(bs);
  bs.showBark = p => { window.__barks.push({ t: Math.round(performance.now()), npc: p?.npcId, text: (p?.message || p?.text || '').slice(0, 60), cont: !!p?.continuation, toast: !!p?.forceToast, room: window.currentPlayerRoom }); return orig(p); };
});
const barks = () => ev(h, () => window.__barks.filter(b => /^(fatima_begum|graham_whitfield)$/.test(b.npc) && !b.cont));
const go = async r => { await dismiss(h); const x = await ev(h, async r => await window.__test.enterRoom(r), r); if (!x.ok) log('enterRoom failed', { r, reason: x.reason }); await h.t(5000); };
const G = () => ev(h, () => { const g = window.gameState.globalVariables || {}; return { fatima_ko: g.fatima_ko, graham_ko: g.graham_ko, reveal: g.entropy_reveal_read }; });
log('globals0', await G());
await h.t(3000);
log('start room', await ev(h, () => window.currentPlayerRoom));
const step = async (label, room) => { const before = (await barks()).length; await go(room); const all = await barks(); log(label, { room, new: all.slice(before).map(b => `${b.npc}: ${b.text}`) }); };
if (mode === 'route') {
  await step('1 reception -> main office', 'main_office_area');
  await step('2 -> hallway_east', 'hallway_east');
  await step('3 hallway_east -> main office', 'main_office_area');
  await step('4 -> hallway_east', 'hallway_east');
  await step('5 hallway_east -> main office', 'main_office_area');
  await step('6 -> reception', 'reception_area');
  await step('7 reception -> main office', 'main_office_area');
} else if (mode === 'ko-graham') {
  await step('1 reception -> main office', 'main_office_area');
  const who = 'graham_whitfield';
  const punch = () => ev(h, i => { const s = window.npcBehaviorManager.getBehavior(i).sprite; window.playerCombat.attack({ x: s.x, y: s.y }); }, who);
  const near = () => ev(h, i => window.__test.moveToNear(i, { timeoutMs: 15000 }), who).catch(() => {});
  await near(); let ko = null;
  for (let i = 0; i < 70; i++) { await punch(); await h.t(450); if (await ev(h, i => window.npcHostileSystem.isNPCKO(i), who)) { ko = i + 1; break; } if (i % 3 === 2) await near(); }
  log('KO after punches', ko); log('globals after KO', await G());
  await h.t(2000);
  await step('2 -> hallway_east', 'hallway_east');
  await step('3 hallway_east -> main office (Graham KO)', 'main_office_area');
  await step('4 -> hallway_east', 'hallway_east');
  await step('5 hallway_east -> main office', 'main_office_area');
} else {
  await step('1 reception -> main office', 'main_office_area');
  await step('2 -> hallway_east', 'hallway_east');
  await step('3 hallway_east -> main office', 'main_office_area');
}
log('all barks', await barks());
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
