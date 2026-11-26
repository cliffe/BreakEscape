# Showcase tour plan: review R1

Reviewer: design review round 1 (read-only except this file). Plan: `SHOWCASE_TOUR_PLAN.md` at `a311f439a` (branch `ops-showcase-tour`, from main `537dbd52c`). Every claim below was checked against the code and scenarios in `/data/be-ops-follow`. No SecGen XML, realism catalog file or field guide was opened.

**Verdict: not clean.** No blockers, 6 majors, 8 minors. The coverage audit is careful and nearly all its citations hold. The audio section follows the tts-audio rules. The build units are disjoint, and "Start here" is safe. What needs fixing: two tick events name the wrong client event, the order of beats in the tours disagrees with the objectives panel in three showcases, one Terminal pointer gives a false source for the token, the reordered collect beats have no tick, and the Mission-rows answer the owner is asked for assumes one database where there are two.

## What was verified and holds

- Swapped games play no voice: the endpoint keys on `@game.mission&.name` (`games_controller.rb:761`, `:779-780`), and committed clips are served before any key check (`:791-799`). `swap-scenario-game.rb` checks the Mission count before and after (lines 13-14, 37).
- `tts_mission_lines_test.rb:18` and `:22` patterns are as stated, and the test enumerates scenario folders, not Mission rows (`:30-37`), so U5's pattern change is enough to include the showcases.
- Voice table 3.2: every "today" value matches the scenario files (recon `scenario.json.erb:478-837`, passwords `:598-1087`, second step `:354-1054`, office life `:247-392`, access tour `:531-900`). Niamh is on Despina in second step (`:435`), which is Delphine's voice. After the plan's changes, no showcase has two speakers on one voice.
- Passwords: the evening aim has `order: 2` and the afternoon aim `order: 3` (`scenario.json.erb:336`, `:346`). "Call it a day" is offered on `act_midday` (`ink/ama_owusu.ink:95`), and every afternoon lever is closed by `act_evening` (`:89`, `:111-115`). The gate fix is needed and correct. `desk_usb_port` has no `portOf` (`:424`). The ruling A override is as described (`docs/ACCESS_AND_NETWORKS.md:721`), and Graham is admitted at `delphine_pc` by `roles: ["it"]` (`:381`).
- Second step: the "Skip them" gate exists (`ink/ama_owusu.ink:253`). Darren's `lockIfAwayOverSeconds: 90` (`:777`) and `perFail` (`:782`) are where the plan says. The desktop form `darren_form` sits on Darren's PC (`:473`). The desk is `verify: "questions"` only (`:111-120`).
- Realism rules: link all findings or none, each entry linked once, banner on all finding holders or none (`scripts/validate_realism_skin.rb:485-511`); the freeze for a non-`test_` folder (`scripts/validate_realism_catalog.rb:360`). There are three FileHold entries in the index, each with a module.
- S6-5: the whole verb is needed to end a trip (`terminal-grammar.js:262-263`). S6-2: a skin switch loses nothing (`terminal-format.js:10`, `:92-110`), so the T8 and R6c lines are true.
- R7's "red frame" is real: a technique session's desktop has a red rim (`ui-themes.css:1578-1586`). Its PC sprite is tinted with a bolt (`compromise-marks.js:1-15`).
- `needs_console`: `network_access.rb:515` and `IMPLANT_NEEDS_CONSOLE` (`:437`) say "Nobody is signed in at this keyboard." The client emits it at `network-links.js:500`.
- Audio rules (tts-audio SKILL): the plan generates audio last, after the 2l concision review (3.1, 3.5, 4.3), and drafts run on a keyless server. It bans printed variables and adds U5's patterns. It bans stage directions and keeps the `#delivery:` tag out of inline conditionals. Voices stay the same across the series. There are no Narrator lines (checked: no `Narrator:` in any `demo_ops_*` ink). It asks the owner to approve the cost first, and commits voice and clips together. The current showcase ink prints no `{var}` and has no `*direction*`. The draft lines are all under the 30-word cap.
- Build units: U1 to U4 own disjoint folders and tests. U3b runs after U3. U5 is a single file run last. U6 is new files. Only U4 regenerates `docs/REALISM_CATALOG_INDEX.md`, and the orchestrator owns the shared docs. No overlap.
- Start here: it only starts the keyless server (refuses :3000) and swaps games (one game row, Mission count checked). Mission rows (U6) and "Read BreakEscape missions" both wait for the owner's yes. No seeding, no schema task, no db task.

## Findings

### Major

**M1. The unplug ticks name the wrong event (R8c `unplug`, T12 `unplug`).** Section 2.3 and section 2.4 tick both on `network_foothold_dropped` (`network-links.js:312`). That event comes from `_dropFoothold`, which runs when the server no longer holds a foothold (404, or a foothold missing from `GET /network`; doc comment `:33`). A player's unplug runs `unplug()`, which deletes the foothold directly and emits `network_device_unplugged` with `endedPcIds` and `tokenExpiredPcIds` (`:570-609`). As written, neither task would tick. Fix: tick on `network_device_unplugged`. Its `endedPcIds` also proves the "ended every session" line. Check in a probe that the Terminal `unplug` verb goes through the same `unplug()`.

**M2. The tour order disagrees with the objectives panel in all three existing showcases, against rule 2.1.2 ("Order shown three ways, the same").** The plan's own append rule puts new tasks at the end of their aim:
- Recon: `remote_signin` (R5c) would be appended after `terminal_view` (`scenario.json.erb:240-242`), but the tour plays it before R6.
- Passwords: the panel lists `see_borrow` (`:349`) before `collect_hot_desk` (`:350`), while the tour plays P11a (the collect) first. `collect_after_borrow` would be appended after `local_refused` (`:353`), but the tour plays it before P12 to P14.
- Second step: the panel and today's `whats_next` (`ink/ama_owusu.ink:78` on) both run see_note, see_temper_note, overhear, step_holds, open_screen (`scenario.json.erb:199-203`). The tour plays M1, M8, M4, M2, M3, with no reason given. The late aim lists `door_step` before `propped` (`:248-249`), but the tour plays M15 before M14.

Fix: either follow the panel order in each table (simplest for second step), or state that tasks inside an aim are reordered. Reordering is safe: tasks are keyed by `taskId`, and the drift check reads `eventMappings`, not tasks (see m3). Then make "What's next?" and the board match. The owner is told to follow "Ama's pointers and the objectives panel", so the two must not disagree.

**M3. The T3 pointer gives a false source for the token.** The pointer reads "Zainab left a sign-in token for the backup PC in her tool roll". But a `token` credential's proof must be a foothold (the validator errors on a non-foothold proof, `docs/ACCESS_AND_NETWORKS.md:659`). The token is earned when the box goes in, which is what 2.4's own "Ops fields" says (`adel_token`'s shape: `proof: { foothold: ... }`, `test_ops_privilege/scenario.json.erb:59-65`). A player sent to the tool roll finds nothing there. Fix: the pointer should say the token arrived in the keyring when the box went in (Zainab left it for the backup PC on this network), and the T1 or T3 line can name the keyring.

**M4. T11 depends on a needless second remote route. Play it while the token is live.** A token session is a foothold-route session, so the keystroke device answers `needs_console` while it is live (`network_access.rb:513-516`). Once it lapses, the client drops the session at expiry (`pc-sessions.js:451`, `pc_signed_out` reason `token_expired`), and an expired session answers the quiet `not_ready`, not `needs_console` (`:513-514`, "a locked or expired one keeps the quiet not_ready"). Placing T11 after T10 forces the extra saved connection or note password that 2.4's order note asks the builder to invent. Fix: play T11 straight after T3 (token live, about 1 minute in), and drop the second route. Also add to T10 that the token session itself ended when the clock ran out (the toast at `pc-sessions.js:141-145`), which is the more visible half of the lesson. Name T10's tick: `pc_signin_failed` with the `expired` reason (`:167`) or the `token_expired` sign-out.

**M5. The P11 collect beats have no tick, and the reorder breaks today's gate.** A collect emits no client event: `cached-accounts-panel.js:159-193` posts `harvest_credentials` and updates the panel only. Today `collect_hot_desk` ticks in Ama's ink on a self-report that is offered only when `see_borrow_done and hot_desk_signin_done` (`ink/ama_owusu.ink:105`). Under the tour, P11a comes before the borrow, so that choice is never offered and the task cannot tick. The new `collect_after_borrow` has no tick named at all. Fix: name the tick for P11a and P11c (ink self-report choices with the gates rewritten, or a new client event, which is engine work outside U2's files). Also put the P11a and P11c "what you saw" lines in the report-back knots, not in barks.

**M6. The Mission-rows decision assumes one database where there are two.** 2.7 and 5.2 say one run of `ensure-mission-rows.rb` makes the showcases list "of Hacktivity on :3000 and of the standalone server". The standalone server uses `break_escape_development` (`test/dummy/config/database.yml:20-22`), and Hacktivity uses `hacktivity_db` (`/home/deploy/Hacktivity/config/database.yml:15`). A runner started with `BREAK_ESCAPE_STANDALONE=true` writes only the first. Fix: say which database U6 writes, and that 4.5's keyless runs need only the standalone one. If the owner also wants the showcases on Hacktivity :3000, that is a separate yes for a second run against the shared Hacktivity database. Note too that :3000 has a key, so any line not yet cached there is generated live and paid for.

### Minor

**m1. Wrong citation for the screen-lock global.** `pc-sessions.js:914` reads `darren_pc_screen_locked`; it is written at `systems/workstation-state.js:291`. The bark works either way, but `workstation_auto_locked:darren_pc` is the more direct event (it is the one `pc-sessions.js:906-913` describes).

**m2. The R7a and R7b barks cannot be told apart by "the payload's grant".** `network_technique_used` carries `{ findingId, techniqueId, grant }` (`network-view-minigame.js:1074`), and `grant` is `'session'` for both the user and the admin session (`network_ops.rb:611`, `:629`). The access level is not in the payload. Give the builder a discriminator that does not use a suffixed finding id: the first versus the second session grant (a global counter set by the first mapping), or `pc_signed_in` with its `npcId`.

**m3. The append rule is misattributed.** 2.1.2 says new tasks go last "so `tools/check_mapping_index_drift.rb` stays quiet". That check reads only `eventMappings` (its header, lines 3-8). The rule that matters here is that every new bark is appended at the end of its NPC's `eventMappings`. Say that, since the tour adds many barks to Ama in every showcase.

**m4. S6-5 is assigned to recon in 1.1 but shown only in the Terminal showcase.** Row "Whole verbs to end a trip" says "tour R8c: a short form refused". Recon's R8c (2.3) is a physical unplug at the hot desk port, and the short-form beat is T12. Fix the row to point at `demo_ops_terminal` T12.

**m5. The voice table's header contradicts four of its rows.** The header says "accent kept as it is now", but Delphine loses the "light Mediterranean lilt" (passwords `:632` against tour `:611`). Lorna goes from London to Lancashire, Thandiwe from London to a Zimbabwean inflection, and Niamh from southern English to Dublin. The changes are right (one voice per character across the series). Reword the header so the owner's "assumptions to challenge" list is accurate.

**m6. T9's pointer names the wrong screen.** "Ask Graham to show you the server's admin page. He'll share his screen." The relay opens `graham_pc`, not the server. Use "Ask Graham to share his screen", and let the line say what it shows.

**m7. Features shown nowhere and not in 1.6.** List these under "Not in the tour" with their test scenario, or give each a one-line aside:
- A22: a saved connection still asks for the second step, while tokens, invites and claims skip it (`ACCESS_AND_NETWORKS.md:58`).
- A20: a shared local administrator opens every PC it is on. P13 shows it on one PC only.
- A21: a `common` record and its unsalted pair crack together (`test_ops_crack`).

**m8. Two gates are left unspecified.** Rule 2.1.4's "Not yet" list should name, per showcase, which beats it waits for. In recon, R7 and R8 run after "Call it a day", so the gate must wait only for the beats before the evening. T10's "offered once three minutes have passed" needs a named mechanism (a `timedMessages` entry or a global set from the expiry event), because ink has no clock.

## For round 2

Fix M1 to M6 in the plan text; the minors can go in the same pass. Round 2 can be a delta check of sections 1.1, 2.1, 2.3 to 2.7 and 5.2 against the file:line points above.
