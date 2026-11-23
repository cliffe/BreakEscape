// t09_privacy_panel: the privacy panel for Dani's profile. The kiosk opens on the privacy launch panel ("Open the settings"); five switches, all Open; one flicked to Tight.
// The facts under each switch ("Why it matters" lines, fact names, the closed/open state of each fact) and the counter are hidden: the frame is the five switches only.
// Entry state (kiosk on the privacy step: the drill's record is seeded inside the episode state, so the drill is skipped):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t09_privacy_panel \
//     --set episode_e14_social_media_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"],\"drill\":{\"done\":true,\"scored\":false,\"total\":7,\"placed\":7}} --set phish_df_cover_attempts=1 "--hide-hud --zoom-step 1"
// Marks: kiosk-open, launch-panel (button text logged), panel-open, switches (labels), rect:panel, frame-chain, hover-switch, flick, tight-state (switch states after), end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, waitVisible, addCss, NARROW_CSS, chain, mouseClick } from './_ca14.mjs';

export const HIDE_CSS = `.pp-facts, .pp-fact, .pp-hint, .pp-fact-note, .pp-counter, .pp-note, .pp-live { display: none !important; }`;

export const makeSetup = (narrow) => async (page, bridge) => {
  await prepare(page, bridge);
  await addCss(page, HIDE_CSS);
  if (narrow) await addCss(page, NARROW_CSS(560) + `.minigame-game-container:has(.pp-root) { max-width: 600px !important; } .pp-root { max-width: 560px !important; }`);
  await sleep(400);
};
export const makeRun = (narrow) => async (page, bridge, mark) => {
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  const b = await buttons(page); mark('launch-panel', { buttons: b });
  if (!(await waitButton(page, /Open the settings/, 10000))) throw new Error('privacy launch panel never showed; buttons: ' + JSON.stringify(b));
  await sleep(1200); mark('frame:launch-panel');
  await pressButton(page, /Open the settings/);
  await waitVisible(page, '.pp-root'); await waitVisible(page, 'button.pp-switch'); await page.mouse.move(40, 40);
  mark('panel-open'); mark('frame:panel-open');
  const labels = await page.$$eval('button.pp-switch', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim()));
  mark('switches', { labels });
  if (labels.length !== 5) throw new Error('expected 5 switches, saw ' + labels.length + ': ' + JSON.stringify(labels));
  mark('frame-chain', { chain: await chain(page, '.pp-root') });
  mark('rect:panel', await page.$eval('.pp-root', e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }));
  await sleep(2500);
  // hover the second switch, then click it (flicks to Tight)
  await mouseClick(page, 'button.pp-switch', null, { steps: 16, dwell: 900, click: false }); mark('hover-switch');
  await mouseClick(page, 'button.pp-switch', null, { steps: 4, dwell: 300 }); mark('flick'); mark('frame:flick');
  await sleep(1200);
  mark('tight-state', { labels: await page.$$eval('button.pp-switch', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim())) });
  mark('frame:tight'); await page.mouse.move(40, 40); await sleep(1800);
  const showing = await page.evaluate(() => [...document.querySelectorAll('.pp-fact,.pp-hint,.pp-fact-note,.pp-counter')].some(e => e.offsetParent));
  if (showing) mark('warn-facts-showing');
  mark('end');
};
export const setup = makeSetup(false);
export default makeRun(false);
