// S2 timed runs. usage: node showcase-s2-run.mjs <gid> <mode>
//   A  full morning, no nudge: viewer near office coffee, kitchen at ~1:50, back for second queue, lever pulled with a queue
//   B  kitchen opened at 0:30 (T6b)
//   C  kitchen held shut until 3:30 (T9)
import { start, install, ev, waitAtPost, NPCS, shot, clock, dump, objPos, lever, waitClock, waitFor, queuers, log } from './showcase-s2-lib.mjs';
const gid = process.argv[2], mode = process.argv[3] || 'A';
const h = await start(gid);
for (const id of NPCS) await waitAtPost(h, id, 60000);
await install(h);
const near = async () => { await ev(h, () => window.__test.moveTo(300, 296, { timeoutMs: 20000 })).catch(() => {}); };
const kitchen = async () => { await ev(h, () => window.__test.enterRoom('kitchen')); await h.t(800); await ev(h, () => window.__test.moveTo(-250, 262, { timeoutMs: 20000 })).catch(() => {}); };
const office = async () => { await ev(h, () => window.__test.enterRoom('office')); await h.t(800); await near(); };
log(await clock(h), 'start', mode);
let shotQ = false; const shotXs = new Set();
const sweep = async (untilClock, fnEach) => { while (await clock(h) < untilClock) { await fnEach?.(); await h.t(500); } };
const watchShots = async () => {
  if (!shotQ && (await queuers(h)).length >= 2) { await h.t(1500); await shot(h, `s2-${mode}-queue`); shotQ = true; log(await clock(h), 'shot queue', await queuers(h)); }
  const sp = await ev(h, () => { const b = window.npcWorldBubbles, r = (window.__rec || []).filter(x => x.k === 'speak' && /exchange_cooler_chat/.test(x.info)).slice(-1)[0]; return b && r && (b.showsBubble('graham_whitfield') || b.showsBubble('agnieszka_duda')) ? r.id : null; });
  if (sp && !shotXs.has(sp)) { shotXs.add(sp); await shot(h, `s2-${mode}-exchange-${sp.split('_')[0]}`); log(await clock(h), 'shot exchange speaker', sp); }
};
const qNow = () => ev(h, () => window.__test.needs.ids().some(i => /queue/.test(`${window.__test.needs.state(i)?.job?.phase}`)));
if (mode === 'A') {
  await near(); await sweep(105, watchShots);
  await kitchen(); log(await clock(h), 'kitchen entered (door open)');
  await sweep(202, watchShots);
  await office(); log(await clock(h), 'back in office');
  const ok = await waitFor(h, () => window.__test.needs.ids().some(i => /queue/.test(`${window.__test.needs.state(i)?.job?.phase}`)), null, 280);
  log(await clock(h), 'second queue present', ok, await queuers(h));
  await h.t(1200); await lever(h); log(await clock(h), 'lever pulled');
  await h.t(2500); await shot(h, 's2-A-coffee-off'); await sweep((await clock(h)) + 25, watchShots);
}
if (mode === 'D') {
  await kitchen(); log(await clock(h), 'kitchen opened'); await h.t(1500); await office();
  const ok = await waitFor(h, () => window.__test.needs.ids().some(i => /queue/.test(`${window.__test.needs.state(i)?.job?.phase}`)), null, 120);
  log(await clock(h), 'first queue present', ok, await queuers(h));
  await h.t(1200); await lever(h); log(await clock(h), 'lever pulled');
  await h.t(2500); await shot(h, 's2-D-coffee-off'); await sweep((await clock(h)) + 60, watchShots);
  // switch back on: second click on the socket
  await lever(h); log(await clock(h), 'lever pulled again (back on?)', await ev(h, () => window.gameState.globalVariables.office_coffee_off));
  await sweep((await clock(h)) + 15);
}
if (mode === 'B') {
  await near(); await sweep(30); await kitchen(); log(await clock(h), 'kitchen opened at 0:30');
  await h.t(1500); await office(); await sweep(90, watchShots);
  log(await clock(h), 'queue check', await queuers(h));
  await sweep(125, watchShots);
}
if (mode === 'F') {
  await sweep(20); await kitchen(); log(await clock(h), 'viewer in kitchen from 0:20, door open');
  await sweep(125, watchShots);
  log(await clock(h), 'hear_queue_chat while viewer elsewhere', await ev(h, () => window.objectivesManager.getTask('hear_queue_chat').status));
}
if (mode === 'C') {
  await near(); await sweep(210, watchShots); log(await clock(h), 'still shut at 3:30');
  await kitchen(); log(await clock(h), 'kitchen opened at 3:30 (door open)');
  await sweep(300, watchShots);
}
await dump(h, `run-${mode}-${gid}`);
log(await clock(h), 'tasks', JSON.stringify(await ev(h, () => ['see_queue', 'hear_queue_chat', 'see_coffee_off', 'hear_cooler_exchange'].map(t => [t, window.objectivesManager.getTask(t)?.status]))));
console.log('errs', h.errs); await h.browser.close();
