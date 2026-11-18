// S4 live proof E: clean "before" shots of both rooms, same viewer position as s4-D-office-evening-after-reload.png.
import { start, install, shot, ev, toKitchen, toOffice, lightState, log, clock } from './showcase-s4-lib.mjs';
const h = await start(process.argv[2]); await install(h);
await toKitchen(h); await ev(h, () => window.__test.moveTo(-200, 120, { timeoutMs: 15000 })).catch(() => {}); await h.t(4000); await shot(h, 'E-kitchen-before');
await toOffice(h); await ev(h, () => window.__test.moveTo(150, 120, { timeoutMs: 15000 })).catch(() => {}); await h.t(4500); await shot(h, 'E-office-before');
console.log(JSON.stringify({ office: await lightState(h, 'office'), kitchen: await lightState(h, 'kitchen'), clock: await clock(h) })); await h.browser.close();
