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
| `office` (start) | `room_office` | Four desks (Chidi, Jun at the hot desk, Agnieszka, a spare); the hot-desk network jack `hotdesk_jack` (`networkJack: true`); the office printer object `office_printer` (a host with a sprite, see hosts); the printer cupboard `printer_cupboard` (unlocked container) holding technique card 1; office coffee station and wall-socket lever (copied); notice board; Ama. |
| `kitchen` | `room_break` | Copied kitchen block (fridge, microwave, kitchen coffee, water cooler, washing-up tray). |
| `server_room` | `room_servers` | The file server object `file_server` (sprite, host); a camera host `lobby_camera` (headless host, sprite); Zainab's tool roll (copied object); Zainab. |
| `it_room` | `room_it` | Graham's PC (`workstation`); the audit-log reader `network_log_pc` (`ops_log_terminal`); Graham. |

All rooms open (no locks): the lesson is the network, not the building.

### 5.2 Cast, needs, routines, habits

| NPC | Where | Needs and routine (copied numbers from `office_life_showcase` unless stated) | Habit that matters for a beat |
|---|---|---|---|
| Ama Owusu (host) | office aisle | none; immovable | Hub levers: "Send them for coffee" (sets `coffee_call`, which the coffee drinkers' mappings read to drop caffeine), "Send them to lunch" (`act_midday`), "Call it a day" (`act_evening`). |
| Chidi Okeke | office desk | caffeine, work, hunger (as showcase) | Leads the coffee run. |
| Jun Watanabe | hot desk (`needsHome` the hot desk) | caffeine, follows Chidi (as showcase) | Sits at the hot desk with the live jack: plugging in while he is there gets you caught (`npc_caught_at_post`, bark). The coffee run is the window. |
| Agnieszka Duda | office desk | thirst; `interests.dirty_mugs` (as showcase) plus a `work` need on the `office_printer` resource | Prints and fetches printouts; when the printer is off she mutters (`work_fail_printer` chatter). Cooler exchange with Graham (copied `exchanges`). |
| Zainab Hussain | server room | caffeine and thirst late; `needsCompany.avoids ["*"]` (as showcase) | Field engineer who stays late. In the evening, alone at the kitchen coffee, she talks: her ink hands over technique card 2 (`itemsHeld`, A14 declared grant). |
| Graham Whitfield | IT room | work and social (as showcase); cooler exchange with Agnieszka | Owns the network log PC; his ink explains the log in the evening beat. |

Six NPCs, as in `office_life_showcase`.

### 5.3 Ops fields switched on

- `networks.office_lan`: `name` "Office network", `discovery: "scan"`, `cli.range` a private /24 (any private range not used by another showcase), `cli.hosts.<hostId>.address` for each host.
- `hosts`:
  - `office_printer` ("Office printer", sprite as in `test_ops_findings`): services `print` (9100) and `admin page` (80), product "Inkvale JetServe" 1.4. On `admin page`: weakness `factory_login` (class `default_creds`, severity high, `grants.session` on the printer with `access: "user"`), decoy `old_build` (class `unpatched`, low, `falseBecause` "the build listed is older than the one this printer runs").
  - `file_server` ("Shared drive server"): service `storage`, product "Tarnwick FileHold" 4.2, with `cli` (`protocol` tcp, `service` lower-case word, a short invented `banner`). Findings copied in shape from `test_ops_skin` lines 246-262: `update_lag` (unpatched, high, `realism: "filehold_update_lag"`, grants a user session), `link_setting` (misconfig, medium, `realism: "filehold_link_setting"`, `needs.session` user, grants the `shared_drive` share), decoy `release_line` (misconfig, low, `realism: "filehold_release_line"`).
  - `lobby_camera` ("Reception camera", headless): one service with only a decoy (as `test_ops_findings`' camera), to show that some hosts have nothing real.
  - The PCs (Chidi, Jun, Agnieszka, Graham) appear on sweep as host rows with no services (N12).
- `resources.shared_drive` (`file_share`, N4) on `file_server`, opened once the second technique session is held.
- `techniques`: `factory_accounts` ("Factory accounts", `worksOn.class: default_creds`) and `update_gap` ("Known update gap", `worksOn: { class: unpatched, product: "Tarnwick FileHold", versions: ["4.2"] }`). Card 1 in `printer_cupboard`; card 2 held by Zainab.
- `networkView`: absent, so Panels is the default; the Terminal is shown by switching (beat R6). See section 8 for the ops-follow1 change.
- `gameClock` (start 08:30, as `test_ops_logs`), `logSources.network_log` (`title` "Network log", `events`: the jack plug and unplug rows, `network_swept`, `host_scanned`, `service_checked`, `finding_confirmed`, `technique_used`, the share open row; the builder lists the registered names from `ops_log_events.rb` and uses only those). `seedRows`: three rows from 07:10 to 07:14 showing an unknown device on the meeting-room jack sweeping and scanning; one is the anomaly row.
- Start items: the drop box (`rogueDevice: true`, as `test_ops_access:138`), the cake (copied).

### 5.4 Beats in the order a player meets them

Each row: the office-life opening, the click path (what the player does, plain words; PLAYTEST.md carries the exact clicks), the fields, what Panels and the Terminal show, the log row, and the task it ticks.

| # | Beat | Opening from office life | Player does | Panels / Terminal | Log row | Task (event) |
|---|---|---|---|---|---|---|
| R1 | Plug in | Jun is at the hot desk; the coffee run (or Ama's "Send them for coffee") takes him away | Walk to the hot desk jack while Jun is out, use the drop box on it. If Jun is there, he catches you (bark, no penalty). | The network view opens on "Office network" with a sweep offered and no rows. | jack plug row | `plug_in` (`network_foothold_gained`) |
| R2 | Sweep | none needed | Sweep the office network. | Rows for the printer, the file server, the camera and four PCs. Terminal: the same list as typed output with the authored addresses. | `network_swept` | `sweep` (`network_swept`) |
| R3 | Scan | Agnieszka is printing (her trips to the printer show it is in use) | Scan the printer. | One tile per service (name, port, product). | `host_scanned` | `scan_printer` (`network_host_scanned`) |
| R4 | Check and confirm | none | Check the printer's admin page; confirm both findings. | Two unconfirmed tiles `f1`, `f2` that look alike; confirming shows one real (what it needs) and one false (why). | `service_checked`, `finding_confirmed` x2 | `confirm_both` (`network_finding_confirmed`, second one; condition on a count global, see probe P3) |
| R5 | Technique card 1 | The printer cupboard is by Agnieszka's desk; she leaves it open when she refills paper (free to take; caught bark if she is at her desk) | Take the "Factory accounts" card from the cupboard; use it on the real printer finding. | Techniques panel lists the card; Use gives a session on the printer row. A wrong pairing (card on the decoy) is refused. | `technique_used` (or the refused row) | `use_card` (`network_technique_used`) |
| R6 | Terminal and realism | Ama's hint: "Same moves, typed. Try the Terminal on the file server." | Switch the view to the Terminal; scan and check the file server there. | Terminal prints the service with the authored banner and, for each finding, the realism text from the catalog. Switching back to Panels shows the same findings as tiles, with the same aliases. | `host_scanned`, `service_checked` (written once per foothold whichever skin) | `terminal_view` (ink: Ama asks "What did the file server say?", see P2) |
| R7 | Technique card 2 and a step up | Evening: Zainab, who avoids company all day, is alone at the kitchen coffee and will talk | Talk to Zainab; she gives the "Known update gap" card. Use it on `update_lag` for a user session, then confirm `link_setting` (it needs that session) and open the shared drive. | A session on the file server row; the `shared_drive` folder opens. | `technique_used`, share open row | `open_share` (share-open client event; probe P1) |
| R8 | The log | Graham's ink in the evening: "Want to see what you looked like from here?" | Open the network log PC; find your own rows; flag the 07:12 row (the unknown device before you) as the odd one out. | not the network view: the reader's table, filters and detail pane | reading writes nothing | `read_log` (anomaly `completionActions` `complete_task`) |

Free exploration: unplug the drop box (ends the sessions, writes the unplug row; Ama's onceOnly bark explains N5); switch the printer off at its socket lever (`office_printer` `offWhen printer_off`) and rescan: it no longer answers, and Agnieszka mutters; scan a PC row (nothing listed); use a card on a decoy (refused).

### 5.5 Objectives (guided path)

- Aim `morning` "Morning: get on the network": `plug_in` "Plug the drop box in where nobody will notice", `sweep` "List what answers on the office network", `scan_printer` "Find out what the printer runs".
- Aim `midday` "Midday: real or false?": `confirm_both` "Test both of the printer's reported weaknesses", `use_card` "Use a technique on the one that is real", `terminal_view` "Look at the file server in the Terminal".
- Aim `evening` "Evening: what it looked like": `open_share` "Open the shared drive", `read_log` "Find yourself in the network log".

### 5.6 mission.json outline

`display_name` "Ops demo: on the network"; `description` "A working day at Merrin & Sallow. Plug a drop box in when the hot desk is empty, list and scan what answers, test which weaknesses are real, then read your own trail in the network log."; `difficulty_level` 2; `collection` "test_scenarios"; `estimated_duration_minutes` 15; `test_type` "ops_demo"; `test_objective` "Show discovery, scanning, findings, technique cards, the Terminal and Panels views with realism text, and the network log, inside office life."

### 5.7 End state

All eight tasks ticked; the player holds sessions on the printer and file server (unless unplugged); the network log shows the player's rows after the seed rows, with the 07:12 row flagged. Ama's "Give me the short version." recaps in four lines. Evening lighting variant as in `office_life_showcase`; staff go home except Zainab and Graham.

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
| `office` (start) | `room_office` | Desks for Delphine (`delphine_pc`, sign-in, `workstation`, owner `delphine`), Jun (`jun_pc`), Niamh; Delphine's desk photo `delphine_photo` (takeable, `revealsFacts`); the printer cupboard holding Graham's "Printer admin" credential item; a governed stick port `desk_usb_port` on Delphine's desk (copied shape from `test_ops_privilege`); office coffee and socket lever; notice board; Ama. |
| `kitchen` | `room_break` | Copied kitchen block. |
| `it_room` | `room_it` | Graham's PC (`graham_pc`); the confidential-waste bin `secure_bin` (unlocked container) holding three record files (`delphine_record_file`, `graham_record_file`, `julian_record_file`); the audit-log reader `signin_log_pc`. |
| `partner_office` | `room_ceo` | `partner_pc` (sign-in, owner `julian`, `policy: "partner"` with `usb: "blocked"`), its keystroke-device socket `partner_pc_socket` (`grant_foothold` with `needsSession: partner_pc`, `needsHeld`, as `test_ops_privilege`'s BadUSB socket); Julian. |

### 6.2 Cast

| NPC | Where | Needs and routine | Account and habit that matters |
|---|---|---|---|
| Ama Owusu (host) | office | none | Levers: "Send them for coffee", "Put the cake out" (drops the cake if the player has not), "Send them to lunch", "Call it a day". Holds the capture log for the player (`holds.captures: true` on a start item, as `test_ops_crack`). |
| Delphine Arvanitis | office | caffeine, social; a cake magnet target | `creds` user; `habits.password: "guessable"`, `passwordDifficulty: "medium"`; posts on the office feed (A11) with one post carrying `fact: "delphine_dog_year"`; her photo carries `revealsFacts: ["delphine_dog_name"]`. The cake (or coffee) takes her from her desk: the window to take the photo and to sit at her PC. Screen habit: `lockIfAwayOverSeconds` 10 (her screen locks, so the cracked password is the way in). |
| Graham Whitfield | IT room | work, social (as showcase); cooler exchange with Niamh | `creds.admin: true`; `habits.password: "reused"`; the "Printer admin" credential item holds the same password, so the player who holds it can crack his record. Lunch (`act_midday`) empties the IT room: the window for the bin. Caught bark if the player is in the bin while he is at his desk. |
| Julian Sallow | partner office | social, work; at midday he goes to a client lunch (`setVisible` false on `act_midday`, back on `act_evening` false then home) | `creds` user; `habits.password: "strong"`: his record never falls ("This one will not fall to guessing"). His office is empty at lunch: the window for the admin beat. |
| Niamh Doherty | office | thirst, social | Colour: posts on the feed too (no facts), cooler partner of Graham, gossip in the kitchen ("Delphine's dog is on the feed again"). Her line points at the feed without saying the fact. |
| Jun Watanabe | office | caffeine (as showcase) | Used by the S5b append (the borrow); now only colour. |

### 6.3 Ops fields switched on

- `credentials` (A21): `delphine_hash` (`kind: "hash"`, `account: "delphine"`, `proof.held: "delphine_record_file"`, `crack: { password: "guessable", facts: ["delphine_dog_name", "delphine_dog_year"], difficulty: "medium" }`), `graham_hash` (`account: "graham"`, `proof.held: "graham_record_file"`, class from habits: `reused`), `julian_hash` (`account: "julian"`, `proof.held: "julian_record_file"`, `strong`, `salted: true`, `crackSeconds: 30`, so the player also sees a salted wait count down). Plus `printer_admin` (a plain password credential, A15) whose item is in the printer cupboard and whose value equals Graham's password.
- `policies`: `desk` (`usb: "storage_blocked"`, `remote: "allowed"`), `partner` (`usb: "blocked"`), copied shapes from `demo_access_tour:53-60`. `defaultPolicy: "desk"`.
- `accountProfiles.julian_profile` (`for: ["julian"]`) holding a folder "Client files" with one readable document; admitted at `partner_pc` (A5, A18 profile reach). `partner_pc.access` admits `julian` and the `it` role (Graham), so Graham's sign-in there is admin.
- Start items: a storage stick (`usbClass: "storage"`), a keystroke device (`usbClass: "hid"`), the capture log holder, the cake.
- `social.osint` site "Office feed" with Delphine's and Niamh's posts (A11).
- `gameClock`, `logSources.signin_log` (`title` "Sign-in log", events: `signin_ok`, `signin_fail`, `signin_lockout`, `session_end`, `session_lock`, `admin_profile_read`, `usb_install_overridden`). `seedRows`: a night of failed sign-ins on `graham_pc` from 02:10 (the anomaly row), and the morning's ordinary sign-ins.

### 6.4 Beats (now)

| # | Beat | Opening from office life | Player does | Screen | Log row | Task (event) |
|---|---|---|---|---|---|---|
| P1 | Get the records | Lunch empties the IT room (or Ama's "Send them to lunch") | Search the confidential-waste bin; take the three record files. | Three rows under "Hashes" in the capture log, each Ready or (Julian's) counting down. | none (a take writes none) | `get_records` (ink: Ama, P2 probe; or the item pickup event) |
| P2 | Earn the facts | Delphine's feed is public; the cake or coffee takes her from her desk | Read the office feed (one fact); take the photo from her desk while she is away (the other fact). | Two fact chips appear in the cracker. | none | `earn_facts` (ink: Ama asks what you learnt) |
| P3 | Crack a guessable one | none | Crack Delphine's record with the two facts. With one fact: "1 facts still missing"; with a wrong chip: "No match". | "Cracked"; her password joins the keyring. | none (a crack writes none) | `crack_guessable` (`keyring_changed` with a condition, probe P4) |
| P4 | Crack a reused one | Graham's printer note is in the cupboard by the printer | Take the "Printer admin" note; crack Graham's record with no facts. | "Cracked": the same password was in the keyring already. | none | `crack_reused` |
| P5 | One that never falls | none | Wait out Julian's salted countdown and try. | "This one will not fall to guessing." Ama: long random passwords are why. | none | `crack_strong` (ink) |
| P6 | A user session and the USB policy | Delphine's screen locked itself when she left | Sign in at Delphine's PC with her password from the keyring; plug the storage stick into her desk port. | Taskbar shows her name, no "Administrator". The stick is refused with the desk policy's line and stays in the tray. | `signin_ok` | `user_signin` (`pc_signed_in:delphine_pc`), `usb_refused` (`usb_refused:*`) |
| P7 | An admin session | Julian is out at his client lunch | Sign in at the partner's PC as Graham. Open "Client files" in Julian's profile. | Taskbar shows "Administrator"; Julian's profile folders appear on the desktop and open. | `signin_ok`, `admin_profile_read` | `admin_signin` (`pc_signed_in:partner_pc`; admin level via probe P5), `profile_read` (ink or container event) |
| P8 | The admin override | Still lunch | At the partner's keyboard, signed in as Graham, plug the keystroke device into the PC's socket. (Ama's aside: try it first signed in as nobody, and it is refused.) | Accepted; a foothold is gained. | `usb_install_overridden` | `override` (`network_foothold_gained`) |
| P9 | The log | Evening; Graham back at his desk explains the log | Open the sign-in log PC; find your sign-ins, the admin read and the override; flag the 02:10 burst of failures. | reader table | none | `read_log` (anomaly completion) |

Free exploration: type a wrong password three times at Graham's PC and see the failures merge into one row with a count (A24 rule); sign in at Delphine's PC as Graham (admin, since desks admit IT) and see that her profile folders show only to an admin (the author's note at docs:744 explains why the USB refusal beat is placed at Delphine's port, which has no plant path for an admin: the governed stick port has no session PC, O3); lock and sign out.

Note on P6 and P8 (docs:710-745, [main]): a storage stick refused by policy cannot be put through by an admin in any validator-clean scenario (O3, open with the owner), so the override beat uses the keystroke device at `partner_pc`'s session socket, the one buildable case, as `test_ops_privilege` does; the refused storage stick at Delphine's port shows the policy line.

### 6.5 Appended later: S5b cached accounts (when `ops-priv2` lands)

What it adds, all appends to `demo_ops_passwords`:

- **Office life: the borrow.** Jun's PC gets a power socket lever (copy of the coffee socket, global `jun_pc_off`, `jun_pc.offWhen`), and Jun a `work` need on his own PC plus `workarounds: [{ "at": 60, "do": "borrow_session", "pc": "hot_desk" }]` (A10, docs:358). A new `hot_desk` sign-in PC in the office (no owner). Switch Jun's PC off: he grows frustrated, mutters, and borrows the hot desk, signing in there.
- **Fields.** `hot_desk.cachedAccounts: [ { "npc": "niamh" }, { "npc": "jun", "after": "borrow" } ]`; `partner_pc.cachedAccounts: [ { "npc": "julian" }, { "npc": "delphine" } ]`. New credentials `jun_cached` (`proof.harvested: "hot_desk"`, guessable with one fact from a new feed post of Jun's) and `delphine_cached_partner` (`proof.harvested: "partner_pc"`; same account as `delphine_hash`, so it is already cracked: the row shows the keyring already has it). `hot_desk.access` admits the `it` role so Graham's sign-in there is admin.
- **Beats.** P10 "Collect at the partner's PC": in the admin session from P7, collect the cached accounts (rows appear under "Hashes"; a second press says "Nothing new is cached here."). P11 "The borrow": switch Jun's PC off, watch him borrow the hot desk, then sign in at the hot desk as Graham and collect; Jun's row appears only after the borrow. P12 crack Jun's.
- **Log.** Add `credentials_harvested` to `signin_log.events`.
- **Tasks.** New aim at the end, `afternoon_cache` "Afternoon: what a PC remembers": `collect_partner`, `see_borrow`, `collect_hot_desk`, `crack_cached`.
- **Ink.** New Ama hub choices after the existing ones ("Switch Jun's PC off" lever; "What did that show?" recap knots for the new tasks); Jun gets new knots (two frustrated lines and a mutter pool `work_fail_pc`).

### 6.6 Appended later: S5c account kinds (when `ops-priv2` lands, same wave as 6.5)

- **Office life: the desk admin on a rota.** A new account-only NPC `deskadmin` (`accountOnly: true`, `creds: { username, password, accountKind: "local", localTo: ["delphine_pc", "jun_pc", "hot_desk"] }`, `staff`, `role: "it"`). Graham's ink gains a rota knot: on Tuesdays he does the desk rounds with the shared desk-admin account; the rota sheet on the IT room wall (a readable item) says which desks it covers. The password is learnt by the feature's own route: `deskadmin` gets a `common` hash record in the bin (`deskadmin_record_file`), which cracks on the first run (A21 `common`).
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

**Build:** now for A22 and the log (wave 1); S8b appended when `ops-helpdesk` lands, S8c when `ops-lock2` lands (wave 3, in landing order, one after the other because they touch the same files). **Duration:** 15 minutes now, 20 with the appends. **Teaching question:** a password is easy to come by in a busy office; what does a second step add, and where does it give way?

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
| `reception` (start) | `room_reception` | Lorna's desk and PC (`lorna_pc`, policy `front`, push); the visitor kiosk `visitor_kiosk` (sign-in, kiosk account exempt from the second step); Ama. |
| `office` | `room_office` | Desks and PCs for Darren (`darren_pc`, policy `floor`, push), Anjali (`anjali_pc`, policy `finance`, code), Yusuf (`yusuf_pc`, policy `ops`, number match); Anjali's code fob `anjali_fob` (`code_device`, owner `anjali`, `leftBehindChance` with `revealOnGlobal`, left on her desk when she goes to the cooler); Yusuf's phone `yusuf_phone` (`phone_friendface`, owner `yusuf`, left by the office coffee while he queues, same pattern); the office printer resource and its socket lever; office coffee; notice board. |
| `kitchen` | `room_break` | Copied kitchen block. |
| `it_room` | `room_it` | Thandiwe (IT support); the audit-log reader `mfa_log_pc`. With S8b: the helpdesk counter. |
| `records_room` (S8c) | `room_lw_records` | Gwen's records safe and the gated door; see 7.6. |

### 7.2 Cast

| NPC | Where | Needs and routine | Account, habit and what it opens |
|---|---|---|---|
| Ama Owusu (host) | reception | none | Levers: "Send them for coffee", "Switch the printer off" (also the socket in the office), "Send them to lunch", "Call it a day". |
| Lorna Easton | reception | caffeine, social | `awareness` high: `approvesPrompts: "never"`. Push requests to her are denied and she says so ("I didn't ask for that. I'm telling IT."): the step holding. |
| Darren Price | office | caffeine, work on the office printer resource; social | `habits.approvesPrompts: "pestered"`, `promptPatience: 3`; `workarounds: [{ "at": 60, "do": "writes_down" }]`: when the printer is off long enough he writes his password on a note at his PC (docs:177). `habits.screen.lockChance: 0` at lunch: leaves his screen open (the way round). |
| Anjali Rao | office | thirst (cooler with Yusuf: copied exchange pattern) | `habits.writesDown: true` (note at her PC); code fob on her lanyard, left on the desk when she goes to the cooler. |
| Yusuf Demir | office | caffeine (queues at the office coffee) | `workarounds: [{ "at": 50, "do": "share_login", "with": "anjali" }]` when the printer is off (says his login aloud to Anjali; the player overhears in range); phone left by the coffee machine while he queues. |
| Thandiwe Moyo | IT room | work, social | Explains the mfa log in the evening; with S8b, runs the helpdesk. |
| `kiosk` account | none (copy the shape of `svc_sync` in `test_ops_mfa`) | none | `creds.mfa: false`: the visitor kiosk signs in with a password alone, to show an exempt account. |

### 7.3 Ops fields switched on

- `policies`: `front` (`mfa: "push"`), `floor` (`mfa: "push"`), `finance` (`mfa: "code"`, no `maxAttempts`, per the validator warning), `ops` (`mfa: "push_number_match"`), `kiosk` (`mfa: "push"`, the kiosk account exempt). `remote: "allowed"` is not needed (no network in this showcase).
- Items: `anjali_fob` (`type: "code_device"`, `owner: "anjali"`), `yusuf_phone` (`type: "phone_friendface"`, `owner: "yusuf"`), `social.osint` for the phone (two staff posts, no facts). Darren's phone stays on him (pestered approvals arrive there).
- `resources.office_printer` and `roles.<staff>.workNeeds` (A10) so the printer lever drives Darren's and Yusuf's workarounds.
- `gameClock`, `logSources.mfa_log` (`title` "Sign-in and approvals", events: `signin_ok`, `signin_fail`, `mfa_challenge`, `mfa_code_ok`, `mfa_code_wrong`, `mfa_code_locked`, `mfa_expired`, `mfa_prompt_sent`, `mfa_prompt_approved`, `mfa_prompt_denied`). `seedRows`: an overnight run of twelve approval requests to Darren from 01:40 (the anomaly row: someone else was pestering him first).

### 7.4 Beats (now)

| # | Beat | Opening from office life | Player does | Screen | Log rows | Task (event) |
|---|---|---|---|---|---|---|
| M1 | A password escapes (written) | Anjali's note is under her keyboard; she is at the cooler (or Ama's coffee lever) | Read the note at Anjali's PC. | Her tile shows the note (A4). | none | `see_note` (ink or `npc_overheard_login`-style event: probe P6) |
| M2 | A password escapes (in a temper) | Switch the printer off (Ama's lever or the socket); Darren mutters, then writes his password down | Read Darren's new note. | as M1 | none | `see_temper_note` (`npc_workaround:darren` phase `done`) |
| M3 | A password escapes (said aloud) | Same outage: Yusuf tells Anjali his login | Stand near and overhear. | The overheard login joins the keyring or notes (as `test_access_work`). | none | `overhear` (`npc_overheard_login:*`) |
| M4 | The step holds | Lorna is at her desk and alert | Sign in at Lorna's PC with her password, which Ama hands over as a keyring credential at the start (Lorna agreed to be the test; A14 declared grant, A15 keyring), and send the request. | Push pane: "A request was sent to Lorna's phone." Lorna denies. | `mfa_challenge`, `mfa_prompt_sent`, `mfa_prompt_denied` | `step_holds` (`mfa_failed`) |
| M5 | Pestered into approving | Darren is at his desk, busy | Sign in at Darren's PC; send again until he gives in (three requests). Ama: "He approved just to make it stop." | Pane closes on approval; desktop opens. | `mfa_prompt_sent` x3, `mfa_prompt_approved`, `signin_ok` | `pestered` (`mfa_approved` with `npcId` darren) |
| M6 | A fob left on a desk | Anjali goes to the cooler and leaves her fob | Take the fob; sign in at her PC; use the fob for the six digits. A wrong code first shows "try again" (five tries). | Code pane; "Use Anjali's fob" opens the device over the screen. | `mfa_challenge`, `mfa_code_wrong` (if tried), `mfa_code_ok` | `fob` (`pc_signed_in:anjali_pc`) |
| M7 | A phone left by the coffee | Yusuf queues for coffee and leaves his phone on the side | Take the phone; sign in at his PC; pick the matching number on his phone. Pick a wrong one first to see the step cancel without counting as a failed sign-in. | Two-digit number on the pane; three choices on the phone. | `mfa_prompt_sent`, `mfa_prompt_approved` or `mfa_prompt_denied` | `number_match` (`pc_signed_in:yusuf_pc`) |
| M8 | The way round | Lunch: Darren leaves his screen open | Use Darren's open screen. No step is asked: the second step guards signing in, not a screen someone left open. | His desktop. | none (a claim writes no sign-in row) | `open_screen` (`workstation_accessed:darren_pc`) |
| M9 | An exempt account | none | Sign in at the visitor kiosk: password only. | Desktop, no step. | `signin_ok` | `exempt` (`pc_signed_in:visitor_kiosk`) |
| M10 | The log | Evening; Thandiwe explains | Open the approvals log; find your rows and Lorna's denial; flag the 01:40 burst to Darren. | reader | none | `read_log` (anomaly completion) |

Free exploration: let a push wait past its expiry (`mfa_expired`); hand the phone back by dropping it on Yusuf's desk; sign out and back in at Darren's PC (a saved connection still asks).

### 7.5 Appended later: S8b helpdesk (when `ops-helpdesk` lands)

- **Office life: a helpdesk that answers.** Thandiwe becomes the desk NPC: `helpdesks.it_desk` (`npc: "thandiwe"`, `verify: "questions"`, `questions: ["staff_no", "manager"]`, `minCorrect: 2`, `maxTries: 3`, `resets: ["password", "mfa"]`, `questionLabels` "Staff number", "Line manager"). Her ink gains a new hub choice with the `#helpdesk_request:it_desk` tag and a next-knot reply reading `helpdesk_it_desk_result`. She is away for her lunch (needs), so the desk answers only when she is in: the office-life window is "come back when she's at her desk".
- **Answers from office life.** Each account in the beat gets `creds.recovery` (`staff_no`, `manager`) and `creds.resetPassword`. Darren's staff number is on his ID badge, left on his desk at lunch (`leftBehindChance`); his manager is on the staff board in the kitchen. The builder copies the exact clue pattern `[build] scenarios/test_ops_helpdesk` uses so the leak scanner stays quiet (rule 7).
- **The form on a desktop.** A `helpdesk_form` item (`desk: "it_desk"`) in `darren_pc`'s contents: reachable from his open screen (M8).
- **Beats.** M11 "Reset a password": ask Thandiwe to reset Darren's password with his two answers; the keyring gains a "Reset" sign-in; his old written note is now stale and refused. M12 "Re-enrol a second step": ask for Anjali's sign-in approval reset; her fob now says "No longer in use" and her step moves to "My phone": sign in at her PC and approve on your own phone (the "own phone" beat). M13 "The desk says no": give one wrong answer three times; the desk stops serving that username for five minutes, and the refusal never says whether the username exists.
- **Log.** Add `helpdesk_request`, `account_password_reset`, `account_mfa_reenrolled` to `mfa_log.events`.
- **Tasks.** New aim at the end, `afternoon_helpdesk` "Afternoon: the helpdesk": `reset_password`, `reenrol`, `desk_refuses`.

### 7.6 Appended later: S8c second step on locks (when `ops-lock2` lands)

- **New room** `records_room` (`room_lw_records`) north of the office (office gains `connections.north`; the connection is an append to the office's `connections`, check door alignment with `scripts/check_door_alignment.py`). Locked door: `locked: true`, `lockType: "pin"`, PIN on the facilities notice in the kitchen (a readable item), and `secondStep: { "kind": "push", "owner": "gwen" }`.
- **New cast.** Gwen Pritchard, records manager (`approvesPrompts: "never"`, `phone` on her, at her desk in the records room except at lunch, when she leaves her phone charging in the kitchen: pick it up and approve the door request on it). Fatima Begum, records clerk, carries archive boxes between the office and records room; when the second step keeps holding her up she props the door (`workarounds` `do: "prop_door"`, `door: "records_room"`; the frustration source is chosen by probe P7). A propped door skips every step (docs [skin]:860, `POST /npc_workaround`).
- **Locks.** `records_safe` (`locked`, `lockType: "pin"`, PIN in Gwen's desk drawer note, `secondStep: { "kind": "code", "owner": "anjali" }`, the fob from M6: a code step on a safe). `darren_case` (Darren's briefcase under his desk, takeable container, `locked`, `lockType: "key"` with `keyPins` and the key in his desk drawer, `secondStep: { "kind": "push", "owner": "darren" }`: carry it away, drop it, pick it up, and the request count carries on until he approves).
- **Beats.** M14 the door: right PIN, then the push pane; Gwen ignores it; take her phone from the charger and approve. M15 the prop: switch the printer off again and watch Fatima prop the door; walk in with no step. M16 the safe with the fob. M17 the carried case: three requests, a drop and pick-up between them, then Darren approves.
- **Log.** The same `mfa_*` events with `where.kind` `door` and `object`; widen `mfa_log.where` if a `where` filter was set.
- **Tasks.** New aim at the end, `late_locks` "Late: doors, safes and cases": `door_step`, `propped`, `safe_step`, `case_step`.

### 7.7 Objectives (now)

- Aim `morning` "Morning: passwords escape": `see_note`, `see_temper_note`, `overhear`.
- Aim `midday` "Midday: the second step": `step_holds`, `pestered`, `fob`, `number_match`, `open_screen`, `exempt`.
- Aim `evening` "Evening: the trail": `read_log`.

### 7.8 mission.json outline

`display_name` "Ops demo: second steps"; `description` "Merrin & Sallow have just switched on a second sign-in step. Watch passwords escape through ordinary habits, then see the second step hold, give way, and get skipped."; `estimated_duration_minutes` 15 (20 after the appends).

### 7.9 End state

Every PC in the office signed into by one route or another; Lorna's denial and Darren's approval both in the log; the overnight burst flagged. With S8b: a reset password and an approval moved to the player's phone. With S8c: the records room, its safe and Darren's case opened, one by approval, one by a propped door.

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
| P2 | Is there a client event for switching the network view skin, or for a Terminal scan? | recon scenario unit | Ink tick (as planned for R6). |
| P3 | Does `network_finding_confirmed` carry the finding id and its verdict, so a mapping can tick on the second printer finding? | recon scenario unit | Tick on any confirm on the printer host. |
| P4 | Does `keyring_changed` say which account was added and how (cracked, reset)? | passwords scenario unit | Ink tick. |
| P5 | Does `pc_signed_in:<pcId>` carry the account and the level? | passwords scenario unit | Condition on the account id only; the admin level is shown on screen and checked by the Rails test. |
| P6 | Is there an event when a written-down note is shown on a sign-in tile? | second-step scenario unit | Ink tick. |
| P7 | For S8c, what raises Fatima's frustration so that `prop_door` fires: a held-up second step, or only a resource outage? | S8c append unit | Use the printer outage as the source (as in M2), so the prop follows the same lever. |
| P8 | Office-life sync budget (V8) for each scenario after the first draft: reveal globals, onceOnly mappings, items, small keys. | each scenario unit | Cut onceOnly barks first (keep the tasks), then fold items. List any remaining V8 warning with its reason. |
| P9 | Do `mfa_approved` and `mfa_failed` carry the owner's id (`emitBoth(name, npcId, detail)`, `public/break_escape/js/systems/mfa-client.js:80`)? | second-step scenario unit | Tick on the PC's `pc_signed_in` instead. |
| P10 | Does `share_login` put the overheard account in the keyring or a note, and at what range? | second-step scenario unit | Place Anjali's desk beside Yusuf's and say "stand by Anjali's desk" in the notice. |

### 8.3 Build units (Sonnet builders, disjoint files)

Every brief carries: this plan's path and its section, the digest path, "touch only the files listed", "re-read a shared file just before editing it", the handover rule ("When your context passes about 150k tokens, finish the step you are on, commit, write a handover note to `scenarios/<name>/planning/HANDOVER_<unit>.md` (done, open, files touched, commits, gotchas), report back and stop"), and the commit form `git commit -m "..." -- <paths>`.

**Wave 0 (Opus): plan review.** 2 to 5 adversarial rounds on this plan (AGENTS.md "The mission loop" step 2), then the owner's answers to section 9.

**Wave 1 (six units in parallel):**

| Unit | Files (only these) | Content |
|---|---|---|
| R-S | `scenarios/demo_ops_recon/scenario.json.erb`, `mission.json`, `planning/BUILD_REPORT.md` | Section 5.1 to 5.7; probes P1 to P3, P8. Validate with `--skip-ink --no-graph` until R-I lands. |
| R-I | `scenarios/demo_ops_recon/ink/*`, `planning/VOICED_LINES.md` | Ama, Zainab, Graham, Chidi, Jun, Agnieszka: hub, levers, recap knots, the card hand-over (Zainab), the log beat (Graham). Knot names fixed in the brief from section 5.4. |
| P-S | `scenarios/demo_ops_passwords/scenario.json.erb`, `mission.json`, `planning/BUILD_REPORT.md` | Sections 6.1 to 6.4, 6.7 to 6.9; probes P4, P5, P8. |
| P-I | `scenarios/demo_ops_passwords/ink/*`, `planning/VOICED_LINES.md` | Ama, Delphine, Graham, Julian, Niamh, Jun. |
| S-S | `scenarios/demo_ops_second_step/scenario.json.erb`, `mission.json`, `planning/BUILD_REPORT.md` | Sections 7.1 to 7.4, 7.7 to 7.9; probes P6, P8, P9, P10. |
| S-I | `scenarios/demo_ops_second_step/ink/*`, `planning/VOICED_LINES.md` | Ama, Lorna, Darren, Anjali, Yusuf, Thandiwe. |

The S and I units of one scenario agree on knot names and globals through the brief, not by reading each other's work in progress. Each S unit finishes by running the full validator once the I unit has committed.

**Wave 2 (three units in parallel, one per scenario):**

| Unit | Files | Content |
|---|---|---|
| R-T | `test/controllers/break_escape/demo_ops_recon_scenario_test.rb`, `scenarios/demo_ops_recon/PLAYTEST.md`, `scenarios/demo_ops_recon/dungeon_graph.*` | Rails test of every beat with a server side (plug, sweep, scan, check, confirm, technique, share open, log rows, the anomaly flag), driven through real routes as `ops_mfa_scenario_test.rb` is, each assertion read from a re-read game. Then the leak scan (8.4). PLAYTEST.md (8.5). |
| P-T | `test/controllers/break_escape/demo_ops_passwords_scenario_test.rb`, `scenarios/demo_ops_passwords/PLAYTEST.md`, `.../planning/CRACKER_RUNBOOK.md`, `.../dungeon_graph.*` | Rails test: take the records, earn facts, crack (missing, wrong, cracked, reused, strong, the salted wait via `travel_to`), sign in as user and as admin, profile read and its row, the USB refusal and the override, log rows. |
| S-T | `test/controllers/break_escape/demo_ops_second_step_scenario_test.rb`, `scenarios/demo_ops_second_step/PLAYTEST.md`, `.../dungeon_graph.*` | Rails test: push denied, pestered approval at the patience count, code from the held fob (read from the device route, time frozen), number match right and wrong, claim skips the step, exempt account, log rows. |

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
- Run B (midday): open the printer cupboard, take the "Factory accounts" card; in the view, pick the card and the real finding, use (R5); pick it against the decoy (refused). Switch the header to Terminal; scan and check the file server with the quick-command buttons; screenshot the realism text; switch back to Panels (R6).
- Run C (evening): Ama, "Call it a day"; go to the kitchen, talk to Zainab, accept the card (R7); use it on the file server's update finding; confirm the link finding; open the shared drive. Talk to Graham; open the network log PC; filter to the jack rows; open the 07:12 row and flag it (R8). Unplug the drop box (free beat).

**`demo_ops_passwords` PLAYTEST.md**
- Run A: "Send them to lunch"; enter the IT room; open the confidential-waste bin; take the three files (P1). Open the capture log: three hash rows. Read the office feed (phone or OSINT page); put the cake out; while Delphine is at the cake, take her photo (P2).
- Run B (the cracker beats, to `opus48` from `planning/CRACKER_RUNBOOK.md`): crack Delphine's with one chip ("1 facts still missing"), with a wrong chip ("No match"), with both ("Cracked") (P3); take the printer note and crack Graham's (P4); wait out Julian's countdown and crack ("This one will not fall to guessing") (P5). The runbook gives exact chip labels, the order of presses and the expected messages, and says where each fact is earned, never the passwords.
- Run C: sign in at Delphine's PC from the keyring; screenshot the taskbar (no Administrator); plug the storage stick into her desk port: refused with the policy line (P6). Go to the partner's office while Julian is out; sign in as Graham; screenshot "Administrator"; open Julian's "Client files" (P7); plug the keystroke device into the PC's socket (P8). Reload; the admin session's marker is back after the desktop answer. Open the sign-in log; flag the 02:10 row (P9).
- After S5b/S5c: Run D (collect at the partner's PC, Jun's borrow and the hot desk, crack Jun's; the desk admin refused at the partner's PC, "Domain: merrin" on the screen).

**`demo_ops_second_step` PLAYTEST.md**
- Run A: Ama hands over Lorna's sign-in; send the request at Lorna's PC; Lorna denies (M4). "Send them for coffee": read Anjali's note while she is at the cooler (M1). Ama's "Switch the printer off"; wait for Darren's note and stand by Anjali's desk to overhear Yusuf (M2, M3).
- Run B: sign in at Darren's PC; send again until he approves (M5). Take Anjali's fob from her desk; sign in at her PC; type a wrong code once, then use the fob (M6). Take Yusuf's phone from the coffee side; sign in at his PC; pick a wrong number (the step cancels), then the right one (M7). Reload mid-run after M6.
- Run C: "Send them to lunch"; use Darren's open screen (no step) (M8); sign in at the visitor kiosk (M9); open the approvals log; flag the 01:40 burst (M10).
- After S8b: Run D (M11 to M13). After S8c: Run E (M14 to M17, including the drop and pick-up of Darren's case between requests).

### 8.6 ops-follow1 follow-ups: what each changes

- **Cracker fills sign-in, opens from a hash file and a toast:** `demo_ops_passwords` PLAYTEST Run B and the runbook gain the shorter paths (open the cracker from the record file in the inventory; from the toast after a take; a cracked password offered at the sign-in). The old path through the capture log stays as a beat. No scenario change.
- **Terminal lasts the life of the view:** `demo_ops_recon` PLAYTEST Run B gains a check: close the view with the X during a Terminal session, reopen, and the Terminal log is still there (the known gap at docs:1446, [follow]).
- **Tools default to Panels:** no change (recon leaves `networkView` unset). If the follow-up changes the meaning of an unset `defaultSkin`, re-run Run B.
- **Unopenable-container warning:** re-run the validator on all three; the containers (`printer_cupboard`, `secure_bin`, and with S8c `darren_case`, `records_safe`) must not warn. If one does, it is a scenario bug to fix in that scenario.

## 9. For the owner

1. **How many showcases?** Recommend **three** (recon, passwords, second step), each 4 to 5 rooms and 15 to 20 minutes, appended as S5b, S5c, S8b and S8c land. Alternatives: one per stage (eight or more, much repeated office life), or one large tour (too long for a lesson slot and over the office-life sync budget).
2. **Add them to the Hacktivity catalogue?** Recommend **not yet**: keep them in the `test_scenarios` collection until all appends land and pass a playtest, then list them as a staff and teacher "ops showcase" set rather than in student courses.
3. **`logSources` outside `test_ops_*`.** docs:858 says only test scenarios use them "for now". Recommend **allow them in `demo_ops_*`** (the audit-log PC is one of the features to show) and update that line of the docs when the first showcase lands.
4. **Code fob art.** `code_device.png` is a placeholder. Recommend **a yes to one PixelLab sprite** before the second-step showcase is shown to teachers.
5. **Voice audio.** About 300 new spoken lines across the three (sections 5.8, 6.10, 7.10). Recommend **voicing only after dialogue sign-off and the appends**, in one batch per scenario; or, cheaper, voice Ama only and leave staff lines as text.

