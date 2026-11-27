// t01_nilesh_talk: the hook and the format line, one take. Nilesh's opener N1 (cached bb496db7, 13.49 s): "Nilesh, service desk. Every rule here has a 'because'. Sort the cards into Allowed,
// Not allowed and Ask first, then a short inbox. If you're not sure, ask." Person-chat view, first visit (kit_ep ca17, defend not complete, so the hub reads the long opening line).
// Entry state: fresh game, with kit_quiet seeded (the mapping that sets it fires on the first kiosk change, which --set does not trigger, and Nilesh's hub reads defend_complete, not kit_quiet):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca17 t01_nilesh_talk "--set kit_quiet=true" "--hide-hud --zoom-step 1"
// The take walks to him, waits for N1, and closes the chat at N1 start + 10.25 s (inside the 0.49 s gap before sentence 4 at +10.42: the choice menu never shows and sentence 4 is not heard).
// Cuts (edit, from the marks and the cached clip's silencedetect): hook in = n1_start - 0.15, out = n1_start + 3.93; format in = n1_start + 3.90, out = n1_start + 10.08. The game's bar prints the
// whole four-sentence line, so the edit crops it (16:9) and burns the captions. Discard the take if a bark bubble appears within 2 s of the chat opening (mark `bark-near-open`).
// Marks: start-hold, player-sprite, interact:*, talk, frame:npc-portrait-up, npc_portrait_up, n1_start, n1_end_cut (the close time), chat-closed, bark-near-open (only if), tts (POST /tts status, bytes), frame:t+N, end.
import { sleep, prepare, checkSprite, talkTo, watchTts, watchBubbles } from './_ca17.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_quiet !== true) throw new Error('entry state wrong: kit_quiet is not true; seed it with --set kit_quiet=true');
  await sleep(500);
}

export default async (page, bridge, mark) => {
  const tts = await watchTts(page, mark);
  const vw = await watchVoice(page, mark);
  const bw = await watchBubbles(page, mark);
  await checkSprite(page, mark, { strict: false });
  mark('start-hold'); await sleep(1500);
  await talkTo(page, bridge, mark, 'nilesh_solanki', /Nilesh/i);
  mark('npc_portrait_up'); mark('frame:npc-portrait-up');
  // waitForLine only returns when a line has ended (all 13.49 s): poll the start edge instead, so the chat can close inside the gap before sentence 4.
  let n1 = null; const tw = Date.now();
  while (!n1 && Date.now() - tw < 30000) {
    n1 = await page.evaluate(() => (window.__voiceEvents || []).find(e => e.type === 'start' && /Nilesh, service desk/.test(e.text)) || null).catch(() => null);
    if (!n1) await sleep(40);
  }
  if (!n1) throw new Error('N1 never voiced; heard: ' + JSON.stringify(await page.evaluate(() => (window.__voiceEvents || []).map(e => e.text))));
  mark('n1_start', null, n1.start);
  for (const [dt, f] of [[1.0, 't+1'], [3.0, 't+3'], [5.5, 't+5.5'], [9.0, 't+9']]) {
    const wait = n1.start + dt * 1000 - Date.now(); if (wait > 0) await sleep(wait);
    mark('frame:' + f);
  }
  const wait = n1.start + 10250 - Date.now(); if (wait > 0) await sleep(wait);
  mark('n1_end_cut', { atMs: Date.now() - n1.start });
  await bw.drain(); if (bw.seen.length) mark('bark-near-open', { seen: bw.seen.map(e => e.text) });
  await vw.stop(); await tts.stop();
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await bw.stop(); await sleep(600); mark('end');
};
