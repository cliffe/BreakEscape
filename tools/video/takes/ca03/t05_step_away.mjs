// t05_step_away: the end beat. Kiosk opens on the step-away panel, Look up, Anjali's workstation spare PC shows the sign-in screen (kit_ca03_out), she walks to it
// (kit_ca03_there) and barks E1 "I came over to use the spare and it's on the sign-in screen, asking for everything again. Darren, is it doing this to everyone?"
// (8.33 s cached). Darren's E2 "Someone's password got out, ..." follows 4.5 s after kit_ca03_there. Nothing is pressed after Look up.
// Marks: player-sprite, kiosk-open, look_up, ca03-out-set, ca03-there-set, bubble-start/end:<npc>, tts-response (per bark), audio-start/end:<npc>, e1_start, e1_sentence1_end (= e1 audio start + 5.68, est),
//   e2_start, frame:* every 1 s, end. The take runs to E1 start + 14 s (past both barks); the edit picks the out.
// END BEAT (decision b2, 23 Nov): Darren's E2 overlaps Anjali's E1, so the take mutes Darren's bark audio element (muted + volume 0) and keeps his world bubble hidden (box.setVisible forced false)
//   from the start of the take. The game's own state is untouched (his bark still "plays" and ends; only the output is silenced and the bubble not drawn). The edit uses E1's first sentence
//   (clip 0 to 5.686 s, plus 0.15 s) with no Darren audio or bubble in it. Marks added: darren-muted-on, mute-log (per-element paused/muted/volume/analyser-peak samples at the end).
//   Fallback (c) if this ever fails in a real run: Anjali's H2 "We've had a few callers pushing for password resets this week. Worth a second look."
// Entry state (defend complete, not caught; percent under 85):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca03_helpdesk_reset t05_step_away \
//     "--set episode_e3_helpdesk_reset_state={\"done\":[\"brief\",\"osint\",\"write\",\"mfa\",\"flip\",\"defend\"]} --set episode_e3_helpdesk_reset_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e3_helpdesk_reset_defend_percent=60" "--hide-hud --zoom-step 1"
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, watchBubbles, spriteCheck, watchBarkAudio, watchTts2 as watchTts } from './_ca03.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_caught === true) throw new Error('entry state wrong: kit_defend_done true and kit_caught not true needed; got ' + JSON.stringify({ d: g.kit_defend_done, c: g.kit_caught, q: g.kit_quiet }));
}

// Page-level: silence Darren's bark voice and hide his bubble, and sample every bark audio element for the proof log. Nothing sets a game global.
const MUTE_ID = 'darren_price';
async function muteDarren(page) {
  await page.evaluate((id) => {
    if (window.__muteDarren) return; window.__abLog = [];
    window.__muteDarren = setInterval(() => {
      try {
        const m = window.barkSystem && window.barkSystem.ttsManagers;
        const mgr = m && m.get(id);
        if (mgr && mgr.audio) { mgr.audio.muted = true; mgr.audio.volume = 0; }
        const bb = window.npcWorldBubbles && window.npcWorldBubbles.bubbles && window.npcWorldBubbles.bubbles.get(id);
        if (bb && bb.box && !bb.box.__hid) { bb.box.__hid = true; const orig = bb.box.setVisible.bind(bb.box); bb.box.setVisible = () => orig(false); bb.box.setVisible(false); }
      } catch (_) {}
    }, 5);
    window.__abSample = setInterval(() => {
      try {
        const m = window.barkSystem && window.barkSystem.ttsManagers; if (!m) return;
        const t = performance.timeOrigin + performance.now(); const row = { t, els: {} };
        for (const [id, mgr] of m) {
          const a = mgr.audio; if (!a) continue; let peak = null;
          try { if (mgr._analyser) { const b = new Float32Array(mgr._analyser.fftSize); mgr._analyser.getFloatTimeDomainData(b); peak = Math.max(...b.map(Math.abs)); } } catch (_) {}
          const bx = window.npcWorldBubbles.bubbles.get(id);
          row.els[id] = { paused: a.paused, muted: a.muted, vol: a.volume, cur: +a.currentTime.toFixed(2), peak: peak === null ? null : +peak.toFixed(4), bubble: !!(bx && bx.box && bx.box.visible) };
        }
        window.__abLog.push(row);
      } catch (_) {}
    }, 50);
  }, MUTE_ID);
}

export default async (page, bridge, mark) => {
  await muteDarren(page); mark('darren-muted-on');
  const bw = await watchBubbles(page, mark); const tw = watchTts(page, mark); const aw = await watchBarkAudio(page, mark);
  await spriteCheck(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(1500); mark('frame:step-away-panel');
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let out = false, there = false, e1 = null, e2 = null, next = 1, f3 = false, f58 = false;
  const norm = (s) => s.replace(/\s+/g, ' ');
  while (Date.now() - t0 < 30000) {
    const el = (Date.now() - t0) / 1000; await bw.drain(); await aw.drain();
    const g = (await bridge.getState()).globals || {};
    if (!out && g.kit_ca03_out) { out = true; mark('ca03-out-set'); }
    if (!there && g.kit_ca03_there) { there = true; mark('ca03-there-set'); }
    if (!e1 && bw.seen.some(e => /came over to use the spare/i.test(norm(e.text)))) { e1 = Date.now(); mark('e1_start'); mark('frame:e1-bubble'); }
    if (e1 && !f3 && Date.now() - e1 > 3000) { f3 = true; mark('frame:e1+3s'); }
    if (e1 && !f58 && Date.now() - e1 > 5800) { f58 = true; mark('frame:e1+5_8s'); }
    if (!e2 && bw.seen.some(e => /password got out/i.test(norm(e.text)))) { e2 = Date.now(); mark('e2_start'); mark('frame:e2-bubble'); }
    if (el >= next) { mark('frame:t+' + next); next += 1; }
    if (e1 && Date.now() - e1 > 14000) break;
    await sleep(80);
  }
  await bw.drain(); await aw.drain();
  console.error('SEEN', JSON.stringify(bw.seen.map(e => [e.id, norm(e.text).slice(0, 40)])));
  console.error('TTS', JSON.stringify(tw.log));
  const log = await page.evaluate(() => window.__abLog || []);
  const mgrs = [...new Set(log.flatMap(r => Object.keys(r.els)))];
  const summary = {}; for (const id of mgrs) { const rows = log.filter(r => r.els[id]); const playing = rows.filter(r => !r.els[id].paused && r.els[id].cur > 0);
    summary[id] = { samples: rows.length, playingSamples: playing.length, allMuted: rows.every(r => r.els[id].muted), maxVolWhilePlaying: Math.max(0, ...playing.map(r => r.els[id].vol)), maxPeakWhilePlaying: Math.max(0, ...playing.map(r => r.els[id].peak || 0)), bubbleVisibleSamples: rows.filter(r => r.els[id].bubble).length }; }
  mark('mute-log', { summary }); console.error('MUTELOG', JSON.stringify(summary));
  console.error('MUTEROWS', JSON.stringify(log.filter((r, i) => i % 4 === 0).map(r => [Math.round(r.t % 1e6), Object.fromEntries(Object.entries(r.els).map(([k, v]) => [k.slice(0, 6), [v.paused ? 'P' : 'p', v.muted ? 'M' : 'm', v.cur, v.peak, v.bubble ? 'B' : '-']]))])));
  await bw.stop(); await aw.stop(); tw.stop(); mark('end');
  if (!e1) throw new Error('E1 bubble never seen');
};
