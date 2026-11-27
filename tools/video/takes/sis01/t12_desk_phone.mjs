// t12_desk_phone: the Ward 7 desk phone (ward_desk_phone, type phone, Ravi's voicemail "It's Ravi Anand in IT Security ... Go to paper for everything").
// Entry state: tools/video/takes/run-take.sh sis01 t12_desk_phone "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Opens the phone, holds, closes before the voicemail runs long. Marks: phone-open (activeMinigame, panel text, frame chain, rect), frame:phone_t+N, voice (lines heard), closed, end.
import { sleep, watchVoice, prepare, sprite, interact, chainOf } from './_sis01b.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export async function openPhone(page, bridge, mark) {
  await interact(bridge, mark, 'ward_desk_phone');
  let mg = null; for (let i = 0; i < 60 && !mg; i++) { mg = (await bridge.getState()).activeMinigame; if (!mg) await sleep(150); }
  const chain = await page.evaluate(() => { const c = document.querySelector('.phone-container, .phone-minigame, [class*=phone]'); if (!c) return null; const out = []; let e = c; while (e && e !== document.body) { const r = e.getBoundingClientRect(); out.push(e.tagName.toLowerCase() + '.' + String(e.className).split(' ').join('.') + ' ' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); e = e.parentElement; } return out; });
  mark('phone-open', { activeMinigame: mg, chain, text: await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 400)) });
  return chain;
}

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  await openPhone(page, bridge, mark);
  for (const f of [0.5, 1.5, 2.5]) { await sleep(f === 0.5 ? 500 : 1000); mark('frame:phone_t+' + f); }
  await vw.drain(); mark('voice', vw.lines.map(l => l.text.slice(0, 60)));
  await bridge.minigame.close().catch(() => {}); await sleep(500);
  mark('closed', { activeMinigame: (await bridge.getState()).activeMinigame || null });
  await vw.stop(); mark('end');
};
