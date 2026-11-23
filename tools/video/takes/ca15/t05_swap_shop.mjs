// t05_swap_shop: the Swap Shop sort drill, card 1 on screen, never picked (the reason shows straight after a pick).
// Entry state (kiosk opens on the Swap Shop panel):
//   BE_SPRITE=female_office_worker_v2 run-take.sh ca15_shadow_it t05_swap_shop \
//     "--set episode_e15_shadow_it_state={\"done\":[\"brief\",\"mistake\",\"flip\"]}" "--hide-hud --zoom-step 1"
// Actions: kiosk, Open the Swap Shop, Start; hold card 1 3 s; hover the four bins left to right over 3 s; end. No pick, no score line.
// Marks: panel, start_click, card1, hover_start, end.
import { sleep, prepare, openKiosk, pressButton, hideText } from './_ca15.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  await openKiosk(page, bridge, mark);
  await hideText(page, /sorted \d+ cards/i);
  await pressButton(page, /Open the Swap Shop/); await sleep(1000); mark('panel');
  await sleep(1000);
  await pressButton(page, /^Start$/); mark('start_click'); await sleep(900);
  mark('card1'); await sleep(3000);
  mark('hover_start');
  const boxes = await page.$$eval('.sd-bin-btn', els => els.map(e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  if (boxes.length !== 4) throw new Error('expected 4 bins, saw ' + boxes.length);
  await page.mouse.move(boxes[0].x - 60, boxes[0].y, { steps: 5 });
  for (let i = 0; i < 4; i++) { await page.mouse.move(boxes[i].x, boxes[i].y, { steps: 12 }); await sleep(550); }
  await sleep(300); mark('end');
};
