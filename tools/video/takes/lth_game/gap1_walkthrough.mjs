// GAP-1 (S34 walkthrough 2.8 s) for the LTH whole-game trailer: the m01 walkthrough page, nothing expanded. NOT a game take: a plain headless-browser
//   screen capture of the published page (the game's Walkthrough menu item and Hacktivity's Walkthrough view both open this same lab sheet,
//   mission.json lab_sheet_url). Recorded on display :97 with no bridge: record-take.mjs --no-game (see run.sh gap1_walkthrough).
// URL: https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/m01-first-contact/?embedded=1  (embedded=1 = no site header, no URL bar: how the game's own popup shows it).
// Probed 2026-11-25: 1920x1080, page height 17689 px, 27 <details> (Nudge / Recipe), none open. #getting-started at y 844, #hints at 5756, #hints-start at 5957.
// Actions: load, settle 1.5 s, jump to #getting-started, slow scroll (wheel 40 px per 100 ms, about 400 px/s) for 4 s, then jump to #hints-start and hold 2 s so one
//   visible nudge and the closed "Nudge"/"Recipe" boxes show. Never click a summary. Heading in the centre third for the 9:16 crop.
// Marks: loaded, at-getting-started, scroll-end, at-hints-start, end. Expected length about 12 s raw; shot uses 2.8 s. Spoiler: none if nothing is expanded
//   (check the hints-start frame: the visible nudge is the page's own, gentle). UNTESTED under --no-game: the take function's signature there is not probed
//   (record-take --no-game calls takeFn(page, null, mark) and the page may start on about:blank; the goto above handles both). Fallback: plain Playwright
//   headless page screenshot sequence at 1920x1080.
import { sleep } from '../lib/lib.mjs';
export default async (page, _bridge, mark) => {
  await page.goto('https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/m01-first-contact/?embedded=1', { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(1500); mark('loaded');
  if (await page.evaluate(() => document.querySelectorAll('details[open]').length)) throw new Error('a details box is open');
  await page.evaluate(() => { const e = document.getElementById('getting-started'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 140); });
  await sleep(800); mark('at-getting-started');
  await page.mouse.move(960, 540);
  for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 40); await sleep(100); }
  mark('scroll-end'); await sleep(600);
  await page.evaluate(() => { const e = document.getElementById('hints-start'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 140); });
  await sleep(800); mark('at-hints-start'); await sleep(2000); mark('end');
};
