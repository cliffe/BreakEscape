// t05_lorna_reset: the end shot. Kiosk opens on the "Before the debrief" panel with Look up; hold 0.8 s, press (mark `press`); Lorna's bark L1 "Fenlow have made me reset my password after this
// morning." (3.58 s clip, speech 0.21 to 3.20 s) starts about 1.5 s later (mapping delayMs 1500 plus the game's lead); the take ends 0.6 s after L1's audio ends, BEFORE bark L2 (about 7 s). Lorna is
// never clicked, nothing else is pressed. Her world bubble is hidden for the whole take (HIDE_BUBBLES: Phaser container patched); the edit burns the caption.
// Entry state (kit_quiet=true IS needed, L1's mapping is gated on it and --set does not fire the mapping that sets it; defend percent 60: 85 and over sets kit_caught):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca18 t05_lorna_reset --set 'episode_e18_credential_attacks_at_scale_state={"done":["brief","osint","guess","flip","defend"]}' \
//     --set episode_e18_credential_attacks_at_scale_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e18_credential_attacks_at_scale_defend_percent=60 --set kit_quiet=true "" "--hide-hud --zoom-step 1"
// Edit rule (script M2): in = `press` minus 0.8, out = `l1_audio_start` plus 3.40; v10 (2.04 s) is placed at in plus 0.2 and ends at press plus 1.44; the take logs `v10_clear` = l1_audio_start minus
//   (press + 1.44) and throws only if negative; under 0.2 s is marginal and the edit then uses "At Lorna's desk.".
// Marks: player-sprite, kiosk-open, panel-hold (buttons), look_up-ready, press, bubble-start/end:kit_lorna_easton (text), l1_bubble, l1_audio_start (the game's real audio edge), l1_audio_end, lead
//   (press to bubble, press to audio start, bubble to audio start, s), v10_clear, bubble-hidden-check, tts (each POST /tts: status, bytes), frame:*, end, globals-end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, watchBubbles, checkSprite, watchTts, watchBarkAudio, addCss, NARROW_CSS } from './_ca18.mjs';

/** The world bubble is a Phaser container (not DOM): every bubble box (existing and future) gets setVisible forced false and alpha 0. says/pages state stays, so the marks still read. */
export const HIDE_BUBBLES = () => {
  const nb = window.npcWorldBubbles; if (!nb || nb.__ca18hidden) return !!nb;
  const patch = (bb) => { const b = bb && bb.box; if (!b || b.__ca18) return bb; b.__ca18 = true; b.setVisible = function () { this.visible = false; return this; }; b.setAlpha = function () { this.alpha = 0; return this; }; b.visible = false; b.alpha = 0; return bb; };
  const make = nb._make; nb._make = function (...a) { return patch(make.apply(this, a)); };
  for (const bb of nb.bubbles.values()) patch(bb);
  nb.__ca18hidden = true; return true;
};

export const makeSetup = (narrow) => async (page, bridge) => {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_quiet !== true) throw new Error('entry state wrong: kit_defend_done and kit_quiet must be true; got ' + JSON.stringify({ d: g.kit_defend_done, q: g.kit_quiet }));
  if (narrow) await addCss(page, `.epr-kiosk-bezel { max-width: 560px !important; }`);
  await sleep(300);
};
export const makeRun = (narrow) => async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark); const aw = await watchBarkAudio(page, mark); const tw = await watchTts(page, mark);
  await checkSprite(page, mark);
  if (!(await page.evaluate(HIDE_BUBBLES))) throw new Error('npcWorldBubbles not ready: cannot hide the bubble');
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons: ' + JSON.stringify(await buttons(page)));
  mark('panel-hold', { buttons: await buttons(page), bezel: await page.$eval('.epr-kiosk-bezel', e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width) }; }).catch(() => null) });
  mark('look_up-ready'); mark('frame:panel'); await sleep(800);
  const tPress = Date.now(); mark('press'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let bubble = null, audio = null, audioEnd = null, hid = false, next = 1;
  while (Date.now() - t0 < 14000) {
    await bw.drain();
    if (!bubble) { const e = bw.seen.find(e => /reset my password/i.test(e.text.replace(/\s+/g, ' '))); if (e) { bubble = e.t; mark('l1_bubble', null, e.t); } }
    const evs = await page.evaluate(() => (window.__audioEvents || []).filter(e => e.npc === 'kit_lorna_easton')).catch(() => []);
    if (!audio) { const s = evs.find(e => e.type === 'start'); if (s) { audio = s.t; mark('l1_audio_start', { dur: s.dur }, s.t); mark('frame:l1-audio'); } }
    if (audio && !audioEnd) { const s = evs.find(e => e.type === 'end'); if (s) { audioEnd = s.t; mark('l1_audio_end', { cur: s.cur, dur: s.dur, ended: s.ended }, s.t); } }
    if (bubble && !hid) { hid = true; mark('bubble-hidden-check', await page.evaluate(() => [...window.npcWorldBubbles.bubbles.entries()].map(([id, bb]) => ({ id, visible: bb.box.visible, alpha: bb.box.alpha, patched: !!bb.box.__ca18 })))); mark('frame:bubble-hidden'); }
    if (audioEnd && Date.now() - audioEnd > 600) break;
    if ((Date.now() - t0) / 1000 >= next) { mark('frame:t+' + next); next += 1; }
    await sleep(40);
  }
  await bw.drain(); await aw.drain(); await tw.drain?.();
  if (!bubble || !audio) { await bw.stop(); await aw.stop(); await tw.stop(); throw new Error('L1 missing: bubble ' + !!bubble + ' audio ' + !!audio); }
  const lead = { pressToBubble: +((bubble - tPress) / 1000).toFixed(2), pressToAudio: +((audio - tPress) / 1000).toFixed(2), bubbleToAudio: +((audio - bubble) / 1000).toFixed(2) };
  mark('lead', lead);
  const clear = +(lead.pressToAudio - 1.44).toFixed(2);
  mark('v10_clear', { s: clear, ok: clear >= 0.2 });
  const l2 = bw.seen.some(e => /Kept my old one|one less thing|changed the season|That'll do/i.test(e.text.replace(/\s+/g, ' ')));
  mark('l2-before-end', { heard: l2 });
  await aw.stop(); await bw.stop(); await tw.stop();
  const voiced = tw.all.filter(l => l.status === 200 && /audio/.test(l.type || '') && l.bytes > 0);
  mark('tts', { all: tw.all.map(l => ({ text: String(l.text).slice(0, 60), status: l.status, bytes: l.bytes })) });
  if (!voiced.some(l => /reset my password/i.test(l.text))) throw new Error('L1 not voiced (no 200 audio bytes>0); tts: ' + JSON.stringify(tw.all));
  if (clear < 0) throw new Error('v10 would overlap L1 (clear ' + clear + ' s)');  // 0 to 0.2 s: marginal, the edit uses the shorter v10 "At Lorna's desk." (see takes_ca18.md)
  const g1 = (await bridge.getState()).globals || {};
  mark('globals-end', { kit_quiet: g1.kit_quiet, kit_caught: g1.kit_caught, out: g1.kit_ca18_out, there: g1.kit_ca18_there });
  mark('end');
};
export const setup = makeSetup(false);
export default makeRun(false);
