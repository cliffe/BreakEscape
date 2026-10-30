// t08_flag_station: the SAFETYNET Drop-Site Terminal (flag station) in server_room: rack glow, walk to the terminal, "Enter captured CTF flags".
// Only the prefix "flag{" is typed (then cleared); nothing is submitted, no flag value appears.
// Entry state: head-start in server_room (it is the start room, so unlocked; no VM needed for the station UI):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room server_room --set briefing_played=true
// Record: run-take.sh t08_flag_station "--start-room server_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: establishing (server room, rack glow), approach-terminal, terminal-open (the payoff), typing-start/typing-end ("flag{"), cleared, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';

export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }

export default async (page, bridge, mark) => {
  mark('establishing');
  await sleep(2200);
  mark('approach-terminal');
  const r = await bridge.interact('flag_station_dropsite', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('flag-station', { timeoutMs: 8000 });
  mark('terminal-open');
  await sleep(2200);                                   // the header, the "ENTROPY attack server" tag, the empty field
  mark('typing-start');
  await bridge.minigame.type(0, 'flag{', { submit: false });
  mark('typing-end');
  await sleep(1500);
  await bridge.minigame.type(0, '', { clear: true, submit: false });
  mark('cleared');
  await sleep(700);
  await bridge.minigame.clickText('Close');
  await bridge.waitForMinigameClosed({ timeoutMs: 5000 });
  mark('closed');
  await sleep(1200);
};
