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

## Risks to check on the first run
- t10: the opening has long non-target lines; runDialogue skips them after 450 ms (partly audible, edit cuts to marks). `--imports=none` assumed to give the else-branch "Frozen or watched" line. The hook line is voiced only with its `#delivery` tag (scout: 200 with note); confirm a `line-start:` pair appears.
- t11: Hollis's cone (range 120, angle 50) may not catch the player at spawn; the take pulses toward him after 8 s. His challenge cooldown is 20 s. Check the torch beam reads at 1080p and no `player_spotted` phone text toasts over the line.
- t12: forcing thirst through `window.npcNeedsSystem.states.get(id).levels.thirst` is from source, unproven; both must reach the cooler, and the exchange needs the player within overhearRadius 360 and plays once (`heard_ex_last_two`). If it never fires in 240 s, fall back to waiting longer or a silent face shot.
- t13: the withheld ring may use a different ringer selector than `.incoming-call-answer` (m05 recruiter's); the `.call-subtitle` observer is copied from m05. Whether `enterRoom` from the server_room start fires `room_entered:operations_floor` is unverified. Bar label "The Architect", narrator voiced, `voice-distortion` fx all unverified. Hollis's sight cone is a room away (not in play).
- t14/t15: `makeBeat` offsets are the m05 Patricia ones (start [70,90], stop [30,45]); read SETUP and adjust. Elena (3,7.5) and Park (4.5,4.5) tiles; Park has a wide LOS cone (range 160, angle 140) but no challenge. Elena's `opening` menu text assumed "Finish what, exactly?".
- t16: the armed sprite and clock visibility with `cascade_armed` seeded unverified; Mercer is in the room.
- All: Mission Brief notes closed by clearScreen on head-start games; the player's own avatar sprites are never used.

## Not done (next agent)
- Crescendo/minigame chain (badge station PIN `badge_printer` with wrong digits and no ENTER, vault PIN door, RFID cloner on Hollis then reader on the server-room door, `door:server_room->generator_room` lockpick, key lock with `generator_maintenance_key`, SCADA password panel empty/z q x, pc `ops_floor_workstation`, notes, phone chat, fingerprint kit, flag station `flag_station_safetynet_relay`). PINs for the pads: pick digits and prove with a prefix-only script; ATS-1 plate must stay out of every vault frame.
- Walk to the VM (`vm_launcher_attack_terminal` is in server_room), stop before it opens (copy m06 t22 pattern).
- Park's fight (goes_loud swing) and generator-door lockpick beat (generator_room is a key door; use `_cres.mjs` pickLock from m06 against `door:server_room->generator_room`).
- Face flashes (Mercer in scada_control; others carry lines), walking shots (checkpoint towards Hollis, ops floor past the cooler, generator hall), HaX phone thread.
- Run everything; fill lengths, drop %, offsets and frame notes. Pad digit check not yet written.
