// Reload checks for m05 office life: node m05-ol-reload.mjs <gid> <evening|night>
// Routes to the break room in the chosen act, reloads, and samples Bernadette, Niamh and Thandiwe from the first frames.
import { start, log, reload } from './m05-ol-lib.mjs';
const [gid, act] = process.argv.slice(2);
const IDS = ['bernadette_lyons', 'niamh_doherty', 'thandiwe_moyo'];
const sampler = () => {
  window.__vis = [];
  const t0 = Date.now();
  setInterval(() => {
    try {
      const m = window.npcBehaviorManager; if (!m) return;
      const row = { t: Date.now() - t0, room: window.currentPlayerRoom };
      for (const id of ['bernadette_lyons', 'niamh_doherty', 'thandiwe_moyo']) { const b = m.getBehavior(id); const s = b && b.sprite; row[id] = s ? [Math.round(s.x), Math.round(s.y), !!s.visible, s.alpha, s.active !== false] : null; }
      window.__vis.push(row);
    } catch (e) {}
  }, 100);
};
let g = await start(gid);
const snap = async label => log(label, 'room', await g.ev(() => window.currentPlayerRoom), JSON.stringify(await g.ev(() => Object.fromEntries(['bernadette_lyons', 'niamh_doherty', 'thandiwe_moyo'].map(i => { const b = window.npcBehaviorManager.getBehavior(i); const s = b && b.sprite; return [i, s ? [Math.round(s.x), Math.round(s.y), s.visible, !!(window.npcNeedsSystem.getState(i) || {}).mode && window.npcNeedsSystem.getState(i).mode] : null]; })))));
await g.t(2000);
await snap('day start');
for (const r of ['main_corridor', 'server_hallway', 'server_room']) log(r, JSON.stringify((await g.enter(r)).ok));
log('server_room_entered', await g.gv('server_room_entered'));
if (act === 'night') {
  await g.page.evaluate(async () => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal('torres_identified', true); });
  await g.t(500);
  log('torres_identified', await g.gv('torres_identified'));
}
for (const r of ['server_hallway', 'main_corridor', 'break_room']) log(r, JSON.stringify((await g.enter(r)).ok));
await g.t(4000);
await snap(act + ' before reload');
await g.shot('s6-' + act + '-before-reload');
await g.t(Number(process.env.SYNC_WAIT || 0));
log('flags before reload', JSON.stringify(await g.ev(() => { const v = window.gameState.globalVariables; return { sre: v.server_room_entered, torres: v.torres_identified }; })));
await g.browser.close();
g = await reload(gid, sampler);
await g.t(4000);
const rows = await g.ev(() => window.__vis);
const first = rows.filter((r, i) => i < 40 || i % 10 === 0);
log('rows', rows.length);
for (const r of first) console.log(JSON.stringify(r));
await snap(act + ' after reload');
const flags = await g.ev(() => { const v = window.gameState.globalVariables; return { sre: v.server_room_entered, torres: v.torres_identified }; });
log('flags', JSON.stringify(flags));
await g.shot('s6-' + act + '-after-reload');
log('errs', JSON.stringify(g.errs)); await g.browser.close();
