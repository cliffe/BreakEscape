// t06_graham_step_away: the step-away beat, one take for TWO shots: the hook (Graham's bark G1 "Assistant's done the inbox for me." [first sentence of
// "...Lovely, saves me reading."], about 1.5 s after Look up) and the end line (bark G2 "Assistant says Pennine Oat Mills need our customer list for a recall.
// Reply's drafted. Just send it?", about 7.0 s after Look up). Kiosk opens on the "Before the debrief" panel, Look up, Graham speaks beside his PC. NEVER click in the
// room, never open the chat, never examine the PC (the ask opens a chat whose menu is outcomes; a 45 s timer defaults it). Ends at G2's end + 0.4 s.
// Entry state (kit_quiet=true IS needed: G1's mapping is gated on it and --set does not fire the mapping that sets it):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca13_ai_assistant t06_graham_step_away \
//     "--set episode_e13_ai_assistant_state={\"done\":[\"brief\",\"write\",\"flip\",\"defend\"]} --set episode_e13_ai_assistant_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e13_ai_assistant_defend_percent=60 --set kit_quiet=true" \
//     "--hide-hud --zoom-step 1"
// Keep _defend_percent under 85 (85 and over sets kit_caught). Hook cut: in = G1 audio start - 0.15, out = in + 2.6 (first sentence ends 2.18 s in the file). Office: in = G2 start - 0.3, out = G2 speech end + 0.3.
// The world bubble is hidden for the whole take (HIDE_BUBBLES, Phaser container patched); the edit burns captions (G1 sentence 1 only, G2 in full). Mark `bubble-hidden-check` logs visible/alpha per bubble.
// Marks: player-sprite, kiosk-open, globals-before-look-up, look_up, bubble-start/end:kit_graham_whitfield (text), bark1_start, bark2_start, bark2_end,
//   cam-before-freeze, cam-freeze, aside-start, aside-end (player x/y px, camera scroll, atS = seconds after Look up; must be < 1.4), frame:aside, audio-start/end:<npc> (clip length and how far it got), tts (each POST /tts: status, bytes), person-chat-opened (only if the ask opens a chat), frame:t+N, end, globals-end.
import { sleep, prepare, openKiosk, pressButton, waitButton, watchBubbles, checkSprite, watchTts, watchBarkAudio } from './_ca13.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { SPEED } from '../ca01/_ca01.mjs';
import { stopFollow, camState } from '../lib/camlib.mjs';

/** Retake 26 Nov (owner: "3 characters standing too close together, have the player stand aside"). The player spawns at (6.6, 3.6) tiles, shoulder to shoulder with Gwen and Agnieszka,
 *  and must stay there until the kiosk is open (kiosk interact range is 1 tile). The camera is locked on the player, so it is frozen first (player has not moved: the frame is exactly the
 *  25 Nov one, the edit's crops still fit) and the player then walks ASIDE_DOWN_PX straight down (about 2 tiles, 3x screen scale = about 190 px) right after Look up, finished well before
 *  G1 (about +1.6 s after Look up). Straight down is open carpet (Graham's desk is 4 tiles left, the kiosk 1 tile right, chairs lower right), keeps the player at the kiosk side and in frame. */
const ASIDE_DOWN_PX = 64;

/** The world bubble is a Phaser container (not DOM), so CSS cannot reach it: every bubble box (existing and future, via _make) has setVisible forced to false and alpha 0. The says/pages
 *  state the take's marks read is untouched. Decided 23 Nov: Graham's bubble is hidden for the whole take; the edit burns the captions. */
export const HIDE_BUBBLES = () => {
  const nb = window.npcWorldBubbles; if (!nb || nb.__ca13hidden) return !!nb;
  const patch = (bb) => { const b = bb && bb.box; if (!b || b.__ca13) return bb; b.__ca13 = true; b.setVisible = function () { this.visible = false; return this; }; b.setAlpha = function () { this.alpha = 0; return this; }; b.visible = false; b.alpha = 0; return bb; };
  const make = nb._make; nb._make = function (...a) { return patch(make.apply(this, a)); };
  for (const bb of nb.bubbles.values()) patch(bb);
  nb.__ca13hidden = true; return true;
};

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true) throw new Error('entry state wrong: kit_defend_done is not true');
  if (g.kit_quiet !== true) throw new Error('entry state wrong: kit_quiet is not true (G1 will not play); seed it with --set kit_quiet=true');
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark);
  const aw = await watchBarkAudio(page, mark);
  const tw = watchTts(page, mark);
  await checkSprite(page, mark);
  if (!(await page.evaluate(HIDE_BUBBLES))) throw new Error('npcWorldBubbles not ready: cannot hide the bubble');
  const cam0 = await camState(page); mark('cam-before-freeze', { scrollX: Math.round(cam0.scrollX), scrollY: Math.round(cam0.scrollY), zoom: cam0.zoom, player: cam0.player });
  mark('cam-freeze', await stopFollow(page));
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons: ' + JSON.stringify(await (await import('./_ca13.mjs')).buttons(page)));
  await sleep(550); // was 1000: the camera freeze and its marks pushed every later mark 0.47 s later than 25 Nov; this keeps G1/G2 on the 25 Nov times
  const g0 = (await bridge.getState()).globals || {};
  mark('globals-before-look-up', { kit_quiet: g0.kit_quiet, kit_ca13_out: g0.kit_ca13_out, kit_ca13_there: g0.kit_ca13_there });
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now();
  // Walk aside once the kiosk panel has gone (the panel closes on Look up), not before: G1 is about +1.6 s, the walk takes about 0.5 s.
  for (let i = 0; i < 20 && (await bridge.getState()).activeMinigame; i++) await sleep(50);
  const p0 = (await bridge.getState()).player; mark('aside-start', { x: Math.round(p0.x), y: Math.round(p0.y) });
  await keyLegs(bridge, [['down', p0.y + ASIDE_DOWN_PX]], SPEED, mark);
  const p1 = (await bridge.getState()).player, cam1 = await camState(page);
  mark('aside-end', { x: Math.round(p1.x), y: Math.round(p1.y), movedPx: Math.round(Math.hypot(p1.x - p0.x, p1.y - p0.y)), scrollX: Math.round(cam1.scrollX), scrollY: Math.round(cam1.scrollY), atS: (Date.now() - t0) / 1000 });
  mark('frame:aside');
  if (Math.hypot(p1.x - p0.x, p1.y - p0.y) < 48) { await bw.stop(); await aw.stop(); tw.stop(); throw new Error('player did not walk aside (moved < 48 px)'); }
  let hid1 = false, b1 = false, b2 = false, b2end = false, chat = false, next = 2;
  const open = () => page.evaluate(() => !!(window.npcWorldBubbles && window.npcWorldBubbles.says && [...window.npcWorldBubbles.says.values()].some(s => /Just send it\?/.test((s.pages || []).join(' ')))));
  while (Date.now() - t0 < 40000) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain();
    if (!b1 && bw.seen.some(e => /done the inbox/i.test(e.text))) { b1 = true; mark('bark1_start'); }
    if (!b2 && bw.seen.some(e => /Pennine|Just send it\?/i.test(e.text))) { b2 = true; mark('bark2_start'); }
    if (b2 && !b2end && !(await open())) { b2end = true; mark('bark2_end'); break; }
    const st = await bridge.getState();
    if (!chat && (st.dialogue || st.interactionMenu || st.activeMinigame)) { chat = true; mark('person-chat-opened', { dialogue: !!st.dialogue, menu: !!st.interactionMenu, minigame: !!st.activeMinigame }); }
    if (b1 && !hid1) { hid1 = true; mark('bubble-hidden-check', await page.evaluate(() => [...window.npcWorldBubbles.bubbles.entries()].map(([id, bb]) => ({ id, visible: bb.box.visible, alpha: bb.box.alpha, patched: !!bb.box.__ca13 })))); mark('frame:bubble-hidden'); }
    if (el >= next) { mark('frame:t+' + next); next += 2; }
    await sleep(100);
  }
  await bw.drain();
  if (!b1 || !b2end) { await bw.stop(); await aw.stop(); tw.stop(); throw new Error('barks missing: bark1 ' + b1 + ' bark2 ' + b2 + ' bark2_end ' + b2end); }
  await sleep(400); mark('frame:end'); mark('end');
  const g1 = (await bridge.getState()).globals || {};
  mark('globals-end', { kit_quiet: g1.kit_quiet, kit_ca13_out: g1.kit_ca13_out, kit_ca13_there: g1.kit_ca13_there, asked: g1.kit_ca13_asked, send_choice: g1.kit_ca13_send_choice });
  await aw.stop(); await bw.stop(); tw.stop();
};
