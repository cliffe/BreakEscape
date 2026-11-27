// t07_niamh_end: the end shot. Kiosk opens on the step-away panel (step-away seed, kit_quiet true), Look up pressed (mark `press`: Niamh's PC swaps to the isolated one at once, kit_ca19_out), Niamh
// walks over (kit_ca19_there) and barks "IT have taken mine offline while they rebuild it, so I'm on pen and paper for the afternoon." (one bark). Darren's later bark ("Mine's still running. ...",
// 4.5 s after kit_ca19_there) is silenced: his TTSManager audio element is muted and volume 0 for the whole take (ca03 t05 method), and ALL NPC world bubbles are hidden (ca13 HIDE_BUBBLES; the
// edit burns Niamh's captions). If Darren's bark would clip Niamh's (a second play() on the same audio element), the take also wraps his manager's play() (ca11 t07 method) so it never touches the element.
// The DOM speech bar #npc-speech-container is hidden by CSS (it showed Darren's bark text at the bottom of the frame about 0.6 s before the cut). Nothing is pressed after Look up and nobody is talked to. Runs to bark_start + 7 s.
// Entry state (step-away seed; kit_quiet by --set because events do not fire on a seed):
//   tools/video/takes/run-take.sh ca19_malware_and_updates t07_niamh_end "--set episode_e19_malware_and_updates_state={\"done\":[\"brief\",\"mistake\",\"flip\",\"defend\"]} --set episode_e19_malware_and_updates_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e19_malware_and_updates_defend_percent=60 --set kit_quiet=true" "--hide-hud --zoom-step 1"
// Marks: player-sprite, bubbles-hidden-on, darren-muted-on, kiosk-open, frame:panel, look_up, press, out (kit_ca19_out, +s from press), niamh-pos (each 0.5 s), there (kit_ca19_there, +s),
//   bark_start (Niamh's audio start, +s), darren_first_sound (his audio start, +s and vs bark_start), bark_minus_press, frame:t+N every 1 s, mute-log, tts, globals-end, end.
import { css, sleep, prepare, openKiosk, pressButton, waitButton, buttons, watchBubbles, watchBarkAudio, watchTts2, sprite } from './_ca19.mjs';

const NIAMH = 'kit_niamh_doherty', DARREN = 'kit_darren_price';
export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_quiet !== true || g.kit_caught === true) throw new Error('entry state wrong: ' + JSON.stringify({ d: g.kit_defend_done, q: g.kit_quiet, c: g.kit_caught }));
}

/** Page-level: hide every NPC world bubble, mute Darren's audio element, sample every bark audio element for the proof log. Sets no game global. */
async function silence(page) {
  await page.evaluate((did) => {
    window.__abLog = [];
    window.__silence = setInterval(() => {
      try {
        const bs = window.npcWorldBubbles && window.npcWorldBubbles.bubbles;
        if (bs) for (const [, b] of bs) if (b && b.box && !b.box.__hid) { b.box.__hid = true; const o = b.box.setVisible.bind(b.box); b.box.setVisible = () => o(false); b.box.setVisible(false); }
        const m = window.barkSystem && window.barkSystem.ttsManagers; const mgr = m && m.get(did);
        if (mgr && mgr.audio) { mgr.audio.muted = true; mgr.audio.volume = 0; }
      } catch (_) {}
    }, 5);
    window.__abSample = setInterval(() => {
      try {
        const m = window.barkSystem && window.barkSystem.ttsManagers; if (!m) return;
        const row = { t: performance.timeOrigin + performance.now(), els: {} };
        for (const [id, mgr] of m) { const a = mgr.audio; if (!a) continue; let peak = null;
          try { if (mgr._analyser) { const b = new Float32Array(mgr._analyser.fftSize); mgr._analyser.getFloatTimeDomainData(b); peak = Math.max(...b.map(Math.abs)); } } catch (_) {}
          const bx = window.npcWorldBubbles.bubbles.get(id);
          row.els[id] = { paused: a.paused, muted: a.muted, vol: a.volume, cur: +a.currentTime.toFixed(2), peak: peak === null ? null : +peak.toFixed(4), bubble: !!(bx && bx.box && bx.box.visible), same: id !== did && m.get(did) && m.get(did).audio === a }; }
        window.__abLog.push(row);
      } catch (_) {}
    }, 50);
  }, DARREN);
}

export default async (page, bridge, mark) => {
  // Darren's long bark (9.4 s) also shows in the DOM speech bar #npc-speech-container ("Darren Price: Mine's still running ...", found in the dry run, bottom of the frame): hidden here too.
  await css(page, '#npc-speech-container, .npc-bark--speech { visibility: hidden !important; }');
  await silence(page); mark('bubbles-hidden-on'); mark('darren-muted-on');
  const bw = await watchBubbles(page, mark); const tw = watchTts2(page, mark); const aw = await watchBarkAudio(page, mark);
  await sprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons ' + JSON.stringify(await buttons(page)));
  await sleep(1500); mark('frame:panel');
  mark('look_up'); const tp = Date.now(); await pressButton(page, /Look up/); mark('press');
  const norm = (s) => s.replace(/\s+/g, ' ');
  let out = false, there = false, bark = null, dsound = null, nextF = 1, nextP = 0.5; const pos = [];
  while (Date.now() - tp < 26000) {
    const el = (Date.now() - tp) / 1000; await bw.drain(); await aw.drain();
    const g = (await bridge.getState()).globals || {};
    if (!out && g.kit_ca19_out) { out = true; mark('out', { plusS: +el.toFixed(2) }); }
    if (!there && g.kit_ca19_there) { there = true; mark('there', { plusS: +el.toFixed(2) }); }
    if (!bark && bw.seen.some(e => /IT have taken mine offline/i.test(norm(e.text)))) { bark = el; mark('bark_start', { plusS: +el.toFixed(2), bark_minus_press: +el.toFixed(2) }); }
    if (!dsound && bw.seen.some(e => /Mine's still running/i.test(norm(e.text)))) { dsound = el; mark('darren_first_sound', { plusS: +el.toFixed(2), afterBarkS: bark ? +(el - bark).toFixed(2) : null }); }
    if (el >= nextP) { nextP += 0.5; try { const p = await page.evaluate((id) => { const s = window.game && window.game.scene && window.game.scene.scenes && window.game.scene.scenes[0]; const n = s && s.npcManager && s.npcManager.npcs && s.npcManager.npcs.get && s.npcManager.npcs.get(id); return n && n.sprite ? [Math.round(n.sprite.x), Math.round(n.sprite.y)] : null; }, NIAMH); pos.push([+el.toFixed(1), p]); } catch (_) {} }
    if (el >= nextF) { mark('frame:t+' + nextF); nextF += 1; }
    if (bark && el > bark + 7) break;
    await sleep(60);
  }
  await bw.drain(); await aw.drain();
  mark('niamh-pos', { pos });
  console.error('SEEN', JSON.stringify(bw.seen.map(e => [e.id, norm(e.text).slice(0, 44)])));
  console.error('TTS', JSON.stringify(tw.log.map(l => [l.status, l.ct, l.bytes, (l.text || '').slice(0, 40)])));
  const log = await page.evaluate(() => window.__abLog || []);
  const ids = [...new Set(log.flatMap(r => Object.keys(r.els)))]; const summary = {};
  for (const id of ids) { const rows = log.filter(r => r.els[id]); const pl = rows.filter(r => !r.els[id].paused && r.els[id].cur > 0);
    summary[id] = { samples: rows.length, playingSamples: pl.length, allMuted: rows.every(r => r.els[id].muted), maxVolPlaying: Math.max(0, ...pl.map(r => r.els[id].vol)), maxPeakPlaying: Math.max(0, ...pl.map(r => r.els[id].peak || 0)), bubbleVisibleSamples: rows.filter(r => r.els[id].bubble).length, sharesDarrenElement: rows.some(r => r.els[id].same) }; }
  mark('mute-log', { summary }); console.error('MUTELOG', JSON.stringify(summary));
  mark('speech-bar-proof', await page.evaluate(() => { const e = document.querySelector('#npc-speech-container'); return e ? { visibility: getComputedStyle(e).visibility, text: (e.textContent || '').slice(0, 40) } : null; }));
  const g1 = (await bridge.getState()).globals || {}; mark('globals-end', { out: g1.kit_ca19_out, there: g1.kit_ca19_there, done: g1.kit_ca19_done });
  await bw.stop(); await aw.stop(); tw.stop(); mark('end');
  if (!bark) throw new Error('Niamh bark never seen; out ' + out + ' there ' + there);
};
