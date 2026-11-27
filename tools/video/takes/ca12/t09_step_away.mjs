// t09_step_away: the step-away beat (beat 8) and the end line (beat 10). Kiosk "Before the debrief" panel, Look up, then the room
// beat runs on its own: Thandiwe leaves her open screen and says A1 ("Right, five minutes on the sofa. The plans can wait.", about 5 s
// after Look up, A1 fires ONLY from this piece: kit_ca12_out with kit_quiet), she sits at about 20 s, and Camila, who is already in
// the room beside the kiosk, says C1 ("Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight up.") about 46 s in.
// Entry state, fresh game with the verified --set list (the kiosk then opens straight on the step-away panel):
//   run-take.sh ca12_visitor_tailgater t09_step_away \
//     "--set 'episode_e12_visitor_tailgater_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\",\"defend\"]}' --set episode_e12_visitor_tailgater_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e12_visitor_tailgater_defend_percent=100" \
//     "--hide-hud --zoom-step 1"
// (kit_defend_done alone is not enough: the kiosk reads the episode state.) Needs the avatar window (the player is in frame in the studio).
// Spoiler rules: the take ENDS at the C1 line-end (+0.4 s). The door and screen choice menu opens at about the same moment and
// defaults at about 91 s: mark 'choice-menu-opened' is logged if it shows, and the editor must cut before it. No outcome, no Lorna recap.
// Marks: kiosk-open, frame:step-away-panel, look-up, bubble-start/bubble-end:kit_thandiwe_moyo (A1), frame:a1, frame:t+10/20/30/40 (check
// Camila's walk), bubble-start/bubble-end:kit_camila_ospina for C1 (a world bubble, not a voice line), frame:c1, choice-menu-opened (if seen), end.
import { sleep, prepare, openKiosk, pressButton, waitButton, watchBubbles } from './_ca12b.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const s = await bridge.getState();
  const g = s.globals || {};
  if (g.kit_defend_done !== true) throw new Error('entry state wrong: kit_defend_done is not true; pass the --set list from the header');
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const bw = await watchBubbles(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed');
  await sleep(1800); mark('frame:step-away-panel');
  mark('look-up'); await pressButton(page, /Look up/);
  const tLook = Date.now();
  let a1 = false, menu = false, c1 = null;
  while (Date.now() - tLook < 110000) {
    const el = (Date.now() - tLook) / 1000;
    if (!a1 && bw.seen.some(e => e.id === 'kit_thandiwe_moyo' && /five minutes/i.test(e.text))) { a1 = true; mark('frame:a1'); }
    for (const t of [10, 20, 30, 40]) if (el >= t && el < t + 0.4 && !globalThis['__f' + t]) { globalThis['__f' + t] = 1; mark('frame:t+' + t); }
    await bw.drain();
    c1 = bw.seen.find(e => e.id === 'kit_camila_ospina' && /here for Yasmin/i.test(e.text));
    const st = await bridge.getState();
    if (!menu && (st.interactionMenu || st.activeMinigame || st.blockingUi)) { menu = true; mark('choice-menu-opened', { menu: !!st.interactionMenu, mg: st.activeMinigame && st.activeMinigame.id }); }
    if (c1 && !(await page.evaluate(() => !!(window.npcWorldBubbles && window.npcWorldBubbles.says && window.npcWorldBubbles.says.has('kit_camila_ospina'))))) break;   // C1 is a world bubble: wait for it to close
    await sleep(100);
  }
  for (const t of [10, 20, 30, 40]) delete globalThis['__f' + t];
  if (!c1) { await bw.stop(); await vw.stop(); throw new Error('C1 bubble never seen within 110 s'); }
  await sleep(400); mark('frame:c1'); mark('end');
  await bw.stop(); await vw.stop();
};
