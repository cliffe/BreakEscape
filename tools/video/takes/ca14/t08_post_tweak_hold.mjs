// t08_post_tweak_hold: the Post / Tweak / Hold drill, card 1 only. The kiosk opens on the Defend launch panel; "Open the cards" (the sort drill's launch button), Start if the intro shows;
// card 1 (the lanyard selfie) is held, then the mouse hovers Post, Tweak and Hold in turn. NOTHING IS PICKED: the reason shows straight after a pick.
// Entry state (kiosk on Defend):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t08_post_tweak_hold \
//     --set episode_e14_social_media_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_df_cover_attempts=1 "--hide-hud --zoom-step 1"
// setup() (off camera): prepare, then the hide CSS (reason, feedback, live line, the finish summary/score).
// Marks: kiosk-open, defend-panel, cards-open, intro, start, card1 (situation text logged), hover:<label> x3, hover-done, rect:drill, frame-chain, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, waitVisible, addCss, textShowing, NARROW_CSS, chain, hoverEach } from './_ca14.mjs';

export const HIDE_CSS = `.sd-reason, .sd-feedback, .sd-live, .sd-score, .sd-col-reason, .sd-col-mark { display: none !important; }`;

export const makeSetup = (narrow) => async (page, bridge) => {
  await prepare(page, bridge);
  await addCss(page, HIDE_CSS);
  if (narrow) await addCss(page, NARROW_CSS(560) + `.minigame-game-container:has(.sd-root) { max-width: 600px !important; } .sd-root { max-width: 560px !important; }`);
  await sleep(400);
};
export const makeRun = (narrow) => async (page, bridge, mark) => {
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Open the cards/, 10000))) throw new Error('Defend panel never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(1200); mark('defend-panel'); mark('frame:defend-panel');
  await pressButton(page, /Open the cards/);
  await waitVisible(page, '.sd-root'); mark('cards-open'); await sleep(900);
  if (await page.evaluate(() => !!document.querySelector('.sd-intro .sd-start'))) { mark('intro'); mark('frame:intro'); await sleep(1500); await pressButton(page, /^Start$|Start/); mark('start'); }
  await waitVisible(page, '.sd-card'); await page.mouse.move(40, 40);
  const sit = await page.$eval('.sd-situation', e => e.innerText.trim());
  mark('card1', { situation: sit }); mark('frame:card1');
  if (!/lanyard/i.test(sit)) throw new Error('card 1 is not the lanyard selfie: ' + sit);
  mark('frame-chain', { chain: await chain(page, '.sd-root') });
  mark('rect:drill', await page.$eval('.sd-root', e => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; }));
  await sleep(2500);
  const labels = await hoverEach(page, '.sd-bin-btn', { steps: 16, dwell: 900 });
  mark('hover-done', { labels }); mark('frame:hover-done');
  if (await page.evaluate(() => [...document.querySelectorAll('.sd-reason,.sd-feedback')].some(e => e.offsetParent))) mark('warn-reason-showing');
  await sleep(1000); mark('end');
};
export const setup = makeSetup(false);
export default makeRun(false);
