// t03_choices_reveal: the four everyday calls. Beat 1 (restart prompt) and beat 4 (save location) are picked on the UNSAFE option and filmed at the pick (highlighted, no marks); beats 2 and 3
// are clicked through off camera on the SAFE options so no "Enable content" or "Allow" click is on screen (the inbox's tell words). Then the montage tab "Later that afternoon": "Your call" tags hidden,
// borders neutral, the enable_content and security_alert cards display:none, the restart card trimmed to its first sentence ("... the ones it locked.") in the page DOM, the save card left whole
// (both sentences). Ends on the montage page; Continue is not pressed (the flip is t04, seeded).
// Entry state: fresh game, no flags.
//   tools/video/takes/run-take.sh ca19_malware_and_updates t03_choices_reveal "" "--hide-hud --zoom-step 1"
// Picks: beat 1 "Remind me tomorrow" (unsafe), beat 2 "Leave it, and report it", beat 3 "Leave protection on and tell the service desk what it found", beat 4 "Leave it on the desktop" (unsafe).
// Marks: c1_shown, c1_pick, c4_shown, c4_pick, reveal, beat-boxes, trim-log, labels-left-visible, hidden-cards-proof, end, plus frame:*.
import { sleep, prepare, openKiosk, pressButton, pressEl, buttons, hideText, narrow, tabs, sprite } from './_ca19.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

const RESTART_1 = 'At a quarter to four, ransomware swept the floor, and the machines that had never restarted were the ones it locked.';

export async function run(page, bridge, mark, { narrowed = false } = {}) {
  await sprite(page, mark);
  await openKiosk(page, bridge, mark);
  mark('kiosk-buttons', { b: await buttons(page) });
  await pressButton(page, /^Start$/); await sleep(900);
  mark('kiosk-buttons2', { b: await buttons(page) });
  await pressButton(page, /Make the choices|Make the calls|Start the choices/); await sleep(1200);
  if (narrowed) await narrow(page, '.epr-kiosk-bezel', 560);
  mark('c1_shown', { tabs: await tabs(page) }); await sleep(700); mark('frame:c1-unpicked'); await sleep(800);
  await pressEl(page, /^Remind me tomorrow/); mark('c1_pick'); await sleep(1500); mark('frame:c1-picked'); await sleep(1900);
  await pressButton(page, /^Next/); await sleep(1100);
  await pressEl(page, /^Leave it, and report it/); await sleep(900); await pressButton(page, /^Next/); await sleep(1100);
  await pressEl(page, /^Leave protection on and tell the service desk/); await sleep(900); await pressButton(page, /^Next/); await sleep(1100);
  mark('c4_shown'); await sleep(700); mark('frame:c4-unpicked'); await sleep(800);
  await pressEl(page, /^Leave it on the desktop/); mark('c4_pick'); await sleep(1500); mark('frame:c4-picked'); await sleep(1900);
  // live before the montage renders: tags hidden, borders and backgrounds neutral, the enable_content and security_alert cards display:none
  await hideText(page, /^Your call/i);
  await page.evaluate(() => { window.__hideTimers = window.__hideTimers || []; window.__hideTimers.push(setInterval(() => {
    for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if (parseFloat(cs.borderLeftWidth) >= 3 && cs.borderLeftStyle !== 'none' && e.closest('.minigame-container, [class*=epr], [class*=reveal]')) { e.style.setProperty('border-left-color', '#1c2f5a', 'important'); e.style.setProperty('background-color', '#ffffff', 'important'); } }
  }, 100)); });
  await page.addStyleTag({ content: 'li.aw-montage-beat[data-beat="enable_content"],li.aw-montage-beat[data-beat="security_alert"]{display:none !important}' });
  await pressButton(page, /See where they led|See where they lead/); await sleep(700);
  mark('reveal', { tabs: await tabs(page), b: await buttons(page) });
  const beats = await page.evaluate(() => [...document.querySelectorAll('li.aw-montage-beat')].map(e => { const r = e.getBoundingClientRect(); return { beat: e.dataset.beat, shown: e.offsetParent !== null, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), txt: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 220) }; }));
  mark('beat-boxes', beats);
  // trim: replace each punch-in line's text with its first sentence (word for word). The line element is the deepest element of the beat whose text starts with the line.
  const trim = await page.evaluate(([o]) => {
    const out = [];
    for (const [beat, first] of [['restart_prompt', o]]) {
      const li = document.querySelector('li.aw-montage-beat[data-beat="' + beat + '"]'); if (!li) { out.push({ beat, err: 'no li' }); continue; }
      const el = [...li.querySelectorAll('*')].filter(e => (e.textContent || '').trim().startsWith(first) && ![...e.children].some(c => (c.textContent || '').trim().startsWith(first))).pop();
      if (!el) { out.push({ beat, err: 'no line starting with first sentence', all: (li.innerText || '').slice(0, 200) }); continue; }
      const before = (el.textContent || '').trim(); el.textContent = first;
      out.push({ beat, cls: String(el.className).slice(0, 40), before, after: el.textContent });
    }
    return out;
  }, [RESTART_1]);
  mark('trim-log', trim);
  if (trim.some(t => t.err)) throw new Error('trim failed: ' + JSON.stringify(trim));
  await sleep(1500); mark('frame:reveal'); await sleep(4500); mark('frame:reveal-mid'); await sleep(7000);
  const left = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden' && /^Your call/i.test((e.innerText || '').trim()) && (e.innerText || '').length < 60).length);
  mark('labels-left-visible', { left });
  if (left) throw new Error('verdict labels still visible: ' + left);
  // proof the three unwanted cards are not rendered, and no text of theirs is anywhere visible
  const proof = await page.evaluate(() => { const vis = [...document.querySelectorAll('body *')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map(e => e.innerText || '').join(' ');
    return { enable: /credit note|hidden program ran/i.test(vis), alert: /saved passwords|Quayholt Protect caught/i.test(vis), restartSecond: /shut the door it used/i.test(vis), saveBoth: /Saturday rebuilding/i.test(vis) }; });
  mark('hidden-cards-proof', proof);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
