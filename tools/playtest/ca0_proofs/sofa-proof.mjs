// Live proof of dff168c21: a need-driven rest trip ends with the NPC seated on the sofa (ca18, kit_delphine_arvanitis).
//   node tools/playtest/ca0_proofs/sofa-proof.mjs <gameId> <port> <outDir>   (game: new-game.rb ca18_credential_attacks_at_scale --set kit_quiet=true)
import { launch, sleep } from './_pl.mjs';
const [gid, port, out] = process.argv.slice(2);
const L = await launch(gid, port, out);
const { page } = L; const ID = 'kit_delphine_arvanitis';
const snap = () => page.evaluate(id => { const b = window.npcBehaviorManager.getBehavior(id), sp = b?.sprite, st = window.npcNeedsSystem.getState(id);
  return { at: sp && [Math.round(sp.x), Math.round(sp.y)], seat: !!b?._seat, seatInfo: b?._seat ? (b._seat.id || b._seat.objectId || Object.keys(b._seat).slice(0, 6)) : null, anim: sp?.anims?.currentAnim?.key || null, frame: sp?.frame?.name, dir: b?.direction, mode: st?.mode, job: st?.job && { need: st.job.need, obj: st.job.objectId || st.job.obj }, moving: !!b?.isMoving }; }, ID);
const sofa = await page.evaluate(() => { const o = []; for (const r of Object.values(window.rooms)) for (const [k, v] of Object.entries(r.objects || {})) if (/sofa/i.test(k + (v.scenarioId || '') + (v.texture?.key || ''))) o.push({ k, x: Math.round(v.x), y: Math.round(v.y), w: v.displayWidth, h: v.displayHeight }); return o; });
const before = await snap(); await sleep(1500);
await page.evaluate(id => window.__test.needs.set(id, 'rest', 5), ID);
const trace = []; let seated = null;
for (let i = 0; i < 160; i++) { const s = await snap(); s.t = i * 0.5; trace.push(s); if (s.seat && !seated) { seated = s; await L.shot('seated'); } if (seated && i > trace.indexOf(seated) + 6) break; await sleep(500); }
const res = { gid, sofa, before, seatedAt: seated, seatedPoseAnim: seated?.anim, errs: L.errs, pass: !!seated, trace };
L.save('sofa-result.json', res); L.save('console.log', L.log.join('\n'));
console.log(JSON.stringify({ pass: res.pass, sofa, before, seatedAt: seated, errs: L.errs }));
await L.browser.close();
