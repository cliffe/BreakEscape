// Test 10 (music): punch Fatima then Graham through playerCombat. Expect threat when the first turns hostile,
// threat to stay while one is still conscious, noir (exactly one switch) when the last is KO.
//   node tools/playtest/m01-ol-music.mjs <gameId> [port=3095]
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port = '3095'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
let fails = 0; const expect = (n, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fails++; log(ok ? 'PASS' : 'FAIL', { n, got, want }); };
await h.t(9000);
await ev(h, () => { window.__sw = []; const mc = window.MusicController, o = mc.switchPlaylist.bind(mc); mc.switchPlaylist = (...a) => { window.__sw.push(a[0]); return o(...a); }; });
const pl = () => ev(h, () => window.MusicController?.getState?.()?.playlist ?? null);
const sw = () => ev(h, () => window.__sw);
log('start playlist', await pl());
const st = id => ev(h, i => ({ hostile: window.npcHostileSystem.isNPCHostile(i), ko: window.npcHostileSystem.isNPCKO(i) }), id);
const near = id => ev(h, i => window.__test.moveToNear(i, { timeoutMs: 15000 }), id).catch(() => {});
const punch = id => ev(h, i => { const s = window.npcBehaviorManager.getBehavior(i).sprite; window.playerCombat.attack({ x: s.x, y: s.y }); return true; }, id);
async function until(id, key, n) {
  await near(id);
  for (let i = 0; i < n; i++) { await punch(id); await h.t(450); if ((await st(id))[key]) return i + 1; if (i % 3 === 2) await near(id); }
  return null;
}
const hostF = await until('fatima_begum', 'hostile', 12);
log('fatima hostile after punches', hostF); await h.t(2000);
expect('first extra hostile: threat', await pl(), 'threat');
const koF = await until('fatima_begum', 'ko', 60);
log('fatima KO after punches', koF); await h.t(2500);
log('after fatima KO', { pl: await pl(), sw: await sw(), g: await st('graham_whitfield') });
const gHost = (await st('graham_whitfield')).hostile;
log('graham hostile through the event (alarm)?', gHost);
if (!gHost) { const x = await until('graham_whitfield', 'hostile', 12); log('graham hostile after punches', x); await h.t(2000); }
expect('second extra hostile: threat', await pl(), 'threat');
const koG = await until('graham_whitfield', 'ko', 60);
log('graham KO after punches', koG); await h.t(3000);
expect('both KO: noir', await pl(), 'noir');
log('switch calls', await sw());
expect('last switch is noir', (await sw()).slice(-1), ['noir']);
expect('no switch to noir before the last KO', (await sw()).filter(x => x === 'noir').length, 1);
log('errors', h.errs.filter(e => !/503/.test(e)));
console.log('FAILS', fails);
await h.browser.close();
