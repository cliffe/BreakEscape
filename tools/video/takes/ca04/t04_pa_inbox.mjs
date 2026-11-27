// t04_pa_inbox: Tomás's inbox list on the Defend panel: five rows ("0 of 5 sorted"), two of them voicemails. NO row is ever opened, no card, no verdict hovered or pressed.
// Two SEPARATE runs (the script uses them as two shots, so no seconds are shown twice), chosen by the env var CA04_RUN:
//   CA04_RUN=A  (default) the topic shot: the list held still, no cursor on it, about 10.5 s (the script uses 3 to 9.8 s).
//   CA04_RUN=B  the triage shot: the cursor moves down the rows one by one (move only, never a click), about 14 s.
// Entry state (seeded; tell AC0): SEED_DEFEND from _ca04.mjs, the kiosk opens on the Defend panel:
//   CA04_RUN=B BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca04_exec_whaling t04_pa_inbox '--set episode_e4_exec_whaling_state={"done":["brief","osint","write","flip"]} --set phish_exec_pa_attempts=1' "--hide-hud --zoom-step 1"
// setup() (off camera): prepare, kiosk, wait for "Open the inbox", park the pointer off the panel.
// HIDDEN BY CSS: .triage-client .aw-team-tally (a score-like badge). Nothing else is needed on the list (no verdicts show until a row is opened).
// The voicemail row is checked in the run: it must show a sender NAME, not "Number withheld" (that is the card's tell); the take throws if a row shows the withheld number,
//   because the script's "Both sound like Catherine" depends on it (and v8b is cut if it does).
// Marks: inbox-open, start, list-up (rows in order, count text), voicemail-rows, tts-check, frame:list, hover-row-1..5 (run B), end. A POST /tts check is made (the list plays no audio).
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, waitVisible, mouseClick, addCss, DEFEND_HIDE_CSS, NARROW_CSS, watchTts, checkSprite } from './_ca04.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  await openKiosk(page, bridge, () => {});
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('kiosk is not on the Defend panel; buttons: ' + JSON.stringify(await buttons(page)));
  await page.mouse.move(40, 40);
  await sleep(500);
}

export async function run(page, bridge, mark, { narrow = false, px = 560 } = {}) {
  const RUN = (process.env.CA04_RUN || 'A').toUpperCase();
  mark('run', { RUN, narrow });
  await checkSprite(page, mark);
  const tts = await watchTts(page, mark);
  const T0 = Date.now(); const at = async (s) => { const w = T0 + s * 1000 - Date.now(); if (w > 0) await sleep(w); };
  await at(0.4); await pressButton(page, /Open the inbox/); mark('inbox-open');
  await addCss(page, DEFEND_HIDE_CSS);
  if (narrow) { await addCss(page, NARROW_CSS(px)); await addCss(page, '.mail-compose-btn,.se-overlay-close,#minigame-close,.minigame-close-button{display:none !important;}'); }
  await at(1.3); await pressButton(page, /^Start$/); mark('start');
  await waitVisible(page, '.mail-row');
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 110)));
  const count = await page.evaluate(() => { const m = document.body.innerText.match(/\d+ of \d+ sorted/i); return m ? m[0] : null; });
  if (rows.length !== 5) throw new Error('expected 5 inbox rows, saw ' + rows.length + ': ' + JSON.stringify(rows));
  mark('list-up', { rows, count }); mark('frame:list');
  const vm = rows.filter(r => /voicemail|0:\d\d|Number withheld|withheld/i.test(r));
  mark('voicemail-rows', { vm, withheldOnRow: rows.some(r => /withheld/i.test(r)) });
  if (rows.some(r => /withheld/i.test(r))) throw new Error('a list row shows "Number withheld": cut v8b. rows: ' + JSON.stringify(rows));
  if (RUN === 'B') {
    await at(3.0);
    const n = rows.length;
    for (let i = 0; i < n; i++) {
      const pt = await page.evaluate((k) => { const r = [...document.querySelectorAll('.mail-row')].filter(e => e.offsetParent)[k]; if (!r) return null; const q = r.getBoundingClientRect(); return { x: q.x + q.width * 0.55, y: q.y + q.height / 2 }; }, i);
      if (!pt) throw new Error('no row ' + i);
      await page.mouse.move(pt.x, pt.y, { steps: 18 }); mark('hover-row-' + (i + 1));   // move only, never a click
      await sleep(1500);
    }
    await at(14.8);
  } else {
    await at(10.5);
  }
  await tts.stop();
  mark('tts-check', { responses: tts.all.length });
  mark('end');
}

export default (page, bridge, mark) => run(page, bridge, mark);
