# m10 Full Disclosure: playtest R1, part A (briefing to the breach)

Browser playtest, 2026-10-21, keyless server :3001, playtest-scenario skill. Source of steps: WALKTHROUGH_R1.md section 2, steps 1-5, plus the brief. Screenshots and logs are in
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10a/` (shortened below as `$S/`). Session logs: session.jsonl (game 2983), session2.jsonl (3000), session3.jsonl (3003), session4.jsonl (3004).

Games played (all fresh):
- 2983: cold start. Bootstrap clicked through the briefing, so this game covers the table, Netherton's tether choice (picked "Bring him up"), the gate console, Arakawa's call, a mid-run reload, the gate terminal (wrong flag, then the scenario's own stand-in value for flag 1), the blast door and the tunnel.
- 3000: cold start, no bootstrap. Briefing, Kowalczyk's kit and the aside read line by line; the van Nightshade; the forward-post props.
- 3003: aborted. `--set m08_nightshade_arrested=true` has no effect (importGlobals are re-applied by the server); redone as 3004.
- 3004: `--imports` file with `m08_nightshade_arrested: true`. Arrested-branch briefing, Nightshade's table scene, console, split, Arakawa's call.

Counts: 0 blockers, 1 major, 11 minors, 2 coverage gaps.

## Result per step

| Step | Result |
|---|---|
| 1 Briefing (Netherton, kit, aside) | Pass on both branches. Aims and tasks: take_the_briefing done, whodunit_open set, "Find the Sleeper" shown. |
| 2 HaX "Nightshade's in the van" then Netherton, tether | Pass. door_scene_done, nightshade_tethered, settle_the_table done. |
| 3 Gate console, split, Arakawa's call | Pass. split_started, guide1_offered, gate_console_used, arakawa_call_done. One ring each; no overlap. |
| 4 Flag 1, pair_back, blast door | Pass. "Flag accepted", breach call opens the phone once, blast door unlocks, HaX line "Through the tunnel." |
| 5 Into the tunnel | Pass. go_through_the_blast_door done, Breach aim ticked, inner door open, HaX call on entry (once). |
| Reload mid-run (after split, before flag 1) | Pass for state: globals, tasks, NPC positions and phone thread kept. See m-9. |

"[Where are we?]" at each step (phone, HaX hub):
1. Before the table: "The table first, then the gate terminal."
2. After the table, before the console: "Their monitoring. Gate terminal."
3. After console and split: "Their monitoring. Gate terminal." (a "Field guide." choice appears in the hub).
4. After flag 1: "Through the tunnel." (a "The power room?" choice appears).
No untrue line found in the hub. Every other hub choice (why does he want me, the hour, the head start, how are you) reads straight and returns to the hub.

Console: only 404 (favicon), 503/403 on /tts (keyless, expected) and one 422 on /flags (my deliberate wrong flag). No page errors.

## Findings

### Blockers

None.

### Major

**M-1. "Citadel Incident File V-47" opens an empty generic case board, not the file.** Forward post, object `incident_file` (type `case-file`, erb ~2233, `text` set from txt[:incident_file]). Interact: moveToNear incident_file, interact. A "Case file" board opens with "0 of 0 targets ready to approach", People blank, Contacts "No one else has come up yet.", Company "Nothing found about the company yet." The observations line promises a buff folder; the text never shows. The lore text is unreachable. Screenshot: `$S/s23_incident.png`. (If case-file is meant to be the intel board in this engine, the object needs the notes/readable type like helena_plans, which opens its text fine.)

### Minor

**m-1. Arakawa's call at 02:00: "She goes to bed in five minutes."** (arakawa ink line 81, the call after the split; mission clock t0200, table screen reads NOW 01:45.) A small child going to bed at two in the morning reads as untrue. Fix: "She should be asleep" / "She's up past her bedtime" or make it a morning call. Steps: console, close launcher, call plays. Log: session.jsonl.

**m-2. Phone timestamps show the real clock (11:05, 11:10, 11:15), not the mission clock (01:45).** Every HaX message in the thread. Screenshot not needed; see getState text. A player reading the thread sees "11:05" in a 02:00 raid.

**m-3. Player spawn overlaps Phantom on the imports branch.** `phantom_post` stands at (160,129); the player spawns at (160,144), so the two sprites stack at the start of the forward post. Visible in `$S/s31_g4_table.png` (hooded player drawn over Phantom). On a cold start Phantom is hidden, so only the imports branch shows it.

**m-4. Arakawa stands on top of the GEN 3 generator bay after the breach.** `arakawa_blast` at (512,193): yellow-vest sprite drawn over the generator and inside its hazard border. Nightshade (`nightshade_blast`, 544,161) stands tight against the red tank and the door. `$S/s12_blast_open.png`.

**m-5. Walking to the blast door overlaps the red tank.** The approach point to the locked door (about 588,101) is on the tank's hazard bay, and the player is drawn on the tank's right edge. `$S/s07_blast_door_locked.png`. Door still opened and walked through fine.

**m-6. No pointer to the gate console after the table.** The briefing's last HaX line says "Start the gate console on your way past." After that, the hub says only "Their monitoring. Gate terminal." and the objective list has no console task. A player who skims the briefing goes to the terminal, which asks for a flag they don't have, and is not told the console is the first step. (Related to walkthrough M-1.)

**m-7. Arrested-branch briefing drops the Nightshade intro.** Netherton opens "Gather in. We have until six." and "Vector and Phantom stand at the end of the table", so "The cells get it at four, two hours early, as pay for the theft" has no antecedent ("the theft" is only explained in the cold-start branch: "He gave them the database"). Log: session4.jsonl.

**m-8. Silent branch: tethered Nightshade stays in the van after the split.** Netherton says "If he goes up, Arakawa goes with him and stays with him." After the split the van copy is still at (64,161) with no Arakawa near him (Arakawa is at the gate, then on the blast side). He only appears at the blast door once flag 1 is in. Nothing breaks, but the room shows him alone for the whole console stretch.

**m-9. After a reload the player is put back at the spawn point (160,144), not where they stood (588,101), and inventory slot order changes** (Phone moves to the first slot with an unread "1"). The resume prompt also offers six "Load session" links to other games (real-player path; the harness refuses them, I clicked Resume by hand). State otherwise intact.

**m-10. RFID Cloner and Your Phone share nearly the same inventory icon** (slots 3 and 6 in `$S/s01_forward_post.png`). Easy to grab the wrong one.

**m-11. Flag 1 popup says "Rewards Unlocked! Event triggered".** Generic; the real consequence (the breach call and the door) is not named. Screenshot `$S/s10_flag1_ok.png` (taken before the call opened).

### Not covered

- Table scene on the "shown" and "unshown" Nightshade branches, and "[Leave him in the van.]" at Netherton (only "Bring him up" and, on 3004, "No deals" / "Give me a minute" were run). Briefing side choices "[Go on.]", "[It's a trap.]", "[Has he costed it?]", "[What do you need from me first?]" and "(Say nothing.)" were not taken.
- Nightshade's table scene on the cold start does not exist (silent branch uses the van copy only); that is by design, not a gap in the game.

## Notes for the next tester

- `bootstrap` auto-picks choice 1 through the briefing and the aside and logs only "cutscene choice 1 of N". Start the session and read the person-chat state by hand to see those lines.
- `--set` globals that are imports are ignored; use `--imports=<file>`.
- A first `moveToNear gate_console` returned "arrived-but-outside-plain-range" with shortfall 210 and the player kept walking; the following `interact` still worked, but the call ran past the 120 s tool limit. Not reproduced on 3004. Unverified whether it is the engine or the harness.
- The converse transcript repeats the last line before a choice; harness artefact.
- Flag 1 stand-in value is in scenario_data['flags'] (bunker_monitor flag_1), readable from the game row; no VM file was opened.

## Screenshots (all in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10a/`)

s01_forward_post.png, s03_gate_area.png, s04_gate_console_open.png, s05_after_arakawa.png, s06_gate_terminal_wrong.png, s07_blast_door_locked.png, s08_reload_overlay.png, s09_after_reload.png, s10_flag1_ok.png, s11_breach_call.png, s12_blast_open.png, s13_tunnel.png, s14_tunnel2.png, s20_g2_after_briefing.png, s21_g2_table.png, s23_incident.png, s24_helena.png, s30_g3_arrested.png, s31_g4_table.png, s32_g4_split.png
