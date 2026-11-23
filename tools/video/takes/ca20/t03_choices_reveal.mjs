// t03_choices_reveal: the five everyday choices, each on the UNSAFE option (picked by label), beats 1 to 3 held at the pick for the edit (pick_train, pick_call, pick_laptop), beats 4 and 5 run
// through without a hold (never in the edit), then the "Later that day" montage with the headline card (cafe_wifi) and the tablet card (lost_tablet) display:none, every "Your call" tag hidden,
// borders neutral, so the train, cafe-call and laptop cards are contiguous (the edit crops to them, punches in on each), then Continue: the strip ticks to 4 Defend and the Defend launch panel
// (its paragraph hidden) is held. Never opens the Defend half.
// Entry state: fresh game, no flags (Skip tutorial and the Mission Brief popup closed in setup()).
//   BE_SPRITE=<player key> tools/video/takes/run-take.sh ca20 t03_choices_reveal "" "--hide-hud --zoom-step 1"
// Picks: 1 "Stay in the aisle seat and open it where you are...", 2 "Read the code and the room list out quietly down the phone", 3 "Thank them and leave it with them, back in a minute",
//   4 "Join the stronger network and sign in with your work account", 5 "Leave it till morning, it's locked and might still turn up".
// Marks: kiosk-buttons, c1_shown/c1_pick ... c5_pick (+ frame:cN-picked mid-hold), reveal (tabs), beat-boxes, led-crop (union of the three cards), labels-left-visible, hidden-cards-proof, continue_click,
//   flip (tabs, buttons), strip-box, defend-launch, para-visibility, end.
import { sleep, prepare, openKiosk, pressButton, pressEl, buttons, hideText, narrow, hideLong, tabs, waitButton, boxOf } from './_ca20.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

const PICKS = [
  [/^Stay in the aisle seat/, 'c1'], [/^Read the code and the room list out quietly/, 'c2'], [/^Thank them and leave it with them/, 'c3'],
  [/^Join the stronger network and sign in with your work account/, 'c4'], [/^Leave it till morning/, 'c5'],
];

export async function run(page, bridge, mark, { narrowed = false } = {}) {
  await hideLong(page, /tell the safe networks and pages/i);
  await openKiosk(page, bridge, mark);
  mark('kiosk-buttons', { b: await buttons(page) });
  await pressButton(page, /^Start$/); await sleep(900);
  mark('kiosk-buttons2', { b: await buttons(page), tabs: await tabs(page) });
  await pressButton(page, /Make the choices|Make the calls|Start the choices|Make the everyday calls/); await sleep(1200);
  if (narrowed) await narrow(page, '.epr-kiosk-bezel', 560);
  await page.mouse.move(1500, 1000);
  mark('c1_shown', { tabs: await tabs(page), b: await buttons(page) });
  for (let i = 0; i < 5; i++) {
    const [re, id] = PICKS[i]; const held = i < 3;
    if (i > 0) { mark(id + '_shown'); }
    if (held) { await sleep(900); mark('frame:' + id + '-unpicked'); await sleep(700); }
    await pressEl(page, re); mark(id + '_pick');
    if (held) { await sleep(1000); mark('frame:' + id + '-picked'); mark(id + '_card', { box: await boxOf(page, re), b: await buttons(page) }); await sleep(1300); } else await sleep(900);
    if (i < 4) { await pressButton(page, /^Next/); await sleep(1100); }
  }
  // live before the montage renders: tags hidden, borders and backgrounds neutral, the headline and tablet cards display:none
  await hideText(page, /^Your call/i);
  await page.evaluate(() => { window.__hideTimers = window.__hideTimers || []; window.__hideTimers.push(setInterval(() => {
    for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if (parseFloat(cs.borderLeftWidth) >= 3 && cs.borderLeftStyle !== 'none' && e.closest('.minigame-container, [class*=epr], [class*=reveal]')) { e.style.setProperty('border-left-color', '#1c2f5a', 'important'); e.style.setProperty('background-color', '#ffffff', 'important'); } }
  }, 100)); });
  await page.addStyleTag({ content: 'li.aw-montage-beat[data-beat="cafe_wifi"],li.aw-montage-beat[data-beat="lost_tablet"],.aw-montage-headline{display:none !important}' });
  await pressButton(page, /See where they led|See where they lead/); await sleep(700);
  await page.mouse.move(1500, 1000);
  mark('reveal', { tabs: await tabs(page), b: await buttons(page) });
  const beats = await page.evaluate(() => [...document.querySelectorAll('li.aw-montage-beat')].map(e => { const r = e.getBoundingClientRect(); return { beat: e.dataset.beat, shown: e.offsetParent !== null, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), txt: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 260) }; }));
  mark('beat-boxes', beats);
  const sh = beats.filter(b => b.shown);
  const want = ['train_screen', 'cafe_call', 'mind_laptop'];
  if (sh.map(b => b.beat).join() !== want.join()) throw new Error('visible beats are ' + sh.map(b => b.beat).join() + ', wanted ' + want.join());
  const u = { x: Math.min(...sh.map(b => b.x)), y: Math.min(...sh.map(b => b.y)) }; u.r = Math.max(...sh.map(b => b.x + b.w)); u.b = Math.max(...sh.map(b => b.y + b.h));
  mark('led-crop', { x: u.x, y: u.y, w: u.r - u.x, h: u.b - u.y, gapsBetween: sh.slice(1).map((b, i) => b.y - (sh[i].y + sh[i].h)) });
  const lap = sh[2].txt; if (!/stranger was lovely/i.test(lap) || !/could read your open inbox/i.test(lap)) throw new Error('laptop card text: ' + lap);
  await sleep(1500); mark('frame:reveal'); await sleep(2000); mark('frame:reveal-mid'); await sleep(2500);
  const left = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden' && /^Your call/i.test((e.innerText || '').trim()) && (e.innerText || '').length < 60).length);
  mark('labels-left-visible', { left }); if (left) throw new Error('verdict labels still visible: ' + left);
  const proof = await page.evaluate(() => { const vis = [...document.querySelectorAll('body *')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map(e => e.innerText || '').join(' ');
    return { tablet: /tablet/i.test(vis), wifiWords: /stronger network|work email|work password|look-alike/i.test(vis), safeSentences: /warned everyone|belong to themselves|two minutes/i.test(vis) }; });
  mark('hidden-cards-proof', proof);
  // Continue: the flip panel / Defend launch
  mark('continue_click'); await pressButton(page, /^Continue/); await sleep(900); await page.mouse.move(1500, 1000);
  mark('flip', { tabs: await tabs(page), b: await buttons(page) });
  const sb = await page.evaluate(() => { const e = document.querySelector('[class*=strip]'); const r = e && e.getBoundingClientRect(); return r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null; });
  mark('strip-box', sb);
  const para = await page.evaluate(() => { const e = [...document.querySelectorAll('body *')].find(x => /tell the safe networks and pages/i.test(x.textContent || '') && ![...x.children].some(c => /tell the safe networks and pages/i.test(c.textContent || ''))); return e ? { vis: getComputedStyle(e).visibility } : { vis: 'absent' }; });
  mark('para-visibility', para);
  mark('defend-launch', { b: await buttons(page), heading: await boxOf(page, /Sort the networks|Defend|On the road/i) });
  await sleep(1200); mark('frame:flip'); await sleep(1500);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
