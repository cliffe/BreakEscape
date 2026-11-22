// t11_defend_queue: the defender's queue, read visitor by visitor (round 2 blue half, "how the defend half actually plays").
// Starts on the "Take the calls" panel, presses Open the queue and Start, then opens three visitor cards one after another
// (Visitor with a clipboard, Courier, Colleague back from leave), holding on each so the viewer can read who is
// at the desk, with a slow mouse pass over the four action buttons on the last card. It STOPS before any action is pressed:
// no verdict, no reason panel, no score, no result.
// Entry state (kiosk opens on the Defend panel, flip already done, no call needed): fresh game, new-game with
//   --set episode_e12_visitor_tailgater_state={"done":["brief","osint","write","flip"]}      (no inner single quotes via run-take.sh)
//   run-take.sh ca12_visitor_tailgater t11_defend_queue "--set episode_e12_visitor_tailgater_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]}" "--hide-hud --zoom-step 1"
// Spoiler rules: never press Let them in / Report / Turn away / Check first. Masks needed in the edit (source pixels, 1920x1080),
// per card: the "Today's list" line, and the four action-button boxes (same as t08); recorded in docs/video/edits/CA12_T11_MASKS.md.
// Marks: panel-queue, click:Open the queue, frame:brief-screen, click:Start, frame:list, click:<row>, frame:card1..3, hover, end.
import { sleep, pressButton, waitButton, clickEl, buttons, prepare, openKiosk } from './_ca12b.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  await openKiosk(page, bridge);
  if (await waitButton(page, /^Continue$/, 3000)) await pressButton(page, /^Continue$/); // the flip screen, if it shows
  if (!(await waitButton(page, /Open the queue/, 10000))) throw new Error('Take the calls panel never showed; check the --set state in the header');
  await sleep(500);
}

// Not "Unknown visitor" (its card says it slips in behind a badge-holder: the answer) nor "Signed-in visitor" ("having a good look").
// The three chosen cards each carry one verdict line (Today's list / Staff list) that CA12_T11_MASKS.md hides.
const ROWS = [/Visitor with a clipboard/, /Courier/, /Colleague back from/];

export default async (page, bridge, mark) => {
  mark('panel-queue'); await sleep(1500);
  mark('click:Open the queue'); await pressButton(page, /Open the queue/);
  await waitButton(page, /^Start$/, 10000); await sleep(1200); mark('frame:brief-screen');
  mark('click:Start'); await pressButton(page, /^Start$/);
  await sleep(1500); mark('frame:list');
  for (let i = 0; i < ROWS.length; i++) {
    const row = await clickEl(page, ROWS[i]);
    if (!row) throw new Error('visitor row ' + ROWS[i] + ' not found; buttons: ' + JSON.stringify((await buttons(page)).slice(0, 10)));
    mark('click:' + row.replace(/\s+/g, ' ').slice(0, 30));
    await sleep(900); mark('frame:card' + (i + 1));
    await sleep(i === 2 ? 1200 : 1800);
  }
  // slow pass of the mouse over the four action buttons of the open card: hover only, nothing pressed
  const boxes = await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent && /Let them in|Report|Turn away|Check first/.test(b.innerText)).map(b => { const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  mark('hover');
  if (boxes.length) { await page.mouse.move(boxes[0].x, boxes[0].y - 90, { steps: 4 }); for (const b of boxes) { await page.mouse.move(b.x, b.y, { steps: 14 }); await sleep(450); } mark('frame:hover'); }
  await sleep(400);
  mark('end');                                         // no action pressed
};
