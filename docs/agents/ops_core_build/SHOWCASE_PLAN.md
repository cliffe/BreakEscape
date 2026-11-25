# Ops showcase scenarios: plan

Kind of game: **demo scenario** (AGENTS.md "Lab, demo and test scenarios"). The aim is that a teacher, a tester or a new author can watch every ops-layer feature work inside a lively office in 10 to 20 minutes per scenario, with a host who points at each beat and free play around it. Authorised practice in a fictional office with fictional staff; no combat (`"disableAttacks": true`).

Sources: the showcase digest (session scratchpad `SHOWCASE_DIGEST.md`, cited as "digest 1.10"), `AGENTS.md`, `README_scenario_design.md`, `docs/ACCESS_AND_NETWORKS.md` (cited as "docs:<line>", worktree named where it differs), `scenarios/office_life_showcase/`, `scenarios/demo_access_tour/`, `scenarios/_office_kit/`.

## 1. Recommendation in one paragraph

Build **three** showcases, each 4 to 5 rooms, each set in the same fictional firm (Merrin & Sallow, the practice `demo_access_tour` already uses, with Ama Owusu of Fenlow Managed IT as host), each a working day in which staff needs, routines and frustration open the windows the features use:

| Scenario | Theme | Built now from main | Appended later |
|---|---|---|---|
| `demo_ops_recon` | Finding what is on the network | N13 sweep and scan, N14 check and confirm, N15 technique cards and sessions, N16 Terminal and Panels with realism links, network and share log rows, audit-log PC | none required (the ops-follow1 Panels default and lasting Terminal are re-checks, not appends) |
| `demo_ops_passwords` | What a stolen password store gives away | A21 hash records and cracker (guessable, reused, strong), A18 admin session and profile reach, A10b USB policy and the admin override, sign-in log rows, audit-log PC | S5b (A19) cached accounts and the collect, including the borrow; S5c (A20) account kinds, the desk admin as a local account-only account, domains |
| `demo_ops_second_step` | What a second step stops and what it does not | A22 code, push (with a pestered approver), number match, holding the owner's phone, a way round (a claimed open screen), mfa log rows, audit-log PC | S8b (A23) helpdesk reset and re-enrolment to the player's own phone; S8c (A25) a second step on a door, a safe and a carried case, and a propped door as the way round |

Why three rather than one giant map: each stays playable in a lesson slot, each has one teaching question, the Rails scenario test and PLAYTEST.md stay under the size where a Haiku run is reliable, the V8 sync budget (6 reveal globals, 10 onceOnly mappings, 4 items, 64 small keys) is per scenario, and each later stage lands as an append to exactly one scenario. Why not one per stage (eight or more): most stages only make sense next to another (a cracked password is only worth something at a sign-in; a second step only matters once a password is known), and each extra scenario repeats the office-life cost.

## 2. Ground rules for every showcase

1. **New scenarios only.** No edit to any existing scenario, campaign mission (m0x) or awareness episode (ca*), nor to `_office_kit`. Reuse is by copying blocks into the new scenario, as `office_life_showcase` did from `test_needs_sims` (digest 2.1).
2. **The kit's include mechanism, and why the showcases use it for cast only.** The kit's only include mechanism is an NPC `storyPath` pointing into `scenarios/_office_kit/ink/<name>_ambient.json` (digest 2.4). Those inks are written for the awareness episodes: the default line of `priya_nair_ambient.ink` is about a supplier portal, and each branches on `kit_ep`. They would be off-topic here and bring `kit_*` variables into the validator report. So each showcase has **scenario-local ink** (the `office_life_showcase` way) and reuses the **cast**: sprite sheets, talk sheets, visemes and the voice block (style re-worded for this firm). No new art (skill rule 7). Every NPC below has art in `public/break_escape/assets/characters/` (checked for ama_owusu, chidi_okeke, jun_watanabe, graham_whitfield, agnieszka_duda, zainab_hussain, anjali_rao, darren_price, yusuf_demir, niamh_doherty, fatima_begum, gwen_pritchard, thandiwe_moyo, delphine_arvanitis, julian_sallow, lorna_easton; priya_nair and sam_okoro have none and are not used).
3. **Office life opens the windows; it never gates the feature.** Every beat has a lever in the host's hub that forces its window (as Ama's "Call it a day" does in `office_life_showcase`), so a teacher can run a beat on demand and a test can reach it deterministically. In free play the window also opens on its own from needs and routines.
4. **Validator-clean**: `ruby scripts/validate_scenario.rb scenarios/<name>/scenario.json.erb` gives 0 errors; every warning is listed in the build report with a reason. The office-life sync budget applies per scenario (digest 3.1).
5. **No runtime LLMs.** All dialogue is authored ink and chatter pools.
6. **Realism.** No real advisory ids, real tools, real commands, real output formats or real module paths in any scenario file, ink, PLAYTEST.md, test or graph. `demo_ops_recon` links only the three existing catalog entries (`filehold_update_lag`, `filehold_link_setting`, `filehold_release_line`, listed in `docs/REALISM_CATALOG_INDEX.md`) on an invented "Tarnwick FileHold 4.2" service, the product those entries were written for (`scenarios/test_ops_skin/scenario.json.erb:246-262`). No new catalog entry is planned (each would need human review).
7. **Credentials.** No password, hash token, code, `resetPassword` or recovery answer appears in ink, chatter, the notice board, PLAYTEST.md prose or the dungeon graph. They live only in `creds`, `credentials` and the clue items the feature's own mechanism reveals; the Rails test holds them as constants (as `test/controllers/break_escape/ops_mfa_scenario_test.rb:16-21` does). PLAYTEST.md tells the tester where to read each secret in game, never the secret.
8. **Wording rule for ops text** (docs:1446 in [main]): say what to do, not which control to press ("sweep the office network", never "click Sweep" or "type ..."). Applies to objectives, ink, notes and the notice board.
9. **Appends stay appends.** `tools/check_mapping_index_drift.rb` keys once-only records by an NPC's mapping index, so a later stage adds `eventMappings` only at the **end** of an NPC's array, adds tasks only at the end of an aim or as a new aim at the end, adds ink only as new knots plus new hub choices after existing ones, and adds rooms, objects, NPCs and top-level blocks freely. A later stage never renames an id, moves a mapping or rewrites an existing line (a voiced line would re-key its audio).
10. **UK English, plain writing.** Voiced lines obey the word cap (30 face to face, 25 on the phone) and print no variables.
11. **logSources outside `test_ops_*`.** docs:858 ([main], "Known limits") says only `test_ops_*` declare `logSources` "for now"; no validator enforces it (digest 4). The plan uses them because the audit-log PC is a feature to show, and asks the owner (section 9, Q3). If the answer is no, drop the log source and reader from each scenario; nothing else changes.
12. **Art placeholder.** `code_device.png` is a placeholder (digest 1.10). The second-step showcase uses it as is unless the owner says yes to a proper sprite (section 9, Q4).

## 3. What each showcase reuses, and what is new

| Source | Reused how | Used in |
|---|---|---|
| `office_life_showcase` | Top-level office-life switches copied as a block: `npcNeedsSeed` (own seed per scenario), `npcWindupMs` 700, `showPressingNeeds`, `officePresets`, `roomTone`, `disableAttacks`, `lighting`, `actionIcons`. Room patterns: the office coffee station with its queue and the wall-socket lever (`office_coffee`, `office_coffee_socket`, `scenario.json.erb:170-215`), the kitchen block (`fridge`, `microwave`, `kitchen_coffee`, `water_cooler`, `washing_up_tray`), the "Things to try" notice board (`tour_notice`). Cast blocks for Chidi, Jun, Graham, Agnieszka, Zainab (needs numbers, `needsHome`, `habits.screen`, `needsCompany`, `interests`) and Ama's host pattern (immovable, `facePlayer`, an `eventMappings` list that ticks custom tasks and barks once, `scenario.json.erb:236-266`). The act globals (`act_midday`, `act_evening`) and the "Call it a day" lever. The cake magnet start item. | all three |
| `demo_access_tour` | The firm and its policy shapes (`desk`, `partner`, `infra` with `usb: storage_blocked`, `remote: allowed`, `scenario.json.erb:53-60`), the office network with a jack and drop box (N1), and the cast blocks for Delphine, Julian, Lorna, Thandiwe. Shapes are copied, not its rooms. | recon (network, jack), passwords (policies, USB), second step (cast) |
| `_office_kit` | Cast only (sprite sheets and voice blocks for Anjali, Darren, Yusuf, Niamh, Fatima, Gwen). Not its ink (rule 2). | passwords, second step |
| `test_access_work` | The work-needs and workaround pattern: `resources`, `roles.<r>.workNeeds`, `workarounds[]` with `do` = `writes_down`, `borrow_session`, `prop_door` (docs:349-377 in [main]). | passwords (writes down, borrow), second step (writes down, prop door) |
| `test_ops_*` | The feature blocks, copied and re-skinned: `test_ops_scan`, `test_ops_findings`, `test_ops_access`, `test_ops_skin` (recon); `test_ops_crack`, `test_ops_privilege` (passwords); `test_ops_mfa` (second step); `test_ops_logs` (log source and reader, all three). Later: `[logs] test_ops_privilege` beats 12 to 25, `[build] test_ops_helpdesk`, `[skin] test_ops_lock_step`. Their Rails tests are the model for each showcase test. | per stage |

**New in each showcase:** the scenario file, its own ink, a host script that names each feature in plain words, levers that force each window, office-life openings tied to ops beats (listed per beat below), one audit-log PC that closes the day by showing the player their own trail, PLAYTEST.md, a Rails scenario test, and `planning/VOICED_LINES.md`.

Files per scenario: `scenarios/demo_ops_<theme>/{scenario.json.erb, mission.json, PLAYTEST.md, dungeon_graph.{html,json,md}, ink/*.ink, ink/*.json, planning/BUILD_REPORT.md, planning/VOICED_LINES.md}` and `test/controllers/break_escape/demo_ops_<theme>_scenario_test.rb`.

## 4. Shared shape of every showcase

- **The day.** Three acts as in `office_life_showcase`: Morning, Midday, Evening, turned by globals `act_midday` and `act_evening` that Ama sets from her hub ("Send them to lunch", "Call it a day") or that a `gameClock` reaches. Each act opens the windows its beats need.
- **The host.** Ama Owusu, immovable near the start, `facePlayer`. Her hub has one choice per beat: "What's next?" (points at the next unticked task in plain words), one lever per window, "What did that show?" (a two-line recap per ticked beat, gated on the task's tick), and "Give me the short version." Barks on the first sight of each beat (onceOnly, within the budget of 10).
- **Guided path and free play.** Objectives list each feature as a task in act order. Each task is `custom` and is ticked by an `eventMappings` `completeTask` on Ama on the client event the beat emits (event names below; `pc_signed_in:<pcId>`, `network_swept`, `network_host_scanned`, `network_service_checked`, `network_finding_confirmed`, `network_technique_used`, `network_foothold_gained`, `usb_refused:<...>`, `mfa_approved`, `mfa_prompt_sent`, `keyring_changed` exist in `public/break_escape/js`). Where a beat emits nothing usable on the client (an admin-level detail, a crack result, a log-row read), the task is ticked by Ama's ink with `#complete_task` when the player tells her what they saw, and the build's first step is a probe that records which (section 7, probe list). No task gates anything; there is no `missionConclusion` (as in `office_life_showcase`), and the end state is the audit-log beat plus Ama's recap.
- **The audit-log PC** (A24). A `logSources` entry with a `gameClock` and an `ops_log_terminal` reader in the IT room. Its last beat: open it with Ama and find your own rows, then flag one seed row as the odd one out (`minigameData.anomaly.rowId`), which ticks the last task through its `completionActions`.
- **Notice board** ("Things to try", copied from `tour_notice`) lists the beats in plain words, obeying the wording rule.
- **mission.json** for all three: `collection` "test_scenarios", `test_type` "ops_demo", `difficulty_level` 2, `display_name` "Ops demo: <theme>", `estimated_duration_minutes` as below, `description` and `test_objective` in two plain sentences each.

## 5. `demo_ops_recon`: "What's on the network?"

**Build:** now (wave 1). **Duration:** 15 minutes. **Teaching question:** what can someone with one network cable learn about an office's machines, and how do they tell a real weakness from a false alarm?

**Premise (plain teaching language).** Merrin & Sallow have asked Fenlow Managed IT to show them what an outsider could see from a spare network socket. Ama gives you a small drop box. While the office gets on with its day, you plug it in when nobody is at the hot desk, list what answers on the network, look at what each machine runs, test which reported weaknesses are real, and try the two techniques you are handed. At the end of the day Graham in IT shows you the network log, where every step you took is written down.

### 5.1 Rooms and layout

```
                 [server_room]
                       |
 [kitchen] ------- [office] ------- [it_room]
```

| Room | Type | Contents that matter |
|---|---|---|
| `office` (start) | `room_office` | Four desks (Chidi, Jun at the hot desk, Agnieszka, a spare); the hot-desk network jack `hotdesk_jack` (`networkJack: true`), placed within 1.5 tiles of the approach cell of Jun's home object (the hot desk) so the caught check can see a player still at the jack (R1, `npc-needs.js:3449-3463`); Agnieszka's PC `agnieszka_pc` (sign-in, owner `agnieszka_duda`, policy `desk`, the target of the printer's saved connection, R5); the office printer object `office_printer` (the printer Agnieszka walks to; see 5.3 for its separate host and resource ids); the printer cupboard `printer_cupboard` (unlocked container) holding technique card 1; office coffee station and wall-socket lever (copied); the printer's own socket lever (global `printer_off`); notice board; Ama. |
| `kitchen` | `room_break` | Copied kitchen block (fridge, microwave, kitchen coffee, water cooler, washing-up tray); a second jack `kitchen_jack` (`networkJack: true`), the one the seed rows name (m3). |
| `server_room` | `room_servers` | The file server `file_server`: a headless sign-in object (`type: "pc"`, `lockType: "login"`, `headless: true`, `access`, `policy: "infra"`, `services`), copied in shape from `scenarios/test_ops_skin/scenario.json.erb:229-262`; a camera host `lobby_camera` (headless host, sprite); Zainab's tool roll (copied object); Zainab. |
| `it_room` | `room_it` | Graham's PC (`workstation`); the audit-log reader `network_log_pc` (`ops_log_terminal`); Graham. |

All rooms open (no locks): the lesson is the network, not the building. Every room carries `"network": "office_lan"` (as `test_ops_skin:228`), so the PCs and the file server are on it.

### 5.2 Cast, needs, routines, habits

| NPC | Where | Needs and routine (copied numbers from `office_life_showcase` unless stated) | Habit that matters for a beat |
|---|---|---|---|
| Ama Owusu (host) | office aisle | none; immovable | Hub levers: "Send them for coffee" (sets `coffee_call`, which the coffee drinkers' mappings read to drop caffeine), "Send them to lunch" (`act_midday`), "Call it a day" (`act_evening`). |
| Chidi Okeke | office desk | caffeine, work, hunger (as showcase) | Leads the coffee run. |
| Jun Watanabe | hot desk (`needsHome` the hot desk) | caffeine, follows Chidi (as showcase) | Sits at the hot desk with the live jack. The coffee run is the window: plug in while he is away. If the player is still at the jack (within 1.5 tiles of the hot desk's approach cell) as he walks back, he catches them (`npc_caught_at_post:jun_watanabe`, bark, no penalty). |
| Agnieszka Duda | office desk | thirst; `interests.dirty_mugs` (as showcase) plus a `work` need on the `printer_res` resource | Prints and fetches printouts; when the printer is off she mutters (`work_fail_printer` chatter). Cooler exchange with Graham (copied `exchanges`). Her account (`creds`) is the one the printer's factory login was saved for (R5). |
| Zainab Hussain | server room | caffeine and thirst late; `needsCompany.avoids ["*"]` (as showcase) | Field engineer who stays late. In the evening, alone at the kitchen coffee, she talks: her ink hands over technique card 2 (`itemsHeld`, A14 declared grant). |
| Graham Whitfield | IT room | work and social (as showcase); cooler exchange with Agnieszka | Owns the network log PC; his ink explains the log in the evening beat. |

Six NPCs, as in `office_life_showcase`.

### 5.3 Ops fields switched on

- `networks.office_lan`: `name` "Office network", `discovery: "scan"`, `cli.range` a private /24 (any private range not used by another showcase), `cli.hosts.<hostId>.address` for each host.
- `policies`: `desk` (`remote: "allowed"`, so the saved connection in R5 can open Agnieszka's PC over the network) and `infra` (`remote: "allowed"`, on `file_server`), shapes copied from `demo_access_tour:53-60`; `defaultPolicy: "desk"`.
- **One id space** (`scripts/validate_network_ops.rb:103-104`: hosts, objects and resources share one id space). The printer has three ids: the room object `office_printer`, the network host `printer_host`, the resource `printer_res` (`kind: "printer"`, `object: "office_printer"`, Agnieszka's work need). Both `printer_host.offWhen` and `printer_res.offWhen` read `printer_off`. The file server is a sign-in object, so it is not a `hosts` key at all.
- `hosts`:
  - `printer_host` ("Office printer"): services `print` (9100) and `admin_page` (label "Admin page", 80), product "Inkvale JetServe" 1.4, copied in shape from `scenarios/test_ops_access/scenario.json.erb:20-40`. On `admin_page`: weakness `factory_login` (class `default_creds`, severity high, `grants: { "credential": "print_admin" }`), decoy `old_build` (class `unpatched`, low, `falseBecause` "the build listed is older than the one this printer runs"). The builder checks in R-S whether a host `sprite` would draw a second printer beside `office_printer`; if it does, the host has no sprite (record which in BUILD_REPORT).
  - `lobby_camera` ("Reception camera", headless): one service with only a decoy (as `test_ops_findings`' camera), to show that some hosts have nothing real.
  - The PCs (Chidi, Jun, Agnieszka, Graham) appear on sweep as host rows (N12).
- `file_server` (room object in `server_room`, see 5.1): `access: { "roles": ["it"], "people": ["agnieszka_duda"] }` (the builder checks that `accessList` takes both keys at once, `scripts/scenario-schema.json`; if not, give Agnieszka `role: "print"` and use `{ "roles": ["it", "print"] }`), service `storage` (445), product "Tarnwick FileHold" 4.2, with `cli` (`protocol` tcp, `service` lower-case word, a short invented `banner`). Findings copied in shape from `test_ops_skin:246-262` and the step-up from `test_ops_access:393-399`:
  - `update_lag` (unpatched, high, `realism: "filehold_update_lag"`, `grants: { "session": { "account": "agnieszka_duda", "access": "user" } }`),
  - `link_setting` (misconfig, medium, `realism: "filehold_link_setting"`, `needs: { "session": "user" }`, `grants: { "session": { "account": "graham_whitfield", "access": "admin" } }`: the step up; Graham has `creds.admin: true` and the `it` role),
  - decoy `release_line` (misconfig, low, `realism: "filehold_release_line"`).
- `credentials.print_admin` (`kind: "saved_connection"`, `account: "agnieszka_duda"`, `connectsTo: "agnieszka_pc"`, `proof: { "technique_card": "printer_host.admin_page.factory_login" }`), copied from `test_ops_access:80-85`: the printer kept the factory account's saved link to the PC it was set up from.
- `resources.shared_drive` (`file_share`, N4, `host` the file server, `network: "office_lan"`) with `access: { "people": ["graham_whitfield"] }`: an access-listed share is served only to a session whose identity the list admits (docs:1026), so neither the foothold alone nor Agnieszka's user session opens it; only the step-up's Graham session does. The R-T test asserts the share is refused after R5 and after `update_lag`, and served after `link_setting`.
- `techniques`: `factory_accounts` ("Factory accounts", `worksOn.class: default_creds`), `update_gap` ("Known update gap", `worksOn: { class: unpatched, product: "Tarnwick FileHold", versions: ["4.2"] }`) and `open_settings` ("Left-open settings", `worksOn.class: misconfig`; needed because `link_setting` is a misconfig and neither other card works on it). Card 1 in `printer_cupboard`; card 2 held by Zainab; card 3 in Zainab's tool roll (an unlocked container in the server room). Card 3 on the camera's decoy or on `release_line` is refused, which repeats the R5 lesson.
- `networkView`: absent, so Panels is the default; the Terminal is shown by switching (beat R6). See section 8 for the ops-follow1 change.
- `gameClock` (start 08:30, as `test_ops_logs`), `logSources.network_log` (`title` "Network log", `events`: the jack plug and unplug rows, `network_swept`, `host_scanned`, `service_checked`, `finding_confirmed`, `technique_used`, the share open row; the builder lists the registered names from `ops_log_events.rb` and uses only those). `seedRows`: three rows from 07:10 to 07:14 showing an unknown device on the kitchen jack (`kitchen_jack`) sweeping and scanning; one is the anomaly row. (`scripts/validate_log_rows.rb:400-405` does not check jack names in seed rows, so the builder checks by hand that every seed row names a jack that exists.)
- Start items: the drop box (`rogueDevice: true`, as `test_ops_access:138`), the cake (copied).

### 5.4 Beats in the order a player meets them

Each row: the office-life opening, the click path (what the player does, plain words; PLAYTEST.md carries the exact clicks), the fields, what Panels and the Terminal show, the log row, and the task it ticks.

| # | Beat | Opening from office life | Player does | Panels / Terminal | Log row | Task (event) |
|---|---|---|---|---|---|---|
| R1 | Plug in | Jun is at the hot desk; the coffee run (or Ama's "Send them for coffee") takes him away | Walk to the hot desk jack while Jun is out, use the drop box on it. If you are still at the jack when he walks back, he catches you (bark, no penalty). | The network view opens on "Office network" with a sweep offered and no rows. | jack plug row | `plug_in` (`network_foothold_gained`) |
| R2 | Sweep | none needed | Sweep the office network. | Rows for the printer, the file server, the camera and four PCs. Terminal: the same list as typed output with the authored addresses. | `network_swept` | `sweep` (`network_swept`) |
| R3 | Scan | Agnieszka is printing (her trips to the printer show it is in use) | Scan the printer. | One tile per service (name, port, product). | `host_scanned` | `scan_printer` (`network_host_scanned`) |
| R4 | Check and confirm | none | Check the printer's admin page; confirm both findings. | Two unconfirmed tiles `f1`, `f2` that look alike; confirming shows one real (what it needs) and one false (why). | `service_checked`, `finding_confirmed` x2 | `confirm_both` (two mappings, one on `network_finding_confirmed:<factory_login id>` and one on `network_finding_confirmed:<old_build id>`, the id as the confirm sends it, `network-view-minigame.js:1071`; each sets its own global and ticks the task with the condition that the other's global is already true, so the order does not matter) |
| R5 | Technique card 1 | The printer cupboard is by Agnieszka's desk, unlocked and free to take | Take the "Factory accounts" card from the cupboard; use it on the real printer finding. | Techniques panel lists the card; Use adds a saved connection to the keyring ("the printer kept a saved link to Agnieszka's PC"); her PC's row gains Open, and Open shows her desktop in the remote-view frame. A wrong pairing (card on the decoy) is refused. | `technique_used` (or the refused row) | `use_card` (`network_technique_used`) |
| R6 | Terminal and realism | Ama's hint: "Same moves, typed. Try the Terminal on the file server." | Switch the view to the Terminal; scan and check the file server there. | Terminal prints the service with the authored banner and, for each finding, the realism text from the catalog. Switching back to Panels shows the same findings as tiles, with the same aliases. | `host_scanned`, `service_checked` (written once per foothold whichever skin) | `terminal_view` (ink: Ama asks "What did the file server say?"; there is no skin-switch event, m4) |
| R7 | Technique card 2 and a step up | Evening: Zainab, who avoids company all day, is alone at the kitchen coffee and will talk | Talk to Zainab; she gives the "Known update gap" card. Use it on `update_lag` for a user session (as Agnieszka); confirm `link_setting`, which now shows its need met; take the "Left-open settings" card from Zainab's tool roll in the server room and use it on `link_setting` for an admin session as Graham (the user session is its need); open the shared drive. | A user session, then an "Admin" session on the file server row; the `shared_drive` folder opens only after the admin one. | `technique_used` x2, share open row | `open_share` (share-open client event; probe P1) |
| R8 | The log | Graham's ink in the evening: "Want to see what you looked like from here?" | Open the network log PC; find your own rows; flag the 07:12 row (the unknown device before you) as the odd one out. | not the network view: the reader's table, filters and detail pane | reading writes nothing | `read_log` (anomaly `completionActions` `complete_task`) |

Free exploration: unplug the drop box (ends the sessions, writes the unplug row; Ama's onceOnly bark explains N5); switch the printer off at its socket lever (`printer_host` and `printer_res` `offWhen printer_off`) and rescan: it no longer answers, and Agnieszka mutters; scan a PC row (nothing listed); use a card on a decoy (refused).

### 5.5 Objectives (guided path)

- Aim `morning` "Morning: get on the network": `plug_in` "Plug the drop box in where nobody will notice", `sweep` "List what answers on the office network", `scan_printer` "Find out what the printer runs".
- Aim `midday` "Midday: real or false?": `confirm_both` "Test both of the printer's reported weaknesses", `use_card` "Use a technique on the one that is real", `terminal_view` "Look at the file server in the Terminal".
- Aim `evening` "Evening: what it looked like": `open_share` "Open the shared drive", `read_log` "Find yourself in the network log".

### 5.6 mission.json outline

`display_name` "Ops demo: on the network"; `description` "A working day at Merrin & Sallow. Plug a drop box in when the hot desk is empty, list and scan what answers, test which weaknesses are real, then read your own trail in the network log."; `difficulty_level` 2; `collection` "test_scenarios"; `estimated_duration_minutes` 15; `test_type` "ops_demo"; `test_objective` "Show discovery, scanning, findings, technique cards, the Terminal and Panels views with realism text, and the network log, inside office life."

### 5.7 End state

All eight tasks ticked; the player holds the printer's saved connection to Agnieszka's PC in the keyring, and a user and an admin technique session on the file server (the sessions end if the drop box is unplugged); the network log shows the player's rows after the seed rows, with the 07:12 row flagged. Ama's "Give me the short version." recaps in four lines. Evening lighting variant as in `office_life_showcase`; staff go home except Zainab and Graham.

### 5.8 Voiced lines (draft count; final list in `planning/VOICED_LINES.md` after dialogue sign-off)

Ama: about 12 barks plus about 30 hub lines. Zainab: about 8. Graham: about 10. Chidi, Jun, Agnieszka: chatter pools copied from `office_life_showcase` (already voiced there; identical text, voice and style reuse the cache only if the voice block is copied unchanged, so copy those voice blocks verbatim for these three) plus about 3 new lines each. New spoken lines in total: about 70.

## 6. `demo_ops_passwords`: "What a password store gives away"

**Build:** now for A21, A18, A10b and the log (wave 1); S5b and S5c appended when `ops-priv2` lands (wave 3). **Duration:** 15 minutes now, 20 with the appends. **Teaching question:** why do some stored passwords fall to guessing and others never do, and what does an administrator's password open that a user's does not?

**Premise.** IT found an old box of exported password records in the confidential-waste bin. Ama wants you to show the partners why that matters. Staff habits give you what you need: Delphine posts about her life on the office feed and keeps a photo on her desk, Graham reuses one password everywhere, Julian picks long random ones. Crack what will crack, sign in with it, and see what an administrator can reach on the partner's PC that a normal user cannot.

### 6.1 Rooms and layout

```
                 [partner_office]
                        |
 [kitchen] ------- [office] ------- [it_room]
```

| Room | Type | Contents that matter |
|---|---|---|
| `office` (start) | `room_office` | Desks for Delphine (`delphine_pc`, sign-in, `workstation`, owner `delphine`), Jun (`jun_pc`), Niamh; Delphine's desk photo `delphine_photo` (takeable, `revealsFacts`); the printer cupboard holding the "Printer admin" note (`printer_admin_note`, the clue item that carries the printer service account's login, as `test_ops_mfa:228-238`); a governed stick port `desk_usb_port` on Delphine's desk (copied shape from `test_ops_privilege`); office coffee and socket lever; notice board; Ama. |
| `kitchen` | `room_break` | Copied kitchen block; the "Office feed" kiosk `feed_kiosk` (an OSINT browser object on the `office_feed` site, the break-room tablet that docs:407-430 lists as a social media place), where the player reads Delphine's and Niamh's posts. |
| `it_room` | `room_it` | Graham's PC (`graham_pc`); the confidential-waste bin `secure_bin` (unlocked container) holding three record files (`delphine_record_file`, `graham_record_file`, `julian_record_file`); the audit-log reader `signin_log_pc`; the printer service account `printer_svc` (see 6.2). |
| `partner_office` | `room_ceo` | `partner_pc` (sign-in, owner `julian`, `policy: "partner"` with `usb: "blocked"`), its keystroke-device socket `partner_pc_socket` (`grant_foothold` with `needsSession: partner_pc`, `needsHeld`, as `test_ops_privilege`'s BadUSB socket); Julian. |

`partner_office`, `office` and `it_room` carry `"network": "office_lan"` (B3: `implant_foothold!` answers `implant_not_ready` with no network, `app/models/break_escape/network_access.rb:496-498`; the model is `scenarios/test_ops_privilege/scenario.json.erb:10-12,225`).

### 6.2 Cast

| NPC | Where | Needs and routine | Account and habit that matters |
|---|---|---|---|
| Ama Owusu (host) | office | none | Levers: "Send them for coffee" (Delphine's absence), "Ask Delphine about her weekend" (sets global `ask_weekend`; Delphine's mapping `needs.set { social_media: <below her urgentAt> }`, so she posts now), "Send them to lunch", "Call it a day". She can also ask the player to drop the cake (the cake magnet start item); no lever places an object (`apply-actions.js:224-549`). Holds the capture log for the player (`holds.captures: true` on a start item, as `test_ops_crack`). |
| Delphine Arvanitis | office | caffeine, social, `social_media` (initial value that falls under `urgentAt` within the first two minutes); a cake magnet target | `creds` user; `habits.password: "guessable"`, `passwordDifficulty: "medium"`; `feed: { site: "office_feed", person: "delphine", order: "facts_first", posts: [...] }` (A11, docs:407-430) with her first post carrying `fact: "delphine_dog_year"`; her photo carries `revealsFacts: ["delphine_dog_name"]`. Awareness not high (a high-awareness poster needs `deliberate: true`, A11 warning). Coffee takes her from her desk: the window to take the photo and to sit at her PC. Screen habit: `lockIfAwayOverSeconds` 10 (her screen locks, so the cracked password is the way in). |
| Graham Whitfield | IT room | work, social, `hunger` (needed for the lunch window, M10); cooler exchange with Niamh | `creds.admin: true`, role `it`; `habits.password: "reused"`: his password equals the printer service account's, and the "Printer admin" note gives that account's password, so his record cracks by reuse. Lunch (`act_midday`, mapping `needs.set { hunger: 20 }`, below `urgentAt` 40, as Chidi at `office_life_showcase/scenario.json.erb:291`) empties the IT room within seconds: the window for the bin. No caught bark at the bin (it is not his home object, m1). |
| Printer service (`printer_svc`) | IT room, beside the printers' shelf | none | The printer service account. On main an account must be a person with a sprite (`svc_sync` at `test_ops_mfa:282-293` is the model: `npcType: "person"`, `spriteSheet: "male_telecom_v2"`, a one-line ink), but with `role: "service"`, not `it`: no PC's `access` admits it, so its password signs in nowhere and the only way to Graham's admin reach is the crack. `creds.password` equals Graham's. The S5c append may turn it into `accountOnly`; that is a rewrite of an existing NPC, so S5c leaves it as it is. |
| Julian Sallow | partner office | social, work; at midday he goes to a client lunch: `setVisible: false` on `act_midday`; he does not come back (m13), so his PC stays free for P7 and P8 | `creds` user; `habits.password: "strong"`: his record never falls (P5). His office is empty at lunch: the window for the admin beat. |
| Niamh Doherty | office | thirst, social | Colour: posts on the feed too (no facts), cooler partner of Graham, gossip in the kitchen ("Delphine's dog is on the feed again"). Her line points at the feed without saying the fact. |
| Jun Watanabe | office | caffeine (as showcase) | Used by the S5b append (the borrow); now only colour. |

### 6.3 Ops fields switched on

- `credentials` (A21): `delphine_hash` (`kind: "hash"`, `account: "delphine"`, `proof.held: "delphine_record_file"`, `crack: { password: "guessable", facts: ["delphine_dog_name", "delphine_dog_year"], difficulty: "medium" }`), `graham_hash` (`account: "graham"`, `proof.held: "graham_record_file"`, class from habits: `reused`, `salted: true`, `crackSeconds: 20`: the salted wait is shown on a record that yields, since a salted strong record never counts down, M3), `julian_hash` (`account: "julian"`, `proof.held: "julian_record_file"`, `strong`, no `salted` and no `crackSeconds`: `ops_cracking.rb:161-163` answers a strong record before the salted branch at `:179`, and `scripts/validate_cracking.rb:359` warns on a grade for a strong password). Plus `printer_admin` (`kind: "password"`, `account: "printer_svc"`, `foundIn` the `printer_admin_note` item, A15; the validator requires `foundIn` on a password credential, docs:655).
- **Why reuse works this way** (M2): `ops_cracking.rb:227-233` counts a hit only when ANOTHER account with an equal password is held, and `:155` answers "cracked" at once, with no class, when the player already holds this account's own password. So the note names the printer service account, not Graham.
- `networks.office_lan` (`discovery` absent: no sweep in this showcase), copied from `test_ops_privilege:10-12`; rooms as 6.1. The foothold from P8 then opens the network view; Ama explains it in one line ("That's the office network, seen from Julian's PC. Another lesson; close it.").
- `policies`: `desk` (`usb: "storage_blocked"`, `remote: "allowed"`), `partner` (`usb: "blocked"`), copied shapes from `demo_access_tour:53-60`. `defaultPolicy: "desk"`.
- `accountProfiles.julian_profile` (`for: { "people": ["julian"] }`, the `accessList` shape as `test_ops_privilege/scenario.json.erb:46-48`) holding a folder "Client files" with one readable document; admitted at `partner_pc` (A5, A18 profile reach). `partner_pc.access` admits `julian` and the `it` role (Graham), so Graham's sign-in there is admin.
- Start items: a storage stick (`usbClass: "storage"`), a keystroke device (`usbClass: "hid"`), the capture log holder, the cake.
- `social.osint` site `office_feed` ("Office feed") with Delphine's and Niamh's profiles (A11); `social.intelFacts` declares `delphine_dog_name` and `delphine_dog_year` (`scripts/validate_cracking.rb:192-196`: a crack fact must be an `intelFacts` id).
- `gameClock`, `logSources.signin_log` (`title` "Sign-in log", events: `signin_ok`, `signin_fail`, `signin_lockout`, `session_end`, `session_lock`, `admin_profile_read`, `usb_install_overridden`). `seedRows`: a night of failed sign-ins on `graham_pc` from 02:10 (the anomaly row), and the morning's ordinary sign-ins.

### 6.4 Beats (now)

| # | Beat | Opening from office life | Player does | Screen | Log row | Task (event) |
|---|---|---|---|---|---|---|
| P1 | Get the records | Lunch empties the IT room (or Ama's "Send them to lunch") | Search the confidential-waste bin; take the three record files. | Three rows under "Hashes" in the capture log, each Ready. | none (a take writes none) | `get_records` (ink: Ama; or the item pickup event) |
| P2 | Earn the facts | Delphine posts when her `social_media` need falls due (early in the morning, or at once on Ama's "Ask Delphine about her weekend"); coffee takes her from her desk | Read her new post on the office feed kiosk in the kitchen (one fact); take the photo from her desk while she is away (the other fact). | A toast "Delphine posted on Office feed"; two fact chips appear in the cracker. | none | `earn_facts` (ink: Ama asks what you learnt) |
| P3 | Crack a guessable one | none | Crack Delphine's record with the two facts. With one fact: "1 facts still missing"; with a wrong chip: "No match". | "Cracked"; her password joins the keyring. | none (a crack writes none) | `crack_guessable` (ink tick: `keyring_changed` carries only `{ rev }`, `keyring.js:875`, m4) |
| P4 | Crack a reused one, and wait for a salted one | The "Printer admin" note is in the cupboard by the printer | Take the note (the printer service account's login joins the keyring); crack Graham's record with no facts. It is salted: the cracker counts down about 20 seconds, then answers. | "Cracked": the printer service account's password, already held, was the same. Ama: one person used one password on two accounts. | none | `crack_reused` (ink) |
| P5 | One that never falls | none | Press Crack on Julian's record twice. | First "No match", then "This one will not fall to guessing." (`ops_cracking.rb:199-205`, `STRONG_RUN_CAP = 2` at `:20`). Ama: long random passwords are why. | none | `crack_strong` (ink) |
| P6 | A user session and the USB policy | Delphine's screen locked itself when she left | Sign in at Delphine's PC with her password from the keyring; plug the storage stick into her desk port. | Taskbar shows her name, no "Administrator". The stick is refused with the desk policy's line and stays in the tray. | `signin_ok` | `user_signin` (`pc_signed_in:delphine_pc`), `usb_refused` (`usb_refused:*`) |
| P7 | An admin session | Julian is out at his client lunch | Sign in at the partner's PC as Graham. Open "Client files" in Julian's profile. | Taskbar shows "Administrator"; Julian's profile folders appear on the desktop and open. | `signin_ok`, `admin_profile_read` | `admin_signin` (`pc_signed_in:partner_pc` with `data.username` Graham's; the event carries `npcId`, `username`, `via` and no level, `pc-sessions.js:997-1000`, so the admin level is shown on screen and asserted by the Rails test), `profile_read` (ink or container event) |
| P8 | The admin override | Still lunch | At the partner's keyboard, signed in as Graham, plug the keystroke device into the PC's socket. | Accepted; a foothold is gained and the network view opens on the office network; Ama's one line says what it is. | `usb_install_overridden` | `override` (`network_foothold_gained`) |
| P9 | The log | Evening; Graham back at his desk explains the log | Open the sign-in log PC; find your sign-ins, the admin read and the override; flag the 02:10 burst of failures. | reader table | none | `read_log` (anomaly completion) |

Free exploration: type a wrong password three times at Graham's PC and see the failures merge into one row with a count (A24 rule); sign in at Delphine's PC as Graham (admin, since desks admit IT) and see that her profile folders show only to an admin (the author's note at docs:744 explains why the USB refusal beat is placed at Delphine's port, which has no plant path for an admin: the governed stick port has no session PC, O3); lock and sign out.

Note on P6 and P8 (docs:710-745, [main]): a storage stick refused by policy cannot be put through by an admin in any validator-clean scenario (O3, open with the owner), so the override beat uses the keystroke device at `partner_pc`'s session socket, the one buildable case, as `test_ops_privilege` does; the refused storage stick at Delphine's port shows the policy line. There is no "try it signed in as nobody" aside (m6): with no session the implant answers `not_ready` quietly (`network_access.rb:502-503`), not the policy line, and no user-level account can sign in at `partner_pc`; P6 shows the refusal instead.

### 6.5 Appended later: S5b cached accounts (when `ops-priv2` lands)

What it adds, all appends to `demo_ops_passwords`:

- **Office life: the borrow.** Jun's PC gets a power socket lever (copy of the coffee socket, global `jun_pc_off`, `jun_pc.offWhen`), and Jun a `work` need on his own PC plus `workarounds: [{ "at": 60, "do": "borrow_session", "pc": "hot_desk" }]` (A10, docs:358). A new `hot_desk` sign-in PC in the office (no owner). Switch Jun's PC off: he grows frustrated, mutters, and borrows the hot desk, signing in there.
- **Fields.** `hot_desk.cachedAccounts: [ { "npc": "niamh" }, { "npc": "jun", "after": "borrow" } ]`; `partner_pc.cachedAccounts: [ { "npc": "julian" }, { "npc": "delphine" } ]`. One hash record per PC and cached account (`[logs] scripts/validate_privilege.rb:252`: "author one hash record per PC and account"): `jun_cached` (`proof.harvested: "hot_desk"`, guessable with one fact from a new feed post of Jun's, declared in `social.intelFacts`), `niamh_cached_hot_desk` (`proof.harvested: "hot_desk"`, `crack.password: "common"`: it falls on the first run, which shows a weak password next to Jun's), `delphine_cached_partner` (`proof.harvested: "partner_pc"`; same account as `delphine_hash`, so it is already cracked: the crack answers at once, `ops_cracking.rb:155`), and `julian_cached_partner` (`proof.harvested: "partner_pc"`, strong: left uncracked on purpose; the collect shows a row that will never fall, which repeats P5 in a new place and needs no new beat). `hot_desk.access` admits the `it` role so Graham's sign-in there is admin.
- **Beats.** P10 "Collect at the partner's PC": in the admin session from P7, collect the cached accounts (rows appear under "Hashes"; a second press says "Nothing new is cached here."). P11 "The borrow": switch Jun's PC off, watch him borrow the hot desk, then sign in at the hot desk as Graham and collect; Jun's row appears only after the borrow, Niamh's from the start. P12 crack Jun's (one fact) and Niamh's (no facts, falls at once). Jun gets `frustration.perFail` high enough that one or two failed uses reach `at` 60 (PLAYTEST.md gives the expected seconds, M10).
- **Log.** Add `credentials_harvested` to `signin_log.events`.
- **Tasks.** New aim at the end, `afternoon_cache` "Afternoon: what a PC remembers": `collect_partner`, `see_borrow`, `collect_hot_desk`, `crack_cached`.
- **Ink.** New Ama hub choices after the existing ones ("Switch Jun's PC off" lever; "What did that show?" recap knots for the new tasks); Jun gets new knots (two frustrated lines and a mutter pool `work_fail_pc`).

### 6.6 Appended later: S5c account kinds (when `ops-priv2` lands, same wave as 6.5)

- **Office life: the desk admin on a rota.** A new account-only NPC `deskadmin` (`accountOnly: true`, `creds: { username, password, accountKind: "local", localTo: ["delphine_pc", "jun_pc", "hot_desk"] }`, `staff`, `role: "it"`). Graham's ink gains a rota knot: on Tuesdays he does the desk rounds with the shared desk-admin account; the rota sheet on the IT room wall (a readable item) says which desks it covers. The password is learnt by the feature's own route: `deskadmin` gets a hash record in the bin (`deskadmin_record_file`) whose class is set on the record as `crack: { password: "common" }`, which cracks on the first run (A21 `common`). An `accountOnly` NPC may carry only `id`, `displayName`, `npcType`, `creds`, `role`, `staff` and `accountOnly` (`[logs] scripts/validate_privilege.rb:328`), so the class cannot go in `habits` (m9). The record file is a new item placed in the bin (an append to the bin's `contents`, at the end).
- **Domains.** `domain: "merrin"` on `delphine_pc`, `jun_pc`, `hot_desk`, `graham_pc`, `partner_pc`; Graham's, Delphine's, Julian's, Jun's and Niamh's `creds` gain `accountKind: "domain", domain: "merrin"`. Keyboard sign-in and lock screens show "Domain: merrin".
- **Beats.** P13 "A local account stays local": sign in at Delphine's PC as `deskadmin` (works, user or admin per its `admin` field: plan `admin: true` so it is a second admin path on the desks only); P14 try the same at `partner_pc`: "This account can't sign in on this PC." with no lockout counted. P15 notice "Domain: merrin" on the sign-in screen.
- **Log.** Add `signin_refused` to `signin_log.events`.
- **Tasks.** Appended to the S5b aim: `local_account`, `local_refused`.
- **Caution for the builder.** Adding `accountKind`/`domain` to existing `creds` changes no earlier beat only if every PC that admitted an account before still admits it (all PCs get the same domain). The Rails test's existing beats must still pass unchanged; that is the check that this is an append.

### 6.7 Objectives (now)

- Aim `morning` "Morning: the records": `get_records`, `earn_facts`.
- Aim `midday` "Midday: crack and sign in": `crack_guessable`, `crack_reused`, `crack_strong`, `user_signin`, `usb_refused`, `admin_signin`, `profile_read`, `override`.
- Aim `evening` "Evening: the trail": `read_log`.

### 6.8 mission.json outline

`display_name` "Ops demo: passwords"; `description` "A box of old password records turns up in the bin at Merrin & Sallow. Earn facts from office life, crack what will crack, then see what an administrator's sign-in reaches that a user's does not."; `estimated_duration_minutes` 15 (20 after the appends); other fields as section 4.

### 6.9 End state

Delphine's and Graham's passwords in the keyring; Julian's shown as unbreakable; a user session at Delphine's PC, an admin session and a foothold at the partner's PC; the sign-in log showing sign-ins, the admin read and the override, with the night-time burst flagged. With S5b and S5c: cached rows collected at two PCs, Jun's after his borrow, and the local account refused at the partner's PC.

### 6.10 Voiced lines (draft)

Ama about 40 (now) plus about 12 (appends); Delphine about 8; Graham about 12 plus 6 (rota); Julian about 6; Niamh about 8 (feed gossip, chatter); Jun about 6 (borrow). New spoken lines about 110 in total. Feed posts are text, not voiced.

## 7. `demo_ops_second_step`: "What a second step stops"

**Build:** now for A22 and the log (wave 1); S8b appended when `ops-helpdesk` lands, S8c when `ops-lock2` lands (wave 3, in landing order, one after the other because they touch the same files). **Duration:** 18 minutes now, 25 with the appends (m12). **Teaching question:** a password is easy to come by in a busy office; what does a second step add, and where does it give way?

**Premise.** Merrin & Sallow turned on a second sign-in step last month. Ama wants to show the staff what it does and does not stop. In one morning you will see three people's passwords escape through ordinary habits (a note under a keyboard, a note written in a temper, a login said aloud), and then see the second step hold, give way to someone tapping Approve to make the prompts stop, give way to a fob left on a desk and a phone left by the coffee machine, and be skipped entirely by a screen left open.

### 7.1 Rooms and layout

```
                  [records_room]   (added by the S8c append)
                        |
 [kitchen] ------- [office] ------- [it_room]
                        |
                  [reception]  (start)
```

| Room | Type | Contents that matter |
|---|---|---|
| `reception` (start) | `room_reception` | Lorna's desk and PC (`lorna_pc`, policy `front`, push); the visitor kiosk `visitor_kiosk` (sign-in, policy `kiosk`) and its login card `kiosk_card` (a readable clue item at the kiosk, as `test_ops_mfa:228-238`); Niamh, the reception temp whose account the kiosk uses; Ama. |
| `office` | `room_office` | Desks and PCs for Darren (`darren_pc`, policy `floor`, push), Anjali (`anjali_pc`, policy `finance`, code), Yusuf (`yusuf_pc`, policy `ops`, number match); Anjali's code fob `anjali_fob` (`code_device`, owner `anjali`, `leftBehindChance: 1`, declared spot her desk); Yusuf's phone `yusuf_phone` (`phone_friendface`, owner `yusuf`, `leftBehindChance: 1`, declared spot beside the office coffee machine). A left-behind item is a seeded roll on every leave, shown at its declared spot and stowed on return (`npc-needs.js:3366-3378`), so with chance 1 the fob is on Anjali's desk and the phone by the coffee machine whenever their owners are away from their desks (m10). The office printer resource and its socket lever; office coffee; notice board. |
| `kitchen` | `room_break` | Copied kitchen block. |
| `it_room` | `room_it` | Thandiwe (IT support); the audit-log reader `mfa_log_pc`. With S8b: the helpdesk counter. |
| `records_room` (S8c) | `room_lw_records` | Gwen's records safe and the gated door; see 7.6. |

### 7.2 Cast

| NPC | Where | Needs and routine | Account, habit and what it opens |
|---|---|---|---|
| Ama Owusu (host) | reception | none | Levers: "Send them for coffee", "Switch the printer off" (also the socket in the office), "Send them to lunch", "Call it a day". |
| Lorna Easton | reception | caffeine, social, hunger (lunch mapping `hunger: 20`) | `awareness` high: `approvesPrompts: "never"`. Her screen locks on every leave: no screen habit, so the object default `locksScreenOnLeave` true applies (`workstation-state.js:8`). Requests to her go unanswered: a `never` owner never approves (docs:805), and no deny is written unless the player answers on a held phone (`mfa_sign_in.rb:188-192`). The request still reaches her phone wherever she is. On her return to her desk after unanswered requests she barks ("Sign-in requests on my phone and I wasn't even at my desk. I'm telling IT."): the step holding. |
| Darren Price | office | caffeine, hunger (lunch mapping `hunger: 20`), work on the office printer resource; social | `habits.approvesPrompts: "pestered"`, `promptPatience: 3`; `workarounds: [{ "at": 60, "do": "writes_down" }]` with `frustration.perFail` high enough that one or two failed prints reach 60 (PLAYTEST.md gives the expected seconds, M10): when the printer is off he writes his password on a note at his PC (docs:177). `habits.screen: { lockIfAwayOverSeconds: 90 }` (in place of `lockChance: 0`, `workstation-state.js:80-83,155-156`): his short coffee trip leaves the screen open (M8, the way round); his long lunch locks it (M5, pestered approvals arrive while he eats). |
| Anjali Rao | office | thirst (cooler with Yusuf: copied exchange pattern) | `habits.writesDown: true` (note at her PC); code fob shown on her desk whenever she is away from it. Her fob stays live through S8b (M12 re-enrols Yusuf, not her) because S8c's safe needs it. |
| Yusuf Demir | office | caffeine (queues at the office coffee) | `workarounds: [{ "at": 50, "do": "share_login", "with": "anjali" }]` with `frustration.perFail` high enough that one or two failed prints reach 50; says his login aloud to Anjali (`share_login`, `npc-workarounds.js:46-58`). The listening window is the 6-second dwell (`SHARE_DWELL_S`, `:70`), so his `wk_share_login` start line ("Printer's dead. I'll ask Anjali to send it from hers.") and an Ama bark on `npc_workaround:yusuf_demir` with phase `started` ("Yusuf's off to Anjali's desk. Stand close.") tell the player to go to Anjali's desk before it opens. His phone is shown by the coffee machine whenever he is away from his desk. |
| Thandiwe Moyo | IT room | work, social | Explains the mfa log in the evening; with S8b, runs the helpdesk. |
| Niamh Doherty | reception, a stool by the kiosk | thirst | The reception temp: a person with a sprite (on main an account is a person, `test_ops_mfa:282-293`), a short ambient line, `creds.mfa: false`. The kiosk signs in as her with a password alone, to show an exempt account; the login is on the card at the kiosk (rule 7 allows a clue item). |

### 7.3 Ops fields switched on

- `policies`: `front` (`mfa: "push"`), `floor` (`mfa: "push"`), `finance` (`mfa: "code"`, no `maxAttempts`, per the validator warning), `ops` (`mfa: "push_number_match"`), `kiosk` (`mfa: "push"`; Niamh's `creds.mfa: false` makes her exempt). `remote: "allowed"` is not needed (no network in this showcase).
- Items: `anjali_fob` (`type: "code_device"`, `owner: "anjali"`), `yusuf_phone` (`type: "phone_friendface"`, `owner: "yusuf"`), `social.osint` for the phone (two staff posts, no facts). Darren's phone stays on him (pestered approvals arrive there).
- `resources.office_printer` and `roles.<staff>.workNeeds` (A10) so the printer lever drives Darren's and Yusuf's workarounds.
- `gameClock`, `logSources.mfa_log` (`title` "Sign-in and approvals", events: `signin_ok`, `signin_fail`, `mfa_challenge`, `mfa_code_ok`, `mfa_code_wrong`, `mfa_code_locked`, `mfa_expired`, `mfa_prompt_sent`, `mfa_prompt_approved`, `mfa_prompt_denied`). `seedRows`: an overnight run of twelve approval requests to Darren from 01:40 (the anomaly row: someone else was pestering him first).

### 7.4 Beats (now)

| # | Beat | Opening from office life | Player does | Screen | Log rows | Task (event) |
|---|---|---|---|---|---|---|
| M1 | A password escapes (written) | Anjali's note is under her keyboard; she is at the cooler (or Ama's coffee lever) | Read the note at Anjali's PC. | Her tile shows the note (A4). | none | `see_note` (ink or `npc_overheard_login`-style event: probe P6) |
| M2 | A password escapes (in a temper) | Switch the printer off (Ama's lever or the socket); Darren mutters, then writes his password down | Read Darren's new note. | as M1 | none | `see_temper_note` (`npc_workaround:darren` phase `done`) |
| M3 | A password escapes (said aloud) | Same outage: Yusuf tells Anjali his login | Stand near and overhear. | The overheard login joins the keyring or notes (as `test_access_work`). | none | `overhear` (`npc_overheard_login:*`) |
| M4 | The step holds | Lorna goes for coffee (or Ama's coffee lever); being alert, she locks her screen | Sign in at Lorna's PC with her password, which Ama hands over as a keyring credential at the start (Lorna agreed to be the test; A14 declared grant, A15 keyring), and send the request; send it again. | Push pane: "A request was sent to Lorna's phone." Nothing comes back; the request waits, then expires. On her return Lorna barks. | `mfa_challenge`, `mfa_prompt_sent` (one row with a count) | `step_holds` (`mfa_prompt_sent:lorna_easton` with `data.n >= 2`, the suffixed name from `emitBoth`, `mfa-client.js:80-84,262`) |
| M5 | Pestered into approving | Lunch (Ama's "Send them to lunch"): Darren is away longer than 90 seconds, so his screen locks; he eats with his phone | Sign in at Darren's PC (his password from his temper note, M2); send again until he gives in (three requests). Ama: "He approved just to make it stop." | Pane closes on approval; desktop opens. | `mfa_prompt_sent` (count 3), `mfa_prompt_approved`, `signin_ok` | `pestered` (`mfa_approved:darren_price`) |
| M6 | A fob left on a desk | Anjali goes to the cooler and the fob is on her desk | Take the fob; sign in at her PC; use the fob for the six digits. A wrong code first shows "try again" (five tries). | Code pane; "Use Anjali's fob" opens the device over the screen. | `mfa_challenge`, `mfa_code_wrong` (if tried), `mfa_code_ok` | `fob` (`pc_signed_in:anjali_pc`) |
| M7 | A phone left by the coffee | Yusuf queues for coffee and his phone is on the side by the machine | Take the phone; sign in at his PC; pick the matching number on his phone. Pick a wrong one first to see the step cancel without counting as a failed sign-in. | Two-digit number on the pane; three choices on the phone. | `mfa_prompt_sent`, `mfa_prompt_approved` or `mfa_prompt_denied` | `number_match` (`pc_signed_in:yusuf_pc`) |
| M8 | The way round | Morning coffee: Darren's trip is short (under 90 seconds), so he leaves his screen open | Use Darren's open screen while he is at the coffee. No step is asked: the second step guards signing in, not a screen someone left open. | His desktop. | none (a claim writes no sign-in row) | `open_screen` (`workstation_accessed:darren_pc`) |
| M9 | An exempt account | none | Read the login card at the visitor kiosk; sign in there: password only. | Desktop, no step. | `signin_ok` | `exempt` (`pc_signed_in:visitor_kiosk`) |
| M10 | The log | Evening; Thandiwe explains | Open the approvals log; find your rows, including Lorna's unanswered requests and Darren's approval; flag the 01:40 burst to Darren. | reader | none | `read_log` (anomaly completion) |

**Who is where for each sign-in (B1).** A PC whose owner is at the desk answers "<owner> is using this PC." and shows no sign-in (`unlock-system.js:629-663`, `workstation-state.js:55`); a PC whose owner is away with the screen open is claimed, not signed into (`unlock-system.js:672-678`). So every sign-in beat (M4, M5, M6, M7) runs while the owner is away and the screen is locked, and the one claim beat (M8) runs while the owner is away and the screen is open. Darren's `lockIfAwayOverSeconds: 90` gives both: M8 on his short coffee trip, M5 on his long lunch (the threshold reads the trip's `expectedAwayMs`; the S-S unit records the expected coffee and lunch durations from the needs log in BUILD_REPORT and moves the threshold if the coffee trip's estimate is over 90 s). Anjali's and Yusuf's screens lock on every leave (no screen habit: the object default `locksScreenOnLeave` true). Lorna's return bark is a mapping on `npc_returned_post:lorna_easton` (`npc-needs.js:1526`), onceOnly, with the condition that a global set by the `step_holds` mapping is true. The validator will warn "a push PC nobody passes" for `lorna_pc`; that warning is intended and goes in the build report with this reason.

Free exploration: let a push wait past its expiry (`mfa_expired`); hand the phone back by dropping it on Yusuf's desk; sign out and back in at Darren's PC (a saved connection still asks).

### 7.5 Appended later: S8b helpdesk (when `ops-helpdesk` lands)

- **Office life: a helpdesk that answers.** Thandiwe becomes the desk NPC: `helpdesks.it_desk` (`npc: "thandiwe"`, `verify: "questions"`, `questions: ["staff_no", "manager"]`, `minCorrect: 2`, `maxTries: 3`, `resets: ["password", "mfa"]`, `questionLabels` "Staff number", "Line manager"). Her ink gains a new hub choice with the `#helpdesk_request:it_desk` tag and a next-knot reply reading `helpdesk_it_desk_result`. The desk needs Thandiwe to exist, be met and not be knocked out; it does not check that she is present, and the form on a PC works wherever she is ([build] docs:890). So the office-life window is not her presence: the answers are (below). Her ink hub choice for the request is gated on her being at her post only as story (a condition in ink), and PLAYTEST.md says the form works while she is at lunch.
- **Answers from office life.** Each account in the beat gets `creds.recovery` (`staff_no`, `manager`) and `creds.resetPassword`. Darren's staff number is on his ID badge, a left-behind item on his desk (`leftBehindChance: 1`, shown on every leave); his manager is on the staff board in the kitchen. The builder copies the exact clue pattern `[build] scenarios/test_ops_helpdesk` uses so the leak scanner stays quiet (rule 7).
- **The form on a desktop.** A `helpdesk_form` item (`desk: "it_desk"`) in `darren_pc`'s contents: reachable from his open screen (M8).
- **Beats.** M11 "Reset a password": ask Thandiwe to reset Darren's password with his two answers; the keyring gains a "Reset" sign-in; his old written note is now stale and refused. M12 "Re-enrol a second step": ask for Yusuf's sign-in approval reset (his `creds.recovery` answers come from the same clue pattern); his number match moves to "My phone": sign in at his PC and pick the number on your own phone (the "own phone" beat); his left-behind phone no longer gets the request. Not Anjali: re-enrolment retires the old code device ("No longer in use", [build] docs:876) and S8c's safe needs her fob live; and a lock never approves from an owner's own-phone reset ([skin] docs:879). The S-8c brief repeats this so the later unit does not pick Anjali. M13 "The desk says no": give one wrong answer three times; the desk stops serving that username for five minutes, and the refusal never says whether the username exists.
- **Log.** Add `helpdesk_request`, `account_password_reset`, `account_mfa_reenrolled` to `mfa_log.events`.
- **Tasks.** New aim at the end, `afternoon_helpdesk` "Afternoon: the helpdesk": `reset_password`, `reenrol`, `desk_refuses`.

### 7.6 Appended later: S8c second step on locks (when `ops-lock2` lands)

- **New room** `records_room` (`room_lw_records`) north of the office (office gains `connections.north`; the connection is an append to the office's `connections`, check door alignment with `scripts/check_door_alignment.py`). Locked door: `locked: true`, `lockType: "pin"`, PIN on the facilities notice in the kitchen (a readable item), and `secondStep: { "kind": "push", "owner": "gwen" }`.
- **New cast.** Neither has her desk inside the records room: an NPC behind a locked door is never simulated (README_scenario_design.md:1369). Gwen Pritchard, records manager, desk in the office (a new desk object appended to the office), owner of the records room door's step (`approvesPrompts: "never"`, caffeine and hunger needs). Her phone `gwen_phone` (`phone_friendface`, `owner: "gwen"`, `leftBehindChance: 1`, declared spot on the kitchen charger, `npc-needs.js:3366-3378`) is on the charger whenever she is away from her desk; Ama's coffee or lunch lever reaches her (new mappings at the end of her array). Pick the phone up and approve the door request on it. Fatima Begum, records clerk, desk in the office, carries archive boxes; she is frustrated by her own resource, not the printer (M8: the printer lever is used in the morning, and `prop_door` opens the room "for the rest of the mission", README:1357, so a printer-driven prop would skip M14). Her `work` need is on a new resource `records_index` (`offWhen: "records_index_off"`, its own wall switch in the office and a new Ama lever "Switch the records index off", used only after M14). When it fails she props the door (`workarounds` `do: "prop_door"`, `door: "records_room"`, `prop: "records_wedge"`). A propped door skips every step ([skin] docs:869).
- **The wedge** (m8). `prop_door` needs both `door` and `prop` (README:1349,1369): `records_wedge`, a door-wedge object in the office beside the records door, never inside the records room, hidden with `revealOnGlobal` on the workaround's `setGlobal`.
- **Locks.** `records_safe` (`locked`, `lockType: "pin"`, PIN in Gwen's desk drawer note, `secondStep: { "kind": "code", "owner": "anjali" }`, the fob from M6: a code step on a safe). `darren_case` (Darren's briefcase under his desk, takeable container, `locked`, `lockType: "key"` with `keyPins` and the key in his desk drawer, `secondStep: { "kind": "push", "owner": "darren" }`: carry it away, drop it, pick it up, and the request count carries on until he approves).
- **Beats.** M14 the door: right PIN, then the push pane; Gwen does not answer; send her for coffee, take her phone from the kitchen charger and approve. M15 the prop, only after M14: switch the records index off and watch Fatima prop the door; walk in with no step. Run E keeps this order because a prop opens the room for the rest of the mission, so M15 first would leave M14 nothing to show. (Since the room is then open, a teacher who wants M14 again starts a new game.) M16 the safe with the fob. M17 the carried case: three requests, a drop and pick-up between them, then Darren approves.
- **Log.** The same `mfa_*` events with `where.kind` `door` and `object`; widen `mfa_log.where` if a `where` filter was set.
- **Tasks.** New aim at the end, `late_locks` "Late: doors, safes and cases": `door_step`, `propped`, `safe_step`, `case_step`.

### 7.7 Objectives (now)

- Aim `morning` "Morning: passwords escape": `see_note`, `see_temper_note`, `overhear`, `step_holds`, `open_screen` (both run on the morning coffee trips, B1).
- Aim `midday` "Midday: the second step": `fob`, `number_match`, `pestered`, `exempt`.
- Aim `evening` "Evening: the trail": `read_log`.

### 7.8 mission.json outline

`display_name` "Ops demo: second steps"; `description` "Merrin & Sallow have just switched on a second sign-in step. Watch passwords escape through ordinary habits, then see the second step hold, give way, and get skipped."; `estimated_duration_minutes` 18 (25 after the appends): ten beats, two outage waits (M2, M3) and a lunch turn do not fit in 15 (m12).

### 7.9 End state

Every PC in the office signed into by one route or another; Lorna's unanswered requests and Darren's approval both in the log; the overnight burst flagged. With S8b: a reset password and an approval moved to the player's phone. With S8c: the records room, its safe and Darren's case opened, one by approval, one by a propped door.

### 7.10 Voiced lines (draft)

Ama about 40 plus 15 (appends); Lorna about 6; Darren about 10 (temper, approvals); Anjali about 6; Yusuf about 6 (including the login said aloud: the spoken line must not contain the password; the overheard login comes from the engine's `share_login` mechanism, not from the voiced text); Thandiwe about 8 plus 12 (helpdesk); Gwen and Fatima about 8 each (S8c). About 120 new spoken lines in total.

## 8. Build order, probes, units and checks

### 8.1 What is on main now and what waits

| Feature | Where now | Showcase | When |
|---|---|---|---|
| N13, N14, N15, N16, realism, network and share log rows | main and ops-follow1 | `demo_ops_recon` | build now |
| A21 cracker, A18 admin and profiles, A10b USB, sign-in log rows | main | `demo_ops_passwords` | build now |
| A22 second step on PCs, mfa log rows | main | `demo_ops_second_step` | build now |
| A24 log source and reader, seed rows, anomaly flag | main | all three | build now |
| A19 cached accounts (S5b), A20 account kinds (S5c) | `ops-priv2` (`/data/be-ops-logs`) | `demo_ops_passwords` sections 6.5, 6.6 | after `ops-priv2` lands on main |
| A23 helpdesk (S8b) | `ops-helpdesk` (`/data/be-ops-build`) | `demo_ops_second_step` section 7.5 | after `ops-helpdesk` lands |
| A25 lock step (S8c) | `ops-lock2` (`/data/be-ops-skin`) | `demo_ops_second_step` section 7.6 | after `ops-lock2` lands; after 7.5 if both are waiting |
| ops-follow1 follow-ups (cracker fills sign-in, opens from a hash file and a toast; Terminal lasts the life of the view; tools default to Panels; unopenable-container warning) | `ops-follow1`, uncommitted in part | all three | re-check after they land (8.6) |

The showcases are built on branch `ops-follow1` in `/data/be-ops-follow` (where this plan lives) and land with it. Appends are built on a branch from main after the stage lands, so they never depend on an unlanded branch. The validator on main gives `privilege: ... is not built yet (privilege plan stage S5b)` errors for S5b and S5c fields (docs:745, [main]), so none of those fields may appear before `ops-priv2` lands.

### 8.2 Probes (first step of each wave-1 unit that needs them; each writes its answer into the scenario's `planning/BUILD_REPORT.md` with file:line)

| Id | Question | Who | Fallback |
|---|---|---|---|
| P1 | Which client event fires when a share folder opens over the network, and with what payload? | recon scenario unit | Ink tick from Ama ("Tell Ama what was on the drive"). |
| P2 | Answered (R1 m4): no skin-switch event; the view emits only `network_swept`, `_host_scanned`, `_service_checked`, `_finding_confirmed`, `_technique_used`, `_technique_refused`, `_host_opened`, `_viewed`. | none | Ink tick (R6). |
| P3 | Answered: `network_finding_confirmed` carries `{ findingId, status }` and a suffixed name (`network-view-minigame.js:1071`). The recon unit only records the exact id form the confirm sends. | recon scenario unit | none needed (R4 ticks on the two suffixed names). |
| P4 | Answered: `keyring_changed` carries `{ rev }` only (`keyring.js:875`). | none | Ink tick (P3, P4 beats). |
| P5 | Answered: `pc_signed_in` carries `npcId`, `username`, `via`, no level (`pc-sessions.js:997-1000`). | none | Condition on the username; the admin level is shown on screen and checked by the Rails test. |
| P6 | Is there an event when a written-down note is shown on a sign-in tile? | second-step scenario unit | Ink tick. |
| P7 | Settled by R1 M8: Fatima's frustration comes from her own `records_index` resource, not the printer (7.6). The S8c unit only checks whether a held-up second step also raises it; if it does, it records that and keeps the records-index lever as the forcing route. | S8c append unit | none needed. |
| P8 | Office-life sync budget (V8) for each scenario after the first draft: reveal globals, onceOnly mappings, items, small keys. | each scenario unit | Cut onceOnly barks first (keep the tasks), then fold items. List any remaining V8 warning with its reason. |
| P9 | Answered: yes, `emitBoth` adds the `:<npcId>` suffix (`mfa-client.js:80-84`), and `mfa_prompt_sent` carries `n` (`:262`). | none | none needed. |
| P10 | Partly answered: the heard answer shows a toast, adds the evidence note and mirrors the capture (`npc-workarounds.js:46-58`); the window is the 6 s dwell. Open: the hearing range (`NPCNeedsSystem.playerHears`). | second-step scenario unit | Place Anjali's desk beside Yusuf's and say "stand by Anjali's desk" in the notice and Ama's bark. |

### 8.3 Build units (Sonnet builders, disjoint files)

Every brief carries: this plan's path and its section, the digest path, "touch only the files listed", "re-read a shared file just before editing it", the handover rule ("When your context passes about 150k tokens, finish the step you are on, commit, write a handover note to `scenarios/<name>/planning/HANDOVER_<unit>.md` (done, open, files touched, commits, gotchas), report back and stop"), and the commit form `git commit -m "..." -- <paths>`.

**Wave 0 (Opus): plan review.** 2 to 5 adversarial rounds on this plan (AGENTS.md "The mission loop" step 2), then the owner's answers to section 9.

**Wave 1 (six units in parallel):**

| Unit | Files (only these) | Content |
|---|---|---|
| R-S | `scenarios/demo_ops_recon/scenario.json.erb`, `mission.json`, `planning/BUILD_REPORT.md` | Section 5.1 to 5.7; probes P1, P3, P8. Validate with `--skip-ink --no-graph` until R-I lands, then with `--no-graph`. |
| R-I | `scenarios/demo_ops_recon/ink/*`, `planning/VOICED_LINES.md` | Ama, Zainab, Graham, Chidi, Jun, Agnieszka: hub, levers, recap knots, the card hand-over (Zainab), the log beat (Graham). Knot names fixed in the brief from section 5.4. |
| P-S | `scenarios/demo_ops_passwords/scenario.json.erb`, `mission.json`, `planning/BUILD_REPORT.md` | Sections 6.1 to 6.4, 6.7 to 6.9; probe P8. |
| P-I | `scenarios/demo_ops_passwords/ink/*`, `planning/VOICED_LINES.md` | Ama, Delphine, Graham, Julian, Niamh, Jun. |
| S-S | `scenarios/demo_ops_second_step/scenario.json.erb`, `mission.json`, `planning/BUILD_REPORT.md` | Sections 7.1 to 7.4, 7.7 to 7.9; probes P6, P8, P10. |
| S-I | `scenarios/demo_ops_second_step/ink/*`, `planning/VOICED_LINES.md` | Ama, Lorna, Darren, Anjali, Yusuf, Thandiwe. |

The S and I units of one scenario agree on knot names and globals through the brief, not by reading each other's work in progress. Each S unit finishes by running the full validator with `--no-graph` once the I unit has committed; only the T unit (wave 2) writes `dungeon_graph.*` (m7).

**Wave 2 (three units in parallel, one per scenario):**

| Unit | Files | Content |
|---|---|---|
| R-T | `test/controllers/break_escape/demo_ops_recon_scenario_test.rb`, `scenarios/demo_ops_recon/PLAYTEST.md`, `scenarios/demo_ops_recon/dungeon_graph.*` | Rails test of every beat with a server side (plug, sweep, scan, check, confirm, the printer's saved connection, both file-server technique sessions, the share refused before the admin session and served after it, log rows, the anomaly flag), driven through real routes as `ops_mfa_scenario_test.rb` is, each assertion read from a re-read game. Then the leak scan (8.4). PLAYTEST.md (8.5). |
| P-T | `test/controllers/break_escape/demo_ops_passwords_scenario_test.rb`, `scenarios/demo_ops_passwords/PLAYTEST.md`, `.../planning/CRACKER_RUNBOOK.md`, `.../dungeon_graph.*` | Rails test: take the records, earn facts, the feed post and its fact (via the lever's need value), crack (missing, wrong, cracked; reused only after the printer note, with the salted wait on Graham's record via `travel_to`; strong: `nomatch` then `infeasible`), sign in as user and as admin, the printer service account refused at every PC, profile read and its row, the USB refusal and the override with its foothold, log rows. |
| S-T | `test/controllers/break_escape/demo_ops_second_step_scenario_test.rb`, `scenarios/demo_ops_second_step/PLAYTEST.md`, `.../dungeon_graph.*` | Rails test: pushes to Lorna unanswered (no approval, no deny row), a sign-in refused while the owner is at the desk, pestered approval at the patience count, code from the held fob (read from the device route, time frozen), number match right and wrong, claim skips the step, exempt account, log rows. |

**Wave 2b: reviews and playtests.** Per scenario: an Opus implementation review, `npc-dialog-review` (Opus), a Sonnet fixer, then the browser runs (8.5). Rounds per AGENTS.md (2 to 5; delta rounds on Sonnet once clean, Opus for any delta that touches what the server serves).

**Wave 3: appends, as each branch lands.** One unit per stage, each owning that scenario's whole file set for its run (scenario, ink, test, PLAYTEST.md, graph, BUILD_REPORT), so they never run at the same time on one scenario:

| Unit | When | Scenario | Content |
|---|---|---|---|
| P-S5 | `ops-priv2` on main | passwords | Sections 6.5 and 6.6, new test cases appended to the test class, new PLAYTEST beats P10 to P15. |
| S-8b | `ops-helpdesk` on main | second step | Section 7.5, test cases, beats M11 to M13. |
| S-8c | `ops-lock2` on main, after S-8b if both are waiting | second step | Section 7.6, probe P7, test cases, beats M14 to M17, the lock-step leak rules. |

Each append ends with `tools/check_mapping_index_drift.rb main scenarios/<name>/scenario.json.erb` (0 failures) and the scenario's existing test cases passing unchanged; that is the proof it is an append.

**Wave 4: follow-up re-check** (8.6).

### 8.4 Done, for every unit that ends a scenario's build (R-T, P-T, S-T and each wave-3 unit)

1. `ruby scripts/validate_scenario.rb scenarios/<name>/scenario.json.erb`: 0 errors; warnings listed in `planning/BUILD_REPORT.md` each with a reason. This run regenerates `scenarios/<name>/dungeon_graph.*` and nothing else (never run the validator over other scenarios without `--no-graph`).
2. Ink compiles (the validator's ink step, plus `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<name>/` with 0 ERROR lines).
3. `ruby tools/check_mapping_index_drift.rb main scenarios/<name>/scenario.json.erb`: 0 failures (a new scenario is skipped on first build; it matters for appends).
4. `bin/rails test test/controllers/break_escape/demo_ops_<theme>_scenario_test.rb` passes (never `ruby -Itest`; never with `RAILS_ENV=development` in the shell).
5. The leak scanner over that run reports nothing: the test's last case passes every answer the run received through `tools/playtest/lib/access_leak_scanner.rb` (as `test/controllers/break_escape/access_leak_scanner_mfa_real_test.rb` does), with `lock_step_leak_rules.rb` active for S8c, and asserts zero findings. The browser run (8.5) also ends with `bin/rails runner tools/playtest/access-leak-check.rb <game_id>` (with `--signin` names where a sign-in PC is ambiguous) and `tools/playtest/verify-run.rb <game_id> --access --ops-log`.
6. `grep` over the scenario's files and the test for every password, reset password and recovery answer the scenario defines: each appears only in `creds`, `credentials`, the clue mechanism the plan names, and the test's constants.
7. Commit by explicit paths.

### 8.5 Browser playtest outlines (Haiku, from PLAYTEST.md)

Every run: keyless server on :3001, a fresh game made in that run (`PLAYTEST_PORT=3001 tools/playtest/new-game.rb`, with the scenario swapped in by `tools/playtest/swap-scenario-game.rb`, no seeding), the `window.__test` bridge, findings written as the run goes, a screenshot per beat, an earned-secrets table (each secret read from its in-game source). Runs are split so each is 10 to 15 minutes, and one run per scenario has a mid-run reload. A Sonnet run checks any "stuck" claim before it counts.

**`demo_ops_recon` PLAYTEST.md**
- Run A (morning): talk to Ama, choose "Send them for coffee"; wait for `npc_left_post:jun_watanabe`; walk to the hot desk; open the inventory, pick the drop box, use it on the hot-desk jack (R1). In the network view: sweep "Office network" (R2); on the printer row, scan (R3); on the admin page tile, check, then confirm `f1` and `f2` (R4). Reload; reopen the view from the drop box; findings and aliases unchanged.
- Run B (midday): open the printer cupboard, take the "Factory accounts" card; in the view, pick the card and the real finding, use: a saved connection joins the keyring; open Agnieszka's PC row (R5); pick the card against the decoy (refused). Switch the header to Terminal; scan and check the file server with the quick-command buttons; screenshot the realism text; switch back to Panels (R6).
- Run C (evening): Ama, "Call it a day"; go to the kitchen, talk to Zainab, accept the card (R7); try to open the shared drive (refused); use the card on the file server's update finding (user session); confirm the link finding; take the "Left-open settings" card from Zainab's tool roll in the server room; use it on the link finding (admin session); open the shared drive. Talk to Graham; open the network log PC; filter to the jack rows; open the 07:12 row and flag it (R8). Unplug the drop box (free beat).

**`demo_ops_passwords` PLAYTEST.md**
- Run A: Ama, "Ask Delphine about her weekend"; wait for the "Delphine posted" toast; read her post on the feed kiosk in the kitchen. Ama, "Send them for coffee"; while Delphine is away, take her photo (P2). "Send them to lunch"; wait for `npc_left_post:graham_whitfield` (seconds, hunger 20); enter the IT room; open the confidential-waste bin; take the three files (P1). Open the capture log: three hash rows.
- Run B (the cracker beats, to `opus48` from `planning/CRACKER_RUNBOOK.md`): crack Delphine's with one chip ("1 facts still missing"), with a wrong chip ("No match"), with both ("Cracked") (P3); crack Graham's before the note ("No match"), take the printer note, crack again, wait out the countdown of about 20 seconds ("Cracked") (P4); press Crack on Julian's twice ("No match", then "This one will not fall to guessing") (P5). The runbook gives exact chip labels, the order of presses and the expected messages, and says where each fact is earned, never the passwords.
- Run C: sign in at Delphine's PC from the keyring; screenshot the taskbar (no Administrator); plug the storage stick into her desk port: refused with the policy line (P6). Go to the partner's office while Julian is out; sign in as Graham; screenshot "Administrator"; open Julian's "Client files" (P7); plug the keystroke device into the PC's socket (P8). Reload; the admin session's marker is back after the desktop answer. Open the sign-in log; flag the 02:10 row (P9).
- After S5b/S5c: Run D (collect at the partner's PC, Jun's borrow and the hot desk, crack Jun's; the desk admin refused at the partner's PC, "Domain: merrin" on the screen).

**`demo_ops_second_step` PLAYTEST.md**
- Run A: at Lorna's PC while she is there: "Lorna is using this PC." (no sign-in). Ama hands over Lorna's sign-in; "Send them for coffee"; when Lorna has left and her screen is locked, sign in at her PC and send the request twice (M4); read Anjali's note while she is at the cooler (M1); while Darren is at the coffee (under 90 s), use his open screen (M8). Ama's "Switch the printer off"; wait for Darren's note (PLAYTEST.md gives the expected seconds); when Ama says Yusuf is off to Anjali's desk, stand by it to overhear him (M2, M3). Back at reception, Lorna's return bark.
- Run B: whenever Anjali leaves her desk her fob is on it: take it; sign in at her PC; type a wrong code once, then use the fob (M6). Whenever Yusuf leaves his desk his phone is by the coffee machine: take it; sign in at his PC; pick a wrong number (the step cancels), then the right one (M7). Reload mid-run after M6.
- Run C: "Send them to lunch"; when Darren's screen is locked, sign in at his PC with his noted password; send again until he approves (M5); read the card at the visitor kiosk and sign in there (M9); "Call it a day"; open the approvals log; flag the 01:40 burst (M10).
- After S8b: Run D (M11 to M13). After S8c: Run E (M14 before M15, because Fatima's prop opens the records room for the rest of the mission; then M16, M17, including the drop and pick-up of Darren's case between requests).

### 8.6 ops-follow1 follow-ups: what each changes

- **Cracker fills sign-in, opens from a hash file and a toast:** `demo_ops_passwords` PLAYTEST Run B and the runbook gain the shorter paths (open the cracker from the record file in the inventory; from the toast after a take; a cracked password offered at the sign-in). The old path through the capture log stays as a beat. No scenario change.
- **Terminal lasts the life of the view:** `demo_ops_recon` PLAYTEST Run B gains a check: close the view with the X during a Terminal session, reopen, and the Terminal log is still there (the known gap at docs:1446, [follow]).
- **Tools default to Panels:** no change (recon leaves `networkView` unset). If the follow-up changes the meaning of an unset `defaultSkin`, re-run Run B.
- **Unopenable-container warning:** re-run the validator on all three; the containers (`printer_cupboard`, `secure_bin`, and with S8c `darren_case`, `records_safe`) must not warn. If one does, it is a scenario bug to fix in that scenario.

## 9. For the owner

1. **How many showcases?** Recommend **three** (recon, passwords, second step), each 4 to 5 rooms and 15 to 25 minutes, appended as S5b, S5c, S8b and S8c land. Alternatives: one per stage (eight or more, much repeated office life), or one large tour (too long for a lesson slot and over the office-life sync budget).
2. **Add them to the Hacktivity catalogue?** Recommend **not yet**: keep them in the `test_scenarios` collection until all appends land and pass a playtest, then list them as a staff and teacher "ops showcase" set rather than in student courses.
3. **`logSources` outside `test_ops_*`.** docs:858 says only test scenarios use them "for now". Recommend **allow them in `demo_ops_*`** (the audit-log PC is one of the features to show) and update that line of the docs when the first showcase lands.
4. **Code fob art.** `code_device.png` is a placeholder. Recommend **a yes to one PixelLab sprite** before the second-step showcase is shown to teachers.
5. **Voice audio.** About 300 new spoken lines across the three (sections 5.8, 6.10, 7.10). Recommend **voicing only after dialogue sign-off and the appends**, in one batch per scenario; or, cheaper, voice Ama only and leave staff lines as text.


## Review log

### R1 (`SHOWCASE_PLAN_REVIEW_R1.md`, plan at 1cc353275)

| Finding | Outcome | Where |
|---|---|---|
| B1 sign-in with the owner at the desk; Darren's open screen | fixed: every sign-in beat runs with the owner away and the screen locked; Darren `lockIfAwayOverSeconds: 90` (coffee open, M8; lunch locked, M5); Lorna at the coffee; "Who is where" note; Runs A to C rewritten | 7.2, 7.4, 7.7, 7.9, 8.5 |
| B2 session grants on hosts; a "share" grant | fixed: file server is a headless sign-in object (`test_ops_skin:229-262`); `update_lag` grants Agnieszka user, `link_setting` (`needs.session: user`) grants Graham admin (`test_ops_access:393-399`); share access-listed to Graham; printer `factory_login` grants a `saved_connection` to Agnieszka's PC (`test_ops_access:80-85`). Added a third card (`open_settings`, misconfig) because no card fitted `link_setting` | 5.1, 5.2, 5.3, 5.4, 5.7, 8.3 R-T, 8.5 |
| B3 implant with no network | fixed: `networks.office_lan` and room networks; Ama's one line on the opened view | 6.1, 6.3, 6.4 P8 |
| M1 one id space | fixed: `office_printer` / `printer_host` / `printer_res`; file server is not a host key | 5.3 |
| M2 reuse | fixed: printer service account `printer_svc` (person, `role: "service"` so it signs in nowhere and is not a shortcut to admin), `printer_admin` a `password` credential with `foundIn` | 6.1, 6.2, 6.3, 6.4 P4 |
| M3 strong never counts down | fixed: Julian's record has no salt or grade; P5 is two presses; salted wait moved to Graham's record (P4) | 6.3, 6.4, 8.3 P-T, 8.5 |
| M4 feed fact | fixed: `needs.social_media`, `feed` with `facts_first`, Ama lever "Ask Delphine about her weekend", feed kiosk in the kitchen, `social.intelFacts` | 6.1, 6.2, 6.3, 6.4 P2, 8.5 |
| M5 Lorna never denies | fixed: tick on `mfa_prompt_sent:lorna_easton` with `n >= 2`; return bark on `npc_returned_post:lorna_easton` (`npc-needs.js:1526`); "denial" removed from M10, 7.9; validator warning listed | 7.2, 7.4, 7.9 |
| M6 kiosk account | fixed: Niamh as reception temp (person with sprite), login on a card at the kiosk | 7.1, 7.2, 7.3, 7.4 M9 |
| M7 Gwen inside the locked room | fixed: Gwen's desk in the office; phone a left-behind item on the kitchen charger | 7.6 |
| M8 printer lever props the door early | fixed: Fatima on her own `records_index` resource and lever, M14 before M15 | 7.6, 8.2 P7, 8.5 Run E |
| M9 re-enrol Anjali breaks the safe | fixed: M12 re-enrols Yusuf; note for the S-8c brief | 7.5 |
| M10 slow windows | fixed: lunch mappings `hunger: 20` and hunger needs for Graham, Darren, Lorna; `frustration.perFail` for Darren, Yusuf, Jun with expected seconds in PLAYTEST.md; Yusuf's start line plus Ama bark on `npc_workaround:yusuf_demir` started | 6.2, 6.5, 7.2 |
| M11 cached hash per account | fixed: `niamh_cached_hot_desk` (common, cracked in P12), `julian_cached_partner` (strong, left uncracked on purpose) | 6.5 |
| m1 caught claims | fixed: R1 reworded, jack within the radius; cupboard and bin claims dropped | 5.1, 5.2, 5.4, 6.2 |
| m2 `for` shape | fixed: `{ "people": ["julian"] }` | 6.3 |
| m3 meeting-room jack | fixed: `kitchen_jack`; manual check noted | 5.1, 5.3 |
| m4 probes answerable | fixed: P2 to P5, P9 marked answered; P3 and P10 narrowed | 8.2, 5.4, 6.4 |
| m5 cake lever | fixed: dropped; Ama asks the player to drop the cake | 6.2 |
| m6 P8 aside | fixed: dropped with the reason | 6.4 |
| m7 graph files | fixed: S units validate with `--no-graph`; only T units write the graph | 8.3 |
| m8 prop object | fixed: `records_wedge` in the office | 7.6 |
| m9 account-only fields | fixed: class on the record's `crack.password` | 6.6 |
| m10 left-behind roll | fixed: `leftBehindChance: 1` for fob, phone, Gwen's phone, Darren's badge; declared spots; PLAYTEST wording | 7.1, 7.5, 7.6, 8.5 |
| m11 helpdesk presence | fixed: reworded; story-only ink gate | 7.5 |
| m12 length | fixed: 18 minutes now, 25 with appends | 7, 7.8, 9 |
| m13 Julian's lunch | fixed: `setVisible: false` on `act_midday`, no return | 6.2 |

Withdrawn: none.

New claims checked for this revision: `workstation-state.js:8` (object default `locksScreenOnLeave` true; R1's B1 fix said "awareness high" locks Lorna's screen, but line 28 is the lockout rule, so the plan relies on the default), `workstation-state.js:80-83,155-156` (`lockIfAwayOverSeconds`), `npc-needs.js:1526` (`npc_returned_post`), `npc-needs.js:3366-3378` (left-behind roll), `mfa-client.js:80-84,255-268`, `npc-workarounds.js:46-75`, `ops_cracking.rb:150-185,227-233`, `test_ops_skin:225-265`, `test_ops_access:20-40,80-85,385-402`, `test_ops_mfa:228-238,282-293`, docs:400-432 and 1410-1416 [follow], [build] docs:876, [skin] docs:869,879, README_scenario_design.md:1369.

Left open for R2: whether `accessList` takes `roles` and `people` together (5.3 gives a fallback); the hearing range for `share_login` (P10); whether a host `sprite` draws a second printer beside `office_printer` (5.3 asks the builder to check); Darren's real coffee-trip estimate against the 90 s threshold (7.4 asks the builder to record it).
