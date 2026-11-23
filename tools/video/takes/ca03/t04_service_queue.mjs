// t04_service_queue: the Defend queue, one capture feeding four edit windows (script: queue_a, topic, queue_b, queue_c). Clock = t from "list" (the queue list first on screen).
//   queue_a  list 0 to 4.2 s      "0 of 4 sorted", three calls and a sign-in prompt, nothing opened (the cursor rests off the panel)
//   topic    card1 5 to 11 s      first Gordon McLeish call card (header + four claimed facts); the call transcript is hidden by CSS
//   queue_b  card2 11 to 16 s     second Gordon McLeish card (rows stay in the left pane; click row 2), same four facts
//   queue_c  buttons 16 to 20 s   same second card, cursor sweeps Comply, Escalate, Refuse, Ring back and ends off the buttons with no hover held; NOTHING is pressed (a press shows the reason panel)
// Entry state (defend seat, skipping the whole attack: dry-run proved the seed reaches the queue, no call outcome global needed):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca03_helpdesk_reset t04_service_queue \
//     "--set episode_e3_helpdesk_reset_state={\"done\":[\"brief\",\"osint\",\"write\",\"mfa\",\"flip\"]}" "--hide-hud --zoom-step 1"
// Marks: kiosk-open, open_queue, start_click, list (= t0), card1_open, card2_open, buttons_view, hover:<verdict>, end; frame:* at each.
// Frame class: .mail-client.triage-client (960 px at x 480-1440 in the 1920 frame). A card closes only with Esc, which closes the whole minigame: never press Esc.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, mouseClick, waitVisible, addCss, narrowPanel } from './_ca03.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }

const HIDE = '.tri-call-transcript, .tri-transcript, .tri-per-flag-note, .tri-perflag-note, .tri-verdict-hint { visibility: hidden !important; }  /* .tri-verdict-hint = the line under each verdict word, the Ring back one is the answer */';

export async function run(page, bridge, mark, { narrow = false } = {}) {
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Open the queue/, 10000))) throw new Error('Open the queue never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(1200); mark('frame:kiosk-queue-panel');
  mark('open_queue'); await pressButton(page, /Open the queue/); await sleep(1200);
  mark('start_click'); await pressButton(page, /^Start$/);
  await waitVisible(page, 'button.mail-row');
  await addCss(page, HIDE);
  if (narrow) await narrowPanel(page, '.mail-client.triage-client', 560);
  await page.mouse.move(1700, 900); await sleep(600);
  mark('list'); mark('frame:list'); await sleep(4600);
  await mouseClick(page, 'button.mail-row', /Gordon/); mark('card1_open'); await sleep(400); mark('frame:card1'); await sleep(6000);
  const rows = page.locator('button.mail-row'); const n = await rows.count(); if (n < 2) throw new Error('rows: ' + n);
  const b2 = await rows.nth(1).boundingBox(); await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2, { steps: 12 }); await page.mouse.down(); await page.mouse.up();
  mark('card2_open'); await sleep(400); mark('frame:card2'); await sleep(4600);
  // Narrow only: at 560 px the four verdict buttons are clipped ("Compl", "Escal"), so from here they are laid out 2x2 (this hides part of the claims, which are not needed in the buttons window).
  if (narrow) await addCss(page, '.tri-verdicts { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px !important; } .tri-verdict { width: auto !important; min-width: 0 !important; height: auto !important; min-height: 84px !important; }');
  await sleep(300); mark('buttons_view'); mark('frame:buttons');
  // The sweep: one continuous pass over the four buttons in order (Comply, Escalate, Refuse, Ring back), no rest on any, ending off the buttons. Nothing is pressed.
  const sweepStart = Date.now(); const names = ['Comply', 'Escalate', 'Refuse', 'Ring back'];
  const first = await page.locator('button.tri-verdict', { hasText: names[0] }).first().boundingBox();
  await page.mouse.move(first.x - 40, first.y + first.height / 2, { steps: 6 }); mark('sweep_start');
  for (const nm of names) {
    const bx = await page.locator('button.tri-verdict', { hasText: nm }).first().boundingBox();
    await page.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps: 22 }); mark('hover:' + nm);
    if (nm === 'Escalate') mark('frame:sweep-mid');
  }
  await page.mouse.move(1700, 900, { steps: 18 }); mark('sweep_off');
  await sleep(300);
  mark('frame:queue_c-end');
  await sleep(Math.max(0, 4200 - (Date.now() - sweepStart))); mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, {});
