# m07 lighting, cycle 5 review (closing check)

Reviewer: fresh Opus agent, read-only. Sources: the skill, `LIGHTING_PLAN.md` (all cycles), `lighting_c4/review_c4.md`, the seven lighting blocks in `scenario.json.erb` (744, 752, 1632, 1733, 1912, 2055, 2128) and the countdown's `spriteVariants` (2014-2018), the m07 section of `docs/agents/LIGHTING_LOG.md`, `DECISIONS_PENDING.md` L1, the c4 tour shots, the c5 armed reshoot (game 2470), and `browser_check.md` with every relevant still in `live/`. Measurements are PIL means on the 1400x1000 stills, in the regions the c4 review used (ends 615-660 / 880-925 x y 330-380; rim 610-925 x y 200-222; monitor tops 460-590 / 780-910 x y 410-430).

## Summary

The config matches what the plan and log describe for the ops floor: base end lights `#ff9020` r 52 0.55, armed variant `#ff4a10` r 52 0.7 (`:1644-1653`). The c5 change does what c4 m1 asked in numbers: G at the ends drops by 10 against base, the rim and monitor tops don't move, and nothing turns red. In the crop the armed ends now read violet-grey, not orange, which the plan's wording gets wrong (m1). The browser check is good evidence for reload persistence, but it ran on the cycle 4 config, which it doesn't say (m2). The plan has three stale lines and no cycle 5 entry (m3). Nothing above minor.

## Cycle 4 findings

| id | sev | finding | fix applied | status | evidence |
|---|---|---|---|---|---|
| m1 | minor | While the clock runs the wall's ends barely change | Armed variant `#ff6a10` 0.65 → `#ff4a10` 0.7 (`:1649-1652`) | **Closed** | Ends base (90, 99, 109) / (90, 98, 109); c4 armed (90, 95, 106) / (90, 94, 106); c5 armed (90, 89, 106) / (90, 88, 106). G −10, above the c4 target of 6 or more. B moved only −3 (c4 predicted −7). Rim 137.7 in all five shots (base, armed, expired, saved, c5 armed), inside 137-141. Monitor tops within 1 of c4 armed. Checkpoint region of the frame identical to the point. See m1 below for how it reads |
| m2 | minor | Step 6 records not written | Plan cycle 4 entry; LIGHTING_LOG m07 section and lessons | **Closed, with errors** | LIGHTING_LOG m07 section matches the config line by line (ambients, modes, `panels: false`, phases, ATS-1 condition, no `EMITTERS` change) and carries all four lessons c4 asked for, plus one more. The plan's cycle 4 entry exists but has a wrong game range, and older plan lines went stale (m3) |

Earlier cycles stay closed. Cycle 1 m4 (ATS-1 blink) is now confirmed live: `G2_ats_1..6`, lamp crop at (280-312, 298-322) alternates mean (78, 81, 71) and (111, 107, 78), peak (213, 167, 61) and (255, 255, 86), in frames 1/3/5 and 2/4/6.

## Browser check: reload persistence

The evidence holds up, better than the report itself claims:

- State reads after each reload (`variantIdx`, the countdown's texture key, `crisis_control_system` variant) are the right fields and give the expected values: ops variant 0 and `pnw_countdown_running1` after the first reload, ops −1, `pnw_countdown_aborted1` and `crisis_control_system:0` after the second.
- The pixels agree independently. Ops ends in `C_ops_armed` (90, 95, 106), in `E_ops_after_reload` (90, 95, 106), then `F_ops_aborted` (90, 99, 109). The variant came back after the reload and went away on `grid_saved`. The countdown glow above the console is (71, 51-52, 63) in both `D_scada_running` and `E_scada_after_reload` (steady expired red, no breathe), and (53, 50, 64) after the abort. The faces read RUNNING after the reload and ABORTED after it.
- The generator hall coming back dark after a reload is correct for a motion room.

Two limits, neither of which blocks closing. The globals and doors were set by console, not earned (the report says so). And the game was created at 04:57Z, before the c5 edit (`scenario.json.erb` modified 05:01Z; games snapshot their scenario at creation), so the live ends show the c4 colour (m2). The variant mechanism is the same for both colours, and the c5 colour was rendered by the 2470 tour, so the two pieces of evidence cover the final config between them.

## Findings

### Blocker

None.

### Major

None.

### Minor

**m1. The armed ends read violet-grey, not orange, and the plan calls them orange.**
Evidence: c5 armed ends (90, 89, 106): R and G level, B 16 above them. Base (90, 99, 109) is blue-grey. With red at the multiply ceiling, `#ff4a10` takes green out faster than blue, so the hue moves towards magenta. In a 2x crop of the wall (base, c4 armed, c5 armed stacked) the c5 ends are a dusky mauve either side of the orange centre pool. At game zoom it's faint and reads as the room darkening under the wall, which suits the clock running. It hides nothing (the end floor carries no prop or text), it doesn't claim red, and the rim is unchanged. The plan's c4 m1 outcome ("orange not red") describes it wrongly.
Fix: keep the config. Correct the wording in the plan's c4 m1 outcome to say the ends drop green and dim towards violet-grey while the centre emitter carries the orange. If the orchestrator wants real warmth at the ends, the only lever is an `ambient` override in the armed variant with less blue (for example `#aaaeb8`). That darkens the whole room's blue, so it would need an armed reshoot and a check of the supervisor laptop pool. Not recommended for this stage.

**m2. `browser_check.md` doesn't say it ran on the cycle 4 end-light colour.**
Evidence: game 2469 opened 04:57Z; the c5 edit landed at 05:01Z; the live ends measure (90, 95, 106), the c4 armed value, against (90, 89, 106) in the 2470 reshoot.
Fix: add one line under the header: "Game 2469 was created before the c5 end-light change, so it shows the c4 armed colour (`#ff6a10` 0.65); the variant logic is unchanged and the c5 colour is in `lighting_c5/armed/` (game 2470)."

**m3. `LIGHTING_PLAN.md` has stale lines and no cycle 5 entry.**
Evidence:
- Section 3, checkpoint row: ambient `#c4c8d2`, "a little brighter than the rest". The config is `#bcc2ce` (`:753`), changed in c1 m6, and the plan's own c1 table says so.
- Section 2, `countdown_expired` row: "video wall red breathe". The config keeps the wall amber-orange in expired (`#ff7a1a` 0.95, `:1637`), the c2 m2 outcome, with red waiting on L1.
- Cycle 4 heading: "games 2463-2469". The c4 tour logs give 2464 (base), 2465 (armed), 2466 (expired), 2467 (saved); 2469 is the browser check and 2470 the reshoot.
- No cycle 5 heading recording the reshoot, the browser check (A-G all pass, game 2469) and this review.
Fix: checkpoint row to `#bcc2ce`, "a touch cooler than day"; expired row to "video wall deeper orange breathe (stays amber with its art and text; red waits on L1)"; heading to "games 2464-2467"; add a cycle 5 entry with this review's counts.

## Notes (not counted)

- L1 is still open. The lighting is right not to show red on the wall while its art and text say amber. If Option A is taken, add an ops variant for `countdown_expired && !grid_saved` ahead of the armed one (red end lights) and turn the wall's expired emitter red, then reshoot ops in expired.
- The browser check saw the opening intro cutscene and tutorial prompt replay after each reload. Likely a result of force-closing the briefing rather than finishing it (so `briefing_played` may not have been saved), not a lighting matter. Worth a line to whoever owns the next playtest.
- The Objectives panel covers the ATS cabinet at 1400x1000 unless collapsed. Not lighting.
- No new flashing effects. The only blink is ATS-1's small lamp at about 1 Hz, gated on the same condition as its text.

## Counts and verdict

Blockers 0, majors 0, minors 3 (m1 description and look of the armed ends; m2 one line in the browser check; m3 plan housekeeping). Cycle 4: m1 closed, m2 closed with errors carried as m3.

Verdict: nothing above minor remains. The lighting stage can close once the m2 and m3 record fixes are made. They are text edits, need no reshoot, and need no further review.
