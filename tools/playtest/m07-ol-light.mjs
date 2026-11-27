// Slice 6 lighting render: zoomed ops-floor cooler corner. Usage: node m07-ol-light.mjs <gid> <port> <cooler|post> <outpng>
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port = '3098', where = 'cooler', out = 'tmp/m07-light.png'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const OPS = ['adaeze_okafor', 'gwen_pritchard'];
await h.t(3000);
await ev(h, () => window.__test.enterRoom('operations_floor', { timeoutMs: 20000 }));
const t0 = Date.now();
await h.t(2500);
await ev(h, () => window.__test.moveTo(520, 248, { timeoutMs: 25000 }));
const st = () => ev(h, (ids) => ids.map(i => { const s = window.__test.needs.state(i); return { i, m: s?.mode, j: s?.job ? s.job.phase : null }; }), OPS);
const CAM = [Number(process.env.Z||2), Number(process.env.CX||410), Number(process.env.CY||200)];
const cam = () => ev(h, ([z, cx, cy]) => { const c = window.pathfindingManager.scene.cameras.main; c.stopFollow(); c.removeBounds && c.removeBounds(); c.setZoom(z); c.centerOn(cx, cy); }, CAM);
if (where === 'cooler') {
  for (let i = 0; i < 200; i++) {
    const s = await st();
    if (i % 10 === 0) console.log('t', Math.round((Date.now() - t0) / 1000), JSON.stringify(s));
    if (s.every(x => x.j === 'using')) break;
    await h.t(1000);
  }
  console.log('using at', Math.round((Date.now() - t0) / 1000), JSON.stringify(await st()));
}
for (let i = 0; i < 12; i++) { const b = await ev(h, () => window.__test.getState().blockingUi || null); if (!b) break; await ev(h, () => window.__test.dismissBlockingUi()); await h.t(600); }
await ev(h, () => { document.querySelectorAll('body *').forEach(e => { if (e.tagName === 'CANVAS' || e.tagName === 'SCRIPT') return; if (e.querySelector('canvas') || e.contains(document.querySelector('canvas'))) return; if (getComputedStyle(e).position === 'fixed') e.style.display = 'none'; }); });
await cam(); await h.t(1200);
console.log(JSON.stringify(await ev(h, (ids) => ids.map(i => { const s = window.npcBehaviorManager.getBehavior(i)?.sprite; return { i, x: s?.x, y: s?.y, vis: s?.visible }; }), OPS)));
console.log(JSON.stringify(await ev(h,()=>{const c=window.pathfindingManager.scene.cameras.main;return [c.worldView.x,c.worldView.y,c.worldView.width,c.worldView.height,c.zoom];})));
await h.page.screenshot({ path: out });
await h.browser.close();
