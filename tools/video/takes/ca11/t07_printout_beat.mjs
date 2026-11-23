// t07_printout_beat: the end beat. Kiosk opens on the step-away panel ("THE TRAINING ROOM" in the script; the panel's own title is read in t07b), Look up is pressed, the printout is revealed
// (kit_ca11_out) at the press, Yusuf walks to the tray (3.5, 3.7) and barks on arrival: "This printout isn't ours. It's a care home's resident list, with health notes on it. Someone sent it here by
// mistake." (8.62 s cached; the edit uses sentences 1 and 2, 0.27 to 5.86 s, plus 0.2 s). The game's speech bubble prints all three sentences: it is hidden in every format (box.setVisible forced false from the
// start of the take) and sentences 1 and 2 are burned as captions. Nothing is clicked after Look up.
// Entry state (defend complete, not caught, kit_quiet true; percent under 85):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca11_misdirected_data t07_printout_beat \
//     "--set episode_e11_misdirected_data_state={\"done\":[\"brief\",\"mistake\",\"flip\",\"defend\"]} --set episode_e11_misdirected_data_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true --set episode_e11_misdirected_data_defend_percent=60" \
//     "--hide-hud --zoom-step 1"
// Marks: player-sprite, bubble-hidden-on, kiosk-open, press (the Look up click), printout-visible (first sample with the printout sprite visible), yusuf-pos (each 0.5 s: tile-ish px), cooler-visit (if Yusuf is
//   ever right of the tray line), bubble-start/end, audio-start/end:kit_yusuf_demir, bark_start (= audio-start), bark_minus_press, frame:t+N every 1 s, end (bark_start + 7 s).
// Edit rule (script): in = the later of press and bark_start - 1.8 s; out = bark_start + 5.86 + 0.2.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, watchBubbles, watchBarkAudio, watchTts2, spriteCheck } from './_ca11.mjs';

const YUSUF = 'kit_yusuf_demir';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_caught === true || g.kit_quiet !== true) throw new Error('entry state wrong: ' + JSON.stringify({ d: g.kit_defend_done, c: g.kit_caught, q: g.kit_quiet }));
}

/** Keep Yusuf's world speech bubble invisible (the game prints sentence 3, which the cut drops). Only the drawn box is hidden; the bark and its audio are untouched. */
async function hideYusufBubble(page) {
  await page.evaluate((id) => {
    if (window.__hideYusufBubble) return;
    window.__hideYusufBubble = setInterval(() => {
      try {
        const bb = window.npcWorldBubbles && window.npcWorldBubbles.bubbles && window.npcWorldBubbles.bubbles.get(id);
        if (bb && bb.box && !bb.box.__hid) { bb.box.__hid = true; const orig = bb.box.setVisible.bind(bb.box); bb.box.setVisible = () => orig(false); bb.box.setVisible(false); }
      } catch (_) {}
    }, 5);
  }, YUSUF);
}

export async function run(page, bridge, mark, { narrow = false } = {}) {
  await hideYusufBubble(page); mark('bubble-hidden-on');
  const bw = await watchBubbles(page, mark); const aw = await watchBarkAudio(page, mark); const tw = watchTts2(page, mark);
  await spriteCheck(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(1000);
  const tPress = Date.now(); mark('press'); await pressButton(page, /Look up/);
  let bark = null, pv = false, nextF = 1, lastPos = 0, ax = [];
  while (Date.now() - tPress < 16000) {
    const el = (Date.now() - tPress) / 1000;
    await bw.drain(); await aw.drain();
    if (!pv) { const v = await page.evaluate(() => { const rs = window.rooms ? Object.values(window.rooms) : []; for (const r of rs) for (const o of Object.values(r.objects || {})) { const id = o.scenarioData && o.scenarioData.id; if (id === 'kit_ca11_printout') return { vis: !!o.visible, a: o.alpha }; } return null; }).catch(() => null); if (v && v.vis && v.a !== 0) { pv = true; mark('printout-visible', v); } }
    if (Date.now() - lastPos >= 500) { lastPos = Date.now(); const n = (await bridge.getState({ radius: 14 * 32, limit: 40 })).nearby.find(x => x.kind === 'npc' && x.id === YUSUF); if (n) ax.push([+el.toFixed(1), Math.round(n.x), Math.round(n.y)]); }
    if (!bark) {
      const ev = (await page.evaluate(() => window.__audioEvents || [])).find(e => e.type === 'start' && e.npc === 'kit_yusuf_demir');
      if (ev) { bark = ev.t; mark('bark_start', { dur: ev.dur }, ev.t); mark('bark_minus_press', { s: +((ev.t - tPress) / 1000).toFixed(2) }); mark('frame:bark-start'); }
    }
    if (bark && Date.now() - bark > 7000) break;
    if (el >= nextF) { mark('frame:t+' + nextF); nextF += 1; }
    await sleep(60);
  }
  await bw.drain(); await aw.drain();
  mark('yusuf-track', { samples: ax });
  mark('tts-proof', { log: tw.log.map(l => [l.status, l.ct, l.cl, l.text.slice(0, 40)]) });
  await bw.stop(); await aw.stop(); tw.stop(); mark('end');
  if (!bark) throw new Error('Yusuf bark audio never started');
}
export default (page, bridge, mark) => run(page, bridge, mark, {});
