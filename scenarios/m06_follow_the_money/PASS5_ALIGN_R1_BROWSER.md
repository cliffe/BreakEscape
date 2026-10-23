# m06 pass 5, alignment round 1: browser check (targeted, Sonnet-class run)

**Question answered:** plumbing of the round-1 changes (and, per the coordinator's late message, the round-2 changes). Targeted regression, not blind. Flags were supplied from the session seed ("flag supplied"); everything downstream of flag 3 is exercised, not proven. Slots/PINs (bitcoin2025, 3110, 4471, 2140) were known, not earned from the in-game clues in these runs (I did not visit the blockchain lab).
**Environment:** keyless :3001 only, headless (load average about 10). Own games only. All three sessions stopped.

## Builds (important)
| Game | Build it ran on | Purpose |
| --- | --- | --- |
| 2232 (A) | **Old build, HEAD ef4d1057** (round 1). Played 15:22-15:36 UTC. | cover held; F1; Irina detained; ending; music; credits |
| 2235 (B) | **Round-2 build** (working tree at 15:38 UTC; landed as a1699fa8). The minder ink was recompiled 15:39 BST mid-run. | strained cover + recruited Irina; vouch; Satoshi strained opener; debrief at HQ |
| 2237 (C) | **Round-2 build, a1699fa8** | strained; Irina detained and relayed; locked Satoshi door; hostile minder; KO key drop |

Game A's minder shows the old behaviour (no locked door; Satoshi's office entered unopposed), as the coordinator expected.

| Game | Session log | Flags XML | Lines |
| --- | --- | --- | --- |
| 2232 | tools/playtest/m06-pass5-align-r1-A-session.jsonl | tools/playtest/m06_follow_the_money-flags-game2232.xml | 460 |
| 2235 | tools/playtest/m06-pass5-align-r1-B-session.jsonl | tools/playtest/m06_follow_the_money-flags-game2235.xml | 252 |
| 2237 | tools/playtest/m06-pass5-align-r1-C-session.jsonl | tools/playtest/m06_follow_the_money-flags-game2237.xml | 470 |

Screenshots: session scratchpad `m06-align-r1-browser/` (A01-A17, B01-B04, C01-C06). I looked at A04, A07, A08-A11, A13, A14, B04, C02, and the rest by DOM/log reads.

## Results by check
| # | Check | Build | Result | Evidence |
| --- | --- | --- | --- | --- |
| 1a | Minder walks his beat | A, C | **PASS** | Recorder at 10 Hz: west end x=459, east end x=573 (about 114 px between the two waypoints), speed about 40 px/s. Cycle about 14.3 s: west dwell facing west about 4.2 s, walk east facing east about 2.8 s, east dwell facing east about 4.6 s, walk west facing west about 2.2 s. Matches the 4.5 s/3.5 s config. Scratchpad file A_rec1.json (A); in-page recorder (C). |
| 1b | Cone drawn | A | **PASS** | A10: green cone and circle drawn in the wing, pointing east while he faces east. |
| 1c | Sight challenge fires | A, B, C | **PASS** | `player_spotted:satoshi_minder` event (A drain seq 125), opener "The FCA does not come up here." Re-fires after the 20 s cooldown with "I told you once" (B, C), including while the player merely stands in view. |
| 1d | Talk-past while cover holds | A | **PASS** | "The FCA. Mr Nakamoto's compliance file has my name on it." sets `minder_passed`; credits "Talked your way past him". (A used the old ink.) |
| 1e | Strained: only "Dr Volkova sent me up" works | B (recruited), C (not) | **PASS** | B: first challenge offers Volkova / FCA routine / Wrong floor; FCA routine goes to cover_blown ("Mr Nakamoto's phone has been ringing about you"), then standoff offers Volkova / step aside / back off; Volkova works (`minder_passed`, door unlocked). C (Irina not recruited): no Volkova option anywhere; only FCA routine and Wrong floor. |
| 1f | Squaring up makes him hostile | C | **PASS** | "Then step aside, or I'll move you." then `minder_hostile` set, playlist goes threat. |
| 1g | Slip-past window | C | **PASS, measured** | Player standing at the west door: visible only while he is at the west end facing west (x below about 478): about 4.5 s of each 14.3 s cycle, so about 9.7 s hidden. Crossing west door to the north door took about 2.7 s unseen (player entered when he turned east). At the north door (x=577) he sees the player twice per cycle for about 2.1-2.3 s each (when he starts walking east, x 458-545), so about 12 s blind per cycle there. A pick must start in a blind stretch. |
| 2 | Cover strain: `cover_strained` set | B, C | **PASS** | Caught by guard picks: `guard_grace`, `guard_caught`, `cover_strained` set. |
| 2 | HaX text arrives | B, C | **PASS** | "The guard saw your picks. He'll ring the FCA to check on you, and they've never heard of you." about 3 s after the guard chat closes (round-2 per-cause text; the round-1 generic text no longer exists). Not run: KO and Irina-suspicious causes (route driver covers them). |
| 2 | Irina's line changes | B | **PASS** | At trust 30 under strain: "Someone on the floor has been asking whether you are who you say you are. Until they stop, my badge stays on my neck."; at trust 35 she lends it. |
| 2 | Satoshi's opener changes | B, C, A | **PASS** | Strained: "Somebody on my floor rang the FCA an hour ago. They've never heard of you." plus (C) "And I heard Kemal hit the floor." Held (A): "Your paperwork was good. I had you checked anyway." + "Kemal let you in". |
| 3 | Irina detained then hidden | A, C | **PASS** | After detaining she is still visible; entering the server room sets `irina_taken`; back on the floor `sprite.visible=false`, alpha 0 (A13). After a page reload (resume overlay clicked via DOM) still hidden (A14). HaX text "Police are on their way up for her..." arrived. |
| 3 | HaX relayed items | C | **PASS** | HaX hub offers "I need the executive badge she signed out." and "I need her office badge." only after she is gone; the relayed "Executive Badge (relayed copy)" reached the inventory and the wing door opened. Office badge relay not taken. |
| 4 | F1: lent CTO badge | A | **PASS, no defect** | `#give_item:keycard:cto_access_badge` resolves: "CTO Access Badge" in inventory, `irina_badge_obtained` set, door events `door_unlock_attempt, door_unlocked, door_opened` on the west door of the trading floor. The tag/id mismatch is harmless. |
| 5 | All 4 flags plus both decisions do not open the debrief | A | **PASS** | After Satoshi's freeze with Irina already detained: playlist went to `end`, `ready_to_extract` set, no `start_debrief_cutscene`, 16 s later HaX: "That's both calls made, and the backend's done. Look round if you want, then call me and I'll bring you in. His safe's still shut, if that matters to you." |
| 5 | Safe, reload, call-in, debrief, credits | A | **PASS** | Safe 2140 opened, identity file taken, HaX "Tesseract..." text; reload (A: playlist stayed `end`); phone shows "I'm done here. Bring me in." then "Bring me in." then "On my way." Debrief opened (`start_debrief_cutscene`, `debrief_played`); credits read from `#bv-cr-label`; track "Digital Leashes", playlist `victory`. |
| 5 | Debrief opens directly at HQ (round 2) | B, C | **PASS** | B04: the debrief's first line, "SAFETYNET headquarters. The handler's office...", opens straight over the satoshi office with no phone hand-off. Safe still shut: "His safe's still shut, for one." in the call-in and "You left Satoshi's safe shut" in the debrief. |
| 6 | Music | see table | **PASS** | below |
| 7 | Flag rewards | A | **PASS** | Flag 1 and 2 set `flag1_submitted`/`flag2_submitted`; the drop-site shows "Flag accepted" and "Task Complete" only, no "Event triggered" (A04). HaX flag-2 text "Second account. One password, two boxes..." arrived (after flag 1 text "First account's yours. People here reuse passwords..."). In the round-2 build the flag-2 text is delayed to 5.5 s. |
| 8a | HaX phone avatar is her headshot | A | **PASS** | Visible contact image src `agent_hax_headshot.png` (A07: a figure in a trench coat and hat). |
| 8b | Guard says "Evening" | A, B, C | **PASS** | "Evening. Floor's restricted. Who are you?" and "Lobby's that way." |
| 8c | Lockpicking guide offered | A | **PASS** | `lockpick_guide_offered` on entering the checkpoint; "Send me a field guide." then "Lockpicking." put "SAFETYNET Field Guide: Lockpicking" in the inventory; HaX "The checkpoint door's a cheap lock. The guard's the hard part. Pick while his back's turned." |
| R2a | Satoshi's door locked, Kemal holds the key | C | **PASS** | Door is a lockpicking minigame for a player without the key; B (Volkova vouch) and A-style talk-past unlock it via `#unlock_door`. Not tested: a talk-past on the round-2 ink with the cover held (only A, on the old ink, and B/C strained). |
| R2b | KO drops the key | C | **PASS (assisted)** | `debugKO` on the minder (not a fought KO): "CEO's Office Key" appears in the wing and is taken; HaX text "His minder's down." |
| R2c | A pick he sees triggers a stand-off | C | **NOT CONFIRMED** | I used `completeLockpick` (the assisted exception) while `isInLineOfSight` was true. What opened was the ordinary sight challenge ("I told you once"), not `on_lockpick_seen`. The door opened. I cannot tell whether the `lockpick_used_in_view` mapping fires on an assisted completion. Needs a real pick or a note from the engine owner. |
| R2d | Each cause of strain has its own HaX text, staggered | C, B | **PARTIAL** | Guard-catch text confirmed (about 3 s after the close). KO, Irina-suspicious and Volkova-didn't-buy-you texts not exercised here. |

### Music playlists (A unless noted; read from `MusicController._currentPlaylistKey`)
| Moment | Playlist |
| --- | --- |
| Briefing, first run | cutscene (not recorded; briefing played by converse) |
| After the briefing, day phase (before the fund) | noir |
| Fund found (A, B, C) | spy-action |
| Reload in the fund phase (A) | spy-action |
| Minder turned hostile (C) | threat |
| After the KO of the hostile minder (C, assisted) | spy-action (back to the phase cue) |
| Money settled (A, B, C) | end |
| Reload after money settled (A) | end |
| Debrief start | end |
| Credits | victory, track "Digital Leashes" |
| Reload in the day (noir) phase | **not run** |
| A fought (not assisted) fight | **not run** |

## Severity table
0 blockers, 0 majors, 5 minors.

| # | Sev. | Finding | Repro |
| --- | --- | --- | --- |
| N1 | minor (unverified) | A pick Kemal sees might not open `on_lockpick_seen`; with `completeLockpick` I got the sight challenge instead. May be the harness exception only. | Game C: strained cover, stand at his north-door blind spot, wait for `isInLineOfSight` true, `mg completeLockpick`. Chat: "I told you once." |
| N2 | minor | Kemal's stand-in portrait is a young, dark-haired man; the text says late fifties, grey at the temples. Known (character stage). | A11, C02 |
| N3 | minor | The challenge re-fires every 20 s if the player simply stands in his view after backing off, so a player pondering the corridor gets the same chat again. Intended by the cooldown, but long thinking time costs a re-open. | B, C: stand at the west door for 20 s after "Wrong floor" |
| N4 | minor | Satoshi's door pick spot (577,-851) is visible to Kemal for about 2.2 s twice per 14 s cycle; a slow lockpick can be seen mid-way. Worth a note for the puzzle stage. | C: recorder around t=119.8 s and 134.0 s |
| N5 | minor (carried) | Guard's green cone and circle still draw in later rooms; objectives panel clips lower tasks. Both seen in A13/A14 (already E2/E3 in the regression report). | any run past the checkpoint |

Notes that are not findings: no resume overlay on the first reload in A, the overlay showed on later reloads (clicked "Resume" by exact text through the DOM, as the skill says); HaX's debrief says "His minder's in custody too" after the KO (C); the wing's Satoshi door is not a normal `doors` entry once open.

## verify-run.rb output
Game 2232 (A):
```
game            2232  (mission 50)
created         2026-10-13 15:22:28 UTC
last write      2026-10-13 15:36:35 UTC
played for      847s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, security_checkpoint, trading_floor, irina_office, server_room, data_center, executive_wing, satoshi_office
unlocked objs   2: cold_storage_console, executive_safe
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, SAFETYNET Field Guide: Lockpicking, Password Dictionary List, CTO Access Badge, Door Controller Export, Cold Storage Recovery Keys, The Architect's Fund Allocation, Executive Access Badge, The Architect's Identity File
NPCs met        10: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_6b0b87}, flag{m06_follow_the_money_hackme_crack_me_lab_2_ea3e7e}, flag{m06_follow_the_money_hackme_crack_me_lab_3_70ae81}, flag{m06_follow_the_money_hackme_crack_me_lab_4_150d0d}
globals set     39: architect_identity_found, assets_decided, assets_seized, briefing_played, cracking_guide_offered, debrief_played, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_password_lists, found_wallet_keys, fund_debrief_available, guard_resolved, guard_waved_through, irina_arrested, irina_badge_obtained, irina_exec_badge_given, irina_fate_decided, irina_taken, lockpick_guide_hint_given, lockpick_guide_offered, minder_passed, player_name, privesc_guide_offered, ready_to_extract, recon_guide_offered, resolve_aim_open, rfid_guide_offered, satoshi_

VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```
Game 2235 (B):
```
created         2026-10-13 15:38:19 UTC
last write      2026-10-13 15:44:59 UTC
played for      400s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, security_checkpoint, trading_floor, server_room, data_center, executive_wing, satoshi_office
unlocked objs   1: cold_storage_console
inventory       12: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Password Dictionary List, CTO Access Badge, Door Controller Export, Cold Storage Recovery Keys, The Architect's Fund Allocation, Executive Access Badge
NPCs met        10: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_0ad18a}, flag{m06_follow_the_money_hackme_crack_me_lab_2_09fe91}, flag{m06_follow_the_money_hackme_crack_me_lab_3_6fcf42}, flag{m06_follow_the_money_hackme_crack_me_lab_4_23e73a}
globals set     36: assets_decided, briefing_played, cover_strained, debrief_played, engine_tutorial_declined, entered_data_center, exchange_infiltrated, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_password_lists, found_wallet_keys, fund_debrief_available, guard_caught, guard_resolved, guard_waved_through, irina_badge_obtained, irina_exec_badge_given, irina_fate_decided, irina_recruited, lockpick_guide_offered, minder_challenged, minder_passed, monitoring_enabled, player_name, privesc_guide_offered, ready_to_extract, resolve_aim_open, rfid_g

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```
Game 2237 (C):
```
created         2026-10-13 15:46:16 UTC
last write      2026-10-13 15:55:02 UTC
played for      526s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, security_checkpoint, trading_floor, server_room, data_center, executive_wing, satoshi_office
unlocked objs   1: cold_storage_console
inventory       12: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Password Dictionary List, Door Controller Export, Cold Storage Recovery Keys, The Architect's Fund Allocation, Executive Badge (relayed copy), CEO's Office Key
NPCs met        10: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_99c2ec}, flag{m06_follow_the_money_hackme_crack_me_lab_2_cc2533}, flag{m06_follow_the_money_hackme_crack_me_lab_3_cb921d}, flag{m06_follow_the_money_hackme_crack_me_lab_4_3d517c}
globals set     40: assets_decided, briefing_played, cover_strained, cracking_guide_offered, debrief_played, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_password_lists, found_wallet_keys, fund_debrief_available, guard_caught, guard_resolved, guard_waved_through, irina_arrested, irina_exec_badge_given, irina_fate_decided, irina_taken, lockpick_guide_offer

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```
