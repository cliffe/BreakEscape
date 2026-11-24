# m07 trailer takes (keyless set): scripts written, NOT yet run

Written 23 Nov 2026 on branch `video/trailers-m01-m02-spies` while another session held the capture rig. Nothing was run (no server, game, browser or ffmpeg), only `node --check`. Scripts: `tools/video/takes/m07/t10`..`t16`. Run through `scratchpad/run.sh` with `MISSION=m07`. Ids, rooms, globals, choice texts were checked against a rendered copy of `scenarios/m07_architects_gambit/scenario.json.erb` (structure dump, no secrets printed) and the ink by grep. No PIN, password, code or flag value is in any script; no pad take is written yet.

Older `t01_vm_approach`, `t02_npc_beat`, `t03_ending`, `t04_ending_debrief` and `_live.mjs` in `tools/video/takes/m07/` are LIVE-mode (keyed server) scripts from the earlier pass: superseded for this keyless set (not deleted). `_live.mjs` `playThrough` is reused by t13.

Gate: m07's briefing gate is `briefing_played`, as in m01 (timedConversation `skipIfGlobal`/`setGlobalOnStart`). Rooms: security_checkpoint (start) -east-> operations_floor -east-> server_room (rfid) -north-> scada_control (password), -south-> generator_room (key) -south-> cable_vault (pin).

| id | avatar | flags (new-game; record) | what it films | expected window | status |
|---|---|---|---|---|---|
| t10_briefing | marcus_hale | `--imports=none`; rec "" | hook "We are faced with an impossible decision, Agent." and stakes "Eight point four million people, Agent. Go and do the part you can reach." (picks: Understood > made the call > Fracture; menus visible about 1.1 s) | line windows by marks | script written, not yet run |
| t11_hollis | ngozi_adeyemi | `--imports=none --start-room security_checkpoint --set briefing_played=true --set team_assigned=true --set team_assignment=fracture`; rec `--hide-hud --zoom-step 1` | torch finds the player; "Building's evacuating..." (6.34 s), then fallback "Walk away. Right now. I'm asking." (3.62 s) | challenge line | script written, not yet run |
| t12_ops_exchange | lucia_moreno | `--imports=none --start-room operations_floor --set briefing_played=true --set inside_reached=true --set architect_t20_played=true`; rec `--hide-hud --zoom-step 1` | Adaeze and Gwen at `ops_cooler`, ex_last_two (thirst forced to 20 in setup) | the two lines | script written, not yet run |
| t13_architect_call | harjit_singh | `--imports=none --unlock server_room --start-room server_room --set briefing_played=true --set inside_reached=true`; rec "" with `BE_KEEP_RING=1` | walk into operations_floor, withheld ring after 5 s, answer, narrator + "Don't look for the trace...", "I've read your file...", "Four fires tonight..." (beats 7 and 16 from one take; stops before the reply menu) | by `sub:` marks | script written, not yet run |
| t14_elena | daniel_seo | `--imports=none --unlock server_room --start-room server_room --set briefing_played=true`; rec `--hide-hud --zoom-step 1` | Elena: [Finish what, exactly?] > "Forty minutes I've been at it. It's read-only. Of course it is." (3.94 s) | the line | script written, not yet run |
| t15_park | frank_callahan | `--imports=none --unlock cable_vault --start-room cable_vault --set briefing_played=true`; rec `--hide-hud --zoom-step 1` | Park: "Four minutes and I'd have been out. Four." (3.38 s) | the line | script written, not yet run |
| t16_clock | vivian_ashby | `--imports=none --unlock scada_control --start-room scada_control --set briefing_played=true --set cascade_armed=true`; rec `--hide-hud --zoom-step 1` | `cascade_countdown_display` armed, 4 s hold, nothing opened | about 3 s | script written, not yet run |
| t17_checkpoint_pads | mei_lin_chow | `--imports=none --start-room security_checkpoint --set briefing_played=true --set hollis_resolved=evaded`; rec `--hide-hud --zoom-step 1` | badge station PIN pad (`badge_printer`, 3 wrong digits, no ENTER), then RFID cloner on Hollis (blurred, to Save) | pad about 4 s, cloner about 8 s | script written, not yet run |
| t18_rfid_reader | harjit_singh | t17 flags `--set architect_t20_played=true` | setup clones Hollis off camera, walks to ops floor; reader on `door:operations_floor->server_room`, Emulate | about 5 s | script written, not yet run |
| t19_ops_pc | vivian_ashby | `--imports=none --start-room operations_floor --set briefing_played=true --set inside_reached=true --set architect_t20_played=true`; rec as above | `ops_floor_workstation` pc, held 2.6 s | 2.6 s | script written, not yet run |
| t20_server_closeups | lucia_moreno | `--imports=none --unlock server_room --start-room server_room --set briefing_played=true`; rec as above | SCADA password panel (`door:server_room->scada_control`, EMPTY), `rack_cabling_note`, flag station `flag_station_safetynet_relay` | panel 2.2 s, note 2.5 s, station 2.6 s | script written, not yet run |
| t21_server_walk | ngozi_adeyemi | as t20 | straight walk towards `vm_launcher_attack_terminal`, stops before it opens (throws if a minigame opens) | about 1.5 s | script written, not yet run |
| t22_gen_lockpick | frank_callahan | as t20 | real lockpick of `door:server_room->generator_room`, no key held (`pickLock`) | about 8 s | script written, not yet run |
| t23_gen_key | marcus_hale | as t20 plus `--give generator_maintenance_key` | same door, key lock: key selection, key turn | last 0.5 s of insertion | script written, not yet run |
| t24_vault_pad | daniel_seo | `--imports=none --unlock server_room --unlock generator_room --start-room generator_room --set briefing_played=true`; rec as above | vault PIN pad on `door:generator_room->cable_vault`, 3 wrong digits, no ENTER, ATS-1 plate never opened | about 4 s | script written, not yet run |
| t25_mercer_face | vivian_ashby | `--imports=none --unlock scada_control --start-room scada_control --set briefing_played=true`; rec as above | Mercer face flash 2.6 s, closed before any menu | about 1 s | script written, not yet run |
| t26_park_fight | mei_lin_chow | as t15 | Park's entry line, hub [Then finish it and see what happens. (Fight him.)], "Right.", swing, 1.8 s of chase, stops before KO | line 3.38 s + about 1.5 s swing | script written, not yet run |
| t27_walk_checkpoint | lucia_moreno | `--imports=none --start-room security_checkpoint --set briefing_played=true --set hollis_resolved=evaded`; rec as above | straight walk towards Hollis, torch lit | about 1 s | script written, not yet run |
| t28_walk_ops | harjit_singh | as t19 | straight walk across ops floor past the cooler towards the server-hall door | about 1.5 s | script written, not yet run |
| t29_walk_genhall | ngozi_adeyemi | as t24 | straight walk down the generator hall towards the vault door | about 1 s | script written, not yet run |
| t30_phone_hax | marcus_hale | as t19; rec "" | player phone, Agent HaX contact and thread, nothing picked | about 8 s | script written, not yet run |

## Risks to check on the first run
- t10: the opening has long non-target lines; runDialogue skips them after 450 ms (partly audible, edit cuts to marks). `--imports=none` assumed to give the else-branch "Frozen or watched" line. The hook line is voiced only with its `#delivery` tag (scout: 200 with note); confirm a `line-start:` pair appears.
- t11: Hollis's cone (range 120, angle 50) may not catch the player at spawn; the take pulses toward him after 8 s. His challenge cooldown is 20 s. Check the torch beam reads at 1080p and no `player_spotted` phone text toasts over the line.
- t12: forcing thirst through `window.npcNeedsSystem.states.get(id).levels.thirst` is from source, unproven; both must reach the cooler, and the exchange needs the player within overhearRadius 360 and plays once (`heard_ex_last_two`). If it never fires in 240 s, fall back to waiting longer or a silent face shot.
- t13: the withheld ring may use a different ringer selector than `.incoming-call-answer` (m05 recruiter's); the `.call-subtitle` observer is copied from m05. Whether `enterRoom` from the server_room start fires `room_entered:operations_floor` is unverified. Bar label "The Architect", narrator voiced, `voice-distortion` fx all unverified. Hollis's sight cone is a room away (not in play).
- t14/t15: `makeBeat` offsets are the m05 Patricia ones (start [70,90], stop [30,45]); read SETUP and adjust. Elena (3,7.5) and Park (4.5,4.5) tiles; Park has a wide LOS cone (range 160, angle 140) but no challenge. Elena's `opening` menu text assumed "Finish what, exactly?".
- t16: the armed sprite and clock visibility with `cascade_armed` seeded unverified; Mercer is in the room.
- All: Mission Brief notes closed by clearScreen on head-start games; the player's own avatar sprites are never used.
- t17-t30 (23 Nov, unrun). Shared `_c7.mjs` (re-exports `_cres.mjs`/m05 RFID helpers; `PAD` digits). Digits checked by `check_digits.rb` (prints yes/no only): both pads are not a prefix of any PIN and share no digit by position with any PIN (2 PIN locks found: the badge station and the cable vault door).
- t17/t18: Hollis's sight is skipped by `hollis_resolved=evaded` (his own skipIfGlobal; only `talked` hides him). The clone is normally offered only in ink after `pressed_once` and `inside_reached`; the take calls `startRFIDMinigame` directly (m05/m06 way) after opening his chat once. Whether the server accepts the copy without the ink route is unverified; the `card_cloned` mapping (onceOnly) sets globals, harmless. Reader needs the clone's card_id to match the door's requires (scenario comment says it does).
- t18/t19/t28/t30: `architect_t20_played=true` suppresses the withheld call that fires 5 s after the first ops-floor entry (t18 enters it in setup).
- t20: the notes text (`rack_cabling_note`) says where the vault code is kept, no code; the orchestrator decides if that is a spoiler (alternative: skip it). The password panel is left empty by design. `visitor_log` and `shift_handover_sheet` (clues to the mole and the badge PIN) are deliberately not filmed; `casualty_projection` (full totals) neither.
- t21/t28/t29: leg targets are from `nearby` positions; spawn rows decide whether the leg is straight and passes the cooler; `M07_DY`, `M07_WALK` env overrides exist. Check no minigame frame at the end.
- t22/t23: both use the same door; run each on a fresh game. t23 relies on `--give generator_maintenance_key` and a key-selection label matching /maint|plant/ (falls back to the first). Elena (server_room) has no sight cone.
- t24: the ATS-1 plate sits in `backup_transfer_switch` in generator_room (same room as the pad); the take never interacts with it, but check the first and last frames for the batrack sprite.
- t26: the hub choice appears right after the line, so the menu is on screen about 0.7 s before the pick (cut after the pick); the swing detection looks for "fight" in the narrator text (unverified); chase under headless physics uses `throttleFps(20)`. `park_resolved` becomes ko in that game: use a fresh game.
- t25: Mercer only needs `scada_control` unlocked; `mercer_fate` unset so he is visible.

## Run results (24 Nov, takes agent; footage in ~/video-takes-local/m07/takes, not committed)
Avatar before: female_hacker_hood_v2; after: female_hacker_hood_v2. Rig: server :3025 and Xvfb :113 were started by the orchestrator and left running. "Frames checked" says what I looked at; everything marked "marks only" had the check-take result and marks read but no frame review.

| id | result | usable window (trimmed clock) / notes |
|---|---|---|
| t10_briefing (marcus_hale) | PASS, drop 0.25%, A/V -115/-125 ms, 38.2 s | ROUND-2 HOOK "We are faced with an impossible decision, Agent." line-start 12.44, line-end 16.56 (4.12 s). Stakes "Eight point four million people..." 30.02 to 36.30 (6.28 s). Frames checked at 12.6, 15.5, 31, 35: Netherton portrait, subtitle bar, Skip button, no menu, no player name. Menus visible 7.1-8.5, 18.4-19.5, 21.5-22.8: keep out. |
| t13c_architect_call (harjit_singh, BE_KEEP_RING=1) | PASS, drop 0.07%, A/V -35/-73 ms, 46.27 s | ROUND-2 ENDING "Four fires tonight..." voice about 37.5 to 44.0 (silencedetect; subtitle typed 34.4 to 36.6; the reply menu appears about 44.25, so cut at 44.0). Beat 7 "Don't look for the trace. It isn't there." voice about 15.8 to 18.7. Withheld ring about 9.9, answered 11.9. Frames checked (14, 16, 19, 38): terminal call screen "The Architect", no toasts. Calls emit no line-start marks, so use sub:/subfull: marks plus the audio. The call UI is the green terminal screen, not a portrait. |
| t13_architect_call, t13b | superseded. t13: PASS but an HaX toast ("You're inside...") covers the call screen about 17-21 s (beat 7 window). t13b: toast hidden only partly (bark stack, "Clear all"). t13c hides `[class*=bark]` after answering. |
| t14_elena (daniel_seo) | PASS, drop 0.06%, A/V -33/-33 ms, 52.07 s | "Forty minutes I've been at it. It's read-only. Of course it is." line-start 46.32, line-end 50.38 (4.06 s). Marks only (no frame check): menu [Finish what, exactly?] shown 36.2-37.2, do not use. |
| t15_park (frank_callahan) | PASS (2nd run), drop 0.23%, A/V -50/-32 ms, 12.3 s | Park entry line, marks and frames NOT yet read. First run failed: the Mission Brief notes minigame was open at interact; fixed by clearing the screen again at the start of the take. |
| t16_clock (vivian_ashby) | PASS, drop 0.4%, A/V -48/-50 ms, 6.4 s | hold 1.95 to 5.95, no frame check: confirm armed sprite and clock visible, Mercer in room. |
| t17_checkpoint_pads (mei_lin_chow) | PASS, drop 0.53%, A/V -85/-87 ms, 16.87 s | marks only |
| t18_rfid_reader (harjit_singh) | PASS, drop 0.72%, A/V -65/-77 ms, 11.77 s | marks only; clone acceptance and Emulate not verified in frames |
| t19_ops_pc (vivian_ashby) | FAIL (check exit 1), drop 1.04% | over the 1% gate: re-run |
| t20_server_closeups (lucia_moreno) | PASS, drop 0.43%, A/V -93/-87 ms, 21.37 s | marks only. Orchestrator decision: keep the `rack_cabling_note` shot out of every window. |
| t21_server_walk (ngozi_adeyemi) | PASS, drop 0.41%, A/V -25/-58 ms, 6.17 s | marks only |
| t22_gen_lockpick (frank_callahan) | PASS, drop 0.5%, A/V -88/-128 ms, 17.94 s | A/V end offset 128 ms is above the 33 ms gate but constant-offset corrected; marks only |
| t23_gen_key (marcus_hale) | FAIL (check exit 1), drop 1.02% | over the 1% gate: re-run |
| t24_vault_pad (daniel_seo) | PASS, drop 0.28%, A/V -37/-55 ms, 9.77 s | marks only; check first and last frames for the ATS-1 plate |
| t25_mercer_face (vivian_ashby) | PASS, drop 0.36%, A/V -25/-33 ms, 7.37 s | marks only |
| t27_walk_checkpoint (lucia_moreno) | PASS, drop 0.55%, A/V -25/-40 ms, 4.14 s | marks only |
| t28_walk_ops (harjit_singh) | PASS, drop 0.58%, A/V -48/-25 ms, 3.7 s | marks only |
| t30_phone_hax (marcus_hale) | PASS, drop 0.26%, A/V -43/-63 ms, 10.74 s | marks only |
| t11_hollis | FAIL | "Hollis never challenged" after 60 s (player spawn (160,144) is outside his cone, and the 400 ms pulses never closed the gap). Script now logs `pulse` marks and falls back to `interact('ray_hollis')` once within 110 px after 14 s: NOT re-run. |
| t12_ops_exchange | FAIL | Forcing thirst to 20 via `npcNeedsSystem.states` did not produce the ex_last_two exchange in 240 s. Not debugged. Fallback: silent face shot of the pair at the cooler, or wait for the natural cycle. Check the needs log for `exchange_started`/`exchange_unheard` and that both reach ops_cooler with a clear line to the player. |
| t26_park_fight | FAIL | same Mission Brief notes-open error as t15's first run. Apply the t15 fix (clearScreen at the start of the default export); not re-run. |
| t29_walk_genhall | FAIL | "door not in nearby": the script's door id is not in the nearby list from generator_room (nearby shows genset_control_panel, a cup). Set the leg target from the real vault door id or coordinates; not re-run. |
| t01-t04 | not run | live-mode scripts, superseded |

## Not done
- Re-run with fixes: t11 (interact fallback in place), t26 (copy t15's clearScreen fix), t29 (door id), t19 and t23 (drop over 1%, plain re-runs), t12 (debug exchange trigger).
- Frame review (contact sheets and full-res frames at marks) for t14 to t30: only t10 and t13c were checked in frames. Particular checks: t16 armed clock, t17/t18 cloner and Emulate, t20 note shot excluded, t24 ATS-1 plate, t30 phone thread, t21/t27/t28 walks end before anything opens, no "playtest" name in any chat frame.
- Sidecars (.take.json) not finished; no Netherton/Adaeze/Gwen/Elena/Park face flashes.
- Handover: scratchpad `m07-takes-handover.md`. Run all with `MISSION=m07 scratchpad/run.sh <avatar> <take> "<flags>" "<rec>"`; `scratchpad/m07all.sh` holds every flag set.

## Older not-done list (superseded by the one above)
- Run every script (serial, on the free rig): fill lengths, drop %, A/V offsets and frame notes; check marks against frames (minigame marks drift).
- Not written: Netherton/Adaeze/Gwen/Elena/Park face flashes (they carry lines), the pc container and situation-board chart shots (optional), the debrief. Check whether t26 should film the menu or whether the edit cuts around it.
- First-run unknowns above (clone acceptance, wall coordinates for walks, key-selection label, swing text).

## Orchestrator decision (23 Nov)
- `rack_cabling_note` (t20) says where the vault code is kept: a puzzle clue. Keep it out of every window; film t20 for the SCADA panel and the flag station only.

## Round-2 lines: which script films them (24 Nov)
Owner's round-2 lines (docs/video/edits/TRAILER_LINES_ROUND2.md) checked against ink and scripts. The picks file already names these lines; nothing in it is overridden.
| line | script | state |
|---|---|---|
| Netherton hook "We are faced with an impossible decision, Agent." (`m07_opening_briefing.ink:104`, `delegation_intro`, 4.10 s) | t10_briefing: [Understood. Talk to me about the other three.] then target regex `impossible decision`; plays after the narrator's "The line holds..." beat | unchanged, matches |
| Architect ending "Four fires tonight, and only one of you. I set them so you'd have to choose." (`m07_architect_comms.ink:96`, `taunt_t30`, 7.06 s) | t13_architect_call: `room_entered:operations_floor` ring after 5 s, answered, plays through to the menu after the line | changed: a `.call-subtitle` observer now marks `ending-line-start`, the take throws if that subtitle never appears, and it stays open 7.6 s from the subtitle (`ending-line-end`) |
Risks to check on the first run (round 2):
- t13 does not ring if `architect_t20_played` is set (the flags above do not set it). A missed or declined ring goes to voicemail (`taunt_t30_vm`), so the take must answer within the ring.
- The call screen shows only the newest subtitle: the "Four fires" subtitle mark can lag the audio by 0.1 to 0.2 s; align by ear.
- If the call UI auto-closes right after the line (no menu), `playThrough` ends early; the 7.6 s hold still covers the clip.

## Session 3 (24 Nov, later): reruns and frame review
Avatar before: female_hacker_hood_v2. Scripts committed: t11b, t19b/c, t23b/c, t26b, t29b/c, t20b (written, not run). Windows are trimmed-clock seconds. Frames with the demo name "playtest" (player portrait in a chat) must stay out of every window.

| id | result | usable window and notes |
|---|---|---|
| t11b_hollis (ngozi_adeyemi) | PASS, drop 0.26%, A/V -85/-82 ms, 36.2 s | torch/map 0-14 s; "Building's evacuating..." about 17.0 to 23.9 (menu appears about 24); "Walk away. Right now. I'm asking." about 31.0 to 34.8 (menu 35). "playtest" portrait frames at about 26 and 30: keep out. Interact fallback worked. |
| t26b_park_fight (mei_lin_chow) | PASS (2nd attempt), drop 0.74%, A/V -78/-77 ms, 22.4 s | line 8.4 to 11.8; menu 12.3 to 15 (skip); "playtest" frame about 15 (keep out); "Right." 16.3 to 17.3; swing narration 17.9 to 19.8. First 7 s show the Mission Brief notes (0) and the "Welcome to Hacktivity Games" tutorial popup (about 2): keep out. First attempt failed because throttleFps(20) in setup stopped the approach (Park at 68 px): throttle now set after the line. No chase on screen, narrator text only. |
| t19b_ops_pc | FAIL, drop exactly 1.00% | shows a notes panel ("Abandoned Operator Workstation", grid read-only view text, no codes), about 2 to 7 s. t19c rerun was in flight when this session stopped. |
| t23b_gen_key | FAIL, drop 1.01% | frames fine: key select 3 to 5, key turn 5 to 12 (usable if the gate is waived). t23c rerun in flight. |
| t29b_walk_genhall | FAIL, drop 1.68% | no door id for the vault in `nearby`, so the script now walks straight down from spawn (fallback). Frames fine: hall, no ATS plate legible. t29c rerun in flight. |
| t20_server_closeups | PARTIAL | frame review: the SCADA panel (empty field) is usable at about 5.1 to 7.9. The note was opened and `closeAll` never closed it, so the flag-station shot never filmed (the note stayed on screen 12 to 21 s). Note shot excluded by orchestrator anyway. t20b (panel + station only) written, not run. |
| t12_ops_exchange | NOT FIXED | read-only source check only. Exchange runs only when two NPCs chat at the same object (cooler) with requireGlobal ops_staff_upset=false and ops_staff_gone=false (both default false), player within overhearRadius 360 of the first speaker. Next: log `window.npcNeedsSystem.log` for adaeze/gwen (urgent, use_started, chat) after setting levels.thirst=20; Gwen is `seated` at her console and may need `needsHome` use release. Fallback if it fails: silent face shot of the pair. |

Frame review (contact sheets, full-res where noted), no PIN, code or flag value seen in any window:
- t14_elena: line 46.3 to 50.4 clean, no name; "playtest" portrait at about 37 to 38 (keep out); menu from 51.
- t15_park: line 7.3 to 10.6 (marks); notes (0) and tutorial popup (about 2) in the first 5 s, keep out; menu from 11.6.
- t16_clock: room small in frame; red display and Mercer visible; hold 1.9 to 5.9. Not checked at full res.
- t17_checkpoint_pads: badge pad 2 to 8 s shows three typed digits (decoys, checked not a prefix of any PIN); cloner on Hollis (name blurred) 10 to 13 s; "Saved Server Zone Badge" toast text at 12 to 13 (shows badge name, no value).
- t18_rfid_reader: reader and "Access Granted" 2 to 8 s; card name "Server Zone Badge" shown. Emulate accepted.
- t21/t27/t28: walks end before anything opens; rooms small in frame (edit zooms).
- t22_gen_lockpick: lockpick 2.6 to 15; last 2 s show the next room dark: cut at about 15.5.
- t24_vault_pad: pad shows decoy digits, 2 to 8 s; no ATS plate in the first or last frames (full-res check of the first frame not done; generator hall visible only).
- t25_mercer_face: Mercer bust 2.1 to 4.6, narrator text only, no menu.
- t30_phone_hax: HUD visible 0 to 1.5 (cut), thread 4 to 10 s. The thread text names the badge station and "with its PIN" (no digits): a mild clue, owner's call.
- Sidecars: check-take writes `<id>.take.json` for every take that ran through it; nothing extra was written by hand.
- Face flashes: Netherton (t10), Hollis (t11b), Elena (t14), Park (t15, t26b), Mercer (t25) are covered. Adaeze and Gwen only via t12 (open).

## Not done (end of session 3)
- t19c, t23c, t29c: reruns were running when I stopped (batch `scratchpad/m07c.sh`); read their `.check.json` in `~/video-takes-local/m07/takes/` and log pass/fail and windows. Whatever drop % they show, if still over 1% accept with a note or retry once (drops look rig-load related, not script-related).
- t20b_server_closeups: run (avatar lucia_moreno, flags as t20).
- t12_ops_exchange: debug as in the table, at most about 15 calls, else fallback face shot of Adaeze and Gwen.
- Avatar: read selected_sprite after the last take; it must be female_hacker_hood_v2 (read vivian_ashby mid-take, restored by run-take at the end).

## Session 4 (24 Nov): finishing
Avatar before: female_hacker_hood_v2. Windows are trimmed-clock seconds. No "playtest" portrait appears in any window below; no PIN, code or flag value seen.

| id | result | usable window and notes |
|---|---|---|
| t19c_ops_pc (vivian_ashby) | FAIL gate (drop 1.02%), A/V -78/-83 ms (constant-offset corrected, residual 2/-3), 7.7 s | usable, gate waived (drops <=1.7%, check the window in the edit). Content as t19b: room 0 to 1.9, then the "Abandoned Operator Workstation" notes panel (read-only grid view text, no codes) 2.0 to 6.2. Suggested window 2.0 to 6.0. Marks: pc-open 3.58 (clock offset in the markers file), pc-held 6.18. |
| t23c_gen_key (marcus_hale) | PASS, drop 0.61%, A/V -95/-150 ms (corrected, residual 27/-28), 14.4 s | key mode about 4.2, key selected ("Plant Maintenance Key") 5.7, key turn 7.2, door open 12.9. Suggested window 3.0 to 13.5. Supersedes t23b. |
| t29c_walk_genhall (marcus_hale) | FAIL gate (drop 1.68%), A/V -103/-110 ms (corrected), 3.9 s | usable, gate waived (drops <=1.7%, check the window in the edit). Straight walk down the generator hall from spawn, no ATS plate legible. Suggested window 0.0 to 3.8 (walk-end 2.4). |
| t20b_server_closeups (lucia_moreno) | PASS, drop 0.52%, A/V -82/-87 ms, 17.2 s | no cabling note. SCADA panel (empty field, "Enter password" box) 5.1 to 7.9; flag station (empty field, "No flags submitted yet", "ENTROPY's backup host" tag) 12.6 to 15.75. Suggested windows 4.8 to 8.0 and 12.4 to 15.8. Walk-between shots 0 to 4.5 and 8 to 12 show the room only. |
| t12_ops_exchange (lucia_moreno) | PASS (3rd run), drop 0.27%, A/V -93/-90 ms, 34.3 s | The exchange does play: both staff walk to ops_cooler at thirst 20, `exchange_started` ex_last_two at 9.0, `exchange_heard` complete at 32.6 (game log events). Four voiced lines with speech bubbles over the room (wide shot, player at (160,160) idle, no portraits): "The muster board still has us missing." 9.0 to 11.3, "Somebody ought to cross us off." 13.8 to 16.0, "And the coffee machine is still broken." about 18.7 to 21.6, "Still broken, still nobody's job." 23.7 to 26.3, "At least the water is cold." 28.5 to 30.2. Suggested window 8.8 to 30.5. Both staff are small in frame (edit zooms). |

t12 cause: nothing was wrong with the trigger. Earlier failures were the script waiting on `watchVoice`, which never sees exchange lines; the script now polls `window.npcNeedsSystem.log` for `exchange_started` / `exchange_heard` (ev/knot fields) and the player stays at spawn, not at the cooler. Run 1 with debug snapshots (thirst set to 20) showed both NPCs `urgent`, `job_start` ops_cooler, `using`, then `exchange_started` about 8 to 9 s into the take. Gwen was not seated at start in this entry state (`seated` false), so no release was needed. The 400 ms Mission Brief/tutorial overlays were not on screen in this take.
