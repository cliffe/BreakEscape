// Test 7 approach checks: open the recycling bin with Graham mid-work, and the filing cabinet while someone uses the cooler.
//   node tools/playtest/m01-ol-approach.mjs <gameId> [port] [shotDir]
import { open, ev, dismiss } from './m01-ol-lib.mjs';
const [gid, port = '3094', shotDir = 'tmp'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const who = () => ev(h, () => Object.fromEntries(['fatima_begum', 'graham_whitfield'].map(i => { const s = window.__test.needs.state(i); const sp = window.npcBehaviorManager.getBehavior(i).sprite; return [i, { mode: s?.mode, job: s?.job ? { obj: s.job.objectId, phase: s.job.phase, need: s.job.need } : null, x: +(sp.body.center.x / 32).toFixed(2), y: +(sp.body.center.y / 32).toFixed(2) }]; })));
await h.t(9000);
const objs = await ev(h, () => Object.values(window.rooms.main_office_area.objects || {}).filter(o => /bin|filing|cabinet/i.test((o.scenarioData?.name || '') + (o.scenarioData?.type || ''))).map(o => ({ id: o.scenarioData?.id, name: o.scenarioData?.name, x: +(o.x / 32).toFixed(2), y: +(o.y / 32).toFixed(2) })));
log('candidate objects', objs);
async function tryOpen(label, id) {
  const r = await ev(h, async id => await window.__test.interact(id, { timeoutMs: 25000 }), id);
  await h.t(1500);
  const mg = await ev(h, () => { const s = window.__test.minigame.getState?.(); return { active: window.__test.minigame.isActive?.(), id: s?.id, title: s?.title, text: (s?.text || '').slice(0, 120) }; });
  const p = await ev(h, () => ({ x: +(window.player.x / 32).toFixed(2), y: +(window.player.y / 32).toFixed(2) }));
  log(label, { ok: r?.ok, reason: r?.reason, mode: r?.mode, mg, player: p, npcs: await who() });
  await h.page.screenshot({ path: `${shotDir}/approach-${label}.png` });
  await ev(h, () => { for (let i = 0; i < 3; i++) window.__test.minigame.close?.(); }); await h.t(500); await dismiss(h);
}
{ const t1 = Date.now(); let w; while (Date.now() - t1 < 120000) { w = await who(); if (w.graham_whitfield.job?.need === 'work' && w.graham_whitfield.job?.phase === 'using') break; await h.t(1000); } }
log('graham mid-work', await who());
const bin = objs.find(o => /recycl/i.test(o.name || '')), cab = objs.find(o => /filing/i.test(o.name || ''));
if (bin) await tryOpen('bin-graham-working', bin.id);
// someone at the cooler
await ev(h, () => { window.__test.needs.set('fatima_begum', 'thirst', 20); window.__test.needs.set('graham_whitfield', 'thirst', 20); });
let t0 = Date.now(), using = false;
while (Date.now() - t0 < 60000) { await h.t(1000); const w = await who(); if (Object.values(w).some(v => v.job?.phase === 'using' && v.job?.need === 'thirst')) { using = true; log('cooler in use', w); break; } }
if (cab) await tryOpen('cabinet-cooler-in-use', cab.id);
if (bin) await tryOpen('bin-cooler-in-use', bin.id);
log('cooler use seen', using);
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
