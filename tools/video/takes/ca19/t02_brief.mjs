// t02_brief: the Brief panel on the Quayholt purple tab, with the five-step strip (Brief, Choices, Where it led, Defend, Debrief). The edit frames the tab, heading and strip only (shot uses 1 to 5.8 s);
// the Brief paragraph ("You're on an authorised exercise at Quayholt Insurance ... This episode shows a ransomware message ... no alarms or flashing screens") is hidden here with CSS (visibility:hidden)
// so it is out of every format. Start is never pressed.
// Entry state: fresh game, no flags (Skip tutorial and the first-run Mission Brief popup closed in setup()).
//   tools/video/takes/run-take.sh ca19_malware_and_updates t02_brief "" "--hide-hud --zoom-step 1"
// Marks: kiosk-open (buttons, tabs), brief-boxes (bezel, strip, heading), para-box, para-visibility, frame:brief, end. Hold 6.3 s after open (the shot uses 1 to 5.8 s).
import { sleep, prepare, openKiosk, buttons, hideLong, narrow, tabs, boxOf, sprite } from './_ca19.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const PARA = /^You're on an authorised exercise at Quayholt/i;
export async function run(page, bridge, mark, { narrowed = false } = {}) {
  await hideLong(page, PARA);
  await sprite(page, mark);
  await openKiosk(page, bridge, mark); await sleep(900);
  if (narrowed) await narrow(page, '.epr-kiosk-bezel', 560);
  await page.mouse.move(1500, 1000);
  mark('kiosk-open', { b: await buttons(page), tabs: await tabs(page) });
  const boxes = await page.evaluate(() => { const q = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }; return { bezel: q('.epr-kiosk-bezel'), strip: q('[class*=strip]'), h: q('.epr-kiosk-bezel h1, .epr-kiosk-bezel h2, .epr-kiosk-bezel [class*=heading], .epr-kiosk-bezel [class*=title]') }; });
  mark('brief-boxes', boxes);
  // innerText of a visibility:hidden element is empty, so the proof reads textContent
  const para = await page.evaluate(() => { const re = /^You're on an authorised exercise at Quayholt/i; const e = [...document.querySelectorAll('.epr-kiosk-bezel *')].filter(x => re.test((x.textContent || '').trim()) && ![...x.children].some(c => re.test((c.textContent || '').trim())))[0]; if (!e) return null; const r = e.getBoundingClientRect(); return { cls: String(e.className).slice(0, 40), box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], visibility: getComputedStyle(e).visibility }; });
  mark('para-box', para);
  if (!para || para.visibility !== 'hidden') throw new Error('Brief paragraph not found or not hidden: ' + JSON.stringify(para));
  const anyVisible = await page.evaluate(() => [...document.querySelectorAll('body *')].some(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden' && /no alarms or flashing|ransomware message/i.test(e.innerText || '') && ![...e.children].some(c => /no alarms or flashing|ransomware message/i.test(c.innerText || ''))));
  mark('para-leak-check', { anyVisible });
  if (anyVisible) throw new Error('Brief paragraph still visible');
  await sleep(2800); mark('frame:brief'); await sleep(3500);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
