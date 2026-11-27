// R4 part 3 (Test 14): does hallway_east's motion light (mode motion, offAfter 75) switch on when Maya walks
// through it with the player in the main office? Needs WebGL (SwiftShader) so window.lightingSystem exists.
//   node tools/playtest/m01-ol-hall-light.mjs <gameId> [port=3095]
import { createRequire } from 'node:module';
import { EXEC, load, ev, waitAtPost } from './m01-ol-lib.mjs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/node_modules/');
const { chromium } = require('playwright-core');
const [gid, port = '3095'] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, executablePath: EXEC, args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
const url = `http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`;
const h = { page, errs: [], url, t: ms => page.waitForTimeout(ms) };
await load(h, url);
const log = (k, v) => console.log(k, JSON.stringify(v));
const go = async (...rooms) => { for (const r of rooms) { for (let k = 0; k < 3; k++) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); if (x.ok) break; console.log('enterRoom failed', r, x.reason); await h.t(1500); } await h.t(1500); } };
const hall = () => ev(h, () => { const st = window.lightingSystem?.rooms?.get('hallway_east'); return st ? { on: !!st.on, mode: st.mode } : null; });
const maya = () => ev(h, () => { const sp = window.npcBehaviorManager?.getBehavior('maya_chen')?.sprite; const s = window.__test.needs.state('maya_chen'); return { x: sp ? +(sp.body.center.x / 32).toFixed(1) : null, y: sp ? +(sp.body.center.y / 32).toFixed(1) : null, mode: s?.mode, job: s?.job?.phase || null }; });
log('lightingSystem present', await ev(h, () => !!window.lightingSystem));
log('hall initial', await hall());
await go('hallway_east', 'maya_office');
log('maya at post', await waitAtPost(h, 'maya_chen', 20000));
log('hall with player passing', await hall());
await go('hallway_east', 'main_office_area');
log('player room', await ev(h, () => window.currentPlayerRoom));
// wait for the offAfter timer (75 s) to switch the hall off
const t0 = Date.now(); let st = await hall();
while (st?.on && Date.now() - t0 < 110000) { await h.t(2000); st = await hall(); }
log('hall after player left', { st, waitedS: Math.round((Date.now() - t0) / 1000) });
const offBefore = st && !st.on;
await ev(h, () => window.__test.needs.set('maya_chen', 'thirst', 20));
const seq = []; const t1 = Date.now(); let lastK = '';
while (Date.now() - t1 < 70000) {
  const m = await maya(), l = await hall(); const k = JSON.stringify([l?.on, m.job, m.mode]);
  if (k !== lastK) { seq.push({ t: Math.round((Date.now() - t1) / 1000), hallOn: l?.on, maya: m }); lastK = k; }
  if (m.job === 'using') break;
  await h.t(400);
}
for (const s of seq) log('seq', s);
const hallOnWhileMayaInHall = seq.some(s => s.hallOn && s.maya.y !== null);
log('RESULT', { hallWasOffBefore: offBefore, hallEverOn: seq.some(s => s.hallOn) });
log('errors', h.errs);
await browser.close();
