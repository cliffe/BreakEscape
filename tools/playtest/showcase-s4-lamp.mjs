// S4 live proof D: evening reload with the mission brief dismissed, lamp over Zainab's tool roll, kitchen after reload. Usage: node showcase-s4-reload.mjs <gameId>
import { load, dismiss } from './m01-ol-lib.mjs';
import { start, install, shot, clock, gv, log, ev, nearNpc, closeChat, spriteState, lightState, toKitchen, toOffice, waitFor, HIDDEN, NPCS, dlg, OUT } from './showcase-s4-lib.mjs';
const gid = process.argv[2];
const h = await start(gid); const R = {};
await install(h);
const snap = async label => {
  const o = { label };
  o.globals = await ev(h, () => Object.fromEntries(['act_midday', 'act_evening', 'kitchen_seen', 'office_coffee_off'].map(k => [k, window.gameState.globalVariables[k]])));
  o.task = await ev(h, () => window.objectivesManager.getTask('see_who_stays')?.status);
  o.office = await lightState(h, 'office'); o.kitchen = await lightState(h, 'kitchen');
  o.vis = await ev(h, ids => Object.fromEntries(ids.map(i => [i, window.npcManager.npcs.get(i)?.isVisible])), NPCS);
  o.sprites = {}; for (const i of HIDDEN) { const s = await spriteState(h, i); o.sprites[i] = [s.isVisible, s.spriteVisible, s.drawnOthers]; }
  o.levels = await ev(h, ids => Object.fromEntries(ids.map(i => [i, window.__test.needs.state(i)?.levels])), NPCS);
  o.initial = await ev(h, ids => Object.fromEntries(ids.map(i => { const n = window.npcNeedsSystem.getState(i); return [i, n?.needs ? Object.fromEntries(Object.entries(n.needs).map(([k, c]) => [k, c.initial])) : null]; })), NPCS);
  return o;
};
const reload = async label => {
  const t0 = await clock(h); await h.t(21000);
  const before = await snap(label + ' before reload');
  await h.page.reload({ waitUntil: 'domcontentloaded' });
  await load(h, undefined); await install(h); await h.t(2500);
  const after = await snap(label + ' after reload'); log(await clock(h), label, JSON.stringify({ g: after.globals, task: after.task, office: after.office, vis: after.vis, sprites: after.sprites }));
  R[label] = { before, after }; return after;
};
const pickAll = async re => { R['near' + re] = await nearNpc(h, 'ama_owusu'); R['int' + re] = JSON.stringify(await ev(h, () => window.__test.interact('ama_owusu'))); await h.t(1500);
  for (let i = 0; i < 40; i++) { const d = await dlg(h); if (!d.active) return 'closed'; if (d.controls.some(c => /^\d\./.test(c))) { const p = await ev(h, p => window.__test.minigame.chooseMatching(p), re); if (!p?.ok) return 'nochoice:' + d.controls.join('|'); await h.t(900); for (let k = 0; k < 20; k++) { const e = await dlg(h); if (!e.active || e.controls.some(c => /^\d\./.test(c))) break; await h.page.keyboard.press('Space'); await h.t(800); } return 'picked'; } await h.page.keyboard.press('Space'); await h.t(800); } return 'timeout:' + JSON.stringify(await dlg(h)).slice(0, 400); };
await toKitchen(h); await toOffice(h); await h.t(1000);
R.lunch = await pickAll("Let's do lunch"); await closeChat(h); log(await clock(h), 'midday', await gv(h, 'act_midday'), R.lunch);
R.evening = await pickAll("Call it a day"); await closeChat(h); log(await clock(h), 'evening', await gv(h, 'act_evening'), R.evening);
await h.t(21000);
await h.page.reload({ waitUntil: 'domcontentloaded' }); await load(h, undefined); await install(h);
for (let i = 0; i < 3; i++) { await h.t(2500); await dismiss(h); }
R.busyAfterDismiss = await ev(h, () => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); });
R.afterReload = await snap('evening after reload'); log(await clock(h), 'reload', JSON.stringify({ g: R.afterReload.globals, task: R.afterReload.task, vis: R.afterReload.vis, spr: R.afterReload.sprites, office: R.afterReload.office }));
await ev(h, () => window.__test.moveTo(150, 120, { timeoutMs: 15000 })).catch(() => {}); await h.t(3500);
R.zPost = await ev(h, () => window.npcNeedsSystem.getState('zainab_hussain')?.atPost);
await shot(h, 'D-office-evening-after-reload');
const lampPx = await ev(h, () => { const r = window.rooms.office, cam = window.player.scene.cameras.main; const wx = r.position.x + 2.3 * 32, wy = r.position.y + 5.5 * 32; return { sx: (wx - cam.worldView.x) * cam.zoom, sy: (wy - cam.worldView.y) * cam.zoom, zoom: cam.zoom, wx, wy, roll: Object.values(r.objects || {}).filter(o => /tool_roll/.test(o.objectId || '')).map(o => [o.x, o.y, o.visible]) }; });
R.lampPx = lampPx; log(0, 'lamp', JSON.stringify(lampPx));
const cx = Math.max(0, Math.round(lampPx.sx - 150)), cy = Math.max(0, Math.round(lampPx.sy - 120));
await h.page.screenshot({ path: `${OUT}/s4-D-lamp-clip.png`, clip: { x: cx, y: cy, width: 300, height: 240 } });
await ev(h, () => window.__test.enterRoom('kitchen')); await h.t(2500); R.kitchenReload = await lightState(h, 'kitchen'); await shot(h, 'D-kitchen-entered-after-reload');
await ev(h, () => window.__test.enterRoom('office')); await h.t(1000); await ev(h, () => window.__test.moveTo(300, 296, { timeoutMs: 15000 })).catch(() => {}); await h.t(12500); R.kitchenAfterLeave = await lightState(h, 'kitchen');
console.log(JSON.stringify(R, null, 1)); console.log('errs', h.errs.filter(e => !/ERR_FAILED|503/.test(e))); await h.browser.close();
