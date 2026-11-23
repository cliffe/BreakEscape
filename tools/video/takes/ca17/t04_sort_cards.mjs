// t04_sort_cards: the montage take. One sort round of nine cards, shown one at a time with the after-pick feedback, reason, board and counter hidden (SORT_HIDE_CSS); the intro (the rules) is
// pressed through in setup() before the recording starts, so the first card is up at 0 s. The draw is the game's own (Math.random at the click that opens the drill); setup() reads the drill,
// searches (in the page, offline, with the game's drawCards) for a dice seed whose draw holds the seven wanted cards, and opens the drill again with Math.random seeded for that one click
// only, then restores it. If no seed gives all seven, the best draw is used and the marks say which wanted cards are missing (change the VO for them: v3 to v6b).
// Entry state: fresh game, no flags. Run without kit_quiet (nothing in this take waits for a bark; Fatima's and Chidi's barks may play under it: the take is silent footage, the edit mutes it).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca17 t04_sort_cards "" "--hide-hud --zoom-step 1"
// Per card the take marks `card:<n>` (id, situation) and, for a wanted one, `<shot>_start` / `<shot>_end` (topic, bins, card_1 to card_5) with a frame. A wanted card is held (HOLD, 3.8 to 4.2 s), a
// filler card 0.5 s. The bins shot (S03): the pointer sweeps Allowed, Not allowed, Ask first with equal dwell (marks bins_sweep_start, bin:<label>, bins_sweep_end), nothing pressed.
// A pick is the keyboard key 1/2/3 (the pointer stays off the card), then the Next button is clicked by DOM (no pointer), so the card is never held after a pick. Picks are arbitrary and unseen.
// The last card ends on the summary panel, which is never held: the take stops at the last pick (mark `summary-up`, hidden by CSS and not recorded past `end`).
import { sleep, prepare, toIntro, findSeed, drawn, closeKiosk, pressButton, waitButton, buttons, addCss, textShowing, hoverEach, checkSprite, WANT, HOLD, SORT_HIDE_CSS, NARROW_SORT_CSS } from './_ca17.mjs';

const WANTED_IDS = Object.values(WANT);

export const makeSetup = (narrow) => async (page, bridge) => {
  await prepare(page, bridge);
  await toIntro(page, bridge, () => {});
  const first = await drawn(page);
  const best = await findSeed(page, WANTED_IDS);
  console.log('seed search:', JSON.stringify(best), 'first draw wanted:', first.filter(c => WANTED_IDS.includes(c.id)).length);
  await closeKiosk(page);
  await toIntro(page, bridge, () => {}, best.seed);
  const got = await drawn(page);
  const miss = WANTED_IDS.filter(w => !got.some(c => c.id === w));
  console.log('rigged draw:', got.map(c => c.id).join(' '), 'missing wanted:', JSON.stringify(miss));
  await addCss(page, SORT_HIDE_CSS);
  if (narrow) await addCss(page, NARROW_SORT_CSS(560));
  await pressButton(page, /Start sorting/); await sleep(700);
  if (await textShowing(page, /Not sure which bin|Our rules in one line/)) throw new Error('intro text still showing');
};

export const makeRun = (narrow) => async (page, bridge, mark) => {
  await checkSprite(page, mark, { strict: false });
  const cards = await drawn(page);
  mark('draw', { cards: cards.map(c => c.id), wanted: WANTED_IDS.filter(w => cards.some(c => c.id === w)), missing: WANTED_IDS.filter(w => !cards.some(c => c.id === w)) });
  const shotOf = Object.fromEntries(Object.entries(WANT).map(([k, v]) => [v, k]));
  mark('card1');
  for (let i = 0; i < cards.length; i++) {
    const cur = await page.evaluate(() => { const e = document.querySelector('.sd-situation'); const c = document.querySelector('.sd-card'); return { text: e && e.innerText, id: c && c.dataset.cardId }; });
    const shot = shotOf[cur.id];
    mark('card:' + (i + 1), { id: cur.id, text: cur.text, shot: shot || null });
    const fb = await textShowing(page, /\bright\b|\bwrong\b|Good call|Where the cards went|%/i);
    if (fb) throw new Error('feedback or tally showing on card ' + (i + 1));
    if (shot) {
      mark(shot + '_start'); mark('frame:' + shot);
      if (shot === 'bins') {
        await sleep(600);
        mark('bins_sweep_start');
        const labels = await hoverEach(page, '.sd-bin-btn', { steps: 12, dwell: 900 });
        mark('bins_sweep_end', { labels });
        await page.mouse.move(40, 40); await sleep(400);
      } else await sleep(HOLD[shot]);
      mark(shot + '_end');
    } else await sleep(500);
    const key = String(1 + (i % 3));
    await page.keyboard.press(key); await sleep(250);
    if (i < cards.length - 1) {
      const ok = await page.evaluate(() => { const b = document.querySelector('.sd-next'); if (!b) return false; b.click(); return true; });
      if (!ok) throw new Error('no Next after pick on card ' + (i + 1));
      await sleep(350);
    }
  }
  mark('last-pick');
  mark('end');
};
export const setup = makeSetup(false);
export default makeRun(false);
