# m09 "Digital Archaeology": Ink Contract (stage 7a)

## 0. Status, authority and how to use this file

**Stage 9 note:** the body (§1–§11) quotes the strings as shipped after the stage 9 rounds where they changed; §15 records each change and its source. Stage 7a, 2026-10-21. Written for three parallel ink writers (groups A, B and C, §1). The scenario file (`scenario.json.erb`) does not exist yet; stage 9 builds it from stages 4–6 and from this contract.

**Authority, highest first.** Where two disagree on a name, a condition or a fixed string, the higher one wins:

1. This contract, for ink file names, knot names, which file sets which global, and the fixed strings in §2–§4 marked **fixed**.
2. `planning_notes/overall_story_plan/mission_initializations/m09_digital_archaeology/stages/stage_6/lore_fragments.md` ("S6") for every document string, code and name.
3. `stage_4/objectives_tasks.md` ("S4") for tasks, globals, mappings and the forced-scene wiring; `stage_5/room_layout.md` ("S5") for NPC ids, rooms and objects.
4. `stage_3/moral_choices.md` ("MC") §10 for the story globals and their values.
5. `stage_1/story_arc.md` ("SA") for beats; `stage_2/storytelling_elements.md` ("SE") for voices and sample lines. Samples are candidates, not script, unless this contract marks them fixed.
6. `finale/FINALE_ARC.md` ("FA") §3 (imports, exports), §6.1 (forced and voiced calls), §13 stage 7 handover.

**If you need a name that isn't here** (a knot another file or the scenario must reach, a global, an item id), add it to §5 or your file's spec in the same edit as the ink that uses it, and say so in your report. Ink-local `VAR`s and stitches that nothing outside your file reads don't need an entry.

**What writers must not do.** Open VM material (`finale/VM_SHAPE.md`, `FINALE_VM_PLAN.md`, `SECGEN_MODULE_PLAN.md`, SecGen, the field guides). VM flags appear in ink by story meaning only (§8). Edit any file outside your group's list in §1, any other mission, or the stage documents. Commit.

**Line counts** in §1 are rough estimates of the finished `.ink` (VAR blocks, comments and blank lines included), for balancing the groups only.

## 1. Files and writer groups

All ink goes in `scenarios/m09_digital_archaeology/ink/`. Texts that the scenario sends (`sendTimedMessage`, closing card, credits) can't be ink; their writers put the fixed strings in `scenarios/m09_digital_archaeology/texts/` for stage 9 to paste, one file per group so nobody edits another group's file.

**Why the groups differ from the suggested split.** The suggestion (A = HaX's phone + Netherton + briefing + debrief) puts about 1,500 lines in A and about 250 in C. Here A holds every line of HaX's phone (her voice where it matters most: the hub, the identity scene, the calls), B holds the archive's people and the Recruiter, and C holds the two cutscenes with Netherton and the raid team, the other callers, the clip, the scenario texts and the closing card. HaX also speaks in C's cutscenes (the wall, her debrief line), in B's Noor and hatch scenes and in B's Recruiter call. Those lines use SE §4.3's drafts, and the Recruiter call's HaX lines are fixed in §3.1 so B and A write the same strings. Netherton's three identity-scene lines are fixed (§2.1), so A writes no new Netherton.

| # | File | NPC id (host) | Mode | Entry knots (scenario points here) | Group | Est. lines |
|---|---|---|---|---|---|---|
| A1 | `m09_phone_agent0x99.ink` | `agent_0x99` (phone, `currentKnot: "start"`) | phone-chat: hub and texts-as-calls unvoiced; `identity_scene`, `identity_resume`, `tesseract_call`, `deck_resume` voiced | `start` (home), `dock`, `flag1_read`, `ledger_read`, `afterwards`, `deck_resume`, `identity_scene`, `identity_resume`, `hour_read`, `hour_read_resume`, `tesseract_call` | A | 900 |
| A2 | `m09_carryover_vars.ink` | none (INCLUDE only) | – | – | A | 70 |
| A3 | `texts/A_hax_texts.md` | `agent_0x99` texts | scenario strings | – | A | 130 |
| B1 | `m09_phone_recruiter.ink` | `recruiter` (phone, `currentKnot: "start"`, not in `npcIds`) | phone-chat, voiced call | `start` (home stub), `call`, `resume_name` | B | 230 |
| B2 | `m09_noor_haddad.ink` | `noor_haddad` | person-chat | `start` | B | 170 |
| B3 | `m09_sorensen_hatch.ink` | `sorensen_hatch` | person-chat (static sprite at the counter) | `start` | B | 170 |
| B4 | `m09_sorensen_cage.ink` | `sorensen` | person-chat | `start` | B | 90 |
| B5 | `m09_sorensen_door.ink` | `sorensen_door` (hidden) | person-chat opened by mapping | `door`, `handover` (stage 8) | B | 70 |
| B6 | `m09_old_coyote.ink` | `old_coyote` | person-chat; challenge on sight | `start`, `challenge` | B | 90 |
| B7 | `m09_jesse_tran.ink` | `jesse_tran` | person-chat | `start` | B | 100 |
| B8 | `m09_archive_guard.ink` | `archive_guard` (Lyle Dillard) | person-chat opened by his own mapping | `start` | B | 15 |
| B9 | `texts/B_recruiter_texts.md` | `recruiter` text | scenario string | – | B | 5 |
| C1 | `m09_briefing.ink` | `briefing_cutscene` (hidden) | person-chat cutscene (`timedConversation`) | `start` | C | 320 |
| C2 | `m09_closing_debrief.ink` | `closing_debrief` (hidden) | person-chat cutscene opened by mapping | `start` | C | 300 |
| C3 | `m09_phone_nightshade.ink` | `nightshade_phone` | phone-chat, unvoiced | `start` (home stub), `call` | C | 40 |
| C4 | `m09_phone_torres.ink` | `torres_phone` | phone-chat, unvoiced | `start` (home stub), `call` | C | 45 |
| C5 | `m09_phone_gary.ink` | `gary_phone` | phone-chat, unvoiced | `start` (home stub), `call` | C | 30 |
| C6 | `m09_alpha_recording.ink` | `alpha_recording` (hidden) | person-chat opened by mapping; voiced as person-chat | `deck` | C | 45 |
| C7 | `texts/C_texts_and_credits.md` | `nightshade_phone` texts; the closing card and credits | scenario strings | – | C | 70 |

**Totals:** A about 1,100; B about 940; C about 850.

**Speakers that need no file:** `director_netherton`, `quintero`, `kowalczyk`, `malhotra`, `arakawa` and `hax_voice` are hidden, registered speakers in `loading_dock` (S5 §8). They speak only by prefix inside C1, C2, A1 (Netherton in the identity scene) and C6 (`hax_voice`). Give none of them a `storyPath`.

## 2. Group A: HaX's phone

Group A writes A1–A3. HaX speaks **without a prefix** in her own phone ink (lint `phone-self-prefix`); anyone else in her thread is prefixed (`Director Magnus Netherton:`). No `Narrator:` lines anywhere in A1.

### 2.1 `m09_phone_agent0x99.ink` (A1)

Top of file: `INCLUDE m09_carryover_vars.ink`, then a `VAR` for every non-import global this file reads or sets (§5), then the ink-local `VAR`s (§5.4). Never redeclare an import.

**`start`** (home knot, `currentKnot`; unvoiced; prints nothing on the normal path). Guards, in this order, each a single block (lint `choice-fallthrough`):

1. A HaX scene is pending: `(recruiter_gone and not deck_choice_made) or (identity_scene_started and not identity_scene_done) or (hour_read_started and not hour_read_done) or (tesseract_call_started and not tesseract_call_done)` → one line, **fixed**: "Pick up. I'm ringing you." then `#exit_conversation`, `-> DONE`. Closing her thread fires the `conversation_closed:agent_0x99` re-ring (S4 §6).
2. The Recruiter's call is pending (`recruiter_call_started and not recruiter_gone and not deck_choice_made`) → one line A words (her call rings again on the next room exit, not on this close: say "take it when it rings", not "pick up"), `#exit_conversation`, `-> DONE`.
3. `not dock_heard and not flag1_submitted` (ink-local `dock_heard`) → `-> dock`. After flag 1 a first open sets `dock_heard` and goes to the hub (stage 8 m-14).
4. Otherwise `-> support_hub`.

**`dock`** (unvoiced; opened by a new HaX mapping, §6.3 row M1, after the briefing closes; also reached from `start` if the player opens her first). Beat 1.1. Sets `~ dock_heard = true` first. Lines: "That noise is a cross-cut shredder. It's been running since before you landed." (**fixed**, the aim 1 handoff); "Shutter's his round. The office door's quieter." (**fixed**); "Night guard. Twenty-four. Not ours, not theirs. Don't hurt him." (**fixed**); the building's people in at most three short lines (Sorensen, county clerk twenty years; a clerk on tonight; Jesse Tran, the IT contractor) with the Tran warning by m01 branch, three fixed strings: `m01_completed and not m01_maya_ko` "Maya's list has a Tran on it."; `m01_maya_ko` "Maya Chen would have flagged him. We don't have Maya's names."; otherwise "Viral Dynamics' staff files have a Tran in them."; on `raid_team_answer == "quintero"` add "Quintero's going to hate that she was right if this goes badly. Let's not." Break it with one or two player choices (three lines at most before a choice). Ends `#exit_conversation`, `-> DONE`.

**`flag1_read`** (unvoiced; HaX mapping on `flag1_submitted`, `delayMs: 2500`). Beat 1.4. What flag 1 bought, in story terms: the Series R shelf marks (R-114 to R-161, bay 10) are behind the cage mesh in the restricted stacks; "the boxes on Noor's trolleys are the ones on this list". **Fixed:** "The ledger keeps. Her shredder doesn't. Stacks first." and "The catalogue keeps something else live. Their ledger." (aims 2 and 3 handoff) and "Her card's on a reel at her hip. You've done this before." `#give_item:notes:catalogue_salvage_line` on the knot's **first** line (stage 9 walkthrough R1 m-01; was above the last line), and last, "I've sent you the odd one. Salvage cage, their own code." (**fixed**), then "[Got it.]" before the exit (stage 9 final check). Don't claim the stacks door is open (it opens on a separate mapping that can retry); "The stacks door's yours" is fine only after the unlock, so leave it out. Ends `#exit_conversation`, `-> DONE`.

**`ledger_read`** (unvoiced; HaX mapping on `flag2_submitted`, `delayMs: 2500`; room-entry backstop). Beat 2.3. **First line carries `#set_global:ledger_read_heard:true`** (the Recruiter's call keys on it). Content: twenty-three placements, forty-seven candidates, a legacy section older than any list m05 found; WREN's legacy entry, updated day 10 in Sorensen's hand, "assigned TF Null, Montana operation". **Fixed:** "WREN's on our team. One of the four you met at the briefing." on both buttons (script edit R2 A-R2-01, R3 A-R3-03 / I-1: the entry isn't repeated, and the turn is said outright) and "I've told the Director. He'll say nothing to them. Neither will you." m05 (at most one HaX line, by `m05_final_choice`: `public_exposure` the twenty-three marked "blown"; `turn_double_agent` Torres' entry still "live"; `combat_lethal` "closed placement" and HaX says nothing, a short silence line from her; anything else, nothing). On `m07_found_tomb_gamma`: "You bagged the dossier. 'Including the people.' This is the people." (**fixed**). The source code "H&L" and the file number `HL2015-0477` as the last fact. No pronoun for WREN. Ends `#exit_conversation`, `-> DONE`.

**`afterwards`** (unvoiced; HaX mapping on `deck_choice_made`, `delayMs: 2500`; hub topic 7 diverts here). Beat 2.7. `#set_global:afterwards_heard:true` goes on the **last** line (above "The rest when this is over…"), so a player who closes the call early still gets hub topic 7. One loss line, a fixed string per case: the bin that went (by `cage_bin`: `derek_file` lost the letters, or Nightshade's copy on `m08_nightshade_tidied`; `letters` or `nightshade_copy` lost Derek's file) with the tape that went (by `deck_pulled`: `none` both tapes; `her_file` the Alpha tapes; `alpha_tapes` her file). SE's draft form: "Derek's file is gone. So is her list." On `cage_bin == "letters"`: "Arakawa got Villanueva. She wanted to know who'd bother." On `recruiter_secret == "told"`: "Back in October I'd have kept that between us. Not tonight." (stage 8 SC 2) Then, **fixed**, each its own line: "Afterwards. Not during." / "It's yours to carry. Nobody else signed for it." / "The rest when this is over. Her office is past the binders." Ends `#exit_conversation`, `-> DONE`.

**`deck_resume`** (voiced, forced; Recruiter re-ring 3). Guard first: `{deck_choice_made: #exit_conversation -> DONE}` with no line. Then "I've paused the deck. It won't hold long." (**fixed**). Then, on `recruiter_said_yes`, the yes-block; otherwise the no-block (§3.1, the **fixed** strings, unprefixed here). Then the outcome tags and the closing lines, exactly as §3.1. Ends `#exit_conversation`, `-> DONE`. It never diverts to `start`, `support_hub` or `afterwards`.

**`identity_scene`** (voiced, forced; host `agent_0x99`). Beat 3.3 and the start of 3.4. Four stitches:

- `= opening`: tags on the first line: `#set_global:identity_scene_started:true`, `#unlock_task:hear_the_name`. HaX reads the credential's first line and stops before the name (story terms only: a SAFETYNET staff credential, issued before he left, never revoked; quote no VM string, §11 item 2). If `not hand_matched`, the scene opens on the hand line, before the credential (the first-line tags go on whichever line comes first): `#complete_task:match_the_hand` and `#set_global:hand_matched:true` above "You never told me about the writing on Nightshade's file. I put it beside the margins in my old course notebook. Same hand." (**fixed**; script edit R1 A-01, R2 A-R2-07, R3 A-R3-02 / I-6). Netherton, prefixed `Director Magnus Netherton:`, three **fixed** lines: `#set_global:identity_name_said:true` above "I said we would not name him until we could prove it. We can. Dr Adrian Tesseract." (stage 8 SR minor 4); then "He was our chief strategist until seven years ago. He trained half my field officers."; then "HaX." Nothing else from him in the scene.
- `= confession`: at most one recognition line first: on `m07_architect_echo_heard` "You heard him say it in Portland. My line. His line."; else on `m03_directive_decoded` "You've read him before. Sterling's drive." (both **fixed**). Then one of four openings by `m06_architect_identity_found` × `m07_teacher_discussed` (SE §4.3 drafts; about six lines a form before the choice, SE §9). Then, every form, **fixed**: "Two cards on that wall. I had his name the night they died. I don't know if saying it would have saved them. I didn't say it." Netherton says nothing.
- `= answer`: three buttons. `m06_architect_identity_found` false: "[You should have told me.]" (`should_have_told`) / "[I'd have done the same in your place.]" (`same_in_your_place`); true: "[You should have taken it to Netherton.]" / "[I'd have sat on it too.]" (same values). Every form, gated on `afterwards_heard or m07_architect_echo_heard` (script edit R2 A-R2-08: the player must have heard the line to quote it; the other two buttons always show): "[Afterwards. Not during.]" (`afterwards`). Each button: `#set_global:hax_confession_answer:<value>`, `#set_global:identity_scene_done:true`, `#complete_task:hear_the_name`, then her reply (one or two lines, SE drafts; the `reading_told_hax` variant, **fixed**, two lines "He wrote that I'd cover for you." / "Tonight you covered for me." on `same_in_your_place` and `afterwards`, and on `should_have_told` the first line then "I covered for him." (R2 A-R2-03 and its follow-up; R3 A-R3-01 / I-2, so "Yes. I should have." reads as not telling). Then **fixed**: "Seven years, and nobody turned it off. There's more on his box. A memo and a draft. Read them." `-> albion`.
- `= albion`: `#unlock_task:send_the_notice` above the first line. The m04 landing line by `m04_disclosure_choice` (`full`, `partial`, `quiet`, else the plain fact that Critical Mass came through this hole): fixed strings A writes from SA Beat 3.4; `partial` has two, "You told Albion's inquiry half of it. We told the vendor less." with `m04_crew_lost` and "You told the public half of it. We told the vendor less." without (stage 8 SC 6: m04's partial branch has an inquest only when crew died). The controller line, two **fixed** forms (script edit R1 A-04): on `full` "They audited every battery site. The controller's still in water works and substations. Four hundred sites."; otherwise "Albion fixed its own plant. That controller also runs water works and substations. Four hundred sites, still open." The watch and cost line, one **fixed** form (script edit R2 audio cut 1 merged the two): "Our watch sits on that kit. Send it, the vendor starts a fix, and the watch comes down." then, on `m04_disclosure_choice == "full" or m04_crew_lost` only, its own line "And Albion's inquiry gets to ask when we knew." No buttons between them (R1 A-03 cut them). "It isn't my call. It isn't yours either. If you're going to, don't ask me first." (**fixed**). On `deck_pulled == "alpha_tapes"`: "His tapes are on the bench next door. When you want them." (**fixed**). Ends `#exit_conversation`, `-> DONE`. The hub's notice topic has its own lines and never diverts here.

**`identity_resume`** (voiced, forced). `{identity_scene_done: #exit_conversation -> DONE}`. `{not identity_name_said: -> identity_scene.opening}`. Otherwise one line A settles (draft "Still here. Netherton too."), then `-> identity_scene.answer`.

**`hour_read`** (text, forced; not voiced). Beat 3.5. Stitches `= body` and `= realisation`.
- `body`: first line tags `#set_global:hour_read_started:true`, `#unlock_task:hear_the_mirror_job`. The two modes: **fixed** "He's giving it away. At oh-six-hundred it starts going out, city by city." / "There's a key on here that sends it everywhere in the same minute." then "Then why build the key?" (script edit R2 A-R2-04; two lines for the 25-word cap) Then, once, **fixed**: "He'll call it full disclosure. Full disclosure is one researcher publishing one flaw after the vendor stops answering. His notice was the coordinated kind: vendor first, time to fix it. This is every weapon we hold, handed out at once." The head start (the cells get it at 04:00, two hours early). The defences: a list built from entries in the stolen database, said in story terms with no VM detail. The casualty sheet: **fixed** "One thousand one hundred to two thousand six hundred. The first month. He's signed it." and on `m06_minder_walked` "Kemal Aydin walked out on a smaller number than this." UTC only.
- `realisation`: on `schedule_read`, `#set_global:hour_read_choice_reached:true` above the line before the choice, then "[Her schedule. This room isn't on it.]" → "No. It isn't. He shredded everyone but himself." / "[Read me the defences.]" → a line A writes. Without `schedule_read`: "Nobody's wiping this box. Not her, not him." (all **fixed** but the second reply). Last line carries `#set_global:hour_read_done:true`; `#exit_conversation`, `-> DONE`.

**`hour_read_resume`** (text, forced). `{hour_read_done: #exit_conversation -> DONE}`; on `hour_read_choice_reached`, one line A writes then the choice in `hour_read.realisation` (put the choice after the line that sets the flag, so the divert lands on it); otherwise `-> hour_read.body`.

**`tesseract_call`** (voiced, forced; restarts from the top). Beat 3.6. First line tag `#set_global:tesseract_call_started:true`. Her aside first (draft "He kept his voice down. He always did."; A settles; it replaces narration, which isn't voiced). Her side: "...Yes." / "I know it's you." / "Nobody's called me that since the course. It's HaX. It has been for seven years." / "...I'll bring them." (the last two **fixed**; inline `*beat*` cues allowed, one or two). The report, four sentences, **fixed**: "He called me Ninety-nine. He says the door will open for you by name. He says take your time getting there." then `#set_global:tesseract_call_done:true` above "And he asked if we'd liked his notes." Then "Netherton's on the ground at Helena. Tell me when you're ready to come in." (**fixed**). `#exit_conversation`, `-> DONE`.

**`support_hub`** (unvoiced). Topics in this ink order (S4 §7.1, newest first). Gates and retirements are S4's; `*_given` flags are ink-local (§5.4). Every topic returns `-> support_hub` unless it says otherwise. The sticky exit is last: "[That's all for now.]" with a one-line reply, `#exit_conversation`, `-> DONE` (so a reopen restarts at `start` and its guards run).

| # | Choice | Gate | Retires on | Does |
|---|---|---|---|---|
| 1 | "[Bring me in.]" | `tesseract_call_done and not report_done` | `report_done` | Before the line, one line on anything still open, in this order: notice unsent ("The notice is still on his box. Netherton will ask.", **fixed**), the H&L boxes unread (`not sleeper_named and not sleeper_shortlist`), Tran (`tran_outcome == "left"`). Then `{not start_debrief: ~ debrief_notice_before = albion_notified}` (copied once, never again), then `#set_global:start_debrief:true` (a tag: it must emit even when already true, so a reload can reopen the debrief), a short reply, `#exit_conversation`, `-> DONE` |
| 2 | "[His notice.]" ("Still on his box. Say the word."), whose answer (choices-only knot `notice_ask`) offers "[Send it.]" / "[Not yet.]" (stage 8 M-01: one hub row) | `identity_scene_done and not albion_notified` | `albion_notified` | Send: `#set_global:albion_notified:true`, then **fixed**: "Gone." / "Vendor's acknowledged. They're saying ninety days for a fix. Getting it onto four hundred sites will take a year." / "Analysis is pulling the watch. It's dark by morning." Not yet: one line |
| 3 | "[About the name.]" | `identity_scene_done and not name_topic_given` | given | SE §4.4, once, short |
| 3b | "[His annotation sheets, with the tapes.]" | `alpha_annotations_read and not alpha_topic_given` | given | "That's the version he taught us." (**fixed**). Gated on the decode itself, not the clip (script edit R1 A-05) |
| 4 | "[I'm on his box. Where do I look?]" | `salvage_opened and not flag4_submitted` | `flag4_submitted` | one story-level steer before flag 3, one between 3 and 4 (§11 item 1) |
| 5 | "[The keypad on the cage.]" | `salvage_keypad_seen and not salvage_opened` | `salvage_opened` | First ask (S6 §2.3, **fixed**, each its own line): "Catalogue line from flag one." / "SALVAGE CAGE ACCESS" / "MSJMQAEGDZNVI" / "Just the code, not the label. The key is the salvage bay's word, on the chart in the tape room, by the keypad. If the cipher's new to you, ask me for the archive-code field guide." On `gary_called` the last sentence becomes "Gary told you how." Asked again (visit count): "Vigenère Decode, on your workstation. Key: the salvage bay's word. Capitals in, capitals out." |
| 6 | "[The tape room.]" | `deck_choice_made and not tape_room_entered` | `tape_room_entered` | "Her card for the tape room will be in the safe." (**fixed**) |
| 7 | "[Afterwards.]" | `deck_choice_made and not afterwards_heard` | `afterwards_heard` | `-> afterwards` |
| 8 | "[The Reading.]" | `reading_found and not reading_told_hax_asked` | asked | "Do you want to tell me what it says?" then "[All of it.]" (`#set_global:reading_told_hax:true`; her short reply) / "[It's about me. It can stay that way.]" (a line). Sets the local |
| 9 | "[WREN.]" | `ledger_read_heard and not sleeper_named and not sleeper_shortlist and not deck_choice_made` | either, or `deck_choice_made` (stage 8 M-01; topic 1 and the debrief carry the unread boxes) | "H&L's boxes are in the open stacks. You've got the number." (**fixed**); on `m05_torres_turned`, one more line (Torres is still inside and may help) |
| 10 | "[Nightshade's file.]", whose answer offers "[Send Nightshade his file.]" / "[Hold it.]"; after Hold, "[Send Nightshade his file.]" alone in the hub | first: `m08_nightshade_triple_agent and nightshade_file_held and not nightshade_file_decided`; after Hold: `nightshade_file_decided and not nightshade_shown_file and not start_debrief` | `nightshade_shown_file` or `start_debrief` | First ask: **fixed** "He doesn't know this exists. Send it, and he stops being theirs. He stops being much use to us after, too." / "Keep it, and he stays useful. He never finds out what his teacher wrote about him." Send: `#set_global:nightshade_shown_file:true`. Either answer sets the local `nightshade_file_decided` |
| 11 | "[The hand on his file.]" | `nightshade_file_held and not hand_matched` | `hand_matched` | `not notebook_read`: "Read the notebook scan in my case file first. Then look again." Otherwise three answers: "[Same hand.]" → `#complete_task:match_the_hand`, `#set_global:hand_matched:true`, "Those are my notes. That's his pen." / "Hold that. I want it from two directions before anyone says a word."; on `bin_chosen and cage_bin == "derek_file"` add "Two samples. One pen." / "[Different hands.]" → "Look at the loop on the g. Then look again." / "[I can't tell.]" → "Put the scan beside it. Same pen pressure, same crossed sevens." (all **fixed**) |
| 12 | "[The ledger. Where is it?]" | `flag1_submitted and not flag2_submitted` | `flag2_submitted` | one story-level steer (§11 item 1) |
| 13 | "[The box behind her.]" | `cage_opened and not legacy_clock_run and not legacy_files_saved and not legacy_topic_given and not nightshade_file_held` | the clock, the save, his file held (stage 8) or given | what the legacy box is and when it goes (MC §4.3), once |
| 14 | "[Can Victoria's people get me through that gate?]" (R2 A-R2-09) | `m03_victoria_fate == "recruited" and stacks_entered and not cage_opened` | `cage_opened` | `#set_global:maintenance_code_used:true` above "Victoria's people read their mail. There's a maintenance code for that gate." then "The cabinet in there takes her print. It's on the stamp on her shelf." (**fixed**). No `_given` flag: if the unlock fails the topic comes back |
| 15 | "[The restricted series.]" | `flag1_submitted and not series_topic_given and not cage_opened` | given or `cage_opened` (stage 8 M-01) | the shelf marks; Sorensen behind the mesh; "The gate takes her card, the cabinet takes a print." (**fixed**) |
| 16 | "[The catalogue. What am I looking for?]" | `not flag1_submitted` | `flag1_submitted` | "The catalogue's the index. Find the part that isn't public." (**fixed**) |
| 17 | "[Tran.]" | `not tran_topic_given and not cage_opened` | given or `cage_opened` | the m01 warning as in `dock`, then "He's wiping tapes from the server closet off the open stacks. You'd need something he wants to talk him off it. Otherwise it's a fight." (**fixed**) |
| 18 | "[I need a field guide.]" | any `<x>_guide_offered and not <x>_guide_hint_given` | all given | `-> guides_menu` |
| 19 | "[Where do I stand?]" | always (sticky) | never | §2.1 status ladder |

Ten-choice cap: stage 8 M-01 found 14 at once in Act 3. With the four retirements above, an inkjs walk at m09-R §4.4's states shows 8 just after the deck, 10 just after the identity scene and 10 after Tesseract's call with every optional thread open (exit included). Topics use `+` with `not …` guards, never `*` (a `*` retires on the visit where it was the last one standing).

**`guides_menu`** (choices only, phone resting knot). One choice per guide, gated `<x>_guide_offered and not <x>_guide_hint_given`: `#give_item:lab-workstation:<id>` and `#set_global:<x>_guide_hint_given:true` above a one-line handover. Ids: `m09_catalogue_field_guide` (x = `catalogue`), `m09_ledger_field_guide` (`ledger`), `m09_tomb_beta_field_guide` (`tomb_beta`), `m09_archive_code_guide` (`archive_code`). A sticky "[Never mind.]" back to the hub.

**The status ladder** ("[Where do I stand?]"), most advanced first, one fixed line per row, each naming the next step: `tesseract_call_done` (come in when ready) · `hour_read_done` · `identity_scene_done and flag4_submitted` (she's reading it; stage 8) · `identity_scene_done` (flag 4) · `flag3_submitted and not nightshade_file_held` (the file, from the plan cabinet; stage 8 m-02) · `flag3_submitted` (she's ringing; stage 8) · `salvage_opened` (flag 3, and his file if not held) · `tape_room_entered` (the keypad) · `deck_choice_made` (the office, the safe, the card) · `flag2_submitted and cage_opened` (she'll ring when you're out of the cage) · `flag2_submitted` (the hatch and the gate) · `cage_opened and nightshade_file_held` (the ledger flag; stage 8) · `cage_opened` (the cabinet, and where the print is: "It's on her stamp, on the hatch shelf.", stage 8 m-02; the ledger flag) · `stacks_entered` (the hatch) · `flag1_submitted` (the stacks) · `not flag1_submitted` (the laptop, the catalogue) · otherwise (get inside). Status answers that go stale halfway are a known pass-4 bug: test every row. The `recruiter_call_started` row was cut at script edit R1 (A-15), because `start`'s guards exit before the hub while her call is pending (stage 8 m-10 records it).

### 2.2 `m09_carryover_vars.ink` (A2)

A comment header ("imports: read-only, never assigned; FA §3.1") and one `VAR` per import, with the default from §5.2. Nothing else: no knots, no `~`. Every file in §1 that reads an import starts with `INCLUDE m09_carryover_vars.ink` and declares no import itself (a second declaration is a compile error). Checked: inklecate compiles an INCLUDE from the same folder, and the validator follows INCLUDEs when it checks setters and readers (`scripts/validate_scenario.rb:3906-3920`).

### 2.3 `texts/A_hax_texts.md` (A3)

Every HaX line the scenario sends as a text (unvoiced, `sendTimedMessage`, no prefix). One row per text: the string, the event and condition stage 9 should use (`&&` only), and any spacing note (texts from one event 4–6 s apart). **Fixed** ones are copied as written; A writes the rest.

| Text | Trigger (for stage 9) |
|---|---|
| "That reader's on the catalogue server. Get me in there and I'll open it." | `door_unlock_failed`, `data.connectedRoom === 'restricted_stacks'`, once |
| "Her keypad's off the card system. Leave it for now." | `door_unlock_failed`, `sorensen_office`, once |
| "That reader wants a real card. Hers will be somewhere she trusts." | `door_unlock_failed`, `tape_room`, once |
| "Tran's just sent the guard to your door." | `flag1_submitted && m01_maya_ko && !old_coyote_told && !old_coyote_ko`, after `flag1_read` closes (stage 8 m-01; the guard's override takes the same guards and a relay on `room_entered:open_stacks`) |
| "That cabinet takes a print. She stamps everything." | `room_entered:restricted_cage`, once, `delayMs: 2000` |
| "That box behind her is the last of the night. The legacy files." then, 5 s later, "She gets to it when you pass her for the cabinet, or leave the cage. She won't stop for asking." (two texts, R1 A-18) / "The legacy files are under Noor's desk. Let her shred the rest." | `cage_opened`, split on `m05_found_pipeline_list && !m05_recruiter_deal_accepted` |
| "Hold his file next to the notebook scan in my case file. Then tell me what you see." | `nightshade_file_held` with `!flag3_submitted`, once |
| "She's still feeding it." | `room_entered` with `flag2_submitted && !hatch_talked`, once |
| "She's sixty-six." then, if `legacy_clock_run`, "She's done with that box." | `npc_ko:sorensen`, once each, spaced |
| "Her cracker. Use it anyway." | first `room_entered:sorensen_office` with `sleeper_named`, once (before the safe) |
| "Safe's open. Kowalczyk will want to hear about her toy." (R2 A-R2-06: holds whether the PIN or the cracker opened it) | the safe's unlock with `!sleeper_named`, once |
| "Sale. WREN. To Agent 0x00. Consideration, one deck. Booked." then "She's booked you. You're in her ledger now." | `office_entered` on `taken` / `double_crossed`, `delayMs: 20000` (S4 §6.6) |
| "Bring me his file. Then we say it." | `flag3_submitted` with `!nightshade_file_held` |
| "His file first. Then the rest of his box." | `flag4_submitted` with `!identity_scene_started && !nightshade_file_held` |
| the owner-first text (A writes; the file is held, flag 3 isn't in) | `flag4_submitted` with `!identity_scene_started && nightshade_file_held && !flag3_submitted` |
| four field-guide offers (A writes; no raid team, no WREN, no VM detail) | S4 §7.2's exposure events |
| Document remarks, S6 §1 "HaX (ink)": the lease (three, **fixed**: "There it is. Tomb Gamma has an address." on `!m08_tomb_gamma_location_known` (cold starts included, R1 ruling 5); "Same site Nightshade gave us. Now it has a lease." only on `m08_tomb_gamma_location_known`; "Big Sky was in Zero Day's sales ledger. Sterling's keys opened it after Cardiff." (stage 8 BP F-05) on `m03_victoria_fate` `arrested`, and again on `ko`); the rent ledger ("Irina's tip-off led us to this. Tell her it bought us the deed.", `m06_irina_recruited`; stage 8 BP F-10); the Reeves handler sheet on the printed ledger ("Reeves' handler, from the hospital. Told to stand down the day we took Reeves.", on the new `reeves_sheet_read` with `m02_reeves_fate` in custody; stage 8 ruling 14, FA row 21); the build-out ledger ("St. Catherine's money. It bought the blast door.", `m02_paid_ransom`); Danny's note (one line per `m03_danny_fate` value S6 §1.7 lists; none on a KO); the legacy box ("Nobody of ours in here. Ours are on her tape, by codename."); Derek's file ("There's your why. He was told to." on `surrender`; "He wanted your headlines." on `expose`; A decides whether other values get a line); the H&L record ("After Quantum Dynamics we checked everyone TalentStack ever touched. Harwick & Lowe shut before TalentStack opened." and, on `raid_team_answer === 'quintero'`, "You took her side at the briefing. Keep it. Don't take her word."); the case file ("Your tags, from HashChain. Someone's paying rent on a building in Montana that isn't this one.", `m06_monitoring_enabled`) | each on its document's read or pickup; the read globals are §5.5's proposals |

A document line quoted in a text keeps its first word first (S6 C-23).

## 3. Group B: the archive's people and the Recruiter

Group B writes B1–B9. Person-chat files prefix every line (`Margaret Sorensen:`, `Agent HaX:` for HaX in the player's ear, `Narrator:` sparingly). The Recruiter's lines in B1 take **no** prefix (her own thread); HaX's take `Agent HaX:`.

### 3.1 `m09_phone_recruiter.ink` (B1), voiced

`INCLUDE m09_carryover_vars.ink`. Beat 2.4, MC §3.2–3.3. Every cost is said aloud before the answer. No pronoun for WREN before the name: the Architect is "your Architect", WREN is "my placement" and "them". No narrator line anywhere in `call` or `resume_name`.

**`start`** (home stub; not voiced; never reached by the call). No line on entry, one sticky choice: "[Hello?]" → `Narrator: The number rings out.` → `#exit_conversation` → `-> DONE`. It shows only if the player opens her thread after the call.

**`call`** (voiced start knot; ring mappings (a)–(c) and re-ring 1, `resume: true`).

1. **Defaults**, before any line, guarded `{not recruiter_call_started: …}` so a restart from the top can't re-default an answer: `~ recruiter_call_started = true`, `~ recruiter_offer = "refused"`, `~ deck_pulled = "alpha_tapes"`, and `~ recruiter_secret = "kept"` on sold-and-lied or `"confessed"` on sold-and-confessed (else leave `""`). These are synced globals, so `~` writes them and emits the change at once (`npc-conversation-state.js:556-596`). Then `#unlock_task:answer_the_offer` as a tag on its own line directly above the opening's first spoken line.
2. **Openings**, one block with `- else:` arms:
   - sold-and-lied (`m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed`), **fixed**: "Forty-seven names, and nothing points at you. Does your handler know? I have one more name for you. Keep this one too." (R1 B-01) Then the spring choice, skipped if `recruiter_secret == "told" or recruiter_secret == "denied"`: "[She's right. I let her courier have the list in October.]" (stage 8 SC 2) → `#set_global:recruiter_secret:told`, `Agent HaX: Noted. Later.` → spine / "[She's fishing. I never dealt with her.]" → `#set_global:recruiter_secret:denied`, "Of course. Shall we do business anyway?" → spine / "[Hang up.]" → `#set_global:recruiter_gone:true` → the hang-up block (her half ends; `kept` stands).
   - sold-and-confessed: her sold line first, the same **fixed** string as sold-and-lied ("Forty-seven names, and nothing points at you. Does your handler know? I have one more name for you. Keep this one too.", one clip), then `Agent HaX: We've talked about that. She has nothing on you.` (**fixed**), then straight to the spine (script edit R2 B-R2-01: HaX no longer answers a line nobody said).
   - `m05_completed` (no deal): "Last time I said the next one would cost me more. This is the next one." (**fixed**).
   - otherwise (cold start), one line (R1 B-15, B-02): "Agent 0x00, with a card cloner, a safe cracker and a handler listening. You're standing in my filing system. I thought I'd call."
3. **Spine**: the grievance, one line (**fixed**, R1 B-13): "Margaret's shredding eleven years of my placements tonight, for his schedule. I'd like something back on the books." (the tasking now sits in the offer); the offer, **fixed**: "One of your four is mine. Was mine, until your Architect took them for Montana. The name tonight. You let my tape deck wipe." (R1 B-01, R2 B-R2-06, R3 I-3, trimmed to the 25-word phone cap) / "Say no and I wipe it myself. Same deck, no name."; the double-cross price, **fixed**: "I can't see which tape you pull, only that you pulled one. Take the name and pull anything, and I call my placement." (R1 B-01; the "half my people" cost is still said before the button, by HaX's yes-block); HaX on the deck, **fixed**: two lines (R1 B-01; the first is the hang-up block's string, one clip): `Agent HaX: Her file is her network, all of it. The Alpha tapes are him teaching, recorded.` / `Agent HaX: He teaches what he'll do. If he built the bunker the way he taught it, it's on there.` (B adds one HaX line before them on what her file holds, only on `public_exposure` (her handlers and the forty-seven) and `turn_double_agent` (the names Torres couldn't give); the default arm is cut, R1 B-03, A agreed); `Agent HaX: I can beat that wipe.` / "Nobody has." / `Agent HaX: Buy from her and we go in an ENTROPY ledger, next to his orders. He'll read the sale, and he'll quote it at you.` (R1 B-01) (all **fixed**). Break the spine with one or two player beats if it runs past four lines from one speaker.
4. **The answer**: "[Give me the name. Let the deck go.]" → `#set_global:recruiter_said_yes:true`, `#set_global:recruiter_offer:taken`, `#set_global:deck_pulled:none`; then `#set_global:sleeper_named:true` and `#set_global:recruiter_gone:true` above her naming lines, two, **fixed** (R1 B-01, B-02: US "check"): "Sensible. Halina Kowalczyk. Her mother's care home has had my check for eleven years." / "She gave you something at the briefing, I expect. She's generous. It's how we hired her."; on `raid_team_answer == "kowalczyk"`: `Agent HaX: You thanked her at the briefing. Keep doing it.` (**fixed**); then the yes-block. / "[No. Keep your name.]" → `#set_global:recruiter_gone:true` above "Then I'll tidy my own desk. *beat* Gone. Goodnight, agent." (**fixed**, one inline cue); then the no-block.

**The three HaX blocks** (**fixed**; identical text in A1's `deck_resume`, unprefixed there, so each line is one audio clip):

- **Yes-block**: "She's watching the deck. Pull her file and we get half her people. She warns the rest, and Kowalczyk runs." then "[Leave it. Let it wipe.]" (outcome `taken` / `none`, no further line) / "[Pull her file anyway.]" (outcome `double_crossed` / `her_file`, then "First name on it is a handler in Baltimore.").
- **No-block**: "She only watched the counter. I can pull one before it wipes. Which?" then "[Her file.]" (outcome `named` / `her_file`, then "First name on it is a handler in Baltimore." and "One of four. Two, if that firm's boxes say so.") / "[The Alpha tapes.]" (outcome `refused` / `alpha_tapes`, no further line).
- **Hang-up block** (B1 only): "She's started the wipe on her tape deck. She thinks you've gone." (R2 audio cut 3 dropped "Her counter's running."; R3 B-R3-02 / I-4 names the deck, since a hang-up from the spring choice comes before it is mentioned) / "Her file is her network, all of it. The Alpha tapes are him teaching, recorded." / "One of them. Now." then the no-block's two choices and outcomes.

**Every outcome**, in this order: `#set_global:recruiter_offer:<v>` and `#set_global:deck_pulled:<v>` (the legal pair, written even where it equals the default), the outcome's line if any, then `#set_global:deck_choice_made:true` and `#complete_task:answer_the_offer` above **fixed** "She fired it from Sorensen's office. I'm on the door." then "Her card for the tape room will be in that office.", then `#exit_conversation`, `-> DONE`. There is no "pull nothing" button.

**`resume_name`** (voiced start knot; re-ring 2, no `resume`). `{deck_choice_made: #exit_conversation -> DONE}`. `{not sleeper_named:` `#set_global:sleeper_named:true` and `#set_global:recruiter_gone:true` above "You hung up on the part you paid for. Halina Kowalczyk." (**fixed**) `}`. Then the thanked line on `raid_team_answer == "kowalczyk"`, the yes-block and its outcomes, as in `call`.

Neither voiced knot diverts to `start`.

### 3.2 `m09_noor_haddad.ink` (B2)

`INCLUDE m09_carryover_vars.ink`. Beat 1.2, MC §4.2. US English.

- **`start`**: `#complete_task:meet_the_clerk` on its own line above her first line (PASS2 lesson 44). Three forms, one block: warned in time (`m05_found_pipeline_list and not m05_recruiter_deal_accepted`: she knows what the player is; the warning, **fixed** "Peg's been in the cage since before I got here. She never feeds the shredder herself, and tonight she's sent me home twice."; the card handed over with `#give_item:keycard:noor_staff_card` above her line; "I didn't send the last one. It's under the desk." **fixed**); warned late (`m05_found_pipeline_list and m05_recruiter_deal_accepted and m05_recruiter_deal_confessed`: the warning, then "I don't know you. I'm not losing this job for a phone call." **fixed**; no card); otherwise a wary bystander (the player picks a cover: contractor, the auditor, or SAFETYNET). Then `-> hub`.
- **`hub`**: a re-entry line (lint `blank-reentry`). Sticky, on every branch: a clone choice that reads as standing close while she checks her list, `#clone_keycard:reading_staff_door` above her reply (the cloner's first use; the card has a `rfidCard` on her record). The first time the tell choice can show (`noor_asked_peg or ledger_page_seen`, R3 B-R3-01), HaX's cost line now comes in `reach`, after the tell (stage 9 playtest R1 B-m6): `Agent HaX: She's a witness now. She goes tonight, and she doesn't ring her dad for a while.` The clone choice reads "[Lean in over her list, close to the card on her belt.]": Noor answers, then the clone runs on a narrator beat (B-M2). "[That bonus wasn't for filing. She was sizing you up.]", shown only once `noor_asked_peg` (she has said "She knew my name before I said it. Gave me a five-hundred-dollar filing bonus my first week.", **fixed**, R2 B-R2-02), or "[Read this. It's her ledger. You're on it.]" when `ledger_page_seen` (R1 B-07) (the same beat with proof). Told: "My dad's on dialysis in Dearborn. I never told her that. How did she know that?"; shown: "Was I going to say yes? Don't answer. I know I was." (both **fixed**). She reaches for her phone (`Narrator:` line); `Agent HaX: Don't let her ring from here.` (**fixed**); "[Not tonight. Not from here.]" → `#set_global:noor_told:true` above her reply → `#exit_conversation` → `-> hub`. (Her own mapping hides her on `noor_told`.) A sticky exit with a reply.
- Her job is not the cost and nothing rides on it (MC §4.2). Don't let a line imply otherwise.

### 3.3 Sorensen's three records (B3–B5)

US English, unhurried, exact; "dear" once a scene, at her most dangerous. An arrest doesn't stop her, and SAFETYNET has no arrest powers (PASS2 lesson 39): the player says "detain", "you're done", "put the stamp down", never "under arrest". She never says WREN's name: "I keep records. I don't read them aloud." (**fixed**).

**`m09_sorensen_hatch.ink`** (B3; `sorensen_hatch`, static sprite behind the counter). Beat 2.1 steps 1–5.
- **`start`**: `#set_global:hatch_talked:true` above her first line, **fixed**: "The lease-holder's auditor. Of course. There's a chair on your side." A cover choice. HaX names the bins (prefixed, **fixed**): "Bin by the hatch is Derek Lawson's file, and it isn't Derek's handwriting on it. It's the only place anyone wrote down why he did what he did." then, by `m08_nightshade_tidied`, "The other's what Nightshade cleared from his locker. His own words on what he took. One of them's ash in a minute." or "The other's the Social Fabric letters. Last one's about a union rep in Butte they're about to bury. One of them's ash in a minute." The recognition (§9.2 item B-1; on `arrest` it reads "Viral Dynamics. You handed Mr. Lawson to the police, and he kept his promise and said nothing. He was always good about promises.", R1 B-05, as SE §3's table should), then **fixed** "You're not from the lease-holder. You're the one he writes about." and `Agent HaX: ...She's got a file on you.` Then `-> hub`.
- **`hub`**: re-entry line. While `not bin_chosen`: "[Pull Derek's file through.]" and "[Pull the letters through.]" (or "[Pull Nightshade's copy through.]" on `m08_nightshade_tidied`). Each: `#give_item:notes:<id>` (`derek_file` / `letters` / `nightshade_copy`), `#set_global:cage_bin:<id>`, `#set_global:bin_chosen:true` above her line as she passes it and tips the other. After the letters: `Agent HaX: Arakawa's ringing Butte. She'll hear it from us first.` and, on `m01_maya_ko`, `Agent HaX: That's the warning we didn't have.`; after Nightshade's copy: `Agent HaX: So that's what he had time to clear.` (all **fixed**). Sticky on every visit, before and after the bin: "[Lean on the counter, close to her card reel. Ask what's in tonight's run.]" (R1 B-07; stage 9 playtest R1 B-M2: her reply first, then the clone on a narrator beat; retired on `stacks_card_cloned`); once the player has cloned or is plainly lifting: "Take the print if you like. By the time it matters, the shredder will have caught up." (**fixed**). On `ledger_read_heard`: a WREN question → the **fixed** refusal. A sticky exit with a reply. Her mapping hides her on `cage_opened`, so nothing here runs after the gate.

**`m09_sorensen_cage.ink`** (B4; `sorensen`, at the shredder's feed). Beat 2.1 step 6, MC §4.3.
- **`start`**: she keeps feeding. Lines from SE §3 (**fixed** where quoted there): "It's only paper. The people are where they've always been, at their desks, doing what they were placed to do." (R1 ruling 2: "dear" once, at "When I've finished, dear.") / "Paper was the only thing that could ever have hurt them. So the paper goes." / the Torres costing line. Then `-> hub`.
- **`hub`**: re-entry line that tracks `sorensen_fate`. "[It's over. Put the stamp down.]" → "When I've finished, dear. You'll want the list to be complete." (**fixed**; she doesn't look up). Shown only on `nightshade_file_held and sorensen_fate == "left"`: "[Your Architect kept his own papers off your list. Only yours burn.]" (R1 B-12) → `#set_global:sorensen_fate:talked` above "Then I'll keep what's left. Give me a pencil. I'll write down what I've destroyed, accurately." (**fixed**; SE: stage 7 adds no speech to her after this), then `Narrator: She takes her hand off the feed. The shredder runs on, empty.` (stage 8 ruling 2: the room's ambient shredder keeps sounding, so no line says the building goes quiet). The WREN refusal on `ledger_read_heard`. A sticky exit with a reply. No fight button: a knock-out is the player's own blow, and HaX's `npc_ko:sorensen` mapping sets the fate.

**`m09_sorensen_door.ink`** (B5; `sorensen_door`, hidden; Victoria's route). Knot **`door`**, opened by her `room_entered:restricted_cage` mapping (`cage_opened && !hatch_talked && !bin_chosen`, `onceOnly`). The recognition (the same strings as B3), then, in place of B3's lease-holder line (nobody claimed the lease-holder on this route), **fixed** "You came in by the maintenance code, not my hatch. You're the one he writes about." (R2 B-R2-05), HaX's two bin lines (B3's strings, except that the first opens "One bin is Derek Lawson's file…" in place of "Bin by the hatch is…", because the player never saw the hatch on this route; R2 follow-up), then "[Take Derek's file.]" / "[Take the letters.]" (or "[Take Nightshade's copy.]") with the same three tags and `#give_item` as B3, and "[Walk past her.]", which (stage 8 ruling 1) hands over the default: the three Derek tags and `#give_item:notes:derek_file` above "As you like. Take Mr. Lawson's file on your way. It's nearest. The other one's going in." HaX's after-lines as in B3. Ends `#exit_conversation`, `-> DONE`. It sets no `hatch_talked`.

Knot **`handover`** (stage 8 ruling 1, m09-R M-02 option a), the hatch route's default: opened by a second `sorensen_door` mapping on `room_entered:restricted_cage` with `cage_opened && hatch_talked && !bin_chosen`, `onceOnly`. The three Derek tags and `#give_item:notes:derek_file` above one line, "You never chose, so take Mr. Lawson's file. It was nearest. The other one's already gone.", then `#exit_conversation`, `-> DONE`. No choice. The default file now reaches the notepad on every route, so the credits' "Saved from the bins: Derek Lawson's file.", the Reading's margin bet and m10's record answer all quote a page the player holds.

### 3.4 `m09_old_coyote.ink` (B6)

`old_coyote`. Beat 1.1, SE §3, MC §4.5. US English; Crow, 24, dry, a little bored, sharp when treated as furniture; not a mystic or a stoic.
- **`challenge`** (his `player_spotted` mapping, `cooldown: 0`): a first challenge, and a shorter one on later sightings (ink-local count). The player talks past (a cover line or two), or the truth button, two forms (R2 B-R2-03: deny the audit only after claiming it): on `coyote_cover == "auditor"`, "[I'm not an auditor. You don't want to see tonight.]" (R1 B-07) → `#set_global:old_coyote_told:true` above **fixed** "Figured. Auditors bring coffee. I'll be in the truck." (R1 B-06); on `coyote_cover == "contractor"` "[I'm not here for the shredder. Go and sit in your truck.]", and with no cover "[You don't want to be a witness tonight. Go and sit in your truck.]" (R3 B-R3-03 / I-8), each → the same tag above **fixed** "Figured. I'll be in the truck." Either → `#exit_conversation` (his mapping hides him). Ends `#exit_conversation`, `-> hub`.
- **`start`** → `hub` for a player who walks up to him: the same choices (both truth forms, by the same condition), the lineman's course ("Lineman's course. Climbing poles in a blizzard. Poles don't make that noise all night.", **fixed**), "I'm paid to walk the fence. Nobody pays me to look in the cage." (**fixed**). A sticky exit with a reply.

### 3.5 `m09_jesse_tran.ink` (B7)

`jesse_tran`, server closet. Beat 2.6, MC §4.4. US English; fast, ironic, very online; talks to the player as a tourist until the letters.
- **`start`**: "Paper. You people break into buildings at night for paper." (**fixed**); on `tran_alerted`, a line that he's already called someone. Then `-> hub`.
- **`hub`**: "Derek wrote things down. Look how that went. I don't write things down." (**fixed**, holds on every m01 value). On `cage_bin == "letters" and tran_outcome == "left"`: "[You can explain these to Social Fabric, or to me.]" → "Fine. It's off. I walk out that door, and I make a phone call on the way." (**fixed**, his price before the player agrees) → "[Go.]" → `#set_global:tran_outcome:talked` above his last line → `#exit_conversation` → `-> hub` / "[No deal.]" → back. If he names his handler, it is "D. Varga" (S6 §6.3; "the Bozeman number" in the letters). A sticky exit with a reply. No fight button.

### 3.6 `m09_archive_guard.ink` (B8)

`archive_guard`, Lyle Dillard. Knot **`start`**, opened by his own mapping: **fixed** "Dillard, Statewide Security. Stay where you are." then `#hostile:archive_guard`, `#exit_conversation`, `-> DONE`. Nothing else.

### 3.7 `texts/B_recruiter_texts.md` (B9)

One text, **fixed**: "You took the name and something off my deck. I said I'd know. Your team's plane is still in the air." (R2 B-R2-04: the call no longer promises anything about a plane) (Recruiter, `room_entered:tape_room` with `recruiter_offer === 'double_crossed'`, `onceOnly`).

## 4. Group C: the cutscenes, the other callers, the clip, the texts

Group C writes C1–C7. The two cutscenes are the only m09 files with a run of `Narrator:` lines (FA §13 item 9-10). Up to five lines from one speaker before a choice in a cutscene (07 prompt), three elsewhere.

### 4.1 `m09_briefing.ink` (C1)

`briefing_cutscene`, hidden in `loading_dock`, opened by its `timedConversation` (`waitForEvent: "game_loaded"`, `skipIfGlobal` and `setGlobalOnStart: "briefing_played"`; the scenario sets the global, the ink doesn't). `INCLUDE m09_carryover_vars.ink`. SA §3 and §10, SE §2–3. About four minutes: a spine of about twelve lines before the wall.

Knot **`start`**, then stitches or knots C names. Beats in order (SA §3.1):

1. Cold open, `Narrator:` (Task Force Null's room; the photographed order "Burn Helena before the Publication. Schedule attached. -- A."; four officers in kit; the leave ran one day of three). On `m08_netherton_ko or m08_netherton_hostile`: "Netherton takes the chair furthest from yours. Nobody mentions why." (one narrator line).
2. Netherton on the order, **fixed**: "Last night a courier in Helena, Montana, carried this to a records archive. We read it. Then we let it go on. If it hadn't arrived, he would know." Then how it was caught, the first that applies: `m04_lore_safehouse_address_found` "Your card from Albion. Task Force Null went in yesterday. It held a courier account, and this was on it."; else `m06_monitoring_enabled` "Your tags lit up last night."; else the Helena ticket in Nightshade's go-bag (on `m08_nightshade_tidied`, the airline booking: "Nightshade cleared his locker before we reached it. The airline kept his booking: one way, to Helena.", stage 8 SC 4). Stage 8 ruling 14 (row 116): when an earlier reason took the branch, every m08 player still hears the ticket, in a line after it: "And Nightshade's go-bag held a one-way ticket to Helena." or, on tidied, the booking line. The courier label names Mountain States Records & Retention.
3. On `m08_completed and not m08_tomb_gamma_location_known`: "We have Helena. Not the bunker. Not yet." (**fixed**).
4. HaX's first line: `m08_hax_ko` "You put me on the floor at the Citadel. I'm still running you."; else `m08_completed and not m08_nightshade_ko_before_fate` "Keep not asking. By morning you won't need to." (both **fixed**); else a plain opening (C writes). HaX is in the room: prefix `Agent HaX:`.
5. The wall (SA §10.1): one fixed line per card per value, never-played lines as SA gives them; the five-or-more-unplayed rule (m04, m05, m07, m08 keep theirs; the rest share "The rest are files you can read on the plane."; count `not mNN_completed` in a `temp`, and confirm the threshold against the timing, §9.3). m08's card on `m08_completed and m08_nightshade_arrested and not m08_nightshade_ko_before_fate` carries Netherton's "He said you'd know where to find him. He meant the door." (stage 8 ruling 10: not on never played, where HaX's card says "He's in custody and saying nothing."). The wall opens "One card for every operation against ENTROPY. The short version." (stage 8 SC 3: no "this year"). Stage 8 also splits three arms: m03 finished with no fate, "Zero Day. Victoria Sterling, their Cardiff broker. You dealt with her." (BP F-07); m04 `partial` without `m04_crew_lost`, "You told the public half of how Critical Mass got in.", and `quiet` with `m04_crew_lost`, "The report said industrial accident, cause under investigation, and you let it." (SC 6, BP F-06); m06 `m06_assets_seized`, "ENTROPY's fund. You froze it before it paid out. Twelve point eight million, in evidence." (BP F-03). The last two cards (Fraser, Ferreira) HaX doesn't read; after the narrator line, a single player button "[Who are the last two?]" (R3 I-5, a beat in the long run to the first choice), then Netherton: "I will read those two myself. Later." (**fixed**).
6. The suspect: Netherton "ENTROPY's planner. Every card on this wall has his initial on it somewhere." and "I will not say the name in this room until we can prove it." (**fixed**; no "Tonight we can."). On `m06_architect_identity_found`: HaX "You heard me say it after HashChain. I called it Satoshi's guess." (**fixed**; R2 C-R2-03: "his" read as the Architect).
7. The stakes, HaX, three short lines (SA §3.1 beat 7): the database, the infusion-pump entry, Analysis's guess labelled as a guess ("They're guessing. I'd like to find out they guessed high."); "Day eleven. Eleven counties." only on `m07_completed` with Austin uncovered (check which `m07_team_assignment` values leave Austin uncovered against m08's shipped `m08_opening_briefing.ink`, which branches the same way).
8. The question hub (SA §3.2): "[What's the Publication?]", "[Schedule attached. Of what?]", "[When do we go at the Architect directly?]" (answer "Somebody always asks me that. This time it's now.", script edit R1 C-07), each once, and "[Let's go.]".
9. The raid team (SA §3.3): Netherton's one-breath introduction (**fixed** "Quintero leads on the ground. Kowalczyk breaches. Malhotra runs comms. Arakawa talks to the Americans."), then one beat each, lines **fixed** from SE §3: Quintero's "One agent, no cover…" and "Orders don't fall off couriers, Director." with Netherton's "This one didn't. Noted." (stage 8 ruling 11); Malhotra's "If something goes wrong in there, I'd like to hear it go wrong." with HaX's "I run 0x00."; Arakawa's police line. Malhotra's beat is written knowing his m10 secret (a hidden re-vetting) and shows nothing of it (SE §3).
10. The cracker: Kowalczyk "Stores froze everything Nightshade ever signed for. This one's mine. Never been through stores, never been near him." / HaX "The long way is over." / Kowalczyk "The long way's for people who get paid by the hour." (**fixed**). The handover is a `Narrator:` line; **no `#give_item`** (the cracker is in the start kit). Her one double-edged line is the cracker's; nothing else she says is pointed.
11. The player's one answer to the team: "[Quintero's right. Send me anyway.]" (R2 C-R2-01: it follows Kowalczyk's line, so "She" was ambiguous) → `#set_global:raid_team_answer:quintero`; a thanks to Kowalczyk → `#set_global:raid_team_answer:kowalczyk`; saying nothing (a `You: ...` silence choice is allowed here) leaves `""`.
12. Close: Netherton, the plane in ninety minutes, the team follows tonight, "Bring me a name I can say in court." HaX: "Line's open from wheels down." (**fixed**). `#exit_conversation`, `-> DONE`.

Speakers (§8.3): `Director Magnus Netherton`, `Agent HaX`, `Agent 0x2D 'Anchor'`, `Agent 0x5E 'Lantern'`, `Officer Dev Malhotra`, `Officer Kenji Arakawa`, `Narrator`.

### 4.2 `m09_closing_debrief.ink` (C2)

`closing_debrief`, hidden in `loading_dock`, opened by its mapping on `start_debrief` (`disableClose: true`); after a reload it **restarts at `start`** with ink variables kept and visit counts lost, so it must replay safely (S4 §6.5). `INCLUDE m09_carryover_vars.ink`. SA §7, MC §8.

Knot **`start`**:

1. `#set_global:debrief_played:true` above the first line. Cold open, `Narrator:` (floodlights, the aircraft's ramp down, the team unloading).
2. Kowalczyk. **`recruiter_offer == "double_crossed"` first**: no choice; Netherton reaches the player first, **fixed** "Kowalczyk took a phone call when we landed and walked off the apron. Her phone was in a bin by the fuel bowser." Otherwise, guarded `kowalczyk_reply == ""`: Kowalczyk "Well? Did my toy earn its keep?" (**fixed**), then "[Thank you. I was glad of it.]" → `#set_global:kowalczyk_reply:warm` / "[It was in my pocket.]" → `#set_global:kowalczyk_reply:flat` (script edit R1 ruling 1: both hold when the PIN opened the safe). She grins and goes back to the ramp. On `sleeper_named` with `flat`: `Narrator: He watches her go back to the ramp, and says nothing.` (**fixed**). On a replay with the reply set, one short bridging line instead.
3. Netherton, **fixed**: "Oh-six-hundred, day thirteen. Twenty hours. He has given us every one of them." Then the name, once.
4. The stance, guarded `memo_stance == ""`: "You've read his memo. Was he right?" on `memo_read`; otherwise (stage 9 alignment R2 n1) "In 2017 he told the board to warn the vendor within thirty days. The board kept the flaw." / "That was his memo, in short. Was he right?" → "[About Albion, yes.]" → `#set_global:memo_stance:yes_albion` / "[No. Not about any of it.]" → `#set_global:memo_stance:no`.
5. The notice: if `debrief_notice_before`, skip (the hub's "The notice." covers it). Else if `not albion_notified`, Netherton, **fixed** (two whole-sentence forms by `m04_disclosure_choice == "full" or m04_crew_lost`): "His notice is still on that box. Send it, and the vendor starts on a fix for four hundred sites and the Critical Mass watch comes down tonight." [+ "The inquiry will ask when we knew."] "Hold it, and he can call us hoarders, and be right. You read it. You decide. I will sign whichever." (stage 8 SR minor 4) → "[Send it.]" → `#set_global:albion_notified:true` above "Then I sign it." / "[Hold it.]" → `#complete_task:send_the_notice` (alignment R2 n2) above "Then it waits behind Montana, with everything else." Else (sent here before a reload) a bridging line.
6. The hub: "[The archive, sir.]" (at most two lines, the first two that apply in SA §7.1's order: Sorensen talked, Sorensen KO'd, legacy files saved, Noor KO'd before her told and left lines, Old Coyote KO'd, Tran talked or KO'd; `left` and lost files get nothing), "[WREN.]", "[The Recruiter.]" (by `recruiter_offer`; on `recruiter_secret == "told"` the extra line), "[The notice.]" only on `debrief_notice_before`, and "[Montana, sir.]" → the spine. Each asked topic is recorded in an ink-local `VAR` (visit counts don't survive a reload) and hidden after. Lines **fixed** as SA §7.1's table, with these changes as shipped: Sorensen knocked out reads "Mrs Sorensen woke up asking for a lawyer. She has not said a word since." (R1 C-06, no injury named); Old Coyote's line opens "Your night guard wants to…" (it can follow anyone's line); Noor gets a warned-back-in-October arm before `left` ("Miss Haddad went home at the end of her shift. She knew what list she was on before you arrived."); the Recruiter's `named` line is §9.3 C-4's rewording ("The police make the arrests at oh-six-hundred, day thirteen. Nobody moves before then. WREN would hear.").
7. The spine (every player): the two names in full, **fixed** "Agent 0x19, Callum Fraser. Agent 0x6B, Ana Lúcia Ferreira." and `Narrator: He reads the first name off the card. He doesn't look down for the second.`; the order (on `m08_netherton_ko`, after he uncaps the pen, **fixed** "You put me on the floor at the Citadel. Nobody has mentioned it. I am mentioning it once.", R3 I-7, paying off the briefing's "Nobody mentions why.") and his reply to the stance at the pen ("Then I sign for him too." / "Good. Then he can make that argument in court, and lose it."); on `m08_debrief_stance == "owned"` his name beside Nightshade's, on `defended` one thank-you he doesn't explain; HaX last on the line by `hax_confession_answer` (`afterwards`: "You said afterwards. I'm holding you to it."; `should_have_told`: "Everything I have on the bunker is on your phone. As promised.", R2 A-R2-02, so the identity scene's "You get all of it from now on." isn't replayed), with "the rest" still owed; why the team goes in together, **`double_crossed` first**: "She knows we know. She will be where he is. So will we." (stage 8 SR minor 4); not named: "If I bench anyone tonight, WREN knows we know. They come. You watch them." (R2 C-R2-02: one string for the default and shortlist routes); named: "We take her at the briefing, in front of the others, where there is nowhere to go. Until then she sees nothing in my face. Nor in yours." (all **fixed**).
8. The last image, `Narrator:`, with `#complete_task:report_to_netherton` and `#set_global:report_done:true` on their own lines directly above it: "He caps the pen." with, on `double_crossed`, "Her crate is still on the ramp." and, on `sleeper_named` otherwise, Kowalczyk waving across the hangar. Then `#exit_conversation`, `-> DONE`.

The debrief doesn't read back the bin or the tape (HaX named them in `afterwards`), doesn't judge the confession answer or the deal, and gives no local time. SAFETYNET has no arrest powers: Netherton's "The arrests start at oh-six-hundred…" (SA's `named` line) is the police's work; word it so (§9.3).

Speakers: `Director Magnus Netherton`, `Agent 0x5E 'Lantern'`, `Agent HaX` (on the line, through `hax_voice`), `Narrator`.

### 4.3 The other callers (C3–C5)

Each is a phone contact in `loading_dock`, unvoiced, opened only by its mapping. Each has a home stub `start` exactly like the Recruiter's (§3.1) and a knot **`call`** that ends `#exit_conversation`, `-> DONE`. Phone lines: 25 words at most, no self-prefix; HaX, if she speaks, is prefixed `Agent HaX:`.

- **`m09_phone_nightshade.ink`** (C3; `nightshade_phone`; `flag1_submitted && m08_nightshade_triple_agent`, `delayMs: 7000`). Beat 1.4. UK; collegial, precise, an image instead of jargon, serene and a little tired. He names which defences the restricted cage was built against (the badge reader that takes a clone, the cabinet that takes a lifted print), and he is right: as shipped (alignment R1 m3, R2 n3): "Sorensen's card is on custom keys. Crack the keys first, then read it. Don't guess." / "That plan chest isn't on her schedule. It never was. Whatever's in it, he wanted kept." After he has gone, `Agent HaX: He's right. I hate that he's right.` (**fixed**). His two texts back go in C7.
- **`m09_phone_torres.ink`** (C4; `torres_phone`). Beat 2.5. As in m05's ink (soft, slow). `#set_global:torres_called:true` on its own line above his first line. **Fixed:** "I gave you this address back in October. It was a line in a list." (stage 8 SC 2) and "They pick people with someone to lose. Look for the ones with a sick parent." The sick-parent line is said only in the `else` arm (R2 C-R2-05: the shortlist arm already points at next of kin). He knows the legacy filing scheme, one step off the search: branch his pointer on `sleeper_shortlist` (at the boxes, or after the safe when the boxes are still unread). He doesn't decide between the names.
- **`m09_phone_gary.ink`** (C5; `gary_phone`; first attempt at the salvage keypad). Beat 3.2. Birmingham and the Black Country, flat, a bitter joke, slightly less bitter now. `#set_global:gary_called:true` on its own line above his first line. **Fixed** hint (S6 §2.3): "Seen codes like that. Archives key them to the shelf scheme. Read it like a shelf mark, not a number. Vigenère, and the bay's word is the key. There'll be a chart near the keypad." Optional: "Director of Cyber Security, me. They gave me a lanyard with my name spelt right. That's how you know it's serious." He can't see the room: no Montana, no "your wall".

### 4.4 `m09_alpha_recording.ink` (C6)

`alpha_recording`, hidden in `tape_room`, opened by its mapping on `alpha_deck_used` (every interaction) at knot **`deck`**. Person-chat, so every speaker is voiced in their own voice.

- `deck_pulled != "alpha_tapes"`: `Narrator: Empty spools. Degaussed.`
- else `not identity_scene_done`: `Agent HaX: I know whose voice that is. After.` (**fixed**)
- else the clip, **fixed**, prefixed `Dr Adrian Tesseract (recording):`: "The best lock there is opens for the right name. Nobody fights a door that's expecting them." / "And build your own way out first. Always. Then let them build their way in." Then `#set_global:alpha_clip_played:true` above `Agent HaX: Tape two. He gave that lecture every year.` (**fixed**; she says nothing while it plays).

Each route ends `#exit_conversation`, `-> DONE`. "That's the version he taught us." is A's hub line (topic 3b), not here.

### 4.5 `texts/C_texts_and_credits.md` (C7)

- Nightshade's two texts back (`nightshade_phone`, on `nightshade_shown_file`, `delayMs: 4000`, `onceOnly`), **fixed**: on `cage_bin === 'nightshade_copy'` "You found what I cleared, too. Then you know I kept his notes. I'd have burned anything else."; otherwise "Thank you. I'd rather not have known. No. That isn't true." (C may adjust the second to dodge the lint's `not-x-but-y`, keeping its turn.)
- The closing card (five lines) and the credits, in the F14 `closingCard` / `section` format, every condition `globalVars.<name>` with `&&` only and no parentheses (FA §13 B5 counts `closingCard` lines and credits clauses among the conditions where `||` is false; the README says credits run as JavaScript, so the two disagree: write one clause per arm and it works either way). Start from S4 §9's draft; C owns the final wording. Every person's line ends on an unconditional clause; "Saved from the bins:"; "kept from the shredder"; card line 4a "His vendor notice: sent tonight."

## 5. State contract

**How a global gets written from ink.** Two ways, and they differ:

- `#set_global:<name>:<value>` (a tag, on its own line above the line it belongs to). Always emits `global_variable_changed:<name>`, even when the value is unchanged, and pushes the value into every loaded story (`chat-helpers.js:456-518`). Use it for anything a mapping listens to, and for `start_debrief`, which must re-emit.
- `~ <name> = <value>` on a `VAR` that is also a scenario global. Writes the global and emits the change at once, during the line, but only when the value actually changes (`npc-conversation-state.js:556-596`). Use it where the same knot must read the new value straight away (the Recruiter's defaults, `debrief_notice_before`).

Never both for one write (two events). Never assign an import (the engine reverts it; the validator errors). Values are bare: `#set_global:cage_bin:derek_file`, no quotes, no spaces. Every global below is `VAR`-declared in each file that reads or writes it, with the default shown; `VAR` names match the global exactly.

**Conditions.** Inside ink, `and`, `or`, `not` and brackets are fine. Every condition the engine evaluates outside ink (eventMapping `condition`, `textVariants`, `observationVariants`, `spriteVariants`, the closing card and credits) is `&&` only, written `globalVars.<name>`, with no `||` and no parentheses; an "or" is one mapping or one variant per arm (README "Event mappings"; FA §13 B5). Where a text row in `texts/` needs an "or", write two rows.

### 5.1 Exports (twelve since stage 8, `exportGlobals`; twenty-three since stage 9 alignment R2, the eleven added listed in §15 and FINALE_ARC §3.4)

| Global | Type, default | Set by | Read in m09 by |
|---|---|---|---|
| `recruiter_offer` | string `""` | B1 `call` defaults (`~` "refused"); B1 outcomes and A1 `deck_resume` outcomes (`#set_global`) | C2 hub; texts (invoice); credits |
| `deck_pulled` | string `""` | as above ("alpha_tapes" default; `none` / `her_file` / `alpha_tapes`) | A1 `afterwards`, `identity_scene.albion`; C6; credits |
| `sleeper_named` | bool `false` | B1 naming line or `resume_name` (`#set_global`) | A1 hub 1, 9; C2; texts (cracker); credits |
| `sleeper_shortlist` | bool `false` | scenario: `hl_placing_sheet.onRead` | A1 hub 1, 9; C2; C4; credits |
| `recruiter_secret` | string `""` | B1 (`~` default `kept` / `confessed`; `#set_global` `told` / `denied`) | B1 (skip the spring on a restart); A1 `afterwards`; C2 |
| `hax_confession_answer` | string `""` | A1 `identity_scene.answer` | C2 spine; credits |
| `albion_notified` | bool `false` | A1 hub 2; C2 notice | A1 hub 1, 2; C2; credits |
| `nightshade_shown_file` | bool `false` | A1 hub 10 | A1 hub 10; scenario (his text) |
| `reading_finished` | bool `false` | scenario: `the_reading_last_page.onRead` | nothing in m09 ink (m10 reads it); no `VAR` needed |
| `cage_bin` | string `""` | B3 / B5 buttons; scenario default `derek_file` on `cage_opened` **with `!bin_chosen`** (stage 8 SA M1: on the hatch route the pick comes first and must not be overwritten); B5 `handover` and "[Walk past her.]" hand the default file over (ruling 1) | A1 `afterwards`, hub 11; B7; C7 |
| `legacy_files_saved` | bool `false` | scenario (HaX mappings) | A1 hub 13; C2; credits |
| `alpha_annotations_read` | bool `false` | scenario: `alpha_annotations.onRead` (R1 A-05) | A1 hub 3b. Exported from stage 8 (ruling 5, SR major 2): m10 gates "[Your Tomb Alpha notes say carry it…]" on it as well as `deck_pulled == "alpha_tapes"`. JSON only; no ink change |

### 5.2 Imports (FA §3.1), all in `m09_carryover_vars.ink`

Read-only. 43 variables plus eight `completed` (stage 8: `m04_voltage_escaped` and `m07_team_redirected` dropped, ruling 17, read nowhere; `m06_assets_seized` added for the wall's seized-fund arm, BP F-03; m06 exports `assets_seized` already). Strings default `""`, booleans `false`.

- **Tier 1 (19):** `m06_architect_identity_found`, `m07_teacher_discussed`, `m07_architect_echo_heard`, `m08_nightshade_triple_agent`, `m08_nightshade_arrested`, `m08_nightshade_ko_before_fate`, `m08_tomb_gamma_location_known`, `m05_recruiter_deal_accepted`, `m05_recruiter_deal_confessed`, `m05_found_pipeline_list`, `m05_torres_turned`, `m05_final_choice` (string), `m03_victoria_fate` (string), `m02_gary_protected`, `m01_maya_ko`, `m06_monitoring_enabled`, `m02_insider_asset_arrested`, `m02_reeves_fate` (string), `m08_nightshade_tidied`.
- **Tier 2 (24):** `m01_final_choice` (string), `m04_crew_lost`, `m01_kevin_ko`, `m01_sarah_ko`, `m02_patient_assaulted`, `m02_exposed_hospital`, `m02_ghost_deal_accepted`, `m02_paid_ransom`, `m03_danny_fate` (string), `m03_danny_ko`, `m03_directive_decoded`, `m04_disclosure_choice` (string), `m04_voltage_captured`, `m04_lore_safehouse_address_found`, `m06_irina_recruited`, `m06_minder_walked`, `m06_assets_seized`, `m07_team_assignment` (string), `m07_debrief_stance` (string), `m07_found_tomb_gamma`, `m08_debrief_stance` (string), `m08_netherton_ko`, `m08_netherton_hostile`, `m08_hax_ko`.
- **Completed (8):** `m01_completed` … `m08_completed`.

**The never-played rule** (FA §3): wherever a present, at-large or penalising value equals the default (`m07_team_assignment == ""`, `m02_reeves_fate == ""`, the m01 clean-record line), the condition also needs that mission's `_completed`, so a cold-start player is told nothing false. The default branch is the canon, said as history (SA §10). Values to branch on: `m01_final_choice` fight / arrest / recruit / expose / surrender; `m03_victoria_fate` recruited / arrested / escaped / ko; `m04_disclosure_choice` full / partial / quiet; `m05_final_choice` public_exposure / turn_double_agent / combat_lethal / arrest / combat_nonlethal; `m07_team_assignment` fracture / trojan_horse / meltdown; `m08_debrief_stance` defended / owned. If a value isn't listed here, read it from the source mission's shipped `scenario.json.erb` or ink, never guess.

### 5.3 m09's own globals (`globalVariables`)

Story globals from MC §10 and the machinery from S4 §5. "Scenario" means stage 9 writes it (a mapping, `onRead`, `onPickup`, a flag reward, `globalVarOnKO`); ink only reads it.

| Global | Type, default | Set by | Read by (ink) |
|---|---|---|---|
| `raid_team_answer` | string `""` (`quintero` / `kowalczyk`) | C1 | A1 `dock`; B1; A3 (shortlist text) |
| `noor_told` | bool | B2 | C2; credits |
| `noor_ko`, `old_coyote_ko` | bool | scenario (`globalVarOnKO`) | C2; credits. (`sorensen_ko`, `tran_ko` dropped at stage 9 alignment R1 m11: `sorensen_fate` and `tran_outcome` carry the knock-out.) |
| `old_coyote_told` | bool | B6 | credits |
| `sorensen_fate` | string `"left"` (`talked` / `ko`) | B4 (`talked`); scenario (`ko` on `npc_ko:sorensen` unless `talked`) | B4; C2 |
| `tran_outcome` | string `"left"` (`talked` / `ko`) | B7 (`talked`); scenario (`ko`) | A1 hub 1; B7; C2 |
| `reading_told_hax` | bool | A1 hub 8 | A1 `identity_scene` |
| `memo_stance` | string `""` (`yes_albion` / `no`) | C2 | C2 |
| `kowalczyk_reply` | string `""` (`warm` / `flat`) | C2 | C2 |
| `schedule_read` | bool | scenario (`master_schedule.onRead`) | A1 `hour_read` |
| `briefing_played` | bool | scenario (`setGlobalOnStart`) | none |
| `flag1_submitted` … `flag4_submitted` | bool | scenario (flag rewards) | A1 (status, hub gates) |
| `stacks_entered`, `cage_opened`, `nightshade_file_held`, `notebook_read`, `legacy_clock_run`, `ledger_page_seen`, `reading_found`, `salvage_keypad_seen`, `tape_room_entered`, `salvage_opened`, `tran_alerted` | bool | scenario | A1 hub and status (`stacks_entered`, `cage_opened`, `nightshade_file_held`, `notebook_read`, `legacy_clock_run`, `reading_found`, `salvage_keypad_seen`, `tape_room_entered`, `salvage_opened`); B2 (`ledger_page_seen`); B4 (`nightshade_file_held`); B7 (`tran_alerted`) |
| `in_cage`, `office_entered`, `invoice_booked`, `printed_ledger_read`, `alpha_deck_used` | bool | scenario | none (mappings only) |
| `hatch_talked`, `bin_chosen` | bool | B3 (both), B5 (`bin_chosen`) | A1 hub 11 (`bin_chosen`) |
| `maintenance_code_used` | bool | A1 hub 14 | none |
| `hand_matched` | bool | A1 hub 11 or `identity_scene.opening` | A1 |
| `ledger_read_heard` | bool | A1 `ledger_read` | A1 hub 9; B3; B4 |
| `recruiter_call_started` | bool | B1 (`~`) | A1 `start`, status; B1 |
| `recruiter_said_yes`, `recruiter_gone` | bool | B1 | A1 `start`, `deck_resume` |
| `deck_choice_made` | bool | B1 outcomes; A1 `deck_resume` outcomes | A1; B1 |
| `afterwards_heard` | bool | A1 `afterwards` | A1 hub 7 |
| `torres_called` | bool | C4 | none |
| `gary_called` | bool | C5 | A1 hub 5 |
| `identity_scene_started`, `identity_scene_done`, `identity_name_said` | bool | A1 `identity_scene` | A1; C6 (`identity_scene_done`) |
| `hour_read_started`, `hour_read_done`, `hour_read_choice_reached` | bool | A1 `hour_read` | A1 |
| `tesseract_call_started`, `tesseract_call_done` | bool | A1 `tesseract_call` | A1 |
| `alpha_clip_played` | bool | C6 | none in ink (credits if C uses it) |
| `alpha_annotations_read` | bool | scenario (`alpha_annotations.onRead`, R1 A-05) | A1 hub 3b; now also an export (§5.1, stage 8) |
| `start_debrief` | bool | A1 hub 1 (`#set_global`, re-emits) | A1 hub 1, 10 |
| `debrief_notice_before` | bool | A1 hub 1 (`~`, once) | C2 |
| `debrief_played`, `report_done` | bool | C2 | A1 hub 1 (`report_done`) |
| `catalogue_guide_offered`, `ledger_guide_offered`, `tomb_beta_guide_offered`, `archive_code_guide_offered` | bool | scenario (exposure mappings) | A1 hub 18, `guides_menu` |
| `catalogue_guide_hint_given`, `ledger_guide_hint_given`, `tomb_beta_guide_hint_given`, `archive_code_guide_hint_given` | bool | A1 `guides_menu` | A1 |

S4 §5's "hub retire flags" become ink-local `VAR`s (§5.4), because no other file reads them; S4 allowed this.

### 5.4 Ink-local `VAR`s (not globals; persisted with the story)

- A1: `dock_heard`, `series_topic_given`, `tran_topic_given`, `name_topic_given`, `legacy_topic_given`, `alpha_topic_given`, `nightshade_file_decided`, `reading_told_hax_asked`, plus any `*_help_given` A wants for the VM steers.
- B6: a challenge count. C2: one `asked_<topic>` per hub topic. Others as each writer needs.

A local must never share a name with a global or an import.

### 5.5 Proposed for stage 9 (not read by ink)

New mappings and read globals the texts and scenes need, which no stage document lists yet: M1, HaX `conversation_closed:briefing_cutscene` → phone-chat `targetKnot: "dock"`, `delayMs: 2000`, `onceOnly`, not forced, unvoiced; read latches for A3's document remarks (`rent_ledger_read`, `refit_ledger_read`, `danny_sheet_read`, `case_file_read`, `legacy_box_read`, and from stage 8 `reeves_sheet_read` and `asset_tag_read` (the salvage cage's property label, A3-32), set only while the printed ledger shows the Reeves paragraph (A3-31), each an `onRead` `setVariable` on its `notes` object; `lease_file` and `derek_file` can key on `item_picked_up:notes` with `data.itemId`); a `setVisible: false` on `jesse_tran` on `tran_outcome === 'talked'` (he walks out); `onceOnly` on `sorensen_door`'s door-scene mapping; from stage 8, a second `sorensen_door` mapping for `handover` (§3.3), the `unlockTask: "match_the_hand"` on HaX's `nightshade_file_held` mapping (m-03, the task ships `locked`), and the told/KO guards plus an `open_stacks` relay on Old Coyote's override (m-01).

## 6. Tags, and the mappings they rely on

Action tags sit on their own line **above** the spoken line they belong to (PASS2 lesson 3). A tag before a divert attaches to the next knot's first line, so put it above a line in the same knot. `#exit_conversation` goes on its own line after the NPC's reply (lint `exit-no-reply`).

### 6.1 The tags m09 uses

| Tag | Form | Emitted in | Scenario must have |
|---|---|---|---|
| `#complete_task` | `#complete_task:<taskId>` | `meet_the_clerk` (B2 `start`, top); `match_the_hand` (A1 hub 11, `identity_scene.opening`); `answer_the_offer` (B1 / A1 outcomes); `hear_the_name` (A1 answer); `report_to_netherton` (C2 last line) | the task ids of S4 §13 |
| `#unlock_task` | `#unlock_task:<taskId>` | `answer_the_offer` (B1 `call`, first spoken line); `hear_the_name` (A1 `identity_scene`, first line); `hear_the_mirror_job` (A1 `hour_read`, first line); `send_the_notice` (A1 `identity_scene.albion`) | those tasks ship `status: "locked"` |
| `#set_global` | `#set_global:<name>:<value>` | every row of §5 marked as set by ink | each name in `globalVariables` |
| `#give_item` | `#give_item:<type>:<itemId>` | A1 `flag1_read` (`notes:catalogue_salvage_line`); A1 `guides_menu` (`lab-workstation:<id>` ×4); B2 (`keycard:noor_staff_card`); B3, B5 (`notes:derek_file` / `notes:letters` / `notes:nightshade_copy`) | the item, with that `type` and `id`, in **the speaking NPC's** `itemsHeld` (HaX; `noor_haddad`; `sorensen_hatch` and `sorensen_door`, both holding all three files) |
| `#clone_keycard` | `#clone_keycard:<card_id>` | B2 (`reading_staff_door`); B3 (`stacks_card`) | the host's `rfidCard.card_id` matches; the player has the cloner (start kit) |
| `#hostile` | `#hostile:archive_guard` | B8 | `archive_guard` has combat stats |
| `#exit_conversation` | own line | every exit | – |

Not used in m09 ink: `#unlock_door` (every story door opens on a HaX `unlockDoor` **mapping key**, F19, not a tag: S4 §4 rows 1, 2b, 5), `#add_note` (engine bug; S4 N-R3-1), `#remove_npc` (use `setVisible`), `#unlock_aim` (aims unlock on `aimCompleted`), influence tags, `#speaker:` tags (prefixes decide the speaker).

### 6.2 What the ink's globals trigger (stage 9's mappings, S4 §4–§6)

Writers don't build these, but the ink must set the global the mapping listens for, at the point named, or the night stops.

| Ink sets | Where | The mapping that hears it |
|---|---|---|
| `ledger_read_heard` | A1 `ledger_read`, first line | the Recruiter's ring (b) and the room-entry backstop (c) |
| `recruiter_call_started`, `recruiter_said_yes`, `recruiter_gone` | B1 | Recruiter re-rings 1 and 2; HaX re-ring 3 (`deck_resume`) |
| `deck_choice_made` | B1 / A1 outcome | HaX `unlockDoor: "sorensen_office"`; `afterwards` ring; aims 4–5 (via `answer_the_offer`) |
| `recruiter_offer` (`taken` / `double_crossed`) | outcome | the invoice text on `office_entered`; the double-cross text |
| `hatch_talked` | B3 first line | `talk_at_the_hatch`; `sorensen_door`'s condition |
| `bin_chosen`, `cage_bin` | B3 / B5 buttons; B5 `handover` and "[Walk past her.]" (stage 8) | the `cage_bin` default (skipped when chosen); bins' `spriteVariants`; `handover`'s own mapping (`!bin_chosen`) |
| `maintenance_code_used` | A1 hub 14 | HaX `unlockDoor: "restricted_cage"` and its retries |
| `sorensen_fate` (`talked`) | B4 | `stop_the_shredding`; the printed ledger's variant; HaX's KO mapping keeps `talked` |
| `noor_told`, `old_coyote_told`, `tran_outcome` (`talked`) | B2, B6, B7 | each NPC's `setVisible: false` |
| `nightshade_shown_file` | A1 hub 10 | Nightshade's text back |
| `identity_scene_started` / `identity_scene_done` | A1 | re-ring to `identity_resume`; flag 4's read; music cues; `hear_the_name` |
| `identity_name_said` | A1, Netherton's naming line | `identity_resume`'s route |
| `hour_read_started` / `hour_read_choice_reached` / `hour_read_done` | A1 | re-rings; Tesseract's ring (`hour_read_done`, `delayMs: 4000`) |
| `tesseract_call_started` / `tesseract_call_done` | A1 | `silence` music; `completeTask: "hear_the_mirror_job"`; aim 6 |
| `albion_notified` | A1 hub 2; C2 | `send_the_notice` |
| `hand_matched` (with `#complete_task:match_the_hand`) | A1 | none beyond the task |
| `start_debrief` | A1 hub 1 | `closing_debrief` opens (`!report_done`); `cutscene` music |
| `report_done` | C2 last line | `victory` music, the card and credits |
| `alpha_clip_played` | C6 | credits if C uses it |
| `torres_called`, `gary_called` | C4, C5 | Torres' fallback; A1 hub 5 |

## 7. Voiced and forced calls

S4 §6, FA §6.1, `docs/agents/FINALE_ENGINE_VOICED_CALLS.md` §8 (F20), README "Voiced phone calls".

### 7.1 The table

| Scene | Host (home knot) | Ring and re-ring `targetKnot`s | Voiced | `resume` | Done-flag | Owner |
|---|---|---|---|---|---|---|
| The Recruiter's call | `recruiter` (`start`, a stub) | `call` (rings a–c; re-ring 1 with `resume: true`); `resume_name` (re-ring 2) | yes | re-ring 1 only | `deck_choice_made` | B |
| After she has gone | `agent_0x99` (`start`) | `deck_resume` (re-ring 3, also on `conversation_closed:agent_0x99`) | yes | no | `deck_choice_made` | A |
| The identity scene | `agent_0x99` | `identity_scene` (first ring); `identity_resume` (re-rings) | yes | no | `identity_scene_done` | A |
| Flag 4's read | `agent_0x99` | `hour_read`; `hour_read_resume` (re-ring on `schedule_read`), else `hour_read` | **no** (text) | no | `hour_read_done` | A |
| Tesseract's call | `agent_0x99` | `tesseract_call` (ring and re-rings; restarts) | yes | no | `tesseract_call_done` | A |
| The debrief | `closing_debrief` (person-chat) | `start` | person-chat TTS | – | `report_done` | C |

Not forced and not voiced: `dock`, `flag1_read`, `ledger_read`, `afterwards` (A); Nightshade's, Torres' and Gary's `call` (C). The clip (C6) and the two cutscenes are person-chats, voiced per speaker as usual.

**The voiced start knots are exactly:** `recruiter` → `call`, `resume_name`; `agent_0x99` → `deck_resume`, `identity_scene`, `identity_resume`, `tesseract_call`. Everything those knots reach by divert, stitch, tunnel or choice is voiced too (F20 walks it), so it must obey §7.2.

### 7.2 Rules for every voiced knot

1. **It ends `#exit_conversation` on its own line, then `-> DONE`.** It never diverts to the home knot (`start`), `support_hub`, `afterwards` or any knot the hub also uses. Why `DONE` here when person-chat forbids it (PASS2 lesson 21): a phone thread whose story has ended restarts at `start` on the next open (`restartAfterEnd()`, `phone-chat-conversation.js:276-287`: it tries a newly set `currentKnot`, then `start`), and the engine's own forced-call trial does the same (`scenarios/test_finale_calls_credits/ink/hax_call.ink`). So HaX's `start` guards run on every reopen. The same ending is used by `hour_read`, `hour_read_resume`, `dock`, `flag1_read`, `ledger_read`, `afterwards` and the three callers' `call`s.
2. **No narration.** A `Narrator:` line in a phone thread isn't voiced, so none in a voiced knot. What a narrator would say becomes a speaker's line (HaX's asides: "She's started the wipe on her tape deck. She thinks you've gone.", the Tesseract aside).
3. **No printed variables.** No `{player_name()}`, no `{var}`, no counts. Branch between whole fixed sentences with a block or `{cond: A|B}` where A and B are complete sentences. A line that differs by one clause is written out twice (the inquiry clause in `identity_scene.albion`).
4. **Speakers.** The host's own lines take no prefix. Anyone else is prefixed with a registered display name: `Agent HaX:` in the Recruiter's thread; `Director Magnus Netherton:` in HaX's. Player choices aren't voiced. Prefix lines are spoken in that character's voice (`director_netherton` is registered in `loading_dock`).
5. **Fixed strings across files are character for character.** The three HaX blocks in §3.1 appear in B1 (prefixed) and A1 (unprefixed); the TTS cache keys on the text, so one audio clip serves both only if the words, punctuation and apostrophes match exactly. Use straight apostrophes (') throughout.
6. **Inline cues** (`*beat*`, `*quietly*`) are allowed in voiced lines, about one per scene, never on a line carrying a number or a name the player needs (lint `stage-cue-in-info`).
7. **Every first line sets the started flag; the last choice (or last line, if there is no choice) sets the done flag**, never on opening or closing (FA §6.1 one rule). Defaults that an export depends on are written on the first line by branch (the Recruiter's).

### 7.3 HaX's guarded resume knots

`deck_resume`, `identity_resume` and `hour_read_resume` each start with the done-flag guard (`#exit_conversation`, `-> DONE`, no line), then route by the scene's own globals to the unanswered choice (§2.1). They never use `resume`. While any HaX scene is pending her `start` shows only "Pick up. I'm ringing you." and exits (§2.1, guard 1), and closing her thread re-rings the scene on `conversation_closed:agent_0x99` (`delayMs: 500`).

**Choices inside HaX's scenes write the same globals wherever they're answered.** If a hit closes a scene and the player reopens her thread, the phone may land on the scene's saved choice instead of `start` (a reopen re-navigates to the knot that owns the saved choices; stage 9's browser test settles which). Answered there, unvoiced, the choice must still write the full set of tags and globals, so nothing depends on the answer being given inside the call.

### 7.4 The voiced-line recount

S4 §6.7 budgets about 66 voiced lines (Recruiter 14, HaX 49, Netherton 3) plus the two-line clip. After writing, each owner lists every voiced line in their files (A: `deck_resume`, `identity_scene`, `identity_resume`, `tesseract_call`; B: `call`, `resume_name`) in their report with a count per speaker, so the orchestrator can check the audio budget. `node scripts/ink_runtime_check/voicelines.mjs <file.json>` lists every line a compiled story can print; filter it to the voiced knots by hand.

## 8. Writing rules

### 8.1 The user's style rules (`~/.claude/CLAUDE.md`), in dialogue too

- No inflated framing ("pivotal moment", "testament to", "stands as", "plays a significant role", "lasting legacy").
- Banned words: delve, intricate, tapestry, pivotal, underscore, landscape, foster, enhance, crucial, breathtaking, captivate, profound, steadfast, robust, load-bearing (dialoguelint also flags testament, vibrant, showcase, garner, interplay, leverage, navigate, valuable, additionally).
- No summing-up line at the end of a scene or a reply. No "Overall", "In the end".
- "Moreover", "Furthermore", "However", "On the other hand" at most once or twice in the whole mission.
- No "it's not X, it's Y", and no two-sentence "Not X. Y." / "She is not X. She Y." A villain (Sorensen, the Recruiter) may keep one per scene (FA §13 B4).
- Em dashes only where a comma or bracket won't do; never for drama. In ink, prefer commas and full stops.
- No fake spectrums, no filler openers ("It's worth noting"), no trailing "-ing" tags ("…, ensuring we get there").
- Vary sentence length. Short lines after long ones.

### 8.2 The mission's rules

- **TV spy thriller.** People hold things back, talk past each other and say the short version. HaX states costs and lets them sit.
- **No lecturing.** Nobody explains a concept in dialogue: the VM and the field guides teach. The two exceptions are fixed and already written: HaX's full-disclosure line (A1 `hour_read`) and the vendor-notice cost (A1 `identity_scene.albion`).
- **VM by story meaning only.** "The catalogue server", "his box", "full control of Tomb Beta's server". No commands, tools, services, ports, CVEs, accounts or file paths, and no quoting of what a flag's text says. Where a line needs VM detail (the credential's first line, the steers for flags 2–4), write it in story terms and mark it `// VM-STEER: check against the VM plan` (§11).
- **Choices that matter.** Every choice changes something the player can see later in m09 or in m10 (a global in §5 with a reader), or it's a stance with a reply that differs. No flat menus. Choice text is the player's own words in brackets, first person, calm, short (15 words at most); no `You:` echo after it; no stage-direction labels. A choice only quotes what the player has heard or done on this route.
- **Fixed strings.** Every spoken line is a whole sentence; voiced lines never print a variable (§7.2). Lines marked **fixed** in §2–§4 are copied exactly.
- **Line length:** 30 words a face-to-face line, 25 a phone line, three lines from one speaker before a choice (five in a cutscene, four at a reveal).
- **UTC only.** No local times, no dawn. Locals say "at this hour". The Publication is 06:00 UTC, day 13; the head start 04:00.
- **WREN:** never "plant" for WREN or the room; no pronoun for WREN before the name or an accusation (FA §13 B4).
- **SAFETYNET has no arrest powers** (PASS2 lesson 39): agents detain and hand over to police. "In custody" is fine; "you're under arrest" from an agent isn't.
- **Violence brief, TV level.** A knock-out is a line; no injury described.
- **Knock-outs.** Any person NPC can be knocked out; the conversations that remain must still make sense (the debrief's KO lines; Sorensen's fate kept at `talked`).
- **English.** UK for SAFETYNET (HaX, Netherton, Kowalczyk, Malhotra, Nightshade, Gary, Tesseract's tapes): "organise", "realise", "judgement", "Cyber Security" with a space. US for the Americans (Sorensen, Noor, Tran, Old Coyote, Dillard, the Recruiter, Quintero, Arakawa): "realize", "color", "check" for a bill. Torres keeps m05's voice. Spelling follows the speaker, not the reader.

### 8.3 Speaker display names (prefixes must match exactly)

| Prefix | NPC id |
|---|---|
| `Agent HaX` | `agent_0x99` (phone); `hax_voice` (person-chat speaker, same voice) |
| `Director Magnus Netherton` | `director_netherton` |
| `Agent 0x2D 'Anchor'` | `quintero` |
| `Agent 0x5E 'Lantern'` | `kowalczyk` |
| `Officer Dev Malhotra` | `malhotra` |
| `Officer Kenji Arakawa` | `arakawa` |
| `The Recruiter` | `recruiter` |
| `Agent 0x47 'Nightshade'` | `nightshade_phone` |
| `David Torres` | `torres_phone` |
| `Gary Whitlock` | `gary_phone` |
| `Margaret Sorensen` | `sorensen_hatch`, `sorensen`, `sorensen_door` |
| `Noor Haddad` | `noor_haddad` |
| `Jesse Tran` | `jesse_tran` |
| `Cody Old Coyote` | `old_coyote` |
| `Lyle Dillard` | `archive_guard` |
| `Dr Adrian Tesseract (recording)` | `alpha_recording` |
| `Narrator` | – (cutscenes and person-chats; never in a voiced phone knot) |
| `You` | the player; only for a silence choice |

Phone contacts take no prefix in their own ink. Stage 9 registers each `displayName` exactly as written here.

### 8.4 Ink syntax hazards

- A line that starts with `*`, `-`, `+` or `=` is ink syntax, not text. Lead with the speaker prefix.
- `#` anywhere in a line starts a tag; `//` starts a comment; `{` `}` are logic; `->` and `<-` divert. None may appear inside spoken text. The salvage code and every S6 document string were chosen to avoid them; keep it so when quoting.
- In an unprefixed phone line, a colon makes the engine try the words before it as a speaker. It falls back harmlessly, but don't put a registered name before a colon by accident.
- `- else:` inside one conditional block, never a second `{not …}` block after a block that offers choices (lint `choice-fallthrough`).
- Hubs use `+` with `not …` guards and always keep an unconditional sticky exit (no starved knot). Person-chat hubs open with a re-entry line (lint `blank-reentry`); phone resting knots hold choices only.
- Never `END`. Person-chat exits are `#exit_conversation` then `-> hub` (or `-> DONE` for hidden, mapping-opened scenes: B5, B8, C1, C2, C6). Phone exits as §7.2.

## 9. Handover items each group settles

FA §13's stage 7 rows for m09 (9-1 to 9-12) and both missions (B1–B5), plus the wording the stage documents left to stage 7. Settled here, so nobody waits: 9-1 (HaX's home knot is `start`, which diverts to `support_hub`; the voiced start knots are §7.1's), 9-2 (prefixes, §8.3), 9-5 and 9-6 (the knots and the hub, §2.1), 9-10 (narrators only in the cutscenes; no `#give_item` in the briefing). **One deviation from FA 9-1 and S4 §6:** the Recruiter's outcome lines are not a shared include. They are fixed strings (§3.1) written into B1 (prefixed) and A1's `deck_resume` (unprefixed). An include would make B1 fail to compile until A had written it, and its HaX lines would need a prefix in one thread and none in the other. The cache keys on the text, so the lines still cost one clip each.

### 9.1 Group A

- **A-1** The line for a pending Recruiter call in `start` (guard 2).
- **A-2** `identity_resume`'s one line (draft "Still here. Netherton too.") and `hour_read_resume`'s; the reply to "[Read me the defences.]".
- **A-3** The Tesseract aside (draft "He kept his voice down. He always did.").
- **A-4** The four confession openings and the three replies with their `reading_told_hax` forms (SE §4.3 drafts; about six lines a form before the choice; replies two lines at most).
- **A-5** The four m04 landing lines in `identity_scene.albion` (SA Beat 3.4).
- **A-6** `afterwards`' loss line, one fixed string per `cage_bin` × `deck_pulled` case.
- **A-7** The owner-first text (S4 §4 row 10, M9-15); the four field-guide offers.
- **A-8** HaX's document remarks (FA 9-11; S6 §1 "HaX (ink)", §6.5): the fixed ones in §2.3, plus Danny's note by value and whether Derek's file gets a line on `fight`, `arrest` and `recruit`.
- **A-9** The status ladder, one line per row, each naming the next step.
- **A-10** "[About the name.]" (SE §4.4) and the Torres line in topic 9.
- **A-11** The story-level steers for flags 2–4 (§11 item 1) and the credential line (§11 item 2), each marked `// VM-STEER`.
- **A-12** The `dock` call's player choices.

### 9.2 Group B

- **B-1** **Sorensen's recognition against Derek's file** (FA 9-12, S6 W6-17): SE §3's table gives one line per `m01_final_choice` value. On `expose` and `surrender` it is now the third telling of what Derek's file and the Reading's entry 1 say: give her a different angle there (something only the archivist would know: what she filed, what it cost, who read it) or cut the line on those two values and go straight to "You're not from the lease-holder. You're the one he writes about." The `fight`, `arrest` (or `""` with `m01_completed`), `recruit` and never-played lines stand. B3 and B5 use the same strings.
- **B-2** The Recruiter's second cold-start line, the line before the grievance (the Architect took her placement's tasking), and HaX's optional line on what her file holds by `m05_final_choice`. Get A's sign-off on that HaX line.
- **B-3** Tran and **D. Varga**: if Tran names his handler, it is "D. Varga" (S6 §6.3; the letters call him "the Bozeman number"). Netherton's debrief line ("His handler is being watched, and knows it.") has to stay true.
- **B-4** Noor's cover choices, her bystander lines, her lines after the clone; Old Coyote's talk-past covers and his repeat challenge.
- **B-5** Nothing for Sorensen to say after "Give me a pencil" (SE §3: the request is the character).

### 9.3 Group C

- **C-1** **The wall** (SA §10.1, M-11): one fixed line per card per value; confirm the five-or-more-unplayed threshold against the four-minute budget, and say what you chose.
- **C-2** "Day eleven. Eleven counties.": which `m07_team_assignment` values leave Austin uncovered (read m08's shipped briefing, which branches on the same import).
- **C-3** HaX's plain briefing opening for a player with no "Same classroom" text.
- **C-4** Netherton's `named` Recruiter line says "The arrests start at oh-six-hundred…": SAFETYNET can't arrest. Make it the police's arrests, or "the pick-ups", without losing the "WREN would hear" point.
- **C-5** **The closing card and credits** (FA B3, S4 §9): final wording in the F14 format, five card lines holding on every route, every person ending on an unconditional clause, `&&` only.
- **C-6** Nightshade's text back, "No. That isn't true.", may trip `not-x-but-y`; keep the turn and pass the lint.
- **C-7** Malhotra's briefing beat written knowing his hidden re-vetting (SE §3, MS-21), showing none of it.
- **C-8** Torres' pointer branched on `sleeper_shortlist`.
- **C-9** The debrief's bridging lines for a replay after a reload (one per guarded beat).
- **C-10** The Alpha clip's recording style is the tts-audio skill's job, and the user hears it before it ships (FA 9-9). Write only the ink.

## 10. Checks

### 10.1 Each writer runs these on their own files before reporting

From the repo root. Report each command's result honestly; a finding you leave gets a one-line reason.

1. **Compile.** `./scripts/compile-ink.sh m09_digital_archaeology` compiles every `.ink` in the folder (other groups' files too: read only your own lines in its output). It warns on `END`. For one file: `bin/inklecate -o scenarios/m09_digital_archaeology/ink/<f>.json scenarios/m09_digital_archaeology/ink/<f>.ink`. Zero errors; any "apparent loose end" warning is a bug until shown otherwise.
2. **Lint.** `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m09_digital_archaeology/` (exit code is always 0; read the findings). With no scenario file yet, every file is linted as face-to-face (`[person, unmapped]`, checked on a scratch run): the phone rules (`phone-self-prefix`, the 25-word phone cap) don't run, so check those by hand in A1, B1, C3–C5. Clear every `error`; clear or justify every `check` and `warn`.
3. **Runtime walk, every entry knot.** `node scripts/ink_runtime_check/inkcheck.js scenarios/m09_digital_archaeology/ink/<f>.json <knot> [VAR=value ...]` for each entry knot in §1, once with defaults and once per branch that matters (for example `m05_recruiter_deal_accepted=true`, `m08_nightshade_tidied=true`, `deck_pulled=alpha_tapes identity_scene_done=true`). No runtime errors, no runaways.
4. **Hub stress.** `node scripts/ink_runtime_check/loopcheck.js <f>.json <knot> [VAR=value ...]` on every re-enterable knot: A1 `support_hub` (with mid-mission states, such as `flag1_submitted=true cage_opened=true nightshade_file_held=true`), `guides_menu`; B2–B4, B6, B7 hubs; C2's hub.
5. **Voiced lines.** `node scripts/ink_runtime_check/voicelines.mjs <f>.json` for A1 and B1; list the voiced knots' lines in the report (§7.4) and confirm none prints a variable.
6. **Greps** (each should come back empty, or every hit explained):
   - `grep -n '^\s*->\s*END' ink/*.ink` (no `END`);
   - `grep -nE '~ *m0[1-8]_' ink/*.ink` (no import assigned);
   - every `#set_global:<name>` and every `VAR` against §5 (a name that isn't there is a typo or a missing contract entry);
   - every `Name:` prefix against §8.3;
   - in voiced knots, `{` used to print a value, and `Narrator:`;
   - the banned words of §8.1 (the lint catches most).
7. **Fixed strings.** For each line marked **fixed** that you used, diff it against this contract (copy, don't retype). B and A cross-check the three HaX blocks of §3.1 character for character.

### 10.2 What can't be checked until stage 9 (the scenario file)

- `ruby scripts/validate_scenario.rb scenarios/m09_digital_archaeology/scenario.json.erb`: prefix resolution against the registry, dead `VAR`s, undeclared `#set_global`, `#give_item` against `itemsHeld`, imports never written, INCLUDE following.
- The phone reopen check, `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`, once m09 is rendered into `missions.json`: it tests every phone ink's resting knots, including the `-> DONE` endings of §7.2.
- The F20 walk of the voiced knots (the TTS line extractor) and the real voiced-line count.
- `tagdiff.mjs` against a commit (there is none yet; every later ink rewrite runs it).
- The browser tests in S4 §12.3 and S5 §11: re-rings and reloads in every forced scene, a hit inside each HaX scene followed by opening and closing her thread, the hatch's reach, the clip with and without `hax_voice`, the route set R1–R12.
- `dialoguelint` again with the scenario present, so phone files get the phone rules and the scenario's timed texts (A3, B9, C7 once pasted) are linted.

## 11. Open items

For the orchestrator. None stops the writers; each says what the writers do meanwhile.

1. **VM steers for flags 2–4.** S4 §7.1 topics 4 and 12 wait for the opus48 VM plan's game-design-level steer. Meanwhile A writes story-level lines that make no technical claim, marked `// VM-STEER`. Flag 1's steer is fixed.
2. **The credential's first line** (A1 `identity_scene.opening`) is whatever the VM shows beside flag 3. A writes it in story terms only; stage 9 or the VM plan aligns the wording.
3. **FA §13's gate**: "the timed VM run (item 45) comes first" for stage 7. It affects the published length, not the ink; the orchestrator decides whether writing starts before it.
4. **A new mapping for the dock call** (§5.5 M1). No stage document says how HaX's Beat 1.1 lines arrive. A1's `dock` also runs from `start` on first open, so the lines can't be missed whichever way stage 9 wires it.
5. **`-> DONE` at the end of phone calls** (§7.2), against the README's person-chat rule. Based on `restartAfterEnd()` and the engine's own trial; reopencheck at stage 9 confirms it.
6. **A reopen after a hit** may show a HaX scene's saved choice rather than `start`'s "Pick up" (§7.3). The ink is written so answering it there loses nothing; S4 §12.3's browser test decides whether the engine needs a change.
7. **No shared outcome include** (§9, against FA 9-1 and S4 §6). Fixed strings instead; the audio cost is the same.
8. **Closing card conditions.** FA §13 B5 says `||` is false there; README says credits run as JavaScript. C writes `&&` only either way.
9. **Read latches for HaX's document remarks** (§5.5): five new `onRead` globals and two `item_picked_up` mappings, for stage 9.
10. **Hub topic 3b** (was "[I decoded his annotation sheet.]"; now "[His annotation sheets, with the tapes.]" on `alpha_annotations_read`, R1 A-05) is new: S4 §5 names `alpha_clip_played` as read by "the decode's hub line" but §7.1 has no topic for it. Folding it behind another gate is A's call if `crowded-hub` fires.
11. **SAFETYNET and arrests.** SA's debrief line "The arrests start at oh-six-hundred" (C-4) and any "arrest" choice text (B4) are reworded to canon (PASS2 lesson 39).
12. **Not ink, still open:** voice-bible entries for Sorensen, Noor, Tran, Old Coyote, Dillard and the four raid officers before any line is voiced (SE §9); Lyle Dillard's sprite; whether `hax_voice` can be dropped (S5 §3.1, stage 9).

## 12. Script edit R1 changes

2026-10-21, after `SCRIPT_EDIT_R1.md` (verdict revise). §2–§4 now hold the strings the three groups ship. Each change below is editor-approved (ruling or finding id given inline above). A grep of every quoted string in §2–§4 against `ink/*.ink` and `texts/*.md` finds no unapproved word difference.

- **A (§2):** "Sorensen's office" (A-06); the no-block counter line (A-07); the hand line, moved before the credential (A-01); the Albion controller, watch and cost lines, with the two flat buttons cut (A-03, A-04); hub topic 3b gated on the new `alpha_annotations_read` (A-05, §5.3 row added; A1 no longer reads `alpha_clip_played`); A3-06 split into two texts (A-18); the lease remarks keyed on `m08_tomb_gamma_location_known` alone (ruling 5).
- **B (§3):** the Recruiter's sold-and-lied opening, cold start, grievance, offer, double-cross price and two-line naming with US "check" (B-01, B-02, B-13, B-15); HaX's deck line split in two and the ledger line shortened (B-01); her default m05 arm cut (B-03, A agreed); Noor's two tell buttons (B-07); Sorensen's opening without "dear" (ruling 2), the lever button (B-12), the recognition on `arrest` (B-05), the hatch's clone button (B-07); Old Coyote's truth button and reply (B-06, B-07).
- **C (§4):** "Somebody always asks me that. This time it's now." (C-07); the hangar buttons "[Thank you. I was glad of it.]" / "[It was in my pocket.]" (ruling 1); the debrief's archive lines as shipped (C-06, plus the stage 7a changes the editor kept: Old Coyote's "Your night guard…", Noor's warned arm, the C-4 police wording). Not contract strings, also changed: the briefing drops "He was one of ours, once." (C-02) and four wall arms (C-08); HaX's plain opening "Sorry about the leave. This is why." (C-03); Torres "Safe enough. Please be quick." (C-04); the credits' Kowalczyk, Sorensen and Tran defaults (ruling 1, C-05, C-06); the debrief hub's re-entry cycle is now one line.
- **Split, words unchanged** (phone cap or a player beat between sentences): A1 `hour_read`'s full-disclosure line (a "[Isn't it?]" button between its first sentence and the rest), the keypad's first answer, the Tesseract-call "since the course" line (one `*beat*` cue added); C5 Gary's hint; C3 Nightshade's cabinet line; C2 Netherton's notice line.
- **Still to do outside this file:** SE §3's table (the B-05 recognition, the B4 opening) and S4 L229's reader note for topic 3b, both for the arc-keeper.

## 13. Script edit R2 changes

2026-10-21, after `SCRIPT_EDIT_R2.md` (verdict revise, light). §2–§4 and §7.2 now hold the strings the three groups ship; each change carries its finding id inline. A grep of every string R2 removed finds no survivor in `ink/*.ink` or `texts/*.md`, except two that are meant to stay: B3's "You're not from the lease-holder…" (B-R2-05 changed only B5) and A1's "You get all of it from now on." (A-R2-02 changed only the debrief's repeat).

- **A (§2):** `ledger_read`'s buttons reply "That's one of the four you met at the briefing." without repeating the entry (A-R2-01); the hand line ends "…beside my old course notebook. Same hand." (A-R2-07); "[Afterwards. Not during.]" gated on `afterwards_heard or m07_architect_echo_heard` (A-R2-08); the Reading form split into "He wrote that I'd cover for you." / "Tonight you covered for me.", with the first line alone on `should_have_told` (A-R2-03; this replaces audio cut 2, which had dropped that form); the Albion watch and send merged into one line (A-R2-05, audio cut 1); `hour_read`'s opening at oh-six-hundred with the key named, and "Then why build the key?" (A-R2-04); hub topic 14 relabelled "[Can Victoria's people get me through that gate?]" (A-R2-09); text A3-12 "Safe's open. Kowalczyk will want to hear about her toy." (A-R2-06).
- **B (§3):** the sold-and-confessed call opens on the Recruiter's sold line, then HaX (B-R2-01); "for my tape deck" in the offer (B-R2-06); one counter line in the hang-up block (B-R2-07, audio cut 3); Noor names the bonus in her Peg answer and the bonus button waits for it (B-R2-02); B5's own line after the recognition (B-R2-05), and its first HaX bin line opens "One bin is…" (follow-up: no hatch on Victoria's route); Old Coyote's truth button in two forms by cover (B-R2-03); the Recruiter's text about the plane (B-R2-04).
- **C (§4):** "[Quintero's right. Send me anyway.]" (C-R2-01); "I called it Satoshi's guess." (C-R2-03); the debrief's `should_have_told` line ends "As promised." (A-R2-02, which also closes C-R2-04); "If I bench anyone tonight" (C-R2-02); Torres' sick-parent line only in his `else` arm (C-R2-05).
- **Shared strings:** the six HaX lines in A1's `deck_resume` and B1 are unchanged and still match character for character.
- **Voiced counts after R2:** group A calls 54 distinct, 48 new (HaX 51, Netherton 3; audio cut 2 traded for the split); the Recruiter 14; B1's HaX 17 distinct, 11 not shared with A1; briefing 84 character lines plus 8 Narrator; debrief 49 character lines plus 16 Narrator (two of its strings reworded, no line added). Outside those scopes: one new Old Coyote clip, one new Sorensen clip and one new HaX bin line (both B5).

## 14. Script edit R3 changes

2026-10-21, after `SCRIPT_EDIT_R3.md` (verdict revise, light; ship without another round). §2–§4 and §7.2 now hold the strings the three groups ship; §12 and §13 stay as the record of earlier rounds. A grep of every string R3 replaced finds no survivor in `ink/*.ink` or `texts/*.md`.

- **A (§2.1):** `ledger_read`'s buttons say "WREN's on our team. One of the four you met at the briefing." (A-R3-03, I-1); the hand line plants "the margins in my old course notebook" (A-R3-02, I-6); on `should_have_told` with the Reading, "He wrote that I'd cover for you." is followed by "I covered for him." (A-R3-01, I-2; the orchestrator chose this over dropping the line).
- **B (§3):** the offer reads "The name tonight. You let my tape deck wipe." (I-3; the review's "…wipe, all of it." made the line 27 words, so "all of it" is cut for the 25-word phone cap); the hang-up block opens "She's started the wipe on her tape deck. She thinks you've gone." (B-R3-02, I-4); Noor's signpost waits for `noor_asked_peg or ledger_page_seen` (B-R3-01, I-9); Old Coyote's truth button has three forms by cover (B-R3-03, I-8).
- **C (§4):** "[Who are the last two?]" before Netherton's "Later." (C-R3-02, I-5); his pen line on `m08_netherton_ko` (I-7), guarded by the ink-local `said_floor_line` so a reload mid-spine doesn't repeat it (ink variables survive a reload; visit counts don't, §4.2); Noor's default debrief line ends "and she does not know it." (C-R3-01, I-10).
- **Shared strings:** the six HaX lines in A1's `deck_resume` and B1 are unchanged and match character for character.
- **Voiced counts after R3:** group A calls 55 distinct, 49 new (HaX 52, Netherton 3); the Recruiter 14 (one string reworded); B1's HaX 17 distinct, 11 not shared with A1 (one reworded); briefing 84 character lines plus 8 Narrator (the new button is unvoiced); debrief 50 character lines plus 16 Narrator (I-7 adds one; one reworded).

## 15. Stage 8 changes

2026-10-21, by the m09 fixer, under `planning_notes/overall_story_plan/mission_initializations/finale/STAGE_8_RULINGS.md`. Sources: m09 `stages/stage_8/REVIEW_R1.md` (m09-R), `finale/STAGE_8_SEAM_A.md` (SA), `STAGE_8_SEAM_REVIEW.md` (SR), `STAGE_8_VOICES_THREADS_A.md` (VT), `STAGE_8_BIBLE_PASS_A.md` (BA), `STAGE_8_BIBLE_PASS.md` (BP), `STAGE_8_SHIPPED_CANON_A.md` (SC). §1–§6 above now hold the shipped strings and conditions; §12–§14 stay as the record of earlier rounds. No audio exists yet, so the voiced rewrites cost nothing.

**HaX's phone (A1, `m09_phone_agent0x99.ink`)**
- M-01, ruling 3: topic 2 is one row, "[His notice.]" ("Still on his box. Say the word."), answered in the new choices-only knot `notice_ask` ("[Send it.]" / "[Not yet.]", strings unchanged); topic 9 retires on `deck_choice_made`; topic 13 also retires on `nightshade_file_held`; topic 15 retires on `cage_opened`. Re-walked at m09-R §4.4's states: 8, 10, and 10 after Tesseract's call with every optional thread open.
- m-14: `start` diverts to `dock` only while `not flag1_submitted`; otherwise it sets `dock_heard` and goes to the hub.
- m-02 and the truthfulness pass on "[Where do I stand?]": new rows `identity_scene_done and flag4_submitted` ("Flag four's in. I'm reading what it gave us. I'll ring you."), `flag3_submitted and not nightshade_file_held` ("Flag three's in. Bring me Nightshade's file from the plan cabinet in the cage. Then we say the name."), `flag3_submitted` ("Flag three's in. Stay on. I'm ringing you."), `cage_opened and nightshade_file_held` ("Flag two. The ledger's still on the catalogue server."); the `cage_opened` row adds "It's on her stamp, on the hatch shelf." No row now names a flag already in.
- SR minor 4, ruling 19: Netherton's naming line "I said we would not name him…" (voiced).
- SC 6 (consequential): `identity_scene.albion`'s `partial` line splits on `m04_crew_lost`; without it, "You told the public half of it. We told the vendor less." (new voiced line).
- SC 2: `afterwards` "Back in September I'd have kept that between us. Not tonight."
- The six HaX lines shared with B1 are unchanged and still match character for character.

**Briefing (C1)**
- Ruling 10 (VT 1): Netherton's "He meant the door." only on `m08_completed and m08_nightshade_arrested and not m08_nightshade_ko_before_fate` (the `or not m08_completed` arm dropped).
- Ruling 11 (VT 2): "This one didn't. Noted."
- Ruling 13 (SC 3): "One card for every operation against ENTROPY. The short version."
- Ruling 14 row 116 with SC 4: a tidied arm in "how it was caught" ("Nightshade cleared his locker before we reached it. The airline kept his booking: one way, to Helena." / "We have read every courier out of that city since."), and after the branch, on `m08_completed` when Albion's card or the tags took it, "And Nightshade's go-bag held a one-way ticket to Helena." (the tidied line on tidied).
- BP F-07: m03 finished with no fate, "Zero Day. Victoria Sterling, their Cardiff broker. You dealt with her."; the never-identified line is for never played only.
- SC 6 / BP F-06: m04 `partial` without crew lost, "You told the public half of how Critical Mass got in."; `quiet` with crew lost, "The report said industrial accident, cause under investigation, and you let it."
- BP F-03 / SC 7: m06 `m06_assets_seized`, "ENTROPY's fund. You froze it before it paid out. Twelve point eight million, in evidence."

**Debrief (C2)**: ruling 19, "I will sign whichever." and "She will be where he is."; a comment's "spring" made "September".

**Sorensen (B4, B5)**
- Ruling 2 (m09-R M-03): the talk-down narrator line is "She takes her hand off the feed. The shredder runs on, empty." No engine change.
- Ruling 1 (m09-R M-02 option a, SA M1, SA m4): new knot `handover` in `m09_sorensen_door.ink` (hatch route, first cage entry with `cage_opened && hatch_talked && !bin_chosen`, `onceOnly`): `#give_item:notes:derek_file`, `cage_bin:derek_file`, `bin_chosen:true`, one line. "[Walk past her.]" on Victoria's route now does the same with its own line. §5.1's default row gains `!bin_chosen`.

**Dates (SC 2)**: Torres "back in September"; the Recruiter's own-it button "…the list in September."; Noor "back in September" (US speaker, so no "autumn"); the credits' Noor clause "Warned in the autumn."; the recruiter file's comment (the stitch keeps its name `spring`).

**Texts (`texts/`)**
- A3-04 (m-01): `&& !globalVars.old_coyote_told && !globalVars.old_coyote_ko`; the guard's override takes the same guards and a relay on `room_entered:open_stacks` (S5 §3.3).
- A3-07 (m-03): the same event unlocks `match_the_hand`, which now ships `locked` (S4 §3.2, §13).
- A3-23a/b (BP F-05): "Big Sky was in Zero Day's sales ledger. Sterling's keys opened it after Cardiff."
- A3-24 (BP F-10): "Irina's tip-off led us to this. Tell her it bought us the deed."
- A3-31a–d (new; ruling 14, FA row 21 in custody): "Reeves' handler, from the hospital. Told to stand down the day we took Reeves." on a new read latch `reeves_sheet_read`, one row per custody value plus the pre-export read rule.
- A3-32 (new; m-15's echo, below): HaX on the salvage cage's property label, on `asset_tag_read` before flag 3.
- C7: the WHAT THE PURGE TOOK note records that the default file now reaches the notepad.

**State (§5)**
- Exports: twelve. `alpha_annotations_read` added (ruling 5, SR major 2); JSON only.
- Imports: 43 + 8 `completed`. Dropped `m04_voltage_escaped`, `m07_team_redirected` (ruling 17, m09-R m-13); added `m06_assets_seized` (BP F-03; m06 already exports `assets_seized`). Ruling 17's "42 + 8" predates F-03.
- New for stage 9: `reeves_sheet_read`; `asset_tag_read` and the `beta_asset_tag` object; the `handover` mapping; `unlockTask: "match_the_hand"`; Old Coyote's override guards and relay.

**Stage documents** (s0, SA, SE, MC, S4, S5, S6): every string above copied where quoted; plus BA 1 (`hl_placing_sheet` "Client: confidential (security consultancy)."; SA "a consultancy client"), BP F-02 (`lease_file` "Refit drawings: withdrawn by lessee."), BP F-04 (`case_file` item 5 "From: the Architect's fund, tagged." with no "since 2016"), m-03, m-04 (the looped g and crossed sevens in both observations), m-05 (R5 closes after the naming line; re-ring 2 a guard), m-06 ("Tell HaX to bring you in to Netherton"; aim 6 description), m-07 (first-playtest check), m-09 (S4 and S5 copy S6's stamp and box strings), m-11 (Dillard sets no global; claim deleted), m-12 (branch callers outside `npcIds`), M-04 / ruling 20 (stage 9's first step is the asset list). Each doc has a "Stage 8 folded in" section or note.

**Not changed, with reasons**
- m-08: no change now; stage 9 times the briefing with audio. Stage 8's briefing lines are branch alternatives; the most any one save gains is the row-116 line and the tidied arm's second line, about 20 words, so the 4.0–4.4 minute estimate barely moves.
- m-15: answered in the room as well (coordinator, after the first stage 8 pass): a new readable `beta_asset_tag` in the salvage cage, "PROPERTY OF THE SERVICE. NOT FOR DISPOSAL. / ASSET 0412. Rack server, 2U. / Issued to: Strategy Directorate. / Returned: --" (S5 §3.10, S6 §1.10; stage 9 builds it), `onRead` sets `asset_tag_read`, and HaX's text A3-32 on the first read before flag 3, "Strategy Directorate. One of ours signed this out and never handed it back. Find out who." No name and no VM detail; no ink change. The lab sheet's concept section can still draws the line from the maintenance code Sorensen never changed to the leaver's credential nobody revoked (lab sheets come last).
- SR minor 10 (the casualty figure, "One thousand one hundred…" against m10's "Eleven hundred…"): a taste call with no fix chosen; m09's form stands.
- CC 2 / ruling 18: the Recruiter's "Agent 0x00" and "Goodnight, agent." stand.
- `// VM hint` comments untouched.

**Stage 9 (build) change: the staff passage.** The engine locks rooms, not doors, so S5's RFID staff door on the reading room would also have locked route B's open door from the open stacks. A new 2×1 room, `staff_passage`, sits between the front desk and the reading room (now 2×1) and carries the lock (`rfid`, `requires: "reading_staff_door"`). Noor's card and clone open it on route A; route B never meets it. No ink, knot, global or S6 string changes ("The staff door's around the side." still fits). S5 §3.11 and §18 record the layout.

**Stage 9 walkthrough R1 changes** (`WALKTHROUGH_R1.md`):
- M-01: HaX also completes `set_up_drop_terminal` on `flag1_submitted`, for a player whose VM was already open.
- m-01: `#give_item:notes:catalogue_salvage_line` moves to `flag1_read`'s first line (was above "I've sent you the odd one.", §2.1), so an early close still delivers the note. The line itself is unchanged.
- m-02: new global `dock_rung`; HaX's dock call also rings on `game_loaded` (`briefing_played && !flag1_submitted && !dock_rung`) for a reload during the briefing. M1 sets `dock_rung` too.
- m-03: first-attempt texts for the office keypad and the tape reader before the deck (A3-02b, A3-03b in `texts/A_hax_texts.md`); A3-02's failure trigger is replaced, A3-03 keeps its failure trigger after the deck.
- m-04: status ladder row `hatch_talked and not cage_opened`, "Clone her card at the hatch if you haven't. The gate's beside her, and the cabinet inside takes her print." (A1 now declares `hatch_talked`.)
- m-05: `#unlock_task:send_the_notice` moves from `identity_scene.albion` into the three answer stitches, beside `identity_scene_done`.
- m-06: Dillard gets `globalVarOnKO: "archive_guard_ko"` (new global; stage 8 m-11's "sets no global" no longer holds), and his catch-up re-show checks `!archive_guard_ko`.
- m-11: B1's `recruiter_offer` and `deck_pulled` VARs carry the "Synced scenario global" comment.
- m-12: the drop terminal's screen is named "Drop Terminal Screen".

**Stage 9 globals and latches not in §5** (impl review R1 m-03; S4 §5 should take them): `noor_box_read` and `legacy_remark_sent` (HaX's legacy-box remark sends once, and never over the empty tray or Noor's base box); `alpha_annotations_opened` (the sheet's `onRead` now sets this, and HaX's mapping promotes it to `alpha_annotations_read` only while the readable variant shows, because `onRead` also fires on the "Blank label stock." read; this changes §5.1/§5.3's "set by `alpha_annotations.onRead`"); `archive_guard_ko`; `dock_done`, `debrief_closed`, `noor_met` (below). `dock_rung` is gone.

**Stage 9 playtest R1 and impl review R1 changes** (`PLAYTEST_R1_A/B/C.md`, `IMPL_REVIEW_R1.md`):
- The cage's placeholder map is `room_qdc_security` and the reading room's `room_uni_office` (the old maps' furniture blocked a generated door; B1). Cage objects and Sorensen re-pinned to the new map.
- HaX's dock call rings at `start` (which diverts to `dock`), the knot the phone preloads, so its opening shows once (A-M1); it rings again on `game_loaded`, resumed at the unanswered choice, until `dock_done` (new global, set on the call's last line; A-M3). The Tran warning is inline in `dock`, no longer a tunnel (A-m1). Dock replies say where each door is (A-M4).
- Status ladder row `catalogue_guide_offered` before flag 1 (A-M2). Hub topic 16 retires once asked (ink-local `catalogue_topic_given`; A-m5). `hour_read`'s "Then why build the key?" shares its bubble with the line before (C-m-5).
- Bins: ink-local `bin_pulled` closes the three bin buttons on the first pick (B-M1).
- Clones (B-M2): Noor's "[Lean in over her list, close to the card on her belt.]" and the hatch's "[Lean on the counter, close to her card reel. Ask what's in tonight's run.]" replace "[Which boxes are next on that list?]" and "[What's in tonight's run?]"; the NPC answers first and the clone runs on a narrator beat (m08's pattern). Both stay sticky so a cancelled read can be retried.
- HaX's "Tell her and she's a witness." moved into `reach`, after the tell, as "She's a witness now. She goes tonight, and she doesn't ring her dad for a while." (B-m6).
- Sorensen (cage): Torres' line only on `m05_completed` (B-m2); "The gate sticks." is now "Pull the gate to on your way out." (B-m1). The stamp's dusting surface is `glossy_dark` (B-m3).
- Debrief: on Noor's default arm, `noor_met` (now a synced global, set in her ink) chooses "Miss Haddad went home…" or "The clerk on the front desk went home and rang her father. Noor Haddad. She is on one of the Recruiter's lists, and she does not know it." (C-m-6).
- Lesson 46 (coordinator addendum): `report_to_netherton` no longer completes on the debrief's last line; `closing_debrief` completes it, and sets `debrief_closed`, when the conversation closes (and on the next room entry after a reload). The card and credits trigger on `debrief_closed`.
- Read-in-place readables (17 notes objects) now use `readDisplay: "gameDisplay"`, so reading one no longer removes it from the room (the notes minigame removes a read note; C-M-1). The ones whose text changes have `addToNotes: false`.
- Impl review: legacy remark in two arms (m-01); both sight cones `visualize: true` (m-02); A3-02 marked superseded (m-04); Reading pages and the schedule `puzzle_graph_role: evidence`, ring (c) `onceOnly` (m-05); m09 added to `scripts/ink_runtime_check/missions.json` (m-06).

**Stage 9 confirmation-run changes** (`PLAYTEST_CONFIRM_1.md`, `_2.md`):
- The dock call's last bubble now carries the Tran warning: "A clerk's on tonight, and an IT contractor, Jesse Tran." plus the m01-branch sentence, one fixed line per branch, with `#set_global:dock_done:true` on it. The tag-only chunk and the separate warning bubble are gone, so the warning can't be the line that is still typing when the thread closes.
- Sorensen (cage) exit line: "Pull the gate shut on your way out."
- New global `stacks_card_cloned`, set by HaX on `card_cloned` for "Stacks Card, M. Sorensen" (the event fires only when a read is saved). The hatch's clone choice retires on it and stays after a cancel.

**Stage 9 final-check change** (`PLAYTEST_FINAL.md`): the phone closes about 3 ms after the last line before `#exit_conversation`, so a call whose last line carries information now ends on a one-word player reply (m01/m05 pattern), then the exit. Changed: HaX `dock` "[On my way.]", `flag1_read` "[Got it.]", `ledger_read` "[Got it.]", `afterwards` "[Understood.]", `deck_resume.office` "[On my way.]", `identity_scene.albion` "[Understood.]", `hour_read.realisation` (all three endings, via a new stitch `read_close`) "[Understood.]", `tesseract_call` "[Understood.]", `start`'s pending-Recruiter guard "[Right.]"; the Recruiter's four outcomes (`call.yes_block`, `call.tape_choice`, reached from `resume_name` too) "[On my way.]"; Nightshade's `call` "[Noted.]". Player choices aren't voiced, so the audio budget is unchanged. Done flags still sit on lines before the reply, so no re-ring condition changes. Left as they were: `start`'s "Pick up. I'm ringing you." (its close is what re-rings the scene), "[That's all for now.]", "[Bring me in.]" (the debrief opens), and Torres' and Gary's replies to a player choice.

**Stage 9 full-route playtest changes** (`PLAYTEST_FULL_1.md`):
- #7: cage Sorensen's ink gets a local `talked_down`, set in the lever branch, that closes "[It's over. Put the stamp down.]", the lever and "[Who's WREN?]" at once (the `#set_global` of `sorensen_fate` reaches the story too late for the next menu).
- #8: `nightshade_file` says "a sloping hand you have seen tonight" only on `notebook_read` (base: "a sloping hand."); `enrolment_binders` says "seen twice" / "seen tonight" by `notebook_read` and `nightshade_file_held`. The Reading's "in the same hand" stays (same file).
- #9: the last page is written before the night, so its margin bet stays. HaX answers it on `reading_finished` by `cage_bin`: "He bet you'd save Derek's file. You didn't. First thing he's got wrong tonight." (letters, Nightshade's copy) or "He bet on Derek's file. He was right. Don't let it bother you." (Derek's file).
- #11: `shelf_code_legend` is a readable shown in place (`text` holds the chart; short observation), so the viewer no longer runs "Observations:" into it.
- #13: HaX texts a pointer when the cross-reference opens (on `ledger_read_heard`, before the shortlist or the name): "Harwick & Lowe's boxes are in the open stacks, by their bay label. The lid takes that file number."
- #15: a narrator beat before Sorensen's first hatch line, "She looks up before you can say who you are.", so "The lease-holder's auditor" reads as her guess.
- #16: the stamp's dusting surface is `textured` (a grained handle; the magnetic wand), not `glossy_dark`.

**Alignment round 1 changes** (`ALIGNMENT_REVIEW_F_R1.md`, `ALIGNMENT_PLAN.md`):
- A1, m11: `exportGlobals` is now nineteen: the twelve of §5.1 plus `memo_stance` (`""` / `yes_albion` / `no`, the debrief), `raid_team_answer` (`""` / `quintero` / `kowalczyk`, the briefing), `kowalczyk_reply` (`""` / `warm` / `flat`, the debrief), `sorensen_fate` (`left` / `talked` / `ko`), `tran_outcome` (`left` / `talked` / `ko`), `noor_told` (bool) and `alpha_clip_played` (bool, the clip heard). JSON only; each was already a declared global written where the player decides. m10 reads them as `m09_<name>`.
- m9: imports are now 46 + 8: m08's `accused_vector`, `accused_phantom` and `named_on_evidence` (in `m09_carryover_vars.ink`). `ledger_read` adds one HaX line after "Neither will you.": on a wrong m08 accusation "Last time you named one of ours on a hunch. Do this one on paper."; on `named_on_evidence` "You found Nightshade on paper. Same again."
- m7: m05 ran 16 Sep to 6 Oct, so "September" becomes "the autumn": Torres "back in the autumn", the Recruiter's own-it button "…in the autumn.", HaX's `afterwards` "Back in the autumn…", and comments. Noor, an American, says "back in the fall" (§8.2: spelling and usage follow the speaker). FINALE_ARC rows 61 and 64 still say September (not this file's to edit).
- m2: the briefing's coordinate branch (`m08_completed and m08_tomb_gamma_location_known`): Netherton, "Nightshade gave us a coordinate. A coordinate is not a way in, and it is not a name I can say in court." (new voiced line).
- m3: Nightshade's call gives help only he has, replacing the cabinet and reader lines HaX already said: "Her card's on custom keys. Crack the keys first, then read it. Don't guess." / "That plan chest isn't on her schedule. It never was. Whatever's in it, he wanted kept."
- m4: HaX texts on `npc_ko:old_coyote` ("I asked you not to.") and `npc_ko:noor_haddad` ("She files deeds, 0x00.").
- m5: `send_the_notice` is retitled "Send his vendor notice, or leave it for Netherton" (the hub's hold isn't final, so it still completes only on a send).
- m6: WHAT THE PURGE TOOK also lists what went: the bin that was shredded, "The legacy placement files: shredded. Eleven names." and "The tape side: wiped, 212 reels."; ELSEWHERE gains "TOMB ALPHA: Heard him teach it." on `alpha_clip_played`.
- m1: music phases: `threat` from `hour_read_started`, `silence` for Tesseract's call, `spy-action` from `tesseract_call_done`; disjoint `game_loaded` rows for each phase; `all_hostiles_ko` returns to the phase's track.
- m11: `tran_ko` and `sorensen_ko` dropped (superseded by `tran_outcome` and `sorensen_fate`).
- m12: the onceOnly overlaps are reviewed and justified in an ERB comment; the two legacy-box arms are made disjoint.

**Alignment round 2 changes** (`ALIGNMENT_REVIEW_F_R2.md`):
- n1: new globals `albion_folder_opened` (the folder's `onRead`) and `memo_read` (HaX promotes it on `flag3_submitted`, as the Alpha sheets); the debrief's memo question is preceded, when `memo_read` is false, by "In 2017 he told the board to warn the vendor within thirty days. The board kept the flaw." and asked as "That was his memo, in short. Was he right?" (two new voiced Netherton lines).
- n2: the debrief's "[Hold it.]" completes `send_the_notice`; the task is "Send his vendor notice, or hold it". The hub's "Not yet." stays open.
- n3: Nightshade, "Sorensen's card is on custom keys. Crack the keys first, then read it. Don't guess."
- n4: the coordinate briefing line is "Nightshade gave us a coordinate. What gets us through his door is in Helena."
- n5, n6: music: `spy-action` on `conversation_closed:agent_0x99` after `tesseract_call_done` (not on the flag, which sits under his last message); the identity scene keeps `cutscene` on a reload; `all_hostiles_ko` follows the same phases.
- n7, n8: WHAT THE PURGE TOOK pairs each saved line with its shredded partner (bins, legacy files, tape side, then the deck); "Shredded: the Social Fabric letters. Nobody warned Teresa Villanueva."; "The tape side: 97 of 212 reels kept."
- n9: HaX's m08 call-back in `ledger_read` follows the file-number answer.
- n10: "October" where m05's timing is meant: Torres, HaX's `afterwards`, Noor ("back in October"), the Recruiter's button, the credit "Warned in October." (supersedes R1 m7's "the autumn" and "the fall" above).
- n11: FINALE_ARC §3.4 has rows for the eleven new exports; rows 61 and 64 corrected.
- n12: this contract's body and `texts/A_hax_texts.md`, `texts/C_texts_and_credits.md` updated to the shipped strings.
- n13: `sorensen_office` carries a comment for its expected graph warning.
- n14: four more exports: `reading_told_hax`, `noor_ko`, `old_coyote_ko`, `debrief_notice_before` (twenty-three in all).

**Voiced counts after stage 8**: group A calls 56 distinct (HaX 53, Netherton 3; one new HaX line, one Netherton line reworded); the Recruiter 14 and B1's HaX 17, unchanged; briefing 91 character lines plus 8 Narrator (7 new: Netherton 3, HaX 4; 2 reworded); debrief 50 plus 16 Narrator (2 reworded); Sorensen 2 new lines (B5), 1 Narrator line reworded (B4); Noor 1 reworded.
