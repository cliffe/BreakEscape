// t07_terminal: the IT Monitoring Station (a desktop with the "Server Access Log" file) in it_room.
// SPOILER NOTE: the log text names Derek Lawson three times. Marks 'desktop-shown' and 'file-open' separate the harmless desktop from the log text;
// the editor should cut before 'file-open' (or crop) if the culprit must stay unnamed.
// Entry state: head-start in it_room:
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room it_room --set briefing_played=true
// Record: run-take.sh t07_terminal "--start-room it_room --set briefing_played=true" "--hide-hud --zoom-step 1"
import { sleep, clearScreen } from '../lib/lib.mjs';

export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }

export default async (page, bridge, mark) => {
  await sleep(1200);
  const pc = (await bridge.getState()).nearby.find(n => n.name === 'IT Monitoring Station');
  if (!pc) throw new Error('IT Monitoring Station not found');
  mark('approach-station');
  const r = await bridge.interact(pc.id, { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('container', { timeoutMs: 8000 });
  mark('desktop-shown');
  await sleep(2200);
  const t = await bridge.minigame.take('Server Access Log');
  mark('file-open', { ok: t && t.ok });
  await sleep(3500);                                  // the log on screen
  mark('file-linger-end');
  await bridge.minigame.close();
  await sleep(500);
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(1200);
};
