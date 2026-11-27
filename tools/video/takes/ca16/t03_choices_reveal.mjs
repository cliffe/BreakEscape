// t03_choices_reveal: the five everyday choices on the UNSAFE option each (picked by label text), card 3 (the 25% remote-access offer) and card 4 (Ross's export) shown
// with the pick highlighted, then "A week later" montage with the rumour, Samira and Reuben (shared login) cards hidden by CSS, "Your call" tags hidden, borders neutral,
// and the two punch-in lines trimmed to their first sentence in the page DOM (word for word; the second sentences name the safe route). Never opens the Defend half.
// Entry state: fresh game, no flags (Skip tutorial and the Mission Brief closed in setup()).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t03_choices_reveal "" "--hide-hud --zoom-step 1"
// Picks: beat 1 "Let him use your login while you sit beside him", beat 2 "Say you'd wondered about her leaving too", beat 3 "Reply to find out who's really behind it",
//   beat 4 "Export the accounts to his personal email as asked", beat 5 "Ask her straight so she can clear it up". Beats 1, 2, 5 are never shown (the edit only uses 3 and 4).
// Marks: tab:<heading> per panel, c3_shown, c3_pick, c4_shown, c4_pick, reveal, beat-boxes, trim-log, labels-left-visible, hidden-cards-proof, end, plus frame:*.
import { sleep, prepare, openKiosk, pressButton, pressEl, buttons, hideText, narrow, hideLong, tabs } from './_ca16.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

const OFFER_1 = 'A reply drew more pressure, then a flood of sign-in prompts that night.';
const EXPORT_1 = 'The client list sat in a personal inbox outside the firm.';

export async function run(page, bridge, mark, { narrowed = false } = {}) {
  await openKiosk(page, bridge, mark);
  mark('kiosk-buttons', { b: await buttons(page) });
  await pressButton(page, /^Start$/); await sleep(900);
  mark('kiosk-buttons2', { b: await buttons(page) });
  await pressButton(page, /Make the choices|Make the calls|Start the choices/); await sleep(1200);
  if (narrowed) await narrow(page, '.epr-kiosk-bezel', 560);
  mark('c1_shown', { tabs: await tabs(page) });
  await pressEl(page, /^Let him use your login/); await sleep(900); await pressButton(page, /^Next/); await sleep(1100);
  await pressEl(page, /^Say you'd wondered about her leaving/); await sleep(900); await pressButton(page, /^Next/); await sleep(1100);
  mark('c3_shown'); await sleep(700); mark('frame:c3-unpicked'); await sleep(800);
  await pressEl(page, /^Reply to find out who's really behind it/); mark('c3_pick'); await sleep(1500); mark('frame:c3-picked'); await sleep(1900);
  await pressButton(page, /^Next/); await sleep(1200);
  mark('c4_shown'); mark('frame:c4-unpicked'); await sleep(1500);
  await pressEl(page, /^Export the accounts to his personal email/); mark('c4_pick'); await sleep(1500); mark('frame:c4-picked'); await sleep(1900);
  await pressButton(page, /^Next/); await sleep(1200);
  await pressEl(page, /^Ask her straight so she can clear it up/); mark('c5_pick'); await sleep(1000);
  // live before the montage renders: tags hidden, borders and backgrounds neutral, the three unwanted cards display:none
  await hideText(page, /^Your call/i);
  await page.evaluate(() => { window.__hideTimers = window.__hideTimers || []; window.__hideTimers.push(setInterval(() => {
    for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if (parseFloat(cs.borderLeftWidth) >= 3 && cs.borderLeftStyle !== 'none' && e.closest('.minigame-container, [class*=epr], [class*=reveal]')) { e.style.setProperty('border-left-color', '#1c2f5a', 'important'); e.style.setProperty('background-color', '#ffffff', 'important'); } }
  }, 100)); });
  await page.addStyleTag({ content: 'li.aw-montage-beat[data-beat="rumour"],li.aw-montage-beat[data-beat="samira"],li.aw-montage-beat[data-beat="shared_login"]{display:none !important}' });
  await pressButton(page, /See where they led|See where they lead/); await sleep(700);
  mark('reveal', { tabs: await tabs(page) });
  const beats = await page.evaluate(() => [...document.querySelectorAll('li.aw-montage-beat')].map(e => { const r = e.getBoundingClientRect(); return { beat: e.dataset.beat, shown: e.offsetParent !== null, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), txt: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 220) }; }));
  mark('beat-boxes', beats);
  // trim: replace each punch-in line's text with its first sentence (word for word). The line element is the deepest element of the beat whose text starts with the line.
  const trim = await page.evaluate(([o, x]) => {
    const out = [];
    for (const [beat, first] of [['outside_offer', o], ['leaver_favour', x]]) {
      const li = document.querySelector('li.aw-montage-beat[data-beat="' + beat + '"]'); if (!li) { out.push({ beat, err: 'no li' }); continue; }
      const el = [...li.querySelectorAll('*')].filter(e => (e.textContent || '').trim().startsWith(first) && ![...e.children].some(c => (c.textContent || '').trim().startsWith(first))).pop();
      if (!el) { out.push({ beat, err: 'no line starting with first sentence', all: (li.innerText || '').slice(0, 200) }); continue; }
      const before = (el.textContent || '').trim(); el.textContent = first;
      out.push({ beat, cls: String(el.className).slice(0, 40), before, after: el.textContent });
    }
    return out;
  }, [OFFER_1, EXPORT_1]);
  mark('trim-log', trim);
  if (trim.some(t => t.err)) throw new Error('trim failed: ' + JSON.stringify(trim));
  await sleep(1500); mark('frame:reveal'); await sleep(4500); mark('frame:reveal-mid'); await sleep(7000);
  const left = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden' && /^Your call/i.test((e.innerText || '').trim()) && (e.innerText || '').length < 60).length);
  mark('labels-left-visible', { left });
  if (left) throw new Error('verdict labels still visible: ' + left);
  // proof the three unwanted cards are not rendered, and no text of theirs is anywhere visible
  const proof = await page.evaluate(() => { const vis = [...document.querySelectorAll('body *')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map(e => e.innerText || '').join(' ');
    return { samira: /Samira/i.test(vis), reuben: /Reuben/i.test(vis), rumour: /rumour|Craig/i.test(vis), safeSentences: /warned everyone|belong to themselves|two minutes/i.test(vis) }; });
  mark('hidden-cards-proof', proof);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
