// t03_fake_check_builder: the fake-check builder as the game draws it (shot "build", edit window 6-13.8 s of the take).
// Entry state: fresh game, no flags. setup() (off camera): kiosk, Start, the research browser (both Fernside facts noted), close, so the kiosk offers "Open the page builder".
// Body: hold the kiosk 1.5 s (start slate), Open the page builder, hold 2.2 s on the builder, pick the SAME four chips as t02_attack_run (real Fernside host "genuine", pretext "fits", urgency
// "calm", step "smooth"), hold 3 s. NEVER presses Score (the Credibility rows and the giveaway counter stay off screen; CSS also hides them), never Attach.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t03_fake_check_builder "" "--hide-hud --zoom-step 1"
// Marks: start-hold, builder-open, host-chosen, pretext-chosen, urgency-chosen, step-chosen, hold-end, end; frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, waitVisible, mouseClick, css, checkSprite } from './_ca10.mjs';

export const HIDE = `p.lpb-tell-counter, .lpb-score, .lpb-live { visibility: hidden !important; }`;
// Narrowed-panel variant (9:16, 1:1): panel max-width 560 px, panes stacked as the game's own <=700px layout does (same rules as ca05 t03b).
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
  await mouseClick(page, '.ob-site[data-site="fernside_site"]', null, { steps: 6, dwell: 100 }); await waitVisible(page, '.ob-block[data-id="blk_fernside_site"]'); await note('blk_fernside_site');
  await mouseClick(page, '.ob-site[data-site="quayholt_site"]', null, { steps: 6, dwell: 100 }); await waitVisible(page, '.ob-block[data-id="blk_fernside_portal"]'); await note('blk_fernside_portal');
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
  await chip(/The real Fernside order page/); await sleep(1100); mark('host-chosen');
  await chip(/Confirm you are human to continue to the order portal/); await sleep(1000); mark('pretext-chosen');
  await chip(/One quick step to continue/); await sleep(1000); mark('urgency-chosen');
  await chip(/A smooth, routine-looking accessibility check/); await sleep(1400); mark('step-chosen'); mark('frame:picks');
  await sleep(3000); mark('hold-end');
  const vis = await page.evaluate(() => [...document.querySelectorAll('p.lpb-tell-counter, .lpb-score, .lpb-live')].some(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden' && e.textContent.trim()));
  if (vis) throw new Error('tell counter or score rows visible');
  mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
