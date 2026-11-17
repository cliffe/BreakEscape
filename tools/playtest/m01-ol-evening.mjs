// Test 9: the hide after entropy_reveal_read (real path from the archive pickup), seats released, reload.
//   node tools/playtest/m01-ol-evening.mjs <gameId> [port] [shotDir]
import { open, load, ev, dismiss } from './m01-ol-lib.mjs';
const [gid, port = '3094', shotDir = 'tmp'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const snap = () => ev(h, () => {
  const o = {}; for (const i of ['fatima_begum', 'graham_whitfield']) {
    const n = window.npcManager.getNPC?.(i); const sp = window.npcBehaviorManager.getBehavior(i)?.sprite;
    o[i] = { vis: sp ? !!sp.visible : null, active: sp ? !!sp.active : null, mgrVis: window.npcManager._npcVisibility?.[i], needs: window.__test.needs.state(i)?.mode ?? null };
  }
  const g = window.gameState?.globalVariables || {};
  return { room: window.currentPlayerRoom, reveal: g.entropy_reveal_read, npcs: o };
});
await h.t(10000);
log('start', await snap());
for (const r of ['it_room', 'server_room']) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); log('enterRoom ' + r, { ok: x?.ok, reason: x?.reason }); await h.t(1500); await dismiss(h); }
log('in server room', await snap());
log('seat/chair globals', await ev(h, () => Object.keys(window).filter(k => /seat/i.test(k))));
const it = await ev(h, async () => await window.__test.interact('entropy_encrypted_archive', { timeoutMs: 20000 }));
log('interact archive', { ok: it?.ok, reason: it?.reason });
await h.t(1500);
log('dialog', await ev(h, () => { const s = window.__test.minigame.getState?.(); return { active: window.__test.minigame.isActive?.(), id: s?.id, text: (s?.text || '').slice(0, 300), controls: (s?.controls || []).map(c => c.label || c.text || String(c)).slice(0, 14) }; }));
await h.page.screenshot({ path: `${shotDir}/m01-evening-archive.png` });
