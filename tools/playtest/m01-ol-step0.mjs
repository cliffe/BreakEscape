// Step 0 live proof: a person NPC with a one-knot brush-off conversation (office_life/PLAN.md 2, item 0).
//   node tools/playtest/m01-ol-step0.mjs <gameId> [port]
import { open, load, dismiss, dlg, ev, converse } from './m01-ol-lib.mjs';
const [gid, port = '3094'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const out = { gid, steps: [] };
const log = (k, v) => { out.steps.push({ k, v }); console.log(k, JSON.stringify(v)); };
const npc = await ev(h, () => { const n = window.npcManager?.getNPC?.('fatima_begum'); return n ? { id: n.id, room: n.roomId, type: n.npcType, seated: !!n.seated } : null; });
log('npc registered', npc);
log('needs ids', await ev(h, () => window.__test.needs.ids()));
log('seated', await ev(h, () => { const b = window.npcBehaviorManager?.getBehavior('fatima_begum'); const s = b?.sprite; return s ? { x: Math.round(s.x), y: Math.round(s.y), seated: !!(s.seated || b._seated || s.isSeated) } : null; }));
for (const round of [1, 2]) {
  const r = await ev(h, () => window.__test.interact('fatima_begum'));
  log(`interact #${round}`, { ok: r?.ok, reason: r?.reason });
  await h.t(1500);
  log(`conversation #${round}`, await converse(h, "Don't let me keep you"));
  await h.t(800);
  log(`after #${round}`, await ev(h, () => { const s = window.__test.getState(); return { activeMinigame: s.activeMinigame || null, blockingUi: s.blockingUi || null, prompt: !!document.querySelector('.interaction-prompt') }; }));
  await h.page.screenshot({ path: `tmp/m01-step0-after${round}.png` });
}
// Reload and talk again
await load(h);
log('reload npc', await ev(h, () => !!window.npcManager?.getNPC?.('fatima_begum')));
const r3 = await ev(h, () => window.__test.interact('fatima_begum'));
log('interact after reload', { ok: r3?.ok, reason: r3?.reason });
await h.t(1500);
log('dialogue after reload', await dlg(h));
await h.page.screenshot({ path: process.argv[4] || 'tmp/m01-step0.png' });
log('errors', h.errs);
await h.browser.close();
