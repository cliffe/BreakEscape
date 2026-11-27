// R1 m5 live proof: the real walkthrough route from game start to the first ops-floor entry (L1 window),
// then on to the server room. Usage: node tools/playtest/m07-ol-r1m5.mjs <gameId> [port=3098] [stage=start]
// stage=start only loads and reports the opening state. Headless, setFPS(20), no globals or needs set.
import { open, ev } from './m01-ol-lib.mjs';
import { route } from './m07-ol-route.mjs';
const [gid, port = '3098', stage = 'start'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
await h.t(3000);
log('state', await ev(h, () => { const g = window.__test.getState(); return { room: window.currentPlayerRoom, mg: g.activeMinigame ? (g.activeMinigame.id || 'open') : null, blocking: g.blockingUi || null, inv: (window.inventory?.items || []).map(i => i.scenarioData?.id || i.scenarioData?.name) }; }));
log('mg', await ev(h, () => { const s = window.__test.minigame.getState(); return s ? { which: window.__test.minigame.which(), text: (s.text || '').slice(0, 600), controls: (s.controls || []).map(c => c.label || c.text || c.name || String(c)).slice(0, 12) } : null; }));

const OPS = ['adaeze_okafor', 'gwen_pritchard'];
// Page-side recorder: every bark (HaX text, Architect call, RFID guide, bubble toasts) with a page clock stamp.
await ev(h, () => {
  window.__r1 = { barks: [], t0: null };
  const bs = window.barkSystem; const orig = bs.showBark.bind(bs);
  bs.showBark = (p = {}) => { window.__r1.barks.push({ t: performance.now(), npc: p.npcId || null, text: String(p.message || p.text || '').slice(0, 140), toast: !!p.forceToast }); return orig(p); };
  window.__r1.logLen = window.__test.needs.log().length;
});
const snap = () => ev(h, (ids) => {
  const g = window.__test.getState(); const o = { mg: g.activeMinigame ? (g.activeMinigame.id || 'open') : null, ui: g.blockingUi ? String(g.blockingUi.text || '').slice(0, 60) : null, t: Math.round((performance.now() - window.__r1.t0) / 100) / 10, room: window.currentPlayerRoom };
  for (const i of ids) {
    const s = window.__test.needs.state(i); const b = window.npcBehaviorManager.getBehavior(i); const sp = b?.sprite;
    o[i] = { m: s?.mode ?? null, post: s?.atPost ?? null, seat: !!b?._seat, job: s?.job ? [s.job.kind, s.job.objectId, s.job.phase] : null, anim: sp?.anims?.currentAnim?.key ?? null, vis: sp?.visible ?? null, room: sp?.roomId ?? null, x: sp ? Math.round(sp.body.center.x) : null, y: sp ? Math.round(sp.body.center.y) : null };
  }
  return o;
}, OPS);
await ev(h, () => { window.__r1.t0 = performance.now(); });
const consoleSeen = [];
h.page.on('console', m => { const x = m.text(); if (/bark|phone|call|architect|chatter|speak|bubble|rfid/i.test(x)) consoleSeen.push({ t: Math.round((Date.now() - tc0) / 100) / 10, x: x.slice(0, 200) }); });
let tc0 = Date.now();
const samples = []; let run = true;
const sampler = (async () => { while (run) { samples.push(await snap()); await h.t(1000); } })();
const rlog = (k, v) => { const t = ((await_now()) ); log('@' + t + ' ' + k, v); };
let t0n = Date.now(); const await_now = () => Math.round((Date.now() - t0n) / 100) / 10;
// L1 window: enter the ops floor through the checkpoint door, then stay put for 45 s before continuing the route.
tc0 = Date.now(); t0n = Date.now();
await ev(h, () => { window.__r1.t0 = performance.now(); });
rlog('first entry', await ev(h, () => window.__test.enterRoom('operations_floor', { timeoutMs: 20000 }).then(r => ({ ok: r.ok, room: window.currentPlayerRoom }))));
await h.t(45000);
rlog('l1 window over', await snap());
const r = await route(h, rlog);
run = false; await sampler;
const final = await snap();
log('final', final);
log('final hidden check', await ev(h, (ids) => ids.map(i => { const b = window.npcBehaviorManager.getBehavior(i); const sp = b?.sprite; return { i, vis: sp?.visible ?? null, active: sp?.active ?? null, room: sp?.roomId ?? null, state: window.__test.needs.state(i) ? 'state' : null }; }), OPS));
log('barks', await ev(h, () => window.__r1.barks.map(b => ({ t: Math.round((b.t - window.__r1.t0) / 100) / 10, npc: b.npc, text: b.text, toast: b.toast }))));
log('needs log', await ev(h, () => window.__test.needs.log().slice(window.__r1.logLen).map(e => JSON.stringify(e).slice(0, 200))));
for (const s of samples) if (s.t <= 46 || true) log('s', s);
log('console', consoleSeen);
log('errs', h.errs);
await h.browser.close();
