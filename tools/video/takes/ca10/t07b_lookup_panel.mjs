// t07b_lookup_panel: the Look up panel shot (step_away, edit 0-3.2 s of the take). Step-away entry state, open the kiosk (it opens on THE TRAINING ROOM step-away panel), hold; STOPS BEFORE ANY CLICK
// (Look up is never pressed, so D1 never fires). Framed on the heading, text and the Look up button. Hides the green team tally and any score or percent line.
// Entry state (step-away; "defend" in done; the 85+ percent would set kit_caught, so 100 is only safe here because the debrief is never reached; keep as the handover recorded):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t07b_lookup_panel "--set episode_e10_downloads_and_fake_checks_state={\"done\":[\"brief\",\"osint\",\"build\",\"write\",\"flip\",\"defend\"]} --set episode_e10_downloads_and_fake_checks_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e10_downloads_and_fake_checks_defend_percent=100" "--hide-hud --zoom-step 1"
// Marks: player-sprite, kiosk-open, panel (data: buttons, text), hold-end, end; frame:panel.
import { sleep, prepare, openKiosk, waitButton, buttons, css, hideText, checkSprite } from './_ca10.mjs';

export const HIDE = `.aw-team-tally, .tri-tally, .mail-tally { display: none !important; }`;
export const NARROW = `.minigame-game-container .aw-root, .aw-panel, .aw-flip { max-width: 560px !important; }`;

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true) throw new Error('entry state wrong: kit_defend_done is not true');
}

export async function body(page, bridge, mark, narrow) {
  await css(page, HIDE + (narrow ? NARROW : ''));
  await hideText(page, /Phish stopped for the team/i);
  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(600);
  mark('panel', { buttons: await buttons(page), text: (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).slice(0, 500) }); mark('frame:panel');
  await sleep(3200); mark('hold-end'); mark('frame:hold-end'); mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
