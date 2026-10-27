Part covered: m09 Digital Archaeology, stages 0–5 (stage_0, stage_1 story_arc, stage_2 storytelling_elements, stage_3 moral_choices, stage_4 objectives_tasks, stage_5 room_layout), checked against docs/agents/FINALE_ENGINE_*.md.

# Milestone S4–5 review, m09 part (a3b55ab0)

Paths are relative to `planning_notes/overall_story_plan/mission_initializations/m09_digital_archaeology/stages/`: s0 = `stage_0_initialization.md`, SA = `stage_1/story_arc.md`, SE = `stage_2/storytelling_elements.md`, MC = `stage_3/moral_choices.md`, S4 = `stage_4/objectives_tasks.md`, S5 = `stage_5/room_layout.md`. S4 and S5 are the authority on rooms, locks, wiring and engine verdicts. Review-history sections (SA §14–§21, MC §11–§15, S4 §14 and §16–§18, S5 §12 and §14–§16) were read as records and are not counted as live text.

## Findings

| ID | Sev | Docs and lines | Problem | Fix (authoritative doc) |
|---|---|---|---|---|
| M9-01 | major | S4:207 vs S4:161, S4:235 | The globals table says `in_cage` is set "by HaX on entering and leaving" and read by "the call's mappings (b) and (c)". Row 3 and "Where the mappings live" put both setters on `recruiter`, listed before ring (a), which also reads `!in_cage` (the N-R3-2 fix). A build from the table brings back the bug where the call rings inside the cage. | S4:207: "`recruiter`, two mappings listed before ring (a), both `cooldown: 0`; HaX clears it on `game_loaded`", read by (a), (b) and (c). S4 row 3 is authoritative. |
| M9-02 | major | SA:386, MC:243, MC:515, MC:567, MC:590 vs S4:205, S4:306 | SA and MC still read "sent in the archive" from `albion_notified` "at the debrief's first line, into an ink temp; no extra global" (MC:590 says the extra global was dropped). S4 adds `debrief_notice_before`, copied in HaX's "[Bring me in.]" knot, and says it is "never a value taken on the debrief's own first line", because the debrief restarts at its knot after a reload. | Rewrite SA:386, MC:243/515/567/590 to name `debrief_notice_before`. S4 §6.5 is authoritative. |
| M9-03 | major | S5:151, S5:354, SA:156, MC:70 vs SA:155, MC:68, S4:177; S5:136 | Victoria's door scene offers only "[Take Derek's file.] / [Take the letters.]", and `sorensen_door` "holds both files". On `m03_victoria_fate == "recruited"` together with `m08_nightshade_tidied`, the other bin is Nightshade's copy, so that route has no button and no item for it. `sorensen_hatch`'s `itemsHeld` is never listed (S5:136 says she gives "from her itemsHeld"; the §8 row has none), and the three file items have no ids. | S5 §3.6, §3.7, §8: `sorensen_hatch` and `sorensen_door` each hold three items with ids (e.g. `derek_file`, `letters`, `nightshade_copy`). Add "[Take Nightshade's copy.]" on tidied. Sweep SA and MC. S5 is authoritative. |
| M9-04 | major | S4:272, S4:285, S4:298 vs FINALE_ENGINE_TRIAL_CALLS_CREDITS.md:125, :127 | HaX's forced scenes with `resume: true` (`identity_scene`, `hour_read` on `schedule_read`, and the `deck_resume` choice) re-ring only on `room_exited`, `game_loaded` (and flag 4). The engine doc warns that `resume` restores whatever HaX's saved story is. After a hit closes the call, the player can open HaX's thread in the same room: an unvoiced, closable hub, or the call's choice answered outside the call. The re-ring then resumes at the wrong place. | S4 §6: add a `conversation_closed:agent_0x99` re-ring (the engine's "immediately" trigger) with each scene's condition, or re-ring to a guarded resume knot instead of `resume`. Add a stage 9 browser test. S4 is authoritative once amended. |
| M9-05 | minor | S4:112 vs S4:393, S5:167, S5:250 | `open_the_safe` still says "or the PIN from her desk". The desk drawer is gone (P16, m7): the long way is the lease date heading the rent book. | S4:112: "or the rent book's date". S5 is authoritative. |
| M9-06 | minor | S4:5, S4:258, S4:657; S5:5, S5:389; SA:550, SA:601 | F20 is described as "in progress, not yet committed", and S4:258 says "up to the boundary rule that doc will define". The rule is approved and defined (VOICED_CALLS §8): call knots are the start knots plus everything they reach, never entering the contact's home knot (`currentKnot`, default `start`). | Mark F20 approved, quote the home-knot rule, and name HaX's home knot (see the stage 7 list). |
| M9-07 | minor | SA:192, SA:548 vs S4:256; FINALE_ENGINE_TRIAL_CALLS_CREDITS.md:22 | "If the player closes the call before that (Escape, damage)". Escape does nothing on a forced call; only a hit or a reload closes one. | SA: "(a hit, or a reload)". |
| M9-08 | minor | s0:38, S4:178, MC:571 vs S4:178 (condition), SA:162 | The legacy-box trigger is written as "opens the plan cabinet" (s0:38), "the first of the chest" (S4:178 text), and "the chest opened" (MC:571). The wired condition is `nightshade_file_held` (the file picked up), and "chest" was renamed "cabinet". | Say "Nightshade's file picked up" everywhere. S4's condition is authoritative. |
| M9-09 | minor | s0:38 vs S4:178, SA:116 | "Only knocking her out ... saves it" leaves out the warned-in-time route, where Noor holds the box back. | s0:38: add "or Noor held it back (warned in time)". |
| M9-10 | minor | s0:38 vs SA:154-156, S4:177 | "At the cage, Derek's file or Nightshade's copy (default: the Initiative's letters to Social Fabric)" reads as the wrong pair and the wrong default. The choice is Derek's file against the letters (Nightshade's copy on tidied), and the default kept is `derek_file`. | Reword s0:38 to SA's pair and default. |
| M9-11 | minor | SE:618 vs S4:454, S5:392 (item 7) | SE says Sorensen "never triggers" the `threat` playlist. S4 plays `threat` for "Sorensen if fought", and S5 says she fights back if attacked. | SE:618: "Sorensen only if attacked". |
| M9-12 | minor | S5:11 vs S5:23, S5:461 | "in three sizes" is followed by four sizes (4×2, 2×2, 2×1, 1×1), and §13 says "four sizes". | S5:11: "four sizes". |
| M9-13 | minor | SA:458, MC:573 vs FINALE_ARC.md:455 | "m10's import count is 67" (or "becomes 67") is stale: FINALE_ARC now has 90 (Tier 1 40, Tier 2 50). | Update the count, or mark it as the count at stage 3. |
| M9-14 | minor | SA:407 vs S4:143, S4:171, S4:414 | The conclusion is described as "`mission_complete`, the conclusion task". The build completes `report_to_netherton` and sets `report_done` on the debrief's last line; `mission_complete` was m05's hub choice. | SA:407: name `report_to_netherton` and `report_done`. |
| M9-15 | minor | SA:349, SE:430 vs S4:168 | "Finish with me first. Then his box." (to a player who holds the file) has no mapping. Row 10 sends only "His file first..." on `!identity_scene_started`; a started, unfinished scene re-rings instead. | Either add a mapping (e.g. `flag4_submitted && nightshade_file_held && !flag3_submitted`) or cut the line from SA and SE. S4 decides. |
| M9-16 | minor | S4:426 vs MC:230 | Closing-card line 4a reads "sent, nine years late." MC (C-13) keeps "nine years late" for Tesseract to say in m10. | Reword 4a (e.g. "His vendor notice: sent from Helena."), or record that the card is allowed it. |
| M9-17 | minor | SA:325 vs S4:483, SA:33 | Beat 3.4 is still "(2 minutes...)". S4 re-costed it to 1, and SA's Act 3 beats now sum to 32 against its own table's 31. | SA:325: "1 minute". |
| M9-18 | minor | S4:440 vs S4:177, SA:152 | The credit line "Saved at the hatch: Derek Lawson's file." is wrong on Victoria's door route. | "Saved from the bins:" or similar. |
| M9-19 | minor | S4:440, S4:395 vs S5:153 | The credit "The legacy placement files: picked up." implies an item. `feed_table_box` and `noor_desk_box` are readable variant objects. | Reword the credit, or make the files an item. Stage 6 or 7 decides. |
| M9-20 | minor | SE:104-106, MC:271 vs S4:310-323 | Nightshade's text back after "[Send it to him.]" has no mapping in §6.6. | Add a `nightshade_phone` mapping on `global_variable_changed:nightshade_shown_file` (`value === true`), `sendTimedMessage`, with a variant on `cage_bin == "nightshade_copy"`. |
| M9-21 | minor | SA:122, MC:291 vs S5:155, S4:179 | "[Show her the page.]" needs "the ledger page in hand", but `printed_ledger` is a readable object, not an item, and it is shredded once read if Sorensen is free. The gate is unspecified. | Gate Noor's choice on `printed_ledger_read` (or on flag 2 plus the read) in S4 §5, and say the page survives the shredding as a read. |
| M9-22 | minor | SA:304 vs S5:182, S4:379 | The Alpha annotations' decode happens "at a terminal" (SA). S5 has `alpha_annotations` as a readable, and no field guide covers it (`m09_archive_code_guide` is for the salvage code only). | Say it uses the CyberChef workstation from the start kit, and that stage 6 picks its encoding (the same operation, or a different one). |
| M9-23 | minor | SE:548-558 vs S5:190-196, S4:295 | The casualty sheet and the release-key line are "object text", but no object in the salvage cage carries them. Flag 4's content reaches the player only through HaX's text read. | Decide: a variant object on `flag4_submitted` (e.g. a mirror-job printout in the salvage cage) or "read by HaX only". S5 owns the choice. |
| M9-24 | minor | S5:344, S5:348 vs FINALE_ENGINE_TRIAL_CALLS_CREDITS.md:33, FINALE_ENGINE_VOICED_CALLS.md:103 | Two registered characters show "Agent HaX" (`agent_0x99`, `hax_voice`). A phone co-speaker prefix is matched by display name, so in the Recruiter's thread either record may be picked. | Give both the same `voice` and `fx` (S5 already intends it), and check at stage 9 which record resolves. |
| M9-25 | minor | S4:57 vs S4:400 | "The catalogue entry is in the notepad since Act 1" means the coded salvage line, but "catalogue entry" is also the Albion entry in the folder. | S4:57: "the coded salvage line". |
| M9-26 | minor | S4:494 vs S4:242 | "(§5: the stacks door, the office door)" leaves out the cage gate's `game_loaded` backstop on Victoria's route. | Add the gate. |

**Checked and consistent across all six docs.** The ten rooms, their sizes, order and connections. Every lock and how it opens:

- the picks on the dock office door;
- Noor's card (`reading_staff_door`, cloned or handed over);
- `stacks_release` opened by HaX's `unlockDoor` on flag 1;
- `stacks_card` cloned at the hatch, or Victoria's maintenance code (an `unlockDoor` from HaX's hub);
- Sorensen's print on the plan cabinet;
- the office password opened by `unlockDoor` on `deck_choice_made`;
- the safe PIN (the cracker, or the rent book);
- `tape_room_reader` (the card from the safe);
- the salvage keypad (the decoded code);
- the H&L box (the file number).

Also consistent:

- **Flags:** 1–2 at `drop_terminal` in the reading room, 3–4 at `tomb_beta_station` in the salvage cage.
- **Places:** Tomb Beta's server is in the salvage cage; the Reading is in Sorensen's safe; the Alpha clip plays from the reel deck in the tape room after `identity_scene_done`; the identity scene, flag 4's read and Tesseract's call are phone scenes heard in the salvage cage.
- **Sends:** only from HaX's hub, or at the debrief.
- **NPC ids, start kit, aims and task ids:** 6 aims, 27 tasks, 5 optional.
- **Done-flags:** `cage_opened`, `deck_choice_made`, `identity_scene_done`, `hour_read_done`, `tesseract_call_done`, `report_done`.
- **Engine keys:** `unlockDoor`, `voiced`, `resume`, `disableClose`, `koImmune`, `closingCard`, `silence`; also `door_unlock_attempt`, `door_unlock_failed`, `door_unlocked_by_npc` (`roomId`), `room_exited` (`roomId`, `nextRoom`), and `#give_item:<type>:<id>`, all checked in the engine.
- **`#add_note`:** none live (every mention is "not `#add_note`" or a review record).
- **Timings:** 85/57/28 (76 critical path) match FINALE_ARC's current figures, so they are not stale.

## What stage 6 (lore) needs

1. **The salvage code and its encoding (P20).** S4:165 and S5:180 ask for a CyberChef operation (one or two steps) keyed by the legend; Gary's line constrains it: "Read it like a shelf mark, not a number" (SE:130). Stage 6 must fix:
   - the operation's exact CyberChef name, for Gary's call and for `m09_archive_code_guide`;
   - what the framed `shelf_code_legend` shows, and how the key is read off it;
   - the coded string and the decoded password.

   Password locks are case-sensitive, with a case-mismatch hint (`game.rb:1193-1199`), so stage 6 also chooses the case. The ban list (`|`, `#`, `//`, `{`, `}`) is not complete for text quoted in ink and in ERB/JSON. Add `->`, `<-`, `<>`, `~`, `[`, `]`, `\`, `"`, `<%`, and a leading `*`, `-`, `+` or `=`.

   The one string must be identical in all three places it appears:
   - the `catalogue_salvage_line` notes item in HaX's `itemsHeld` (`name: "Catalogue: salvage cage"`);
   - every `drop_terminal_screen` variant from flag 1 on;
   - HaX's topic 5 quote.
2. **The Alpha annotations' decode** (SA:304, S5:182). Which encoding (the legend's operation or a different one), and the coded text that decodes to "Carry it yourself. Let it hurt afterwards." Say where it is decoded (M9-22).
3. **Codes and numbers.**
   - **The safe PIN** (= the lease's start date): its format and length, and the same date on every `rent_book` page header and in `lease_file`.
   - **The office door's long password:** one that appears nowhere.
   - **The H&L file number:** the `hl_box` password; it must match the ledger variant of `drop_terminal_screen`, WREN's entry (source "H&L") and HaX's `ledger_read`.
   - **Series numbers:** the trolley list's R-114 to R-161 against flag 1's Series R shelf marks.
   - **Noor's codename** on the candidates' page.
   - **The notebook scan's course code.**
   - **Dates** that fit "nine years" (the memo), "eleven years" (WREN and H&L), "seven years" (he left) and "fifteen years" (the notebook and Nightshade's file).
4. **Item ids and names that are still missing:** the three bin files (M9-03), which record holds each (`sorensen_hatch`, `sorensen_door`), and whether the legacy files are an item or a readable (M9-19). Check that each existing id matches its `targetItemIds` in S4 §3. Existing ids: `noor_staff_card`, `tape_room_keycard`, `nightshade_file`, `the_reading`, `the_reading_last_page`, `master_schedule`, `lease_file`, `rent_book`, `danny_sheet`, `refit_ledger`, `hl_placing_sheet`, `catalogue_salvage_line`.
5. **Variant text for every object S5 §3 lists, most specific first.**
   - The building's paper: `drop_terminal_screen` (5 states plus Torres by `m05_final_choice`), `case_file` (the payments page), `notebook_scan`, `trolley_list` (3 steps), `noor_desk_box`, `incident_book`, the H&L bay label, `hl_placing_sheet`.
   - The cage: `printed_ledger` (locked; codename pages; Reeves' handler sheet; Noor's codename; shredded), `feed_table_box` (4 states), the legacy files' eleven entries (SE:580), `sorensen_stamp` (the warm line).
   - The office: the Reading (4 entries × values, never-played forms, last page, HaX line, margin note), `master_schedule` (the ticked rooms, the salvage line unticked, her query), `lease_file` (no-coordinate; m08 location known; Victoria arrested or ko), `rent_book` (Irina), `danny_sheet` (by `m03_danny_fate`), `refit_ledger` (`m02_paid_ransom`), `deck_controller` (by `deck_pulled`).
   - The tape room and salvage cage: `shelf_code_legend`, `alpha_annotations`, `albion_folder` (entry, memo, notice; "Printer tray, empty."), `enrolment_binders`, `tomb_beta_rack`.
   - Elsewhere: `tape_side_console`, Derek's file (by `m01_final_choice`), the letters (Villanueva), Nightshade's copy, `nightshade_file`.
6. **Flag 4's documents.** Where the casualty sheet and the release-key line live as text, if anywhere (M9-23).
7. **Names and canon.**
   - The called guard's name and look (P14; different from Old Coyote and Tran).
   - The Albion controller's vendor.
   - The canon list in SA §13 "Stage 6", including MS-20 (whether Tesseract gave the same lecture at Tomb Alpha and on SAFETYNET's course), still open.
   - SA:98 asks stage 6 to write the cracker's quarantine into "the Citadel's incident file", but no m09 object carries it. Say where it goes, or drop it.

## What stage 7 (ink) needs

1. **F20 home knots.** Name HaX's `currentKnot` (home): `start` diverting to `support_hub`, or `support_hub` itself.
   - Voiced start knots: `recruiter` → `call`, `resume_name`; `agent_0x99` → `identity_scene`, `tesseract_call`, `deck_resume`.
   - Everything they reach is voiced: the shared outcome include, the Albion knot, and the hand-closing line. No voiced knot may divert into the home knot or into any knot the hub also uses, unless that knot's lines are meant to be voiced.
   - Each voiced knot ends `#exit_conversation`.
   - Recount the roughly 66 lines (S4 §6.7) after the walk.
2. **HaX-hosted resumable scenes** (M9-04). Write them so a reopen of HaX's thread can't answer the call's choice outside the call, or wait on S4's amended re-ring.
3. **Speaker prefixes.** The exact displayName for `netherton` ("Director Magnus Netherton", SE:726). Settle the two "Agent HaX" records (M9-24). Use "Dr Adrian Tesseract (recording)" on `alpha_recording`. Register the called guard's prefix once he has a name.
4. **The debrief** keys the archive-send branch on `debrief_notice_before` (S4:205), not an ink temp (M9-02). Each answered beat needs its own guard so a replay skips it (S4:306). "The archive" takes at most two lines, in SA §7.1's order. `double_crossed` is checked before `sleeper_named`. The last line carries `#complete_task:report_to_netherton` and `#set_global:report_done:true`.
5. **Sorensen's three records.**
   - The `sorensen_hatch` knot sets `hatch_talked` at the top and offers `#clone_keycard:stacks_card` on every branch and as a repeatable choice. Its bin buttons set `bin_chosen` and `cage_bin` and `#give_item` the file by id.
   - `sorensen_door` does the same, including Nightshade's copy on tidied (M9-03).
   - The cage record `sorensen` offers the talk-down only on `nightshade_file_held`, and it sets `sorensen_fate = "talked"`.
6. **Phone knots and their globals (S4 §4–§6).**
   - **`flag1_read`:** gives the coded line via `#give_item:notes:catalogue_salvage_line`.
   - **`ledger_read`:** sets `ledger_read_heard` on its first line.
   - **The Recruiter's `call`:** the first line sets the defaults (`recruiter_call_started`, `refused`, `alpha_tapes`, `recruiter_secret` by branch) and runs `#unlock_task:answer_the_offer`.
   - **The call's buttons:** each writes a legal pair. `sleeper_named` and `recruiter_gone` are set on her line, not on the button.
   - **The call's last choice:** `deck_choice_made` and `#complete_task:answer_the_offer`.
   - **`identity_scene`:**
     - First line: `identity_scene_started`, `#unlock_task:hear_the_name`.
     - The hand closer: `#complete_task:match_the_hand`, `hand_matched`.
     - The player's answer: `hax_confession_answer`, `identity_scene_done`, `#complete_task:hear_the_name`.
     - The Albion knot: `#unlock_task:send_the_notice`.
     - Then the tapes line on `alpha_tapes`.
   - **`hour_read`:** `hour_read_started` / `hour_read_done`, with the `schedule_read` choice.
   - **`tesseract_call`:** `tesseract_call_started` on the first line, `tesseract_call_done` on HaX's report.
   - **`afterwards`:** sets `afterwards_heard`.
7. **Hub (19 topics, S4 §7.1).** Gates and retire flags as listed; run the crowded-hub lint. Field guides via `#give_item:lab-workstation:<id>`. Topic 14 sets `maintenance_code_used`. Topic 1 copies `albion_notified` into `debrief_notice_before`, then sets `start_debrief`.
8. **Gaps to settle first:**
   - Nightshade's text-back mapping (M9-20).
   - The "[Show her the page.]" gate (M9-21).
   - "Finish with me first." (M9-15).
   - Closing-card line 4a's wording (M9-16), plus the credits wording in M9-18 and M9-19.
9. **Person NPCs.**
   - **Noor:** `#complete_task:meet_the_clerk` at the top; `#clone_keycard:reading_staff_door` on every branch; `#give_item` of her card when warned in time; `noor_told`.
   - **Old Coyote:** the challenge knot; `old_coyote_told`.
   - **Tran:** the talk needs `cage_bin == "letters"` (with the letters held); `tran_outcome`.
   - **The called guard:** one line, then `#hostile:archive_guard`.
   - **`alpha_recording`:** the `deck` knot routes by `deck_pulled` and `identity_scene_done`, and sets `alpha_clip_played`.
10. **Rules from SE §1 and §9.**
    - Fixed strings only; no printed variables in voiced lines.
    - No local time, no "plant" for WREN, no injury described.
    - No pronoun for WREN before the name.
    - No narrator in the three voiced calls; narrator lines stay in the briefing and the debrief.
    - The briefing has no `#give_item`; the cracker is in the start kit.

## What stage 7 (ink) needs

(pending)

## Counts

26 findings: 0 blockers, 4 majors (M9-01 to M9-04), 22 minors. Stage 6 list: 7 items; stage 7 list: 10 items.
