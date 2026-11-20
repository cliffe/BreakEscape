// A real shipped wall (m01): walk down from main_office_area against reception_area's back wall under each recipe.
// Usage: node physics_m01.mjs <gid> <fixedoff|fps20|none> [dx]
import { open } from './lib.mjs';
const [gid, recipe = 'fps20', dxArg = '90'] = process.argv.slice(2);
process.env.NOFIX = '1';
const { browser, page } = await open(gid);
const E = (f, a) => page.evaluate(f, a);
await E(async () => { await window.loadRoom('reception_area'); await window.loadRoom('main_office_area'); });
await E(() => window.__test.enterRoom('main_office_area'));
await E((recipe) => { const g = window.game.sys.game, w = window.game.physics.world;
  if (recipe === 'fixedoff') { g.loop.smoothStep = false; g.loop.minFps = 1; w.fixedStep = false; }
  if (recipe === 'fps20') { g.loop.smoothStep = false; g.loop.minFps = 1; w.setFPS(20); } }, recipe);
const S = await E(() => window.rooms.reception_area.position);
await E(([x, y]) => window.__test.moveTo(x, y), [S.x + Number(dxArg), S.y - 80]);
await E(() => { window.__trace = []; window.game.events.on('postupdate', (t, d) => window.__trace.push([Math.round(window.player.body.bottom * 10) / 10, Math.round(d)])); });
await E(() => window.__test.walk('down', 4500));
await page.waitForTimeout(300);
const r = await E(() => { const t = window.__trace, ys = t.map(a => a[0]); return { frames: t.length, startY: ys[0], endY: ys[ys.length - 1], maxDelta: Math.max(...t.map(a => a[1])), room: window.currentPlayerRoom, x: Math.round(window.player.body.center.x) }; });
console.log(JSON.stringify({ recipe, S, dx: dxArg, ...r }));
await browser.close();
