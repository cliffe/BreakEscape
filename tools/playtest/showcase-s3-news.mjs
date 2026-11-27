// S3 news_cake probe: cake dropped in the kitchen while Chidi eats there; does he announce it back in the office?
import fs from 'node:fs';
import { start, install, ev, waitAtPost, NPCS, shot, clock, dump, log, needsOf, waitFor, rec } from './showcase-s3-lib.mjs';
const gid = process.argv[2];
const h = await start(gid); for (const id of NPCS) await waitAtPost(h, id, 60000); await install(h);
await ev(h, () => window.__test.enterRoom('kitchen')); await h.t(1500);
await ev(h, () => { window.__test.needs.set('chidi_okeke', 'hunger', 20); window.__test.needs.set('jun_watanabe', 'hunger', 20); });
const R = { gid };
R.inKitchen = await waitFor(h, () => ['chidi_okeke', 'jun_watanabe'].some(i => { const s = window.__test.needs.state(i); return s.job?.phase === 'using' && window.npcManager.npcs.get(i)?.roomId === 'kitchen'; }), null, 90);
log(await clock(h), 'someone using in kitchen', R.inKitchen, await ev(h, () => ['chidi_okeke', 'jun_watanabe'].map(i => [i, window.npcManager.npcs.get(i)?.roomId, window.__test.needs.state(i).job?.phase])));
const dc = await clock(h); R.dropClock = dc; R.drop = (await ev(h, () => window.__test.inventoryAct('cake', 'Drop here'))).ok; await h.t(1500); await shot(h, 'F-kitchen-drop');
await h.t(45000);
const L = (await rec(h)).filter(r => r.c >= dc);
R.events = L.filter(r => r.k === 'emit' && /npc_announced|npc_told|magnet|npc_saw_magnet|npc_turned_back/.test(r.n || '')).map(r => `${r.c} ${r.n} ${(r.d || '').slice(0, 200)}`);
R.speaks = L.filter(r => r.k === 'speak').map(r => `${r.c} ${r.id}: ${r.line}`);
R.jobs = L.filter(r => r.k === 'job' && /cake|returning|post/.test(r.j)).map(r => `${r.c} ${r.id} ${r.j} ${r.room}`);
console.log(JSON.stringify(R, null, 1)); fs.writeFileSync(`tmp/s3/R-F-${gid}.json`, JSON.stringify(R)); await dump(h, `run-F-${gid}`); await h.browser.close();
