// t12b_phone_narrow: t12 for the 9:16 and 1:1 aspects. FINDING (dry run): the phone frame (.phone-messages-container) is already 400x700 at x760 y20, narrower than
// the 560 px target, so no CSS narrowing is needed: the edit just crops x760 y20 w400 h700 (narrow() is NOT called: it forces width, so it would widen the phone to 560).
// Also opens the Ravi message (click the first conversation) to see what the voicemail view shows; marks thread-text and thread-voice.
// Entry state: tools/video/takes/run-take.sh sis01 t12b_phone_narrow "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: phone-open (chain, rects), chain, rects-narrow, frame:phone_t+N, thread-opened (text, voice lines), frame:thread_t+N, closed, end.
import { sleep, watchVoice, prepare, sprite, rectOf } from './_sis01b.mjs';
import { openPhone } from './t12_desk_phone.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  await openPhone(page, bridge, mark);
  await sleep(300);   // no narrow() call: forcing 560 px would WIDEN the 400 px phone
  mark('rects-narrow', { phone: await rectOf(page, '.phone-messages-container') });
  for (const f of [0.5, 1.5]) { await sleep(f === 0.5 ? 500 : 1000); mark('frame:phone_t+' + f); }
  const clicked = await page.evaluate(() => { const e = document.querySelector('.phone-messages-container .contact-item'); if (!e) return null; e.click(); return String(e.className); });
  mark('thread-click', { clicked });
  await sleep(1500);
  await vw.drain();
  mark('thread-opened', { text: await page.evaluate(() => (document.querySelector('.phone-messages-container')?.innerText || '').replace(/\s+/g, ' ').slice(0, 500)), voice: vw.lines.map(l => l.text.slice(0, 60)), rect: await rectOf(page, '.phone-messages-container') });
  for (const f of [1.5, 2.5]) { await sleep(1000); mark('frame:thread_t+' + f); }
  await bridge.minigame.close().catch(() => {}); await sleep(500);
  mark('closed', { activeMinigame: (await bridge.getState()).activeMinigame || null });
  await vw.stop(); mark('end');
};
