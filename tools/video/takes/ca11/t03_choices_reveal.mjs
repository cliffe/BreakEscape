// t03_choices_reveal: the four everyday choices (cards 1 and 3 shown, 2 and 4 picked quickly), the "Six months later" montage (verdict labels hidden,
// borders neutral) and the Continue to the Defend intro (heading framed, body out of frame in the edit). All four picks are the UNSAFE options, chosen by label text.
// Entry state: fresh game, no flags (Skip tutorial and the Mission Brief closed in setup()).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca11_misdirected_data t03_choices_reveal "" "--hide-hud --zoom-step 1"
// Card 1 (caller): hold 3 s unpicked (the topic shot), pick "Tell her which school Bernadette is at today and when she finishes", hold 3.2 s, Next.
// Card 2 (overtime sheet, never shown to the viewer): pick "Choose Sam Whitlow from the top of the list and send the sheet", Next. Card 3 (export): hold 1 s, pick
// "Export the family contacts and pass the file to Martin", hold 2.5 s, Next. Card 4 (redaction): pick "Send Mr Hale the one-page report in full", See where they led.
// Montage held 13.5 s, mouse still (led_page, led_caller, led_export all cut from this one page); Continue; Defend intro held 3 s.
// Marks: tab:<text> at each panel, c1_shown, c1_pick, c2_pick, c3_shown, c3_pick, c4_pick, reveal, continue_click, strip_defend, end, plus frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, pressEl, buttons, neutraliseReveal, narrowPanel, hideLong } from './_ca11.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

/** The tab/heading texts in the open kiosk (the strip labels), for the tab-name check. */
async function tabs(page) {
  return page.evaluate(() => [...document.querySelectorAll('[class*=tab],[class*=strip],[class*=step]')].filter(e => e.offsetParent && (e.innerText || '').trim().length && (e.innerText || '').length < 60).map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter((v, i, a) => a.indexOf(v) === i).slice(0, 12));
}
const NARROW_SEL = '.mail-client, .epr-kiosk-bezel, .epr-panel, .epr-mistake, .epr-card';

export async function run(page, bridge, mark, { narrow = false } = {}) {
  await openKiosk(page, bridge, mark);
  mark('kiosk-buttons', { b: await buttons(page) });
  await pressButton(page, /^Start$/); await sleep(900);
  mark('kiosk-buttons2', { b: await buttons(page) });
  await pressButton(page, /Make the choices|Make the calls|Start the choices/); await sleep(1200);
  if (narrow) await narrowPanel(page, '.epr-kiosk-bezel', 560);
  mark('c1_shown', { tabs: await tabs(page) }); mark('frame:c1-unpicked'); await sleep(3000);
  await pressEl(page, /^Tell her which school Bernadette is at today/); mark('c1_pick'); await sleep(3200); mark('frame:c1-picked');
  await pressButton(page, /^Next/); await sleep(1300);
  await pressEl(page, /^Choose Sam Whitlow from the top of the list/); mark('c2_pick'); await sleep(1500);
  await pressButton(page, /^Next/); await sleep(1000);
  mark('c3_shown'); mark('frame:c3-unpicked'); await sleep(1000);
  await pressEl(page, /^Export the family contacts and pass the file/); mark('c3_pick'); await sleep(2500); mark('frame:c3-picked');
  await pressButton(page, /^Next/); await sleep(1300);
  await pressEl(page, /^Send Mr Hale the one-page report in full/); mark('c4_pick'); await sleep(1500);
  await neutraliseReveal(page);       // live before the montage renders
  // The flipBeat (overtime_sheet, card 2) is rendered FIRST and its line points at an inbox item: take it out of the page (display:none) so the page opens on the caller card.
  await page.addStyleTag({ content: 'li.aw-montage-beat[data-beat="overtime_sheet"]{display:none !important}' });
  await pressButton(page, /See where they led|See where they lead/); await sleep(700);
  mark('reveal', { tabs: await tabs(page) });
  mark('beat-boxes', await page.evaluate(() => [...document.querySelectorAll('li.aw-montage-beat')].map(e => { const r = e.getBoundingClientRect(); return { beat: e.dataset.beat, shown: e.offsetParent !== null, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })));
  mark('frame:reveal'); await sleep(6500); mark('frame:reveal-mid'); await sleep(7000);
  const left = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden' && /^Your call/i.test((e.innerText || '').trim()) && (e.innerText || '').length < 60).length);
  mark('labels-left-visible', { left });
  if (left) throw new Error('verdict labels still visible: ' + left);
  await hideLong(page, /^Take the Care Laundry desk inbox/);   // the defend intro body is the rule: hidden in every format (the heading and strip stay)
  await pressButton(page, /^Continue/); mark('continue_click'); await sleep(1500);
  mark('strip_defend', { tabs: await tabs(page) }); mark('frame:defend-intro'); await sleep(3000);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: false });
