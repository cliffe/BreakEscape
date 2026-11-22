// t12_tailgater_card: the "Unknown visitor" (09:12) card in the defender's queue, held so the text can be read:
// "(slips in behind a badge-holder at the gate and heads for the stairs)". Same setup as t11 (kiosk, Take the calls panel,
// Open the queue, Start), then opens that row, HOLDS on the card about 6 s, makes a slow mouse pass over the four action
// buttons (hover only), holds 2 s and ends. Spoiler rules are lifted for Cyber Aware (owner), so no masks; still NO action
// button is pressed: no verdict, no reason panel, no score.
// Entry state (same as t11): fresh game, new-game with
//   --set episode_e12_visitor_tailgater_state={"done":["brief","osint","write","flip"]}      (no inner single quotes via run-take.sh)
//   run-take.sh ca12_visitor_tailgater t12_tailgater_card "--set episode_e12_visitor_tailgater_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]}" "--hide-hud --zoom-step 1"
// Marks: panel-queue, click:Open the queue, frame:brief-screen, click:Start, frame:list, click:Unknown visitor, frame:card-tailgater, hover, frame:hover, end.
import { sleep, pressButton, waitButton, clickEl, buttons, prepare, openKiosk } from './_ca12b.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  await openKiosk(page, bridge);
  if (await waitButton(page, /^Continue$/, 3000)) await pressButton(page, /^Continue$/); // the flip screen, if it shows
  if (!(await waitButton(page, /Open the queue/, 10000))) throw new Error('Take the calls panel never showed; check the --set state in the header');
  await sleep(500);
}

export default async (page, bridge, mark) => {
  mark('panel-queue'); await sleep(1500);
  mark('click:Open the queue'); await pressButton(page, /Open the queue/);
  await waitButton(page, /^Start$/, 10000); await sleep(1200); mark('frame:brief-screen');
  mark('click:Start'); await pressButton(page, /^Start$/);
  await sleep(1500); mark('frame:list');
  const row = await clickEl(page, /Unknown visitor/);
  if (!row) throw new Error('Unknown visitor row not found; buttons: ' + JSON.stringify((await buttons(page)).slice(0, 10)));
  mark('click:' + row.replace(/\s+/g, ' ').slice(0, 30));
  await sleep(900); mark('frame:card-tailgater');
  await sleep(6000);                                   // hold: the card text must be readable
  // slow pass of the mouse over the four action buttons: hover only, nothing pressed
  const boxes = await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent && /Let them in|Report|Turn away|Check first/.test(b.innerText)).map(b => { const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  mark('hover');
  if (boxes.length) { await page.mouse.move(boxes[0].x, boxes[0].y - 90, { steps: 4 }); for (const b of boxes) { await page.mouse.move(b.x, b.y, { steps: 20 }); await sleep(700); } mark('frame:hover'); }
  await sleep(2000);
  mark('end');                                         // no action pressed
};
