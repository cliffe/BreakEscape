// Steps 4 / tests 7 and 11: cooler placement, break walk at real pace, queue, exchanges heard once, reload.
//   node tools/playtest/m01-ol-cooler.mjs <gameId> [port] [shotDir]
import { open, load, ev, waitAtPost } from './m01-ol-lib.mjs';
const [gid, port = '3094', shotDir = 'tmp'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const syncs = []; h.page.on('request', r => { if (/sync_state/.test(r.url()) && r.method() !== 'GET') { const b = r.postData() || ''; let k = []; try { const j = JSON.parse(b); k = Object.keys(j.playerState || j.player_state || j); } catch (e) {} syncs.push({ t: Date.now(), bytes: b.length, keys: k.slice(0, 12) }); } });
await h.t(8000);
log('cooler objects', await ev(h, () => Object.values(window.rooms.main_office_area.objects || {}).filter(o => /water_cooler/.test(o.texture?.key || '') || o.scenarioData?.id === 'office_cooler').map(o => ({ key: o.texture?.key, id: o.scenarioData?.id || null, x: +(o.x / 32).toFixed(2), y: +(o.y / 32).toFixed(2), w: o.width, h: o.height }))));
log('doors', await ev(h, () => (window.rooms.main_office_area.doorSprites || window.rooms.main_office_area.doors || []).map?.(d => ({ x: +(d.x / 32).toFixed(2), y: +(d.y / 32).toFixed(2) })) ?? 'n/a'));
log('globals0', await ev(h, () => ({ a: window.gameState?.globalVariables?.m01_staff_alarmed, i: window.gameState?.globalVariables?.heard_ex_interns, b: window.gameState?.globalVariables?.heard_ex_biscuits })));
// force both thirsty (same path as the mapped break) and sample at walking pace
await ev(h, () => { window.__test.needs.set('fatima_begum', 'thirst', 20); window.__test.needs.set('graham_whitfield', 'thirst', 20); });
const samples = []; let shot = false, ex = {};
const t0 = Date.now();
while (Date.now() - t0 < 85000) {
  const r = await ev(h, () => {
    const o = {};
    for (const i of ['fatima_begum', 'graham_whitfield']) {
      const s = window.__test.needs.state(i); const sp = window.npcBehaviorManager.getBehavior(i)?.sprite;
      o[i] = { mode: s?.mode, job: s?.job ? { obj: s.job.objectId, phase: s.job.phase, need: s.job.need } : null, x: sp ? +(sp.body.center.x / 32).toFixed(2) : null, y: sp ? +(sp.body.center.y / 32).toFixed(2) : null, anim: sp?.anims?.currentAnim?.key || null };
    }
    const g = window.gameState?.globalVariables || {};
    return { o, g: { i: g.heard_ex_interns, b: g.heard_ex_biscuits }, tone: window.soundManager?.currentAmbient };
  });
  samples.push({ t: Math.round((Date.now() - t0) / 1000), ...r });
  if (!shot && Object.values(r.o).some(v => v.job?.phase === 'using' && v.job?.need === 'thirst') && Object.values(r.o).every(v => v.job?.need === 'thirst')) { await h.page.screenshot({ path: `${shotDir}/m01-cooler-use.png` }); shot = true; log('shot at', samples.at(-1)); }
  await h.t(1000);
}
let last = '';
for (const s of samples) { const k = JSON.stringify(s.o) + JSON.stringify(s.g); if (k !== last) { log('sample', s); last = k; } }
log('needs log tail', await ev(h, () => window.__test.needs.log().slice(-40)));
log('ex globals', await ev(h, () => { const g = window.gameState?.globalVariables || {}; return { interns: g.heard_ex_interns, biscuits: g.heard_ex_biscuits }; }));
// reload: exchanges must not replay
await load(h, h.url + '');
await h.t(5000);
log('after reload globals', await ev(h, () => { const g = window.gameState?.globalVariables || {}; return { interns: g.heard_ex_interns, biscuits: g.heard_ex_biscuits, alarmed: g.m01_staff_alarmed }; }));
log('syncs during run', { n: syncs.length, maxBytes: Math.max(0, ...syncs.map(x => x.bytes)), keys: [...new Set(syncs.flatMap(x => x.keys))] });
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
