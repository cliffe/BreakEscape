// t02_attack_run: the whole attack in one take; feeds topic, research, words, build, spray and flip (retime from the marks). Kiosk Start; "Open the browser": the practice's "Our people"
// page held with nothing pinned (topic), then the team line pinned (note-team), Contact us (the address pattern, note-pattern), Projects (note-project), Home (note-strapline), Visit us
// (note-street); browser closed; "Open the guesser": "Who works here" and "Words from the practice's own website" fill step by step, then the four passes ("tried once on every account"), then
// the result row "N of M accounts opened" (mark `result`); the three stuffing rows and the hidden passphrase row are stepped fast (the switch needs them); "Finish and see the results"
// closes onto the kiosk flip "Now it's your inbox." (heading and strip only; mark `flip-up`; `flip-up-narrow` in the narrow variant t02b is the same moment).
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca18 t02_attack_run "" "--hide-hud --zoom-step 1"
// setup() (off camera): prepare (Skip tutorial, close the Brief), GUESSER_HIDE_CSS (passphrase panel, live log line), and in the narrow variant NARROW_CSS(560).
// HIDES (all aspects): .epr-gs-panel[data-panel=passphrase] (the answer harbour ladder crimson), .epr-gs-live (echoes each tried guess). The take asserts at every guesser mark that
//   "harbour", "ladder" and "crimson" are not showing and the live line is display:none, and throws otherwise. The flip body and aftermath cards are hidden by FLIP_HIDE_CSS (heading and strip only).
// HAZARD: the result row's text "N of M accounts opened" is in the DOM as soon as the guesser opens (state queued, "waiting"): the take logs whether it shows before its step (mark result-visible-early)
//   and the edit can crop or accept it (see takes_ca18.md).
// Marks: kiosk-open, start, browser-open, topic_start, note-team, note-pattern, note-project, note-strapline, note-street (each with the "Noted" line), browser-closed, guesser-open, roster-built,
//   words-built, pass-1..4 (row state), result (text), stuffing-steps-done, final-step, switch, flip-up, end; frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, addCss, textShowing, GUESSER_HIDE_CSS, NARROW_CSS, checkSprite, chain } from './_ca18.mjs';

/** The flip page: heading and strip only; the body and the aftermath cards stay out of frame (hidden, not cropped, in every aspect). */
export const FLIP_HIDE_CSS = `.aw-flip > *:not(.aw-heading):not(.aw-continue) { visibility: hidden !important; }`;

export const makeSetup = (narrow) => async (page, bridge) => {
  await prepare(page, bridge);
  await addCss(page, GUESSER_HIDE_CSS + FLIP_HIDE_CSS);
  if (narrow) await addCss(page, NARROW_CSS(560));
  await sleep(400);
};
export const makeRun = (narrow) => async (page, bridge, mark) => {
  const assertHidden = async (where) => {
    if (await textShowing(page, /harbour|ladder|crimson/i)) throw new Error('passphrase showing at ' + where);
    const live = await page.evaluate(() => { const e = document.querySelector('.epr-gs-live'); return e ? getComputedStyle(e).display : 'absent'; });
    if (live !== 'none' && live !== 'absent') throw new Error('live log showing at ' + where);
  };
  const rowState = (re) => page.evaluate((src) => { const r = [...document.querySelectorAll('.epr-gs-row')].find(e => new RegExp(src, 'i').test(e.innerText)); return r ? r.dataset.state : null; }, re.source);
  const step = async (wait) => { await mouseClick(page, '.epr-gs-step', null, { steps: 8, dwell: 150 }); await sleep(wait); };
  const note = async (id, label) => {
    await mouseClick(page, `.ob-block[data-id="${id}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, `.ob-block.is-noted[data-id="${id}"]`); await sleep(500);
    const line = await page.evaluate(() => [...document.querySelectorAll('.ob-live')].map(e => e.innerText.trim()).filter(Boolean).join(' | '));
    mark(label, { line }); mark('frame:' + label); await sleep(1000);
  };
  const goto = async (re, blk) => { await mouseClick(page, 'a.ob-link', re, { steps: 12, dwell: 350 }); await waitVisible(page, `.ob-block[data-id="${blk}"]`); await sleep(500); };

  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open'); await sleep(1200);
  await pressButton(page, /^Start$/); mark('start'); await sleep(1500);

  // research: the browser opens on the practice's own site, "Our people"
  await pressButton(page, /Open the browser/);
  await waitVisible(page, '.ob-root'); await waitVisible(page, '.ob-block[data-id="blk_people"]'); mark('browser-open'); await sleep(600);
  await page.mouse.move(40, 40);                // pointer off the panel: nothing hovered, nothing pinned
  if ((await page.$$eval('.ob-block.is-noted', e => e.length)) !== 0) throw new Error('something is already noted at the topic shot');
  mark('topic_start'); mark('frame:topic_start'); await sleep(6500);
  await note('blk_people', 'note-team');
  await goto(/Contact us/, 'blk_contact'); await note('blk_contact', 'note-pattern');
  await goto(/Projects/, 'blk_projects'); await note('blk_projects', 'note-project');
  await goto(/^Home$/, 'blk_home'); await note('blk_home', 'note-strapline');
  await goto(/Visit us/, 'blk_visit'); await note('blk_visit', 'note-street');
  await bridge.minigame.close();
  if (!(await waitButton(page, /Open the guesser/, 10000))) throw new Error('guesser button never showed; buttons: ' + JSON.stringify(await buttons(page)));
  mark('browser-closed'); await sleep(1000);

  // guesser: 2 fact rows + 5 addresses + 4 words (11 steps), 4 passes, the result row, 3 stuffing rows, the hidden passphrase row
  await pressButton(page, /Open the guesser/);
  await waitVisible(page, '.epr-gs-root'); mark('guesser-open'); await assertHidden('guesser-open');
  mark('guesser-chain', await chain(page, '.epr-gs-root'));
  const early = await textShowing(page, /\d+ of \d+ accounts opened/); mark('result-visible-early', { early });
  mark('frame:guesser_open'); await sleep(1500);
  for (let i = 0; i < 2; i++) await step(550);       // team names, address pattern
  mark('frame:facts_collected');
  for (let i = 0; i < 5; i++) await step(420);       // the five built addresses
  await sleep(300); mark('roster-built'); mark('frame:roster_built'); await assertHidden('roster-built');
  for (let i = 0; i < 4; i++) await step(480);       // the four words
  await sleep(300); mark('words-built'); mark('frame:words_built'); await assertHidden('words-built');
  await sleep(500);
  for (let i = 1; i <= 4; i++) {
    await step(300); await sleep(700);
    mark('pass-' + i, { state: await page.evaluate((n) => { const r = [...document.querySelectorAll('.epr-gs-row')].filter(e => e.dataset.state === 'sprayed' || /tried once/i.test(e.innerText)); return r.length; }, i) });
    if (i === 1 || i === 4) mark('frame:pass_' + i); await assertHidden('pass ' + i); await sleep(300);
  }
  await step(300);                                    // the result row
  const t0 = Date.now(); let resText = null;
  while (Date.now() - t0 < 6000) { resText = await page.evaluate(() => { const r = [...document.querySelectorAll('.epr-gs-row')].find(e => /\d+ of \d+ accounts opened/.test(e.innerText) && e.dataset.state !== 'queued'); return r ? r.innerText.replace(/\s+/g, ' ').trim() : null; }); if (resText) break; await sleep(100); }
  if (!resText) throw new Error('result row never left the queued state');
  mark('result', { text: resText }); mark('frame:result'); await assertHidden('result'); await sleep(3000);
  // the rest (stuffing rows, hidden passphrase row) quickly: the switch needs them
  for (let i = 0; i < 6; i++) { const left = await page.$('.epr-gs-step'); if (!left) break; const dis = await page.$eval('.epr-gs-off', e => !e.disabled).catch(() => false); if (dis) break; await step(700); await assertHidden('final steps'); }
  mark('stuffing-steps-done'); mark('final-step');
  await mouseClick(page, '.epr-gs-off', null, { steps: 12, dwell: 450 }); mark('switch');
  await waitVisible(page, '.aw-flip .aw-heading', /Now it.s your inbox/i, 10000).catch(() => { throw new Error('flip heading never showed'); });
  mark('flip-up'); if (narrow) mark('flip-up-narrow'); mark('frame:flip'); await sleep(3000); mark('end');
};
export const setup = makeSetup(false);
export default makeRun(false);
