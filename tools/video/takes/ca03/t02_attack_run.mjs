// t02_attack_run: the whole attack on one capture (script shots research, build, call, lands, then prompts and flip). Fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca03_helpdesk_reset t02_attack_run "" "--hide-hud --zoom-step 1"
// Steps (the kiosk strip: Brief, Research, Write, Prompts, The call, Defend, Debrief): open the kiosk, Start, Open the browser; OSINT browser (.ob-root): note the claims manager and head
// (Our people), the staff reference (Events), the service desk page (IT support), look at Friendface; close the browser; "Prepare the call" card (blanks fill from the found facts);
// Make the call (opens at once): choices 1 (name and team), 2 (manager), 3 (staff reference), then 6 "Can you reset my password now?" (the ask) lands: Leila's subtitle "All done. ...".
// DRY-RUN: the call must run before the ask or Leila asks for the missing facts. Leila is unvoiced (owner question L1).
// Hides (CSS, injected when the panel exists): the call's technique/tell lines, the authenticator outcome panel and banner, the flip body. See takes_ca03.md for the measured classes.
// Marks: kiosk-open, start_click, browser_open, note:<id>, ff_page, browser_closed, prepare_open, blank:<n>, filled, call_open, pick:<n>, influence:<n> (frames), ask_pick, landed, ... then prompts/flip marks.
import fs from 'node:fs';
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, mouseClick, waitVisible, waitEl, addCss, narrowPanel, waitCallLine } from './_ca03.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }

const DUMP = process.env.CA03_DUMP || '';
const dump = async (page, name) => { if (!DUMP) return; fs.writeFileSync(DUMP + '/' + name + '.dom.txt', await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return `${e.tagName}.${e.className}|${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)}x${Math.round(r.height)}|${(e.children.length ? '' : e.innerText || '').slice(0, 90).replace(/\n/g, ' ')}`; }).join('\n'))); };
const pickChoice = async (page, re) => {
  for (const sel of ['.person-chat-choice', '.choice-button', 'button']) {
    for (const e of await page.$$(sel)) { const t = (await e.innerText().catch(() => '')) || ''; if (re.test(t) && await e.isVisible().catch(() => false)) { await e.click(); return t.replace(/\s+/g, ' '); } }
  }
  return null;
};

export async function run(page, bridge, mark, { narrow = false } = {}) {
  const stage = process.env.CA03_STAGE || 'all';
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  await pressButton(page, /^Start$/); mark('start_click'); await sleep(1000);
  await pressButton(page, /Open the browser/); await waitVisible(page, '.ob-root'); await sleep(1200); mark('browser_open'); mark('frame:browser');
  if (narrow) await narrowPanel(page, '.ob-root', 560);
  for (const id of ['blk_claims_mgr', 'blk_claims_head']) { await mouseClick(page, `.ob-block[data-id="${id}"]`); mark('note:' + id); await sleep(900); }
  mark('frame:noted-people'); await sleep(900);
  await mouseClick(page, 'a.ob-link', /Events/); await sleep(700);
  await mouseClick(page, '.ob-block[data-id="blk_conf_bio"]'); mark('note:blk_conf_bio'); await sleep(900); mark('frame:noted-staffref'); await sleep(900);
  await mouseClick(page, 'a.ob-link', /IT support/); await sleep(600);
  await mouseClick(page, '.ob-block[data-id="blk_servicedesk"]'); mark('note:blk_servicedesk'); await sleep(900);
  await mouseClick(page, '.ob-site', /Friendface/); await sleep(900); mark('ff_page'); mark('frame:friendface'); await sleep(600);
  await bridge.minigame.close(); await sleep(1000); mark('browser_closed'); mark('frame:make-the-call-panel');
  await pressButton(page, /Prepare the call/); await sleep(1200); mark('prepare_open'); mark('frame:prepare-open'); await sleep(800);
  if (narrow) await narrowPanel(page, '.pretext-prep', 560);
  let n = 0;
  for (const f of ['Manager', 'Staff', 'Who', 'Team']) {
    await mouseClick(page, 'button.pretext-blank', new RegExp(f)); await sleep(600);
    await mouseClick(page, 'li.pretext-picker-option'); n += 1; mark('blank:' + n); await sleep(700);
  }
  mark('filled'); mark('frame:filled'); await sleep(1000);
  await dump(page, 'prepare');
  if (stage === 'prepare') return;
  // The call is the phone frame (.phone-messages-container, 400 px wide: no narrowed variant needed). Hidden: the technique/tell bubbles (.message-bubble.system.pretext-tell) and the meter's "Last change: +10 who" line (.ib-infl-change, names the technique).
  await addCss(page, '.pretext-tell, .ib-infl-change { visibility: hidden !important; }');
  // Leila is voiced now (3538b7dfa): every wait after a pick is "her line ends + a hold", never a fixed sleep.
  await pressButton(page, /Make the call/); mark('call_click'); await sleep(600); mark('call_open'); mark('frame:call-open');
  await waitCallLine(page, mark, 'open'); await sleep(900); await dump(page, 'call0');
  const steps = [[/Morning|it's Gordon/i, 1], [/manager/i, 2], [/staff reference/i, 3]];
  for (const [re, i] of steps) {
    const t = await pickChoice(page, re); if (!t) throw new Error('call choice ' + i + ' not found'); mark('pick:' + i, { t });
    await waitCallLine(page, mark, 'pick' + i); await sleep(900); mark('frame:after-pick-' + i); if (i === 1) await dump(page, 'call_after1');
  }
  await dump(page, 'call_after3');
  const g1 = (await bridge.getState()).globals || {}; mark('globals-before-ask', { influence: g1.leila_influence, wary: g1.leila_wary, refusing: g1.leila_refusing });
  const ask = await pickChoice(page, /reset my password|reset now|Can you reset/i); if (!ask) throw new Error('ask choice not found'); mark('ask_pick', { ask });
  await sleep(1500); mark('frame:ask-1_5s'); await waitCallLine(page, mark, 'ask'); await sleep(1500); mark('landed'); mark('frame:landed'); await dump(page, 'landed');
  const g = (await bridge.getState()).globals || {}; mark('globals-after-ask', { granted: g.leila_reset_granted, influence: g.leila_influence });
  if (!g.leila_reset_granted) throw new Error('reset not granted; the prompt stage will not open');
  if (stage === 'call') return;
  await sleep(1500);
  const bye = await pickChoice(page, /ring back later|Thanks/i); mark('hangup_pick', { bye }); await sleep(3000);
  console.error('AFTERBYE', JSON.stringify(await buttons(page)).slice(0, 300), JSON.stringify((await bridge.getState()).dialogue).slice(0, 150));
  await pressButton(page, /^Done$/); await sleep(1800); mark('call_closed'); mark('frame:after-call'); await dump(page, 'after_call');
  console.error('KIOSK1', JSON.stringify(await buttons(page)).slice(0, 400));
  if (stage === 'aftercall') return;
  await pressButton(page, /Open the phone/); await sleep(1800); mark('phone_open'); mark('frame:phone-open'); await dump(page, 'phone0');
  console.error('PHONE0', JSON.stringify(await buttons(page)).slice(0, 500));
  console.error('SELECTS', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('select')].map(e => [e.className, e.value, [...e.options].map(o => o.text)]))));
  if (stage === 'phone') return;
  await mouseClick(page, 'label.auth-choice-opt', /Late evening/); mark('timing_pick'); await sleep(600);
  await mouseClick(page, 'label.auth-choice-opt', /A dozen/); mark('count_pick'); await sleep(900); mark('frame:choices-made');
  // Hidden: the outcome (.auth-banner "The target tapped Approve ... MFA fatigue", .auth-outcome explanation). Kept: .auth-card stack and .auth-feed-more "...and N more prompts".
  await addCss(page, '.auth-banner, .auth-outcome { visibility: hidden !important; }');
  await pressButton(page, /Start sending prompts/); mark('send_click');
  const seen = {}; const t0 = Date.now();
  while (Date.now() - t0 < 13000) {
    for (const [k, sel] of [['first_card', '.auth-card'], ['more_shown', '.auth-feed-more'], ['banner_shown_hidden', '.auth-banner'], ['approved', '.auth-root.auth-approved']]) {
      if (!seen[k] && await page.evaluate((s) => !!document.querySelector(s), sel)) { seen[k] = true; mark(k); mark('frame:' + k); }
    }
    await sleep(100);
  }
  mark('frame:send-end');
  console.error('SEND', JSON.stringify(await buttons(page)).slice(0, 300));
  if (stage === 'send') return;
  // Flip body hidden before the phone closes (no flash): the replayed call (.aw-flip-call), the lead, the tells (.aw-call-notes) and the defender line. Heading, strip and Continue stay. display:none (not visibility) so Continue moves up: with visibility it sits clipped at the bottom of the 1080 frame. Frame: .epr-kiosk-bezel (760 px).
  await addCss(page, '.aw-lead, .aw-flip-call, .aw-call-notes, .aw-defender-line { display: none !important; }');
  await mouseClick(page, 'button.se-overlay-close'); await sleep(1500); mark('phone_closed'); mark('frame:after-phone'); await dump(page, 'flip0');
  console.error('FLIP0', JSON.stringify(await buttons(page)).slice(0, 400));
  await sleep(1500);
  await pressButton(page, /^Continue$/); mark('flip_continue'); await sleep(900); mark('frame:strip-defend'); await sleep(1200);
  console.error('DEFEND', JSON.stringify(await buttons(page)).slice(0, 300));
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, {});
