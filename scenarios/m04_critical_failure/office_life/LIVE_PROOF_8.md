# m04 office life: live proof 8 (L8, player KO and Restart)

Game 8161, a fresh `new-game.rb` run with no `--set`, no row edits and no globals set in the page. Keyless server on :3097 (puma PID 2162290, left running), headless Chromium, fast speed, flags from `tools/playtest/m04_critical_failure-flags-game8161.xml`. Session log: `tools/playtest/m04_critical_failure-session-g8161.jsonl` (85 commands, untracked). Host load was about 170 to 185 during the run, so timings are not representative.

Summary: every L8 check passes. After Restart, Ibrahim is calm, not KO, back in his seat, and gives the curt line on both talks. One value is off the configured 4: his `attackDamage` reads 10 after Restart. It was read on a calm NPC, so it is recorded as seen and not counted as the Restart behaviour failing. Joanne was never struck, so her reading is not a hostile value.

## Steps

| # | Step | Expected | Seen | Result |
|---|---|---|---|---|
| 1 | `bootstrap` with `autoBrief` on the fresh game | Settled in `main_entrance`, HP 100, no OTHER SESSIONS | Settled, `main_entrance`, HP 100, trace names no other session | PASS |
| 2 | `converse` Ibrahim, talk 1 (before any strike) | Normal line | Verbatim below | PASS |
| 3 | `converse` Ibrahim, talk 2 (before any strike) | Normal line again | Same line as talk 1 | PASS |
| 4 | `converse` Joanne, before any strike | Normal line | Verbatim below | PASS |
| 5 | Move to (184,231): Ibrahim 31 px east at (215,228), Joanne 55 px east at (239,227). One punch, `playerCombat.attack({x:215,y:228})` | Ibrahim hostile, not KO, `aes_staff_off` and `ops_kettle_off` true | Hostile on the first swing, `currentHP` 90, `isKO` false, `attackDamage` 4. `aes_staff_off` and `ops_kettle_off` true | PASS |
| 6 | Hostile Ibrahim chases and hits the player (seated strike, so he has to walk up) | 4 HP per hit | Drops of 4 about every 2 s. Samples: 52, 48, 44, 40, 36, 32, 28, 24 | PASS |
| 7 | Reload while Ibrahim is hostile and not KO. Sync first, then reload with `?skip_resume=1` | Hostile, not KO, `attackDamage` 4 | Pre-reload: HP 12, `isHostile` true, `isKO` false, `currentHP` 90, `attackDamage` 4 | PASS |
| 8 | `bootstrap` after the reload | Resumes the same game | "Continue?" cleared, settled. HP 4 at this point | PASS |
| 9 | `attackDamage` read after the reload, Ibrahim still hostile and not KO | 4 | 4, with `isHostile` true and `isKO` false. Read at HP 0 (see note) | PASS |
| 10 | Player KO | "KNOCKED OUT" overlay with Restart and Main Menu | `blockingUi` "KNOCKED OUT", buttons Restart and Main Menu, HP 0 | PASS |
| 11 | `dismiss` "Restart" | HP 100, reload into the start room | Reloaded into `main_entrance`, HP 100 at (160,144) | PASS |
| 12 | Ibrahim after Restart | Calm, not KO, at his seat | `isHostile` false, `isKO` false, at (215,228) | PASS |
| 13 | Ibrahim `attackDamage` after Restart | 4 (config) | 10, read on the calm NPC (see note) | FAIL on the value; the Restart behaviour is unaffected |
| 14 | Talk 1 after Restart | Curt line | Verbatim below | PASS |
| 15 | Talk 2 after Restart | Curt line | Same as talk 1 | PASS |
| 16 | Globals after Restart | `aes_staff_off` true, `ibrahim_ko` false, `joanne_ko` false | `aes_staff_off` true, `ops_kettle_off` true, `ibrahim_ko` false, `joanne_ko` false, `crew_warned` false | PASS |
| 17 | Joanne state after Restart (she was never struck) | Calm, not KO | `isHostile` false, `isKO` false, `attackDamage` 10 | Recorded. The 10 is the default state this read creates, not a hostile value |
| 18 | Joanne evacuation bark | Not reached (needs `crew_warned` and Joanne not KO) | Not heard | Not run |
| 19 | `verify-run.rb 8161` | Not a pass criterion for this route | `VERDICT: BOOTSTRAP ONLY` (output below) | Expected for this route |

The seated attack landed on the first swing, so it counts as one try with no misses. That is the second seated-attack case in the R3 m3 list.

## Verbatim lines

- Ibrahim, normal (talk 1, before strike): `Ibrahim Diallo: Hello. I'm waiting on the office desktops to image. The swap was booked late, so I won't be on tonight's list.`
- Ibrahim, normal (talk 2, before strike): identical to talk 1.
- Joanne, normal (before strike): `Joanne Pell: Hiya, duck. I've a dozen inductions at six, so I came in early to get ahead. Don't mind me.`
- Ibrahim, curt (talk 1 after Restart): `Ibrahim Diallo: I'll keep to my work, if it's all the same to you.`
- Ibrahim, curt (talk 2 after Restart): identical.
- Joanne bark: not heard, see step 18.

## `attackDamage` readings

| Newcomer | When read | `isHostile` | `isKO` | `attackDamage` | Note |
|---|---|---|---|---|---|
| Ibrahim | After the first punch | true | false | 4 | Matches config |
| Ibrahim | Before the reload (HP 12) | true | false | 4 | Matches config |
| Ibrahim | After the reload, still hostile (HP 0 at the read) | true | false | 4 | The restored hostile reading is 4, not 10 |
| Ibrahim | After Restart, calm, after two talks | false | false | 10 | Calm and not KO, so the configured hostile value is not expected here |
| Joanne | After Restart, never struck | false | false | 10 | Default state built by this read |

For the Ibrahim calm reading, either Restart leaves no state and my read built the default, or the reset rewrites it to the default. This run cannot tell those apart. The 10 is the default-state value named in the handover, not 4.

For Joanne, reading before any hostile turn creates the default, so her 10 is not a measurement of her hostile damage. She was not struck, so the reload-while-hostile case does not apply to her in this run.

## Notes

- Ibrahim KO was not reached, so the restored-KO 10 quirk was not tested.
- The player's position changed during the hits without any command: from (184,231) to (41,187) over about 15 s. The cause was not checked.
- The first read after the reload was at HP 0. Ibrahim was hostile and not KO when read, and the damage figures come from the HP drops before that.
- `verify-run.rb` gives BOOTSTRAP ONLY because this route never left reception. It proves nothing about the L8 state, and the L8 checks above do not depend on it.
- The game was sampled through `window.__test` and `window.npcHostileSystem.getState` only. No game row was edited.

## Verifier output (`BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb 8161`)

```
game            8161  (mission 109)
created         2026-11-18 00:47:18 UTC
last write      2026-11-18 00:51:44 UTC
played for      267s of wall clock
current room    "main_entrance"
unlocked rooms  1: main_entrance
unlocked objs   0: 
inventory       6: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad
NPCs met        9: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, ibrahim_diallo, joanne_pell
flags submitted 0: 
globals set     11: aes_staff_off, blackout_named, briefing_played, disclosure_choice, engine_tutorial_declined, guard_admitted, m03_danny_fate, m03_victoria_fate, ops_kettle_off, player_name, promised_voltage_alive
access model    nothing recorded (no sessions, sign-ins, card copies, copied files, failed sign-ins or footholds)
tasks           0 in objectivesState, 0 completed
tasks_completed 0
score           0
social scenario false (completed tasks do not count; pass --tasks to count them)

VERDICT: BOOTSTRAP ONLY — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Nothing here could only have come from playing: the player never left
the starting room, opened anything, or submitted a flag. Globals and
encountered NPCs are set by mission setup and the opening cutscene, so
they are not evidence. A report claiming steps is unsupported.
```

## Result

| Check | Result |
|---|---|
| Seated strike, Ibrahim hostile, not KO | PASS |
| Hostile hits are 4 each | PASS |
| Reload while hostile, not KO: `attackDamage` 4 | PASS |
| KO as player, Restart screen | PASS |
| Restart: HP 100, Ibrahim calm, not KO, seated | PASS |
| Restart: Ibrahim `attackDamage` 4 | FAIL on value (10 read on a calm NPC) |
| Restart: curt line on both talks | PASS |
| Joanne normal line and `attackDamage` | Recorded, reading not a hostile value |
| Joanne bark | Not run |
