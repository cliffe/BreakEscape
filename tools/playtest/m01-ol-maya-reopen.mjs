// R2 n5: Maya's chat closed at the hub exit line (m01_npc_maya.ink:173-175), reopened once she is away.
//   node tools/playtest/m01-ol-maya-reopen.mjs <gameId> [port]
import { open, ev, dlg, waitAtPost } from './m01-ol-lib.mjs';
const [gid, port = '3094'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
let capture = false; h.page.on('console', m => { if (capture && /🔄|🔁|resum|Re-nav|restor|maya_away|not_here|Continuing|knot/i.test(m.text())) console.log('  console:', m.text().slice(0, 220)); });
const mpos = () => ev(h, () => { const s = window.__test.needs.state('maya_chen'); const sp = window.npcBehaviorManager?.getBehavior('maya_chen')?.sprite; return { atPost: s?.atPost, job: s?.job ? { o: s.job.objectId, p: s.job.phase } : null, room: window.npcManager?.getNPC?.('maya_chen')?.roomId, x: sp ? +(sp.body.center.x / 32).toFixed(1) : null, y: sp ? +(sp.body.center.y / 32).toFixed(1) : null }; });
const G = () => ev(h, () => { const g = window.gameState?.globalVariables || {}; return { away: g.maya_away, settled: g.maya_settled, disc: g.discussed_operation }; });
const lines = d => (d.text || '').split('\n').filter(x => x.trim() && !/^(×|Skip)/.test(x.trim()));
async function toChoices(max = 25) { const seen = []; for (let i = 0; i < max; i++) { const d = await dlg(h); if (!d.active) return { closed: true, seen }; const l = lines(d).pop(); if (l && !seen.includes(l)) seen.push(l); if (d.controls.some(c => /^\d\./.test(c))) return { closed: false, seen, choices: d.controls }; await h.page.keyboard.press('Space'); await h.t(800); } return { seen, timeout: true }; }
const pick = async p => { const r = await ev(h, p => window.__test.minigame.chooseMatching(p), p); await h.t(900); return r; };
const go = async (...rooms) => { for (const r of rooms) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); if (!x.ok) log('enterRoom failed', { r, reason: x.reason }); await h.t(1200); } };
await go('hallway_east', 'maya_office');
await waitAtPost(h, 'maya_chen', 20000);
log('talk1', (await ev(h, () => window.__test.interact('maya_chen')))?.ok); await h.t(1500);
log('opener', await toChoices()); await pick("That's right");
log('after opener', await toChoices()); await pick('SAFETYNET sent me');
log('informant', await toChoices()); await pick('Tell me everything');
let r = await toChoices(); log('topic', r); await pick('okay with that');
r = await toChoices(); log('hub choices', { seen: r.seen, choices: r.choices, g: await G() });
await pick('keep investigating'); await h.t(600);
let d = await dlg(h); log('after picking exit: dialogue', { active: d.active, shown: lines(d).slice(-2), controls: d.controls });
// close at the exit line (the "Be careful" line), as the hub exit does
await ev(h, () => window.__test.minigame.close()); await h.t(800);
d = await dlg(h); if (d.active) { await ev(h, () => window.__test.minigame.close()); await h.t(800); }
log('closed at exit line', { active: (await dlg(h)).active, g: await G() });
await go('hallway_east');
const t0 = Date.now(); let g = await G();
while (Date.now() - t0 < 30000 && g.away !== true) { await h.t(400); g = await G(); }
log('away', { g, ms: Date.now() - t0 });
let mm = await mpos(); const t1 = Date.now(); while (Date.now() - t1 < 25000 && (mm.atPost || !mm.job)) { await h.t(500); mm = await mpos(); }
log('Maya has left her desk', { mm, ms: Date.now() - t1 });
const t2 = Date.now(); const trail = []; while (Date.now() - t2 < 40000 && !(mm.x !== null && Math.hypot(mm.x - 7, mm.y + 3) > 6)) { await h.t(400); mm = await mpos(); if (!trail.length || Math.hypot(mm.x - trail.at(-1).x, mm.y - trail.at(-1).y) > 2) trail.push({ x: mm.x, y: mm.y, job: mm.job?.p }); }
log('trail', trail);
await go('main_office_area'); mm = await mpos();
log('Maya outside her office, player in main office', { mm, g: await G(), playerRoom: await ev(h, () => window.currentPlayerRoom) });
capture = true;
log('talk2 (away)', (await ev(h, () => window.__test.interact('maya_chen')))?.ok); await h.t(1500);
const first = await dlg(h); log('first box on reopen', { active: first.active, lines: lines(first), controls: first.controls });
const full = await toChoices(); log('reopen run', full);
log('beCarefulShownAgain', JSON.stringify([first.text, full.seen]).includes('Be careful'));
await ev(h, () => window.__test.minigame.close()); await h.t(600); if ((await dlg(h)).active) await ev(h, () => window.__test.minigame.close());
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.page.screenshot({ path: 'tmp/m01-maya-reopen-r2.png' });
await h.browser.close();
