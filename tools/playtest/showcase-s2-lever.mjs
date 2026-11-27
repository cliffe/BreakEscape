// T7 machine states: open kitchen, lever off, read both machines, lever on, read both, then let the next coffee run queue in the office.
import { start, install, ev, waitAtPost, NPCS, shot, clock, dump, lever, waitClock, queuers, log } from './showcase-s2-lib.mjs';
const h = await start(process.argv[2]);
for (const id of NPCS) await waitAtPost(h, id, 60000);
await install(h);
const st = (tag) => ev(h, () => { const s = window.npcNeedsSystem, os = s._objects(); const f = id => { const o = os.find(x => x.id === id); return o ? (s._isOff(o) ? 'off' : 'on') : 'missing'; }; return { office_coffee: f('office_coffee'), kitchen_coffee: f('kitchen_coffee') }; }).then(r => log(null, tag, JSON.stringify(r)));
await st('start');
await ev(h, () => window.__test.enterRoom('kitchen')); await h.t(1500); await st('kitchen opened'); await ev(h, () => window.__test.enterRoom('office')); await h.t(800);
await ev(h, () => window.__test.moveTo(300, 296, { timeoutMs: 20000 })).catch(() => {});
await lever(h); log(await clock(h), 'lever off'); await st('after lever off');
await waitClock(h, 20);
await lever(h); log(await clock(h), 'lever on'); await st('after lever on');
const ok = await (async () => { for (;;) { const q = await ev(h, () => window.__test.needs.ids().map(i => window.__test.needs.state(i)?.job).filter(Boolean).map(j => `${j.targetId}:${j.phase}`)); if (q.some(x => /queued|using/.test(x))) { log(await clock(h), 'jobs', q); return q; } if (await clock(h) > 90) return null; await h.t(500); } })();
await dump(h, 'run-E-' + process.argv[2]);
await h.browser.close();
