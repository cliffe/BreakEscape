// Slice 3 live proof: glow and LED ratios (DESIGN.md section 12 steps 6 and 7, glow parts). node s3_live.mjs <gid>
import { open, loadRooms, shot, sleep } from './lib.mjs';
const gid = process.argv[2];
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const { browser, page } = await open(gid);
await loadRooms(page, ['reception', 'server', 'office_n']);
const E = (fn, arg) => page.evaluate(fn, arg);
const wait = (src) => E((s) => window.__test.waitUntil(s, { timeoutMs: 8000 }), src);
const walkTo = async (x, y, dir = 'down', ms = 4500) => { await E(([x, y]) => window.__test.moveTo(x, y), [x, y]); await E(([d, ms]) => window.__test.walk(d, ms), [dir, ms]); };
const read = (room, pred) => E(([room, pred]) => {
  const st = window.lightingSystem.rooms.get(room);
  const es = st.emitters.filter(e => !e.indicator || true);
  return es.map((e, i) => ({ i, id: e.obj.objectId || e.obj.name, key: e.key, ind: !!e.indicator, glow: e.glow.alpha, fade: e.fade, gv: e.glow.visible,
    led: e.leds.filter(l => l.img.visible).map(l => l.img.alpha).slice(0, 1)[0] ?? null, ledAlphaDef: e.def?.ledAlpha ?? 1, nleds: e.leds.length, x: e.obj.x, level: st.level, k: e.obj.behindWallK }));
}, [room, pred]);
await E(() => { window.__rm0 = window.lightingSystem.reducedMotion; window.lightingSystem.reducedMotion = true; });

// Step 6 glow: fade_pc in reception
await sleep(page, 400);
const pcBefore = (await read('reception')).find(e => e.id === 'fade_pc' && !e.ind);
console.log('fade_pc emitters', JSON.stringify((await read('reception')).filter(e => e.id === 'fade_pc')));
await walkTo(96, 200);
await wait('() => window.behindWallFade.debugState().rooms.reception?.k === 0.5');
await sleep(page, 150);
const pcHalf = (await read('reception')).find(e => e.id === 'fade_pc' && !e.ind);
await shot(page, 's3_6_pc_glow_faded');
await walkTo(320, 120, 'up', 3000);
await wait('() => !window.behindWallFade.debugState().rooms.reception');
await sleep(page, 200);
const pcFull = (await read('reception')).find(e => e.id === 'fade_pc' && !e.ind);
console.log('pc', JSON.stringify({ pcBefore, pcHalf, pcFull }));
check('6 pc glow faded/full = 0.5 +- 0.01', pcFull?.glow > 0 && Math.abs(pcHalf.glow / pcFull.glow - 0.5) <= 0.01, `half ${pcHalf?.glow} full ${pcFull?.glow} ratio ${(pcHalf.glow / pcFull.glow).toFixed(4)}`);
check('6 pc behindWallK 0.5 while faded, gone after', pcHalf.k === 0.5 && pcFull.k === undefined);

// Step 7 racks in the server strip
const srv = await read('server');
console.log('server emitters', JSON.stringify(srv.map(e => [e.id, e.key, e.nleds, Math.round(e.x), e.glow, e.fade])));
const racks = srv.filter(e => e.nleds > 0 && !e.ind);
check('7 server has rack emitters with LEDs', racks.length > 0);
racks.sort((a, b) => Math.abs(b.x - 440) - Math.abs(a.x - 440));
const rack = racks[0];
await E(() => window.__test.moveTo(440, 200));
await sleep(page, 400);
const full = (await read('server')).find(e => e.id === rack.id && e.key === rack.key);
await E(() => window.__test.walk('down', 4500));
await wait('() => window.behindWallFade.debugState().rooms.server?.k === 0.5');
await sleep(page, 150);
const half = (await read('server')).find(e => e.id === rack.id && e.key === rack.key);
await shot(page, 's3_7_rack_faded');
console.log('rack', JSON.stringify({ full, half }));
const on = await E(() => window.lightingSystem.rooms.get('server').on);
check('7 server still off', on === false);
check('7 rack glow ratio 0.5 +- 0.01, fade > 0.99', full.glow > 0 && Math.abs(half.glow / full.glow - 0.5) <= 0.01 && full.fade > 0.99 && half.fade > 0.99, `full ${full.glow} half ${half.glow} ratio ${(half.glow / full.glow).toFixed(4)} fade ${full.fade}/${half.fade}`);
const want = 0.5 * 0.95 * half.ledAlphaDef;
check('7 rack LED alpha = 0.5*0.95*ledAlpha +- 1e-3', half.led != null && Math.abs(half.led - want) < 1e-3, `led ${half.led} want ${want}; unfaded ${full.led}`);
await E(() => { window.lightingSystem.reducedMotion = window.__rm0; });
await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);
