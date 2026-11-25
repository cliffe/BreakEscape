# Ops showcase plan: review R2

Reviewer: Opus, design review round 2, read-only except this file. Plan: `docs/agents/ops_core_build/SHOWCASE_PLAN.md` at commit dceb5c267. Kind of game: demo scenario.

Worktrees cited: `[main]` /home/deploy/BreakEscape, `[follow]` /data/be-ops-follow, `[build]` /data/be-ops-build, `[skin]` /data/be-ops-skin, `[logs]` /data/be-ops-logs. Paths without a tag are in `[follow]`.

## Findings

Counts: 0 blockers, 6 majors, 9 minors. Verdict at the end.

### Blockers

None.

### Majors

**M1. Recon R4: the two-mapping tick, as written, never ticks `confirm_both`.**
Evidence: an eventMapping's `condition` gates the whole mapping, `setGlobal` included (`public/break_escape/js/systems/npc-manager.js:1578-1592`: an unmet condition returns before any action). Plan 5.4 R4: "two mappings ... each sets its own global and ticks the task with the condition that the other's global is already true". On the first confirm the other global is false, so that mapping does nothing and its own global is never set; the second confirm then fails the same way. The task never ticks.
Fix: four mappings on Ama. For each of the two suffixed events `network_finding_confirmed:<id>`: one with no condition that sets its own global (`r4_real_seen`, `r4_false_seen`), and one with `condition: "globalVars.<other> === true"` and `completeTask: "confirm_both"`. Say this shape in 5.4.

**M2. Passwords P3: Delphine's record is salted with a 60-second wait, so P3 is not instant and the wrong-chip step costs two minutes.**
Evidence: `lib/break_escape/crack_difficulty.rb:21-23` (`medium` = salted, wait 60) and `:28-44` (a record's `crack.difficulty` or the NPC's `habits.passwordDifficulty` sets `salted` unless the record writes `salted`). Plan 6.2 gives Delphine `passwordDifficulty: "medium"`; 6.3 gives `crack.difficulty: "medium"`. A salted run stores its verdict at the start and answers `running` until the wait ends, whatever chips are picked next (`app/models/break_escape/ops_cracking.rb:166-184,213-223`). So P3's "with a wrong chip: No match" is a 60 s wait, then a second 60 s wait for the right chips; plan 6.3 and Run B say the salted wait is shown only on Graham's record.
Fix: write `"salted": false` on `delphine_hash` (the record field wins over the grade, `crack_difficulty.rb:38`) and keep `difficulty: "medium"` for the two-fact count. P3 is then instant and Graham's 20 s wait is the one salted beat, as the plan intends. The runbook says so.

**M3. Passwords: "`printer_svc` signs in nowhere" and "the only way to Graham's admin reach is the crack" are false.**
Evidence: a sign-in PC with no `access` admits every account (`docs/ACCESS_AND_NETWORKS.md:172`, "none = every account", `game.rb:3361`). Plan 6.1 gives `delphine_pc`, `jun_pc` and `graham_pc` no `access`, so the printer service account signs in at all three. Separately, Graham's password equals the printer note's password (6.2) and `partner_pc` admits Graham (6.3), so typing the note's password on Graham's tile signs in as Graham with no crack. The P-T unit (8.3) is told to assert "the printer service account refused at every PC", which fails as planned.
Fix: give every sign-in PC in this showcase an `access` list that admits no `service` role (for example `delphine_pc` `{ "people": ["delphine_arvanitis"], "roles": ["it"] }`, `jun_pc` likewise, `graham_pc` `{ "roles": ["it"] }`; `accessList` takes `roles` and `people` together, `scripts/scenario-schema.json` `definitions/accessList`). Keep `it` on the desks so S5c's `deskadmin` stays admitted where `localTo` names it ([logs] `scripts/validate_privilege.rb`: "a PC whose access list refuses the account" is an error). Reword 6.2: the crack is the lesson, and typing the printer password on Graham's tile is the same reuse done by hand; make that a free-play line for Ama, and have P-T assert both (`printer_svc` refused everywhere; Graham's tile accepts the reused password).

**M4. Second step M1 and M6: Anjali has no lever, and the plan says she has one.**
Evidence: plan 7.2 gives Anjali only `thirst` (cooler); section 4 and 5.2 define "Send them for coffee" as a global "the coffee drinkers' mappings read to drop caffeine". M1 says "she is at the cooler (or Ama's coffee lever)"; that lever does not move a thirst-only NPC. Ground rule 3 promises a lever per beat. M6 (the code fob) then waits on her thirst routine alone, and its window is one cooler use plus the walk.
Fix: add an Anjali mapping on `global_variable_changed:coffee_call` that sets `thirst` below her `urgentAt` (as Chidi's lunch mapping does, `scenarios/office_life_showcase/scenario.json.erb:291`), so "Send them for coffee" also sends her to the cooler. PLAYTEST.md: lever, wait for `npc_left_post:anjali_rao`, take the fob, sign in before she sits again (the lever can be repeated).

**M5. S8c M15 shows nothing: after M14 the records room is already open, so Fatima's prop has no step to skip.**
Evidence: [skin] docs:869 (a propped door opens a gated room "with no step and return[s] `roomData`"); A25 has no relock ([skin] docs:860-880). Plan 7.6 orders M14 (PIN plus Gwen's approval) before M15 (Fatima props the same door; "walk in with no step") and admits M15 first would leave M14 nothing to show. On one door, either order loses a beat.
Fix: give the prop its own gated door: a second small room (for example `archive_store`, off the office) with `locked: true`, `lockType: "pin"` and `secondStep: { "kind": "push", "owner": "gwen_pritchard" }`. Fatima's `prop_door` names that door and `records_wedge` sits outside it. M14 stays on `records_room`, M15 on `archive_store`, in either order. Update 7.1, 7.6, 7.9 and Run E, and drop the "start a new game" note.

**M6. S8b append: the desk's questions are required of every account admitted at an MFA PC, not only the accounts in the beat.**
Evidence: [build] `scripts/validate_helpdesk.rb:136-148` (for a `questions` desk, every account with a `resetPassword` or admitted at an MFA PC must hold every desk question in `creds.recovery`, else `helpdesks.<id>: question '<q>' is not in creds.recovery of <account>`, an error). Plan 7.5 gives `creds.recovery` only to "each account in the beat" (Darren, Yusuf). Lorna and Anjali sit under MFA policies (7.3), and with no `access` lists every account is admitted at every MFA PC (`docs/ACCESS_AND_NETWORKS.md:172`), so Niamh, Thandiwe, Gwen and Fatima count too. An answer no text holds also warns ([build] docs:899).
Fix: in 7.5, give each MFA PC an `access` list naming only its owner, and give both questions in `creds.recovery` to every account those lists admit (Lorna, Darren, Anjali, Yusuf). Place only Darren's and Yusuf's answers in readable text; list the warnings for Lorna and Anjali in BUILD_REPORT with the reason (no beat resets them; Anjali's fob must stay live for S8c).

### Minors

**m1. Recon R7: the "Known update gap" card is used before `update_lag` is confirmed.** A use on an unconfirmed finding answers 422 `not_confirmed` (`docs/ACCESS_AND_NETWORKS.md:1416`). R6 only scans and checks the file server; R7 and Run C go straight to Use. Fix: R6 confirms `update_lag` and `release_line` in the Terminal (the decoy shows its false reason there); Run C says so.

**m2. Passwords P4 and Run B: "crack Graham's before the note: No match" is a 20 s wait, and a press after taking the note during that wait still gets the stored "No match".** The first run stores `hit: false` and answers `running` (`ops_cracking.rb:179-184`), then `nomatch` after 20 s (`:213-223`). Fix: Run B and the runbook: press Crack before the note, wait out the countdown for "No match", then take the note and press again for a second countdown and "Cracked". Or drop the before-note press.

**m3. `printer_admin` (6.3) and Lorna's handed-over sign-in (7.4 M4) need `proof`.** Every credential needs exactly one proof, and a `password` also needs `foundIn` (`docs/ACCESS_AND_NETWORKS.md:617-619`; `scenarios/test_access_keyring/scenario.json.erb:45-49` has both). Fix: `printer_admin` `proof: { "held": "printer_admin_note" }`; for M4 name the item Ama gives (a `text_file` card holding Lorna's password, in Ama's `itemsHeld`) and a `password` credential with `foundIn` and `proof.held` naming it.

**m4. NPC ids are written two ways.** Recon and 7.4 use full ids (`agnieszka_duda`, `darren_price`, `yusuf_demir`, `lorna_easton`); 6.2 to 6.6 and 7.2 to 7.6 use short ones (`account: "delphine"`, `"graham"`, `"julian"`, `owner: "anjali"`, `"yusuf"`, `"gwen"`, `"darren"`, `share_login with "anjali"`, `npc_workaround:darren`, `cachedAccounts npc "niamh"`, `"jun"`). An `account`, `owner`, `with` or event suffix that is not the NPC id is a validator error or a dead mapping. Fix: one line in section 4 (NPC ids are `<first>_<last>`, as the art is named) and correct the field lists.

**m5. M9 kiosk: if the kiosk is Niamh's home or owned by her, the sign-in is refused while she sits beside it.** A PC whose owner is present, or which an NPC is using, answers "<name> is using this PC." (`public/break_escape/js/systems/unlock-system.js:582-587,660-663`; `workstation-state.js:617`). Fix: 7.1 says `visitor_kiosk` has no `owner`, and Niamh's `needsHome` is the stool.

**m6. Probe P1 is answerable now.** Opening a share emits `network_share_opened` and `network_share_opened:<resourceId>` with `{ resourceId, via, pcId }` (`public/break_escape/js/minigames/container/container-minigame.js:1332-1343`). Fix: R7 ticks `open_share` on `network_share_opened:shared_drive`; mark P1 answered.

**m7. "Unlocked container" must be written `"locked": false`.** The ops-follow1 check (`scripts/validate_scenario.rb`, uncommitted, `check_unopenable_containers`) warns on a container with contents and no `locked` key, and `check_common_issues` errors for `bin1`, `safe`, `briefcase` and others. Fix: 5.1, 5.3, 6.1 and 7.6 say `"locked": false` for `printer_cupboard`, Zainab's tool roll, `secure_bin` and the desk drawers.

**m8. Passwords objectives: `get_records` is in the morning aim but needs lunch.** P1's window is the lunch turn (6.4; Run A sends them to lunch before the bin). Fix: aim `morning` holds `earn_facts`; `get_records` opens aim `midday`.

**m9. Recon R5 wording.** A saved-connection grant adds no Open control to the row; the keyring lists it and the PC's sign-in control offers "Connect with ..." (`scenarios/test_ops_access/PLAYTEST.md:108,172-177`; `docs/ACCESS_AND_NETWORKS.md:1414`: only "a session grant adds ... Open"). Fix: R5 and Run B: open Agnieszka's PC's sign-in control from her row and connect with the saved connection.

## Round 1 findings: closed or not

| R1 | Status | Note |
|---|---|---|
| B1 sign-in with owner present | closed | 7.4 "Who is where"; presence rule checked (`workstation-state.js:617-629,676-680`) |
| B2 session grants on hosts | closed | file server is a sign-in object; new m1 (confirm first) |
| B3 implant with no network | closed | implant emits `network_foothold_gained:<pcId>` (`network-links.js:549`) |
| M1 one id space | closed | |
| M2 reuse | closed | the crack works (`ops_cracking.rb:78-86,227-233`); its "signs in nowhere" claim is new M3 |
| M3 strong never counts down | closed | Julian fixed; Delphine's grade makes her salted, new M2 |
| M4 feed fact | closed | |
| M5 Lorna never denies | closed | `mfa_prompt_sent:<npcId>` with `n` (`mfa-client.js:80-84,262`); `npc_returned_post` (`npc-needs.js:1526`) |
| M6 kiosk account | closed | new m5 on the kiosk owner |
| M7 Gwen inside the locked room | closed | |
| M8 printer lever props early | not closed | the reorder leaves M15 nothing to show; new M5 |
| M9 re-enrol Anjali | closed | |
| M10 slow windows | partly closed | lunch and frustration levers in; Anjali has none, new M4 |
| M11 cached hash per account | closed | |
| m1 to m13 | closed | m4 left P1 open; now answerable (new m6) |

R1 "left open for R2": `accessList` takes `roles` and `people` together (closed: schema `definitions/accessList`). The hearing range (P10), the host sprite and Darren's coffee estimate stay with the builders, each with a stated fallback: acceptable.

## Checked and found sound

- Build units are disjoint (8.3): S units own scenario, mission and BUILD_REPORT; I units ink and VOICED_LINES; T units test, PLAYTEST, graph and runbook; wave-3 units own a scenario's whole set one at a time.
- Appends: S5b, S5c, S8b, S8c add keys, objects, NPCs, knots and end-of-array mappings; S5c's edit of existing `creds` has its own check (6.6). The office's north side is free for the S8c connection.
- Every log event the plan lists is registered (`lib/break_escape/ops_log_events.rb:20-75`).
- Pestered approval counts per owner across attempts and resets on approval (`app/models/break_escape/mfa_access.rb:176-189`): M5 and M17 each take three requests.
- Left-behind items with chance 1 show on every leave (`npc-needs.js:3366-3383`); four left-behind items plus the wedge fit the V8 reveal cap of 6.
- Room types exist (`room_office`, `room_break`, `room_servers`, `room_IT`, `room_ceo`, `room_reception`, `room_lw_records`).
- USB port and implant socket shapes match `scenarios/test_ops_privilege/scenario.json.erb:244-287`.
- Lengths (15; 15 then 20; 18 then 25 minutes) suit a showcase slot.
- Objectives are plain and obey the wording rule, apart from m8.

## Withdrawn

None.

## Verdict

not clean (0 blockers, 6 majors, 9 minors).

## Check notes (written as the review ran)

- eventMapping `condition` gates the whole mapping, `setGlobal` included (`public/break_escape/js/systems/npc-manager.js:1578-1592`). Bears on recon R4's two-mapping tick.
- `network_share_opened` and `network_share_opened:<resourceId>` exist (`public/break_escape/js/minigames/container/container-minigame.js:1332-1343`): probe P1 is answerable now.
- Implant foothold emits `network_foothold_gained:<pcId>` (`systems/network-links.js:549`): P8 tick sound.
- Delphine's record `crack.difficulty: "medium"` resolves salted with a 60 s wait (`lib/break_escape/crack_difficulty.rb:21-23,28-44`); a salted run fixes its verdict at the start and answers `running` until the wait ends (`app/models/break_escape/ops_cracking.rb:166-184,213-223`).
- A technique use on an unconfirmed finding answers 422 `not_confirmed` (`docs/ACCESS_AND_NETWORKS.md:1416`).
- A sign-in PC with no `access` admits every account (`docs/ACCESS_AND_NETWORKS.md:172`, `game.rb:3361`). Bears on `printer_svc` "signs in nowhere".
- Owner presence = tracked by needs, at post, available (`public/break_escape/js/systems/workstation-state.js:676-680`); a PC with an owner not away and not present answers `signin` (`:626-629`). P7 at Julian's PC after `setVisible: false` is reachable.
- Pestered count is per owner across attempts and resets to 0 on approval (`app/models/break_escape/mfa_access.rb:176-189`): M5 then M17 each need three requests. Sound.
- [skin] docs:860-880: a propped door opens a gated room with no step; nothing re-locks an opened room. Bears on M14 then M15.
- [build] `scripts/validate_helpdesk.rb:136-148`: every account admitted at an MFA PC needs every desk question in `creds.recovery` (error). Bears on S8b.
- [build] docs:883: a `helpdesk_form` request is served only while that PC has an open, unlocked session.
