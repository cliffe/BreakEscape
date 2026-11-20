// Physics recipe comparison: does a wall box stop the player under each headless loop recipe?
// Usage: ~/.cache/ms-playwright-go/1.57.0/node physics_wall.mjs <gid> <recipe> [wall]
//   recipe: none | fixedoff | fps20 | fps20_nosmooth ;  wall: hall_top | hall_bottom
// Records feet y per physics step (scene postupdate) and the frame delta, walking down for 4500 ms.
import { open } from './lib.mjs';
const [gid, recipe = 'fps20', wall = 'hall_top'] = process.argv.slice(2);
process.env.NOFIX = '1';
const { browser, page } = await open(gid);
const E = (fn, arg) => page.evaluate(fn, arg);
await E((recipe) => {
  const g = window.game.sys.game, w = window.game.physics.world;
  if (recipe === 'fixedoff') { g.loop.smoothStep = false; g.loop.minFps = 1; w.fixedStep = false; }
  if (recipe === 'fps20') { g.loop.smoothStep = false; g.loop.minFps = 1; w.setFPS(20); }
  if (recipe === 'fps60') { g.loop.smoothStep = false; g.loop.minFps = 1; }
}, recipe);
if (wall === 'hall_top') { await E(() => window.__test.enterRoom('office_n')); await E(() => window.__test.moveTo(160, -100)); }
else { await E(() => window.__test.moveTo(96, 200)); }
await page.waitForTimeout(500);
await E(() => {
  window.__trace = []; const sc = window.game;
  sc.events.on('postupdate', (t, d) => window.__trace.push([Math.round(window.player.body.bottom * 10) / 10, Math.round(d)]));
});
const start = await E(() => ({ y: window.player.body.bottom, room: window.currentPlayerRoom }));
await E(() => window.__test.walk('down', 4500));
await page.waitForTimeout(400);
const r = await E(() => {
  const t = window.__trace; const ys = t.map(a => a[0]); const ds = t.map(a => a[1]);
  const w = window.game.physics.world;
  return { frames: t.length, minY: Math.min(...ys), maxY: Math.max(...ys), maxDelta: Math.max(...ds), meanDelta: ds.reduce((a, b) => a + b, 0) / ds.length,
    endY: ys[ys.length - 1], room: window.currentPlayerRoom, fixedStep: w.fixedStep, fps: w.fps, ys: ys.filter((_, i) => i % Math.ceil(ys.length / 40) === 0) };
});
console.log(JSON.stringify({ recipe, wall, start, ...r }));
await browser.close();
