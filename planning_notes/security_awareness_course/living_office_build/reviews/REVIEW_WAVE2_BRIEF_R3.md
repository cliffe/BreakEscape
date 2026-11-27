# Review R3 (delta): WAVE2_BUILD.md v3 (commit 4f2b12259)

Read-only against `b-ca-lo-w2`. Line references are to v3. I diffed v3 against v2 (`58e06e67c`), re-read D12, D13, 1.3, 2.3 to 2.9, 4.1 and section 7, and checked the immersion question in `office_kit.py`, `rooms.js`, `npc-needs.js`, `seating.js`, the five `room_aw_*` maps, the kit files and the pin fixture.

## 1. R2 findings: resolved or not

| R2 | Resolved? | Note |
|---|---|---|
| M1 close-and-reopen card | Yes | Card dropped from the row (1.1), 1.3, P-X0 (2.6), I's ca00 live case (2.8) and the cut order. 1.3 states why: the card index is memory only and ca00's one stage completes the episode. No other mention of "reopen" remains. |
| M2 Quayholt and Carrholme needs | Resolved as a decision, with an immersion cost (section 3) | "Errand" is gone; the rule now uses only engine need names, and the exemption is spelled out with its reason. The decision is coherent with the engine (`npc-needs.js:514-531`: `register` returns false for an NPC with no `needs` or `interests`). Section 3 asks whether it is the right decision. |
| M3 `keyMessage` | Yes | D13 makes it required for 35 rows (17 full, 17 twins, ca17), the P-TEST dependency case enforces it (2.8), I checks the id against the triage sets of both shell and twin, and a shell with no such message stops its package. No branch-free fallback is left to contradict it. |
| m1 proof 5 copies and `inklecate` | Yes | 2.3 step 1. |
| m2 `--kit` masks generator drift | Yes | Second no-`--kit` pass added. |
| m3 `pool: null` branches | Yes | Listed in 2.3 step 4, with the error case for `pool: null` and no `poolExempt`. I confirmed the code needs them: `room_objects` line 177 reads `kit['pool']['key']` unconditionally. |
| m4 P-X0 proof 5 check | Yes | Now "only `ca00_first_play/ink/anjali_rao.*` fails". |
| m5 parity wording | Yes | 2.7 and 2.8 reword it; host first name read from the shell's host NPC. |
| m6 QS scope | Yes | "Knot in their own file", Chidi in ca17 excepted, run the committed `.json`. |
| m7 P-GEN step 5 stage | Yes | Own branch, merged at I step 4, no-kit scratch run. I step 5 names the first run with twin rows. |
| m8 decision numbers | Yes | D225, D226. |
| m9 `convention` note, `handAuthored` | Yes | I step 3. |

All 3 majors and 9 minors are addressed in the text.

**Line budget.** Correct. Shared 12 + 3 + 1 + 0 = 16; stub 11 + 14 + 1 + 10 = 36; host 1 + 8 + 12 + 14 = 35; twin 1 + 16 = 17; total 104. Per-package totals (23, 17, 2, 10, 1, 8, 12, 15, 16) also sum to 104. The stub split by shell holds (KQ: ca00 plus six shells at 2 = 14; KT: five shells at 2 plus ca17 at 1 = 11). The 35 appended rows (ca00, 17 full, ca17, 16 twins) and the 35 `keyMessage` rows (17 + 17 + ca17, ca13's twin amended) are different sets of the same size; see m3.

## 2. New findings from the v3 edit

**Blockers: none. Majors: none.**

Minors:

- **m1. 2.1 contradicts 1.3 for ca00.** 2.1 says "every kit shell except ca00 carries ... `npcThoughts: false` at top level, and `kit_ep` declared". 1.3 gives ca00 `npcThoughts: false` (`scenario_fields`) and declares `kit_ep` (`kit_globals`), and P-TEST asserts `kit_ep === "ca00"`. Reword 2.1 to "except ca00, which carries only the debrief exemption (1.3)".
- **m2. The exemption is not on the owner card (section 7).** R2 advised recording the pool exemptions as information on the card. v3 does not. It now matters more: D12 departs from PLAN 4.2 (the `kit_spare_pc` source and "one is on the way to get a drink or run an errand", PLAN line 24) and PLAN 15's "every need has a source" risk row. Also note for waves 3 and 4 that ca03 and ca16 depend on `kit_spare_pc` as the errand source (PLAN rows ca03, ca16), so `sources: []` for Quayholt is only a wave 2 state. If the immersion option below is taken, the card has nothing to report.
- **m3. Two different 35s.** D13's 35 rows (all but ca00, ca13's twin amended) and I step 3's "append 35 rows" (ca00 plus 34, ca13 twin amended on top) share a number and differ in membership. State both once ("36 shells = 35 new rows + the existing ca13 twin row").
- **m4. 1.3 `room_objects` line anticipates sources, D12 denies them.** "the need affordance stays; Quayholt has no sources" is harmless but will need rewording if section 3's option is adopted.

## 3. Immersion check

The concern is justified. As built, 8 of 36 shells (Quayholt: ca00, ca03, ca05, ca08, ca10, ca16, ca19; Carrholme: ca11) have colleagues who never move, never speak unprompted and never meet at a source. The owner's aim (fun, a living office) is the stated reason for the whole pass.

**A need source can be supplied with no change to any pinned file.** Checked:

- **What the pin test pins** (`test/js/fixtures/awareness-office-kit-pins.json`, 128 files): the 12 `room_aw_*` `.json` and `.tmj` maps, the 28 check shells (every file in each folder) and `ca_annual_2027_defend`. It does not pin the wave 2 shells, `office_kits/*.json`, the ink stubs or `training_room_lighting.json`. A source added in a kit file reaches only the kit's own shells (`room_objects`), never a check shell (tier none exports nothing; the pin test asserts that).
- **The engine places an unmatched scenario object at its explicit position.** `rooms.js:2447-2510`: `findMatchFor` looks for a drawn prop of the object's sprite or type; with no match the object is created with `createSpriteAtRandomPosition` and then moved by `applyScenarioObjectPosition(sprite, scenarioObj.position, ...)`, then `setDepthAndStore`. So a kit source with an explicit `position` works in a map that does not draw it. PLAN 4.2 already names "explicit position" as the fallback, and the Merrin kit's PC (explicit position, 28x23) is a precedent for an undrawn kit object.
- **The art exists.** In `public/break_escape/assets/objects/`: `water_cooler1.png` (24x47), `coffee_station1.png` (26x41), `drinks_vending1.png` (42x61), `kettle1.png` (15x18), `hot_water_boiler1.png`, `uni_fountain1.png`, `mini_fridge1.png`. Brightwell's kit already declares `water_cooler`/`water_cooler1` (thirst) and `coffee_station`/`coffee_station1` (caffeine) as sources. Neither Quayholt nor Carrholme draws any of them (map items checked by image name: blinds, info screen, queue sign or whiteboard, chairs, radiator, kiosk, logo, posters, extinguisher, plant, desk and PC at Quayholt, linen cart at Carrholme).
- **Seated colleagues with needs are proven.** Brightwell, Merrin and Tarrowby staff are not `seated: true`; they carry `needs` and a coordinate `needsHome` and sit at homes beside supported chairs (Brightwell kit; gate D for KT states the same). `test_seating` has needs NPCs who sit at PCs and get up for a coffee station. All four sprites (Darren, Niamh, Anjali, Yusuf) have seated frames.

**Smallest form.** Same shape as Tarrowby's vending machine:

- One source in each of `quayholt_insurance.json` and `carrholme_services.json`, owned by P-KQ and P-KC: `{ "type": "water_cooler", "id": "kit_cooler", "sprite": "water_cooler1", "takeable": false, "interactable": false, "position": {x, y}, "affordance": { "satisfies": "thirst", "restores": 70, "useSeconds": 20, "useFrom": {"dx": 0, "dy": ...}, ... } }`. The `water_cooler1` sprite is the existing asset; the id is free (kit ids are per shell). The `position` is a builder guess to be proven in gate D: free wall on the east side below the extinguisher (x about 8.8, y about 6.5 to 8) at both rooms, with the open cell as `useFrom`. I did not verify walkability; that is proof 11's job. The learner's start to host and kiosk path must not be crossed (the kiosk is at about 7.4, 4.4).
- Each colleague carries one `thirst` need and a coordinate `needsHome` beside a chair, as Tarrowby staff do; drop `seated: true` and the no-`needs` rule from D12.
- Package edits: P-KQ and P-KC (kit data, plus shared lines if chatter is wanted); P-GEN (nothing new: `pool: null` branches are still needed for Carrholme, and `convention`'s "need affordance stays" line then applies to ca00); P-TEST (the "no `needs` carries `seated`" case becomes the Tarrowby conformance; a `poolExempt` kit still skips the capacity-2 check); T line 254-255 untouched.
- **Gate D proof 11 for KQ and KC then reads as KT's.** Pass: the source is created at its explicit position (no matching drawn prop is expected, and the log shows the fallback, not a bind); it has a collision body and is not walked through; five need cycles with no stuck walker; staff leave home, use the source and sit again at coordinate homes on supported chairs; the learner's start to host and kiosk path is never blocked, queue cells included; ca00's staff stay clear of the learner while the brief is open. Keep the "no needs state registered" criterion only if a colleague stays needs-free.

**Could Quayholt keep a pool?** Yes. `_maybePair` (`npc-needs.js:4490-4502`) opens a topic chat when a second compatible NPC is already using the same capacity-2 source with `affordance.chatter`. Every Quayholt shell carries a pair (ca00: Darren and Niamh; ca03: Anjali and Niamh; ca05 and ca10: Anjali and Darren; ca08, ca16 and ca19: Darren and Niamh), so with the same `thirst` need on both, a `chatter: "pool"` capacity-2 cooler gives two speakers, exactly as Tarrowby's vending machine does. Pairing is by chance of overlap, as at Tarrowby; gate D's proof 3 form (a pool line with the kiosk closed, none with it open) is then required for KQ too. Cost: the plan's 3 pool lines plus 3 shared lines each for three people, about 9 more shared lines (shared 25 of the plan's 30, total 113 of 118), and the usual voicing clips. Carrholme cannot: Yusuf is alone in ca11 (and `_maybePair` needs two), so Carrholme keeps `pool: null` with a source that has no `chatter`. Yusuf still walks to the cooler, drinks and sits, which is most of the effect.

**Recommendation.** Take it for both companies; Carrholme without a pool, Quayholt with one (or Quayholt without a pool if the 9 lines are unwelcome, which still gives movement). It restores PLAN 4.2's behaviour for 8 shells at the cost of a kit-data edit and a gate D that is the same shape as KT's, and it deletes the `seated`/no-needs branches from P-GEN and P-TEST. It needs a v4 edit of D12, 1.1, 1.3, 2.4, 2.8, the risk row and section 4.1; none of it touches a pinned file. It is the orchestrator's call, not mine: if the owner prefers the shorter build, D12 as written is sound.

## 4. Verdict

**Counts: 0 blockers, 0 majors, 4 minors.**

**Ready to build.** The seven non-kit packages (P-GEN, P-TEST, P-KT, P-SBM, P-H1 to H3, P-TW, P-X0) can start from v3 now; none of them depends on the immersion call. P-KQ and P-KC should wait for that one decision, since it changes their kit data, lines budget and gate D. Fix m1 to m4 in the same v4 edit.
