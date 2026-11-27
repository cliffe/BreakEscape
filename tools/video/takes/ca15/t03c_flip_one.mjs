// t03c_flip_one: beat 12 of the ca15 r3 trailer. The four everyday choices played as in t03, then the "Six months later" page with ONLY card 1's
// consequence showing (the headline montage beat; the other three li.aw-montage-beat are display:none), the "Your call" tags, taken tags and
// verdict colours hidden. Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 run-take.sh ca15_shadow_it t03c_flip_one "" "--hide-hud --zoom-step 1"
// Picks: card 1 personal email (unsafe), card 2 approved channel, card 3 plug the stick in, card 4 hold off (as t03). Presses Carry on on the red-team panel (off camera), never Continue.
// Marks: c1_pick..c4_pick, reveal (the edit's in), end. Verifies exactly one beat is visible.
import { sleep, prepare, openKiosk, pressButton, pressEl, hideText, buttons } from './_ca15.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  await openKiosk(page, bridge, mark);
  await pressButton(page, /^Start$/); await sleep(900);
  await pressButton(page, /Make the choices/); await sleep(1200);
  await pressEl(page, /^Send the (pack|client files) to your personal email/); mark('c1_pick'); await sleep(900);
  await pressButton(page, /^Next/); await sleep(1000);
  await pressEl(page, /^Ask IT for an approved team channel/); mark('c2_pick'); await sleep(900);
  await pressButton(page, /^Next/); await sleep(1000);
  await pressEl(page, /^Plug the visitor's (USB )?stick into your (work )?laptop/); mark('c3_pick'); await sleep(900);
  await pressButton(page, /^Next/); await sleep(1000);
  await pressEl(page, /^Hold off, and ask IT/); mark('c4_pick'); await sleep(900);
  await hideText(page, /^Your call/i);
  await page.addStyleTag({ content: 'li.aw-montage-beat:not(.aw-montage-headline){display:none !important} .aw-montage-tag{visibility:hidden !important}' });
  await page.evaluate(() => { window.__hideTimers = window.__hideTimers || []; window.__hideTimers.push(setInterval(() => {
    for (const e of document.querySelectorAll('li.aw-montage-beat')) { e.style.setProperty('border-left-color', '#1c2f5a', 'important'); e.style.setProperty('background-color', '#ffffff', 'important'); }
  }, 100)); });
  await pressButton(page, /See where they led/); await sleep(900);
  // the red-team step-away panel comes first (off camera here): Carry on skips the world beat and goes to the flip page
  await pressButton(page, /^Carry on/); await sleep(900);
  for (let i = 0; i < 30 && !(await page.$('li.aw-montage-beat')); i++) await sleep(200);
  const vis = await page.evaluate(() => [...document.querySelectorAll('li.aw-montage-beat')].filter(e => e.getClientRects().length).map(e => e.dataset.beat));
  if (vis.length !== 1) throw new Error('expected one visible montage beat, saw ' + JSON.stringify(vis) + ' of ' + await page.evaluate(() => [...document.querySelectorAll('li.aw-montage-beat')].map(e => e.dataset.beat + ':' + e.className).join(',')) + ' buttons ' + JSON.stringify(await buttons(page)));
  mark('reveal', { beat: vis[0] }); await sleep(5200);
  mark('end');
};
