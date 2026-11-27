// t04_defend_list: the Defend panel, the eight-item list. Kiosk panel only (no avatar). Nothing is pressed except opening one row.
// Entry state (kiosk opens on the Defend panel; buttons "Open the inbox", then "Start"):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca09 t04_defend_list "--set episode_e9_passwords_state={\"done\":[\"brief\",\"osint\",\"guess\",\"flip\"]} --set guess_e9_landed=true" "--hide-hud --zoom-step 1"
// setup() (off camera): prepare, kiosk, wait for "Open the inbox", inject DEFEND_HIDE_CSS (the team tally "Risks reported or checked for the team: N", a score line).
// Takes the order the game allows (a card cannot be closed: a second click keeps it, Esc closes the whole minigame), cut out of order in the edit:
//   (a) the list held ~8 s, all eight rows in view, none sorted (no scroll needed: it all fits);
//   (c) the pointer hovers slowly down the five password-choice "Question" rows, ~4.5 s, NO card open;
//   (b) the first Sign-in prompt row clicked: card "Are you trying to sign in?" with Approve / Deny / Deny and report, each hovered ~0.8 s, never pressed, ~2.5 s.
// Marks: inbox-open, start, list-up, list-held-end, rows_hover_start, hover-row:<n>, rows_hover_end, click-prompt, card-open, hover-<verb>, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, DEFEND_HIDE_CSS, NARROW_CSS, addCss, textShowing } from './_ca09.mjs';

export const makeSetup = (narrow) => async (page, bridge) => {
  await prepare(page, bridge);
  await openKiosk(page, bridge, () => {});
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('kiosk is not on the Defend panel; buttons: ' + JSON.stringify(await buttons(page)));
  await addCss(page, DEFEND_HIDE_CSS);
  if (narrow) await addCss(page, NARROW_CSS(560));
  await page.mouse.move(40, 40);
  await sleep(500);
};
export const makeRun = () => async (page, bridge, mark) => {
  const T0 = Date.now(); const at = async (s) => { const w = T0 + s * 1000 - Date.now(); if (w > 0) await sleep(w); };
  await at(0.4); await pressButton(page, /Open the inbox/); mark('inbox-open');
  await at(1.4); await pressButton(page, /^Start$/); mark('start');
  await waitVisible(page, '.mail-row');
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).length);
  if (rows !== 8) throw new Error('expected 8 rows, saw ' + rows);
  if (await textShowing(page, /Risks reported or checked/)) throw new Error('team tally showing');
  await page.mouse.move(40, 40);
  mark('list-up', { rows }); mark('frame:list_up');
  const L0 = Date.now();
  await sleep(8000 - (Date.now() - L0)); mark('list-held-end');
  // (c) hover down the password rows, no card open
  const pw = [/Which password is stronger/i, /password for the new Fuelr/i, /security question/i, /How to sign in/i, /sticky note/i];
  mark('rows_hover_start');
  for (let i = 0; i < pw.length; i++) {
    await mouseClick(page, '.mail-row', pw[i], { steps: 22, dwell: 450, click: false });
    mark('hover-row:' + (i + 1));
    if (i === 2) mark('frame:rows_hover');
    await sleep(350);
  }
  mark('rows_hover_end');
  if (await visible(page, '.tri-verdict')) throw new Error('a card is open during the row hover');
  // (b) open the first sign-in prompt row
  await mouseClick(page, '.mail-row', /Sign-in prompt/i, { steps: 16, dwell: 400, click: true });
  mark('click-prompt');
  await waitVisible(page, '.tri-verdict');
  const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  if (!/trying to sign in/i.test(txt)) throw new Error('prompt card not showing; text: ' + txt.slice(0, 200));
  mark('card-open'); mark('frame:card_open');
  const verbs = await page.$$eval('.tri-verdict', els => els.filter(e => e.offsetParent).map(e => e.innerText.split('\n')[0].trim()));
  mark('verbs', { verbs });
  await sleep(300);
  for (const [name, re] of [['approve', /^Approve/i], ['deny', /^Deny$/i], ['deny-report', /Deny and report/i]]) {
    const pt = await page.evaluate((src) => { const r = new RegExp(src, 'i'); const b = [...document.querySelectorAll('.tri-verdict')].find(x => x.offsetParent && r.test(x.innerText.split('\n')[0].trim())); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 }; }, re.source);
    if (!pt) throw new Error('no verb ' + name + ' among ' + JSON.stringify(verbs));
    await page.mouse.move(pt.x, pt.y, { steps: 14 }); mark('hover-' + name); await sleep(650);
  }
  mark('frame:card_hover');
  await sleep(500); mark('end');
};
export const setup = makeSetup(false);
export default makeRun();
