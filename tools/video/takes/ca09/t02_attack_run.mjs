// t02_attack_run: the whole attack in one take. Kiosk Start; "Open the browser": Friendface People list, Colin Mather's profile held with nothing noted
// (topic shot); the three posts noted one by one (team, dog, forum, each with its "Noted: ..." line), Tarrowby's About us noted (founding year), browser closed;
// "Open the guesser": the four hidden common guesses stepped fast, the three made-up pattern guesses stepped slowly (build shot), the reuse row stepped until it
// opens (lands shot); "Switch the rig off" closes the guesser onto the kiosk flip ("Now it's your phone.", framed on the heading and strip only).
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca09 t02_attack_run "" "--hide-hud --zoom-step 1"
// setup() (off camera): prepare (Skip tutorial, close the Brief), then inject GUESSER_HIDE_CSS (common-passwords panel, passphrase panel, live log line).
// HIDES (all aspects): [data-panel=common] (prints 123456 / password / qwerty / tarrowby), [data-panel=passphrase] (the answer row), .epr-gs-live (echoes every tried guess,
//   including the common ones). The four common rows are hidden but still stepped (the button says "9 to go" at first: 4 hidden + 3 patterns + reuse + passphrase).
//   The take asserts textShowing(/123456|qwerty/) and textShowing(/otter ladder|crimson/) are false at every guesser mark (hide proof) and throws otherwise.
// Beats and marks: kiosk-open, start, browser-open, friendface-tab, topic_start (Colin's profile up, nothing noted; hold 7 s), note-team, note-pet, note-forum,
//   about-open, note-about, browser-closed, guesser-open, hidden-steps-done, build_start (first pattern guess), pattern-1..3, lands_start (just before the reuse step),
//   reuse-opens (row state opens), lands_end, final-step (the hidden passphrase row, needed before the switch works), switch, flip-up (frame is the heading + strip), end. Frame marks at each beat for the dry run.
// The first kiosk interact can be swallowed (openKiosk retries up to 3).
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, GUESSER_HIDE_CSS, NARROW_CSS, addCss, textShowing } from './_ca09.mjs';

export const makeSetup = (narrow) => async (page, bridge) => {
  await prepare(page, bridge);
  await addCss(page, GUESSER_HIDE_CSS);
  if (narrow) await addCss(page, NARROW_CSS(560));
  await sleep(400);
};
export const makeRun = () => async (page, bridge, mark) => {
  const assertHidden = async (where) => {
    if (await textShowing(page, /123456|qwerty/)) throw new Error('common passwords showing at ' + where);
    if (await textShowing(page, /otter ladder|crimson/i)) throw new Error('passphrase showing at ' + where);
    const live = await page.evaluate(() => { const e = document.querySelector('.epr-gs-live'); return e ? getComputedStyle(e).display : 'absent'; });
    if (live !== 'none' && live !== 'absent') throw new Error('live log showing at ' + where);
  };
  const state = (re) => page.evaluate((src) => { const r = [...document.querySelectorAll('.epr-gs-row')].find(e => new RegExp(src, 'i').test(e.innerText)); return r ? r.dataset.state : null; }, re.source);
  const step = async (wait) => { await mouseClick(page, '.epr-gs-step', null, { steps: 8, dwell: 150 }); await sleep(wait); };

  await openKiosk(page, bridge, mark); mark('kiosk-open'); await sleep(1200);
  await pressButton(page, /^Start$/); mark('start'); await sleep(1500);

  // research: the browser opens on Tarrowby Logistics; go straight to Friendface, People, Colin
  await pressButton(page, /Open the browser/);
  await waitVisible(page, '.ob-root'); mark('browser-open'); await sleep(900);
  await mouseClick(page, 'button.ob-site', /Friendface/i, { steps: 12, dwell: 350 });
  await waitVisible(page, '.ob-profile-link'); mark('friendface-tab'); await sleep(700);
  await mouseClick(page, '.ob-profile-link', /Colin Mather/i, { steps: 12, dwell: 350 });
  await waitVisible(page, '.ob-block[data-id="post_mather_team"]');
  await page.mouse.move(40, 40);               // park the pointer off the panel: nothing hovered, nothing noted
  mark('frame:topic_start'); mark('topic_start');
  const noted0 = await page.$$eval('.ob-block.is-noted', e => e.length);
  if (noted0 !== 0) throw new Error('something is already noted at the topic shot');
  await sleep(7000);
  const note = async (id, label) => {
    await mouseClick(page, `.ob-block[data-id="${id}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, `.ob-block.is-noted[data-id="${id}"]`); await sleep(500);
    const line = await page.evaluate(() => [...document.querySelectorAll('.ob-live')].map(e => e.innerText.trim()).filter(Boolean).join(' | '));
    mark(label, { line }); await sleep(1100);
  };
  await note('post_mather_team', 'note-team'); mark('frame:noted_team');
  await note('post_mather_pet', 'note-pet');
  await note('post_mather_forum', 'note-forum');
  await mouseClick(page, 'button.ob-site', /Tarrowby/i, { steps: 12, dwell: 300 });
  await mouseClick(page, 'a.ob-link', /About us/i, { steps: 12, dwell: 350 });
  await waitVisible(page, '.ob-block[data-id="blk_about"]'); mark('about-open'); await sleep(800);
  await note('blk_about', 'note-about'); mark('frame:noted_about'); await sleep(500);
  await bridge.minigame.close();
  if (!(await waitButton(page, /Open the guesser/, 10000))) throw new Error('guesser button never showed; buttons: ' + JSON.stringify(await buttons(page)));
  mark('browser-closed'); await sleep(1100);

  // guesser
  await pressButton(page, /Open the guesser/);
  await waitVisible(page, '.epr-gs-root'); mark('guesser-open'); await assertHidden('guesser-open'); mark('frame:guesser_open'); await sleep(1600);
  for (let i = 0; i < 4; i++) { await step(450); }          // the four hidden common guesses, fast
  await assertHidden('after hidden steps'); mark('hidden-steps-done'); await sleep(700);
  const pats = ['Pennington', 'Bramble', 'Tarrowby1994'];
  for (let i = 0; i < pats.length; i++) {
    await step(300);
    if (i === 0) { mark('build_start'); }
    await sleep(1000);
    const st = await state(new RegExp(pats[i]));
    mark('pattern-' + (i + 1), { state: st }); await assertHidden('pattern ' + (i + 1));
    if (i === 0) mark('frame:pattern_1'); if (i === 2) mark('frame:patterns_done');
    await sleep(500);
  }
  await sleep(500); mark('lands_start');
  await step(150);
  const t0 = Date.now(); let opened = false;
  while (Date.now() - t0 < 5000) { if ((await state(/RiverReach/)) === 'opened') { opened = true; break; } await sleep(100); }
  if (!opened) throw new Error('reuse row never opened');
  mark('reuse-opens'); await assertHidden('reuse opens'); mark('frame:reuse_opens');
  await sleep(3200); mark('lands_end');

  // flip: the switch only works once every row has run, including the hidden passphrase row (one more step; its panel stays hidden)
  await step(1300); await assertHidden('final hidden step'); mark('final-step');
  await mouseClick(page, '.epr-gs-off', null, { steps: 12, dwell: 450 }); mark('switch');
  await waitVisible(page, 'body *', /Now it.s your phone/i, 10000).catch(() => { throw new Error('flip heading never showed'); });
  mark('flip-up'); mark('frame:flip'); await sleep(3000); mark('end');
};
export const setup = makeSetup(false);
export default makeRun();
