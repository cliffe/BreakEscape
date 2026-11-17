// Live proof for the magnet serving fixes (npc-needs.js). Keyless server, headless, setFPS(20) with fixed
// steps on, /tts aborted by pathname. Make the game first: bin/rails runner tools/playtest/new-game.rb <scenario>.
//   node tools/playtest/magnet-serving-proof.mjs --game 123 --mode eat|hold [--port 3094] [--npcs a,b] [--room open_plan] [--cake cake] [--secs 60]
//   eat:  drop the cake, count servings each NPC takes (perPerson caps it at one each).
//   hold: set every listed NPC to hunger 100 before the drop (and again after), then watch for any walk to it.
import { open, ev, dismiss } from './m01-ol-lib.mjs';
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const GID = arg('game'), MODE = arg('mode', 'eat'), PORT = arg('port', '3094'), CAKE = arg('cake', 'cake');
const NPCS = arg('npcs', 'thandiwe,yasmin').split(','), SECS = Number(arg('secs', '60'));
const h = await open(GID, PORT);
await h.page.route(u => /\/tts$/.test(new URL(u).pathname), r => r.abort());
const snap = () => ev(h, ([ids, cake]) => {
  const sys = window.npcNeedsSystem;
  return {
    servings: window.gameState?.globalVariables?.cake_servings, mag: sys._magnets.get(cake)?.servings,
    log: sys.getLog().filter(e => e.ev === 'serving_taken').map(e => e.npc || e.npcId),
    npcs: Object.fromEntries(ids.map(i => { const s = sys.states.get(i); return [i, s && { hunger: +s.levels.hunger.toFixed(1), job: s.job ? `${s.job.targetId}:${s.job.phase}` : null, ate: s.ate?.[cake] || 0 }]; }))
  };
}, [NPCS, CAKE]);
const ROOM = arg('room', 'open_plan');
await ev(h, id => window.__test.enterRoom(id), ROOM).catch(() => {});
await h.t(3000);
await dismiss(h);
console.log('registered', JSON.stringify(await ev(h, () => [...window.npcNeedsSystem.states.keys()])));
const hold = () => Promise.all(NPCS.map(i => ev(h, n => window.__test.needs.set(n, 'hunger', 100), i)));
if (MODE === 'hold') await hold();
const r = await ev(h, id => window.__test.inventoryAct(id, 'Drop here'), CAKE);
console.log('drop', JSON.stringify(r));
if (MODE === 'hold') await hold();
const t0 = Date.now(); let walked = false, last = "";
while (Date.now() - t0 < SECS * 1000) {
  await h.t(2000);
  const s = await snap();
  if (Object.values(s.npcs).some(n => n?.job?.startsWith(CAKE))) walked = true;
  const k = JSON.stringify(s.npcs.constructor && Object.values(s.npcs).map(n => [n?.job, n?.ate])) + s.servings; if (k !== last) { last = k; console.log(Math.round((Date.now() - t0) / 1000), JSON.stringify(s)); }
}
console.log('RESULT', JSON.stringify({ mode: MODE, walked, final: await snap() }));
await h.browser.close();
