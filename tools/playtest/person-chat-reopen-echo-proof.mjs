// Person-chat reopen echo proof: open a chat, reach a hub, close, reopen (and again after a reload);
// record the box text and every POST /tts request. Keyless server, so /tts is aborted by pathname only.
//   node tools/playtest/person-chat-reopen-echo-proof.mjs <gameId> [port] [npcId] [outFile]
import { writeFileSync } from 'node:fs';
import { open, ev, dlg, load, dismiss } from './m01-ol-lib.mjs';
const [gid, port = '3179', npc = 'receptionist', out = 'tmp/reopen-echo-proof.json'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const rec = { npc, gid, steps: [] };
let tts = [];
await h.page.route(u => new URL(u).pathname.endsWith('/tts'), r => {
  if (r.request().method() === 'POST') { tts.push((r.request().postData() || '').slice(0, 160)); return r.abort(); }
  return r.continue();
});
if (process.env.ECHO_DEBUG) h.page.on('console', m => { const t = m.text(); if (/SHOWNDBG|🔇|Re-navigating|showCurrentDialogue - result.text|Continuing previous|Reopened/.test(t)) console.log('  console:', t.slice(0, 400)); });
const lines = d => (d.text || '').split('\n').filter(x => x.trim() && !/^(×|Skip)/.test(x.trim()));
const step = async (name, extra = {}) => { const d = await dlg(h); const s = { name, active: d.active, lines: lines(d), controls: d.controls, tts: tts.splice(0), ...extra }; rec.steps.push(s); console.log(JSON.stringify(s)); return d; };
async function toChoices(max = 25) { for (let i = 0; i < max; i++) { const d = await dlg(h); if (!d.active) return d; if (d.controls.some(c => /^\d\./.test(c))) return d; await h.page.keyboard.press('Space'); await h.t(800); } return dlg(h); }
async function talk() { let r = await ev(h, id => window.__test.interact(id), npc); if (!r?.ok) { await ev(h, async id => await window.__test.moveToNear?.(id), npc); await h.t(2500); r = await ev(h, id => window.__test.interact(id), npc); } console.log('  interact', JSON.stringify(r)); await h.t(1500); }
await ev(h, id => window.__test.moveToNear ? window.__test.moveToNear(id) : null, npc).catch(() => {}); await h.t(2000);
await talk(); await toChoices(); await step('first open, at first choices');
// pick the first choice, advance to the next choice point (the hub)
// PICKS: comma-separated regexes, one pick each (default: one pick, "Where is she"); the last choice point is the one closed and reopened
for (const p of (process.env.PICKS || 'Where is she').split(',')) { const r = await ev(h, p => window.__test.minigame.chooseMatching(p), p); await h.t(900); await toChoices(); await step(`picked /${p}/, at choices`, { pick: r?.ok }); }
await ev(h, () => window.__test.minigame.close()); await h.t(800); if ((await dlg(h)).active) { await ev(h, () => window.__test.minigame.close()); await h.t(800); }
await step('closed');
await talk(); await toChoices(); await step('REOPEN (same session)');
await ev(h, () => window.__test.minigame.close()); await h.t(800); if ((await dlg(h)).active) { await ev(h, () => window.__test.minigame.close()); await h.t(800); }
await ev(h, () => window.__test.syncNow?.()).catch(() => {}); await h.t(1500);
await load(h, `http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`);
await step('after reload (no chat)');
await dismiss(h); await h.t(500); await ev(h, () => { const b = [...document.querySelectorAll('#game-menu-overlay button')].find(x => /^Resume$/.test(x.textContent.trim())); b?.click(); }); await h.t(600); await ev(h, async id => await window.__test.moveToNear?.(id), npc).catch(() => {}); await h.t(2500);
await talk(); await toChoices(); await step('REOPEN after reload');
rec.errors = h.errs.filter(e => !/503|tts/i.test(e));
writeFileSync(out, JSON.stringify(rec, null, 2));
await h.browser.close();
