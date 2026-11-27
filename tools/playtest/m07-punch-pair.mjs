// Punch seated Gwen from the gap between the two ops operators (m07) and log, per punch,
// the player's feet, facing, who turned hostile (with a stack tag) and who was hit.
//   node tools/playtest/m07-punch-pair.mjs <gameId> [port] [fromX] [fromY]
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port = '3191', fx = '416', fy = '173'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
await h.page.route(u => /\/tts$/.test(u.pathname), r => r.abort());
await h.t(3000);
await ev(h, () => { window.__test.minigame?.close?.(); window.__test.throttleFps?.(20); });
await ev(h, () => window.__test.enterRoom('operations_floor', { timeoutMs: 20000 }));
await h.t(3000);
await ev(h, () => { window.__test.dismissBlockingUi?.(); window.__test.throttleFps?.(20); });
await ev(h, ({ x, y }) => window.__test.moveTo(x, y, { timeoutMs: 25000 }), { x: +fx, y: +fy });
await h.t(1500);
await ev(h, () => {
  window.__ppLog = [];
  const sys = window.npcHostileSystem, orig = sys.setNPCHostile;
  sys.setNPCHostile = (id, hs, c) => {
    const st = (new Error().stack || '').split('\n').slice(2, 5).map(s => (s.match(/at (\S+)/) || [])[1]).join('<');
    if (hs) window.__ppLog.push({ ev: 'hostile', id, via: st });
    return orig.call(sys, id, hs, c);
  };
  const ad = window.applyDamage;
  const pc = window.playerCombat, od = pc.applyDamage.bind(pc);
  pc.applyDamage = (id, d) => { window.__ppLog.push({ ev: 'hit', id }); return od(id, d); };
});
const res = { gid, fx, fy, punches: [] };
for (let i = 0; i < 16; i++) {
  const r = await ev(h, async () => {
    const g = window.npcBehaviorManager.getBehavior('gwen_pritchard').sprite;
    const p = window.player, feet = { x: Math.round(p.x), y: Math.round(p.y + 31) };
    window.__ppLog.length = 0;
    window.playerCombat.attack({ x: g.x, y: g.y });
    await new Promise(r => setTimeout(r, 1300));
    const hs = id => !!window.npcHostileSystem.isNPCHostile(id);
    return { feet, facing: p.lastDirection, attacked: window.__ppLog.filter(e => e.ev === 'hit').map(e => e.id),
      turned: window.__ppLog.filter(e => e.ev === 'hostile').map(e => e.id + '@' + e.via),
      gwenHostile: hs('gwen_pritchard'), adaezeHostile: hs('adaeze_okafor'),
      gwenKO: !!window.npcHostileSystem.isNPCKO('gwen_pritchard'), hp: window.playerHealth?.hp ?? null };
  });
  res.punches.push(r);
  if (r.gwenKO || r.adaezeHostile || (r.hp != null && r.hp <= 0)) break;
}
console.log(JSON.stringify(res));
await h.browser.close();
