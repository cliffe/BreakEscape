// t06_lookup_panel: the step-away panel before the click. Entry state is the step-away seed (defend done, kit_quiet true); the kiosk opens on the Look up panel. Framed on the strip, heading, text
// ("Look up from the kiosk to see how a case like this plays out here. It takes a few seconds, and your place is saved.") and the Look up button; Look up is NEVER pressed. The edit uses 0 to 3.6 s
// (up to 3.9 s if t07 opens late); the take holds 4.6 s after the panel shows.
// Entry state (step-away seed):
//   tools/video/takes/run-take.sh ca19_malware_and_updates t06_lookup_panel "--set episode_e19_malware_and_updates_state={\"done\":[\"brief\",\"mistake\",\"flip\",\"defend\"]} --set episode_e19_malware_and_updates_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e19_malware_and_updates_defend_percent=60 --set kit_quiet=true" "--hide-hud --zoom-step 1"
// Marks: player-sprite, kiosk-open (buttons, tabs), panel (heading, text, boxes, bezel), globals (out/there/quiet before), frame:panel, end, globals-end (kit_ca19_out must still be false).
import { sleep, prepare, openKiosk, waitButton, buttons, tabs, narrow, sprite } from './_ca19.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge); await sleep(400);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_quiet !== true || g.kit_caught === true) throw new Error('entry state wrong: ' + JSON.stringify({ d: g.kit_defend_done, q: g.kit_quiet, c: g.kit_caught }));
}

export async function run(page, bridge, mark, { narrowed = false } = {}) {
  await sprite(page, mark);
  await openKiosk(page, bridge, mark);
  if (narrowed) await narrow(page, '.epr-kiosk-bezel', 560);
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons ' + JSON.stringify(await buttons(page)));
  await page.mouse.move(1500, 1000); await sleep(600);
  mark('kiosk-open', { b: await buttons(page), tabs: await tabs(page) });
  const panel = await page.evaluate(() => { const q = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
    const t = [...document.querySelectorAll('body *')].find(x => x.offsetParent && /^Look up from the kiosk/i.test((x.innerText || '').trim()) && ![...x.children].some(c => /^Look up from the kiosk/i.test((c.innerText || '').trim())));
    const h = document.querySelector('.epr-kiosk-bezel h1, .epr-kiosk-bezel h2, .epr-kiosk-bezel [class*=heading], .epr-kiosk-bezel [class*=title]');
    const b = [...document.querySelectorAll('.epr-kiosk-bezel button')].find(x => /Look up/.test(x.innerText || ''));
    return { heading: h ? h.innerText : null, headingBox: q(h), text: t ? t.innerText : null, textBox: q(t), button: q(b), bezel: q(document.querySelector('.epr-kiosk-bezel')), strip: q(document.querySelector('[class*=strip]')) }; });
  mark('panel', panel);
  const g0 = (await bridge.getState()).globals || {}; mark('globals-before', { out: g0.kit_ca19_out, there: g0.kit_ca19_there, quiet: g0.kit_quiet });
  await sleep(800); mark('frame:panel'); await sleep(3200);
  const g1 = (await bridge.getState()).globals || {}; mark('globals-end', { out: g1.kit_ca19_out, there: g1.kit_ca19_there });
  if (g1.kit_ca19_out) throw new Error('kit_ca19_out set: Look up was pressed');
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
