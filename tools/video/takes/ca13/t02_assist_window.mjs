// t02_assist_window: the assistant window ("Brightwell Assist") filmed once for TWO shots: `topic` (idle, 1.5-8.5 s, nothing pressed, pointer drifting near "Summarise my emails")
// and `summary` (Summarise pressed at about 9.0 s, reply held to about 15.2 s). Entry state (kiosk shows only "Continue"; Continue opens the window; no attack run needed):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca13_ai_assistant t02_assist_window \
//     "--set episode_e13_ai_assistant_state={\"done\":[\"brief\",\"write\"]} --set phish_assist_reader_attempts=1 --set phish_assist_reader_landed=true" "--hide-hud --zoom-step 1"
// Window = .ac-game-container (720 px at 1920), root .ac-root. HIDES (CSS, always on): .ac-empathy ("And here is why it worked"), .ac-hidden-btn (Show hidden text), .ac-paste-line-text
// (the paste panel's child-allergy and password lines), .ac-done-badge. Never presses Show hidden text or the draft task or Strike out.
// Marks: player-sprite, kiosk-open, window-open, idle-start, summarise-click, reply-shown, end; frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, waitButton, waitVisible, visible, mouseClick, css, checkSprite, buttons, NARROW } from './_ca13.mjs';

export const ASSIST_HIDE = `.ac-empathy, .ac-hidden-btn, .ac-hidden-text, .ac-paste-line-text, .ac-done-badge { visibility: hidden !important; }`;
/** Narrowed variant: the window is already 720 px, wider than the 607 px frame; the root goes to 560 px. */
export const ASSIST_NARROW = `.ac-game-container .ac-root, .ac-root { max-width: 560px !important; }`;

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

export async function body(page, bridge, mark, narrow) {
  await css(page, ASSIST_HIDE);
  if (narrow) await css(page, ASSIST_NARROW);
  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open'); await sleep(1000);
  if (!(await waitButton(page, /^Continue/, 10000))) throw new Error('Continue never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await pressButton(page, /^Continue/);
  await waitVisible(page, 'button.ac-summarise-btn', null, 10000);
  mark('window-open'); mark('frame:window'); await sleep(300);
  const box = await page.evaluate(() => { const b = document.querySelector('button.ac-summarise-btn'); const r = b.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const title = await page.evaluate(() => (document.querySelector('h2.ac-title') || {}).innerText || null);
  mark('window-title', { title, box });
  const t0 = Date.now(); mark('idle-start');
  // idle 7 s: the pointer drifts around the button without ever being over it long enough to press; no click
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  await page.mouse.move(cx + 260, cy + 120, { steps: 5 });
  const pts = [[cx + 90, cy + 40], [cx + 30, cy + 8], [cx - 50, cy + 30], [cx - 120, cy + 70], [cx + 10, cy + 12]];
  for (const [x, y] of pts) { await page.mouse.move(x, y, { steps: 25 }); await sleep(900); }
  mark('frame:idle');
  const wait = 7500 - (Date.now() - t0); if (wait > 0) await sleep(wait);
  await mouseClick(page, 'button.ac-summarise-btn', null, { steps: 12, dwell: 450 });
  mark('summarise-click');
  await waitVisible(page, 'p.ac-reply-text', null, 8000);
  mark('reply-shown'); await sleep(1200); mark('frame:reply');
  const reply = await page.evaluate(() => (document.querySelector('p.ac-reply-text') || {}).innerText || '');
  mark('reply-text', { text: reply });
  await sleep(4800); mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
