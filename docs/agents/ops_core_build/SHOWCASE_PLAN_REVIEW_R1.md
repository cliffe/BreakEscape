# Ops showcase plan: review R1

Reviewer: Opus, design review round 1, read-only except this file. Plan: `docs/agents/ops_core_build/SHOWCASE_PLAN.md` at commit 1cc353275. Kind of game: demo scenario.

Worktrees cited: `[main]` /home/deploy/BreakEscape, `[follow]` /data/be-ops-follow, `[build]` /data/be-ops-build, `[skin]` /data/be-ops-skin, `[logs]` /data/be-ops-logs.

## Findings

Counts: 3 blockers, 11 majors, 13 minors. Verdict at the end.

### Blockers

**B1. Second step M4 and M5: the player cannot sign in at a PC whose owner is at the desk, and Darren's open screen turns every away click into a claim.**
Evidence: `public/break_escape/js/systems/unlock-system.js:629-663` (`interactLoginPc` step 1: owned PC with the owner present shows "<owner> is using this PC." and stops, no sign-in screen); `workstation-state.js:55` ("owner present -> 'attended'"); `unlock-system.js:672-678` (owner away and screen open: the click claims the session, so no sign-in screen and no second step). Plan 7.4 M4 opening "Lorna is at her desk and alert" and M5 "Darren is at his desk, busy"; 7.2 gives Darren `habits.screen.lockChance: 0`, so whenever he is away his PC is claimed (M8), never signed into.
Fix: run every PC sign-in beat while its owner is away with a locked screen; a push still reaches the owner's phone wherever they are (docs:805 in [follow]). M4: Lorna at the coffee (Ama's coffee lever), screen locks (awareness high). M5 and M8 swap their windows: give Darren `habits.screen.lockIfAwayOverSeconds` about 90 (in place of `lockChance: 0`), so his short coffee trip leaves the screen open (M8, the way round, ticked on `workstation_accessed:darren_pc`) and his long lunch locks it (M5, pestered approvals while he eats). Rewrite the openings, Run A/B/C in 8.5 and 7.9 to match.

**B2. Recon R5 and R7 are not buildable: session grants on `hosts` entries and a "share" grant are validator errors.**
Evidence: `docs/ACCESS_AND_NETWORKS.md:1414` [follow] (N15: `grants` holds exactly `session` on "a PC with a sign-in whose `access` list admits that account" or `credential` for a `saved_connection`; validator errors on "a session grant on a host with no sign-in"). Plan 5.3 puts `office_printer` and `file_server` under `hosts` and has `factory_login` grant "a session on the printer", `update_lag` grant a user session, and `link_setting` "grants the `shared_drive` share". The model it cites does it differently: `scenarios/test_ops_skin/scenario.json.erb:239-262` (the FileHold server is a `lockType: "login"` object with `access`; `entry_a` grants a session to account `ian`, `entry_c` grants credential `file_link`); `test_ops_access/scenario.json.erb:27-33,80-85` (the printer's `factory_login` grants `saved_connection` `print_admin`, which connects to a sign-in host). Also an open `file_share` is served to any foothold (docs:1026), so with no `access` the drive opens at R1, not R7.
Fix: make `file_server` a sign-in object (`lockType: "login"`, `access: { roles: ["it"] }`, account Graham, `remote: "allowed"` policy) carrying the `storage` service, copied from `test_ops_skin:239-262`; `update_lag` grants `{ session: { account: "graham", access: "user" } }`; `link_setting` keeps `needs.session: "user"` and grants `{ session: { account: "graham", access: "admin" } }` (the step-up, as `test_ops_access:393-399`); `resources.shared_drive.access` admits only an admin session (or Graham with `admin: true`; state which). Printer `factory_login` either grants a `saved_connection` credential to the file server (as `test_ops_access`) or is report-only; the R5 text "Use gives a session on the printer row" changes to what it does. Re-check the 5.7 end state.

**B3. Passwords P8: the implant needs a network and the passwords showcase declares none.**
Evidence: `app/models/break_escape/network_access.rb:496-498` [follow] (`implant_foothold!`: `object_network(info[:object])` empty answers `implant_not_ready`, a quiet no-op on the client); `scenarios/test_ops_privilege/scenario.json.erb:10-12,225` (the model has `networks.office_lan` and `"network": "office_lan"` on the room). Plan 6.3 lists no `networks` and 6.1 no room network, so `override` (`network_foothold_gained`) never fires.
Fix: add `networks.office_lan` (`discovery` absent) and `"network": "office_lan"` on `partner_office` (and on the office and IT room if the free play should list the PCs). The foothold then opens the network view, which the host should explain in one line.

### Majors

**M1. Recon reuses one id for the printer object, host and resource: validator error.**
Evidence: `scripts/validate_network_ops.rb:103-104` ("hosts, objects and resources share one id space"). Plan 5.1 `office_printer` object, 5.3 host `office_printer`, 5.2 "a `work` need on the `office_printer` resource", 5.4 `offWhen printer_off`.
Fix: three ids, for example object `office_printer`, host `printer_host` (with `sprite`), resource `printer_res` (`kind: "printer"`, `object: "office_printer"`), and both the host's and the resource's `offWhen` read `printer_off`. Same check for `file_server` once B2 makes it a sign-in object (then it is not a `hosts` key at all).

**M2. Passwords P4 does not show reuse.**
Evidence: `app/models/break_escape/ops_cracking.rb:227-233` (`reused` yields only when ANOTHER account with an equal password is held); `:155` (if the player already holds this account's password the crack answers `cracked` at once, by no class at all); `:78-86` (a `password` credential with `account: graham` counts as holding Graham). Plan 6.3 makes `printer_admin` "a plain password credential" whose value equals Graham's; whichever account it names, either the crack answers at once (account graham: the keyring already signs in as Graham, so nothing was cracked) or the credential has no account the engine accepts. The model is two NPC accounts with equal passwords (`scenarios/test_ops_crack/scenario.json.erb:392-441`, `dana` and `farah`).
Fix: add a printer service account as a room NPC in the IT room with `creds` (on main it must be a person with a sprite, as `svc_sync` in `test_ops_mfa:282-293`; it becomes `accountOnly` in the S5c append), whose password equals Graham's; `printer_admin` is a `password` credential for that account; Graham's record cracks by reuse once the note is held. Say in Ama's recap that one person used one password on two accounts.

**M3. Passwords P5: a strong record never counts down.**
Evidence: `ops_cracking.rb:161-163` (`strong` returns `crack_strong_run!` before the salted branch at `:179`); `:199-205` (first run `nomatch`, second `infeasible`, `STRONG_RUN_CAP = 2` at `:20`). Plan 6.4 P1 "(Julian's) counting down", P5 "Wait out Julian's salted countdown", 8.5 Run B.
Fix: P5 is "press Crack twice: No match, then This one will not fall to guessing" (drop `crackSeconds` from Julian's record: the validator warns on a grade for a strong password, `scripts/validate_cracking.rb:359`). Show the salted wait on a record that yields: make Delphine's or the reused record `salted: true, crackSeconds: 20`, and say the wait in P3/P4.

**M4. Passwords P2: the feed fact depends on a need the plan does not give Delphine, has no lever, and has nowhere to read it.**
Evidence: docs:407-430 [follow] (A11: a post appears only when the NPC meets a `social_media` need use, "next post only", pace floor; facts withheld until served); `scripts/validate_cracking.rb:192-196` (a fact must be a `social.intelFacts` id). Plan 6.2 gives Delphine "caffeine, social" only, no `needs.social_media`, no `phone` or social place, and no OSINT browser object or `phone_friendface` to read the feed; rule 3 promises a lever per beat.
Fix: Delphine gets `needs.social_media` (an initial value that fires early) and `feed.order: "facts_first"`; Ama gets a lever mapping (`needs.set { social_media: <below urgentAt> }` on a global she sets: "Ask Delphine about her weekend"); place an OSINT browser object (the "office feed" kiosk) or a held phone to read it; declare both facts in `social.intelFacts`. Delphine's awareness must not be high, or the post needs `deliberate: true` (A11 warning).

**M5. Second step M4: Lorna never "denies".**
Evidence: docs:805 [follow] (A22: "A `never` owner never approves"; twenty requests, then the step ends); `app/models/break_escape/mfa_sign_in.rb:188-192` (`mfa_prompt_denied` is written only when the player answers Deny or a wrong number on a held phone); `mfa-client.js:197-218` (`mfa_failed` only on locked, cancelled, expired, wrong). Plan 7.2 ("Push requests to her are denied and she says so"), 7.4 M4 log rows and tick `mfa_failed`, M10 "Lorna's denial", 7.9.
Fix: M4 shows requests that go unanswered: log `mfa_challenge`, `mfa_prompt_sent` (one row with a count); tick on `mfa_prompt_sent:lorna_easton` (emitBoth suffix, `mfa-client.js:80-84,262`) with `data.n >= 2`; Lorna's line is an eventMapping bark on her return to her desk, not a denial. Remove "denial" from M10 and 7.9, and list the validator warning "a push PC nobody passes" for `lorna_pc` in the build report.

**M6. Second step M9: the kiosk account has no password source and cannot be "none" on main.**
Evidence: `scenarios/test_ops_mfa/scenario.json.erb:282-293` (`svc_sync` is a room NPC with position, sprite and ink) and `:233-237` (its password comes from a note); `accountOnly` is S5c ([logs] `scripts/validate_privilege.rb:328`), not on main. Plan 7.2 "kiosk account | none" and M9 give no way to learn its password.
Fix: make the exempt account a person (for example a temp at reception, with sprite and a short ambient line), and put the kiosk login on a readable card at the kiosk, as `test_ops_mfa`'s note does (a clue item, allowed by rule 7). Or move M9 to the S5c append as an `accountOnly` account.

**M7. S8c: Gwen at a desk inside the locked records room is never simulated, so the lunch phone beat cannot happen.**
Evidence: `README_scenario_design.md:1369` [follow] ("an NPC behind a locked door is never simulated"). Plan 7.6 puts Gwen "at her desk in the records room except at lunch, when she leaves her phone charging in the kitchen" (M14).
Fix: Gwen's desk goes in the office; she owns the records room door. Her phone is a left-behind slot in the kitchen (`owner: "gwen"`, `leftBehindChance: 1`, shown on any leave, `npc-needs.js:3366-3378`), so her coffee or lunch trip puts it on the charger; give her a lever (Ama's coffee or lunch call reaches her).

**M8. S8c: the printer lever would make Fatima prop the records door in the morning, before M14 can show its step.**
Evidence: README:1357 (`prop_door` opens the room "for the rest of the mission"); [skin] docs:869 (a propped door skips the step). Plan 7.6 drives Fatima's frustration from the printer outage (P7 fallback), and M2 turns the printer off in the morning.
Fix: drive Fatima from her own resource (for example `records_index`, global `records_index_off`, its own wall switch and an Ama lever), used only in M15 after M14. Order M14 before M15 in Run E and say why.

**M9. S8b M12 re-enrols Anjali, whose fob S8c M16 then needs for the safe.**
Evidence: [build] docs:876 (re-enrolment: "The old code device says No longer in use and shows no digits"); [skin] docs:879 ("a lock never approves from an owner's own-phone reset"). Plan 7.5 M12 (Anjali) and 7.6 `records_safe` `secondStep: { kind: "code", owner: "anjali" }`.
Fix: M12 re-enrols Yusuf (number match moves to "My phone"; no S8c lock names him), and Anjali's fob stays live for M16. Note it in the S-8c brief so the later unit does not pick Anjali again.

**M10. Office-life windows that wait minutes with no lever.**
Evidence: `scenarios/office_life_showcase/scenario.json.erb:351` (Graham's lunch mapping sets hunger 62; `urgentAt` 40, decay 4/min at `:344`: about five minutes before he leaves), which plan 6.2 copies "as showcase" for the P1 bin window; plan 7.2 gives Darren no hunger need, so "Send them to lunch" never moves him (M5/M8 after the B1 fix); `scenarios/test_access_work/PLAYTEST.md:94,122` (a writes_down note took about 80 s of outage plus a wait for the owner to leave); `npc-workarounds.js:46-58,70` (`share_login`'s listening window is the 6-second dwell, at a time the player cannot see coming).
Fix: in each showcase, every lunch mapping sets hunger below `urgentAt` (20, as Chidi at `:291`) for the NPCs whose absence a beat needs (Graham in passwords; Darren, Lorna in second step) and those NPCs get a hunger need; Darren and Yusuf get `frustration.perFail` high enough that one or two failed uses reach their `at` (say so with the expected seconds in PLAYTEST.md); Yusuf's `wk_share_login` start line plus an Ama bark on `npc_workaround:yusuf_demir` phase `started` tell the player to stand by Anjali's desk before the 6 s window.

**M11. S5b append: every cached account needs its own hash record.**
Evidence: [logs] `scripts/validate_privilege.rb:252` ("cached accounts are hashes: author one hash record per PC and account"). Plan 6.5 caches `niamh` and `jun` at `hot_desk` and `julian` and `delphine` at `partner_pc` but names only `jun_cached` and `delphine_cached_partner`.
Fix: add `niamh_cached_hot_desk` (for example `common` or guessable with a feed fact) and `julian_cached_partner` (strong: the collect shows a row that will never fall, which repeats P5 in a new place), each `proof.harvested` its PC; add their crack beats or say they are left uncracked on purpose.

### Minors

**m1. Caught-at-post claims.** `npc-needs.js:3449-3463`: `npc_caught_at_post` fires only while the NPC walks back from a leave and the player is within 1.5 tiles of the home object's approach cell. R1 "If Jun is there, he catches you", R5 (cupboard) and P1 (bin) say otherwise. Fix: R1 says "plug in while he is away; if you are still at the jack when he comes back he catches you" and the jack sits within that radius of Jun's home; drop the caught claim from the cupboard and the bin (or make each a home object).

**m2. `accountProfiles.for` shape.** `scripts/scenario-schema.json` (`for` is an `accessList`); `test_ops_privilege/scenario.json.erb:46-48` uses `{ "people": ["uma"] }`. Plan 6.3 writes `for: ["julian"]`. Fix: `{ "people": ["julian"] }`.

**m3. Recon seed rows name a "meeting-room jack" that does not exist.** No meeting room in 5.1; `scripts/validate_log_rows.rb:400-405` does not list jacks, so the validator will not catch it and the reader shows a raw id. Fix: add a second jack (for example in the kitchen) and name it in the seed rows.

**m4. Probes already answerable from the code.** P2: no skin-switch event (network view emits only `network_swept`, `_host_scanned`, `_service_checked`, `_finding_confirmed`, `_technique_used`, `_technique_refused`, `_host_opened`, `_viewed`), so ink tick. P3: yes, `{ findingId, status }` and the suffixed name (`network-view-minigame.js:1071`): tick on `network_finding_confirmed:<printer finding id>` for each, no count global. P4: no, `keyring_changed` carries `{ rev }` only (`keyring.js:875`): ink tick. P5: `pc_signed_in` carries `npcId`, `username`, `via`, no level (`pc-sessions.js:997-1000`): use the fallback. P9: yes (`mfa-client.js:80-84`). Fold these into the plan so builders do not re-probe.

**m5. "Put the cake out" lever.** No action places an object in a room (`apply-actions.js:224-549`). Fix: drop the lever; use Ama's coffee lever for Delphine's absence, or have Ama ask the player to drop the cake.

**m6. P8 aside.** With no session the implant answers `not_ready` quietly (`network_access.rb:502-503`), not the policy line, and no user-level account can sign in at `partner_pc` (Julian strong; access julian and it). Fix: drop the aside; P6 shows the refusal.

**m7. Graph files cross units.** 8.3 has the S units run the full validator once the I unit lands; 8.4.1 says that run rewrites `dungeon_graph.*`, which the T units own. Fix: S units validate with `--no-graph`; only the T unit writes the graph.

**m8. `prop_door` needs `prop`.** README:1349,1369: `door` and `prop` both required, the prop outside the locked room, hidden on the workaround's `setGlobal`. Plan 7.6 gives only `door`. Fix: add a wedge object in the office.

**m9. S5c account-only fields.** [logs] `scripts/validate_privilege.rb:328`: an `accountOnly` NPC may carry only `id`, `displayName`, `npcType`, `creds`, `role`, `staff`, `accountOnly`. So `deskadmin`'s `common` class goes on its hash record as `crack.password: "common"`, not in `habits`. Say so in 6.6.

**m10. Left-behind items are a seeded roll on any leave.** `npc-needs.js:3366-3378`: shown at the item's declared spot when the roll falls under `leftBehindChance`, on every leave, and stowed on return. Fix: `leftBehindChance: 1` for the fob and the phone; place the phone's declared spot by the coffee machine; PLAYTEST.md says it appears whenever Yusuf leaves his desk.

**m11. S8b "the desk answers only when she is in".** [build] docs:890: the desk needs the NPC to exist, be met and not be knocked out; presence is not checked, and the form over a PC works wherever Thandiwe is. Fix: reword, or gate her ink hub choice on a condition (story only).

**m12. Length of the second-step showcase now.** Ten beats, two outage waits (M2/M3) and a lunch turn in 15 minutes is tight. Fix: budget 18 minutes now (25 with appends) in mission.json, or move M9 to the append.

**m13. Julian's lunch wording.** 6.2 "back on `act_evening` false then home" is unclear. Fix: `setVisible: false` on `act_midday`; he does not come back (his PC stays free for P7 to P8).

## Checked and found sound

- Client events named in section 4 exist: `pc_signed_in:<pcId>` (`pc-sessions.js:365-373`), `network_*` (`network-view-minigame.js:1065-1074`), `network_foothold_gained` from a jack (`network-links.js:467`), `usb_refused:<objectId>` (`interactions.js:1116-1119`), `mfa_approved:<npcId>` (`mfa-client.js:248`), `npc_workaround:<npcId>`, `npc_overheard_login:<npcId>`, `workstation_accessed:<pcId>`, `npc_left_post:<npcId>`.
- Log events planned are all registered (`lib/break_escape/ops_log_events.rb:25-69`, including `admin_profile_read`, `usb_install_overridden`, `net_link_up/down`, `share_folder_opened`, the eight `mfa_*`). The anomaly flag runs `completionActions` with `complete_task` (`ops-log-minigame.js:61-74,486-501`).
- Realism ids and product exist (`docs/REALISM_CATALOG_INDEX.md:13-15`); `room_lw_records` and `room_it` room types exist; `tools/check_mapping_index_drift.rb BASE_REF <erb>` matches 8.3.
- Lever mechanism: eventMappings `needs.set` on `global_variable_changed:<g>` exists (`office_life_showcase/scenario.json.erb:291`).
- S8b fields, form, stale notes, five-minute stop, own phone, and S8c kinds per lock type (`code` on `pin`, `push` on `key`), carried-case count across a drop: as the plan says ([build] docs:859-902; [skin] docs:860-880).
- Appends: S5b/S5c, S8b, S8c additions are new keys, new objects, new knots and mappings at the end; the drift check in 8.3 is the right proof.

## Withdrawn

None.

## Verdict

not clean (3 blockers, 11 majors, 13 minors).
