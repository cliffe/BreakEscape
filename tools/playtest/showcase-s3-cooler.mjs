// S3 proof: the cooler exchange plays at the water cooler (topic "cooler"). Natural run, no needs nudges.
// usage: PORT=3094 node showcase-s3-cooler.mjs <gid>
import fs from 'node:fs';
import { start, install, ev, waitAtPost, NPCS, shot, clock, dump, rec, gv } from './showcase-s3-lib.mjs';
const gid = process.argv[2];
const h = await start(gid); for (const id of NPCS) await waitAtPost(h, id, 60000); await install(h);
// log chat topics as they begin (the chat record carries the topic)
await ev(h, () => { const sys = window.npcNeedsSystem; window.__chatTopics = {}; setInterval(() => { for (const [k, c] of sys._chats) { const t = `${c.a}+${c.b}|${c.topic}|${c.objectId}`; if (!window.__chatTopics[t]) window.__chatTopics[t] = +(sys.clockMs / 1000).toFixed(1); } }, 200); });
await ev(h, () => window.__test.enterRoom('kitchen')); await h.t(800); await ev(h, () => window.__test.moveTo(-250, 262, { timeoutMs: 20000 })).catch(() => {});
const R = { gid };
for (let i = 0; i < 600; i++) { if (await gv(h, 'heard_exchange_cooler_chat')) break; if ((await clock(h)) > 420) break; await h.t(1000); }
R.clock = await clock(h); R.heard = await gv(h, 'heard_exchange_cooler_chat'); R.topics = await ev(h, () => window.__chatTopics);
const L = await rec(h);
R.speaks = L.filter(r => r.k === 'speak').map(r => `${r.c} ${r.id}: ${r.line}`);
R.exch = L.filter(r => r.k === 'emit' && /exchange/.test(r.n || '')).map(r => `${r.c} ${r.n} ${(r.d || '').slice(0, 150)}`);
await shot(h, 'cooler-exchange'); console.log(JSON.stringify(R, null, 1)); await dump(h, `run-cooler-${gid}`); await h.browser.close();
