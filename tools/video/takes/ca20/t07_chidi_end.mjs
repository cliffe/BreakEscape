// t07_chidi_end: Chidi's talk in person-chat, the end shot. Fresh game seeded with kit_defend_done, kit_attack_done, kit_quiet by hand (SEEDS.room; never kit_key_caught or kit_caught, so the talk is the else
// branch of knot ca20). interact('kit_chidi_okeke') within about 15 s of game time (retry if he is walking: his thirst clock sends him to the drinks machine at about 15 s of wall time), then the
// two sentences: "Half my week's out of the van." and "You forget what's sat on that tablet if you leave it somewhere." The bar prints the line; the edit crops it and burns timed captions.
// Entry state: tools/video/takes/run-take.sh ca20 t07_chidi_end "--set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true" "--hide-hud --zoom-step 1"
// Marks: player-sprite, talk-start, l_start (voice start of sentence 1 line), s1_est (l_start + 0.32 to 1.98), s2_est (l_start + 2.47 to 5.23), tts-proof, bar-box, frame:mid, chat-end, end. In = l_start - 0.1, out = l_start + 5.43.
import { sleep, prepare, sprite, watchVoice, watchTts2, talkTo, interactRetry, waitVoiceStart, boxOf } from './_ca20.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_quiet !== true || g.kit_caught === true || g.kit_key_caught === true) throw new Error('entry state wrong: ' + JSON.stringify({ d: g.kit_defend_done, q: g.kit_quiet, c: g.kit_caught, k: g.kit_key_caught }));
}

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  const vw = await watchVoice(page, mark); const tw = watchTts2(page, mark);
  const st = await bridge.getState({ radius: 20 * 32, limit: 60 }); const c = (st.nearby || []).find(n => n.id === 'kit_chidi_okeke');
  mark('chidi-pos', c ? { x: Math.round(c.x), y: Math.round(c.y) } : null);
  mark('talk-start');
  await talkTo(page, bridge, mark, 'kit_chidi_okeke', /Chidi/i);
  const l = await waitVoiceStart(page, /Half my week's out of the van/i, 20000);
  if (!l) throw new Error('Chidi line 1 never started');
  mark('l_start', { text: l.text.slice(0, 120) }, l.start);
  mark('s1_est', { from: 0.32, to: 1.98 }); mark('s2_est', { from: 2.47, to: 5.23 });
  mark('bar-box', await boxOf(page, /Half my week's out of the van/i));
  await sleep(2700); mark('frame:mid'); await sleep(2900);
  mark('chat-end'); console.error('TTS', JSON.stringify(tw.log.map(x => [x.status, x.ct, x.bytes, (x.text || '').slice(0, 50)])));
  mark('tts-proof', { log: tw.log.map(x => [x.status, x.ct, x.bytes, (x.text || '').slice(0, 50)]) });
  mark('end');
};
