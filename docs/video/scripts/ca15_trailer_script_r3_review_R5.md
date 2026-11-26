# ca15 trailer script r3: delta review, round R5 (last script round)

Script: `docs/video/scripts/ca15_trailer_script_r3.md` at 37e13952d. Delta read as `git diff 38f62739f..37e13952d`, then the whole script. Checked against `docs/video/scripts/ca15_trailer_script_r3_review_R3.md`, `scenarios/ca15_shadow_it/scenario.json.erb` (Fatima mappings, lines 1139 to 1166), `ink/nilesh_solanki.ink`, `public/break_escape/js/systems/ask-cue.js`, `npc-manager.js` (the `whenPerceivable` retry, line 967; `DELAYED_MAPPING_RETRY_MS` 500) and `css/notifications.css`. Reviewer: Sonnet. 26 Nov 2026. No machine use, no renders.

**Totals: 0 B, 1 M, 3 m.** Every R3 item is done on paper except the Fatima window, where the fix chosen does not do what the script says it does (M1).

## R3 items: resolution

| R3 item | Status | Check |
|---|---|---|
| M1, 9:16 HUD scale | resolved | Header, beat 8 and beat 10 cells all say 9:16 at 0.5625, whole 1080 px frame width. No "960 px wide" sentence is left; the only 1.125 mentions on beats 8 and 10 are the stated reasons for not using it, plus a crop-sheet exception for beat 8 only. At 0.5625 the toast (up to about 900 source px) and the bottom inventory strip are both inside the frame. See m1 for the 1:1 cell. |
| M2, Fatima window | **not resolved** | The decision is stated, the assertion is stated, but the mechanism cannot produce the gap. See M1 below. The t07 stand-in is acceptable (m2). |
| m3 to m10 (all eight rows, the R3 headline said seven) | resolved | m3 lever added (section 2). m4 A1 reworded in section 1 and the rubric. m5 "About 24.6 s" (beats 7 to 11 sum to 24.64). m6 end hold 0.36 s stated as accepted. m7 one kettle order, `triggerNeed` demoted to a repair, stand point (14, 6) with the object at (14, 7). m8 `note_toast` chosen by "Session note" text, with the toast named. m9 beat 10 defaults to 1 in 16:9 and 1:1. m10 chip `TRACKER · SESSION NOTE` (22) in the table and the chip list. |

## Findings

| # | Sev | Where | Issue | Fix |
|---|---|---|---|---|
| 1 | M | Section 5 beat 15 (t14) | **Spec not precise enough for a take writer, and the mechanism is wrong.** The ask fires at (arrival + 4.5 s), and `whenPerceivable` only retries every 500 ms until the learner can see or be in the room with Fatima (`npc-manager.js` 967, `ask-cue.js`). It can only delay the ask, never bring it forward. In t07 the natural ask fires at about 10.0 s, and the learner returning at `bark_end` + 0.3 = 8.52 s is perceivable well before that, so the ask still lands at about 10.18 s and `ask_audio_start` - `bark_end` stays about 1.96 s. The assertion at 2.5 s fails. To get 2.5 s the learner must stay unperceivable until about `bark_end` + 2.5 s minus the retry and TTS lead (roughly 0.5 to 0.8 s), that is, until after the window's in point (`ask_audio_start` - 2.18). So during the first 2 s of the shot the learner is out of the room and off camera. The camera follows the learner, so the frame would not show Fatima, and the row also says "the learner must stay in frame for the cue". The row does not say how the learner is held out of view (another room, a minigame open, a door), when it is released, or where the camera sits during v10. A take writer cannot build it from the text. | Rewrite the t14 row as a sequence: (1) hold method (for example the learner waits in the next room with the door shut, or a minigame is held open, since `minigameOpen` also blocks the ask); (2) release time = `bark_end` + 2.5 minus 0.8 s, then the learner walks or the minigame closes into Fatima's view; (3) camera: either a capture-only camera on Fatima for the first 2.18 s and a pan back to the learner, or accept a shot that opens on Fatima with the learner entering frame, and say which; (4) the marks (`bark_end`, `release`, `ask_audio_start`) and the assert on `ask_audio_start` - `bark_end` >= 2.5 s; (5) the cue and the learner in frame by `ask_audio_start` + 0.5 s. If that cannot be built cheaply, take the already-named fallback now ("A colleague asks.", 3 words, about 1.3 s) and drop the hold. Not B: the fallback exists and nothing downstream (voicing, dialogue review) depends on it, since v10 is cached. |
| 2 | m | Section 5, t07 stand-in paragraph | The stand-in is acceptable. Plain numbers hold: in 8.52, out 14.84 (6.32 s), ask 10.18 to 13.41 sits at 1.66 to 4.89 of the shot, so the tail after the ask is 1.43 s and the bubble should be whole. Playing beat 15 without v10 is fine: 1.66 s of Fatima in the room then her ask reads as the answer to the blue card, and nothing is left unvoiced. Two small points. (a) `bark_end` + 0.3 is exactly on the 0.3 s limit and `bark_end` is a -40 dB reading, so any room tail breaks the rule. (b) The row 90 line in section 3 shows v10 "0.30 to the ask" with no margin for the same reason. | In = `bark_end` + 0.4 (8.62, out 14.94); re-check the frame at in. Leave v10 as is for t14. |
| 3 | m | Beat 10 zoom cell (1:1) | "whole frame in all three" is false for 1:1 and 16:9 at 1 is the whole frame, but 1:1 at 1 is a 1080 px window of a 1920 px frame. A window centred on the learner or Joanne (x about 420 to 1500) misses the toast, which sits top right (right 20 px, up to about 900 px wide, so x about 1000 to 1900). The text then says "check Joanne is inside the 1080 px window in 16:9 and 1:1", where 16:9 has no 1080 window. The fallback (1:1 to the top-right 1080 px, x 840 to 1920) holds the toast, but Joanne at (5.75, 3.5) is probably left of it. At 0.5625 the toast title is roughly 15 output px tall in 9:16, so "readable" rests on the VO caption and the chip as well. | Replace the cell's first clause with "16:9 and 9:16 show the whole frame; 1:1 at 1 is the top-right 1080 px (the toast), with Joanne in it only if the crop sheet says so; otherwise 1:1 shows the toast and the chip carries Joanne". State that v21's caption and the `TRACKER · SESSION NOTE` chip carry the toast text where it is under 20 output px. |
| 4 | m | Section 9, Lines to voice | The table has no file column. Content is complete (see the table below), but a voicing run needs to know which file each line lives in and which are not in-game lines. Also section 4 cites Joanne's second bark at erb 1607 in the R3 review; it is line 1608 in the scenario. | Add a "File" column as below. |

## Standing rules (regression sweep)

- **Integer scale.** 16:9 and 1:1: 1 or 2 everywhere. 9:16: 0.5625, 1.125 or 1.6875 everywhere. No pushins. Beats 8 and 10 now follow the 0.5625 rule. Pass.
- **Narrator pace (3.0 words per second).** Highest is v17 at 9 words over 4.42 s, 2.04. v9 1.94, v2_r3 1.90, v16 1.85, v19 1.81. All under 3.0. Pass.
- **Margins (0.3 s).** v1 0.37, v1c 0.37, v2_r3 0.38, v16 0.69, v18 0.71, v19 0.79, v21 0.61, v17 0.46, v15 0.61, v9 0.66, v11 0.99 (0.36 on the overrun rule, accepted and stated), v10 0.30 to the ask. All at or above 0.3. The only zero-slack items are v10 and the t07 stand-in in-point (m2). Pass.
- **Cards and chips at 28 characters or fewer.** Longest caption lines: "memory stick. Whose is this?" and "Months on, a reused password" at 28. Longest chip 24. New chip 22. Pass.
- **No em or en dashes.** Searched the script for U+2014 and U+2013: none. The `·` separators are middle dots, as before. Pass.
- **Grid and cross-references.** The delta changes no beat length. Beat numbers agree across sections 2, 3, 4, 5, 8 and 9; the changelog's "13 lines (7 narrator, 6 cast)" matches section 9. Pass.

## Lines to voice: check and file map

13 lines, 7 narrator and 6 in-game. The table matches sections 3 and 4: the seven new narrator ids (v2_r3, v16, v18, v19, v21, v17, v15), Joanne's two barks, and Nilesh's four lines. Cached lines (v1, v1c, v9, v10, v11, Fatima's bark and ask) are correctly left out. Optional option-C line is correctly excluded. Every quoted string was compared with the source and matches character for character.

| # | Line | Type | File |
|---|---|---|---|
| 1 | First, take the shortcuts round IT. | Trailer narrator VO (Sulafat, id `v2_r3`) | Not in the game. `~/video-takes-local/ca15/vo/Sulafat_v2/LINES_v2.md`, voiced with `tools/video/scripts/narrate.rb` |
| 2 | The pack goes to a personal inbox. | Trailer narrator VO (`v16`) | as 1 |
| 3 | Now the attacker's side. | Trailer narrator VO (`v18`) | as 1 |
| 4 | Next door, you leave it by the kettle. | Trailer narrator VO (`v19`) | as 1 |
| 5 | The tracker reports home. | Trailer narrator VO (`v21`) | as 1 |
| 6 | Months on, a reused password opens the personal inbox. | Trailer narrator VO (`v17`) | as 1 |
| 7 | You sort what's waiting. | Trailer narrator VO (`v15`) | as 1 |
| 8 | Someone's dropped a memory stick. Whose is this? | In-game bark (Joanne, `npc_picked_up:ca15_red_stick`) | `scenarios/ca15_shadow_it/scenario.json.erb` line 1590 (`bark` field); TTS in `tts_cache/` |
| 9 | I'll just plug it in and see whose it is. | In-game bark (Joanne, `npc_use_started:ca15_ops_pc`) | `scenarios/ca15_shadow_it/scenario.json.erb` line 1608; `tts_cache/` |
| 10 | Leave it next door, somewhere people stop. Then watch who picks it up. | In-game ink line (Nilesh, knot `red_stick`) | `scenarios/ca15_shadow_it/ink/nilesh_solanki.ink` line 87 (compiled to `nilesh_solanki.json`); `tts_cache/` |
| 11 | Nobody was careless there. She was being kind, and that's what a drop relies on. | In-game ink line (Nilesh, hub, `ca15_drop_used`) | `ink/nilesh_solanki.ink` line 47 |
| 12 | Before we flip, one from the red-team kit. A stick, no label, no note. | In-game ink line (Nilesh, `red_stick`; played in the t11 take, not in the cut) | `ink/nilesh_solanki.ink` line 84 |
| 13 | It's a safe tracker, booked in with IT. It only tells us who opened it. | In-game ink line (Nilesh, `red_stick`; t11 take only) | `ink/nilesh_solanki.ink` line 85 |

Narrator lines 1 to 7 are not game text, so the ink review applies only as a truth and wording check against the scenario (section 3 already lists the truth checks). Lines 8 to 13 are game lines and go through the ca15 TTS top-up, not through the trailer narrator pipeline.

## Verdict

Ready for dialogue review and voicing: **yes.** The thirteen lines are complete, correct against their sources, within pace and margin, and none depends on the t14 fix. M1 (the t14 hold) must be rewritten, or the "A colleague asks." fallback taken, before t14 is recorded; it does not block the edit list's narrator work or the TTS top-up.
