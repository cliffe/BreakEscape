// t03_page_builder: the look-alike page builder as the game draws it (shot "build", edit window 6-13.2 s of the take).
// Entry state: fresh game, no flags. setup() (off camera): kiosk, Start, the research browser (four blocks noted), close, so the kiosk offers
// "Open the page builder". Body: hold the kiosk 1.5 s (start slate), Open the page builder, hold 2.2 s on the empty builder, pick the Quayholt
// service chip, the quayholt-sso.example address from the three, "Show a secure padlock", hold 3 s. NEVER presses Score (the score rows and the
// "N giveaways" counter stay off screen; CSS also hides them). NEVER presses Attach to email.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca05_signin_pages t03_page_builder "" "--hide-hud --zoom-step 1"
// Marks: builder-open (the edit's 6.0 s is about builder-open + 0.5 s: retime), svc, address-chosen, padlock-chosen, hold-end, end; frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, waitVisible, mouseClick, css, checkSprite } from './_ca05.mjs';

export const HIDE = `p.lpb-tell-counter, .lpb-score, .lpb-live { visibility: hidden !important; }`;
// Narrowed-panel variant (9:16, 1:1): panel max-width 560 px, panes stacked the way the game's own <=700px layout does it
// (the media query is keyed to the viewport, which is 1920 wide, so the same rules are applied directly).
export const NARROW = `
.lpb-game-container { width: 560px !important; max-width: 560px !important; }
.lpb-body { flex-direction: column !important; }
.lpb-preview-pane { flex: 0 0 auto !important; max-height: 38vh; border-right: none !important; border-bottom: 3px solid var(--ui-line, #4c5b80); }
.lpb-panel { flex: 1 1 auto !important; min-height: 0; }
.lpb-chip { width: 100% !important; }`;

export async function setup(page, bridge) {
  await prepare(page, bridge);
  await sleep(400);
  await openKiosk(page, bridge, () => {}); await sleep(800);
  await pressButton(page, /^Start$/); await sleep(800);
  await pressButton(page, /Open the browser/);
  await waitVisible(page, '.ob-root');
  const note = async (id) => { await mouseClick(page, `.ob-block[data-id="${id}"]`, null, { steps: 6, dwell: 100 }); await waitVisible(page, `.ob-block.is-noted[data-id="${id}"]`); await sleep(200); };
  await note('blk_staff');
  await mouseClick(page, 'a.ob-link', /Signing in/i, { steps: 6, dwell: 100 });
  await waitVisible(page, '.ob-block[data-id="blk_sso"]'); await note('blk_sso'); await note('blk_itdesk');
  await mouseClick(page, 'a.ob-link', /Company news/i, { steps: 6, dwell: 100 });
  await waitVisible(page, '.ob-block[data-id="blk_news"]'); await note('blk_news');
  await bridge.minigame.close();
  if (!(await waitButton(page, /page builder/i, 10000))) throw new Error('builder button never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(500);
}

export async function body(page, bridge, mark, narrow) {
  await css(page, HIDE + (narrow ? NARROW : ''));
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  await pressButton(page, /page builder/i);
  await waitVisible(page, '.lpb-root'); mark('builder-open'); mark('frame:builder-open'); await sleep(2200);
  const chip = (re) => mouseClick(page, 'button.lpb-chip', re, { steps: 12, dwell: 450 });
  await chip(/^Quayholt$/); await sleep(900); mark('svc');
  await chip(/quayholt-sso\.example/); await sleep(1400); mark('address-chosen');
  await chip(/Show a secure padlock/); await sleep(1800); mark('padlock-chosen'); mark('frame:padlock');
  await sleep(3000); mark('hold-end');
  const txt = await page.evaluate(() => document.body.innerText);
  if (/giveaway/i.test(txt) && await page.evaluate(() => { const e = document.querySelector('p.lpb-tell-counter'); return !!(e && getComputedStyle(e).visibility !== 'hidden'); })) throw new Error('giveaway counter is visible');
  mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
