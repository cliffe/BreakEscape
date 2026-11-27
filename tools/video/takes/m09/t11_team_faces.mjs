// t11_team_faces (m09, keyless, NOT YET RUN): the Citadel team flash. Fresh briefing, skipped fast (350 ms per line) through the_wall > [Who are the last two?] > the_suspect > questions > [Let's go.] > the_team; then holds 1.4 s on each portrait as the speaker changes: Anchor (Quintero), Malhotra, Arakawa, Lantern (Kowalczyk). Picture only (the edit uses no audio). Stops after Lantern. Never reaches the_answer.
// Entry state (new-game): --imports=none   Record flags: ""
// Record: MISSION=m09 run.sh frank_callahan t11_team_faces "--imports=none" ""
// Marks: briefing-open, choice:*, face:<speaker> (the portrait is up), team-done. Read the four speaker names from the marks.
import { sleep } from '../lib/lib.mjs';
export default async (page, bridge, mark) => {
  let d = null; for (let i = 0; i < 200; i++) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(100); }
  if (!d) throw new Error('briefing never opened'); mark('briefing-open');
  const want = [/Anchor|Quintero/i, /Malhotra/i, /Arakawa/i, /Lantern|Kowalczyk/i]; const seen = new Set(); let inTeam = false; const t0 = Date.now();
  while (Date.now() - t0 < 300000 && seen.size < 4) {
    d = (await bridge.getState()).dialogue; if (!d) { await sleep(150); continue; }
    if (d.awaitingChoice) {
      const re = d.choices.some(c => /Who are the last two/i.test(c.text)) ? /Who are the last two/i : /Let.s go/i;
      if (!d.choices.some(c => re.test(c.text))) throw new Error('unexpected menu ' + JSON.stringify(d.choices.map(c => c.text)));
      await sleep(300); const ch = await bridge.minigame.choose(re); mark('choice:' + (ch && ch.chose)); continue;
    }
    if (/Quintero leads on the ground/i.test(d.text || '')) inTeam = true;
    const idx = want.findIndex(r => r.test(d.speaker || ''));
    if (inTeam && idx >= 0 && !seen.has(idx)) { seen.add(idx); mark('face:' + d.speaker); await sleep(1400); }
    if (seen.size >= 4) break;
    if (d.canContinue) await bridge.minigame.continue_().catch(() => {});
    await sleep(inTeam ? 500 : 350);
  }
  if (seen.size < 4) throw new Error('faces seen: ' + seen.size);
  mark('team-done'); await sleep(300);
};
