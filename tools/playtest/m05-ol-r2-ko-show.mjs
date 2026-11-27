// R2 fixes m1 and m3. m3: a second server-room entry leaves her needs alone. m1: after a real KO, the corridor and break-room
// show mappings do not switch the KO'd body back on. The server-room entry is the engine's own event emitted by hand (the door is
// locked in a fresh game), so the plain show runs through the same mapping a real entry runs.
import { start, log } from './m05-ol-lib.mjs';
const B = 'bernadette_lyons';
const g = await start(process.argv[2]);
const body = () => g.ev(() => { const b = window.npcBehaviorManager.getBehavior('bernadette_lyons'); const s = b.sprite; const h = window.npcHostileSystem; return { vis: !!s.visible, bodyEnable: s.body ? s.body.enable : null, ko: h.isNPCKO('bernadette_lyons'), koGlobal: window.gameState.globalVariables.bernadette_ko, x: Math.round(s.x), y: Math.round(s.y), alpha: s.alpha }; });
const lv = () => g.ev(() => { const s = window.npcNeedsSystem.getState('bernadette_lyons'); return JSON.stringify(s.levels || s.needs); });
const sre = () => g.ev(() => window.eventDispatcher.emit('room_entered:server_room', { roomId: 'server_room', previousRoom: 'server_hallway' }));
log('initial', JSON.stringify(await body()));
await g.page.evaluate(async () => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal('server_room_entered', true); });
await g.t(1500);
await sre(); await g.t(1500);
log('after 1st server-room entry', JSON.stringify(await body()), 'needs', await lv());
await g.setN(B, 'caffeine', 77); await g.setN(B, 'tidy', 88); await g.t(300);
log('set needs', await lv());
await sre(); await g.t(1500);
log('m3 after 2nd server-room entry (needs must stay near 77/88)', await lv());
// KO by punches
await g.near(B); await g.t(800);
let n = 0;
for (; n < 80; n++) { if (n > 0 && n % 6 === 0) { await g.near(B); await g.t(600); } await g.page.evaluate(() => window.__test.pressKey('f')).catch(() => {}); await g.t(1100); if ((await body()).ko) break; }
await g.t(3000);
const ko = await body(); log('KO after', n + 1, 'punches', JSON.stringify(ko));
await sre(); await g.t(1000); log('server room again', JSON.stringify(await body()));
await g.moveTo(250, 120); await g.t(500);
for (const r of ['main_corridor', 'break_room', 'main_corridor']) { const x = await g.enter(r); log('enter', r, x.ok); await g.t(2500); log('  body', JSON.stringify(await body())); }
await g.ev(() => window.eventDispatcher.emit('door_opened', { connectedRoom: 'break_room', roomId: 'main_corridor' })); await g.t(1000);
log('door_opened', JSON.stringify(await body()));
log('errs', JSON.stringify(g.errs)); await g.browser.close();
