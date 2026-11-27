// t03_choices_reveal: the four everyday choices, the "Six months later" reveal (verdict labels hidden) and the Swap Shop launch panel.
// Entry state: fresh game, no flags (Skip tutorial and the Mission Brief closed in setup()).
//   BE_SPRITE=female_office_worker_v2 run-take.sh ca15_shadow_it t03_choices_reveal "" "--hide-hud --zoom-step 1"
// Path: kiosk, Start, Make the choices. Card 1: hold 3 s unpicked, pick "Send the pack to your personal email", hold 3.4 s, Next.
// Card 2: pick "Ask IT for an approved team channel", Next. Card 3: hold 1 s, pick "Plug the visitor's stick into your laptop", hold 2.5 s, Next.
// Card 4: pick "Hold off, and ask IT", See where they led. Reveal page held 13.5 s with the mouse still; every "Your call" label is hidden
// and every card's left border is one neutral navy and every card background plain white (the labels, green/amber borders and the green tint on the safe cards are the verdict). Continue; hold the Swap Shop
// launch panel 3 s with the strip on Defend. Options are elements, not buttons (pressEl). Nothing is picked on the Swap Shop panel.
// Marks: c1_shown, c1_pick, c2_pick, c3_shown, c3_pick, c4_pick, reveal, continue_click, strip_defend, end.
import { sleep, prepare, openKiosk, pressButton, pressEl, waitButton, buttons, hideText, hideCss } from './_ca15.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  await openKiosk(page, bridge, mark);
  await pressButton(page, /^Start$/); await sleep(900);
  await pressButton(page, /Make the choices/); await sleep(1200);
  mark('c1_shown'); await sleep(3000);
  await pressEl(page, /^Send the (pack|client files) to your personal email/); mark('c1_pick'); await sleep(3400);
  await pressButton(page, /^Next/); await sleep(1300);
  await pressEl(page, /^Ask IT for an approved team channel/); mark('c2_pick'); await sleep(1600);
  await pressButton(page, /^Next/); await sleep(1000);
  mark('c3_shown'); await sleep(1000);
  await pressEl(page, /^Plug the visitor's (USB )?stick into your (work )?laptop/); mark('c3_pick'); await sleep(2500);
  await pressButton(page, /^Next/); await sleep(1300);
  await pressEl(page, /^Hold off, and ask IT/); mark('c4_pick'); await sleep(1500);
  // spoiler hides must be live before the reveal renders
  await hideText(page, /^Your call/i);
  await page.evaluate(() => { window.__hideTimers = window.__hideTimers || []; window.__hideTimers.push(setInterval(() => {
    for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if (parseFloat(cs.borderLeftWidth) >= 3 && cs.borderLeftStyle !== 'none' && e.closest('.minigame-container, [class*=epr], [class*=reveal]')) { e.style.setProperty('border-left-color', '#1c2f5a', 'important'); e.style.setProperty('background-color', '#ffffff', 'important'); } }
  }, 100)); });
  await pressButton(page, /See where they led/); await sleep(700);
  mark('reveal'); await sleep(13500);
  const left = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.offsetParent && e.style.visibility !== 'hidden' && /^Your call/i.test((e.innerText || '').trim()) && (e.innerText || '').length < 60).length);
  if (left) throw new Error('verdict labels still visible: ' + left);
  await pressButton(page, /^Continue/); mark('continue_click'); await sleep(1500);
  mark('strip_defend'); await sleep(3000);
  mark('end');
};
