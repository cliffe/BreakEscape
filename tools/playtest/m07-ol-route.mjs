// Legitimate route to the m07 server room for the office-life live checks: ops floor (take the Shift Handover
// Sheet), back to the checkpoint, Contractor Badge Station with PIN 0616, take the badge, ops floor, server room.
// Exported as route(h) so m07-ol-s3.mjs modes can reuse it. Headless; no globals or needs are set.
import { ev } from './m01-ol-lib.mjs';
export async function route(h, log = () => {}) {
  const T = (fn, a) => ev(h, fn, a);
  // A blocking bark (the HaX phone text on first entry) must clear before the next action: retry until it does.
  const clear = async () => { for (let i = 0; i < 20; i++) { const b = await T(() => window.__test.getState().blockingUi || null); if (!b) return true; await T(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()); await h.t(800); } return false; };
  const step = async (name, fn, a) => { const r = await T(fn, a); log('route ' + name, r && typeof r === 'object' ? JSON.stringify(r).slice(0, 1200) : r); return r; };
  await step('enter ops', () => window.__test.enterRoom('operations_floor', { timeoutMs: 20000 }));
  await h.t(1500); await clear();
  await step('take sheet', () => window.__test.interact('shift_handover_sheet'));
  await h.t(1500);
  await step('close sheet', () => window.__test.minigame.close());
  await h.t(800); await clear();
  await step('inventory', () => (window.inventory?.items || []).map(i => i.scenarioData?.id || i.scenarioData?.name));
  await step('back to checkpoint', () => window.__test.enterRoom('security_checkpoint', { timeoutMs: 20000 }));
  await h.t(1500);
  await step('use station', () => window.__test.interact('badge_printer'));
  await h.t(1200);
  for (const d of '0616') await T((c) => window.__test.minigame.clickControl(c), d);
  await T((c) => window.__test.minigame.clickControl(c), 'ENTER');
  for (let i = 0; i < 20; i++) { await h.t(500); const w = await T(() => window.__test.minigame.which()); if (w && w.id === 'container') { const tx = await T(() => window.__test.minigame.getState()?.text || ''); if (/Printed Contractor Badge/.test(tx)) break; } }
  const mg = await step('container', () => { const s = window.__test.minigame.getState(); return { which: window.__test.minigame.which(), text: (s?.text || '').replace(/\n+/g, ' | ').slice(0, 200) }; });
  await step('take badge', () => window.__test.minigame.take('Printed Contractor Badge'));
  await h.t(1000);
  await step('close', () => window.__test.minigame.close());
  await h.t(800);
  await step('inventory2', () => (window.inventory?.items || []).map(i => i.scenarioData?.id || i.scenarioData?.name));
  for (let i = 0; i < 3; i++) { const r = await step('enter ops again', () => window.__test.enterRoom('operations_floor', { timeoutMs: 20000 })); if (r && r.ok) break; await h.t(2000); }
  await h.t(1500); await clear();
  // The RFID door unlocks only through the door interaction with the badge held (enterRoom refuses a locked door).
  const D = 'door:operations_floor->server_room';
  for (let i = 0; i < 4; i++) {
    await step('near server door', (d) => window.__test.moveToNear(d), D).catch?.(() => {});
    await T((d) => window.__test.moveToNear(d), D);
    const r = await step('interact server door ' + i, (d) => { return window.__test.interact(d).then(x => ({ ok: x?.ok, events: x?.events })); }, D);
    await h.t(2500); await clear();
    if (r && r.events && r.events.includes('door_unlocked')) break;
    const locked = await T((d) => { const e = window.__test.doorways('operations_floor'); const l = Array.isArray(e) ? e : Object.values(e || {}); const x = l.find(q => q.id === d); return x ? (x.locked ?? x.state?.locked ?? null) : 'nodoor'; }, D);
    log('route door locked after try ' + i, locked);
    if (locked === false) break;
  }
  await step('enter server', () => window.__test.enterRoom('server_room', { timeoutMs: 25000 }));
  await h.t(1500); await clear();
  await step('server state', () => { const g = window.__test.getState(); return { room: window.currentPlayerRoom, globals: Object.fromEntries(Object.entries(g.globals || {}).filter(([k]) => /server_hall|badge/.test(k))) }; });
  return mg;
}
