// t02_hax_briefing: Agent HaX's opening briefing in reception (cutscene with the game's subtitle bar and portrait).
// Entry state: fresh game: PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact
// Record: run-take.sh t02_hax_briefing "" ""
// The briefing starts itself on game_loaded (just before the recording's start slate, so the first two lines may be missed; the take
// starts at the first menu). Path: "How urgent is this?" -> "Whatever they're planning, it's active. And it's dangerous." (scout hax_1, 3.5 s).
// Marks: line-start:/line-end:<text> for every voiced line; 'hax_1-done' after hax_1 has finished; then a linger.
import { sleep, watchVoice } from '../lib/lib.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  // wait for the first menu (the opening two lines auto-advance, voiced)
  let d = null;
  for (let i = 0; i < 300; i++) { d = (await bridge.getState()).dialogue; if (d && d.awaitingChoice) break; await sleep(100); }
  if (!d || !d.awaitingChoice) throw new Error('briefing menu never appeared');
  mark('menu-shown', { choices: d.choices.map(c => c.text) });
  await sleep(1200);                               // let the viewer read the options
  const r = await bridge.minigame.choose('^How urgent is this');
  mark('choice', { ok: r && r.ok, chose: r && r.chose });
  const l = await vw.waitForLine(/it's active\. And it's dangerous/i, 40000);
  if (!l) throw new Error('hax_1 never played');
  mark('hax_1-done', { durMs: l.durMs });
  await sleep(1500);                               // linger on the payoff
  await vw.stop();
};
