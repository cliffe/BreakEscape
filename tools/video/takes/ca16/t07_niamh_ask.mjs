// t07_niamh_ask: the end shot. Kiosk opens on the step-away panel, Look up, Niamh's bark "Hang on, my screen's thrown me out." (needs kit_quiet true),
// she walks to the player, then the ask "It won't take my password at all. Could I borrow your login for an hour?" (one bark, 4.42 s cached).
// Her world bubble is hidden (the edit burns captions); nothing is pressed after Look up and Niamh is never talked to.
// Entry state (step-away flags; kit_quiet by --set because events do not fire on a seed):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t07_niamh_ask \
//     "--set episode_e16_insider_risk_state={\"done\":[\"brief\",\"mistake\",\"flip\",\"defend\"]} --set episode_e16_insider_risk_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true --set episode_e16_insider_risk_defend_percent=60" "--hide-hud --zoom-step 1"
// Marks: player-sprite, kiosk-open, look_up, bark1_start (+N from press), arrival (kit_ca16_there), ask_start (bubble start; the edit's in = audio start - 1.3 s), ask_audio_start,
//   ask_end, frame:t+N every 2 s, end. The take holds to look_up + 16 s (the slow case is about +14 s).
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, watchBubbles, spriteCheck, watchBarkAudio, watchTts2 } from './_ca16.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_quiet !== true || g.kit_caught === true) throw new Error('entry state wrong: ' + JSON.stringify({ d: g.kit_defend_done, q: g.kit_quiet, c: g.kit_caught }));
}

export default async (page, bridge, mark) => {
  // hide every NPC world bubble (the bubble prints the whole line; the edit burns its own captions). The game state is untouched.
  await page.evaluate(() => { window.__hideBub = setInterval(() => { try { const bs = window.npcWorldBubbles && window.npcWorldBubbles.bubbles; if (!bs) return; for (const [, b] of bs) if (b && b.box && !b.box.__hid) { b.box.__hid = true; const o = b.box.setVisible.bind(b.box); b.box.setVisible = () => o(false); b.box.setVisible(false); } } catch (_) {} }, 5); });
  mark('bubbles-hidden-on');
  const bw = await watchBubbles(page, mark); const tw = watchTts2(page, mark); const aw = await watchBarkAudio(page, mark);
  await spriteCheck(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons ' + JSON.stringify(await buttons(page)));
  await sleep(1500); mark('frame:step-away-panel');
  const panel = await page.evaluate(() => { const e = [...document.querySelectorAll('body *')].find(x => x.offsetParent && /Look up from the kiosk/i.test(x.innerText || '') && ![...x.children].some(c => /Look up from the kiosk/i.test(c.innerText || ''))); const p = e && e.closest('.epr-kiosk-bezel, .epr-panel, [class*=epr]'); const r = p && p.getBoundingClientRect(); return { txt: e ? e.innerText.slice(0, 160) : null, cls: p ? String(p.className).slice(0, 60) : null, box: r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null }; });
  mark('panel', panel);
  mark('look_up'); const tp = Date.now(); await pressButton(page, /Look up/);
  let b1 = null, there = false, ask = null, next = 2; const norm = (s) => s.replace(/\s+/g, ' ');
  while (Date.now() - tp < 18000) {
    const el = (Date.now() - tp) / 1000; await bw.drain(); await aw.drain();
    const g = (await bridge.getState()).globals || {};
    if (!there && g.kit_ca16_there) { there = true; mark('arrival', { plusS: +el.toFixed(2) }); }
    if (!b1 && bw.seen.some(e => /screen's thrown me out/i.test(norm(e.text)))) { b1 = el; mark('bark1_start', { plusS: +el.toFixed(2) }); }
    if (!ask && bw.seen.some(e => /won't take my password/i.test(norm(e.text)))) { ask = el; mark('ask_start', { plusS: +el.toFixed(2) }); mark('frame:ask'); }
    if (ask && el > ask + 5.2) break;
    if (el >= next) { mark('frame:t+' + next); next += 2; }
    await sleep(60);
  }
  await bw.drain(); await aw.drain();
  console.error('SEEN', JSON.stringify(bw.seen.map(e => [e.id, norm(e.text).slice(0, 44)])));
  console.error('TTS', JSON.stringify(tw.log.map(l => [l.status, l.ct, l.bytes, (l.text || '').slice(0, 40)])));
  await bw.stop(); await aw.stop(); tw.stop(); mark('end');
  if (!ask) throw new Error('ask never seen; bark1 ' + b1 + ' arrival ' + there);
};
