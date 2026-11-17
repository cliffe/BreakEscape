import fs from 'node:fs';
import { start, settle, monitor, monitor2, mlog, absLog, traj, globs, pos, tp, brewIdle, drive } from './m10-ol-b2b-lib.mjs';
import { probe } from './m10-ol-lib.mjs';
const [gid, order, phase = 'A'] = process.argv.slice(2);
const OUT = `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/b2b/out-${gid}-${order}-${phase}.json`;
const R = { gid, order, phase, notes: [] };
const say = (...a) => { console.log(...a); R.notes.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')); };
const POS = { table: [290, 244], door: [599, 120] };
const g = await start(gid);
await monitor(g); await monitor2(g);
const save = async () => { R.abs = await absLog(g); R.mlog = await mlog(g); R.traj = await traj(g); R.errs = g.errs; R.logs = g.logs; fs.writeFileSync(OUT, JSON.stringify(R)); };
if (phase === 'A') {
  const s = await settle(g.page, g.t, 120000); say('settle steps', s.length);
  say('idle after first brew', await brewIdle(g));
  say('cooldown wait 160 s'); await g.t(160000);
  say('globals', await globs(g)); say('probe', await probe(g));
  say('near console', JSON.stringify(await g.ev(() => window.__test.moveToNear('gate_console'))).slice(0, 120));
  R.tConsole = await g.ev(() => Date.now());
  await g.ev(() => window.__test.interact('gate_console')); await g.t(1500);
  await g.ev(() => window.__test.minigame.close());
  R.posAtChat = {};
  const r = await drive(g, { maxMs: 60000, onChat: async (npc) => { R.posAtChat[npc] = await pos(g); if (npc === 'arakawa_gate' && POS[order]) { await tp(g, ...POS[order]); await g.t(300); R.posAtChat.arakawa_after_tp = await pos(g); } },
    until: async () => (await globs(g, /arakawa_call_done/)).arakawa_call_done === true && !(await g.ev(() => !!window.__test.getState().activeMinigame)) });
  say('drive', r);
  R.tCall = await g.ev(() => Date.now()); say('player at close', await pos(g));
  // watch 55 s
  await g.t(55000);
  say('globals', await globs(g)); say('probe', await probe(g));
  await save();
  if (order === 'console') {
    // check 3: second talk with Arakawa inside cooldown
    say('idle', await brewIdle(g, 60));
    R.tTalk2 = await g.ev(() => Date.now());
    say('near arakawa', JSON.stringify(await g.ev(() => window.__test.moveToNear('arakawa_gate'))).slice(0, 160));
    say('int arakawa', JSON.stringify(await g.ev(() => window.__test.interact('arakawa_gate'))).slice(0, 160));
    say('drive2', await drive(g, { maxMs: 40000, stopAfterChat: true }));
    await g.t(20000);
    await save();
  }
}
await save();
await g.close();
