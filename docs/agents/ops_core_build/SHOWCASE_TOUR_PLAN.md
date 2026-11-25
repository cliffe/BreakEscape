# Ops showcases: guided tour and voice audio (plan)

Kind of game: **demo scenario** (AGENTS.md "Lab, demo and test scenarios"). The owner's ask (2026-11-25): "Add audio to the showcases. Make sure they provide a guided demo of all the features, so I can play through and see everything in action." The aim is that the owner, or a teacher, opens each showcase, follows Ama's pointers and the objectives panel from the first beat to the last, sees every player-visible ops feature on main working, hears a plain one-line "what you just saw" after each, and never has to wait on an office routine for longer than about a minute.

Base: worktree `/data/be-ops-follow`, branch `ops-showcase-tour`, from main `537dbd52c` (gem 1.0.24). The scanner hardening branch (recorder tags in the leak check, a `routeRoom` key) lands first; every unit below merges main before it starts, so its leak scans use the hardened check.

Sources read: `AGENTS.md`; `.claude/skills/tts-audio/SKILL.md`; `.claude/skills/npc-dialog-review/SKILL.md` (2l concision); `docs/agents/ops_core_build/SHOWCASE_PLAN.md`; the three showcases' scenario files, ink, `PLAYTEST.md`, `planning/BUILD_REPORT.md` and `planning/VOICED_LINES.md`; `docs/ACCESS_AND_NETWORKS.md` A18 to A25 and N13 to N16; `README_scenario_design.md` rows A18 to A25 and N13 to N16; `FOLLOW_A_BUILD_BRIEF.md` (S7 decisions) and `FOLLOW_B_BUILD_BRIEF.md` (S6 decisions); `docs/REALISM_CATALOG_INDEX.md` (the catalog itself was not opened); `db/seeds.rb`, `tools/playtest/swap-scenario-game.rb`, `games_controller.rb#tts`.

Scope: the ops layer (A18 to A25, N13 to N16, the S6 and S7 follow-up decisions, the ops log). Access-layer features from before it (A1 to A17, N1 to N12) count only where an ops showcase uses them; the rest (Wi-Fi and the rogue AP, port security, the patch panel, gated doors, disguises, pivots) are `demo_access_tour`'s, which is already voiced (204 clips) and is not touched.

## 1. Coverage audit

Key: **G** guided (an objective task or Ama's "What's next?" leads the player there), **F** free play only (PLAYTEST or a hint mentions it, nothing leads to it), **–** not shown. **Voiced**: no showcase has any audio yet (`tts_cache/` has no `demo_ops_*` folder), so every row is "not voiced" today; the column is left out. Line numbers are in `scenarios/<showcase>/PLAYTEST.md` unless a file is named.

### 1.1 Network recon (N13 to N16), technique sessions, network log: `demo_ops_recon`

| Feature | Beat today (file:line) | Now | Gap and fix |
|---|---|---|---|
| Drop box at a network jack, foothold (N1) | R1b, recon `PLAYTEST.md:78`; task `plug_in` | G | none |
| Caught at someone's desk (office life) | R1a, `:77` | F | Ama names it once in the plug-in pointer (tour line R1) |
| Sweep, discovery network (N13) | R2, `:79`; task `sweep` | G | none |
| Scan, services on a host (N13) | R3, `:80`; task `scan_printer` | G | none |
| Check and confirm, real versus false (N14) | R4, `:81`; task `confirm_both` | G | none |
| Technique card on a confirmed finding (N15) | R5b, `:92`; task `use_card` | G | none |
| Card refused: false finding, unconfirmed finding, wrong class | R5d, `:94` | F | a "try the card on the false one" pointer after `use_card` (tour R5) |
| Saved connection in the keyring, remote sign-in from a row (A15, N2) | R5c, `:93`; Ama bark only | F (bark) | new task `remote_signin` (tour R5c) |
| Technique sessions, user then admin, the step up (`needs.session`) | R7d, R7e, `:112-113` | G (inside `open_share`) | own "what you saw" lines (tour R7) |
| Technique session marks (red frame, lightning bolt) | seen in R7, not named | F | named in the R7 line |
| Access-listed share (N4) | R7c, R7f, `:111`, `:114`; task `open_share` | G | none |
| Outage: device switched off at the wall (N7) | A5, `:82` | F | tour R3b pointer (printer socket) |
| Panels and the Terminal skin (N16) | R6, `:95-98`; task `terminal_view` (ink tick) | G | none |
| Terminal for the life of the view (S6-2) | B7, `:99` | F | tour R6c |
| Terminal tables, one span per cell (S6-4) | every scan table in R6, not named | F | named in the R6 line (the scan table) |
| Whole verbs to end a trip (S6-5) | not shown | – | tour R8c: a short form refused, the whole word ends the trip |
| Realism catalog text (scanner output, advisory lines, console search and info) | dropped: `BUILD_REPORT.md:15`, `PLAYTEST.md:128` | – | the new fourth showcase (1.5) |
| Unplug ends every session run through it (N5) | R8c, `:117` | F | new task `unplug` at the end of the evening aim (tour R8c) |
| Network log, network and share rows, seed rows, anomaly flag (A24) | R8a, R8b, `:115-116`; task `read_log` | G | none |

### 1.2 Passwords, privilege, cached and local accounts: `demo_ops_passwords`

| Feature | Beat today | Now | Gap and fix |
|---|---|---|---|
| Feed post and desk photo give intel facts (A11) | P2a, P2b, `:79-80`; task `earn_facts` | G | none |
| Hash records from a held file, capture log Hashes (A21) | P1, `:82`; task `get_records` | G | none |
| Crack with facts: missing fact, wrong pick, cracked | P3a, P3b, `:83-84`; task `crack_guessable` | G | none |
| Reused password cracks with no facts | P4b, `:86`; task `crack_reused` | G | none |
| Salted wait, countdown, auto-finish and its end-of-wait words (S7-3) | P4a, P4b, `:85-86` | G (wait), F (words) | the P4 line names what the end of the wait said |
| A run's verdict fixed when it starts | P4a, `:85` | G (hint) | none |
| Strong password never falls | P5, `:87`; task `crack_strong` | G | none |
| Cracker from a held hash file in the tray (S7-2) | harness note only, `:63` | – | tour P4: crack Graham's from the file in the tray |
| Cracker from the "Hash collected" toast (S7-2; button only when the toast names one record) | harness note only, `:63` | – | tour P11a and P11c: collect at the hot desk before and after the borrow, one record each time |
| Cracked password fills the sign-in tile (S7-1) | P6a, `:97` (tile tagged Cracked) | G (used), not named | named in the P6 line |
| User session, no Administrator mark (A18) | P6a, `:97`; task `user_signin` | G | none |
| Desk USB policy refuses a stick (A10b) | P6b, `:98`; task `usb_refused` | G | none |
| Device in use: "<Name> is using this PC." | P6c note, `:99` | F | shown and named in second step (1.3); here a one-line aside |
| Service account signs in nowhere (role and `access`) | P6c, `:99` | F | stays free play (Ama's free-play line) |
| Admin session, Administrator mark, profile reach (A18, A5) | P7a, P7b, `:100-101`; tasks `admin_signin`, `profile_read` | G | none |
| Admin override at the keyboard for a keystroke device (A18, N10) | P8, `:102`; task `override` | G | none |
| Admin override for a stick at a governed port (`portOf`, A18 ruling A) | not built: `desk_usb_port` has no `portOf` (`scenario.json.erb:424`) | – | tour P8b: `portOf: "delphine_pc"`, Graham's admin session at Delphine's PC lets the stick through |
| Admin session kept over a reload | P8b, `:103` | F | stays a check |
| Cached accounts and the collect, "Nothing new is cached here." (A19) | P10, `:114`; task `collect_partner` | G | none |
| The borrow (workaround `borrow_session`) adds a cached account | P11, `:115`; tasks `see_borrow`, `collect_hot_desk` | G | the before-and-after collect (tour P11) makes the lesson visible |
| Crack a collected record; a weak one falls anywhere | P12, `:116`; task `crack_cached` | G | none |
| Account-only shared local administrator; local account refused elsewhere, no lockout (A20) | P13, P14, `:117-118`; tasks `local_account`, `local_refused` | G | none |
| "Domain:" line on sign-in and lock screens (A20) | P15, `:119` | G (Ama line), no task | named in the P14 line |
| Failed sign-ins merge into one row with a count; lockout | free play, `:126` | F | stays free play |
| Sign-in log and the night-time anomaly (A24) | P9, `:104`; task `read_log` | G | **order**: the evening aim (`order: 2`) shows before the afternoon aim (`order: 3`) and "Call it a day" is open before P10 to P15 (`ink/ama_owusu.ink:95`); tour fixes the order and adds the "Not yet" gate |

### 1.3 Second steps, the helpdesk, second steps on locks: `demo_ops_second_step`

| Feature | Beat today | Now | Gap and fix |
|---|---|---|---|
| Device in use: owner at the desk, no sign-in | Run A step 1, `:52-53` | G (first step) | named in the tour line M0 |
| Password written on a sticky note (A4, A9) | M1, `:59-60`; task `see_note` | G | none |
| Written down in a temper (A10 `writes_down`) | M2, `:68-69`; task `see_temper_note` | G | wait of 90 to 180 s (`:176`); tour tunes it to about 60 s |
| Said aloud, overheard (A10 share) | M3, `:70-72`; task `overhear` | G | none |
| Push that nobody answers (A22 `push`) | M4, `:64-67`; task `step_holds` | G | none |
| Open screen claimed, no step (A6, A8) | M8, `:61-63`; task `open_screen` | G | none |
| Code from a fob, wrong code count (A22 `code`) | M6, `:78-81`; task `fob` | G | none |
| Number matching on the owner's held phone, a wrong number cancels (A22 `push_number_match`) | M7, `:84-89`; task `number_match` | G | none |
| Pestered into approving (A22, an owner who approves after repeated requests) | M5, `:97-99`; task `pestered` | G | wait of about two minutes for the screen lock (`:97`); tour adds a bark when it locks |
| Exempt account, no second step (policy) | M9, `:100-101`; task `exempt` | G | none |
| Helpdesk in person, ink tag (A23) | M11, M12, `:114-122`; tasks `reset_password`, `reenrol` | G | none |
| Helpdesk form on a PC desktop (A23 route 2) | `darren_form`, `scenario.json.erb:473`; mentioned at `:118` as an alternative | F | tour M12 uses the desktop form |
| Helpdesk from a phone call (A23 route 3, pretext ask) and the `callback` rule | not built (one desk, `verify: questions`) | – | owner decision 5.4; recommended as unit U3b |
| Reset password: "Reset" tag fills the tile, old password refused | M11, `:115-116` | G | named in the M11 line |
| Own phone ("My phone") after re-enrolment; old phone lists nothing | M12, `:120-121` | G | none |
| Old code device "No longer in use" | not shown (Anjali is never reset, on purpose, `:121`) | – | not shown; `test_ops_helpdesk` covers it (see 1.6) |
| Desk stop after `maxTries`; unknown name answered like a wrong one | M13, `:123` | G | none |
| Push expires after many sends | free play, `:170` | F | stays free play |
| Second step on a door: push, approved on the held phone (A25) | M14, `:139-143`; task `door_step` | G | none |
| Propped door skips the step (A10 `prop_door`) | M15, `:134-138`; task `propped` | G | none |
| Second step on a safe: code from a fob (A25) | M16, `:144-147`; task `safe_step` | G | none |
| Carried case: Unlock and Open in the tray, owner pestered (A25) | M17, `:148-150`; task `case_step` | G | none |
| Number matching on a lock (A25 `push_number_match`) | not shown on a lock (shown on a PC, M7) | – | not added (same screen as M7); `test_ops_lock_step` covers it |
| Lock step keeps a re-enrolled device live while it waits (`device_in_use?`) | not player-reachable here | – | not shown; Rails-tested in `test_ops_lock_step` and `test_ops_helpdesk` |
| Approvals log, MFA rows, night burst anomaly (A24) | M10, `:103-105`; task `read_log` | G | none |

### 1.4 Features in no ops showcase today

| Feature | Where it is shown today | Fix |
|---|---|---|
| Realism catalog text in the Terminal: the version table, each finding's scanner output and "IDs" line, the console's `search`, `info` and `use` | `test_ops_skin` only (`PLAYTEST.md:98-99`) | fourth showcase `demo_ops_terminal` (1.5) |
| Relay session: an assist invite's shared screen, admin when the account is, ends when the owner ends it (A15, A18) | `test_ops_privilege` beats 10 to 12, `test_access_keyring` | `demo_ops_terminal` beat T9 |
| Timed sign-in token that expires (A15 `expiresMin`) | `test_ops_privilege`, `test_access_keyring` | `demo_ops_terminal` beat T10 |
| Keystroke device refused over a remote or relayed session: "Nobody is signed in at this keyboard." (A18 limits) | `test_ops_privilege` | `demo_ops_terminal` beat T11 |

### 1.5 The realism text: how to show it (recommendation)

The facts: `scripts/validate_realism_skin.rb` (lines 485 to 511) wants every finding in a scenario to link a catalog entry, each entry linked once, and a banner on every finding-holding service. The catalog (`config/break_escape/realism_catalog/training_fixtures.json`, read only through `docs/REALISM_CATALOG_INDEX.md`) has three entries, all for the invented "Tarnwick FileHold 4.2": `filehold_update_lag`, `filehold_link_setting`, `filehold_release_line`. Their advisory ids are invented (year `0000`, docs N16), and entries are append-only; a new entry needs human review. Linking an entry from a scenario whose folder does not start `test_` freezes its advisories and output for good (`scripts/validate_realism_catalog.rb:360`, decision S6-9 freeze).

Options:

1. **A small fourth showcase, `demo_ops_terminal`, with the FileHold server as its only finding holder** (three findings, three links, all rules met). It also gives the three keyring and session features in 1.4 a home. About 12 minutes. **Recommended.** Cost: one new scenario, about 60 new voiced lines, and the freeze of the three entries' content (they are training fixtures, already the reference text for `test_ops_skin`, so the freeze changes nothing a player sees).
2. Add the realism links to `demo_ops_recon`. Needs three more catalog entries for the printer and camera findings (human review, real-looking ids live only in the catalog) or removing the printer findings, which are recon's best beat. Not recommended.
3. Send the owner to `test_ops_skin` for the text. No build, but it is a bare test room with no guide and no audio, so it is not "a guided demo". Kept as the fallback if the owner says no to option 1.

### 1.6 Left out on purpose

Shown only by test scenarios and Rails tests, because a beat would cost more than it teaches or would break a showcase lesson: the old code device "No longer in use" after a re-enrolment (needs an account with readable recovery answers and a fob, which would let the desk undo M16), the lock-step device-in-use seam, number matching on a lock (the same screen as M7), the lapsed USB override (C2-4), a relay that never feeds a step up (O1: it needs a finding on a PC, which the catalog rule in 1.5 forbids in `demo_ops_terminal`). PLAYTEST for each showcase lists these in a "Not in the tour" section with the test scenario that shows each.

## 2. The guided tour

### 2.1 How every showcase guides (shared rules)

1. **One pointer, one action, one "what you just saw".** Ama's "What's next?" names the next undone beat in plain words (what to do, not which button: the wording rule at `docs/ACCESS_AND_NETWORKS.md` N16 and SHOWCASE_PLAN 2.8). When the beat's task ticks, Ama barks one "what you just saw" line: one true sentence about what the engine just did, and, where useful, a second sentence pointing at the next beat. Barks use the pattern the showcases already have: `global_variable_changed:<task>_done` with `data.oldValue !== true`, a condition that the next step is not yet done (so a stale bark is dropped), held while a minigame is open and shown when it closes (recon `PLAYTEST.md:66`). Every bark obeys the voiced-line rules (section 3.1). "What did that show?" keeps the longer recap per beat for reading back.
2. **Order shown three ways, the same.** Objective aims (with `order`), the "Things to try" board and "What's next?" list the beats in one order. New tasks go at the end of their aim (SHOWCASE_PLAN 2.9 append rule, kept so `tools/check_mapping_index_drift.rb` stays quiet); an aim's `order` may change.
3. **No beat waits on a routine for more than about a minute.** Each window has a lever in Ama's hub (listed per showcase). Where a routine is still slow, the unit tunes the numbers and writes the measured seconds into PLAYTEST. Deliberate waits (the salted countdown, the expiring token) are the lesson and stay.
4. **"Call it a day" waits for the tour.** In every showcase the evening lever refuses with "Not yet" and the list of undone beats until they are done, with "Skip them and call it a day anyway." (the second-step pattern, `demo_ops_second_step/ink/ama_owusu.ink:253`).
5. **Free play stays.** Each PLAYTEST keeps a "Free play" list, and a "Not in the tour" list naming the test scenario that shows each left-out feature (1.6).
6. **No secrets in lines.** No password, code, hash token, recovery answer or catalog text in ink, barks, boards or PLAYTEST prose (SHOWCASE_PLAN 2.7). Lines that mention the Terminal's text say it imitates a scanner and a console and that the names and ids are invented.

The line drafts below give the content each line must carry; the builder may tighten them, never lengthen them, and the dialogue review (section 4.3) has the last word.

### 2.2 Order to play, and time

| Order | Showcase | Teaching question | Time |
|---|---|---|---|
| 1 | `demo_ops_recon` "On the network" | What can one network cable learn, and how do you tell a real weakness from a false alarm? | about 20 min |
| 2 | `demo_ops_terminal` "The Terminal close up" (new) | What does a scanner's report really tell you, and what does a remote way in give you? | about 12 min |
| 3 | `demo_ops_passwords` "Passwords" | Why do some stored passwords fall and others never, and what does an administrator reach? | about 30 min |
| 4 | `demo_ops_second_step` "Second steps" | What does a second step add, where does it give way, and what does the helpdesk undo? | about 35 min |

About 1 hour 40 minutes in all; each stands alone, so any one can be played in a lesson slot. Recon first because it introduces the network view that the Terminal showcase then opens up; passwords before second step because the second step only matters once a password is known.

### 2.3 `demo_ops_recon` (about 20 minutes)

Levers in Ama's hub: "Send them for coffee." (repeatable; empties the hot desk), "Send them to lunch." (once; after the kitchen is seen), "Call it a day." (after the kitchen and server room are seen, and now after the tour). The printer's wall socket is a lever in the world.

| # | Task (aim) | Ama's pointer | What you just saw (bark on the tick) |
|---|---|---|---|
| R1 | `plug_in` (morning) | as now (`ink/ama_owusu.ink` `whats_next`), plus "If Jun comes back while you're at his port, he'll ask what you're doing." | "You're on the office network now. The box is your foothold. Anything it can reach, you can look at." |
| R2 | `sweep` | as now | "Those are the machines that answered. One spare port showed you every PC, the printer, a camera and a file share." |
| R3 | `scan_printer` | as now | "Each tile is something the printer offers, with its product and version. The admin page is the one to check." |
| R3b | none (pointer only) | "Want to see an outage? Switch the printer off at its wall socket and sweep again. Then switch it back on." | (existing printer-off bark) "Printer's off. It won't answer on the network now." |
| R4 | `confirm_both` (midday) | as now | "Two reports that looked the same. Only testing showed which was real and why the other was a false alarm." |
| R5 | `use_card` | as now | "The card fitted the real weakness. The printer had kept a saved link to Agnieszka's PC, and that link is in your keyring now." Then: "Try the same card on the false one, if you like. It won't take." |
| R5c | `remote_signin` (new, end of midday) | "Open the sign-in control on Agnieszka's PC row and connect with the printer's saved link." | "That's her desktop, and you never knew her password. A saved connection works like one." |
| R6 | `terminal_view` | as now ("Now try the file server the same way, in the Terminal view.") | (on the ink tick) "Same findings, same names, typed instead of clicked. Its scan came back as a table, lined up in columns." |
| R6c | none (pointer) | "Switch to Panels and back again. The Terminal keeps its log for as long as the view is open." | none |
| R7a | none (inside `open_share`), on the first technique session | as now (Zainab's card, the update finding) | "A session on the file server as Agnieszka, an ordinary user. The red frame means a technique got you in, not a sign-in." |
| R7b | none (inside `open_share`), on the admin session | as now (the tool roll card, the settings finding) | "Now you're Graham, an administrator. The user session was what that weakness needed first." |
| R7c | `open_share` (evening) | as now | "The shared drive opens only for Graham. The foothold and Agnieszka's session weren't enough." |
| R8 | `read_log` | as now (Graham) | "Every move you made is in that log, after the stranger's. Whoever reads it can see you, the way you saw them." |
| R8c | `unplug` (new, end of evening) | "Last thing. Go back to the hot desk port and unplug the box." | "Unplugging ended every session that ran through the box. Your keyring keeps what you found." |

Tick events: `remote_signin` on `pc_signed_in:agnieszka_pc` (check the payload's `via` in a probe; any sign-in there by the player counts); `unplug` on `network_foothold_dropped` (`systems/network-links.js:312`); R7a and R7b barks on the bare `network_technique_used` with the payload's grant (as `use_card` already reads it, `BUILD_REPORT.md:41`), never on a suffixed finding id (the leak scanner rule `ops_string`). Ama's "What's next?" gains the R5c, R6c and R8c lines in order; the board gains the same lines.

### 2.4 `demo_ops_terminal` (new, about 12 minutes)

**Premise.** Fenlow's field engineer Zainab is setting up remote support for Merrin & Sallow's file server. Ama asks you to look at it the way an attacker's tools would, and to see what the remote ways in (a shared screen, a timed token) give and do not give. Same firm, same host. All rooms open; no combat (`"disableAttacks": true`).

**Rooms** (three, `room_office`, `room_servers`, `room_it`): `office` (start: Ama, Chidi at his desk, the coffee station and its socket, the notice board), `server_room` (the server room network port `rack_jack`, the FileHold file server `file_server` as in recon (headless sign-in object, `policy: "infra"`, service `storage`, banner set), the backup PC `backup_pc` (sign-in, no owner, admits Zainab) with its keystroke socket `backup_pc_socket` (`grant_foothold` with `needsSession: backup_pc`), Zainab, her tool roll), `it_room` (Graham and his PC `graham_pc`, `creds.admin: true`). Every room on `"network": "branch_lan"`.

**Ops fields.** `networks.branch_lan` (`discovery: "scan"`, a private `cli.range` not used by recon); `networkView` set to open the Terminal first (as `test_ops_skin`); `file_server` findings: `update_lag` (weakness, `realism: "filehold_update_lag"`, grants a user session as Zainab), `link_setting` (weakness, `realism: "filehold_link_setting"`, `needs: { session: "user" }`, grants an admin session as Graham), `release_line` (decoy, `realism: "filehold_release_line"`); no other host has a finding. Techniques and cards: "Known update gap" (Zainab gives it), "Left-open settings" (her tool roll). `credentials`: `zainab_token` (a saved sign-in token for `backup_pc`, `expiresMin: 3`, starting when the box first goes in, copied in shape from `test_ops_privilege`'s `adel_token`) and `graham_assist` (`kind: "assist_invite"` for `graham_pc`, `proof.held: "graham_assist_code"`, `endsOnGlobal: "graham_assist_ended"`, as `test_ops_privilege` `uma_assist`). Start items: the drop box, the keystroke device. No log source (the three other showcases each have one).

**Cast and voices.** Ama (Autonoe, the shared style, 3.2), Zainab (Achernar, recon's style), Graham (Umbriel, the shared style), Chidi (Zubenelgenubi, ambient, two chatter lines). Levers: "Send them for coffee." (Chidi only, colour), "Ask Graham to end the shared screen." (sets `graham_assist_ended`).

| # | Task | Pointer | What you just saw |
|---|---|---|---|
| T1 | `plug_in` | "Plug the box into the server room port. This time the view opens as a Terminal." | "The Terminal imitates a network scanner and an attack console. Every name and number in it is invented for training." |
| T2 | `sweep` | "Sweep the network. Type it or press the quick command." | "The same list Panels would show, as a table. Each cell lines up in its column." |
| T3 | `use_token` | "Zainab left a sign-in token for the backup PC in her tool roll. Use it now, while it's fresh." | "You're on the backup PC with a token, no password. It only lasts a few minutes from when the box went in." |
| T4 | `scan_check` | "Scan the file server, then check its storage service." | "Three findings, each with a scanner's write-up and reference ids. The false one reads just as convincingly as the real ones." |
| T5 | `console` | "Open the console and search, then ask for info on one finding." | "The console lists a module for every finding, the false one too. A module existing proves nothing about this server." |
| T6 | `confirm_all` | "Confirm all three. Only that tells them apart." | "Two real, one false, and the false one says why. The write-ups didn't tell you that. Testing did." |
| T7 | `step_up` | "Ask Zainab for her card. Use it on the real update finding, then the tool roll card on the settings one." | "A user session first, then an administrator's on top of it. Same as the recon day, typed." |
| T8 | `keeps_log` | "Switch to Panels and back. Your Terminal log is still there." | "The Terminal stays for as long as the view is open, with everything you typed." |
| T9 | `shared_screen` | "Ask Graham to show you the server's admin page. He'll share his screen." | "You're on Graham's own screen because he let you in. It shows as Administrator because he is one. It's still his session." |
| T9b | (same task) | "Now ask me to have Graham end it." | "Gone. A shared screen lasts only as long as its owner allows." |
| T10 | `token_expired` | "Try the backup PC token again." (offered once three minutes have passed since the box went in) | "Refused. Tokens run out, and that one has." |
| T11 | `needs_console` | "Sign in at the backup PC remotely if you still can, then plug the keystroke device into its socket." | "That device needs someone signed in at this keyboard. A remote session doesn't count." (on `network_device_refused` with `reason: "needs_console"`, `systems/network-links.js:500`) |
| T12 | `unplug` | "To finish, unplug from the Terminal. Try a short form of the word first." | "A short form won't end the trip. You have to type the whole word. And unplugging ended every session through the box." |

Order note: T3 comes before the long Terminal beats so the token is used while it is live (it starts when the box first goes in); T10 comes after about eight minutes, so the expiry is seen without a wait. T11 needs a live remote session at `backup_pc`; if the token has expired, Ama's pointer offers Zainab's account through the technique session (T7's user session is on the file server, not the backup PC), so the builder gives `backup_pc` a second remote route (Zainab's `credentials` saved connection from her tool roll, or a password on a note) and records which in BUILD_REPORT. The ticks for T4, T5, T8 and T12's short-form refusal have no client event of their own: T4 ticks on `network_service_checked` (bare, payload read), T5 and T8 tick in Ama's ink ("I looked at the console", "My log's still there"), T12 on `network_foothold_dropped`.

### 2.5 `demo_ops_passwords` (about 30 minutes)

Levers: "Send them for coffee." (Delphine away; her screen locks), "Could you ask Delphine about her weekend?" (a post), "Send them to lunch." (once; Graham and Julian away), "Switch Jun's PC off." and back on, "Could you ask Jun what he's been up to?" (a post), "Call it a day." (now after the afternoon).

**Fixes:** aim order becomes morning 0, midday 1, afternoon 2, evening 3; "Call it a day" refuses until the afternoon is done (2.1 rule 4); `desk_usb_port` gains `portOf: "delphine_pc"` and a plant action copied from `test_ops_privilege`'s `bay_usb_port`, with `usb_install_overridden` already in `signin_log.events`.

| # | Task (aim) | Pointer | What you just saw |
|---|---|---|---|
| P2 | `earn_facts` (morning) | as now | (existing `tell_facts`) |
| P1 | `get_records` (midday) | as now | "Three stored records, scrambled. None shows a password. Cracking is guessing, checked against them." |
| P3 | `crack_guessable` | as now | "Her dog's name and the year it came home. Two facts she shared without a thought were enough." |
| P4 | `crack_reused` | "Take the printer note. Then crack Graham's record from the file in your inventory. It's salted, so wait for it." | "The cracker finished by itself when the wait ran out, and said what it found. Graham's password was the printer account's too." |
| P5 | `crack_strong` | as now | "Long and random. The cracker gives up on it, and says so." |
| P6 | `user_signin` | as now | "Her tile said Cracked and filled the password in for you. A cracked password works like any you hold. And no Administrator on the taskbar." |
| P6b | `usb_refused` | as now | "The desk policy refused the stick. That's a rule doing its job." (existing recap line, now said on the tick) |
| P7 | `admin_signin` | as now | "Graham is an administrator, so this session is one. Look at the taskbar." |
| P7b | `profile_read` | as now | (existing `tell_profile`) |
| P8 | `override` | as now | existing bark ("His PC blocks devices, but an administrator's session let it through...") |
| P8b | `stick_override` (new, end of midday) | "Send them for coffee, then sign in at Delphine's PC as Graham and try the stick in her port again." | "Same stick, same port. Signed in as an administrator, the policy let it through, and the log keeps an override row." |
| P10 | `collect_partner` (afternoon) | as now | (existing `tell_collect_partner`) |
| P11a | `collect_hot_desk` | "Sign in at the hot desk as Graham and collect what it remembers. Then sign out." | "One record, Niamh's. The toast has a Crack button when it names one record. Try it." |
| P11b | `see_borrow` | "Now switch Jun's PC off and watch where he goes." | "His PC was down, so he borrowed the hot desk. That's a workaround, and it leaves something behind." |
| P11c | (new task `collect_after_borrow`, end of afternoon) | "Collect at the hot desk again." | "Now it remembers Jun as well. He signed in there, so it cached him." |
| P12 | `crack_cached` | as now | "A weak password falls whatever PC it came from." |
| P13 | `local_account` | as now | existing |
| P14 | `local_refused` | as now | "Refused, with no lockout counted. Read the line above the tiles. It names the domain, and a local account isn't in it." |
| P9 | `read_log` (evening) | as now | existing (Graham) |

Ordering change in P11: today the collect at the hot desk comes after the borrow (`ink/ama_owusu.ink:185-190`); the tour collects before and after, so the borrow's effect is seen and both toasts name one record (Crack button). Probe first: whether Jun borrows the hot desk while the player still holds a session there (the pointer says to sign out first; record the answer in BUILD_REPORT). `crack_cached` may tick on Niamh's crack from the toast; that is fine. Device-in-use and the service account refused stay free play with one Ama aside ("Try the printer account anywhere. No PC lets it in.").

### 2.6 `demo_ops_second_step` (about 35 minutes; about 40 with U3b)

Levers: "Could I have Lorna's sign-in?", "Send them for coffee." (repeatable), "Switch the printer off." (Darren's temper, Yusuf's overheard login), "Send them to lunch." (once), "Switch the records index off." (Fatima props the door), "Call it a day." (already gated).

**Fixes:** Darren's `frustration.perFail` tuned so the temper note comes at about 60 seconds from the switch-off (today 90 to 180 s, `PLAYTEST.md:176`); Darren's `lockIfAwayOverSeconds` lowered from 90 to about 50 so his lunch lock comes sooner while his coffee trips (15 to 35 s) still leave the screen open (measure both; keep a gap of at least 10 s either side); a bark on `global_variable_changed:darren_pc_screen_locked` (the global is written by `systems/pc-sessions.js:914`) while `act_midday` and not `pestered_done`: "Darren's screen has locked. Now try his PC."

| # | Task (aim) | Pointer | What you just saw |
|---|---|---|---|
| M0 | none | "Try Lorna's PC while she's at it." | (on the refusal, ink or bark) "Nobody signs in at a PC while its owner is sitting there." |
| M1 | `see_note` (morning) | as now | "A password under a keyboard. The second step is what stands between that note and her desktop." |
| M8 | `open_screen` | as now | "His screen was open, so no password and no second step. The step guards the sign-in, not an open screen." |
| M4 | `step_holds` | as now | "Right password, and still no way in. The request went to Lorna's phone, and she didn't answer." |
| M2 | `see_temper_note` | as now | "Frustrated people write things down. Read it on his sign-in screen when he's away." |
| M3 | `overhear` | as now | "He said his login out loud to help a colleague. Now you have it too." |
| M6 | `fob` (midday) | as now | "The fob's six digits change every minute. Whoever holds the fob holds the second step." |
| M7 | `number_match` | as now | "The number on screen had to match the phone. A wrong pick cancels. Holding his phone, you could match it." |
| M5 | `pestered` | as now | existing bark "He approved just to make it stop." |
| M9 | `exempt` | as now | "This account has no second step at all. One gap like that undoes the rest." |
| M11 | `reset_password` (afternoon) | as now (in person) | "Two facts anyone could read were enough for a new password. His old one is dead, and the new one fills his tile." |
| M12 | `reenrol` | "This time use the IT request form on Darren's desktop, while his screen is open." | "The form on a desktop goes to the same desk. Yusuf's approvals come to your phone now, and his own phone shows nothing." |
| M13 | `desk_refuses` | as now | "Three wrong tries and the desk stopped listening. It never said whether the name was real." |
| M13b | `desk_call` (U3b only, end of afternoon) | "Ring the IT line from a phone you're holding." | "The same form, from a phone call. The desk that calls back only trusts the owner's phone, and you were holding it." |
| M15 | `propped` (late) | as now | "Nobody approved anything. Fatima propped the door, and the step never came into it." |
| M14 | `door_step` | as now | "The door's second step went to Gwen's phone. With her phone in your hand, you approved it yourself." |
| M16 | `safe_step` | as now | "The safe asked for the fob's code after the PIN. Same fob, same six digits, on a lock this time." |
| M17 | `case_step` | as now | "You carried the case off and kept asking. Darren approved in the end, wherever the case was." |
| M10 | `read_log` (evening) | as now (Thandiwe) | existing |

### 2.7 Start here (for the owner)

**Today, with no decision needed (no voices).** From the main BreakEscape checkout, on the keyless server (never :3000):

```bash
cd /home/deploy/BreakEscape
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh            # port 3001, no Gemini key
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner \
  tools/playtest/swap-scenario-game.rb test_access_signin demo_ops_recon      # prints GAME_ID=<n>
# open http://127.0.0.1:3001/break_escape/games/<n>
```

Repeat with `demo_ops_passwords`, `demo_ops_second_step` (and `demo_ops_terminal` once built). The swap makes one ordinary game row for the demo player and checks that the Mission count is unchanged (`swap-scenario-game.rb:13-14`); every playtest uses it. Follow Ama's "What's next?" and the objectives panel.

**Why a swapped game plays no voice, even after the audio is committed.** The voice endpoint takes the cache folder and the current voices from the game's Mission (`games_controller.rb:761`, `:779-780`), and a swapped game belongs to its host mission (`test_access_signin`). So its lines are looked for in `tts_cache/test_access_signin/` and never found; on a server with a key it would pay to generate them into that folder. Swapped games therefore stay on keyless servers.

**To hear the voices: each showcase needs its own Mission row** (owner's yes: it writes rows in the shared dev database). Least risky: a small runner, `tools/playtest/ensure-mission-rows.rb` (unit U6), that creates or updates exactly the named rows from each folder's `mission.json`, the way `db/seeds.rb:58-75` does for one folder, prints what it would do unless given `--apply`, deletes nothing, and aborts if any other Mission row changed. The showcases then list under "test_scenarios" on the missions page (`/break_escape/`, the engine's root, `config/routes.rb:96`) of Hacktivity on :3000 and of the standalone server, and a game started there plays the committed clips. The other way, Hacktivity's admin action "Read BreakEscape missions" (`admin_actions_controller.rb:114`), loads the whole `db/seeds.rb`: it republishes every mission and offers to delete rows for missing folders, so it is the heavier choice.

## 3. Audio

### 3.1 Standing rules applied (tts-audio skill, AGENTS.md)

- **Audio last** (rule 1): no clip is generated until each showcase's dialogue is signed off after the `npc-dialog-review` run with its 2l concision check. Draft playtests run on keyless servers (rule 9).
- **No printed variables** (rule 2): no `{var}` in any voiced ink line, bark or chatter line; inline conditionals choosing between fixed strings are fine. `test/unit/break_escape/tts_mission_lines_test.rb` checks this only for `m01` to `m10` and `lab_physical_pentest` (its `MISSIONS` pattern, line 18), so unit U5 adds `demo_ops_*` to its `MISSIONS` and `BARK_MISSIONS` patterns.
- **No stage directions** (rule 7): spoken words only; a performance note goes in a `#delivery:` tag, never inside an inline conditional. `dialoguelint` must report no `inline-direction`, `delivery-unread` or `delivery-note`.
- **Word caps**: 30 words face to face (all showcase lines are face to face; none is a call except U3b's, cap 25). No line over the cap is exempted, because none has audio yet.
- **Chatter**: each showcase sets `"ttsPregenerateChatter": true` so its NPC and shared chatter pools are in the batch (shared pools give one clip per voice that can say a line, so pools stay small). Engine built-in topics are never voiced.
- **Narrator**: no showcase has `Narrator:` lines; none needs a narrator voice.
- **Cost** (rule 8): see 3.4; the owner approves the spend before generation.

### 3.2 Who speaks, and with which voice

One voice per character across the whole Merrin & Sallow series (`demo_access_tour`, already voiced, and the four showcases), so a character sounds the same in every showcase. A style may change its role words where a showcase gives the person a different job, but keeps the voice name, age and accent. The office-life showcase's voices are kept for the staff reused from it (Ama, Chidi, Jun, Graham, Agnieszka, Zainab), with the firm names in their styles corrected: recon copied them verbatim, so three styles still name other firms ("Tarrowby's", "Brightwell's"). Nothing is generated yet, so every change below is free.

| NPC | Voice | Style (role words; accent kept as it is now) | Showcases | Change from today |
|---|---|---|---|---|
| ama_owusu | Autonoe | the office-life wording, word for word: "Security lead on Merrin & Sallow's outsourced IT provider (Fenlow Managed IT), in her 40s, warm and practical. ... London and southern English accent ..." | all four | passwords uses a longer variant (230 characters): replace with the shared wording |
| graham_whitfield | Umbriel | "Merrin & Sallow's in-house IT administrator, in his early 60s, unhurried and kind ..." West Yorkshire, Halifax | recon, passwords, terminal | recon says "IT coordinator": use the passwords wording in both |
| jun_watanabe | Puck | "Merrin & Sallow's junior office assistant, in his early 20s ..." southern English | recon, passwords | recon says "Tarrowby's HR assistant": use the passwords wording |
| chidi_okeke | Zubenelgenubi | "Merrin & Sallow's office manager, in his 40s, easy-going ..." West Yorkshire with a light Nigerian inflection | recon, terminal | recon says "Tarrowby's fleet coordinator at the Shipley depot" |
| agnieszka_duda | Callirrhoe | "Merrin & Sallow's part-time bookkeeper, in her 30s, calm and matter-of-fact ..." lightly Polish-accented | recon | recon says "Brightwell's part-time payroll officer" |
| zainab_hussain | Achernar | recon's wording (Fenlow's field engineer) | recon, terminal | none |
| delphine_arvanitis | Despina | `demo_access_tour`'s block, word for word | passwords | small wording drift from the tour |
| julian_sallow | Rasalgethi | `demo_access_tour`'s block, word for word | passwords | small wording drift from the tour |
| niamh_doherty | Kore | "Merrin & Sallow's accounts assistant, in her 30s, dry and friendly ..." Dublin Irish; in second step the role words add "covering reception today" | passwords, second step | second step voices her as Despina, a southern English "reception temp in her early 20s", and Despina is Delphine's voice: move her to Kore and the Dublin accent, and change her second-step ink so she is covering reception (a line or two, in U3) |
| anjali_rao | Aoede | her current wording (finance officer, educated Indian English) | second step | today Kore, which Niamh now takes |
| lorna_easton | Erinome | `demo_access_tour`'s block, word for word (reception and facilities lead, Lancashire) | second step | today Sulafat, London, "in her 50s": the tour voiced her first |
| thandiwe_moyo | Pulcherrima | the tour's voice and accent (southern English with a light Zimbabwean inflection), role words "IT support at Merrin & Sallow" | second step | today Leda, London |
| darren_price | Orus | as now | second step | none |
| yusuf_demir | Iapetus | as now | second step | none |
| gwen_pritchard | Vindemiatrix | as now | second step | none |
| fatima_begum | Zephyr | as now | second step | none |
| printer_svc | none | not voiced (one line of colour) | passwords | none |

No two speakers in one showcase share a voice name after these changes. Ama is not the campaign handler, so the HaX style rule (3) does not apply. The office-life showcase's own clips are not reused: they are in `tts_cache/office_life_showcase/`, the endpoint reads only the game's own folder (`tts_service.rb:275-281`), and the firm-name fixes change the keys anyway.

### 3.3 What gets voiced

Every line a player can hear, as `TtsLineExtractor` lists it: each NPC's ink (hub, pointers, report-back knots, recaps, short version, exchange knots), event barks (`eventMappings[].bark`, timed messages), NPC chatter pools and the scenario's shared chatter pools, and the U3b call knot if built. Feed posts, notes, boards, toasts, object observations and objective titles are text and are never voiced. Each scenario's `planning/VOICED_LINES.md` is rewritten from the extractor's own list after dialogue sign-off (not by hand), so it matches what the batch will generate.

### 3.4 Estimate

| Showcase | Lines today (`VOICED_LINES.md` totals) | Tour lines added (about) | Lines to voice (about) |
|---|---|---|---|
| `demo_ops_recon` | 143 | 25 | 170 |
| `demo_ops_terminal` | 0 | 60 | 60 |
| `demo_ops_passwords` | 161 | 30 | 190 |
| `demo_ops_second_step` | 139 (96 plus the S8b and S8c appends) | 30 (45 with U3b) | 170 to 185 |
| Shared chatter, one clip per voice that may say it | | | 100 to 200 |

About 700 to 800 clips. At about 3.5 seconds a clip that is 40 to 50 minutes of audio, roughly **$0.60 to $0.70** at the current rate ($9 per million audio tokens, about $0.80 an hour of audio, until 31 December 2026); with retakes and the transcription checks, **under $3 in all**. Generation takes about 10 seconds a line, so about 30 minutes per showcase, the four run side by side. From 1 January 2027 the rate doubles, so generating in December saves about half.

### 3.5 Order of work

1. Tour build units (section 4.1) land the dialogue changes and the voice blocks of 3.2 together.
2. Draft guided playthroughs (Haiku, keyless) and the implementation review find what does not tick or teach; fixes go back to the same builder.
3. Dialogue review per showcase (Opus, `npc-dialog-review` in full, 2l concision always reported), fixer (Sonnet), 2 to 5 rounds; the last round's verdict is the sign-off, recorded in the showcase's `planning/DIALOGUE_REVIEW_R<n>.md` and in the log.
4. The owner approves the spend (5.3) and, for listening in game, the Mission rows (5.2).
5. Generation (the tts-audio skill, "Voice a mission"), per showcase, in the background.
6. Checks (3.6), a listening folder per showcase, then one commit per showcase holding `tts_cache/demo_ops_<x>/` and any voice or ink change that went with it (rule 5), by explicit path.

### 3.6 Checks before each audio commit

- `bin/rails "app:break_escape:tts:office_lines[<scenario>]"`: 0 uncached (V6, barks and chatter included).
- `bin/rails "app:break_escape:tts:wasted[<scenario>]"`: header `0 of M sidecar clips are not requested (E lines expected)` with M equal to E.
- Missing-audio listing: the batch log has no failed line, and `office_lines` lists none uncached.
- `ffprobe`: no clip under about 0.8 s or over 60 s; no `.*.pcm`, `.*.mp3` or `*.tmp` left behind.
- Five transcriptions per showcase (the most style-heavy speakers) match the text, with no style words spoken.
- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<scenario>/`: 0 ERROR, and no `inline-direction` or `delivery-*` finding.
- `tts_mission_lines_test.rb` (with U5's patterns) passes: no voiced line prints a variable.
- A listening folder `tmp/tts_comparison/<scenario>_new/` with readable names, for the owner.
- `git diff --cached --stat` shows only `tts_cache/<scenario>/` and the files that unit changed.

## 4. Build units and the stages after them

Every brief: AGENTS.md "Writing a subagent prompt" applies; plain UK English; no exploit content; never open SecGen XML, the realism catalog file or any field guide; the scanner hardening branch is in main before the unit starts (merge main first); commit by explicit path (`git commit -m "..." -- <paths>`); write a handover note at about 150k tokens (`docs/agents/ops_core_build/HANDOVER_TOUR_<unit>.md`) and stop by 200k; a findings or build-report file is created in the first few calls and appended as the unit goes. Scratch in `/data/tmp/scratch/tour-<unit>/`, deleted with `tools/safe-rm.sh` at the end. Live checks use the unit's own games on a free keyless port (never 3000, 3001, 3002, 3085, 3086).

### 4.1 Tour build units (Sonnet; run side by side, disjoint files)

| Unit | Files (only these) | Work |
|---|---|---|
| **U1 recon** | `scenarios/demo_ops_recon/**`, `test/controllers/break_escape/demo_ops_recon_scenario_test.rb` | 2.3: tasks `remote_signin`, `unplug`; the "what you saw" barks; the R3b, R5, R6c, R8c pointers; the "Call it a day" gate; the board; voice blocks of 3.2 (Chidi, Jun, Agnieszka, Graham); `ttsPregenerateChatter` |
| **U2 passwords** | `scenarios/demo_ops_passwords/**`, `test/controllers/break_escape/demo_ops_passwords_scenario_test.rb` | 2.5: aim order, the gate, `portOf` and the plant action on `desk_usb_port`, task `stick_override` and `collect_after_borrow`, the before-and-after collect (probe first: the borrow with a player session at the hot desk), the barks and pointers; voice blocks (Ama, Delphine, Julian); `ttsPregenerateChatter`; update `planning/CRACKER_RUNBOOK.md` for the tray and toast entry points |
| **U3 second step** | `scenarios/demo_ops_second_step/**`, `test/controllers/break_escape/demo_ops_second_step_scenario_test.rb` | 2.6: the tuning (temper note, Darren's lock seconds, measured live), the screen-lock bark, M12 by the desktop form, the barks and pointers, Niamh covering reception; voice blocks (Niamh, Anjali, Lorna, Thandiwe); `ttsPregenerateChatter` |
| **U3b helpdesk call** (only on the owner's yes, 5.4; after U3, same files) | as U3 | a second desk with `verify: "callback"` on a second room NPC, a pretext call contact whose ask carries `helpdesk`, copied in shape from `scenarios/test_ops_helpdesk/scenario.json.erb:71-100,165-190`; task `desk_call`. The call's spoken text is pretexting content: it is written by the agent AGENTS.md "Which work goes to opus48" names for social-engineering content, from a short spec, and the Sonnet builder wires it |
| **U4 terminal** (new scenario) | `scenarios/demo_ops_terminal/**` (new), `test/controllers/break_escape/demo_ops_terminal_scenario_test.rb` (new), `docs/REALISM_CATALOG_INDEX.md` (regenerated by `ruby scripts/validate_realism_catalog.rb`, never by hand) | 2.4 in full: scenario, ink for Ama, Zainab, Graham, Chidi, `mission.json` (`collection` "test_scenarios", `test_type` "ops_demo", `display_name` "Ops demo: the Terminal close up", 12 minutes), PLAYTEST, `planning/BUILD_REPORT.md`, `planning/VOICED_LINES.md`. Copy blocks from `demo_ops_recon` (file server, office-life switches, Ama's host pattern), `test_ops_skin` (the three realism links, banner, default Terminal) and `test_ops_privilege` (token, assist invite, keystroke socket). Its Rails test asserts the realism text reaches the browser only for findings the player has checked (as `network_realism_link_test.rb`), the token's expiry, the relay's end, `needs_console`, and runs the leak scanner over a whole run. Starts only on the owner's yes (5.1) |
| **U5 shared test pattern** | `test/unit/break_escape/tts_mission_lines_test.rb` | add `demo_ops_[a-z_]+` to `MISSIONS` and `BARK_MISSIONS`; run it; expected to pass once U1 to U4 are clean (run after them) |
| **U6 mission rows tool** (only on the owner's yes, 5.2) | `tools/playtest/ensure-mission-rows.rb` (new), `test/unit/break_escape/ensure_mission_rows_test.rb` (new) | 2.7: dry run by default, `--apply` creates or updates only the named rows from their `mission.json`, deletes nothing, aborts if any other row changed; the test runs against the test database only. The orchestrator runs it once, with `--apply`, for the four names, after the owner's yes |

The orchestrator owns the doc touches after the units land: a pointer from `SHOWCASE_PLAN.md` to this plan, and the "Shown in" lines in `docs/ACCESS_AND_NETWORKS.md` for N16, A15, A18, A19, A21, A23 (one commit).

**Done, for each of U1 to U4** (and U3b): ink compiles (`scripts/compile-ink.sh <scenario>`); `ruby scripts/validate_scenario.rb scenarios/<scenario>/scenario.json.erb` gives 0 errors, every warning listed with its reason in `planning/BUILD_REPORT.md`; `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<scenario>/` gives 0 ERROR; `node scripts/ink_runtime_check/tagdiff.mjs` against the last commit, every changed tag, knot, divert or condition explained in the report; `tools/check_mapping_index_drift.rb main` gives 0 failures; the scenario's Rails test passes with every new task and tick asserted and its whole-run leak scan reports 0 findings; `bin/ops-golden-compare` passes; the dungeon graph is regenerated (the validator run without `--no-graph`); `PLAYTEST.md` is rewritten around the whole guided path (one run per aim, each beat with its pointer, the action, the "what you just saw" line expected and the tick, then Free play and Not in the tour) and keeps its harness notes; `planning/VOICED_LINES.md` lists every new and changed spoken line (old and new); a short live check in the unit's own keyless game of each new tick and bark, with the measured seconds of every tuned routine.

### 4.2 Draft guided playthroughs and implementation review (after 4.1, side by side)

- **Implementation review, one per showcase** (Opus, read-only, launch description containing "review"): every task ticks from its beat and nothing earlier; every pointer leads to the next undone beat; the gate holds; the teaching lines are true to the code (cite file:line); no line names a secret. Findings blocker, major or minor; back to the same builder; 2 to 5 rounds (later rounds as Sonnet deltas, AGENTS "Cheaper later rounds").
- **Haiku guided playthrough, one per showcase, on a keyless server**, following only the new PLAYTEST's guided path: per beat, whether the pointer was enough, whether the tick and the line came, and the seconds waited. A Sonnet run checks any "stuck" before it counts. `verify-run.rb` must show progress. **The cracker beats** (passwords P1 to P5, P11a, P11c, P12, P13) go to the `opus48` agent from `planning/CRACKER_RUNBOOK.md` as updated by U2, as the existing passwords PLAYTEST arranges (`PLAYTEST.md:3`).

### 4.3 Dialogue review and sign-off (per showcase)

Opus reviewer, `npc-dialog-review` in full against the demo aim (plain, true teaching in a lively office; not the spy campaign), 2l concision always reported, cross-showcase repeats checked (a fact told in recon need not be told again in the Terminal showcase beyond a nod). Sonnet fixer on the same builder's files. 2 to 5 rounds; stop once a round finds no blocker or major. Snapshot the ink before the first fix so `tagdiff --old` proves the structure is unchanged. The final round's verdict is the sign-off; then `planning/VOICED_LINES.md` is regenerated from the extractor.

### 4.4 Voice units (the tts-audio skill's procedure)

- **V1 prep and start** (Sonnet, one agent for all four): re-run the 3.6 static checks (dialoguelint, the variables test, word caps), confirm each showcase's voice blocks against 3.2, then start the four `batch_generate` runs in the background with logs in `tmp/tts-<scenario>.log`, write a handover and stop (AGENTS: an agent does not wait on long jobs).
- **V2 check and commit, one per showcase** (Haiku for the listings, ffprobe and the listening folder; Sonnet for the transcriptions and any judgement): the 3.6 checks, a top-up rerun for any gap, one commit per showcase of `tts_cache/<scenario>/` with the files the voice change touched, by explicit path. A 429 that looks like a daily limit stops the run and is reported, not retried in a loop.

### 4.5 Final guided playthroughs with audio (Haiku)

After the Mission rows exist (5.2), one Haiku run per showcase in a game started from its Mission (not a swap), on a keyless server: the committed clips are served without a key (`games_controller.rb:791-799`). Per beat it records whether a clip played (`/tts` 200 versus 404 or 403 in the capture), so any missing or refused line is listed. Cracker beats again on `opus48` from the runbook. Each run ends with `verify-run.rb` and the leak check.

### 4.6 Train

One train for the whole tour (U1 to U6 and the four audio commits): `tools/playtest/train-check.sh <worktree> <outdir> <port>`, GREEN required (Rails, rubocop, the opened-state scan, `bin/test-js` with `MERGE_BATCH=1`, train smoke, every scenario's validator, dialoguelint 0 ERROR). Check `git ls-tree -r --name-only HEAD tts_cache | wc -l` before and after the merge so no clip is lost. Then merge to main, push, bump the gem (the `bump-version` skill) so Hacktivity picks the showcases and clips up, and run `tools/wt-clean.sh` and `tools/disk-clean.sh`.

## 5. For the owner

Only these need your answer; everything else in this plan is decided and logged, and you can overrule any of it.

1. **A fourth showcase for the Terminal's realism text** (`demo_ops_terminal`, about 12 minutes, about 60 more voiced lines), which also shows the shared screen, the expiring token and the keyboard-only device. Linking the three FileHold catalog entries from a non-test scenario freezes their advisories and output for good; they are invented training fixtures and already the reference text for `test_ops_skin`, so nothing a player sees changes. **Recommended: yes, and accept the freeze.** If no: the tour points to `test_ops_skin` for the text (no guide, no audio) and the three session features stay test-only.
2. **Mission rows so the voices play in game.** A swapped game can never play the committed audio (2.7). **Recommended: yes to U6's targeted tool, run once for the four showcases** (writes four rows in the shared dev database, deletes nothing). The heavier alternative is Hacktivity's "Read BreakEscape missions", which republishes everything. Without either, the audio is checked by the listings and the listening folders only, and you hear it outside the game.
3. **The voice spend**, under $3 for all four showcases at today's rate (3.4), after the dialogue sign-off and in December, before the rate doubles. **Recommended: yes.**
4. **The helpdesk's third way in: a phone call, and the "call back the owner's phone" rule** (U3b, about 5 more minutes of play and 15 lines). It is the only showing of the `callback` rule and the call route; its call text is pretexting content and is written on the model AGENTS.md names for that. **Recommended: yes**, as the last unit, so it never holds up the rest.

Assumptions you may want to challenge: one voice per character across the Merrin & Sallow showcases (Niamh, Lorna, Thandiwe and Anjali change voice; 3.2); the order recon, Terminal, passwords, second step; the old code device's "No longer in use" and the other items in 1.6 stay out of the tour.
