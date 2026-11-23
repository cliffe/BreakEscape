// t01_chatter_hook: the cold open. A fresh game, the Quayholt room wide before Start (kit_quiet false), nothing pressed. Waits for the scenario-level pool line
// "Phones haven't stopped today." (cached for Anjali 2.02 s, Niamh 2.54 s, Darren 2.69 s; the speaker is whoever draws it) and marks who speaks it and when.
// Feeds hook (in = audio start - 0.3 s, 3.0 s). Entry state: fresh game, no flags, kiosk never touched.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t01_chatter_hook "" "--hide-hud --zoom-step 1"
// The take ends 1.2 s after the line's bubble clears. Other pool lines ("Claims backlog's easing off.", "Cooler's cold for once.") are marked too: if one of those draws first
// the take does not stop early, it keeps waiting up to CA10_HOOK_MAX_S (default 75 s) for the wanted line; retake on a fresh game otherwise.
// Marks: player-sprite, hold-start, bubble-start/end:<npc> (text), hook_line_start (data: speaker, secondsFromHoldStart), hook_line_end, tts (each POST /tts answer), frame:hook, end.
import { sleep, prepare, watchBubbles, checkSprite, watchTts } from './_ca10.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark);
  const tw = watchTts(page, mark);
  await checkSprite(page, mark);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_quiet === true) throw new Error('kit_quiet is already true: chatter is off');
  const t0 = Date.now(); mark('hold-start', { kit_quiet: g.kit_quiet });
  const maxMs = Number(process.env.CA10_HOOK_MAX_S || 75) * 1000;
  let got = null, cleared = false;
  while (Date.now() - t0 < maxMs && !cleared) {
    await bw.drain();
    if (!got) { const e = bw.seen.find(x => /Phones haven't stopped today/i.test(x.text)); if (e) { got = e; mark('hook_line_start', { speaker: e.id, sFromHold: +((e.t - t0) / 1000).toFixed(2) }); await sleep(400); mark('frame:hook'); } }
    else if (!(await page.evaluate((id) => !!(window.npcWorldBubbles && window.npcWorldBubbles.says && window.npcWorldBubbles.says.has(id)), got.id))) { cleared = true; mark('hook_line_end', { speaker: got.id }); }
    await sleep(100);
  }
  await bw.stop(); tw.stop();
  if (!got) throw new Error('"Phones haven\'t stopped today." never spoke in ' + (maxMs / 1000) + ' s; heard: ' + JSON.stringify(bw.seen.map(e => e.id + ': ' + e.text)));
  await sleep(1200); mark('end');
};
