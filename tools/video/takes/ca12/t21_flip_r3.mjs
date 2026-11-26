// t21_flip_r3: the flip panel for the ca12 r3 trailer, one take per cut (desk_pass and tailgated). The kiosk's flip screen with only the
// heading, the E5 line and Continue showing. Script: docs/video/scripts/ca12_trailer_script_r3.md 5.1 (t21_flip_r3).
// The outcome is read from the seeded globals (ca12_desk_pass or ca12_tailgated), so the entry flags decide it; set CA12_FLIP_OUTCOME=desk_pass
// or tailgated to make the script refuse a mismatch. Both seed the episode at the flip stage with a pretext call record:
//   desk_pass: the call landed (got_it): the flip shows call replay parts (hidden by the CSS below), heading "Now you're the one on the desk",
//     E5 line "One conversation got you past desk and door." (L3).
//   tailgated: the call was walked away from: nothing to replay (the `missed` branch of flip-view.js), heading "In behind a member of staff",
//     E5 line "The door held, so nobody had to say yes." (L3b).
// Entry states (fresh game; run from the repo root; no inner single quotes: run-take.sh splits the flags unquoted; BE_PORT=<n> for the keyless server):
//   desk_pass:
//     tools/video/takes/run-take.sh ca12_visitor_tailgater t21_flip_r3 "--set episode_e12_visitor_tailgater_state={\"done\":[\"brief\",\"osint\",\"write\"],\"sent\":{\"kind\":\"call\",\"callId\":\"merrin_front_desk\",\"outcome\":\"got_it\"}} --set ca12_desk_pass=true --set pretext_merrin_front_desk_outcome=got_it" "--hide-hud --zoom-step 1"
//   tailgated (the same take id overwrites: pass a different output by running one cut at a time, or copy the take files between runs):
//     tools/video/takes/run-take.sh ca12_visitor_tailgater t21_flip_r3 "--set episode_e12_visitor_tailgater_state={\"done\":[\"brief\",\"osint\",\"write\"],\"sent\":{\"kind\":\"call\",\"callId\":\"merrin_front_desk\",\"outcome\":\"walked_away\"}} --set ca12_tailgated=true --set pretext_merrin_front_desk_outcome=walked_away" "--hide-hud --zoom-step 1"
// setup() (off camera): Resume, Skip tutorial, closes the Brief, checks the seeded globals, and injects the CSS before the hand-back:
//   .aw-flip .aw-lead, .aw-flip .aw-flip-call, .aw-flip .aw-call-notes, .aw-flip .aw-tells { display: none !important }
// The body then opens the kiosk (the join is a glitch into the panel, so the panel opens on camera).
// Spoiler rules: no call replay, no notes, no tells, no queue; Continue is never pressed.
// Marks: start-hold, interact:training_kiosk, frame:flip-up (first frame with the panel fully drawn: heading and E5 line both visible, laid out and
// stable for two polls), rect:aw-heading, rect:aw-defender-line, rect:aw-flip (the whole block, to decide inset vs burned caption: a block
// 540 source px wide or less takes the 2x inset), outcome, end. Points: in = frame:flip-up, out = in + 5.452 s; the take holds 6.4 s after flip-up.
import { sleep, prepare, interactRetry, buttons } from './_ca12b.mjs';

const CSS = '.aw-flip .aw-lead, .aw-flip .aw-flip-call, .aw-flip .aw-call-notes, .aw-flip .aw-tells { display: none !important }';

const seeded = (page) => page.evaluate(() => {
  const g = window.gameState?.globalVariables || {};
  return { desk_pass: !!g.ca12_desk_pass, tailgated: !!g.ca12_tailgated, state: g.episode_e12_visitor_tailgater_state || null };
});

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const s = await seeded(page);
  const outcome = s.tailgated ? 'tailgated' : (s.desk_pass ? 'desk_pass' : null);
  if (!outcome) throw new Error('entry state wrong: neither ca12_desk_pass nor ca12_tailgated is set (--set ...)');
  if (s.desk_pass && s.tailgated) throw new Error('entry state wrong: both ca12_desk_pass and ca12_tailgated are set');
  const want = process.env.CA12_FLIP_OUTCOME;
  if (want && want !== outcome) throw new Error('CA12_FLIP_OUTCOME=' + want + ' but the seeded globals say ' + outcome);
  if (!s.state || !(s.state.done || []).includes('write') || (s.state.done || []).includes('flip')) throw new Error('episode state must be at the flip stage (done brief, osint, write), got ' + JSON.stringify(s.state));
  await page.addStyleTag({ content: CSS });
  await sleep(300);
}

const rectOf = (page, sel) => page.evaluate((s) => {
  const e = document.querySelector(s); if (!e || !e.offsetParent) return null;
  const r = e.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), text: (e.innerText || '').trim().slice(0, 120) };
}, sel).catch(() => null);

export default async (page, bridge, mark) => {
  const s = await seeded(page);
  const outcome = s.tailgated ? 'tailgated' : 'desk_pass';
  mark('outcome', { outcome });
  mark('start-hold'); await sleep(1200);
  await interactRetry(bridge, 'training_kiosk', mark);
  // first frame with the panel fully drawn: heading and defender line both on screen, same rects on two polls 100 ms apart
  const t0 = Date.now(); let h = null, l = null, prev = '';
  while (Date.now() - t0 < 15000) {
    h = await rectOf(page, '.aw-flip .aw-heading'); l = await rectOf(page, '.aw-flip .aw-defender-line');
    const key = JSON.stringify([h, l]);
    if (h && l && key === prev) break;
    prev = key; h = l = null; await sleep(100);
  }
  if (!h || !l) throw new Error('the flip panel never drew: buttons ' + JSON.stringify((await buttons(page)).slice(0, 8)));
  mark('frame:flip-up', { heading: h.text, line: l.text });
  mark('rect:aw-heading', h); mark('rect:aw-defender-line', l);
  mark('rect:aw-flip', await rectOf(page, '.aw-flip'));
  mark('rect:aw-continue', await rectOf(page, '.aw-flip .aw-continue'));
  // a leftover call replay or tells list means the CSS did not take: refuse, it would be a spoiler
  const leaked = await page.evaluate(() => [...document.querySelectorAll('.aw-flip .aw-lead, .aw-flip .aw-flip-call, .aw-flip .aw-call-notes, .aw-flip .aw-tells')].filter(e => e.offsetParent).length);
  if (leaked) throw new Error('flip content still visible under the injected CSS: ' + leaked + ' nodes');
  await sleep(6400);                                    // out = flip-up + 5.452 s, with margin
  mark('end');
};
