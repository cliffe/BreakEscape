// S3 cake-chat proof (only Graham and Agnieszka hungry, so they share the cake and chat). Variant of showcase-s3-cake.mjs.
// S3 cake-only proof: kitchen entered once, four office staff mid-hungry (tempted band), cake dropped by the desks.
// usage: node showcase-s3-cake.mjs <gid> [hunger=50]
import fs from 'node:fs';
import { start, install, ev, waitAtPost, NPCS, shot, clock, dump, log, needsOf, waitFor, rec, gv } from './showcase-s3-lib.mjs';
const gid = process.argv[2], hung = +(process.argv[3] || 50);
const h = await start(gid); for (const id of NPCS) await waitAtPost(h, id, 60000); await install(h);
await ev(h, () => window.__test.enterRoom('kitchen')); await h.t(800); await ev(h, () => window.__test.moveTo(-250, 262, { timeoutMs: 20000 })).catch(() => {}); await ev(h, () => window.__test.enterRoom('office')); await h.t(1500);
for (const id of NPCS) await waitAtPost(h, id, 60000); await h.t(3000);
await ev(h, hh => { for (const i of ['graham_whitfield', 'agnieszka_duda']) window.__test.needs.set(i, 'hunger', hh); for (const i of ['chidi_okeke', 'jun_watanabe']) window.__test.needs.set(i, 'hunger', 5); }, hung);
await ev(h, () => window.__test.moveTo(150, 150, { timeoutMs: 20000 })).catch(() => {}); await h.t(300);
const R = { gid, hung, before: {} }; for (const i of ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda']) R.before[i] = (await needsOf(h, i))?.needs?.hunger;
const dc = await clock(h); R.dropClock = dc; R.drop = await ev(h, () => window.__test.inventoryAct('cake', 'Drop here')); await h.t(1200); await shot(h, 'C2-cake-dropped');
let shotTurn = false;
const fin = await waitFor(h, () => window.__rec.some(r => r.k === 'emit' && /magnet_finished/.test(r.n || '')), null, 120);
await h.t(4000); await shot(h, 'C2-cake-finished');
const L = (await rec(h)).filter(r => r.c >= dc);
R.finished = fin;
R.events = L.filter(r => r.k === 'emit' && /magnet|npc_turned_back|npc_saw_magnet|npc_left_post/.test(r.n || '') && !/^global/.test(r.n)).map(r => `${r.c} ${r.n} ${(r.d || '').slice(0, 170)}`);
R.jobs = L.filter(r => r.k === 'job' && /cake|magnet|returning|post/.test(r.j)).map(r => `${r.c} ${r.id} ${r.j}`);
R.speaks = L.filter(r => r.k === 'speak').map(r => `${r.c} ${r.id}: ${r.line}`);
R.barks = L.filter(r => r.k === 'bark').map(r => `${r.c} ${r.npc}: ${r.text}`);
R.bubbles = L.filter(r => r.k === 'bubbles').map(r => `${r.c} ${r.who}`);
R.heardExchange = await gv(h, 'heard_exchange_cooler_chat'); R.exchangeEvents = L.filter(r => /exchange/.test(r.n || '')).map(r => `${r.c} ${r.n}`);
R.task = await ev(h, () => window.objectivesManager.getTask('see_cake_eaten')?.status);
R.itemInRoom = await ev(h, () => Object.entries(window.rooms.office.objects).filter(([k, o]) => /cake/.test(o.objectId || k)).map(([k, o]) => ({ k, vis: o.visible })));
console.log(JSON.stringify(R, null, 1)); fs.writeFileSync(`tmp/s3/R-C2-${gid}.json`, JSON.stringify(R)); await dump(h, `run-C2-${gid}`); await h.browser.close();
