# m10 Full Disclosure: playtest R1, part B (below ground)

Browser playtest, 2026-10-21. Keyless server :3001, headless (machine load about 8), Node 24 from the Playwright cache (system Node is 18). VM files not opened. No game files edited.

- Game 1 (id 2982): head start into blast_tunnel. Played the tunnel, security office, workshop, power room, then the server hall until the hall guards knocked the player out (finding B-03). Log: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10b/session.jsonl
- Game 2 (id 2996): head start into server_hall with the shutter cut, flag 1 and flag 3 recorded, and KO of both hall guards by the `debugKO` shortcut (combat not played). Played flag 2 through the real station, the console, HaX's hub and accusation menu, the gallery and the outer lock. Log: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10b/session2.jsonl
- verify-run.rb: game 2 reports "progress recorded, 6 rooms beyond the first, 3 flags submitted, 16 tasks completed, score 57"; game 1 "5 rooms beyond the first, 2 objects unlocked, 1 flag submitted, 13 tasks, score 45".
- Head start for game 1: start room blast_tunnel; globals briefing_played, aside_done, door_scene_done, split_started, gate_console_used, arakawa_call_done, pair_back, breach_open, blast_tunnel_entered, breach_announced; tasks take_the_briefing, settle_the_table, go_through_the_blast_door; `--submit-flag gate_terminal:bunker_monitor-flag1`. The head start does not replay the client mapping that sets `flag1_submitted`, so I set it in the page (`gameState.globalVariables.flag1_submitted = true`) after the first door-log read. Direct assignment sets the value but fires no `global_variable_changed`.
- Console: 503 on TTS requests only (31 + 17, expected on :3001) and one 422 (flag 3 submitted twice at the hatch, "Flag already submitted"). No page errors.

Counts: 0 blockers, 1 major (unverified balance), 6 minors, 9 notes.

## Findings

### Major

- **B-03 (major, balance, unverified).** The server hall has two patrol guards (hall_guard_a west, hall_guard_b east) and the ink gives them no talk-past: every option on both knots sets `#hostile`. In game 1 I walked in from the power room, took the two challenges (both options hostile) and lost all 100 HP in about 60 s at 11 per hit (9 hits) without throwing a punch, because the harness cannot fight. The three raid officers stand in the hall (Kowalczyk, Arakawa, Quintero) and did nothing. Whether a human with Block and Punch wins against two chasers at 135 speed is not tested. Worth a real-player check, and a thought about whether the raid team should join in or the second guard should hold back for a few seconds. Both challenges also fire back to back, so the player reads two cutscenes before the first blow.

### Minors

- **B-01 (minor).** Door log read while `flag1_submitted` is false shows "Locked to their desk's own login." but still runs `onRead`: sets `clue_door_log` and `door_log_given`, completes `read_the_door_log`. Normal play cannot reach it (flag 1 is needed to get below ground). The real text read fine once the global was set.
- **B-02 (minor, reach).** `moveToNear` ends `arrived-but-outside-plain-range` for `duty_handset` (security office), `plotting_board` and `schedule_terminal` (server hall). The handset and terminal still opened by the approach step in `interact`; the plotting board never opened (`still-out-of-range`). Check the footprint around the plotting board, probably the west patrol's lane or the KO'd guard's body.
- **B-04 (minor, continuity).** Fonoti, after Vos's code card and the "Vos sold you out" talk, says "You've got his card, so you don't need mine... Go on through." Then, as the player finishes the PIN on the outer lock, he challenges: "Hey. That's the core door. Who said you could open it?" His `challengeOnSight` only skips on `lock_guard_challenged`, not on `lock_guard_known` or the earlier conversation. The challenge also lands after the door has already opened (the PIN takes about 2 s). Either pass is accepted ("Shift change. Orders from upstairs." then "Go on").
- **B-05 (minor, reload).** After a reload the player spawns in the start room, not where they were (blast_tunnel in my head start, forward_post in a real game, so a reload from the power room means a walk back down the whole route). The tunnel guard marks the player as spotted again on spawn but does not replay the conversation. Rooms report `firstVisit: true` again on re-entry. Records cupboard stayed unlocked, KO states persisted (hall guards stayed KO'd and hostile), shutter cut and Imran's door stayed done, and the gallery stair backstop fired (see B-09). Not checked against a real start room.
- **B-06 (minor, line).** HaX after a correct accusation with Quintero already sent back: "Then she's going where he is. You'll meet her there." "He" has no antecedent (Quintero was named two lines earlier by Netherton; Tesseract is the likely meaning).
- **B-07 (minor, line).** HaX's flag 2 follow-up "You walked past his sheet. It's worth the minute." is a fixed timed message; it is true only if the player went through the workshop. With the stair as the only route that is normally true. In game 2 (head start) it was not. Low risk.

### Notes (checked, no action needed unless you disagree)

- **B-08.** Cold-start tunnel: the guard challenge opens as soon as the room loads ("Hold it. Post's closed till the shift changes."). Choice 1 ("I'm the one they're expecting. The door said my name.") gets "Huh. It did say a name. Go on, then. Fast." The inner door was already unlocked (`inner_door_open` set on load). The map/override routes where the guard is absent were not run.
- **B-09.** Gallery stair: with flag 2 submitted at the real station, flag 3 recorded server-side and the shutter cut, the stair did not open until a reload (`game_loaded` backstop fired, `gallery_open`, `raid_clock t0345`, HaX's gallery_open_call rang once). Head-start artefact: `flag3_submitted` is not set by `--submit-flag` and a direct page assignment fires no event.
- **B-10.** Raid-team copies (kowalczyk_so, arakawa_so, quintero_so) are hidden once the player leaves the security office (R1 m-3 fixed). No NPC stood in two rooms at once. Kowalczyk's hall copy hid after the right accusation.
- **B-11.** The Ghost call (duty handset) shows HaX's line "If it sells, the release console can kill that share..." inside the Ghost thread. Choice 3 set `ghost_sale=stopped`, `share_resale=stopped`, `ghost_call_done`; HaX's stair_call rang about 3 s after the Ghost chat closed. No double ring. Bootstrap closed a phone chat at game 1 start (the breach call from the head start).
- **B-12.** Imran: "Go home. Keep your phone." sets `imran_outcome` first to `avoided` (on open) then `talked_round`, and `door_unlocked_by_npc power_room`. Wendell: option "The one marked gallery shutter." sets `wendell_outcome=told`, `server_hall_warned`, `gallery_shutter_cut`, completes `cut_the_shutter` and the aim; no cut_call (correct for the told route). Asante in the hall then says "Somebody rang the switchboard about a raid. I've nothing to say to you." (the warned variant).
- **B-13.** `tunnel_rota` and `post_ladder` (blast_tunnel) show up in `brief.nearby` while standing in the security office, 137 to 177 px away. Probably the scan reaching across the shared map.
- **B-14.** The release console controls call (`console`, mapping erb:1535) is the one HaX phone mapping that is not `voiced`. All seven named calls are. After the outer lock it says "No share left to touch." with one choice.
- **B-15.** Flag station accepts the scenario's placeholder `flag{m10_staging_schedule}`; the rewards fired (`flag2_submitted`, `submit_flag_2`, `find_the_release` aim complete). HaX's three timed texts arrived in order.
- **B-16.** Fixed since R1: raid copies hide on exit; records cupboard 2817 opened by typing the PIN; outer lock 6083 opened with Vos's note ("Visitor's Code Card", a notes item, not an inventory item).

## What ran

| Step | Result |
|---|---|
| Tunnel guard challenge, inner door, security office entry | Pass (B-08) |
| Duty handset, Ghost call, stair opened by HaX | Pass (B-11) |
| Door log (clue), duty board, shift notes photo, alarm board | Pass; door log text read (B-01 for the locked variant) |
| Fitter's locker picked (assisted), spare power-room card | Pass; card not used because Imran opened the door |
| Records cupboard 2817, gallery rota, alarm log | Pass |
| Workshop guard challenge; casualty sheet, margin strip, bench log | Pass; margin strip not decoded (base64, not decoded by hand) |
| Imran talk, power room door | Pass (B-12) |
| Power room: Wendell, shutter cut | Pass (B-12). Isolator gave no effect; bypass panel is a dusting minigame, not run |
| Reload mid-run (game 1 from power room; game 2 from server hall) | Pass (B-05, B-09) |
| Server hall: guards, Asante | B-03; Asante cold |
| Release console, flag 2, controls | Pass; schedule terminal and controls show their locked text before flag 2 |
| HaX hub: What's still live, Who was where at ten past (alibi), I know who WREN is (wrong then right accusation) | Pass; accused=kowalczyk, sleeper_caught, `check_the_alibis` and `name_the_sleeper` completed (B-06) |
| Gallery: Vos (bought), Fonoti, clock panel, keypad plate, outer lock 6083 | Pass (B-04); Victoria hidden by default, not seen |
| HaX calls heard in this stretch | stair_call, gallery_open_call; console hub. Not heard: tripwire, ladder, inner_door, cut_call |

Not run: tunnel guard absence on the map/override routes, Gary, Victoria, the cut by hand and cut_call, the tripwire and ladder calls, the model terminal and margin decode, hall_console and uplink printer, Mercer.
