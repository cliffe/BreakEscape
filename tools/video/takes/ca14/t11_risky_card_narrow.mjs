// t11_risky_card_narrow: the Defend inbox (narrow, as t10b) with ONE risky card opened: Jordan Vale, "Talent Partner" (e14_fake_recruiter). Preview sample C, "What gives it away?".
// Not yet run. The tell on the card: the account note "[New account, created last week, no other posts.]" and a stranger asking for the firm's systems and who runs IT.
// Nothing is answered (no Trust / Report / Delete press), so no verdict or debrief shows. Same entry state as t10/t10b (drill and privacy seeded; kiosk opens on "Open the phone"):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t11_risky_card_narrow \
//     --set episode_e14_social_media_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"],\"drill\":{\"done\":true,\"scored\":false,\"total\":7,\"placed\":7},\"privacy\":{\"done\":true,\"settings\":5,\"tightened\":5,\"facts\":5,\"closed\":5}} --set phish_df_cover_attempts=1 "--hide-hud --zoom-step 1"
// Marks: kiosk-open, launch-panel, phone-open, start, list-up, rect:list, risky-card-open (card text), frame:tell-visible, tell-visible (hold starts), tell-hold-end, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, waitVisible, mouseClick, addCss, textShowing } from './_ca14.mjs';
import { HIDE_CSS, NARROW_INBOX_CSS } from './t10_dm_inbox.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const st = (await bridge.getState()).globals || {};
  let s = st.episode_e14_social_media_state;
  if (typeof s === 'string') { try { s = JSON.parse(s); } catch (e) { s = null; } }
  // The client global for an object seed reads "[object Object]" (seen in dry runs 25 Nov), so the done list and the drill and
  // privacy flags cannot be read here. Refuse on what can be read (defend not complete, and a parseable state that is wrong);
  // the run itself refuses unless the kiosk offers "Open the phone", which only the seeded state gives.
  if (s && typeof s === 'object') {
    const done = s.done || [];
    if (!['brief', 'osint', 'write', 'flip'].every(k => done.includes(k)) || done.includes('defend')
        || !(s.drill && s.drill.done) || !(s.privacy && s.privacy.done)) {
      throw new Error('entry state wrong: need done=[brief,osint,write,flip] (not defend), drill.done and privacy.done seeded; got ' + JSON.stringify(s));
    }
  }
  if (st.episode_e14_social_media_defend_complete === true) throw new Error('entry state wrong: defend already complete');
  await addCss(page, HIDE_CSS);
  await addCss(page, NARROW_INBOX_CSS(560));
  await sleep(400);
}

export default async (page, bridge, mark) => {
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  const b = await buttons(page); mark('launch-panel', { buttons: b });
  if (!(await waitButton(page, /Open the phone/, 10000))) throw new Error('phone launch panel never showed; buttons: ' + JSON.stringify(b));
  await sleep(1000);
  await pressButton(page, /Open the phone/); mark('phone-open');
  await sleep(1000);
  await pressButton(page, /^Start$/); mark('start');
  await waitVisible(page, '.mail-row');
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 120)));
  await page.mouse.move(40, 40);
  mark('list-up', { n: rows.length, rows });
  if (rows.length !== 6) throw new Error('expected 6 rows, saw ' + rows.length);
  if (!rows.some(r => /Jordan Vale/.test(r))) throw new Error('Jordan Vale row missing: ' + JSON.stringify(rows));
  if (await textShowing(page, /Risks reported or checked/)) throw new Error('team tally showing');
  mark('rect:list', await page.$eval('.mail-client', e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }));
  mark('frame:list-up'); await sleep(1500);
  // open the risky card (no hover tour: the point is the card)
  await mouseClick(page, '.mail-row', /Jordan Vale/i, { steps: 16, dwell: 400, click: true });
  await waitVisible(page, '.tri-verdict').catch(() => {});
  await sleep(600);
  const body = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  if (!/New account, created last week/.test(body)) throw new Error('the tell (account note) is not on the open card; text: ' + body.slice(0, 300));
  if (!/systems your firm uses/.test(body)) throw new Error('the systems request is not on the open card');
  mark('risky-card-open');
  mark('frame:tell-visible'); mark('tell-visible');
  await sleep(3000); // hold 3 s on the tell, nothing pressed
  mark('tell-hold-end');
  mark('end');
};
