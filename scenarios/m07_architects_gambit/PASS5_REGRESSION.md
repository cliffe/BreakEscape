# m07 The Architect's Gambit: pass 5, stage 1 regression run

Date 2026-10-13. Keyless server :3001 (:3000 untouched). Headless (load average about 21 at the start, so headed was not an option), speed fast. Regression run against today's engine, not blind. It answers the plumbing question plus the stage-1 engine checks in `docs/agents/M07_PASS_BRIEF.md`. Step source: `TESTING_WALKTHROUGH.md` and `PASS4_PLAYTEST.md`. Wall clock for the game was 1300 s (about 22 minutes; the brief asked for 10 to 15, the extra went on reading every NPC branch and screenshots).

Counts: **0 blockers, 3 majors, 16 minors.** The credits were reached.

## Game and logs

| Game | Session log | Result |
|---|---|---|
| 2376 | `tools/playtest/m07-pass5A-game2376.jsonl` (1574 lines) | credits reached, `mission_complete` set, 2 page reloads |

Flags XML: `tools/playtest/m07_architects_gambit-flags-game2376.xml`. Screenshots are in the session scratchpad, `m07-regression-A/` (files 01 to 34, cited by number). The session is stopped. One `playtest-session.js` process is still running for game 2381 (m06); it is another agent's, not mine.

## verify-run.rb (game 2376, pasted)

```
game            2376  (mission 51)
created         2026-10-13 22:19:06 UTC
last write      2026-10-13 22:40:46 UTC
played for      1300s of wall clock
current room    "security_checkpoint"
unlocked rooms  6: security_checkpoint, operations_floor, server_room, scada_control, generator_room, cable_vault
unlocked objs   1: crisis_control_system
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Threat Desk Summary -- Tasking 02:41 PT, Notepad, Shift Handover Sheet, Plant Maintenance Key, Facility Access Badge -- Server Zone, Coordination Schedule -- Relay Decode, Listener Capture -- Operator Credentials, Sequence Abort Confirmation, Intercepted Mail -- Deployment Confirmed, Recovered Site Reference -- 'Tomb Gamma'
NPCs met        8: opening_briefing_cutscene, agent_0x99, ray_hollis, the_architect, closing_debrief, elena_rodriguez, james_mercer, thomas_park
flags submitted 4: flag{m07_architects_gambit_scada_attack_host_1_34de32}, ..._2_0f6c7e, ..._3_80d93b, ..._4_00058a
globals set     50: ... debrief_played, debrief_requested, debrief_stance, ... grid_saved, ... mission_complete, ...

VERDICT: progress recorded — 5 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

(Full output: scratchpad `m07-regression-A/verify.txt`. "Current room security_checkpoint" is the reload respawn, finding M-14.)

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Plant Maintenance Key | (item) | ops-floor supervisor's tray | log 357 | yes |
| Hollis's server-zone badge | (item) | Hollis dialogue, using the Shift Handover Sheet's print-history line | handover sheet read about line 300, deal about line 379 | yes |
| Badge-station PIN | `0616` | Shift Handover Sheet | not used (Hollis route taken) | not exercised |
| Control-room door password | `CascadeWindow19` | Elena's turn offer (before flag 2) and Listener Capture (flag 2 reward, read before typing, line 800 or so) | before use | yes (flag 2 supplied) |
| Vault keypad PIN | `4703` | ATS-1 plate in the generator hall (read at lines 1033 to 1055, before the keypad), also Elena and Hollis | before use | yes |
| `scada_attack_host:flag_1` to `flag_4` | `<flag:1>` to `<flag:4>` | the VM challenge | lines 740 to 846 | **no, flags supplied** |

The four flag rows are the boundary of what this run proves. The VM work was exercised, not tested. Everything downstream of each flag (the decode, the Listener Capture, the cascade clock, the console unlock) was exercised from the supplied value. Anything about what the VM actually contains needs checking against SecGen by the user.

Also exercised, not earned: `debugKO` on Thomas Park (line 1142) for the KO-on-reload check.

## What was checked, against the brief's stage-1 list

| Check | Result |
|---|---|
| Lighting variants | Nothing to regress: `scenario.json.erb` has no `lighting` block (no `lighting`, `ambient` or `mode` key anywhere). Every room rendered fully lit. On the server hall and generator hall carpets there is a faint lighter circle around the player (05, 14, 15, 22); I could not tell if it is an engine default glow. Stage 4 owns lighting. |
| Toasts | Work. First ops-floor entry stacked five (Task Complete, Objective Complete, three Mission Updated, screenshot 05) and all had cleared by the 12 s screenshot (06). HaX texts raise a green toast with her avatar and "Clear all". See m-2. |
| RFID denial hold | **Not exercised.** m07 has one RFID lock (`server_zone_badge`) and no wrong card exists to try. With no badge the flipper's Saved list says "No saved cards" (11) and the door never offers a denial. With the badge the door simply opens (13). |
| KO on reload | Passed. Park was KO'd (30), page reloaded with a resume click (31, 32), and he was still down in the vault (33). Unlocked rooms, inventory and globals held; the briefing and debrief did not replay and no debrief opened on any of four room entries before "Bring me in". |
| Sight challenges | None exist. Finding M-1. |
| Tutorial hold | Passed. The tutorial prompt came up straight after the briefing (02) and nothing fired for about 10 s while it was up (drain shows only the load events); after "No, I'll figure it out" HaX's texts arrived. |
| Required-task `*` marker | Renders (yellow `x`, legend "x required" in the panel header, 05). Wrong on two tasks, finding M-3. |
| Renamed sprites `nightshade`, `agent_hax` | `nightshade` is not used anywhere in m07 (no Nightshade appears). `agent_hax` is used only as the 32 px headshot; m07 has no HaX sheet or talk bust. Finding M-2 and m-1. |
| HaX's new bust | Never shown in m07. HaX is phone-only and her debrief lines have no bust configured. Not captured visually in the debrief (I did not screenshot it; static check only). Finding M-2. |

## Timeline (log lines are approximate seq numbers)

| Lines | Step | Result |
|---|---|---|
| 1 to 120 | Briefing driven by hand (not bootstrapped). Asked "Who's coming with me?", then committed Fracture | `team_assigned`, `hurt_line_said`, `briefing_played`; tutorial prompt follows |
| 189 to 222 | Evacuation board; first ops-floor entry | popup text "Observations:/Text:" (m-3); five toasts (m-2) |
| 222 to 330 | Architect's call via the phone, then HaX "He used your line" | `architect_echo_heard` set; HaX replies "...Read me that again." then "You've heard me say it. I say it to every agent I run." and "Somebody who taught a lot of us."; the choice leaves the hub |
| 300 to 380 | Handover sheet, plant key, Hollis: "You renewed Mercer's credentials…" then "Then help me…" then badge | `hollis_resolved=talked`, badge in inventory, task `clear_the_checkpoint` done; Hollis's two plant lines correct |
| 380 to 489 | Server hall (badge opens the door, no minigame); no lockpicking offer (key held) | as expected |
| 489 to 700 | Elena: "What were you told", Mercer, Austin, "Help me stop it", turn | gives `CascadeWindow19` and `4703`; revision read, `projection_revised` |
| 700 to 745 | VM terminal then relay: flag 1 | HaX's recon/NFS text; decode in inventory; ends "I merely publish the schedule. -- A." |
| 753 to 790 | Reload 1 (sync, `location.reload`, title screen Enter via DOM key event) | respawn in the start room, inventory kept, "Mission Brief" notes (`on_resume`) reopens |
| 790 to 850 | Decode, flag 2, Listener Capture, control-room password, flags 3 and 4 | cascade clock 14:53 shown in the scene; "They saw you. Sequence armed: fifteen minutes." |
| 825 to 860 | Mercer: reasoning, "How many people die", "this ends here", "Go on. Walk out." | he leaves by the service stair; `confront_mercer` done |
| 860 to 1017 | Console, abort text, close | Architect sign-off; HaX "Grid's held. Netherton wants you…" |
| 1017 to 1130 | Generator hall (key via `lock`), ATS plate, vault keypad 4703, Park ("Nothing. I was never here."), intercept and dossier | HaX "That'll be their plant man…" on vault entry; `recover_mole_evidence` complete |
| 1142 to 1175 | `debugKO` Park, sync, reload 2 (resume click through the DOM), walk back to the vault | Park still down; no debrief on room entry |
| 1195 to 1202 | HaX hub, "Bring me in." | Netherton's debrief opens at once |
| 1202 to 1574 | Debrief, "Nothing on the record" then "I want the numbers before he writes them." | credits |

Credits read from `#bv-cr-label` (MutationObserver, `window.__cr`):

```
MISSION COMPLETE / THE ARCHITECT'S GAMBIT
PACIFIC NORTHWEST REGIONAL GRID: SEQUENCE ABORTED
CUSTOMERS AFFECTED: 0 of 8,400,000 — 147 substations held
── THE TRIAGE ──
TACTICAL TEAM: Operation Fracture — voter records exfiltrated, Social Fabric cluster seized intact
PROJECTION CORRECTED: Trojan Horse dormancy nine days, not ninety — EHR and dispatch keys on the manifest
── INSIDE THE FACILITY ──
DR. JAMES MERCER (BLACKOUT): Left the building during the abort — no trace
MERCER, CONFRONTED: Argued with, to the end
ELENA RODRIGUEZ: Turned — cooperating, contractor survey work now evidence
RAY HOLLIS: Talked, and handed over the zone badge
THOMAS PARK: Neutralised in the vault
── RECOVERED ──
TOMB GAMMA: Dossier recovered — the Architect's workshop, no coordinates on file
MOLE INTERCEPT: Evidence recovered — SAFETYNET tasking read before it was sent
── ON THE RECORD ──
AGENT 0x00: Wants the numbers before he writes them — no more briefing off his figures
THE ARCHITECT: At large. He chose the night, and the questions you were given.
ENTROPY: Still operational.
```

Pass-4 expectations that held: the stance credit, the KO'd-Park line ("Neutralised in the vault", one Park line only), both RECOVERED lines, no "PROJECTION UNCHALLENGED" (decode read). The Hollis and Elena lines match what I did.

## Findings

| # | Severity | Finding | Evidence and repro |
|---|---|---|---|
| M-1 | major | **No sight challenges anywhere.** Hollis and Park carry `los` blocks marked "decorative" (pass 4, design fix 15; `visualize: false`) and neither has `challengeOnSight`. I walked past Hollis several times at 40 to 90 px, read the board beside him and crossed his room twice with no reaction; the guard only "clocks you at thirty feet" once you talk to him. The m03/m04 pattern (a guard or hostile that challenges on sight, skipped by globals) is absent, so the quiet "evade" route is not a choice the game can detect. | `scenario.json.erb:1133` and `:1760` (comments); log 189 to 330; screenshots 03, 04. Repro: new game, commit, walk from the start spot to the ops-floor door. Stage 2 decision; pass 4 chose decorative on purpose, so this is a design call, not a bug. |
| M-2 | major | **Wrong Director portrait, no HaX bust.** The briefing and debrief NPCs (`opening_briefing_cutscene`, `closing_debrief`, both "Director Magnus Netherton") use `male_spy_v2` / `male_spy_talk.png` / `male_spy_visemes.png`: the briefing shows a man in a fedora and sunglasses, while the narrator says "the suit he briefed you in" and the real `netherton_*` set (dark navy suit) exists and is used by m04. HaX (`agent_0x99`) has only `avatar: agent_hax_headshot.png`, no `spriteSheet`, `spriteTalk` or `spriteVisemes` (m04:561-566 has all four), so the new bust and the `agent_hax` sheet cannot show in the debrief where she speaks about twenty lines. Not seen visually in the debrief (no screenshot), so the HaX half is a static finding. | Screenshot 01; `scenario.json.erb:681-684`, `:1231-1234`, `:700-712`. Repro: start a game; the first dialogue frame. Wiring existing assets, so stage 5 can take the Netherton half now; HaX's bust is a character-stage item. |
| M-3 | major | **`*` required marker on tasks inside an "(Optional)" aim.** "Trace How They Got In (Optional)" holds `secure_generator_room` and `recover_vault_pin` with no `optional` flag, so both show the required `x` while the aim title says optional (05, 06). The aim does not gate the conclusion (the comment at `scenario.json.erb:303-307` says so), so the marker tells a new player the plant is mandatory. | Screenshots 05, 06, 26; `scenario.json.erb:413-450`. Repro: enter the ops floor and read the objectives panel. |
| m-1 | minor | HaX's phone and toast avatar is the old 32 px `agent_hax_headshot.png` (grey hat, pale hair, March 2026). It no longer matches her new look (dark hair, brown hat and coat); `agent_hax_v2_headshot.png` is closer. m04 uses the same file, so it is a shared character-stage item. | Screenshots 07, 09, 08 (side by side with the bust, 10) |
| m-2 | minor | Five toasts stack on the first ops-floor entry, and the third "Mission Updated" announces "Get Into The Control Room" long before it is reachable (it is also open from the start of the panel). | Screenshot 05; log 222 to 240 |
| m-3 | minor | The interaction popup for readable objects prints "Backup Power Transfer Switch Observations: … Text: …" under a title that repeats the object name, and the observation and text repeat the plate serial twice. The one-line caption below clips the sentence with an ellipsis (2204 px of text in a 1392 px label), cutting the serial off the end. The popup still shows the serial, so it is cosmetic. Engine formatting, not m07. | Screenshots 04, 26, 27; `#hud-info-label` scrollWidth 2204 against clientWidth 1392 |
| m-4 | minor | The Cascade Control System's container text still says "It will not take an abort from this chair while the host … is still on the network … It opens itself once you have root" when the player has root and has just opened it. | Screenshot 23; log 860 to 880 |
| m-5 | minor | Elena: "He's upstairs in the control room" and Mercer leaves "down the service stair", but the control room is a north door off the server hall on the same level. | Elena `q_mercer` line, Mercer exit; log 489 to 700, 825 to 860 |
| m-6 | minor | Elena's turn offer includes "Then do it for the reason you wrote page forty." even when the player never asked `q_why`, the only place page forty is introduced (`m07_npc_elena_rodriguez.ink:152` against `:262`). The choice cites something the player has not heard. Gate it on `asked_why`. | ink lines cited; I took the Austin route and saw the choice |
| m-7 | minor | Mercer: "When the fourth submission is declined, agent, somebody does this." is unclear, and "Ah. The host is yours." follows a line where the player said nothing about a host. Both read as written, not spoken. | log 825 to 857 |
| m-8 | minor | Elena hands over both the control-room password and the vault PIN in one turn. After that the flag 2 capture and the ATS plate add nothing to the route, and HaX's flag-2 text still offers "You've got a name and a password now. Want the SSH guide?" Stage 2 should decide whether the Elena route is meant to flatten both locks. | screenshots 20, 22; log 600 to 700 |
| m-9 | minor | The Park conversation says he is "kneeling at an open junction box" but his sprite stands between the two desks (28); the Trunk Cable Runs object is a thin red arc on the far wall. | Screenshots 28, 29 |
| m-10 | minor | Wall pictures sit in the wrong place: in `scada_control` a landscape painting floats in the black void outside the right wall (21, 22, 24); in the checkpoint the same picture lies on the floor mid-room on first load (03) and sits over the right chair row after the reload (19). Stage 4 (dressing). | Screenshots 03, 19, 21, 22, 24 |
| m-11 | minor | The generator hall is dressed as another server hall (grey racks, a red button, no generators, 25) and the cable vault as an office with filing cabinets (28). Neither reads as its name. Stage 4. | Screenshots 25, 28 |
| m-12 | minor | Phone message timestamps are the wall clock (10:19 to 11:33), not the story's 02:41 to 03:xx; the Architect's thread shows 11:22. Engine behaviour, noted for the user. | Screenshot 07; HaX thread text |
| m-13 | minor | When all required tasks of an optional aim complete, the aim is struck through (✓) and its still-active optional tasks (`neutralise_park`, `search_cable_vault`) disappear from the panel while Park is standing in the room (28, 29). `recover_mole_evidence` still ticked (the aim state shows it completed) with no feedback. | Objectives state: `trace_the_intrusion` completed, `neutralise_park` and `search_cable_vault` active. Repro: open the vault keypad, then read the panel inside the vault. |
| m-14 | minor | Suspect engine: every page reload puts the player back in the start room (160,144), however far in. After the abort that is a four-room walk back. Doors stay unlocked and nothing replays, so it costs time only. The same showed in m04 (its E1). | Log 753 to 790 and 1152 to 1175; verify-run "current room security_checkpoint" |
| m-15 | minor | Stale text in `PASS4_PLAYTEST.md`: HaX's reply now begins "...Read me that again." (script says "...Say that again."), steps 3 and Round 2 item 2. Walkthrough and ink are right; the script isn't. | HaX thread text, log 222 to 300 |
| m-16 | minor | Credits say Mercer "Left the building during the abort"; on this route he walked out before the console was touched (flags 3 and 4 were in, he left, then I used the console). "Left before the abort" would be accurate, but the line may be right for the route where he is still there at the abort. Check which route sets it. | Credits; log 825 to 880 |

## Branches not reached (for the next stages)

Not played: the Contractor Badge Station route (PIN 0616), Hollis KO or evade, Park fights, the redirect ("Move them to Trojan Horse"), the 9-minute fallback timer, the clock expiring, missing-flag nags, Elena left at the rack, and any KO route other than `debugKO` on Park. Lockpicking was assisted by `lock` with a real key, not a pick.

## Notes for the next stage

- Stages 2 and 4 should read M-1, M-3, m-8, m-10, m-11 first. M-2 (Netherton half) is quick wiring.
- The Mission Brief notes minigame reopens on every reload (`show_scenario_brief: on_resume`), by configuration, and on the second reload it came up before the Resume overlay; the first reload showed no Resume overlay at all. Harness behaviour, not scored.
- Debrief text, Hollis ("keep going" ends as "waited for the police") and Park lines were consistent with what I did; no finding.
