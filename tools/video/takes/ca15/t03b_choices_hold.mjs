// t03b_choices_hold: beat 3 of the ca15 r3 trailer. The "Everyday choices" launch panel held before any pick (kiosk, Start, panel settles, hold 4 s).
// Entry state: fresh game, no flags (Skip tutorial and the Mission Brief closed in setup()).
//   BE_SPRITE=female_office_worker_v2 run-take.sh ca15_shadow_it t03b_choices_hold "" "--hide-hud --zoom-step 1"
// Never presses "Make the choices". Marks: kiosk-open, start_click, everyday_shown (the edit's in = everyday_shown + 0.2), end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons } from './_ca15.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  await openKiosk(page, bridge, mark); mark('kiosk-open'); await sleep(1500);
  await page.mouse.move(1500, 1000);
  mark('start_click'); await pressButton(page, /^Start$/); await sleep(900);
  if (!(await waitButton(page, /Make the choices/, 8000))) throw new Error('Everyday choices panel not showing; buttons ' + JSON.stringify(await buttons(page)));
  mark('everyday_shown'); await sleep(4200);
  mark('end');
};
