# Review R2 (delta): WAVE2_BUILD.md v2 (commit 58e06e67c)

Read-only against `b-ca-lo-w2` (main code). Line numbers are those of `WAVE2_BUILD.md` v2. I re-ran proof 5 myself as v2 describes it (`git archive HEAD` into scratch, all six generators with `--repo`, then `apply_training_room.py --repo <root> --kit`, copy over, compare with HEAD), read `office_kit.py`, `apply_training_room.py`, `episode-runner-minigame.js`, `npc-needs.js`, T and QS, and ran the shell checks listed under Task 2 below.

## 1. R1 findings: resolved or not

| R1 | v2 section | Resolved? | Note |
|---|---|---|---|
| B1 proof 5 fails on HEAD | 2.1 line 67, 2.3 step 1 (line 90) | Yes | I ran the procedure: all six generators plus `--kit` reproduce HEAD. `ca12_visitor_tailgater_defend` matches byte for byte after `--kit`; `ca14`, `ca16`, `ca18` `_defend` differ as text but are JSON-equal (checked), which v2 names as the known drift. `ca00_first_play`, `ca17_acceptable_use_defend`, the ca01 twin and every other generated shell are byte-identical. Residual points are m1 and m2 below. |
| B2 ca00 has no mechanism | 1.3 (lines 49-57), 2.3 step 4 | Mechanism yes, teaching design no | The `convention: true` branches fit `office_kit.py` (see 2). The close-and-reopen card does not work as written (M1). Owner of `office_kit.py` is now P-GEN (line 89). |
| M1 quiet release | D11 line 46, line 72 | Yes | Verified: ca01 (non-stepAway) carries `done.includes('debrief')` at line 898 and no `debriefSeen` mapping; `host_mappings` adds `debriefSeen` only when `stepAway`; T asserts both only inside `if (stepAway === true)`. |
| M2 episode knots without opus48 | 2.2 line 84, 2.4 line 102, 2.5 line 115 | Yes | |
| M3 layer 0 and 1 checks | 2.8 P-TEST lines 153-155 | Yes, with m5 | Layer 0 presence, layer 1 parity and the `host_said` declaration check are now assigned and owned. |
| M4 stub guard | 2.8 P-TEST line 157, 2.9 | Yes, with m6 | QS parameterised over every `*_ambient.ink`, owned by P-TEST then I. |
| M5 P-TW cannot work | 2.3 step 3 (line 92), 2.8 line 150, D2 line 37 | Yes | Twin branch copied into three generators under proof 5; P-TW is content only; D2 states two-way twins and three-way full-shell host blocks. |
| M6 O1 scope, O3/O4 | D5 line 40, D8, D9, section 7 | Yes | ca08 added; timing and ca01 form recorded as decided. |
| M7 Carrholme and Quayholt sources | D12 line 47, 2.4 line 109, 2.8 line 156 | Partly | The Carrholme two-speaker claim holds (see 2). Gate D now tests the Quayholt PC. What each Quayholt and Carrholme person's need is stays unstated (M2). |
| m1 17 twins | line 13, 21 | Yes | |
| m2 wrong cite in D1 | D1 | Yes | |
| m3 T:253-255 | line 71, D12 | Yes | Lines 253-255 are the capacity-2 coffee topic check. |
| m4 core00 walk | 2.3 step 2 | Yes | |
| m5 CLI forms, scratch dir | line 66 | Yes | |
| m6 GATE_D file plan | 2.4 line 103, 2.8 | Yes | Per company, I joins. |
| m7 X0 and Quayholt stubs | 2.4, 2.6 | Yes | KQ writes the two ca00 knots; X0 has none. |
| m8 ca17 pointer, H3 fragments | line 20, 2.7 table | Yes | |
| m9 D4 split | D4 line 39 | Yes | |
| m10 dialoguelint exit | line 145 | Yes | |
| m11 `node --test` | line 75 | Yes | |
| m12 staleness test | line 69, 110 | Yes | |
| m13 review model | line 77, 110, 145 | Yes | |
| m14 player state growth | line 74 | Yes | |
| m15 ca13 twin row | 1.1, I step 3 | Yes | |
| m16 `--kit` source of truth | I step 5 (line 191) | Yes | |

All 2 blockers, 7 majors and 16 minors are addressed in text; two keep a defect inside the fix (B2 via M1, M7 via M2).

## 2. Checks the task asked for

**proof5.py design.** Sound. v2's pipeline (generators, then `--kit` over the generator output, then compare) reproduces HEAD for all 36 relevant folders plus ca01, ca12, their twins and the test shells; only the three named files differ as text and all three are JSON-equal. `--kit` reads its input from `<repo>/scenarios`, so it splices over the freshly generated shells, which is what v2 assumes. How the shells were made: the ca01 twin comes from `gen_e1_shells.py` (tier argument, `row_for`); the ca12 twin from `gen_e8_e17_shells.py` with no tier, then `--kit`. Two gaps (m1, m2).

**ca00 `convention: true`.** Each branch v2 lists lands on a real line of `office_kit.py` and none needs an engine change: `shell_ids` raises today for a shell with no triage set (line 76-92), `room_npcs` writes `chatter` unconditionally (line 168), `room_objects` copies `affordance.chatter`, `host_mappings` returns the shared set, `kit_globals` the shared bools. `apply_training_room.kit_text` asserts the spliced JSON equals `apply_kit`, so the convention branches only need to be consistent in `office_kit.py`. The claim that the card index is in memory only is true (`briefIndex`, lines 623-638; `_saveState` happens only at `_complete`). Consequence in M1.

**Kit quiet release.** Yes. `done.includes('debrief')` is the release in non-stepAway shells (ca01 line 898; `office_kit.host_mappings` line 245). D11 and line 72 match code and T.

**Carrholme.** `_maybePair` (`npc-needs.js:4490-4502`) opens a topic chat only when a second NPC is already using the same capacity-2 source, so one colleague at one source never speaks a topic. The exemption reasoning holds. The code does not yet support `pool: null`: `_pool`, `room_npcs` (`s.pop('chatterLines')`, `kit['pool']['key']`), `room_objects` and `scenario_fields` all read `kit['pool']` unconditionally, and `test_office_kit.py` iterates pools. Step 4 names the branch but not its parts (m3).

**File ownership.** No file has two writers. Checked P-GEN step 5 (it writes the five generators' `LINES`, which P-GEN owns; P-TW writes only `W2_LINES_twins.md`) against P-TW, P-H3 (ca13 twin) and I (rows, regenerated shells). `gen_e1_shells.py` is untouched. P-X0 does not own `episodes.json`, but its check at line 127 needs a ca00 row (m4).

**QS stub compile test.** A parameterised test needs `readdirSync` (a built-in) and the existing harness copy of `ink-engine`, `phone-chat-conversation` and `npc-conversation-state`; no new static import, so the copy-list rule is covered. QS reads the compiled `.json` (no `inklecate` call); "compile and run" at line 157 should say run the committed `.json` and leave compile freshness to the staleness test (m6).

**Line budget.** Sums to 118. Shared 12 + 12 + 6 + 0 = 30; stub 11 + 14 + 1 + 10 = 36; host 1 + 8 + 12 + 14 = 35; twin 17; episode 88. Per-package totals 23, 26, 7, 10, 1, 8, 12, 15, 16 add to 118. Stub counts by shell match the 18 non-ca00 tiered shells and the plan's cast pairs (hosts ca03 Darren, ca05 and ca10 Niamh, ca08, ca16 and ca19 Anjali are removed from their own pairs, so 2 per shell holds).

## 3. New findings

### Blockers

None.

### Majors

**M1. The ca00 close-and-reopen card cannot teach what it promises (1.3 line 55; row line 17; P-X0 line 126; cut order item 3).** ca00 has one stage, `oncePerLearner: true`, a conclusion objective with `concludeRequires` on `episode_core_00_first_play_done`, and `_writeDone` sets that global the moment "Got it" completes the brief. Two paths exist for a learner who obeys a last card that says "close it, say hello, come back":
- Close on the last card: `briefIndex` is memory only and no stage is saved, so the reopen starts at card 1, not at the card they left. `alreadySeen` never shows, because the done global is still false. The card's promise (your place is saved at the last stage you finished) is false for a one-stage episode.
- Press "Got it" first: the done global is set and the mission-conclusion screen follows. There is nothing left to reopen, and `alreadySeen` (line 55, "confirms the return") is shown only after the mission has already concluded.
So the practice cannot be completed, and the line "the tour's closing card teaches close and reopen" is untrue as built. Fix: drop the close-and-reopen card now (cut order item 3 is the right outcome) and keep the host greeting plus the two hello knots as the whole convention; put the "you can close the kiosk and talk to people" idea in the host's greeting or one existing tour sentence, worded without any promise of a saved place ("the kiosk will still be there when you come back"). If the owner wants true resume inside the brief, that is an engine change (persist `briefIndex`) and an owner call (section 4). Edit lines 17, 55 (second bullet), 126, I's ca00 live case (line 160, "close and reopen after the brief shows `alreadySeen`") and the P-X0 work description together.

**M2. The Quayholt and Carrholme staff needs are unspecified, and the stated rules contradict the sources (D12 line 47; 2.4 lines 104-105; row line 17).** "Errand" is not a need name. The engine's need names are `caffeine`, `thirst`, `hunger`, `rest` (environmental) and `work`, `social_media` (judged) (`npc-needs.js:109`, `:190`), and a source is used by an NPC only when it satisfies a need that NPC carries. Line 105 says kit staff "carry one need, no `work` need", yet the only Quayholt source is `kit_spare_pc`, which can satisfy only `work` (PLAN 4.2 line 98: "as an errand"; the plan's "no `work` need" rule is explained by "nothing in four of the rooms satisfies one", i.e. Quayholt is the exception). As written, nobody at Quayholt can use the PC, the capacity-2 pool topic never fires, and ca00's "errand need" (line 17) has no meaning. Carrholme's Yusuf has no source at all (PLAN: "sits and takes a coordinate errand"), so a declared need would only park him. Fix, in D12 and 2.4 Kit rules: (a) Quayholt staff carry a `work` need met by `kit_spare_pc` (affordance `satisfies: "work"`, a short `useSeconds`, `capacity: 2`, `chatter: "pool"`), with the "no work need" rule carved out for Quayholt; or name another need and source; (b) say the judged-need path (`_judged`, `_deadStation`, the PC gate fields of PLAN 4.2 line 102) is part of gate D proof 11 and the 4.2 gate click, because a judged `work` need on a gated PC is the one place the Quayholt kit differs from the three that passed gates A to C; (c) give Yusuf an explicit need or none (`needs: {}`), and say T and proof 11's "staff leave home, use the source and sit" pass criterion is waived for him (he sits at his coordinate home).

**M3. `keyMessage` is optional, but the twin line, the stubs and the host block all read `kit_key_caught` (2.7 line 144 work item 1; 2.4 line 102; line 150; D2).** `kit_key_caught` is declared only for a row with `keyMessage` (`kit_globals` sets `KEY_GLOBAL` under that condition; `message_globals` is empty otherwise). The brief tells P-H to "leave it out where there is no single key message" while telling KT/KQ/KC "branching on `kit_key_caught` alone" and P-TW to write catch and miss twin lines. In a shell with no `keyMessage` the global is never written, so every branch plays as "miss" and praise lines never fire, and nobody is told. Fix: either require a `keyMessage` for every shell with a host line or twin line (and have P-H record why, per shell, when none exists), or add the rule "no `keyMessage`: the stub knot has one neutral line, the twin line is a single plain string (the generators already take a plain string), the host block has no catch and miss split". ca17 (one stub knot, no host line) is the likely single-branch case; say so, and count it.

### Minors

- **m1 (2.3 step 1, line 90): proof 5 does not say which generator copy runs or that `inklecate` is needed.** The script exports HEAD to `<root>` and runs generators with `--repo <root>`. Say it runs the copies inside `<root>` (committed code, consistent with commit-before-test), and that it needs `inklecate` on the path (the generators compile ink; the run fails without it).
- **m2 (2.3 steps 1 and 2): `--kit` masks generator-versus-splice disagreement.** `kit_text` strips old kit members and re-splices, so once step 2 gives a generator the tier argument, proof 5 would pass even if the generator wrote the kit differently from `--kit`. Add a `--no-kit` run for rows whose generator carries the tier (ca01 twin now; the ca12 twin after step 2; the 16 twins and ca17 after rows exist) and require it equal to the with-`--kit` output. This is the check R1 B1 asked for on the ca12 twin.
- **m3 (2.3 step 4, line 93): list the `pool: null` branches.** `_pool`, `room_npcs` (do not pop `chatterLines`; write no `chatter` key), `room_objects` (no `pool` key lookup), `scenario_fields` (no top-level `chatter`), `kit_chatter`/`kit_owned` and `test_office_kit.py` (skip the pool-line length test when `pool` is null). Also say a kit with `pool: null` and no `poolExempt` is an error.
- **m4 (2.6 line 127): P-X0's proof 5 check cannot run.** It says "only ca00 differs once the ca00 row exists in I", but P-X0 does not own `episodes.json` and stage 1 has no row. Make it: generate ca00 into scratch with a scratch copy of the row and confirm only ca00's cards and greeting differ, or drop the proof 5 clause and leave it to I step 5.
- **m5 (2.7 line 144): "the parity test reads this" is wrong.** `social-awareness-fragment-erb-parity.test.mjs` exempts `conceptPanel` (`STRINGS_VALUE_EXEMPT`). The eight-word run is the new P-TEST case (2.8 line 154). Reword. Also say how the test finds the host first name (read the shell's host NPC `displayName`, not the row).
- **m6 (2.8 line 157): QS "start diverts ... for each episode the person has in `episodes.json`" fails for Chidi in ca17** (ca17 has one stub knot, Fatima's; Chidi is in the row's pair). Say "for each episode for which the person has a knot in their own file", and require every row person to have a knot except where 4.1 says otherwise (ca17 Chidi). "Compile and run" should read "run the committed `.json`; compile freshness stays with the staleness test".
- **m7 (stage list, line 176, and I step 4, line 190): P-GEN step 5 is both a stage 2 task and an item inside I's step 4.** Say P-GEN step 5 is built on its own branch in stage 2 and merged by I at step 4; its scratch check runs without rows (kit absent), so only `ink/*` differs. Also state that I's step 5 regeneration is the first run where twin rows carry `keyMessage` and `hostLine`.
- **m8 (section 7 and D5): the brief does not carry the decision numbers** now assigned to the two calls (O1 is D225, O2 is D226 per the caller). Add them so the card and the decisions log agree.
- **m9 (I step 3, line 189): document `convention` in the `_note` of `episodes.json`** (I owns the file), and say the 17 full-shell rows carry `handAuthored: true` (they are not generator output), as the ca12 and ca01 full rows do.

## 4. Open owner calls

Exactly the two v2 names, and both are genuine calls:
- **O1 duty wording (D225)**: correct, ca02, ca03, ca05, ca08, ca11. The recommendation matches UK GDPR Articles 33 and 34 and PLAN 15. The interim (no duty claim, clause held in the handover) is safe.
- **O2 voicing (D226)**: correct and consistent with D207 and D210.

Points that need no call: the Carrholme pool exemption and the Quayholt fallback exemption are within the brief's authority (they lower the line count and are cut-order item 1 in spirit), but record them in the card as information: Carrholme's 6 shared lines drop to 1 and the plan's 57-line estimate falls accordingly.

One conditional third call: if the owner wants the ca00 close-and-reopen practice kept, it needs an engine change that persists the brief's card position (M1). Do not put it on the card unless the owner asks for it; the recommended fix (drop the card) needs no call.

## 5. Verdict

**Not ready to build yet: 0 blockers, 3 majors (M1 to M3), 9 minors (m1 to m9).** All 25 R1 findings are fixed in the text and the structure (packages, stages, ownership, 118-line budget) is right, so no restructure is needed. proof 5 works as described and is the strongest part of v2. The three majors are text decisions the builder cannot make safely alone: drop the ca00 close-and-reopen card, state the Quayholt and Carrholme needs and sources, and tie `keyMessage` to the branches that read it. After a v3 edit of those and the minors, a short Sonnet delta (R3) should find zero blockers and majors, and P-GEN step 1 can start. P-GEN step 1 (`proof5.py`) does not depend on any of the three and can begin now.
