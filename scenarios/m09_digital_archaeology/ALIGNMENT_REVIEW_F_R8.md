# m09 finale loop: alignment review, round 8

## Scope and method

2026-10-22. Phase 1 (alignment), round 8, of the AGENTS.md five-phase loop. It runs past the cap of five because of the user's rule that the phase completes only at 0 major and 0 minor. I'm a fresh Opus reviewer, working read-only and statically (no browser). I worked the `mission-alignment-plan` ten-row rubric as a single reviewer, as rounds 1–7 did, and judged the tree at commit 8c7cf04f ("alignment round 7 fixes"). m09 has no uncommitted changes. I read the R7 fix diff (`git diff ef712632 8c7cf04f`) line by line. I recompiled Noor's ink to scratch and compared it with the committed JSON, and walked her hub by script on all four m05 routes, through a cancel and then a save. I checked the clone tag handler and the cloner's save event in the engine (`chat-helpers.js:318-380`, `rfid-minigame.js:280-305`). I also validated the pre-fix ERB from scratch to get a warning baseline. Then I reread HaX's phone in full, the debrief, the hatch, Noor, Tran, Old Coyote, and texts/C's Noor credit, and judged the mission afresh against m01/m02 and the brief's aim: a TV spy thriller in which earlier choices change the night, and which hands m10 what its ending needs. I did not open any SecGen file, VM plan or field guide.

**Counts: 0 blockers, 0 majors, 0 minors.** Both R7 findings are closed. The fixes add no new problem in play or in the docs, and change no spoken line. I found nothing new at minor or above.

## Checks run

- **Validator** (`--skip-ink --no-graph`, so no `dungeon_graph.*` rewrite): ERB, JSON, schema, geometry and door alignment are clean, with 0 errors. The 23 issues and suggestions and the 6 missing-recommended notes are the same set as R2–R7. The objective-wiring block has one more warning than before the fix (13, against 12 when I validated ef712632's ERB): HaX now has two `card_cloned` mappings (indices 24, 25). The fixer justified it in the overlap header (erb:127-128), and it holds, because the conditions test different card names (`'M. Sorensen'`, erb:191; `'N. Haddad'`, erb:193). The engine sets `cardName` from the NPC's `rfidCard.name` (chat-helpers.js:349-351), and no other card carries either name.
- **dialoguelint**: 0 errors. 5 `not-x-but-y` warnings (briefing, debrief, HaX L518, Sorensen door L45, hatch L70) and 1 allowed `you-after-choice`, identical to R7. These belong to the dialogue phase.
- **reopencheck** (`missions.json`): `agent_0x99` has 0 problems over 1,614 reopens (1,426 re-runs; 0 replayed openings), identical to R5–R7. The Recruiter, Nightshade, Torres and Gary show the known `[Hello?]`-stub restart, as in every round. reopencheck has no Noor entry.
- **Noor's ink**: `inklecate` on `m09_noor_haddad.ink` gives JSON identical to the committed file. No m09 ink file is newer than its JSON.
- **inkcheck and loopcheck on Noor**, in three states (warned in time; warned late; not warned): `start` and `hub` are clean in each, with no runtime errors over 200 steps × 6 strategies. `hub` with `staff_card_cloned=true` is also clean in each state.
- **Hub walk** (scratch script, ink runtime). The choices shown on each route:
  - *Warned in time*: the card is handed over (`#give_item:keycard:noor_staff_card`), then the hub shows "How long have you worked for Sorensen?" | "I'll let you get on." No clone button.
  - *Warned late*, *deal unconfessed* and *cold start*: the hub shows clone | Sorensen question | exit. After a cancel (`staff_card_cloned` stays false) the clone button is still there. After a save and reopen (`staff_card_cloned=true`) only the Sorensen question and the exit show. Two choices remain on every route, so the hub never starves.
- **Voiced lines**: R7's fixes touched one ink choice condition, two ink comments, one HaX mapping, one global and three contract cells, and no spoken line. The narrator line and Noor's replies are unchanged, so the count of 369 in CONTRACT §15 still stands.
- **Exports**: twenty-three, unchanged.

## Round 7 findings: closed?

| R7 | Outcome | Evidence | New problem from the fix? |
|---|---|---|---|
| r7-1 (a) Noor offers to clone the card she has just handed over (warned-in-time route) | **Closed** | The choice is guarded `{not staff_card_cloned and not (m05_found_pipeline_list and not m05_recruiter_deal_accepted)}` (noor.ink:91). The guard is the same expression as `start`'s warned-in-time arm (noor.ink:33), so the two can't drift apart. The hub walk shows no clone button on that route | None. The tell buttons were already hidden on that route (noor.ink:108, 111), so her warned-in-time hub is the Sorensen question and the exit, which fits a clerk who has already told the player what she knows. The player's first use of the cloner moves to the hatch on this route, and HaX's flag 1 call already frames that ("Her card's on a reel at her hip. You've done this before.", phone:203). A knock-out after the handover drops nothing twice, because `give_item` splices the card out of `itemsHeld` (npc-game-bridge.js:309) |
| r7-1 (b) The clone button never retires after a saved read | **Closed** | HaX latch `card_cloned` + `data.cardName.includes('N. Haddad')` → `staff_card_cloned` (erb:192-193). The global defaults to false (erb:2525), and the ink has a synced `VAR` with the hatch's comment (noor.ink:24-26). The rfidCard name is "Staff Card, N. Haddad" (erb:1100), and `card_cloned` fires only on a successful save (rfid-minigame.js:293-303), so a cancel keeps the button | None. The pattern is the hatch's `stacks_card_cloned` (erb:189-191; hatch.ink:28-30, 124), which the final playtest confirmed in the browser: still there after Cancel, gone after Save (PLAYTEST_FINAL.md:16). The NPC `_comment` (erb:1079) and CONTRACT §3.2 (CONTRACT:227) now describe the guard, and §15 records the change (CONTRACT:829) |
| r7-2 §2.1 status ladder lacks two built rows; topic 6 lacks its second line | **Closed** | The ladder now carries `hatch_talked and not cage_opened` and `catalogue_guide_offered`, with the final row's wording updated (CONTRACT:125). I checked it row by row against phone:880-925: the order and conditions match, and the only compression is `salvage_opened`'s two rows written as one with "and his file if not held". Topic 6 now quotes "It's a floor safe, in her office." (CONTRACT:106; phone:733) | No |

## Severity table (new findings)

None at blocker, major or minor.

## The whole mission, judged again

| # | Rubric row | R8 judgement |
|---|---|---|
| 1 | Canon and stakes | At the bar. The order's cold open, Analysis' guess "labelled as a guess", then his own signed 1,100–2,600 in the hour read (phone:577-581). Villanueva, Noor and the eleven legacy names are people at risk tonight, and the two dead agents are read off a card at the pen (debrief:255-257). Netherton keeps his promise not to say the name until it's proved (phone:381). The police make the arrests (debrief:186). No Cabal, institute, eldritch content or Director Cross |
| 2 | Aims and staging | At the bar. Six aims, each opened by the one before. Reveal tasks are unlocked inside their scenes (`hear_the_name`, `hear_the_mirror_job`, `send_the_notice` in all three answer stitches, phone:441, 457, 469). Titles give nothing away, and `concludeRequires` holds the four flag tasks only |
| 3 | HaX hub | At the bar. Nineteen topics gated on progress globals and retired by ink-local shadows where a tag lands late (phone:95-100). The status ladder never names a flag already in (phone:880-925). Four guide offers sit behind one button, gated `_offered`/`_hint_given` (phone:808). The VM steers stay at story level |
| 4 | Ink craft | At the bar. dialoguelint shows 0 errors, every call that carries information ends on a one-word reply, and the voiced scenes guard their restarts. No menu now contradicts what has just happened on any of Noor's four routes. The briefing wall stays with the dialogue phase |
| 5 | Moral choices | At the bar. Each choice has a scene payoff and a line at the end: the raid-team answer, the bins, the Recruiter's four outcomes and the m05 secret, Tran, Sorensen, Noor, the hand, the Reading, Nightshade's file, the confession, the notice and the memo. The purge section pairs every saved line with its shredded partner |
| 6 | Music | At the bar. noir → cutscene → noir → threat → silence → spy-action once → cutscene → victory, each with a disjoint `game_loaded` row |
| 7 | Rooms | At the bar. Geometry and doors are clean. The staff passage keeps the RFID lock off route B, and the closet's light, console and credit agree on `tran_outcome` |
| 8 | Mechanics and VM | At the bar on the game side. Picks, two clones (Noor's EM4100 everywhere except the warned-in-time route, where she hands it over; Sorensen's MIFARE with custom keys), a print, the PIN cracker, Vigenère, and four flags on two stations, each tied to a story beat. Both clone buttons now retire after a saved read and survive a cancel. The lab URLs and the box wait for F9 and the lab-sheet stage |
| 9 | KO resilience | At the bar. Every person NPC has a fallback (the `koImmune` hatch holder, cage Sorensen's held card, `taskOnKO`/fate globals, Noor's card dropped on a knock-out unless already handed over), and every bystander gets a reaction |
| 10 | Bookends | At the bar. The briefing has `skipIfGlobal`. "[Bring me in.]" opens a debrief that replays as short bridging lines after a reload (debrief:54-58, 68-71, 101-103, 125-135), and the card and credits roll on `debrief_closed` |

**Earlier choices.** Still strong, and the m05 payoff scene at the front desk is now clean. Imported m01–m08 branches change who helps (Noor's card, Gary on the cipher, Torres at the H&L boxes, Victoria's maintenance code, Nightshade's custom-keys tip), what is possible (the second bin, the Recruiter's leverage, Nightshade's file, Tran's guard on m01's knock-out) and what is said to the player (Sorensen's recognition, the Reading's pages, HaX's four confession forms, the m04 landing lines, the m08 echo in the ledger call, Netherton's floor and stance lines, Kemal Aydin's walk-out against the signed number).

**Setting up m10.** Unchanged and complete on m09's side: the proved name; the bunker and its hour (06:00 UTC, the cells at 04:00, the key); the signed toll; the invitation by name; WREN in one of three states; HaX's owed "rest"; and twenty-three exports, including the player's own stances.

## Deferred, not counted

- **m10's imports** of the R2 exports, and its `''` defaults for `sorensen_fate` / `tran_outcome`: m10's loop.
- **R1 m8**, the handwriting word: m10 says "sloping", and m10's loop should confirm it.
- **R1 m10**, the briefing's wall of cards: the dialogue phase.
- **The five `not-x-but-y` lint warnings**: the dialogue phase.
- **F9**, the SecGen box: with the user. The VM-WIRE placeholders are unchanged.

## Considered and withdrawn

- **The second `card_cloned` mapping adds a validator overlap warning.** It's real (12 → 13 in the objective-wiring block), but the header at erb:127-128 justifies it and the two conditions test different card names. No change needed.
- **On the warned-in-time route the cloner's first use is now the MIFARE card at the hatch, not the easy EM4100.** R7 proposed this and accepted it. The cloner is kit from earlier missions, and HaX's flag 1 call says "You've done this before." Players who want the easy card first are on the other three routes. No change needed.
- **The NPC `_comment` at erb:1079 states the warned-in-time handover twice.** It's a developer comment, not player-facing, and both halves are true. Cosmetic.
- **Status row "Clone her card at the hatch if you haven't." (phone:914) could branch on `stacks_card_cloned` now that the global exists.** The hedge is true either way, and HaX's ink doesn't declare that global. Adding it would be polish for the dialogue phase, not an alignment gap.
- **The debrief tells a warned-late player "She is still on a list, and she does not know it." (debrief:231).** That player warned her to watch her boss (noor.ink:44), not that she was on the Recruiter's list, so the line holds.
- **The Noor latch hasn't been seen in a browser.** It is the hatch's mechanism with a different card name, and the hatch's version passed the final playtest. The phase-5 playtests should include one cancel-then-save at Noor's desk on a cold start; that's a check, not a finding.
- **erb:485's indentation.** Cosmetic, noted in R4–R7.

## Verdict

**Phase complete: 0 blockers, 0 majors, 0 minors.** Both R7 findings are closed. Noor's clone button is gone on the warned-in-time route, retires after a saved read, and stays after a cancel. The contract's status ladder and topic 6 match the ink. The fix compiles to the committed JSON, changes no spoken line, and adds only one justified validator warning. m09 meets the m01/m02 bar on all ten rubric rows, so the mission can move to phase 2 (puzzle chains). In phase 5, add a cancel-then-save check at Noor's desk to the playtest script, and walk the warned-in-time route once in the browser.
